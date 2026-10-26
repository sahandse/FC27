const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

// The application ships one section per page; every page is generated from pages/ by scripts/build-pages.mjs.
const PAGES = [
  { file: 'index.html', key: 'obj', section: 'sec-obj' },
  { file: 'sbc.html', key: 'sbc', section: 'sec-sbc' },
  { file: 'players.html', key: 'players', section: 'sec-players' },
  { file: 'dns.html', key: 'dns', section: 'sec-dns' },
  { file: 'evolutions.html', key: 'evo', section: 'sec-evo' },
];
const shell = Object.fromEntries(PAGES.map(p => [p.file, fs.readFileSync(p.file, 'utf8')]));
const partial = name => fs.readFileSync('pages/partials/' + name + '.html', 'utf8');
const runtime = fs.readFileSync('src/main.ts', 'utf8');
const html = Object.values(shell).join('\n') + '\n' + runtime;
const sw = fs.readFileSync('sw.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

test('Persian RTL document and viewport',()=>{
 for(const p of PAGES){
  assert.match(shell[p.file],/<html[^>]+dir="rtl"[^>]+lang="fa"/);
  assert.match(shell[p.file],/name="viewport"/);
 }
});
test('PWA scope and cache version',()=>{
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.scope,'./');
 assert.match(html,/serviceWorker\.register\('\.\/sw\.js'\)/);
 assert.match(sw,/caches\.keys\(\)/);
 for(const p of PAGES) assert.ok(sw.includes("'./" + p.file + "'"), 'service worker does not pre-cache ' + p.file);
});
test('player listing bounded and paginated',()=>{
 assert.match(html,/const PLAYER_PAGE_SIZE=24/);
 assert.match(html,/list\.slice\(\(playerPage-1\)\*PLAYER_PAGE_SIZE,playerPage\*PLAYER_PAGE_SIZE\)/);
});
test('no fabricated rolling expiration or player stats',()=>{
 assert.doesNotMatch(html,/exp:(?:daysFromNow|hoursFromNow)\(/);
 assert.doesNotMatch(html,/Math\.round\(base\+v\*14-7\)/);
 assert.doesNotMatch(html,/hashInt\(p\.id\+i\)/);
});
test('squad picking disallows duplicate members',()=>{
 assert.match(html,/این بازیکن در ترکیب حضور دارد/);
 assert.match(html,/state\.squad\.formation!==f/);
});

test('each section is its own page behind one top navigation',()=>{
 for(const p of PAGES){
  const doc = shell[p.file];
  assert.match(doc, new RegExp('<body[^>]+data-page="' + p.key + '"'), p.file);
  assert.match(doc, /<nav class="top-nav"/, p.file);
  assert.equal(doc.match(/aria-current="page"/g).length, 1, p.file + ' must mark exactly one current page');
  assert.ok(doc.includes('id="' + p.section + '"'), p.section + ' missing from ' + p.file);
  for(const other of PAGES) if(other !== p) assert.ok(!doc.includes('id="' + other.section + '"'), p.file + ' still carries ' + other.section);
  assert.match(doc, /<link rel="stylesheet" href="\.\/src\/styles\.css" \/>/, p.file);
  assert.match(doc, /<script type="module" src="\.\/src\/main\.ts"><\/script>/, p.file);
 }
 assert.doesNotMatch(html, /bottom-nav|bnav-|showSec\(/);
 assert.doesNotMatch(fs.readFileSync('src/styles.css', 'utf8'), /bottom-nav|bnav-/);
 for(const link of PAGES.map(p => './' + p.file)) assert.equal(shell[PAGES[0].file].split(link).length - 1, 1, link);
});

test('shared overlays and toasts exist on every page so the runtime never dereferences a missing node',()=>{
 for(const p of PAGES) for(const id of ['toasts', 'psOverlay', 'ccOverlay', 'draftOverlay', 'solverModal', 'squadPickerModal', 'compModal', 'statusPill'])
  assert.ok(shell[p.file].includes('id="' + id + '"'), p.file + ' lacks #' + id);
 assert.match(runtime, /function onPage\(key\)\{return pageKey===key\}/);
 assert.match(runtime, /function setText\(id,value\)\{const el=document\.getElementById\(id\);if\(el\)/);
 for(const guard of [/if\(!onPage\('obj'\)\)return/, /if\(!onPage\('sbc'\)\)return/, /if\(!onPage\('players'\)\)return/]) assert.match(runtime, guard);
});

test('data loading is gated to the pages that need it',()=>{
 assert.match(runtime, /if\(onPage\('obj'\)\|\|onPage\('sbc'\)\)loadLiveFC27\(\)/);
 assert.match(runtime, /if\(onPage\('evo'\)\)loadVerifiedEvolutions\(\)/);
 assert.match(runtime, /if\(onPage\('players'\)\|\|onPage\('squad'\)\)\{loadPortraitIndex\(\);loadCardArtIndex\(\);\}/);
 assert.match(shell['players.html'], /id="fcPricePlatform"/);
 assert.match(fs.readFileSync('src/market.ts', 'utf8'), /document\.getElementById\('fcPriceCheck'\)\?\.addEventListener/);
});

test('TV layout and controller navigation ship without console claims',()=>{
 for(const p of PAGES) assert.match(shell[p.file], /id="tvToggle"/);
 const nav = fs.readFileSync('src/console-nav.ts', 'utf8');
 assert.match(nav, /export function moveFocus\(direction: Direction\)/);
 assert.match(nav, /navigator\.getGamepads/);
 assert.match(nav, /document\.body\.classList\.toggle\('tv'/);
 assert.match(runtime, /initConsoleNav\(closeAnyOverlay\)/);
 assert.match(runtime, /function toggleTVMode\(\)/);
 const styles = fs.readFileSync('src/styles.css', 'utf8');
 assert.match(styles, /:where\(a,button,input,select,textarea,summary,\[tabindex\]\):focus-visible\{outline:4px solid var\(--gold\)/);
 assert.match(styles, /@media\(min-width:1024px\)\{[\s\S]*?body\.tv/);
});

test('players page documents itself and opens a verified spec sheet',()=>{
 assert.match(shell['players.html'], /class="page-guide"/);
 assert.match(shell['players.html'], /راهنمای صفحهٔ بازیکنان/);
 assert.match(runtime, /function openPlayerDetails\(id\)/);
 assert.match(runtime, /getFC27CardCoins\(p\)/);
 assert.match(runtime, /player-detail-dialog/);
 assert.match(runtime, /ویژگی‌های تأییدشده \/ Verified attributes/);
 assert.match(runtime, /این منبع برای این نسخه و پلتفرم قیمتی منتشر نکرده است؛ عددی ساخته نمی‌شود\./);
 assert.match(runtime, /آمار تأییدشده‌ای برای این کارت در منبع وجود ندارد\./);
 assert.match(runtime, /📄 مشخصات/);
});

test('TypeScript runtime parses and every page references its Vite entry',()=>{
 const vm = require('node:vm');
 for(const p of PAGES) assert.match(shell[p.file], /src="\.\/src\/main\.ts"/, p.file);
 new vm.Script(runtime.replace(/^import .*$/gm, ''));
 const typedMarket = fs.readFileSync('src/market.ts', 'utf8');
 assert.match(typedMarket, /function showVerifiedCardPrice/);
 assert.match(typedMarket, /validatedPrice/);
 const vite = fs.readFileSync('vite.config.ts', 'utf8');
 for(const p of PAGES) assert.ok(vite.includes(p.file.replace('.html', '')), 'vite input missing for ' + p.file);
});

test('legacy FC26 sample data is not shipped',()=>{
  for(const name of ['OBJ_RAW','SBC_RAW','PLAYERS_RAW','EVO_RAW']) {
    assert.ok(html.includes('const '+name+'=[]'), name);
  }
  assert.doesNotMatch(html,/Festival of Football - Login Reward/);
  assert.doesNotMatch(html,/id="sec-games"|id="sec-wc"|id="bn-games"|id="bn-wc"/);
  assert.doesNotMatch(html,/const WC26_SQUADS|function renderWC/);
  assert.ok(html.includes('راهنمای انجام'));
  assert.ok(html.includes('FC27_FA'));
});

test('FC27 sourced objectives and SBC feed has real detail URLs',()=>{
 const data=JSON.parse(fs.readFileSync('data/fc27-challenges.json','utf8'));
 assert.equal(data.source,'FUT.GG');
 for(const group of ['objectives','sbc']){
  assert.ok(data.sections[group].length>=3);
  for(const item of data.sections[group]){
   assert.ok(item.name.length>=4);
   assert.equal(new URL(item.url).hostname,'www.fut.gg');
   assert.ok(!/^(Objectives|Live Events|Streamlined SBC SolverNew|1Expiring Soon)$/.test(item.name));
  }
 }
});

test('bilingual FC27 guides and local progress persistence',()=>{
 assert.match(html,/FC27_EN_GUIDES/);
 assert.match(html,/FC27_EN_OBJECTIVES/);
 assert.match(html,/fc27-guide-lang/);
 assert.match(html,/fc27-guide-progress/);
 assert.match(html,/aria-pressed/);
 assert.match(html,/guideFC27\(kind,rec\)/);
 assert.match(html,/fc27EnglishGuide\(kind,rec\)/);
});

test('challenge details remain in-site and portrait lookup is lazy',()=>{
 assert.match(html,/function openFC27Details\(kind,rec\)/);
 assert.match(html,/fc27-detail-overlay/);
 assert.match(html,/openFC27Details\(kind,rec\)/);
 assert.match(html,/function observePlayerPortraits\(/);
 assert.match(html,/Wikimedia unavailable/);
 assert.doesNotMatch(html,/جزئیات چالش ↗/);
});

test('verified FC27 evolutions contain accurate detailed levels',()=>{
 const d=JSON.parse(fs.readFileSync('data/fc27-evolutions.json','utf8'));
 assert.ok(d.evolutions.length>=8);
 const intro=d.evolutions.find(x=>x.name==='Intro to Evolutions');
 assert.ok(intro&&intro.levels.length===3);
 assert.equal(intro.levels.map(l=>l.tasks.length).reduce((a,b)=>a+b,0),3);
 for(const evo of d.evolutions){
  assert.match(new URL(evo.url).pathname,/^\/evolutions\/\d+-[a-z0-9-]+\/$/);
  assert.ok(evo.levels?.length,'levels missing for '+evo.name);
 }
 const flat=d.evolutions.flatMap(x=>x.levels||[]);
 assert.ok(flat.filter(l=>l.tasks?.length||l.upgrades?.length||l.options?.length).length>=flat.length*0.9,'most levels must carry detail');
 for(const level of flat)assert.match(level.name,/^Level \d+$/);
 assert.ok(d.evolutions.some(x=>x.levels.some(l=>l.options?.length&&l.pick_one)),'pathway options must be kept separate');
 assert.ok(d.evolutions.filter(x=>x.levels.some(l=>l.tasks?.length)).length>=8);
 assert.ok(d.evolutions.some(x=>x.requirements?.length&&x.details?.length));
});
test('verified SBC segments and objective tasks are available in-site',()=>{
 const d=JSON.parse(fs.readFileSync('data/fc27-challenges.json','utf8'));
 assert.ok(d.sections.objectives.length>=20&&d.sections.sbc.length>=15);
 for(const item of [...d.sections.objectives,...d.sections.sbc]){
  assert.match(new URL(item.url).pathname,/^\/(?:objectives|sbc)\/[a-z-]+\/[a-z0-9-]+\/$/);
  assert.ok(!/FUT\.GG$/.test(item.name),'listing page stored as a record: '+item.name);
 }
 for(const obj of d.sections.objectives){
  assert.ok(obj.tasks?.length,'objectives must carry tasks');
  for(const task of obj.tasks)assert.ok(task.name&&task.description&&task.reward,task.name);
 }
 for(const sbc of d.sections.sbc){
  assert.ok(sbc.squads?.length,'SBC must carry segments');
  for(const seg of sbc.squads)assert.ok(seg.name&&seg.requirements?.length,seg.name);
  assert.equal(sbc.price,null,'coin costs are client-rendered and must not be guessed');
 }
 assert.match(html,/function loadVerifiedEvolutions/);
 assert.match(html,/مراحل تکامل \/ Evolution levels/);
 assert.match(html,/مأموریت‌های دقیق \/ Objective tasks/);
});

// Persian guidance is required on every structured field. A reward may stay in English only when it is a bare
// proper noun (a player or PlayStyle name the source never labels), so its coverage is asserted as a ratio.
test('every objective, SBC and evolution carries Persian guidance',()=>{
 const fa = new RegExp('[\\u0600-\\u06FF]');
 const challenges = JSON.parse(fs.readFileSync('data/fc27-challenges.json', 'utf8'));
 const tasks = challenges.sections.objectives.flatMap(o => o.tasks || []);
 for(const objective of challenges.sections.objectives){
  assert.ok(fa.test(objective.nameFA || ''), 'objective nameFA: ' + objective.name);
  if(objective.description) assert.ok(fa.test(objective.descriptionFA || ''), 'objective descriptionFA: ' + objective.name);
 }
 for(const task of tasks){
  assert.ok(fa.test(task.nameFA || ''), 'task nameFA: ' + task.name);
  assert.ok(fa.test(task.descriptionFA || ''), 'task descriptionFA: ' + task.name);
  assert.ok(task.rewardFA === undefined || typeof task.rewardFA === 'string', 'task rewardFA shape: ' + task.name);
 }
 assert.ok(tasks.filter(t => fa.test(t.rewardFA)).length >= tasks.length * 0.95, 'reward prose must be translated');
 for(const sbc of challenges.sections.sbc){
  assert.ok(fa.test(sbc.nameFA || ''), 'sbc nameFA: ' + sbc.name);
  if(sbc.description) assert.ok(fa.test(sbc.descriptionFA || ''), 'sbc descriptionFA: ' + sbc.name);
  for(const segment of sbc.squads || []){
   assert.ok(fa.test(segment.nameFA || ''), 'segment nameFA: ' + segment.name);
   assert.ok(fa.test(segment.descriptionFA || ''), 'segment descriptionFA: ' + segment.name);
   assert.equal(segment.requirementsFA?.length, segment.requirements.length, 'segment requirementsFA: ' + segment.name);
   assert.ok(segment.requirementsFA.every(text => fa.test(text)), 'segment requirementsFA prose: ' + segment.name);
  }
 }
 const evolutions = JSON.parse(fs.readFileSync('data/fc27-evolutions.json', 'utf8'));
 for(const evo of evolutions.evolutions){
  assert.ok(fa.test(evo.nameFA || ''), 'evolution nameFA: ' + evo.name);
  assert.ok(fa.test(evo.descriptionFA || ''), 'evolution descriptionFA: ' + evo.name);
  if(evo.requirements?.length) assert.equal(evo.requirementsFA?.length, evo.requirements.length, 'evolution requirementsFA: ' + evo.name);
  if(evo.details?.length) assert.equal(evo.detailsFA?.length, evo.details.length, 'evolution detailsFA: ' + evo.name);
  for(const level of evo.levels){
   assert.ok(fa.test(level.nameFA || ''), 'level nameFA: ' + evo.name + ' ' + level.name);
   if(level.tasks?.length) assert.equal(level.tasksFA?.length, level.tasks.length, 'level tasksFA: ' + evo.name);
   if(level.upgrades?.length) assert.equal(level.upgradesFA?.length, level.upgrades.length, 'level upgradesFA: ' + evo.name);
   for(const option of level.options || []){
    assert.ok(fa.test(option.nameFA || ''), 'option nameFA: ' + evo.name);
    assert.equal(option.upgradesFA?.length, option.upgrades.length, 'option upgradesFA: ' + evo.name);
   }
  }
 }
});

test('the localisation tables and rules survive a re-scrape',()=>{
 const rules = fs.readFileSync('scripts/lib/fa.cjs', 'utf8');
 const table = fs.readFileSync('scripts/lib/fa-text.cjs', 'utf8');
 const challenges = fs.readFileSync('scripts/sync-fc27-challenges.cjs', 'utf8');
 const evolutions = fs.readFileSync('scripts/sync-fc27-evolutions.cjs', 'utf8');
 assert.match(table, /const TABLES = \{ objectives: OBJECTIVES, sbc: SBC, evolutions: EVOLUTIONS, tasks: TASKS \}/);
 for(const script of [challenges, evolutions]) assert.match(script, /require\('\.\/lib\/fa-text\.cjs'\)/);
 assert.match(challenges, /applyVerified\(task, 'tasks'\)/);
 assert.match(evolutions, /const applyVerified = target => \{/);
 assert.match(evolutions, /faText\('evolutions', target\.name\)/);
 assert.match(rules, /function faReward/);
});

test('the landing page names its sources and shows the official EA feed',()=>{
 assert.match(shell['index.html'], /class="verified-source-grid"/);
 assert.match(shell['index.html'], /id="officialNewsList"/);
 assert.match(shell['index.html'], /id="officialFeedStamp"/);
 for(const p of PAGES) if(p.file !== 'index.html'){
  assert.ok(!shell[p.file].includes('officialNewsList'), p.file + ' should not load the news feed');
 }
 assert.match(runtime, /if\(onPage\('obj'\)\)loadOfficialNews\(\)/);
 assert.match(runtime, /fetch\('\.\/data\/fc27-news\.json/);
 assert.doesNotMatch(runtime, /raw\.githubusercontent\.com/);
 const news = JSON.parse(fs.readFileSync('data/fc27-news.json', 'utf8'));
 assert.equal(news.source, 'Electronic Arts');
 assert.ok(news.items.length >= 3, 'the official feed must carry articles');
 for(const item of news.items){
  assert.equal(new URL(item.url).hostname, 'www.ea.com', item.url);
  assert.equal(item.source, 'Electronic Arts', item.title);
  // The card badge, date and summary are separate fields, so the headline never arrives glued to them.
  assert.doesNotMatch(item.title, /^(?:News Article|(?:January|February|March|April|May|June|July|August|September|October|November|December)\b)/);
  assert.match(item.published, /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/);
  assert.ok(item.summary.length > item.title.length, 'summary: ' + item.title);
 }
 // The site-wide integrity note must describe the live pipeline, not an unconnected one.
 for(const p of PAGES) assert.doesNotMatch(shell[p.file], /تا اتصال منبع تأییدشده نباید/);
});

test('a price provider outage warns while the retained snapshot is recent and fails once it ages out',()=>{
 const sync = fs.readFileSync('scripts/sync-fc27-prices-futgg.mjs', 'utf8');
 assert.match(sync, /FC27_PRICE_STALE_MINUTES/);
 assert.match(sync, /if \(age > staleAfterMinutes\) \{ annotate\('error', message\); process\.exitCode = 1; \}/);
 assert.match(sync, /else annotate\('warning', message\)/);
 assert.match(sync, /const snapshot = JSON\.parse\(readFileSync\(dest, 'utf8'\)\)/);
 // The outage path must never rewrite good data: the single write sits in the success branch.
 assert.equal(sync.split('writeFileSync(dest').length-1,1,'snapshot write must appear exactly once');
 assert.ok(sync.indexOf('writeFileSync(dest') < sync.indexOf('catch (error)'),'the snapshot must only be written on a successful refresh');
});

test('every published card price is sourced, timestamped and matchable',()=>{
 const feed=JSON.parse(fs.readFileSync('data/fc27-prices.json','utf8'));
 const ids=new Set(JSON.parse(fs.readFileSync('data/fc27-players.json','utf8')).players.map(p=>String(p.id)));
 assert.equal(feed.source,'fut.gg');
 assert.ok(feed.prices.length>0,'price snapshot is empty');
 assert.ok(Number.isInteger(feed.verification_window_minutes)&&feed.verification_window_minutes>0);
 const matchable=feed.prices.filter(q=>ids.has(q.cardId)).length;
 assert.ok(matchable/feed.prices.length>=0.95,'quotes do not resolve to known players');
 for(const quote of feed.prices){
  assert.ok(['pc','ps','xbox'].includes(quote.platform),quote.platform);
  // cardId is the EA player id the site can display; versionId is the FC27 card
  // version FUT.GG prices. They differ whenever FUT.GG does not reuse the player id.
  assert.ok(ids.has(quote.cardId),'quote does not resolve to a known player: '+quote.cardId);
  assert.match(quote.versionId,/^\d+$/,'versionId: '+quote.versionId);
  assert.ok(Number.isInteger(quote.coins)&&quote.coins>0,quote.coins);
  const source = new URL(quote.sourceUrl);
  assert.equal(source.hostname,'www.fut.gg');
  assert.ok(source.pathname.includes('/27-'+quote.versionId+'/'),'sourceUrl must name the priced FC27 version: '+quote.sourceUrl);
  assert.equal(quote.status,'verified');
  assert.ok(!Number.isNaN(Date.parse(quote.checkedAt)));
 }
});

test('the card-art index only lists verified FC27 artwork paths',()=>{
 const art=JSON.parse(fs.readFileSync('data/fc27-card-art.json','utf8'));
 const ids=new Set(JSON.parse(fs.readFileSync('data/fc27-players.json','utf8')).players.map(p=>String(p.id)));
 assert.equal(art.source,'game-assets.fut.gg');
 assert.ok(Object.keys(art.art).length>5000,'card-art index is too small');
 for(const [id,hash] of Object.entries(art.art)){
  assert.ok(ids.has(id),'card art for unknown player '+id);
  assert.match(hash,/^[0-9a-f]{64}$/,'bad hash for '+id);
 }
 const main=fs.readFileSync('src/main.ts','utf8');
 assert.match(main,/futgg-player-item-card\/27-\$\{id\}\.\$\{hash\}\.webp/);
 assert.match(main,/loadCardArtIndex\(\)/);
});

test('indexed portraits resolve to a committed current-edition file',()=>{
 const index=JSON.parse(fs.readFileSync('data/available-portraits.json','utf8'));
 const provenance=JSON.parse(fs.readFileSync('data/external-portraits.json','utf8'));
 const files=new Set(fs.readdirSync('img/players'));
 assert.equal(index.count,index.ids.length);
 for(const id of index.ids)assert.ok(files.has((index.files&&index.files[String(id)])||id+'.png'),'missing '+id);
 for(const [id,entry] of Object.entries(provenance.images)){
  assert.ok(files.has(id+'.png'),'CDN portrait '+id+' was not committed');
  assert.equal(new URL(entry.source).hostname,'cdn.futbin.com');
  assert.match(entry.source,/\/content\/fifa27\/img\/players\/\d+\.png$/);
 }
});

test('the committed pages are exactly what scripts/build-pages.mjs composes',()=>{
 const flat = value => value.replace(/\s+/g, ' ').trim();
 const bodies = { 'index.html': 'objectives.html', 'sbc.html': 'sbc.html', 'players.html': 'players.html', 'dns.html': 'dns.html', 'evolutions.html': 'evolutions.html' };
 for(const p of PAGES){
  assert.ok(shell[p.file].includes('Generated by scripts/build-pages.mjs'), p.file + ' was hand-edited, not generated');
  const body = fs.readFileSync('pages/' + bodies[p.file], 'utf8');
  assert.ok(flat(shell[p.file]).includes(flat(body)), p.file + ' is out of date with pages/' + bodies[p.file]);
  assert.ok(flat(shell[p.file]).includes(flat(partial('overlays'))), p.file + ' is out of date with the overlays partial');
 }
 // The hero belongs to the landing page only.
 assert.ok(flat(shell['index.html']).includes(flat(partial('hero'))));
 assert.ok(!flat(shell['sbc.html']).includes(flat(partial('hero'))));
});
