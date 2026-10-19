#!/usr/bin/env node
// Reads public FUT.GG listing and detail pages only.
// Anything the source does not state explicitly is left out instead of guessed.
const fs = require('node:fs');
const { base, get, plain, decodeEntities, readTitle, readSubtitle, slugFrom } = require('./lib/futgg.cjs');
const { faTask, faRequirement, faSegment, faReward, faName } = require('./lib/fa.cjs');
const { faText } = require('./lib/fa-text.cjs');

// Localiser output is stored only when a rule covered the whole string; no match means the UI keeps the
// source text rather than showing a partial translation.
function faFields(value, kind) {
  const record = {};
  const describe = kind === 'task' ? faTask : faSegment;
  if (value.description) {
    // A segment summary can read either as a reward sentence ("Earn …") or as a task ("Win 3 …").
    const out = describe(value.description) || (kind === 'segment' ? faTask(value.description) : '');
    if (out) record.descriptionFA = out;
  }
  if (value.requirements) {
    const list = value.requirements.map(x => faRequirement(typeof x === 'string' ? x : x.label + ' ' + (x.value || '')));
    if (list.every(Boolean)) record.requirementsFA = list;
  }
  if (value.reward) {
    const out = faReward(value.reward);
    if (out) record.rewardFA = out;
  }
  if (value.name) {
    const out = faName(value.name);
    if (out) record.nameFA = out;
  }
  return record;
}

const listPages = [
  { kind: 'objectives', cat: 'seasonal', path: '/objectives/seasonal/' },
  { kind: 'objectives', cat: 'campaign', path: '/objectives/campaigns/' },
  { kind: 'objectives', cat: 'foundation', path: '/objectives/foundations/' },
  { kind: 'objectives', cat: 'milestone', path: '/objectives/milestones/' },
  { kind: 'sbc', cat: 'players', path: '/sbc/category/players/' },
  { kind: 'sbc', cat: 'upgrades', path: '/sbc/category/upgrades/' },
  { kind: 'sbc', cat: 'challenges', path: '/sbc/category/challenges/' },
  { kind: 'sbc', cat: 'foundation', path: '/sbc/category/foundations/' },
];
// Detail records always live two levels deep (/sbc/players/<slug>/); a category segment marks a listing page.
const listingSegments = /^(?:category|expired|expiring-soon|streamlined-solver|solver|tracker|coming-soon)$/;

// FUT.GG renders each challenge segment as <h4 class="font-bold">title</h4> followed by its own block,
// so segments are split on those headings instead of guessing sentence boundaries.
function challengeBlocks(html) {
  const marks = [...html.matchAll(/<h4 class="font-bold">([^<]{2,90})<\/h4>/g)];
  return marks.map((mark, index) => ({
    name: decodeEntities(mark[1]),
    region: html.slice(mark.index + mark[0].length, index + 1 < marks.length ? marks[index + 1].index : mark.index + 6000),
  }));
}

// Reward chips share their class with navigation labels such as "Solve" and "View <player>".
function isRewardLabel(value) {
  return value.length >= 2 && value.length <= 90 && !/^(Solve|total|View|See|Open|More)\b/i.test(value);
}

function segmentFrom(region) {
  const segment = {};
  const description = plain(
    (region.match(/<p class="text-sm(?: text-gray-300)?">([\s\S]{1,400}?)<\/p>/) ||
      region.match(/<p class="text-xs font-bold">([\s\S]{1,400}?)<\/p>/) || [])[1]);
  if (description.length >= 10) segment.description = description;
  const score = (region.match(/aria-label="([\d,.]+) grading score"/) || [])[1];
  if (score) segment.score = Number(score.replace(/,/g, ''));
  const rules = [...region.matchAll(/<ul class="flex flex-col gap-1">([\s\S]{1,4000}?)<\/ul>/g)]
    .flatMap(list => [...list[1].matchAll(/<li[^>]*>([\s\S]{1,220}?)<\/li>/g)].map(x => plain(x[1])))
    .filter(x => x.length >= 3 && x.length <= 150 && !/^(Solve|Eligible players)$/i.test(x));
  if (rules.length) segment.requirements = [...new Set(rules)].slice(0, 16);
  const rewards = [...region.matchAll(/<span class="text-(?:xs|sm) font-bold[^"]*">([\s\S]{1,140}?)<\/span>/g)]
    .map(x => plain(x[1])).filter(isRewardLabel);
  if (rewards.length) segment.reward = [...new Set(rewards)].join(' + ');
  return segment;
}

function readStats(html) {
  const stats = {};
  for (const [, label, value] of html.matchAll(/<span class="text-xs font-bold text-gray-400 uppercase">([\s\S]{1,60}?)<\/span><span class="text-sm font-bold">([\s\S]{1,160}?)<\/span>/g)) {
    const name = plain(label);
    if (name) stats[name] = plain(value);
  }
  return stats;
}

function scrapeList(page) {
  const url = base + page.path;
  const html = get(url);
  const out = [];
  const seen = new Set();
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    let target;
    try { target = new URL(href, url); } catch { continue; }
    if (target.hostname !== 'www.fut.gg' || seen.has(target.pathname)) continue;
    const prefix = page.kind === 'sbc' ? 'sbc' : 'objectives';
    const parts = target.pathname.split('/').filter(Boolean);
    if (parts.length !== 3 || parts[0] !== prefix || listingSegments.test(parts[1])) continue;
    seen.add(target.pathname);
    out.push({ category: page.cat, url: base + target.pathname });
  }
  return out;
}

function rewardPanel(html, heading) {
  const match = html.match(new RegExp('<span class="text-base leading-tight font-bold">' + heading + '</span>', 'i'));
  if (!match) return [];
  const after = html.slice(match.index + match[0].length);
  const stop = after.search(/<span class="text-base leading-tight font-bold">/i);
  const scope = after.slice(0, stop > 0 ? stop : 12000);
  return [...new Set([...scope.matchAll(/<span class="text-(?:xs|sm) font-bold[^"]*">([\s\S]{1,140}?)<\/span>/g)]
    .map(x => plain(x[1])).filter(isRewardLabel))].slice(0, 16);
}

function readSbc(html) {
  const record = {};
  const stats = readStats(html);
  const count = Number((stats.Challenges || '').replace(/,/g, ''));
  if (Number.isFinite(count) && count > 0) record.challenges = count;
  if (stats.Repeatable && stats.Repeatable !== '-') record.repeatable = stats.Repeatable;
  if (stats.Expires) record.expires = stats.Expires;
  if (stats['Refreshes Every'] && stats['Refreshes Every'] !== '-') record.refreshes = stats['Refreshes Every'];
  const reward = rewardPanel(html, 'Rewards');
  if (reward.length) record.reward = reward.join(' + ');
  const segments = challengeBlocks(html)
    .map(block => ({ name: block.name, ...segmentFrom(block.region) }))
    .filter(x => x.description || x.requirements || x.reward);
  if (segments.length) record.squads = segments.slice(0, 24);
  return record;
}

function readObjective(html) {
  const record = {};
  const tasks = challengeBlocks(html)
    .map(block => ({ name: block.name, ...segmentFrom(block.region) }))
    .filter(x => x.description);
  if (tasks.length) {
    record.tasks = tasks.slice(0, 40).map(task => ({
      name: task.name,
      description: task.description,
      ...(task.reward ? { reward: task.reward } : {}),
    }));
  }
  const total = (html.match(/<span class="text-xs font-bold">([\d,.]+\s+total)<\/span>/i) || [])[1];
  if (total) record.reward = plain(total);
  return record;
}

(async () => {
  const file = 'data/fc27-challenges.json';
  const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const checkedAt = new Date().toISOString();
  const found = { objectives: [], sbc: [] };

  for (const page of listPages) {
    try {
      for (const entry of scrapeList(page)) {
        if (!found[page.kind].some(x => x.url === entry.url)) found[page.kind].push(entry);
      }
    } catch (error) {
      console.warn('Listing unavailable', page.path, String(error.message).slice(0, 120));
    }
  }

  for (const kind of ['objectives', 'sbc']) {
    for (const record of found[kind]) {
      record.name = readTitle('', slugFrom(record.url));
      try {
        const html = get(record.url);
        record.name = readTitle(html, record.name);
        const detail = kind === 'sbc' ? readSbc(html) : readObjective(html);
        const subtitle = readSubtitle(html);
        if (subtitle) record.description = subtitle;
        Object.assign(record, detail);
      } catch (error) {
        console.warn('Detail unavailable', record.url, String(error.message).slice(0, 100));
      }
    }
  }

  // Persian segment titles verified by hand survive an automated pass.
  const stored = new Map((previous?.sections?.sbc || []).map(x => [x.url, x]));
  for (const record of found.sbc) {
    const earlier = stored.get(record.url);
    if (!earlier) continue;
    if (!record.description && earlier.description) record.description = earlier.description;
    if (!record.squads && earlier.squads?.length) {
      record.squads = earlier.squads;
      record.squads_checked_at = earlier.squads_checked_at;
      continue;
    }
    if (record.squads?.length && earlier.squads?.some(s => s.nameFA)) {
      const titles = new Map(earlier.squads.filter(s => s.name && s.nameFA).map(s => [s.name, s.nameFA]));
      for (const segment of record.squads) if (titles.has(segment.name)) segment.nameFA = titles.get(segment.name);
      record.squads_checked_at = earlier.squads_checked_at || checkedAt;
    }
  }
  const storedObjectives = new Map((previous?.sections?.objectives || []).map(x => [x.url, x]));
  for (const record of found.objectives) {
    const earlier = storedObjectives.get(record.url);
    if (!record.description && earlier?.description) record.description = earlier.description;
  }

  // A single localisation pass covers freshly scraped records and anything carried over from a snapshot.
  // Hand-translated titles and campaign prose win; the rule engine fills whatever is left.
  const fill = (target, kind) => {
    for (const [key, value] of Object.entries(faFields(target, kind))) if (target[key] === undefined) target[key] = value;
  };
  const applyVerified = (target, section) => {
    const verified = faText(section, target.name);
    if (verified.nameFA) target.nameFA = verified.nameFA;
    if (verified.descriptionFA && target.description) target.descriptionFA = verified.descriptionFA;
  };
  for (const record of found.objectives) {
    applyVerified(record, 'objectives');
    fill(record, 'segment');
    for (const task of record.tasks || []) { applyVerified(task, 'tasks'); fill(task, 'task'); }
  }
  for (const record of found.sbc) {
    applyVerified(record, 'sbc');
    fill(record, 'segment');
    for (const segment of record.squads || []) { applyVerified(segment, 'sbc'); fill(segment, 'segment'); }
  }

  const result = {
    source: 'FUT.GG',
    checked_at: checkedAt,
    sections: {
      objectives: found.objectives.map(x => ({ name: x.name, category: x.category, description: x.description || '', url: x.url, ...(x.nameFA ? { nameFA: x.nameFA } : {}), ...(x.descriptionFA ? { descriptionFA: x.descriptionFA } : {}), ...(x.rewardFA ? { rewardFA: x.rewardFA } : {}), ...(x.tasks ? { tasks: x.tasks } : {}), ...(x.reward ? { reward: x.reward } : {}), detail_checked_at: checkedAt })),
      sbc: found.sbc.map(x => ({ name: x.name, category: x.category, description: x.description || '', url: x.url, price: x.price ?? null, ...(x.nameFA ? { nameFA: x.nameFA } : {}), ...(x.descriptionFA ? { descriptionFA: x.descriptionFA } : {}), ...(x.rewardFA ? { rewardFA: x.rewardFA } : {}), ...(x.reward ? { reward: x.reward } : {}), ...(x.challenges ? { challenges: x.challenges } : {}), ...(x.repeatable ? { repeatable: x.repeatable } : {}), ...(x.expires ? { expires: x.expires } : {}), ...(x.refreshes ? { refreshes: x.refreshes } : {}), ...(x.squads ? { squads: x.squads, squads_checked_at: x.squads_checked_at || checkedAt } : {}), detail_checked_at: checkedAt })),
    },
  };

  // Fail closed: a partial scrape must never replace a better snapshot.
  const objectiveTasks = result.sections.objectives.filter(x => x.tasks?.length).length;
  const squadSegments = result.sections.sbc.filter(x => x.squads?.length).length;
  if (result.sections.objectives.length < 3 || result.sections.sbc.length < 8 || objectiveTasks < 5 || squadSegments < 8) {
    throw Error('Incomplete extraction: ' + result.sections.objectives.length + ' objectives (' + objectiveTasks + ' with tasks), ' + result.sections.sbc.length + ' SBCs (' + squadSegments + ' with segments). Existing snapshot preserved.');
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  console.log('Updated FC27 listings:', result.sections.objectives.length, 'objectives with', objectiveTasks, 'task lists,', result.sections.sbc.length, 'SBCs with', squadSegments, 'segment lists.');
})().catch(error => { console.error(error); process.exitCode = 1; });
