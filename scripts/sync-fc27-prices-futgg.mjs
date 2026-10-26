#!/usr/bin/env node
// Refreshes data/fc27-prices.json from FUT.GG's public CDN price blobs — the same static JSON
// the fut.gg site itself downloads for its market pages. The blobs pair delta-encoded card
// version ids (id0 + cumulative deltas) with a parallel coin-price table; PS5 and PC blobs are
// published for base card versions. Xbox and promoted versions are not in this feed and stay
// unverified.
//
// FUT.GG does not always use the EA player id as the card version id: some FC27 cards have a
// distinct version id (e.g. Enzo Fernández is player 247090 but card 50578738). The feed is
// normalised here to the EA player id (cardId) with the real version id kept alongside
// (versionId), so consumers can match a price to a player without guessing.

import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { get } from './lib/futgg.cjs';

const root = path.join(import.meta.dirname, '..');
const dest = path.join(root, 'data/fc27-prices.json');
const rosterPath = path.join(root, 'data/fc27-players.json');
const staleAfterMinutes = Math.max(60, Number(process.env.FC27_PRICE_STALE_MINUTES || 720));
const annotate = (level, message) => console.log(process.env.GITHUB_ACTIONS ? `::${level}::${message}` : `${level}: ${message}`);
const windowMinutes = Math.max(60, Number(process.env.FC27_PRICE_WINDOW_MINUTES || 720));
const gameYear = '27';
const ssr = name => `https://s3.eu-west-2.amazonaws.com/game-assets.fut.gg/${gameYear}/cdn-data/${name}.json`;
const sitemapIndexUrl = 'https://www.fut.gg/sitemap.xml';
const sitemapPattern = /\/players\/(\d+)-[^/\s)\]]*\/27-(\d+)\//g;

function retainedAge() {
  try {
    const snapshot = JSON.parse(readFileSync(dest, 'utf8'));
    const at = Date.parse(snapshot.updated_at);
    return Number.isFinite(at) ? (Date.now() - at) / 60000 : Infinity;
  } catch {
    return Infinity;
  }
}

function decode(blob) {
  if (!blob || blob.v !== 2 || !Array.isArray(blob.d) || !Array.isArray(blob.p)) throw new Error('Unrecognised price blob schema v=' + blob?.v);
  const id0 = Number(blob.id0);
  const out = new Map();
  let acc = id0;
  for (let i = 0; i < blob.d.length; i++) {
    acc += blob.d[i];
    const coins = blob.p[i + 1];
    if (Number.isInteger(coins) && coins > 0) out.set(acc, coins);
  }
  return out;
}

async function getText(url) {
  try {
    return get(url);
  } catch (directError) {
    // GitHub Actions can reach FUT.GG directly; sandboxed/CI networks that are
    // blocked by the edge cache can still read the same public sitemap through
    // the read-only text mirror. Card metadata is unchanged either way.
    try {
      return get(`https://r.jina.ai/${url}`);
    } catch {
      throw directError;
    }
  }
}

function sitemapPageNumbers(indexText) {
  const pages = new Set([1]);
  for (const match of indexText.matchAll(/sitemap-player-detail-27\.xml(?:\?p=(\d+))?/g)) {
    pages.add(match[1] ? Number(match[1]) : 1);
  }
  return [...pages].sort((a, b) => a - b);
}

// Maps an EA player id to every FC27 card version FUT.GG publishes for that player.
async function buildVersionIndex() {
  const index = await getText(sitemapIndexUrl);
  const pages = sitemapPageNumbers(index);
  const index_ = new Map();
  let emptyPages = 0;
  for (const page of pages) {
    const url = page === 1
      ? 'https://www.fut.gg/sitemap-player-detail-27.xml'
      : `https://www.fut.gg/sitemap-player-detail-27.xml?p=${page}`;
    let text = '';
    try {
      text = await getText(url);
    } catch {
      emptyPages++;
      if (emptyPages >= 3) break;
      continue;
    }
    const matches = [...text.matchAll(sitemapPattern)];
    if (!matches.length) {
      emptyPages++;
      if (emptyPages >= 3) break;
      continue;
    }
    emptyPages = 0;
    for (const [, playerId, versionId] of matches) {
      const versions = index_.get(playerId) || new Set();
      versions.add(versionId);
      index_.set(playerId, versions);
    }
    if (page < pages[pages.length - 1]) await new Promise(resolve => setTimeout(resolve, 250));
  }
  return index_;
}

const checkedAt = new Date().toISOString();
try {
  const roster = new Set(JSON.parse(readFileSync(rosterPath, 'utf8')).players.map(p => Number(p.id)));
  const ps5 = decode(JSON.parse(get(ssr('player-prices-ps5'))));
  const pc = decode(JSON.parse(get(ssr('player-prices-pc'))));

  let versionIndex = new Map();
  let versionMapped = 0;
  try {
    versionIndex = await buildVersionIndex();
    console.log('FUT.GG sitemap resolved', versionIndex.size, 'player ids.');
  } catch (sitemapError) {
    // Without the sitemap only cards whose version id equals the EA player id
    // can be normalised. Never fabricate the missing links.
    console.log('FUT.GG sitemap unavailable; using EA ids only:', String(sitemapError.message || sitemapError).slice(0, 140));
  }

  // A card version can be trusted as the base card only when it is the player's
  // single published FC27 card. Players with multiple versions (promos) whose
  // base id is absent stay without a price instead of borrowing a promo quote.
  const unambiguousVersion = new Map();
  for (const id of roster) {
    const versions = versionIndex.get(String(id));
    if (versions && versions.size === 1) unambiguousVersion.set(id, Number([...versions][0]));
  }

  const prices = [];
  const seen = new Set();
  for (const [name, platform, table] of [['ps5', 'ps', ps5], ['pc', 'pc', pc]]) {
    for (const id of roster) {
      let versionId = id;
      if (!table.has(id)) {
        versionId = unambiguousVersion.get(id);
        if (!versionId || !table.has(versionId)) continue;
        versionMapped++;
      }
      seen.add(id);
      prices.push({
        cardId: String(id),
        versionId: String(versionId),
        platform,
        coins: table.get(versionId),
        status: 'verified',
        sourceUrl: `https://www.fut.gg/players/${id}/27-${versionId}/`,
        checkedAt,
      });
    }
  }
  if (!prices.length) throw new Error('Price blobs decoded but no base-roster quotes matched');
  prices.sort((a, b) => Number(a.cardId) - Number(b.cardId) || a.platform.localeCompare(b.platform));
  const output = {
    updated_at: checkedAt,
    verification_window_minutes: windowMinutes,
    source: 'fut.gg',
    provider: 'https://www.fut.gg/players/',
    coverage: {
      base_cards: seen.size,
      quotes: prices.length,
      platforms: ['ps', 'pc'],
      resolved_by_version_id: versionMapped,
      note: 'PS5 and PC quotes for base card versions, published by FUT.GG. Xbox quotes and promoted/special card versions are not published in this feed and stay unverified.',
    },
    prices,
  };
  writeFileSync(dest, JSON.stringify(output, null, 2) + '\n');
  console.log('Published', prices.length, 'verified PS5/PC quotes across', seen.size, 'base cards from FUT.GG CDN.');
} catch (error) {
  const age = retainedAge();
  const message = 'FUT.GG price blobs unavailable (' + String(error.message || error).slice(0, 140)
    + '). The price snapshot ('
    + (Number.isFinite(age) ? Math.round(age) + ' min old' : 'missing')
    + ') stays untouched, so the site shows no prices instead of guessed ones.';
  if (age > staleAfterMinutes) { annotate('error', message); process.exitCode = 1; }
  else annotate('warning', message);
}
