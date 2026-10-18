#!/usr/bin/env node
// Refreshes data/fc27-prices.json from FUTBIN's server-rendered FC 27 market table.
// FUTBIN is served behind Cloudflare and rejects Node's TLS fingerprint, so requests go through curl.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const dest = path.join(root, 'data/fc27-prices.json');
const provider = 'https://www.futbin.com/27/players';
const pages = Math.max(1, Math.min(Number(process.env.FC27_PRICE_PAGES || 40), 300));
const windowMinutes = Math.max(15, Number(process.env.FC27_PRICE_WINDOW_MINUTES || 75));
const userAgent = process.env.FC27_PRICE_USER_AGENT ||
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const rowPattern = /<tr class="player-row[^"]*">(.*?)<\/tr>/gs;
const pricePattern = /platform-(ps|pc)-only">\s*<div class="price[^>]*>([^<]+)</;
const platformFor = { ps: 'ps', pc: 'pc' };

function fetchPage(page) {
  const url = `${provider}?page=${page}&version=gold&sort=rating&order=desc&platform=ps`;
  return execFileSync('curl', ['-fsL', '--max-time', '30', '-A', userAgent, url], { maxBuffer: 1 << 26 }).toString();
}

function toCoins(token) {
  const match = /^([\d.]+)\s*([KM]?)$/i.exec(String(token || '').trim());
  if (!match) return null;
  const unit = { '': 1, k: 1e3, m: 1e6 }[match[2].toLowerCase()];
  const coins = Math.round(Number(match[1]) * unit);
  return Number.isFinite(coins) && coins > 0 ? coins : null;
}

function parseRows(html) {
  const cards = [];
  for (const [, row] of html.matchAll(rowPattern)) {
    const cardId = (row.match(/img\/players\/(\d+)\.png/) || [])[1];
    const href = (row.match(/href="\/27\/player\/(\d+)\//) || [])[1];
    if (!cardId || !href) continue;
    const prices = new Map();
    for (const [, platform, token] of row.matchAll(new RegExp(pricePattern.source, 'g'))) {
      const coins = toCoins(token);
      if (coins !== null) prices.set(platformFor[platform], coins);
    }
    if (prices.size) cards.push({ cardId, href, name: (row.match(/title="([^"]+)"/) || [])[1] || '', prices });
  }
  return cards;
}

const checkedAt = new Date().toISOString();
const byVersion = new Map();
let pagesOk = 0;
const seenNames = new Set();

for (let page = 1; page <= pages; page++) {
  let html = '';
  try { html = fetchPage(page); } catch (error) { console.warn('Page', page, 'unavailable:', String(error.message).slice(0, 120)); }
  const cards = parseRows(html);
  if (cards.length) pagesOk++;
  for (const card of cards) {
    seenNames.add(card.name);
    for (const [platform, coins] of card.prices) {
      byVersion.set(card.cardId + ':' + platform, {
        cardId: card.cardId,
        versionId: card.cardId,
        platform,
        coins,
        status: 'verified',
        sourceUrl: `https://www.futbin.com/27/player/${card.href}`,
        checkedAt,
      });
    }
  }
  if (!cards.length && page > 1) break;
  if (page < pages) await new Promise(resolve => setTimeout(resolve, Number(process.env.FC27_PRICE_DELAY_MS || 4000)));
}

if (pagesOk === 0) {
  console.error('FUTBIN returned no parseable FC 27 market rows; preserving the existing price snapshot.');
  process.exitCode = 1;
} else {
  const prices = [...byVersion.values()];
  const output = {
    updated_at: checkedAt,
    verification_window_minutes: windowMinutes,
    source: 'futbin.com',
    provider,
    coverage: {
      base_cards: seenNames.size,
      quotes: prices.length,
      platforms: ['ps', 'pc'],
      note: 'Xbox quotes and non-base card promotions are not published by this provider and stay unverified.',
    },
    prices,
  };
  writeFileSync(dest, JSON.stringify(output, null, 2) + '\n');
  console.log('Published', prices.length, 'live PS/PC quotes across', seenNames.size, 'base cards from', pagesOk, 'pages.');
}
