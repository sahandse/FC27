#!/usr/bin/env node
// Adds FC 27 base-card portraits from the FUTBIN CDN, which is the only mirror that still serves the
// current game code. Files that are not verifiable PNG data are never committed.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const folder = path.join(root, 'img/players');
const indexFile = path.join(root, 'data/available-portraits.json');
const provenanceFile = path.join(root, 'data/external-portraits.json');
const cdn = id => `https://cdn.futbin.com/content/fifa27/img/players/${id}.png`;
const userAgent = process.env.FC27_PORTRAIT_USER_AGENT ||
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const limit = Math.max(1, Math.min(Number(process.env.FC27_PORTRAIT_LIMIT || 600), 5000));
const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readJSON(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function isPNG(buffer) {
  return buffer.length > pngMagic.length && buffer.subarray(0, 8).equals(pngMagic);
}

const dataset = readJSON(path.join(root, 'data/fc27-players.json'), { players: [] });
const index = readJSON(indexFile, { ids: [], files: {} });
const provenance = readJSON(provenanceFile, { source: 'cdn.futbin.com', images: {} });
const onDisk = new Set(readdirSync(folder).filter(f => /\.(png|jpg|jpeg|webp)$/.test(f)).map(f => f.split('.')[0]));
const indexed = new Set((index.ids || []).map(Number));

const wanted = dataset.players
  .filter(p => /^\d+$/.test(String(p.id)) && p.rat > 0 && !onDisk.has(String(p.id)))
  .sort((a, b) => b.rat - a.rat || String(a.name).localeCompare(String(b.name)))
  .slice(0, limit);

mkdirSync(folder, { recursive: true });
let saved = 0;
let missing = 0;

for (const player of wanted) {
  const id = String(player.id);
  const url = cdn(id);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'image/png', Referer: 'https://www.futbin.com/27/players' },
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 404) { missing++; continue; }
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const body = Buffer.from(await response.arrayBuffer());
    if (!isPNG(body) || body.length < 1500) throw new Error('not a usable PNG');
    writeFileSync(path.join(folder, id + '.png'), body);
    if (!indexed.has(Number(id))) index.ids.push(Number(id));
    provenance.images[id] = { name: player.name, rat: player.rat, source: url, fetched_at: new Date().toISOString() };
    saved++;
  } catch (error) {
    console.warn('Skipped', id, player.name, String(error.message).slice(0, 80));
  }
  await new Promise(resolve => setTimeout(resolve, Number(process.env.FC27_PORTRAIT_DELAY_MS || 250)));
}

index.ids = [...new Set(index.ids.map(Number))].sort((a, b) => a - b);
index.count = index.ids.length;
index.updated_at = new Date().toISOString();
provenance.updated_at = index.updated_at;
provenance.game_code = 'fifa27';
writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
writeFileSync(provenanceFile, JSON.stringify(provenance, null, 2) + '\n');
console.log('Added', saved, 'FC 27 portraits;', missing, 'not published by the CDN; indexed', index.count, 'of', dataset.players.length, 'players.');
