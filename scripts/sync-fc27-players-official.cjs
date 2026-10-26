#!/usr/bin/env node
// Refreshes data/fc27-players.json from EA SPORTS FC 27's official public ratings
// dataset: https://www.ea.com/games/ea-sports-fc/ratings
//
// The ratings page is server-rendered in pages of 100 players and publishes the
// same numbers EA uses for the in-game Gold/Silver/Bronze items. Every record
// carries its official FC27 item-card artwork path, so the app can render the
// exact card EA ships instead of a re-drawn approximation.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'data/fc27-players.json');
const RATINGS_URL = 'https://www.ea.com/games/ea-sports-fc/ratings';
const CARD_BASE = 'https://ratings-images-prod.pulse.ea.com/FC27/components/items';
const PORTRAIT_BASE = 'https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits';
const PAGE_SIZE = 100;
const CONCURRENCY = 5;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function extractItems(html) {
  const match = html.match(/"totalItems":(\d+)/);
  if (!match) throw new Error('EA ratings payload is missing totalItems');
  const totalItems = Number(match[1]);
  const markerIndex = html.indexOf(`"totalItems":${totalItems}`);
  const start = html.lastIndexOf('"items":[', markerIndex);
  if (start < 0) throw new Error('EA ratings payload is missing its items array');
  const open = html.indexOf('[', start);
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = open; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '[') depth++;
    else if (char === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error('EA ratings items array is unterminated');
  return { totalItems, items: JSON.parse(html.slice(open, end + 1)) };
}

async function fetchPage(page) {
  const url = `${RATINGS_URL}?orderBy=ovr%3Adesc&page=${page}`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      if (html.length < 400_000) throw new Error(`short page (${html.length} bytes)`);
      return extractItems(html);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1_500 * attempt));
    }
  }
  throw new Error(`EA ratings page ${page}: ${lastError?.message || lastError}`);
}

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const clean = (value) => (value == null ? '' : String(value).trim());

function statValue(item, key) {
  return num(item.stats?.[key]?.value);
}

function cardTypeFor(rating) {
  // EA's FC27 ratings table is the launch Gold/Silver/Bronze set: 75+ Gold,
  // 65-74 Silver, below 65 Bronze. The official item card uses the same cut.
  if (rating >= 75) return 'gold';
  if (rating >= 65) return 'silver';
  return 'bronze';
}

function positionType(position) {
  const type = clean(position?.positionType?.name).toLowerCase();
  if (type.startsWith('goal')) return 'GK';
  if (type.startsWith('attack')) return 'ATT';
  if (type.startsWith('defen')) return 'DEF';
  return 'MID';
}

function displayName(item) {
  return clean(item.commonName) || [clean(item.firstName), clean(item.lastName)].filter(Boolean).join(' ');
}

function mapPlayer(item) {
  const id = clean(item.id);
  const name = displayName(item);
  const rating = num(item.overallRating);
  const position = clean(item.position?.shortLabel).toUpperCase();
  const isGoalkeeper = position === 'GK';
  const stats = isGoalkeeper
    ? {
        DIV: statValue(item, 'pac'),
        HAN: statValue(item, 'sho'),
        KIC: statValue(item, 'pas'),
        REF: statValue(item, 'dri'),
        SPD: statValue(item, 'def'),
        POS: statValue(item, 'phy'),
      }
    : {
        PAC: statValue(item, 'pac'),
        SHO: statValue(item, 'sho'),
        PAS: statValue(item, 'pas'),
        DRI: statValue(item, 'dri'),
        DEF: statValue(item, 'def'),
        PHY: statValue(item, 'phy'),
      };
  const positions = [position, ...(item.alternatePositions || []).map((entry) => clean(entry.shortLabel).toUpperCase())]
    .filter(Boolean);
  const abilities = Array.isArray(item.playerAbilities) ? item.playerAbilities : [];
  const playStyles = abilities
    .filter((ability) => clean(ability.type?.id) === 'playStyle')
    .map((ability) => clean(ability.label))
    .filter(Boolean);
  const playStylesPlus = abilities
    .filter((ability) => clean(ability.type?.id) === 'playStylePlus')
    .map((ability) => clean(ability.label))
    .filter(Boolean);
  const preferredFoot = num(item.preferredFoot);

  return {
    id,
    name,
    nameFA: name,
    rat: rating,
    pos: position,
    positions: [...new Set(positions)],
    posType: positionType(item.position),
    nat: clean(item.nationality?.label),
    flag: '⚽',
    club: clean(item.team?.label),
    leagueFA: clean(item.leagueName),
    price: null,
    imgId: null,
    stats,
    inGameStats: stats,
    cardType: cardTypeFor(rating),
    gender: clean(item.gender?.label),
    skillMoves: num(item.skillMoves),
    weakFoot: num(item.weakFootAbility),
    foot: preferredFoot === 2 ? 'Left' : preferredFoot === 1 ? 'Right' : '',
    playStyles,
    playStylesPlus,
    // EA publishes the exact FC27 Ultimate Team item card for every rated
    // player. It is the authoritative card shown in-game and on ea.com.
    cardImageUrl: `${CARD_BASE}/${id}_en-GB.webp`,
    portraitUrl: clean(item.avatarUrl) || `${PORTRAIT_BASE}/p${id}.png?padding=0.7`,
  };
}

async function main() {
  const first = await fetchPage(1);
  const totalItems = first.totalItems;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (!Number.isFinite(totalItems) || totalItems < 18_000) {
    throw new Error(`Unexpected EA FC27 player total: ${totalItems}`);
  }
  console.log(`EA FC27 ratings: ${totalItems} players across ${totalPages} pages`);

  const byId = new Map();
  for (const item of first.items) byId.set(item.id, item);

  let nextPage = 2;
  async function worker() {
    while (true) {
      const page = nextPage++;
      if (page > totalPages) return;
      const { items } = await fetchPage(page);
      for (const item of items) byId.set(item.id, item);
      if (page % 25 === 0) console.log(`  fetched page ${page}/${totalPages} (${byId.size} unique)`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (byId.size < totalItems * 0.99) {
    throw new Error(`Only ${byId.size} of ${totalItems} official EA records resolved; keeping the previous snapshot.`);
  }

  const players = [...byId.values()]
    .map(mapPlayer)
    .filter((player) => player.id && player.name && player.rat >= 1 && player.rat <= 99 && player.pos)
    .sort((a, b) => b.rat - a.rat || a.name.localeCompare(b.name));

  if (players.length < 19_000) {
    throw new Error(`Official EA player mapping produced only ${players.length} rows`);
  }
  const missingCards = players.filter((player) => !player.cardImageUrl).length;
  if (missingCards) throw new Error(`${missingCards} players have no official FC27 card URL`);

  const payload = {
    source: 'EA SPORTS FC 27 official public ratings (ea.com)',
    source_url: RATINGS_URL,
    card_source_url: `${CARD_BASE}/`,
    snapshot_date: new Date().toISOString().slice(0, 10),
    synced_at: new Date().toISOString(),
    live_market_prices: false,
    players,
  };
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  fs.writeFileSync(DEST, JSON.stringify(payload));
  console.log(
    `Wrote ${players.length} official FC27 players with card artwork (${(fs.statSync(DEST).size / 1024 / 1024).toFixed(2)} MB).`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
