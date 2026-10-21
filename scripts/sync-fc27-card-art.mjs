#!/usr/bin/env node
// Indexes the real FC27 card artwork FUT.GG serves from its public CDN. The catalogue pages
// render each listed card's content-addressed artwork path server-side, so one pass over the
// catalogue yields the hash for every base-card version. Artwork is hot-linked from FUT.GG's CDN
// at render time; this file only stores the verified path per version id.
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { get } from './lib/futgg.cjs';

const root = path.join(import.meta.dirname, '..');
const dest = path.join(root, 'data/fc27-card-art.json');
const rosterPath = path.join(root, 'data/fc27-players.json');
const delayMs = Math.max(150, Number(process.env.FC27_ART_DELAY_MS || 400));
const maxPages = Math.max(50, Number(process.env.FC27_ART_PAGES || 900));
const pattern = /2027\/futgg-player-item-card\/27-(\d+)\.([0-9a-f]{64})\.webp/g;

const roster = new Set(JSON.parse(readFileSync(rosterPath, 'utf8')).players.map(p => Number(p.id)));
const art = new Map();
let pages = 0;
let empty = 0;

for (let page = 1; page <= maxPages; page++) {
  let html = '';
  try {
    html = get(page === 1 ? '/players/' : `/players/?page=${page}`);
  } catch (error) {
    console.warn('page', page, 'unavailable:', String(error.message || error).slice(0, 120));
    empty++;
    if (empty >= 3) break;
    continue;
  }
  const ids = new Set();
  for (const [, id, hash] of html.matchAll(pattern)) {
    ids.add(id);
    if (roster.has(Number(id))) art.set(id, hash);
  }
  pages++;
  empty = ids.size ? 0 : empty + 1;
  if (!ids.size && page > 1) break;
  if (art.size >= roster.size) break;
  if (page < maxPages) await new Promise(resolve => setTimeout(resolve, delayMs));
}

// The catalogue is rating-sorted and paginates to ~335 pages (~10k players); everyone past that
// falls back to the portrait chain in the UI, so this floor only guards against broken parses.
const minimum = Math.min(5000, Math.round(roster.size * 0.25));
if (art.size < minimum) {
  console.error('Only', art.size, 'card artworks resolved (minimum', minimum + '); keeping the previous index.');
  process.exitCode = 1;
} else {
  const output = {
    source: 'game-assets.fut.gg',
    source_url: 'https://www.fut.gg/players/',
    checked_at: new Date().toISOString(),
    note: 'Content-addressed FC27 card artwork paths per base-card version id, read from FUT.GG catalogue pages.',
    art: Object.fromEntries([...art.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
  };
  writeFileSync(dest, JSON.stringify(output) + '\n');
  console.log('Indexed', art.size, 'FC27 card artworks across', pages, 'catalogue pages.');
}
