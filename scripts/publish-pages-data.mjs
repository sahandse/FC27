// Copies freshly synced feeds from data/ into a gh-pages worktree.
// Only writes files that actually changed, and never replaces a Pages copy
// that is newer than the working tree (for example when a scheduled price
// publish already landed after this run checked out the branch).
import {copyFileSync, existsSync, readdirSync, readFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('usage: node scripts/publish-pages-data.mjs <gh-pages-worktree>');
  process.exit(2);
}

const STAMP_KEYS = ['updated_at', 'checked_at', 'synced_at', 'generated_at', 'snapshot_date'];
const stamp = (value) => {
  if (!value || typeof value !== 'object') return 0;
  for (const key of STAMP_KEYS) {
    if (typeof value[key] === 'string') {
      const parsed = Date.parse(value[key]);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
};

const outDir = join(target, 'data');
mkdirSync(outDir, {recursive: true});

const published = [];
const skipped = [];
for (const name of readdirSync('data').filter((file) => file.endsWith('.json')).sort()) {
  const source = join('data', name);
  const destination = join(outDir, name);
  const next = readFileSync(source);
  if (existsSync(destination) && readFileSync(destination).equals(next)) continue;

  let newer = true;
  if (existsSync(destination)) {
    try {
      const incoming = stamp(JSON.parse(next.toString('utf8')));
      const current = stamp(JSON.parse(readFileSync(destination, 'utf8')));
      if (incoming && current && current > incoming) newer = false;
    } catch {
      newer = true;
    }
  }

  if (!newer) {
    skipped.push(name);
    continue;
  }
  copyFileSync(source, destination);
  published.push(name);
}

for (const name of skipped) console.log(`kept newer Pages copy: ${name}`);
console.log(published.length ? `published ${published.join(' ')}` : 'nothing to publish');
