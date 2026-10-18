#!/usr/bin/env node
// Reads public FUT.GG evolution pages only.
// Values the source renders client-side (submission deadlines, coin costs) are left out instead of guessed.
const fs = require('node:fs');
const { get, plain, readTitle, readSubtitle, slugFrom, panel, panelRows, detailUrl } = require('./lib/futgg.cjs');

function scrapeList() {
  const html = get('/evolutions/');
  const urls = [];
  const seen = new Set();
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const url = detailUrl(href);
    if (!url || seen.has(url)) continue;
    if (!new URL(url).pathname.startsWith('/evolutions/') || !/^\/evolutions\/\d+-[^/]+\/?$/.test(new URL(url).pathname)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function upgradeChip(chip) {
  const clean = chip.replace(/<svg[\s\S]*?<\/svg>/g, '');
  const tiny = plain((clean.match(/<span class="text-gray-400 text-tiny[^"]*">([\s\S]{0,160}?)<\/span>/) || [])[1]);
  const label = plain(clean.replace(/<span class="text-gray-400 text-tiny[\s\S]{0,240}?<\/span>/g, ''));
  if (!label || label.length > 80) return '';
  if (/^\d[\d.,]*$/.test(tiny)) return label + ' → ' + tiny;
  return /text-green-500[^>]*">\+</.test(clean) ? label + '+' : label;
}

function readChips(scope) {
  return [...new Set([...scope.matchAll(/<div class="rounded[^"]*bg-gray[^"]*"[^>]*>([\s\S]{1,1400}?)<\/div>/g)]
    .map(match => upgradeChip(match[1])).filter(Boolean))].slice(0, 40);
}

// Plain levels list one "Upgrades" panel; pathway levels list "Upgrade paths" as separate option columns.
function readUpgrades(region) {
  const paths = panel(region, 'Upgrade paths');
  if (paths) {
    const marks = [...paths.matchAll(/<span class="text-xs font-bold text-white">Option\s+([A-Z]{1,2})<\/span>/g)];
    const options = marks.map((mark, index) => ({
      name: 'Option ' + mark[1],
      upgrades: readChips(paths.slice(mark.index, index + 1 < marks.length ? marks[index + 1].index : mark.index + 20000)),
    })).filter(x => x.upgrades.length);
    if (!options.length) return {};
    return { options, ...(options.length > 1 && /Pick one/i.test(paths.slice(0, marks[0].index)) ? { pick_one: true } : {}) };
  }
  const upgrades = readChips(panel(region, 'Upgrades'));
  return upgrades.length ? { upgrades } : {};
}

// Levels are separate cards titled "Level 1", "Level 2" … each with its own upgrades and challenges.
function readLevels(html) {
  const marks = [...html.matchAll(/<h2 class="font-bold text-white bg-gray-900[^"]*">Level\s*(\d+)<\/h2>/g)];
  return marks.map((mark, index) => {
    const from = mark.index + mark[0].length;
    let end = index + 1 < marks.length ? marks[index + 1].index : -1;
    if (end < 0) {
      // The final level card ends where the next top-level section (a sidebar panel) begins.
      const boundary = html.slice(from).search(/<h2[^>]*>/i);
      end = boundary > 0 ? from + boundary : html.length;
    }
    const region = html.slice(from, end);
    const level = { name: 'Level ' + Number(mark[1]) };
    const tasks = readTasks(region);
    if (tasks.length) level.tasks = tasks;
    Object.assign(level, readUpgrades(region));
    const time = plain((panel(region, 'Training Time').match(/<div class="flex flex-col gap-2 text-sm text-gray-300">([\s\S]{1,80}?)<\/div>/) || [])[1]);
    if (time) level.training_time = time;
    return level;
  });
}

function readTasks(region) {
  return [...new Set([...panel(region, 'Challenges').matchAll(/<div class="text-sm text-gray-300">([\s\S]{5,400}?)<\/div>/g)]
    .map(match => plain(match[1])).filter(x => x.length >= 12 && x.length <= 320))].slice(0, 12);
}

function labelledRows(html, heading) {
  return panelRows(html, heading).map(row => row.label + ': ' + row.value);
}

(async () => {
  const file = 'data/fc27-evolutions.json';
  const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const checkedAt = new Date().toISOString();
  const evolutions = [];

  for (const url of scrapeList()) {
    const record = { name: readTitle('', slugFrom(url)), url };
    try {
      const html = get(url);
      record.name = readTitle(html, record.name);
      const description = readSubtitle(html);
      if (description) record.description = description;
      const levels = readLevels(html);
      if (levels.length) record.levels = levels;
      const requirements = labelledRows(html, 'Player Requirements');
      if (requirements.length) record.requirements = requirements;
      const upgrades = labelledRows(html, 'Evolution Upgrades');
      if (upgrades.length) record.upgrades = upgrades;
      const details = labelledRows(html, 'Details');
      if (details.length) record.details = details;
      evolutions.push(record);
    } catch (error) {
      console.warn('Detail unavailable', url, String(error.message).slice(0, 100));
    }
  }

  // Persian titles and step translations verified by hand stay attached to their evolution.
  const keys = list => list.map(x => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  const stored = new Map();
  for (const earlier of previous?.evolutions || []) stored.set(keys([earlier.name])[0], earlier);
  for (const record of evolutions) {
    const earlier = stored.get(keys([record.name])[0]);
    if (!earlier) continue;
    if (earlier.nameFA) record.nameFA = earlier.nameFA;
    if (earlier.descriptionFA) record.descriptionFA = earlier.descriptionFA;
    if (earlier.badge) record.badge = earlier.badge;
    for (const level of record.levels || []) {
      const before = (earlier.levels || []).find(x => keys([x.name])[0] === keys([level.name])[0]);
      if (!before) continue;
      if (before.nameFA) level.nameFA = before.nameFA;
      if (before.tasksFA?.length && before.tasks.join('|') === level.tasks?.join('|')) level.tasksFA = before.tasksFA;
    }
  }

  const result = { source: 'FUT.GG', checked_at: checkedAt, evolutions };
  const withLevels = evolutions.filter(x => x.levels?.length).length;
  const withTasks = evolutions.filter(x => x.levels?.some(l => l.tasks?.length)).length;
  // Fail closed: a partial scrape must never replace a better snapshot.
  if (evolutions.length < 8 || withLevels < evolutions.length * 0.6 || withTasks < 4) {
    throw Error('Incomplete extraction: ' + evolutions.length + ' evolutions, ' + withLevels + ' with levels, ' + withTasks + ' with level tasks. Existing snapshot preserved.');
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log('Updated FC27 evolutions:', evolutions.length, 'records,', withLevels, 'with levels,', withTasks, 'with level tasks.');
})().catch(error => { console.error(error); process.exitCode = 1 });
