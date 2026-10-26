// Deterministic Persian localiser for the wording FUT.GG publishes in FC27 challenge data.
// A string only gets Persian when a rule covers its whole shape; anything else returns '' so the UI
// falls back to the source text instead of showing a partial guess. Marketing prose is never paraphrased.
const DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const digits = value => String(value).replace(/[0-9]/g, d => DIGITS[+d]);
const PERSIAN = /[؀-۾]/;

const QUALITY = { Gold: 'طلایی', Silver: 'نقره‌ای', Bronze: 'برنزی' };
const DIFFICULTY = {
  'any': 'دلخواه', 'Rookie': 'تازه‌کار', 'Semi Pro': 'نیمه‌حرفه‌ای', 'Semi-Pro': 'نیمه‌حرفه‌ای',
  'Professional': 'حرفه‌ای', 'World Class': 'کلاس جهانی', 'Legendary': 'افسانه‌ای', 'Easy': 'آسان',
};
const NATIONS = {
  Spanish: 'اسپانیایی', Argentinian: 'آرژانتینی', Brazilian: 'برزیلی', Portuguese: 'پرتغالی',
  Italian: 'ایتالیایی', French: 'فرانسوی', German: 'آلمانی', English: 'انگلیسی', Dutch: 'هلندی',
  Belgian: 'بلژیکی', Croatian: 'کروات', Norwegian: 'نروژی', Danish: 'دانمارکی', Mexican: 'مکزیکی',
  American: 'آمریکایی', USA: 'آمریکا',
};
const ATTRIBUTES = {
  OVR: 'امتیاز کلی', Pace: 'سرعت', 'Sprint Speed': 'سرعت اسپرینت', Acceleration: 'شتاب',
  Finishing: 'تمام‌کنندگی', 'Shot Power': 'قدرت شوت', 'Long Shots': 'شوت از راه دور', Volleys: 'والی',
  Penalties: 'پنالتی', 'Fk Accuracy': 'دقت ضربات آزاد', 'Free Kick Accuracy': 'دقت ضربات آزاد',
  Curve: 'کرن', Footwork: 'کار پا', 'Ball Control': 'کنترل توپ', Dribbling: 'دریبل',
  'Short Pass': 'پس کوتاه', 'Long Pass': 'پس بلند', 'Short Passing': 'پس کوتاه', 'Long Passing': 'پس بلند',
  Vision: 'دید', Crossing: 'سانتر', Agility: 'چابکی', Balance: 'تعادل', Reactions: 'واکنش',
  Stamina: 'استقامت', Strength: 'قدرت بدنی', Aggression: 'تندخویی', Jumping: 'پرش',
  'Heading Acc.': 'دقت سرزنی', 'Standing Tackle': 'تکل ایستاده', 'Sliding Tackle': 'تکل کشیده',
  Interceptions: 'قطع توپ', 'Defensive Awareness': 'آگاهی دفاعی', Positioning: 'پوزیشن‌گیری',
  Composure: 'خونسردی', 'Attack Positioning': 'پوزیشن حمله', 'Defensive Positioning': 'پوزیشن دفاع',
  'Skill Moves': 'مهارت‌های توپی', SM: 'مهارت‌های توپی', WF: 'پای ضعیف', Sprint: 'اسپرینت',
  'Long Passing': 'پس بلند', 'Weak Foot': 'پای ضعیف', 'Sprint Speed': 'سرعت اسپرینت',
};

function attribute(name) { return ATTRIBUTES[normalise(name)] || normalise(name); }
function normalise(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim(); }
function title(value) { return normalise(decode(value)); }

function translateKind(value) {
  const words = normalise(value).split(' ');
  const last = words[words.length - 1];
  if (words.length > 1 && NATIONS[last]) { words[words.length - 1] = NATIONS[last]; return words.join(' '); }
  return NATIONS[normalise(value)] || normalise(value);
}

// Simple word-level substitution for short connector phrases inside a captured condition.
const CONNECTORS = [
  [/\bplayer(?:s)?\b/gi, 'بازیکن'], [/\band\b/gi, 'و'], [/\bor\b/gi, 'یا'], [/\bfrom\b/gi, 'از'],
];
function phrase(value) {
  // "any Premier League team" has the noun last in English, so it needs its own reordering rule.
  let out = normalise(value).replace(/\bany\s+(.+?)\s+teams?\b/gi, 'هر تیم $1');
  for (const [pattern, word] of CONNECTORS) out = out.replace(pattern, word);
  return digits(translateKind(out));
}

/* ── Conditions lifted out of a task sentence and rendered as Persian adverbials ── */
const MODES = { Gallery: 'گالری', 'Squad Battles': 'Squad Battles' };
const MONTHS = {
  January: 'ژانویه', February: 'فوریه', March: 'مارس', April: 'آوریل', May: 'مه', June: 'ژوئن',
  July: 'ژوئیه', August: 'اوت', September: 'سپتامبر', October: 'اکتبر', November: 'نوامبر', December: 'دسامبر',
};
const monthName = value => MONTHS[normalise(value)] || title(value);
const CONDITIONS = [
  [/\busing a player from (.+)$/i, (nation) => 'با بازیکنی از ' + phrase(nation)],
  [/\band qualify for the (.+)$/i, (name) => 'و به «' + title(name) + '» راه پیدا کنید'],
  [/\bwhile having (?:min\.?|minimum|at least) ([\d,]+) player items? from (.+?) in your starting (?:11|XI)\b/i,
    (n, from) => 'با حداقل ' + digits(n) + ' آیتم بازیکن از ' + phrase(from) + ' در ترکیب اصلی'],
  [/\b(?:while having|with|having) (?:min\.?|minimum|at least) ([\d,]+) (.+?) player items? in your starting (?:11|XI)\b/i,
    (n, kind) => 'با حداقل ' + digits(n) + ' آیتم بازیکن ' + translateKind(kind) + ' در ترکیب اصلی'],
  [/\bwith a (Defender|Midfielder|Forward|Goalkeeper)\b/i,
    (pos) => 'با یک ' + ({ Defender: 'مدافع', Midfielder: 'هافبک', Forward: 'مهاجم', Goalkeeper: 'دروازه‌بان' }[pos])],
  [/\bwith (\d)\*? or higher WF players\b/i, (n) => 'با بازیکنانی با پای ضعیف ' + digits(n) + ' ستاره یا بالاتر'],
  [/\bin (one|a|an) match(?:es)?\b/i, () => 'در یک مسابقه'],
  [/\bin the (Season \d+[^.,]+?)(?:\.|$)/i, (name) => 'در «' + title(name) + '»'],
  [/\bwhile having at least ([\d,]+) player(?:s)? from (.+?) in your starting (?:11|XI)\b/i,
    (n, from) => 'با حداقل ' + digits(n) + ' بازیکن از ' + phrase(from) + ' در ترکیب اصلی'],
  [/\b(?:while having|with|having) (?:min\.?|minimum|at least) ([\d,]+) (.+?) player(?:s)? in your starting (?:11|XI)\b/i,
    (n, kind) => 'با حداقل ' + digits(n) + ' بازیکن ' + translateKind(kind) + ' در ترکیب اصلی'],
  [/\bwhile having the (.+?) equipped\b/i, (what) => 'در حالی که «' + title(what) + '» تجهیز شده است'],
  [/\busing your active EVO [Pp]layer in game\b/i, () => 'با بازیکن فعال تکامل'],
  [/\busing a (.+?) (Shot|goal|pass|header|volley)\b/i, (how, what) => 'با ' + (what === 'Shot' ? 'شوت ' : what === 'pass' ? 'پس ' : what === 'volley' ? 'والی ' : 'ضربه سر ') + title(how)],
  [/\bwith a through ball\b/i, () => 'با پاس از پشت (through ball)'],
  [/\b(?:using|with) a ((?:(?!\b(?:in|with|while|on|using|from)\b)[^.,;])+?) player\b/i,
    (kind) => 'با یک بازیکن ' + translateKind(kind)],
  [/\b(?:using|with) a (GK|CB|LB|RB|CDM|CM|CAM|LM|RM|LW|RW|ST|CF)\b/, (pos) => 'با یک بازیکن ' + pos],
  [/\bin ([\d,]+) separate matches\b/i, (n) => 'در ' + digits(n) + ' مسابقهٔ جداگانه'],
  [/\bin any ([A-Za-z ]+?) match(?:es)?\b/i, (mode) => 'در هر مسابقهٔ ' + title(mode)],
  [/\bin the (Season \d+: [^.,]+?(?:Exhibition|Challenge|Group))\b/i, (name) => 'در «' + title(name) + '»'],
  [/\bin the (Ones We Watched [A-Za-z -]+? Challenge)\b/i, (name) => 'در «' + title(name) + '»'],
  [/\bin the (Ultimate Gauntlet \d+)\b/i, (name) => 'در ' + title(name)],
  [/\bin the ([A-Z][\w' -]*?(?:Event|Tournament))\b/i, (name) => 'در «' + title(name) + '»'],
  [/\bby completing bonuses in (\w+)/i, (mode) => 'با کامل کردن بونوس‌های ' + mode],
  [/\bin (?:the )?(FUT Champions|Division Rivals|Squad Battles|Live Events|Rivals|Champions|Rush|Co-Op|Draft|Moments|Gallery|Squad Building)\b/i,
    (mode) => 'در ' + (MODES[title(mode)] || title(mode))],
  [/\b(?:in|on) (?:the )?Transfer Market\b/i, () => 'در Transfer Market'],
  [/\bin your squad\b/i, () => 'در ترکیب خود'],
  [/\bin ([\d,]+) match(?:es)?\b/i, (n) => 'در ' + digits(n) + ' مسابقه'],
  [/\bin any (?:FUT|Football Ultimate Team) game modes?\b/i, () => 'در هر حالت بازی FUT'],
  [/\bin any mode\b/i, () => 'در هر حالت بازی'],
  [/\bon (?:min\.?|minimum )?([A-Za-z -]+?) difficulty(?:\s*\(or ([^)]+)\))?/i,
    (level, alt) => 'روی سختی ' + (DIFFICULTY[normalise(level)] || title(level)) + (alt ? ' (یا ' + alt + ')' : '')],
  [/\bon any Set\b/i, () => 'روی هر ست'],
  [/\busing Buy Now\b/i, () => 'با Buy Now'],
  [/\bas a team\b/i, () => 'به‌صورت تیمی'],
  [/\bin a single ([A-Za-z0-9 .]+?) round(?:, (twice|three times))?/i,
    (name, times) => 'در یک راند ' + title(name) + (times === 'twice' ? '، دو بار' : times === 'three times' ? '، سه بار' : '')],
  [/\((?:or|and) ([^)]+)\)/i, (alt) => '(یا ' + alt + ')'],
];

function liftConditions(text) {
  const found = [];
  let core = text;
  for (const [pattern, build] of CONDITIONS) {
    core = core.replace(pattern, (...args) => {
      const translated = build(...args.slice(1, -2));
      // Conditions are re-ordered by where they appeared so the Persian reads like the English.
      if (translated) found.push({ at: args[args.length - 2], text: translated });
      return ' ';
    });
  }
  return { core: core.replace(/\s+/g, ' ').trim(), clauses: found.sort((a, b) => a.at - b.at).map(c => c.text) };
}

const AMOUNT_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function amount(value) {
  const key = normalise(value).toLowerCase().replace(/[,.]/g, '');
  if (key === 'both') return 'هر دو';
  if (key === 'any') return 'هر';
  if (key === 'a' || key === 'an') return 'یک';
  if (AMOUNT_WORDS[key]) return digits(AMOUNT_WORDS[key]);
  return digits(value);
}

/* ── Head frames: what is left once every condition has been lifted ── */
const VERBS = {
  play: 'بازی کنید', win: 'ببرید', 'compete in': 'بازی کنید', 'appear in': 'به میدان بروید',
};
const matchPhrase = count => amount(count) + ' مسابقه';
const EARN = { Stars: 'ستاره', Points: 'امتیاز', Coins: 'سکه', SP: 'SP' };
const UNITS = { sets: 'ست', bonuses: 'بونوس', evolutions: 'تکامل', objectives: 'مأموریت' };
const earnPhrase = value => {
  const match = /^([\d,.]+)\s+(.*)$/.exec(normalise(value));
  if (!match) return title(value);
  return digits(match[1]) + ' ' + (EARN[match[2]] || title(match[2]));
};
const HEADS = [
  [/^(?:score|assist)\s+(at least\s+)?([\d,]+|one|two|three|four|five|six|seven|eight|nine|ten)\s+goals?\s+from outside the box$/i,
    (atLeast, count) => (atLeast ? 'حداقل ' : '') + amount(count) + ' گل از بیرون محوطه به ثمر برسانید'],
  [/^(?:score|assist)\s+(at least\s+)?([\d,]+|one|two|three|four|five|six|seven|eight|nine|ten)\s+headers?$/i,
    (atLeast, count) => (atLeast ? 'حداقل ' : '') + amount(count) + ' ضربهٔ سر بزنید'],
  [/^win the (.+?)\s+(two|three|four|five|six|seven|eight|nine|ten|[\d,]+)\s+times$/i,
    (name, count) => '«' + title(name) + '» را ' + amount(count) + ' بار ببرید'],
  [/^win the (.+)$/i, (name) => '«' + title(name) + '» را ببرید'],
  [/^achieve ([\w-]+) rank in the (.+?)(?:\s+set)?$/i,
    (rank, name) => 'رتبهٔ ' + rank + ' را در «' + title(name) + '» بگیرید'],
  [/^complete (.+?)\s+(?:puzzle\s+)?SBC$/i, (name) => 'SBC «' + title(name) + '» را کامل کنید'],
  [/^(win|play|compete in|appear in)\s+(both|any|a|an|[\d,]+)\s+(.*?)\s*match(?:es)?$/i,
    (verb, count, kind) => matchPhrase(count) + (kind ? 'ٔ ' + title(kind) : '') + ' را ' + (VERBS[verb.toLowerCase()] || 'بازی کنید')],
  [/^(score|assist)\s+(at least\s+)?([\d,]+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.*?)\s*(goals?|times)$/i,
    (verb, atLeast, count, kind, unit) => {
      const head = (atLeast ? 'حداقل ' : '') + amount(count);
      if (/^times$/i.test(unit)) return head + ' بار گل بزنید';
      const extra = normalise(kind) ? ' ' + title(kind) : '';
      return /^assist/i.test(verb) ? head + ' پاس گل' + extra + ' بدهید' : head + ' گل' + extra + ' به ثمر برسانید';
    }],
  [/^(score|assist)$/i, (verb) => (/^score/i.test(verb) ? 'گل بزنید' : 'پاس گل بدهید')],
  [/^keep\s+([\d,]+)\s+clean sheets$/i, (n) => digits(n) + ' بار دروازهٔ خود را بسته نگه دارید (کلین‌شیت)'],
  [/^concede a goal$/i, () => 'یک گل دریافت کنید'],
  [/^earn\s+([\d,.]+)\s+(.*?)\s*(points|stars|coins|sp)$/i, (n, kind, unit) =>
    digits(n) + ' ' + (EARN[title(unit)] || title(unit)) + (normalise(kind) ? ' ' + title(kind) : '') + ' کسب کنید'],
  [/^build\s+([\d,.]+)\+\s+chemistry$/i, (n) => 'شیمی ترکیب را به ' + digits(n) + '+ برسانید'],
  [/^change your club'?s? (formation|name)$/i, (what) => what.toLowerCase() === 'formation' ? 'چیدمان باشگاه را تغییر دهید' : 'نام باشگاه را تغییر دهید'],
  [/^apply a (.+?) item$/i, (kind) => 'یک آیتم ' + title(kind) + ' را اعمال کنید'],
  [/^(list|buy)\s+([\d,.]+)\s+(?:player\s+)?(?:items?|player(?:s)?)$/i, (verb, n) => digits(n) + ' بازیکن را ' + (/^list/i.test(verb) ? 'لیست کنید' : 'خرید کنید')],
  [/^complete\s+(any\s+)?([\d,.]+)\s+(squad building challenge|SBC)\s+groups?$/i, (any, n) => (any ? 'هر ' : '') + digits(n) + ' گروه SBC را کامل کنید'],
  [/^complete\s+([\d,.]+)\s+(.*?)\s*(bonuses|evolutions|sets|objectives)$/i, (n, kind, unit) =>
    digits(n) + ' ' + UNITS[unit.toLowerCase()] + (kind ? ' ' + title(kind) : '') + ' را کامل کنید'],
  [/^fully complete the ['"]?([^'"]+?)['"]? objectives? group$/i, (name) => 'گروه مأموریت «' + title(name) + '» را به‌طور کامل تمام کنید'],
  [/^complete the (.+?) objective(?:\s+([\d,.]+)\s+times?)?$/i, (name, times) =>
    'مأموریت «' + title(name) + '» را کامل کنید' + (times ? ' — ' + digits(times) + ' بار' : '')],
  [/^complete the (.+?) (?:squad building challenge|SBC) group$/i, (name) => 'گروه SBC «' + title(name) + '» را کامل کنید'],
  [/^complete (.+?) challenges? to earn (.+)$/i, (name, reward) => 'چالش‌های ' + title(name) + ' را کامل کنید و ' + earnPhrase(reward) + ' بگیرید'],
  [/^complete the starter set and get familiar with the gallery$/i, () => 'ست Starter گالری را کامل کنید و با گالری آشنا شوید'],
  [/^earn gallery score and reach gallery level ([\d,.]+)$/i, (n) => 'با کسب Gallery Score به سطح ' + digits(n) + ' گالری برسید'],
  [/^reach gallery level ([\d,.]+)$/i, (n) => 'به سطح ' + digits(n) + ' گالری برسید'],
  [/^achieve rank ([\w-]+)$/i, (rank) => 'رتبه ' + rank + ' بگیرید'],
  [/^grade any set .*$/i, () => 'هر ست گالری را ارزیابی کنید و کیفیت ترکیب خود را بسنجید', ['در گالری']],
  [/^win both matches$/i, () => 'هر دو مسابقه را ببرید'],
];

function faTask(text) {
  const sentence = title(text).replace(/[.!]+$/, '');
  if (!sentence) return '';
  const { core, clauses } = liftConditions(sentence);
  for (const [pattern, build, suppress] of HEADS) {
    const match = pattern.exec(core);
    if (!match) continue;
    const predicate = build(...match.slice(1));
    if (!predicate || !PERSIAN.test(predicate)) return '';
    // A frame that already words a condition into its sentence must not repeat it as an adverbial.
    const extra = clauses.filter(clause => !(suppress || []).includes(clause) && !predicate.includes(clause));
    return [predicate, ...extra].join('، ') + '.';
  }
  return '';
}

/* ── Squad requirements ── */
const REQUIREMENTS = [
  [/^Rating: Min\. ([\d,]+) player(?:s)? rated ([\d,]+)\+$/i, (n, r) => 'حداقل ' + digits(n) + ' بازیکن با امتیاز ' + digits(r) + '+'],
  [/^Rating: Min\. ([\d,]+) player(?:s)? rated ([\d,]+) or lower$/i, (n, r) => 'حداقل ' + digits(n) + ' بازیکن با امتیاز ' + digits(r) + ' یا کمتر'],
  [/^Rating: Min\. ([\d,]+)$/i, (n) => 'حداقل امتیاز بازیکن: ' + digits(n)],
  [/^Rating: Max\. ([\d,]+)$/i, (n) => 'حداکثر امتیاز بازیکن: ' + digits(n)],
  [/^Rating: ([\d,]+) to ([\d,]+)$/i, (a, b) => 'امتیاز بازیکن بین ' + digits(a) + ' تا ' + digits(b)],
  [/^Team rating: (Min|Max)\. ([\d,]+)$/i, (b, n) => (b === 'Min' ? 'حداقل' : 'حداکثر') + ' امتیاز تیم: ' + digits(n)],
  [/^Team chemistry: Min\. ([\d,]+)$/i, (n) => 'حداقل شیمی تیم: ' + digits(n)],
  [/^Chemistry: Min\. ([\d,]+)$/i, (n) => 'حداقل شیمی: ' + digits(n)],
  [/^Players: ([\d,]+)$/i, (n) => 'تعداد بازیکنان: ' + digits(n)],
  [/^Players: Min\. ([\d,]+)$/i, (n) => 'حداقل ' + digits(n) + ' بازیکن'],
  [/^Rare player(?:s)?: Min\. ([\d,]+)$/i, (n) => 'حداقل ' + digits(n) + ' بازیکن کمیاب (Rare)'],
  [/^Quality: Min\. ([\d,]+) (Gold|Silver|Bronze) player(?:s)?$/i, (n, q) => 'حداقل ' + digits(n) + ' بازیکن ' + QUALITY[q]],
  [/^Quality: Min\. (Gold|Silver|Bronze)$/i, (q) => 'حداقل کیفیت: بازیکن ' + QUALITY[q]],
  [/^Quality: (Gold|Silver|Bronze) only$/i, (q) => 'فقط بازیکن ' + QUALITY[q]],
  [/^Leagues: (Exactly|Min)\.?\s*([\d,]+)$/i, (b, n) => (b === 'Exactly' ? 'دقیقاً ' : 'حداقل ') + digits(n) + ' لیگ'],
  [/^Nations: (Exactly|Min)\.?\s*([\d,]+)$/i, (b, n) => (b === 'Exactly' ? 'دقیقاً ' : 'حداقل ') + digits(n) + ' ملیت'],
  [/^Same (league|nation|club): (Max|Min)\. ([\d,]+) player(?:s)?$/i, (what, b, n) => (b === 'Max' ? 'حداکثر ' : 'حداقل ') + digits(n) + ' بازیکن از یک ' + scope(what)],
  [/^Clubs: Max\. ([\d,]+)$/i, (n) => 'حداکثر ' + digits(n) + ' باشگاه'],
  [/^Club: Min\. ([\d,]+) player(?:s)? from (.+)$/i, (n, from) => 'حداقل ' + digits(n) + ' بازیکن از ' + phrase(from)],
  [/^League: (.+)$/i, (v) => 'لیگ: ' + title(v)],
  [/^Excluded Position: (.+)$/i, (v) => 'پست مجاز نیست: ' + v],
  [/^Max Pos\.?: ([\d,]+)$/i, (n) => 'حداکثر پست: ' + digits(n)],
  [/^Position: (.+)$/i, (v) => 'پست: ' + v],
  [/^Overall: (Max|Min)\. ([\d,]+)$/i, (b, n) => (b === 'Max' ? 'حداکثر' : 'حداقل') + ' امتیاز کلی: ' + digits(n)],
  [/^Max PS: ([\d,]+)$/i, (n) => 'حداکثر PlayStyle-plus: ' + digits(n)],
  [/^Max PS\+: ([\d,]+)$/i, (n) => 'حداکثر PlayStyle+: ' + digits(n)],
  [/^Rarity: (.+)$/i, (v) => 'کمیابی: ' + title(v)],
  [/^Born (After|Before): ([\d-]+)$/i, (b, d) => (b === 'After' ? 'متولد بعد از ' : 'متولد قبل از ') + digits(d)],
  [/^Pace: (Max|Min)\. ([\d,]+)$/i, (b, n) => 'سرعت: ' + (b === 'Max' ? 'حداکثر ' : 'حداقل ') + digits(n)],
  [/^Coins Cost: (.+)$/i, (v) => 'هزینهٔ سکه: ' + cost(v)],
  [/^Points Cost: (.+)$/i, (v) => 'هزینهٔ امتیاز: ' + cost(v)],
  [/^(.+?): (Max|Min)\. ([\d,]+)$/i, (k, b, n) => attribute(k) + ': ' + (b === 'Max' ? 'حداکثر ' : 'حداقل ') + digits(n)],
];
const COSTS = { free: 'رایگان' };
const cost = value => {
  const key = normalise(value).toLowerCase();
  if (COSTS[key]) return COSTS[key];
  return /^[\d,.]+$/.test(normalise(value)) ? digits(normalise(value)) : title(value);
};
const DURATIONS = { hour: 'ساعت', hours: 'ساعت', minute: 'دقیقه', minutes: 'دقیقه', day: 'روز', days: 'روز' };
function faDuration(value) {
  const match = /^([\d,.]+)\s+(\w+)$/.exec(normalise(value));
  if (!match) return '';
  const unit = DURATIONS[match[2].toLowerCase()];
  return unit ? digits(match[1]) + ' ' + unit : '';
}
const scope = word => ({ league: 'لیگ', nation: 'ملیت', club: 'باشگاه' }[word.toLowerCase()] || word);

function faRequirement(text) {
  const value = title(text);
  for (const [pattern, build] of REQUIREMENTS) {
    const match = pattern.exec(value);
    if (!match) continue;
    const out = build(...match.slice(1));
    if (out && PERSIAN.test(out)) return out;
  }
  return '';
}

/* ── Segment and record descriptions (SBC / objective summaries) ── */
// Card series names that can follow "Earn a special …". An unknown series makes the rule bail so the
// UI shows the English source rather than splitting a name at the wrong word.
const CARD_SERIES = ['Future Stars', 'Future Icon', 'Flashback', 'Heroes of the Village', 'Team of the Season', 'TOTW'];
// "(see Reward Details)" is a UI pointer, not part of the sentence.
const REWARD_NOTE = /\(\s*see reward details\s*\)\s*\.?/i;
const andList = value => normalise(value).replace(/,\s*/g, '، ').replace(/\s+and\s+/gi, ' و ');
const specialCard = (rest) => {
  const series = CARD_SERIES.find(name => normalise(rest).startsWith(name));
  if (!series) return '';
  const player = normalise(rest).slice(series.length).trim();
  if (!player) return '';
  return 'کارت ویژهٔ «' + series + ' ' + player + '» را بگیرید';
};
const SEGMENTS = [
  [/^Earn a special (.+)$/, specialCard],
  [/^Earn the (.+?) Player of the Month for (\w+)$/i, (league, month) => 'کارت بهترین بازیکن ماه ' + monthName(month) + ' از لیگ ' + title(league) + ' را بگیرید'],
  [/^Earn a (.+?) Pick between (.+?)$/i, (name, options) => 'پیک «' + title(name) + '» را از میان ' + andList(options) + ' بگیرید'],
  [/^Earn ([\d,]+) of ([\d,]+) ([\w ]+) Player Items?, between (.+)$/i, (a, b, tier, options) => 'یکی از ' + digits(b) + ' کارت ' + describeModifiers(tier) + ' را از میان ' + andList(options) + ' بگیرید'],
  [/^Earn a pack containing ([\d,]+) ([\w ]+) Player Items?, rated ([\d,]+) or higher$/i,
    (n, tier, r) => 'بستهٔ شامل ' + digits(n) + ' بازیکن ' + (QUALITY[normalise(tier)] || title(tier)) + ' با امتیاز ' + digits(r) + ' یا بالاتر را بگیرید'],
  [/^Earn a pack containing ([\d,]+) ([\w ]+) Player Item, rated ([\d,]+) or higher, from TOTW ([\d,]+) to ([\d,]+)$/i,
    (n, tier, r, a, b) => 'بستهٔ شامل ' + digits(n) + ' بازیکن ' + title(tier) + ' با امتیاز ' + digits(r) + ' یا بالاتر از TOTW ' + digits(a) + ' تا ' + digits(b) + ' را بگیرید'],
  [/^Earn a pack containing ([\d,]+) ([\w ]+) Player Item, from TOTW ([\d,]+) to ([\d,]+)$/i,
    (n, tier, a, b) => 'بستهٔ شامل ' + digits(n) + ' بازیکن ' + title(tier) + ' از TOTW ' + digits(a) + ' تا ' + digits(b) + ' را بگیرید'],
  [/^Exchange (Gold|Silver|Bronze) items for rewards$/i, (tier) => 'آیتم‌های ' + QUALITY[tier] + ' را برای جایزه ثبت کنید'],
  [/^Exchange a full squad with a maximum OVR of ([\d,]+)(?: and a minimum Team Chemistry rating of ([\d,]+))?$/i,
    (max, chem) => 'ترکیب کاملی با حداکثر امتیاز ' + digits(max) + (chem ? ' و حداقل شیمی تیم ' + digits(chem) : '') + ' ثبت کنید'],
  [/^Exchange a full squad with OVRs between ([\d,]+) and ([\d,]+)$/i, (a, b) => 'ترکیب کاملی با امتیاز بین ' + digits(a) + ' و ' + digits(b) + ' ثبت کنید'],
  [/^Exchange ([\d,]+) Player Items? with OVRs between ([\d,]+) and ([\d,]+)$/i, (n, a, b) => digits(n) + ' بازیکن با امتیاز بین ' + digits(a) + ' و ' + digits(b) + ' را ثبت کنید'],
  [/^Exchange ([\d,]+) Player Items? that is below ([\d,]+) OVR$/i, (n, r) => digits(n) + ' بازیکن با امتیاز کمتر از ' + digits(r) + ' را ثبت کنید'],
  [/^Exchange a squad themed around (.+?) and (.+?)$/i, (a, b) => 'ترکیبی با تم ' + title(a) + ' و ' + title(b) + ' ثبت کنید'],
  [/^Exchange a squad with (\w+) leagues and (\w+) nations$/i, (a, b) => 'ترکیبی با ' + wordNumber(a) + ' لیگ و ' + wordNumber(b) + ' ملیت ثبت کنید'],
  [/^Submit any (silver or bronze )?Player Items from your collection$/i, (tier) => 'هر بازیکن' + (tier ? ' (نقره‌ای یا برنزی)' : '') + ' از کالکشن خود را ثبت کنید'],
  [/^Submit any player(?:s)? from your collection to earn rewards$/i, () => 'هر بازیکنی از کالکشن خود را برای دریافت جایزه ثبت کنید'],
  [/^Submit Player Items from (.+)$/i, (where) => 'بازیکنانی از ' + title(where) + ' ثبت کنید'],
  [/^Submit ([\d,.]+) Score to earn Rewards$/i, (n) => digits(n) + ' Score ثبت کنید تا جایزه بگیرید'],
  [/^Complete the (.+?) to earn (.+?)(?: \((.+?)\))?$/i, (task, reward, note) =>
    'چالش «' + title(task) + '» را کامل کنید و ' + title(reward) + ' را بگیرید' + (note ? ' (' + title(note) + ')' : '')],
  [/^Complete this challenge to earn a reward$/i, () => 'این چالش را کامل کنید و جایزه بگیرید'],
  [/^Complete challenges themed around (.+)$/i, (theme) => 'چالش‌های مرتبط با ' + title(theme) + ' را کامل کنید'],
  [/^Complete these ([\w-]+?)-based challenges to earn rewards$/i, (kind) => 'چالش‌های ' + kind + '-محور را کامل کنید و جایزه بگیرید'],
  [/^Learn how to multi-submit by completing this challenge and earn rewards$/i, () => 'با انجام این چالش، ثبت چندگانه (Multi-Submit) را بیاموزید و جایزه بگیرید'],
];
const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const wordNumber = value => digits(WORD_NUMBERS[normalise(value).toLowerCase()] || value);

function faSegment(text) {
  const withoutNote = title(text).replace(REWARD_NOTE, ' ');
  const value = normalise(withoutNote).replace(/[.!?]+$/, '');
  for (const [pattern, build] of SEGMENTS) {
    const match = pattern.exec(value);
    if (!match) continue;
    const out = build(...match.slice(1));
    if (out && PERSIAN.test(out)) return out + '.';
  }
  return '';
}

/* ── Evolution attribute and PlayStyle upgrades ── */
function faUpgrade(text) {
  const value = title(text);
  let match = /^\+\s*([\d,.]+)\s+(.+?)\s*(?:→\s*([\d,.]+))?$/i.exec(value);
  if (match) return '+' + digits(match[1]) + ' ' + attribute(match[2]) + (match[3] ? ' (به ' + digits(match[3]) + ')' : '');
  match = /^([A-Z]{2,3})\s+(.+?)\s*\+{1,2}$/.exec(value);
  if (match) return 'استایل بازی ' + title(match[2]) + ' (' + match[1] + ')' + (/\+\+$/.test(value) ? ' پلاس' : '');
  match = /^(.+?)\s*\+{1,2}$/.exec(value);
  if (match) return 'استایل بازی ' + title(match[1]) + (/\+\+$/.test(value) ? ' پلاس' : '');
  return '';
}

/* ── Reward labels, rebuilt in Persian head-first order rather than word-substituted ── */
const PACK_KINDS = [
  [/player(?:s)? pick\b/i, 'انتخاب بازیکن'],
  [/consumables? pack\b/i, 'بستهٔ آیتم مصرفی'],
  [/players? pack\b/i, 'بستهٔ بازیکن'],
  [/players? items?\b/i, 'بازیکن'],
  [/\bpack\b/i, 'بسته'],
];
const REWARD_SIZES = [
  ['Holographic', 'هولوگرافیک'], ['Untradeable', 'غیرقابل‌فروش'], ['Legendary', 'افسانه‌ای'],
  ['Electrum', 'الکترام'], ['Jumbo', 'ژامبو'], ['Mixed', 'مخلوط'], ['Regular', 'معمولی'],
  ['Base', 'پایه'], ['Small', 'کوچک'], ['Large', 'بزرگ'], ['Huge', 'غول‌آسا'], ['Mini', 'مینی'],
];
const REWARD_ITEMS = [
  [/^([\d,.]+) Ultimate Scream Tokens?$/i, (n) => digits(n) + ' توکن Ultimate Scream'],
  [/^(.+?)\s*\(Loan\)$/i, (name) => normalise(name) + ' (قرضی)'],
  [/^Ultimate Scream Stadium Theme$/i, () => 'تم ورزشگاه Ultimate Scream'],
  [/^Ultimate Scream Tifo$/i, () => 'تیفو Ultimate Scream'],
  [/^Adidas Cnxt25 Pro Ball$/i, () => 'توپ Adidas Cnxt25 Pro'],
  [/^Halloween Vip$/i, () => 'VIP هالووین'],
  [/^consumables?$/i, 'آیتم مصرفی'], [/^manager$/i, 'مربی'], [/^award$/i, 'جایزه'],
  [/^badges?$/i, 'بج'],
  [/^coin boost$/i, 'بوست سکه'], [/^evo unlock$/i, 'آنلاک تکامل'], [/^repeat delivery$/i, 'ارسال مجدد'],
  [/^(?:stadium )?stadium theme$/i, 'تم استادیوم'], [/^stadium tifo$/i, 'Tifo استادیوم'],
  [/^stadium background tifo$/i, 'Tifo پس‌زمینهٔ استادیوم'],
  [/^(.+?)\s+badges?$/i, (mods) => 'بج ' + describeModifiers(mods)],
  [/^([\d,.]+) (coins|points|sp)$/i, (n, unit) => digits(n) + ' ' + ({ coins: 'سکه', points: 'امتیاز', sp: 'SP' })[unit.toLowerCase()]],
];

// Known qualifier words are replaced in place; the rest is a brand name and stays Latin.
function describeModifiers(value) {
  let rest = normalise(value);
  const quality = /(\bGold\b|\bSilver\b|\bBronze\b)/i.exec(rest);
  if (quality) rest = rest.replace(quality[0], ' ').trim();
  const tags = [];
  for (const [word, label] of REWARD_SIZES) {
    const pattern = new RegExp('\\b' + word + '\\b', 'i');
    if (!pattern.test(rest)) continue;
    rest = rest.replace(pattern, ' ').trim();
    tags.push(label);
  }
  return normalise([QUALITY[quality && quality[1]] || '', ...tags, normalise(rest)].join(' '));
}

function rewardPart(raw) {
  const original = normalise(raw);
  for (const [pattern, label] of REWARD_ITEMS) {
    const match = pattern.exec(original);
    if (match) return typeof label === 'function' ? label(...match.slice(1)) : label;
  }
  let rest = original;
  let count = '';
  let stack = '';
  // "1 x x2 Gold Players Pack" stacks two multipliers, so the prefix is read until it stops matching.
  for (let depth = 0; depth < 2; depth++) {
    const found = /^([\d,.]+)\s*[xX]\s+/.exec(rest) || /^[xX](\d+)\s+/.exec(rest);
    if (!found) break;
    if (!count) count = digits(found[1]) + ' عدد ';
    else stack = digits(found[1]) + '× ';
    rest = rest.slice(found[0].length);
  }
  let match;
  let pick = '';
  match = /^(\d+)\s*of\s*(\d+)\s+/i.exec(rest);
  if (match) { pick = '(' + digits(match[1]) + ' از ' + digits(match[2]) + ')'; rest = rest.slice(match[0].length); }
  let rating = '';
  match = /^(\d+)\s*[-–]\s*(\d+)\b\s*/i.exec(rest);
  if (match) { rating = digits(match[1]) + ' تا ' + digits(match[2]); rest = rest.slice(match[0].length); }
  else {
    match = /^(\d+)\+\s*/.exec(rest);
    if (match) { rating = digits(match[1]) + '+'; rest = rest.slice(match[0].length); }
  }
  let kind = '';
  for (const [pattern, label] of PACK_KINDS) {
    if (!pattern.test(rest)) continue;
    kind = label;
    rest = rest.replace(pattern, ' ').trim();
    break;
  }
  if (!kind) return '';
  const quality = /(\bGold\b|\bSilver\b|\bBronze\b)/i.exec(rest);
  if (quality) rest = rest.replace(quality[0], ' ').trim();
  const modifiers = [];
  for (const [word, label] of REWARD_SIZES) {
    const pattern = new RegExp('\\b' + word + '\\b', 'i');
    if (!pattern.test(rest)) continue;
    rest = rest.replace(pattern, ' ').trim();
    if (!modifiers.includes(label)) modifiers.push(label);
  }
  // Whatever survives is a brand or league name (Future Stars, Premier League) and stays in Latin script.
  return normalise([count, kind, normalise(rest), QUALITY[quality && quality[1]] || '', stack, ...modifiers, rating, pick].filter(Boolean).join(' '));
}

function faReward(text) {
  const value = title(text);
  if (!value) return '';
  // Campaign rewards are often a bare summed amount ("7,000 total"); the unit is never stated, so none is invented.
  const total = /^([\d,.]+) total$/i.exec(value);
  if (total) return digits(total[1]) + ' در مجموع';
  // A published card can be a loan item; only that marker is translated, the player name is kept exactly as sourced.
  const loan = /^"?(.+?)"?\s*\(Loan\)$/i.exec(value);
  if (loan) return normalise(loan[1]) + ' (قرضی)';
  let changed = false;
  const out = value.split(/\s\+\s/).map(part => {
    const translated = rewardPart(part);
    if (translated && translated !== normalise(part)) changed = true;
    return translated || normalise(part);
  }).join(' + ');
  return changed ? out : '';
}

/* ── Short task titles that carry a number rather than a brand name ── */
const NAMES = [
  [/^([\d,.]+) Completions?$/i, (n) => digits(n) + ' بار کامل کردن'],
  [/^([\d,.]+) SBCs$/i, (n) => digits(n) + ' SBC'],
  [/^([\d,.]+) Rush Points$/i, (n) => digits(n) + ' امتیاز Rush'],
  [/^([\d,.]+) Stars$/i, (n) => digits(n) + ' ستاره'],
  [/^([\d,.]+) Buy Now$/i, (n) => digits(n) + ' خرید Buy Now'],
  [/^Level ([\d,.]+)$/i, (n) => 'سطح ' + digits(n)],
  [/^Option ([A-Z]{1,2})$/i, (letter) => 'گزینهٔ ' + letter],
  [/^(Play|Win|Score|Assist|List|Buy) (?:in )?([\d,.]+)$/i, (verb, n) =>
    digits(n) + ' ' + ({ play: 'مسابقه', win: 'برد', score: 'گل', assist: 'پاس گل', list: 'لیست', buy: 'خرید' })[normalise(verb).toLowerCase()]],
  [/^Complete (.+)$/i, (name) => 'کامل کردن ' + normalise(name).replace(/^['"]|['"]$/g, '')],
  [/^(Weekly|Daily) Objectives$/i, (kind) => (kind === 'Weekly' ? 'اهداف هفتگی' : 'اهداف روزانه')],
  [/^Seasonal Objectives?$/i, () => 'اهداف فصلی'],
  [/^Gallery (.+)$/i, (what) => 'گالری — ' + what],
  [/^(.+?) Milestone$/i, (name) => 'دستاورد ' + name],
  [/^(.+?) POTM (\w+)$/i, (league, month) => 'بهترین بازیکن ماه ' + monthName(month) + ' — ' + league],
  [/^(.+?) (Upgrade|Re-roll)$/i, (name, kind) => name + (kind === 'Upgrade' ? ' — ارتقا' : ' — Re-roll')],
  [/^(\d[xX]) ([\d,+]+) (Upgrade|Re-roll)$/i, (m) => m],
];

function faName(text) {
  const value = title(text);
  for (const [pattern, build] of NAMES) {
    const match = pattern.exec(value);
    if (!match) continue;
    const out = build(...match.slice(1));
    if (out && PERSIAN.test(out)) return out;
  }
  return '';
}

function decode(value) {
  return String(value == null ? '' : value)
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(+dec))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

module.exports = { digits, decode, title, faTask, faRequirement, faSegment, faUpgrade, faReward, faName, faDuration, attribute };
