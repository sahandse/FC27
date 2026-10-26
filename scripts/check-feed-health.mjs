#!/usr/bin/env node
// Verifies every published FC27 feed is present, complete and recent. The
// scheduled syncs can fail silently (an upstream block, an empty parse), so the
// site is checked from the outside the way a client reads it.

const SITE = (process.env.FC27_SITE || 'https://sahandse.github.io/FC27').replace(/\/$/, '');

const feeds = [
  {name: 'players', file: 'fc27-players.json', stamp: 'synced_at', maxAgeHours: 48, count: (j) => j.players?.length ?? 0, floor: 18_000},
  {name: 'prices', file: 'fc27-prices.json', stamp: 'updated_at', maxAgeHours: 3, count: (j) => j.prices?.length ?? 0, floor: 20_000},
  {name: 'card-art', file: 'fc27-card-art.json', stamp: 'checked_at', maxAgeHours: 48, count: (j) => Object.keys(j.art ?? {}).length, floor: 5_000},
  {name: 'challenges', file: 'fc27-challenges.json', stamp: 'checked_at', maxAgeHours: 24, count: (j) => (j.sections?.objectives?.length ?? 0) + (j.sections?.sbc?.length ?? 0), floor: 40},
  {name: 'evolutions', file: 'fc27-evolutions.json', stamp: 'checked_at', maxAgeHours: 24, count: (j) => j.evolutions?.length ?? 0, floor: 10},
  {name: 'news', file: 'fc27-news.json', stamp: 'checked_at', maxAgeHours: 24, count: (j) => j.items?.length ?? 0, floor: 5},
  {name: 'portraits', file: 'available-portraits.json', stamp: 'updated_at', maxAgeHours: 72, count: (j) => j.ids?.length ?? 0, floor: 3_000},
];

const results = [];
let failed = 0;
const now = Date.now();

for (const feed of feeds) {
  const url = `${SITE}/data/${feed.file}?health=${now}`;
  let status = 'ok';
  let detail = '';
  let age = null;
  let count = 0;
  try {
    const response = await fetch(url, {
      headers: {'cache-control': 'no-cache', 'user-agent': 'FC27-FeedHealth/1.0'},
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const json = await response.json();
    count = feed.count(json);
    const stamp = Date.parse(json[feed.stamp] ?? '');
    if (Number.isNaN(stamp)) {
      status = 'fail';
      detail = `missing ${feed.stamp}`;
    } else {
      age = (now - stamp) / 3_600_000;
      if (age > feed.maxAgeHours) {
        status = 'fail';
        detail = `stale by ${age.toFixed(1)}h (limit ${feed.maxAgeHours}h)`;
      }
    }
    if (status === 'ok' && count < feed.floor) {
      status = 'fail';
      detail = `only ${count} entries (floor ${feed.floor})`;
    }
  } catch (error) {
    status = 'fail';
    detail = String(error.message || error).slice(0, 120);
  }
  if (status === 'fail') failed++;
  results.push({feed: feed.name, status, count, age: age === null ? '—' : age.toFixed(1) + 'h', detail});
}

const header = '| feed | status | entries | age | detail |\n| --- | --- | --- | --- | --- |';
const rows = results.map((r) => `| ${r.feed} | ${r.status} | ${r.count} | ${r.age} | ${r.detail || '—'} |`);
console.log([header, ...rows].join('\n'));

if (process.env.GITHUB_STEP_SUMMARY) {
  const {appendFileSync} = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## FC27 feed health\n\n${[header, ...rows].join('\n')}\n`);
}

if (failed) {
  console.error(failed + ' feed(s) unhealthy');
  process.exitCode = 1;
}
