import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('img/news');
fs.mkdirSync(outDir, { recursive: true });

const NEWS_GRAPHICS = [
  {
    file: 'launch-feedback.svg',
    title: 'LAUNCH FEEDBACK UPDATE',
    sub: 'GAMEPLAY · FUT · CAREER · CLUBS',
    cat: 'DEVELOPER UPDATE',
    c1: '#00FF87',
    c2: '#00A86B',
    accent: '#00FF87',
    icon: `<path d="M120 220 L160 180 L200 240 L240 160 L280 200 L320 150" fill="none" stroke="#00FF87" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
           <circle cx="320" cy="150" r="10" fill="#00FF87" filter="drop-shadow(0 0 10px #00FF87)"/>
           <rect x="140" y="270" width="160" height="40" rx="20" fill="rgba(0,255,135,0.15)" stroke="#00FF87" stroke-width="2"/>
           <text x="220" y="295" fill="#00FF87" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">SYSTEM STATUS: OPTIMAL</text>`
  },
  {
    file: 'future-stars.svg',
    title: 'FUTURE STARS ACADEMY',
    sub: 'NEXT GENERATION TALENT & EVOS',
    cat: 'FUT 27 EVENT',
    c1: '#00F0FF',
    c2: '#8B5CF6',
    accent: '#00F0FF',
    icon: `<polygon points="220,120 245,185 315,185 260,225 280,290 220,250 160,290 180,225 125,185 195,185" fill="url(#starGrad)" stroke="#00F0FF" stroke-width="3" filter="drop-shadow(0 0 20px rgba(0,240,255,0.8))"/>
           <circle cx="220" cy="205" r="30" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="6,4"/>`
  },
  {
    file: 'update-104.svg',
    title: 'TITLE UPDATE v1.0.4',
    sub: 'MATCHMAKING & BALL PHYSICS',
    cat: 'OFFICIAL PATCH',
    c1: '#3B82F6',
    c2: '#00FF87',
    accent: '#3B82F6',
    icon: `<circle cx="220" cy="210" r="70" fill="none" stroke="#3B82F6" stroke-width="6" stroke-dasharray="16,8"/>
           <path d="M220 165 L220 210 L255 235" fill="none" stroke="#00FF87" stroke-width="5" stroke-linecap="round"/>
           <circle cx="220" cy="210" r="10" fill="#00FF87"/>
           <rect x="150" y="300" width="140" height="32" rx="8" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
           <text x="220" y="321" fill="#FFF" font-size="13" font-weight="800" text-anchor="middle" font-family="monospace">BUILD: 1.0.4.79</text>`
  },
  {
    file: 'grounds-launch.svg',
    title: 'THE GROUNDS ARE OPEN',
    sub: 'STREET FOOTBALL & URBAN CAGES',
    cat: 'THE GROUNDS',
    c1: '#F59E0B',
    c2: '#EF4444',
    accent: '#F59E0B',
    icon: `<polygon points="150,280 220,140 290,280" fill="none" stroke="#F59E0B" stroke-width="6" stroke-linejoin="round"/>
           <line x1="170" y1="240" x2="270" y2="240" stroke="#EF4444" stroke-width="4"/>
           <circle cx="220" cy="200" r="25" fill="#EF4444" opacity="0.8" filter="drop-shadow(0 0 15px #EF4444)"/>
           <path d="M120 310 L320 310" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>`
  },
  {
    file: 'update-103.svg',
    title: 'TITLE UPDATE v1.0.3',
    sub: 'TACTICAL REBALANCING & FIXES',
    cat: 'OFFICIAL PATCH',
    c1: '#10B981',
    c2: '#06B6D4',
    accent: '#10B981',
    icon: `<rect x="150" y="140" width="140" height="150" rx="16" fill="rgba(16,185,129,0.1)" stroke="#10B981" stroke-width="4"/>
           <line x1="175" y1="180" x2="265" y2="180" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
           <line x1="175" y1="215" x2="245" y2="215" stroke="#FFF" stroke-width="3" stroke-linecap="round"/>
           <line x1="175" y1="250" x2="225" y2="250" stroke="#06B6D4" stroke-width="3" stroke-linecap="round"/>
           <circle cx="270" cy="250" r="12" fill="#10B981"/>`
  },
  {
    file: 'fut-launch.svg',
    title: 'ULTIMATE TEAM 27',
    sub: 'SBC · REWARDS · LIVE MARKET',
    cat: 'FUT CORE',
    c1: '#F5B014',
    c2: '#EA580C',
    accent: '#F5B014',
    icon: `<polygon points="220,130 290,170 290,260 220,300 150,260 150,170" fill="url(#goldGrad)" stroke="#F5B014" stroke-width="4" filter="drop-shadow(0 0 25px rgba(245,176,20,0.6))"/>
           <text x="220" y="210" fill="#FFF" font-size="28" font-weight="900" text-anchor="middle" font-family="sans-serif">FUT</text>
           <text x="220" y="240" fill="#F5B014" font-size="20" font-weight="900" text-anchor="middle" font-family="sans-serif">27</text>
           <circle cx="220" cy="270" r="8" fill="#00FF87"/>`
  },
  {
    file: 'gameplay-update.svg',
    title: 'HYPERMOTION V PHYSICS',
    sub: 'SHOT TRAJECTORY & AI POSITIONING',
    cat: 'GAMEPLAY',
    c1: '#00FF87',
    c2: '#00F0FF',
    accent: '#00FF87',
    icon: `<circle cx="220" cy="210" r="50" fill="none" stroke="#00FF87" stroke-width="4"/>
           <path d="M150 250 Q220 130 290 250" fill="none" stroke="#00F0FF" stroke-width="6" stroke-linecap="round" filter="drop-shadow(0 0 12px #00F0FF)"/>
           <circle cx="220" cy="180" r="14" fill="#00FF87" filter="drop-shadow(0 0 10px #00FF87)"/>
           <line x1="170" y1="210" x2="270" y2="210" stroke="rgba(255,255,255,0.4)" stroke-dasharray="4,4"/>`
  },
  {
    file: 'career-update.svg',
    title: 'CAREER MODE DYNAMICS',
    sub: 'MANAGER TACTICS & PLAYER EVOLUTION',
    cat: 'CAREER MODE',
    c1: '#8B5CF6',
    c2: '#4F46E5',
    accent: '#8B5CF6',
    icon: `<path d="M160 270 L160 170 Q220 150 280 170 L280 270 Z" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" stroke-width="4"/>
           <polygon points="220,135 235,160 265,160 240,178 250,205 220,190 190,205 200,178 175,160 205,160" fill="#F5B014"/>
           <circle cx="220" cy="235" r="22" fill="#4F46E5" stroke="#FFF" stroke-width="2"/>
           <text x="220" y="242" fill="#FFF" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">MGR</text>`
  },
  {
    file: 'destined-glory.svg',
    title: 'DESTINED FOR GLORY',
    sub: 'COMMUNITY VOTED PROMO CARDS',
    cat: 'FUT PROMO',
    c1: '#EC4899',
    c2: '#F5B014',
    accent: '#EC4899',
    icon: `<polygon points="220,130 285,160 285,250 220,295 155,250 155,160" fill="url(#gloryGrad)" stroke="#EC4899" stroke-width="4" filter="drop-shadow(0 0 25px rgba(236,72,153,0.7))"/>
           <path d="M190 215 L210 235 L255 185" fill="none" stroke="#FFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  },
  {
    file: 'which-mode.svg',
    title: 'CHOOSE YOUR EXPERIENCE',
    sub: 'OFFLINE LEAGUES · COMPETITIVE · CLUBS',
    cat: 'GAME MODES',
    c1: '#14B8A6',
    c2: '#0EA5E9',
    accent: '#14B8A6',
    icon: `<circle cx="220" cy="210" r="65" fill="rgba(20,184,166,0.1)" stroke="#14B8A6" stroke-width="4"/>
           <polygon points="220,155 235,200 280,210 235,220 220,265 205,220 160,210 205,200" fill="#0EA5E9"/>
           <circle cx="220" cy="210" r="10" fill="#FFF"/>`
  },
  {
    file: 'grounds-clubs.svg',
    title: 'PRO CLUBS & GROUNDS',
    sub: 'CROSSPLAY · CUSTOM SKILLS · RANKINGS',
    cat: 'CLUBS',
    c1: '#6366F1',
    c2: '#8B5CF6',
    accent: '#6366F1',
    icon: `<circle cx="170" cy="180" r="22" fill="#6366F1" stroke="#FFF" stroke-width="2"/>
           <circle cx="270" cy="180" r="22" fill="#8B5CF6" stroke="#FFF" stroke-width="2"/>
           <circle cx="220" cy="245" r="28" fill="#00FF87" stroke="#FFF" stroke-width="3"/>
           <line x1="170" y1="180" x2="220" y2="245" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-dasharray="4,4"/>
           <line x1="270" y1="180" x2="220" y2="245" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-dasharray="4,4"/>`
  },
  {
    file: 'fut-beginners.svg',
    title: 'ULTIMATE TEAM 101',
    sub: 'STARTER PACKS · CHEMISTRY · FOUNDATIONS',
    cat: 'BEGINNERS GUIDE',
    c1: '#FBBF24',
    c2: '#00FF87',
    accent: '#FBBF24',
    icon: `<rect x="155" y="145" width="130" height="140" rx="14" fill="rgba(251,191,36,0.15)" stroke="#FBBF24" stroke-width="4"/>
           <path d="M220 180 L220 235 M190 210 L250 210" stroke="#00FF87" stroke-width="6" stroke-linecap="round"/>
           <circle cx="220" cy="260" r="6" fill="#FBBF24"/>`
  }
];

for (const g of NEWS_GRAPHICS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="50%" stop-color="#0D1322"/>
      <stop offset="100%" stop-color="#05080E"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${g.c1}"/>
      <stop offset="100%" stop-color="${g.c2}"/>
    </linearGradient>
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#713F12"/>
    </linearGradient>
    <linearGradient id="gloryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="800" height="450" fill="url(#bgGrad)"/>
  <rect width="800" height="450" fill="url(#grid)"/>

  <!-- Geometric Field Elements -->
  <circle cx="800" cy="0" r="320" fill="${g.accent}" opacity="0.08" filter="blur(60px)"/>
  <circle cx="200" cy="450" r="280" fill="${g.c2}" opacity="0.06" filter="blur(80px)"/>

  <path d="M -50 450 L 350 -50" stroke="rgba(255,255,255,0.03)" stroke-width="80"/>
  <path d="M 480 500 L 850 130" stroke="${g.accent}" stroke-width="2" opacity="0.25"/>

  <!-- Left/Center Graphic Feature -->
  <g transform="translate(20, 10)">
    <circle cx="220" cy="215" r="140" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    ${g.icon}
  </g>

  <!-- Divider Slashes -->
  <polygon points="410,50 440,50 410,400 380,400" fill="url(#brandGrad)" opacity="0.3"/>
  <polygon points="435,50 450,50 420,400 405,400" fill="${g.accent}" opacity="0.9"/>

  <!-- Right Information Block -->
  <g transform="translate(460, 60)">
    <!-- Category Pill -->
    <rect x="0" y="30" width="160" height="28" rx="14" fill="rgba(255,255,255,0.08)" stroke="${g.accent}" stroke-width="1.5"/>
    <text x="80" y="49" fill="${g.accent}" font-size="11" font-weight="900" letter-spacing="1.5" text-anchor="middle" font-family="sans-serif">${g.cat}</text>

    <!-- Main Title -->
    <text x="0" y="115" fill="#FFFFFF" font-size="28" font-weight="900" font-family="'Segoe UI', -apple-system, sans-serif" letter-spacing="0.5">${g.title}</text>

    <!-- Subtitle -->
    <text x="0" y="150" fill="rgba(255,255,255,0.65)" font-size="13" font-weight="700" font-family="sans-serif" letter-spacing="1">${g.sub}</text>

    <!-- Official Badge -->
    <g transform="translate(0, 195)">
      <rect x="0" y="0" width="280" height="54" rx="12" fill="rgba(12,17,26,0.85)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="28" cy="27" r="14" fill="${g.accent}"/>
      <text x="28" y="33" fill="#000" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">✓</text>
      <text x="52" y="24" fill="#FFFFFF" font-size="12" font-weight="800" font-family="sans-serif">EA SPORTS FC™ 27</text>
      <text x="52" y="42" fill="rgba(255,255,255,0.5)" font-size="10" font-weight="600" font-family="sans-serif">OFFICIAL DISPATCH · ELECTRONIC ARTS</text>
    </g>
  </g>

  <!-- Bottom Accent Stripe -->
  <rect x="0" y="442" width="800" height="8" fill="url(#brandGrad)"/>
</svg>`;
  fs.writeFileSync(path.join(outDir, g.file), svg, 'utf8');
}
console.log('Successfully generated 12 news graphic assets into img/news/');
