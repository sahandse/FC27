// Shared readers for FUT.GG's server-rendered pages.
// Only text the source explicitly labels is returned; anything the page loads later client-side is reported as absent.
const { execFileSync } = require('node:child_process');

const base = 'https://www.fut.gg';
const userAgent = process.env.FC27_SOURCE_USER_AGENT ||
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function get(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : base + pathOrUrl;
  return execFileSync('curl', ['-fsL', '--max-time', '35', '-A', userAgent, url], { maxBuffer: 1 << 27 })
    .toString()
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&').replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&ndash;/g, '-')
    .replace(/&#(\d+);/g, (m, code) => String.fromCodePoint(Number(code)))
    .trim();
}

function plain(fragment) {
  return decodeEntities((fragment || '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
}

function readTitle(html, fallback) {
  const raw = (html.match(/<title>([^<]{4,140})<\/title>/i) || [])[1] || '';
  const title = plain(raw).replace(/\s*[-–]\s*EA SPORTS FC \d+.*$/i, '').replace(/\s*\|\s*FUT\.GG.*$/i, '').trim();
  return title || fallback;
}

function slugFrom(url) {
  const slug = decodeURIComponent(url.split('/').filter(Boolean).at(-1) || '');
  return slug.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Sections are `<div><h2|<h3>Heading</h2|</h3>…</div>` panels; each panel holds label/value rows or chips.
function panel(html, heading) {
  const match = new RegExp('<h([23])[^>]*>\\s*' + heading + '\\s*</h[23]>', 'i').exec(html);
  if (!match) return '';
  const after = html.slice(match.index + match[0].length);
  const stop = after.search(/<h[23][^>]*>/i);
  return after.slice(0, stop > 0 ? stop : 12000);
}

function readSubtitle(html) {
  return plain((html.match(/<p class="max-w-\[72ch\] text-sm leading-relaxed text-gray-300">([\s\S]{1,400}?)<\/p>/) || [])[1]);
}

function panelRows(html, heading) {
  const rows = [];
  for (const [, label, value] of panel(html, heading).matchAll(/<div class="text-sm text-gray-400[^"]*">([\s\S]{1,200}?)<\/div><div class="text-sm[^"]*">([\s\S]{1,240}?)<\/div>/g)) {
    const name = plain(label);
    const text = plain(value);
    if (name && text && text.length <= 160) rows.push({ label: name, value: text });
  }
  return rows;
}

function detailUrl(pathname) {
  try {
    const url = new URL(pathname, base);
    return url.hostname === 'www.fut.gg' ? base + url.pathname : '';
  } catch {
    return '';
  }
}

module.exports = { base, get, plain, decodeEntities, readTitle, readSubtitle, slugFrom, panel, panelRows, detailUrl };
