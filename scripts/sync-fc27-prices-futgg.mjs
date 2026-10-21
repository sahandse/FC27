#!/usr/bin/env node
// Refreshes data/fc27-prices.json from FUT.GG's public CDN price blobs — the same static JSON
// the fut.gg site itself downloads for its market pages. The blobs pair delta-encoded EA player
// ids (id0 + cumulative deltas) with a parallel coin-price table; PS5 and PC blobs are published
// for base card versions. Xbox and promoted versions are not in this feed and stay unverified.
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

const checkedAt = new Date().toISOString();
try {
  const roster = new Set(JSON.parse(readFileSync(rosterPath, 'utf8')).players.map(p => Number(p.id)));
  const ps5 = decode(JSON.parse(get(ssr('player-prices-ps5'))));
  const pc = decode(JSON.parse(get(ssr('player-prices-pc'))));
  const prices = [];
  const seen = new Set();
  for (const [name, platform, table] of [['ps5', 'ps', ps5], ['pc', 'pc', pc]]) {
    for (const [id, coins] of table) {
      if (!roster.has(id)) continue;
      seen.add(id);
      prices.push({
        cardId: String(id),
        versionId: String(id),
        platform,
        coins,
        status: 'verified',
        sourceUrl: `https://www.fut.gg/players/${id}/27-${id}/`,
        checkedAt,
      });
    }
  }
  if (!prices.length) throw new Error('Price blobs decoded but no base-roster quotes matched');
  prices.sort((a, b) => Number(a.versionId) - Number(b.versionId) || a.platform.localeCompare(b.platform));
  const output = {
    updated_at: checkedAt,
    verification_window_minutes: windowMinutes,
    source: 'fut.gg',
    provider: 'https://www.fut.gg/players/',
    coverage: {
      base_cards: seen.size,
      quotes: prices.length,
      platforms: ['ps', 'pc'],
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
