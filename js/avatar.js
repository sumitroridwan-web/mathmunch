/* ─────────────────────────────────────────────────────────────
   MathMunch Avatar System
   Generates inline SVG avatars with customisable characters,
   colours, accessories and backgrounds.
───────────────────────────────────────────────────────────── */

const AVATAR_BACKGROUNDS = [
  { id: 'sky',    hex: '#3B82F6', label: 'Sky Blue'   },
  { id: 'grape',  hex: '#8B5CF6', label: 'Grape'      },
  { id: 'mint',   hex: '#10B981', label: 'Mint'       },
  { id: 'flame',  hex: '#F97316', label: 'Flame'      },
  { id: 'rose',   hex: '#EC4899', label: 'Rose'       },
  { id: 'teal',   hex: '#06B6D4', label: 'Teal'       },
  { id: 'amber',  hex: '#F59E0B', label: 'Amber'      },
  { id: 'cherry', hex: '#EF4444', label: 'Cherry'     },
];

// Each palette: [main, light, dark, accent]
const AVATAR_TYPES = [
  {
    id: 'bear', label: 'Bear',
    palettes: [
      { name: 'Golden',    m: '#D97706', l: '#FDE68A', d: '#78350F', a: '#FCA5A5' },
      { name: 'Honey',     m: '#B45309', l: '#FCD34D', d: '#92400E', a: '#FCA5A5' },
      { name: 'Chocolate', m: '#78350F', l: '#D97706', d: '#451A03', a: '#FBBF24' },
      { name: 'Panda',     m: '#4B5563', l: '#F3F4F6', d: '#1F2937', a: '#FCA5A5' },
      { name: 'Cinnamon',  m: '#C2410C', l: '#FED7AA', d: '#7C2D12', a: '#FCA5A5' },
      { name: 'Lilac',     m: '#7C3AED', l: '#DDD6FE', d: '#4C1D95', a: '#FCA5A5' },
    ],
    draw(p) {
      return `
        <circle cx="22" cy="24" r="13" fill="${p.m}"/>
        <circle cx="22" cy="24" r="8"  fill="${p.l}"/>
        <circle cx="58" cy="24" r="13" fill="${p.m}"/>
        <circle cx="58" cy="24" r="8"  fill="${p.l}"/>
        <circle cx="40" cy="48" r="29" fill="${p.m}"/>
        <ellipse cx="40" cy="59" rx="14" ry="9.5" fill="${p.l}"/>
        <circle cx="31" cy="42" r="6.5" fill="white"/>
        <circle cx="32.5" cy="43" r="4.5" fill="#1C0D00"/>
        <circle cx="33.8" cy="41.5" r="1.6" fill="white"/>
        <circle cx="49" cy="42" r="6.5" fill="white"/>
        <circle cx="50.5" cy="43" r="4.5" fill="#1C0D00"/>
        <circle cx="51.8" cy="41.5" r="1.6" fill="white"/>
        <ellipse cx="40" cy="55.5" rx="4.5" ry="3" fill="${p.d}"/>
        <path d="M33 62 Q40 69 47 62" stroke="${p.d}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <ellipse cx="26" cy="54" rx="6.5" ry="4" fill="${p.a}" opacity=".6"/>
        <ellipse cx="54" cy="54" rx="6.5" ry="4" fill="${p.a}" opacity=".6"/>`;
    }
  },
  {
    id: 'cat', label: 'Cat',
    palettes: [
      { name: 'Ginger',   m: '#EA580C', l: '#FED7AA', d: '#7C2D12', a: '#FCA5A5' },
      { name: 'Ash',      m: '#6B7280', l: '#E5E7EB', d: '#374151', a: '#FDE68A' },
      { name: 'Midnight', m: '#1F2937', l: '#6B7280', d: '#111827', a: '#FCA5A5' },
      { name: 'Cream',    m: '#D4B483', l: '#FEF3C7', d: '#92400E', a: '#FCA5A5' },
      { name: 'Calico',   m: '#CA8A04', l: '#FEF9C3', d: '#78350F', a: '#FCA5A5' },
      { name: 'Lavender', m: '#7C3AED', l: '#EDE9FE', d: '#4C1D95', a: '#FCA5A5' },
    ],
    draw(p) {
      return `
        <polygon points="10,42 21,16 32,42" fill="${p.m}"/>
        <polygon points="48,42 59,16 70,42" fill="${p.m}"/>
        <polygon points="15,40 21,21 27,40" fill="${p.a}" opacity=".7"/>
        <polygon points="53,40 59,21 65,40" fill="${p.a}" opacity=".7"/>
        <circle cx="40" cy="48" r="26" fill="${p.m}"/>
        <ellipse cx="40" cy="58" rx="11" ry="7.5" fill="${p.l}"/>
        <circle cx="32" cy="42" r="6" fill="white"/>
        <ellipse cx="32" cy="43" rx="3.5" ry="4.5" fill="#1C0D00"/>
        <circle cx="33.5" cy="41" r="1.5" fill="white"/>
        <circle cx="48" cy="42" r="6" fill="white"/>
        <ellipse cx="48" cy="43" rx="3.5" ry="4.5" fill="#1C0D00"/>
        <circle cx="49.5" cy="41" r="1.5" fill="white"/>
        <ellipse cx="40" cy="55" rx="3.5" ry="2.5" fill="${p.a}" opacity=".9"/>
        <path d="M40 57 L40 60" stroke="${p.d}" stroke-width="1.5" fill="none"/>
        <path d="M34 61 Q40 66 46 61" stroke="${p.d}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <line x1="21" y1="57" x2="34" y2="55" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="21" y1="60" x2="34" y2="59" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="46" y1="55" x2="59" y2="57" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="46" y1="59" x2="59" y2="60" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>`;
    }
  },
  {
    id: 'robot', label: 'Robot',
    palettes: [
      { name: 'Cobalt',  m: '#2563EB', l: '#BFDBFE', d: '#1D4ED8', a: '#60A5FA' },
      { name: 'Scarlet', m: '#DC2626', l: '#FECACA', d: '#991B1B', a: '#FCA5A5' },
      { name: 'Emerald', m: '#16A34A', l: '#BBF7D0', d: '#15803D', a: '#4ADE80' },
      { name: 'Violet',  m: '#7C3AED', l: '#DDD6FE', d: '#5B21B6', a: '#A78BFA' },
      { name: 'Bronze',  m: '#D97706', l: '#FDE68A', d: '#78350F', a: '#FCD34D' },
      { name: 'Silver',  m: '#6B7280', l: '#E5E7EB', d: '#374151', a: '#9CA3AF' },
    ],
    draw(p) {
      return `
        <rect x="37" y="7"  width="6"  height="13" rx="3" fill="${p.d}"/>
        <circle cx="40" cy="6" r="5.5" fill="${p.a}"/>
        <circle cx="40" cy="6" r="2.5" fill="${p.d}"/>
        <rect x="14" y="20" width="52" height="46" rx="10" fill="${p.m}" stroke="${p.d}" stroke-width="2"/>
        <rect x="14" y="52" width="52" height="14" rx="0 0 10 10" fill="${p.d}" opacity=".2"/>
        <rect x="19" y="28" width="18" height="14" rx="4" fill="${p.d}"/>
        <rect x="21" y="30" width="14" height="10" rx="3" fill="${p.a}" opacity=".9"/>
        <circle cx="28" cy="35" r="3.5" fill="${p.l}" opacity=".8"/>
        <rect x="43" y="28" width="18" height="14" rx="4" fill="${p.d}"/>
        <rect x="45" y="30" width="14" height="10" rx="3" fill="${p.a}" opacity=".9"/>
        <circle cx="52" cy="35" r="3.5" fill="${p.l}" opacity=".8"/>
        <rect x="24" y="48" width="6"  height="8" rx="2" fill="${p.l}" opacity=".7"/>
        <rect x="33" y="48" width="6"  height="8" rx="2" fill="${p.l}" opacity=".7"/>
        <rect x="42" y="48" width="6"  height="8" rx="2" fill="${p.l}" opacity=".7"/>
        <rect x="51" y="48" width="6"  height="8" rx="2" fill="${p.l}" opacity=".7"/>
        <circle cx="14" cy="36" r="4" fill="${p.d}" stroke="${p.m}" stroke-width="1.5"/>
        <circle cx="66" cy="36" r="4" fill="${p.d}" stroke="${p.m}" stroke-width="1.5"/>`;
    }
  },
  {
    id: 'explorer', label: 'Explorer',
    palettes: [
      { name: 'Peach',    m: '#FDDCB5', l: '#FEF3C7', d: '#D97706', a: '#92400E' },
      { name: 'Tan',      m: '#D4956A', l: '#FED7AA', d: '#92400E', a: '#78350F' },
      { name: 'Warm',     m: '#B8763A', l: '#FCD34D', d: '#78350F', a: '#451A03' },
      { name: 'Sienna',   m: '#8B4513', l: '#D97706', d: '#451A03', a: '#FDE68A' },
      { name: 'Bronze',   m: '#A0522D', l: '#FCA5A5', d: '#6B2D00', a: '#FDE68A' },
      { name: 'Mocha',    m: '#6B3A2A', l: '#D97706', d: '#3B1A10', a: '#FDE68A' },
    ],
    draw(p) {
      return `
        <path d="M16,44 Q16,20 40,18 Q64,20 64,44" fill="${p.a}"/>
        <path d="M14,44 Q14,16 40,14 Q66,16 66,44" fill="${p.d}"/>
        <circle cx="40" cy="48" r="26" fill="${p.m}"/>
        <path d="M14,44 Q20,38 28,36 Q32,48 16,50" fill="${p.d}" opacity=".6"/>
        <path d="M66,44 Q60,38 52,36 Q48,48 64,50" fill="${p.d}" opacity=".6"/>
        <circle cx="31" cy="44" r="6" fill="white"/>
        <circle cx="32.5" cy="45" r="4.5" fill="#2D1B00"/>
        <circle cx="33.8" cy="43.5" r="1.6" fill="white"/>
        <circle cx="49" cy="44" r="6" fill="white"/>
        <circle cx="50.5" cy="45" r="4.5" fill="#2D1B00"/>
        <circle cx="51.8" cy="43.5" r="1.6" fill="white"/>
        <ellipse cx="40" cy="54" rx="5" ry="3.5" fill="${p.d}" opacity=".5"/>
        <path d="M33 60 Q40 67 47 60" stroke="${p.d}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <ellipse cx="28" cy="54" rx="5" ry="3" fill="#FCA5A5" opacity=".5"/>
        <ellipse cx="52" cy="54" rx="5" ry="3" fill="#FCA5A5" opacity=".5"/>`;
    }
  },
  {
    id: 'alien', label: 'Alien',
    palettes: [
      { name: 'Lime',    m: '#4ADE80', l: '#D1FAE5', d: '#15803D', a: '#FDE68A' },
      { name: 'Violet',  m: '#A78BFA', l: '#EDE9FE', d: '#5B21B6', a: '#FDE68A' },
      { name: 'Azure',   m: '#38BDF8', l: '#E0F2FE', d: '#0369A1', a: '#FDE68A' },
      { name: 'Pink',    m: '#F472B6', l: '#FCE7F3', d: '#9D174D', a: '#FDE68A' },
      { name: 'Mint',    m: '#2DD4BF', l: '#CCFBF1', d: '#0F766E', a: '#FDE68A' },
      { name: 'Gold',    m: '#FBBF24', l: '#FEF3C7', d: '#92400E', a: '#EF4444' },
    ],
    draw(p) {
      return `
        <line x1="25" y1="20" x2="18" y2="6"  stroke="${p.d}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="17" cy="5" r="4.5" fill="${p.a}"/>
        <line x1="55" y1="20" x2="62" y2="6"  stroke="${p.d}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="63" cy="5" r="4.5" fill="${p.a}"/>
        <ellipse cx="40" cy="44" rx="28" ry="32" fill="${p.m}"/>
        <ellipse cx="28" cy="38" rx="10" ry="12" fill="white"/>
        <ellipse cx="28" cy="39" rx="6.5" ry="8"  fill="#1C0D00"/>
        <ellipse cx="25" cy="35" rx="2.5" ry="3"  fill="white"/>
        <ellipse cx="52" cy="38" rx="10" ry="12" fill="white"/>
        <ellipse cx="52" cy="39" rx="6.5" ry="8"  fill="#1C0D00"/>
        <ellipse cx="49" cy="35" rx="2.5" ry="3"  fill="white"/>
        <ellipse cx="40" cy="60" rx="5" ry="3" fill="${p.d}" opacity=".35"/>
        <path d="M34 63 Q40 68 46 63" stroke="${p.d}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="36" cy="48" r="2" fill="${p.a}" opacity=".7"/>
        <circle cx="44" cy="48" r="2" fill="${p.a}" opacity=".7"/>
        <circle cx="40" cy="52" r="1.5" fill="${p.d}" opacity=".4"/>`;
    }
  },
  {
    id: 'wizard', label: 'Wizard',
    palettes: [
      { name: 'Amethyst', m: '#7C3AED', l: '#EDE9FE', d: '#4C1D95', a: '#FCD34D' },
      { name: 'Sapphire', m: '#1D4ED8', l: '#DBEAFE', d: '#1E3A8A', a: '#FCD34D' },
      { name: 'Crimson',  m: '#991B1B', l: '#FEE2E2', d: '#450A0A', a: '#FCD34D' },
      { name: 'Jade',     m: '#15803D', l: '#DCFCE7', d: '#064E3B', a: '#FCD34D' },
      { name: 'Midnight', m: '#1E293B', l: '#94A3B8', d: '#0F172A', a: '#FCD34D' },
      { name: 'Rose',     m: '#BE185D', l: '#FCE7F3', d: '#831843', a: '#FCD34D' },
    ],
    draw(p) {
      return `
        <path d="M40,6 L54,46 L26,46 Z" fill="${p.m}" stroke="${p.d}" stroke-width="1.5" stroke-linejoin="round"/>
        <ellipse cx="40" cy="46" rx="14" ry="5" fill="${p.d}" opacity=".5"/>
        <text x="36" y="28" font-size="8" fill="${p.a}" opacity=".9">★</text>
        <text x="43" y="38" font-size="7" fill="${p.a}" opacity=".7">✦</text>
        <text x="32" y="38" font-size="6" fill="${p.a}" opacity=".6">·</text>
        <circle cx="40" cy="55" r="19" fill="#FDDCB5"/>
        <path d="M27,50 Q26,44 28,42" stroke="#D4956A" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M53,50 Q54,44 52,42" stroke="#D4956A" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="34" cy="53" r="5" fill="white"/>
        <circle cx="35" cy="54" r="3.5" fill="#2D1B00"/>
        <circle cx="36" cy="52.5" r="1.2" fill="white"/>
        <circle cx="46" cy="53" r="5" fill="white"/>
        <circle cx="47" cy="54" r="3.5" fill="#2D1B00"/>
        <circle cx="48" cy="52.5" r="1.2" fill="white"/>
        <path d="M34 63 Q40 70 46 63" stroke="#92400E" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M22,66 Q40,74 58,66" stroke="#D4956A" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="M24,70 Q40,78 56,70" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`;
    }
  },
  {
    id: 'fox', label: 'Fox',
    palettes: [
      { name: 'Rust',    m: '#C2410C', l: '#FED7AA', d: '#7C2D12', a: '#F9FAFB' },
      { name: 'Amber',   m: '#D97706', l: '#FEF3C7', d: '#78350F', a: '#F9FAFB' },
      { name: 'Crimson', m: '#DC2626', l: '#FEE2E2', d: '#7F1D1D', a: '#F9FAFB' },
      { name: 'Silver',  m: '#6B7280', l: '#F3F4F6', d: '#374151', a: '#F9FAFB' },
      { name: 'Sand',    m: '#CA8A04', l: '#FEF9C3', d: '#78350F', a: '#F9FAFB' },
      { name: 'Plum',    m: '#7C3AED', l: '#EDE9FE', d: '#4C1D95', a: '#F9FAFB' },
    ],
    draw(p) {
      return `
        <polygon points="18,42 26,14 38,38" fill="${p.m}"/>
        <polygon points="62,42 54,14 42,38" fill="${p.m}"/>
        <polygon points="22,40 26,18 34,38" fill="${p.a}" opacity=".8"/>
        <polygon points="58,40 54,18 46,38" fill="${p.a}" opacity=".8"/>
        <circle cx="40" cy="48" r="26" fill="${p.m}"/>
        <ellipse cx="40" cy="58" rx="16" ry="11" fill="${p.a}"/>
        <ellipse cx="40" cy="56" rx="10" ry="7.5" fill="${p.a}"/>
        <circle cx="32" cy="43" r="6" fill="white"/>
        <circle cx="33.5" cy="44" r="4.5" fill="#1C0D00"/>
        <circle cx="34.8" cy="42.5" r="1.6" fill="white"/>
        <circle cx="48" cy="43" r="6" fill="white"/>
        <circle cx="49.5" cy="44" r="4.5" fill="#1C0D00"/>
        <circle cx="50.8" cy="42.5" r="1.6" fill="white"/>
        <ellipse cx="40" cy="55" rx="4" ry="2.8" fill="${p.d}"/>
        <path d="M34 61 Q40 67 46 61" stroke="${p.d}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="22" y1="57" x2="35" y2="55" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="22" y1="60" x2="35" y2="59" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="45" y1="55" x2="58" y2="57" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="45" y1="59" x2="58" y2="60" stroke="${p.d}" stroke-width="1.2" stroke-linecap="round"/>`;
    }
  },
  {
    id: 'dragon', label: 'Dragon',
    palettes: [
      { name: 'Emerald', m: '#15803D', l: '#A7F3D0', d: '#064E3B', a: '#FCD34D' },
      { name: 'Sapphire',m: '#1D4ED8', l: '#BFDBFE', d: '#1E3A8A', a: '#FCD34D' },
      { name: 'Scarlet', m: '#DC2626', l: '#FCA5A5', d: '#7F1D1D', a: '#FCD34D' },
      { name: 'Violet',  m: '#7C3AED', l: '#DDD6FE', d: '#4C1D95', a: '#FCD34D' },
      { name: 'Jade',    m: '#0D9488', l: '#CCFBF1', d: '#0F766E', a: '#FCD34D' },
      { name: 'Onyx',    m: '#1F2937', l: '#6B7280', d: '#111827', a: '#FCD34D' },
    ],
    draw(p) {
      return `
        <path d="M28,18 C22,10 14,12 14,20 C14,26 20,28 26,26" fill="${p.m}" stroke="${p.d}" stroke-width="1.5"/>
        <path d="M52,18 C58,10 66,12 66,20 C66,26 60,28 54,26" fill="${p.m}" stroke="${p.d}" stroke-width="1.5"/>
        <ellipse cx="40" cy="50" rx="28" ry="26" fill="${p.m}"/>
        <path d="M14,54 Q20,64 40,68 Q60,64 66,54" fill="${p.l}" opacity=".5"/>
        <circle cx="30" cy="40" rx="10" ry="11" fill="none"/>
        <ellipse cx="30" cy="40" rx="9" ry="10" fill="white"/>
        <ellipse cx="30" cy="41" rx="6" ry="7" fill="${p.a}"/>
        <ellipse cx="30" cy="42" rx="3.5" ry="5" fill="#1C0D00"/>
        <ellipse cx="28.5" cy="39" rx="1.5" ry="2" fill="white"/>
        <ellipse cx="50" cy="40" rx="9" ry="10" fill="white"/>
        <ellipse cx="50" cy="41" rx="6" ry="7" fill="${p.a}"/>
        <ellipse cx="50" cy="42" rx="3.5" ry="5" fill="#1C0D00"/>
        <ellipse cx="48.5" cy="39" rx="1.5" ry="2" fill="white"/>
        <path d="M30,62 Q40,70 50,62" stroke="${p.d}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M36,64 L34,70" stroke="${p.d}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M44,64 L46,70" stroke="${p.d}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="54" r="2.5" fill="${p.l}" opacity=".7"/>
        <circle cx="40" cy="56" r="2.5" fill="${p.l}" opacity=".7"/>
        <circle cx="50" cy="54" r="2.5" fill="${p.l}" opacity=".7"/>`;
    }
  },
];

// Accessories drawn on top of character — SVG strings
const AVATAR_ACCESSORIES = [
  {
    id: 'none', label: 'None',
    draw: () => ''
  },
  {
    id: 'glasses', label: 'Glasses',
    draw: () => `
      <circle cx="31" cy="40" r="8"  fill="none" stroke="#1F2937" stroke-width="2.5"/>
      <circle cx="49" cy="40" r="8"  fill="none" stroke="#1F2937" stroke-width="2.5"/>
      <line x1="39" y1="40" x2="41" y2="40" stroke="#1F2937" stroke-width="2.5"/>
      <line x1="23" y1="40" x2="18" y2="38" stroke="#1F2937" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="57" y1="40" x2="62" y2="38" stroke="#1F2937" stroke-width="2.5" stroke-linecap="round"/>`
  },
  {
    id: 'partyhat', label: 'Party Hat',
    draw: () => `
      <path d="M40,5 L56,36 L24,36 Z" fill="#EF4444" stroke="#7F1D1D" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="40" cy="5" r="4" fill="#FBBF24"/>
      <line x1="28" y1="26" x2="24" y2="36" stroke="#FCD34D" stroke-width="2"/>
      <line x1="36" y1="16" x2="32" y2="26" stroke="#FBBF24" stroke-width="2"/>
      <line x1="44" y1="16" x2="48" y2="26" stroke="#FCD34D" stroke-width="2"/>
      <line x1="52" y1="26" x2="56" y2="36" stroke="#FBBF24" stroke-width="2"/>
      <ellipse cx="40" cy="36" rx="16" ry="4" fill="#DC2626" opacity=".5"/>`
  },
  {
    id: 'crown', label: 'Crown',
    draw: () => `
      <path d="M20,36 L20,22 L28,30 L40,16 L52,30 L60,22 L60,36 Z" fill="#FCD34D" stroke="#D97706" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="20" y="34" width="40" height="6" rx="2" fill="#FBBF24" stroke="#D97706" stroke-width="1"/>
      <circle cx="40" cy="16" r="3.5" fill="#EF4444"/>
      <circle cx="20" cy="22" r="3" fill="#3B82F6"/>
      <circle cx="60" cy="22" r="3" fill="#10B981"/>
      <circle cx="28" cy="36" r="2" fill="#F9FAFB" opacity=".6"/>
      <circle cx="40" cy="36" r="2" fill="#F9FAFB" opacity=".6"/>
      <circle cx="52" cy="36" r="2" fill="#F9FAFB" opacity=".6"/>`
  },
  {
    id: 'gradcap', label: 'Grad Cap',
    draw: () => `
      <rect x="22" y="28" width="36" height="10" rx="3" fill="#1F2937"/>
      <polygon points="40,12 64,28 16,28" fill="#1F2937"/>
      <rect x="38" y="28" width="4" height="14" rx="2" fill="#374151"/>
      <line x1="60" y1="28" x2="64" y2="38" stroke="#374151" stroke-width="3" stroke-linecap="round"/>
      <circle cx="64" cy="40" r="4" fill="#FCD34D"/>
      <rect x="38" y="20" width="4" height="14" rx="2" fill="#1F2937"/>`
  },
  {
    id: 'stars', label: 'Sparkles',
    draw: () => `
      <text x="12" y="22" font-size="13" fill="#FCD34D">★</text>
      <text x="58" y="20" font-size="11" fill="#F97316">★</text>
      <text x="8"  y="38" font-size="8"  fill="#FCD34D">✦</text>
      <text x="64" y="36" font-size="8"  fill="#EC4899">✦</text>
      <text x="32" y="10" font-size="7"  fill="#FCD34D">·</text>
      <text x="50" y="10" font-size="7"  fill="#FCD34D">·</text>`
  },
];

const AVATAR_DEFAULTS = {
  student: { type: 'bear',    colour: 0, accessory: 0, bg: 0 },
  teacher: { type: 'wizard',  colour: 0, accessory: 4, bg: 1 },
  parent:  { type: 'explorer',colour: 0, accessory: 0, bg: 2 },
  guest:   { type: 'alien',   colour: 2, accessory: 5, bg: 3 },
};

/**
 * Build a complete avatar SVG string.
 * @param {object} cfg  - { type, colour, accessory, bg }
 * @param {number} size - rendered px size (viewBox stays 80x80)
 */
function buildAvatarSVG(cfg, size = 80) {
  const typeData  = AVATAR_TYPES.find(t => t.id === cfg.type) || AVATAR_TYPES[0];
  const palette   = typeData.palettes[cfg.colour] || typeData.palettes[0];
  const acc       = AVATAR_ACCESSORIES[cfg.accessory] || AVATAR_ACCESSORIES[0];
  const bgColour  = AVATAR_BACKGROUNDS[cfg.bg]?.hex || '#3B82F6';

  const uid = `av-${cfg.type}-${cfg.colour}-${cfg.accessory}-${cfg.bg}-${Math.random().toString(36).slice(2,6)}`;

  return `<svg viewBox="0 0 80 80" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${uid}-bg" cx="35%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="${lighten(bgColour, 0.3)}"/>
      <stop offset="100%" stop-color="${darken(bgColour, 0.2)}"/>
    </radialGradient>
    <filter id="${uid}-sh">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="40" cy="40" r="39" fill="url(#${uid}-bg)"/>
  <circle cx="40" cy="40" r="39" fill="rgba(255,255,255,0.06)"/>
  <g filter="url(#${uid}-sh)">
    ${typeData.draw(palette)}
    ${acc.draw()}
  </g>
</svg>`;
}

function lighten(hex, amount) {
  return blendHex(hex, '#ffffff', amount);
}
function darken(hex, amount) {
  return blendHex(hex, '#000000', amount);
}
function blendHex(hex, target, amount) {
  const parse = h => [
    parseInt(h.slice(1,3), 16),
    parseInt(h.slice(3,5), 16),
    parseInt(h.slice(5,7), 16),
  ];
  const a = parse(hex), b = parse(target);
  const r = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return '#' + r.map(v => v.toString(16).padStart(2,'0')).join('');
}

/** Get stored avatar config for the current user, with fallback defaults */
function getStoredAvatar() {
  const user = JSON.parse(localStorage.getItem('mm_user') || '{}');
  return user.avatar || AVATAR_DEFAULTS[user.role] || AVATAR_DEFAULTS.student;
}

/** Save avatar config back into the user object in localStorage */
function saveStoredAvatar(cfg) {
  const user = JSON.parse(localStorage.getItem('mm_user') || '{}');
  user.avatar = cfg;
  localStorage.setItem('mm_user', JSON.stringify(user));
}

/** Inject the avatar picker modal into the document body and wire it up */
function initAvatarPicker(onSaveCallback) {
  if (document.getElementById('avatarPickerModal')) return;

  const css = `
  #avatarPickerModal {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(15,23,42,0.65); backdrop-filter: blur(4px);
    opacity: 0; pointer-events: none; transition: opacity .25s;
  }
  #avatarPickerModal.open { opacity: 1; pointer-events: all; }
  #avatarPickerBox {
    background: #fff; border-radius: 24px;
    box-shadow: 0 24px 60px rgba(0,0,0,.25);
    width: 92%; max-width: 480px; max-height: 90vh;
    overflow-y: auto; padding: 0 0 24px;
    transform: translateY(20px); transition: transform .25s;
    font-family: 'Quicksand', sans-serif;
  }
  #avatarPickerModal.open #avatarPickerBox { transform: translateY(0); }
  .ap-header {
    position: sticky; top: 0; background: #fff; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 16px; border-bottom: 2px solid #F1F5F9;
  }
  .ap-header h2 { font-size: 1.1rem; font-weight: 700; color: #0F172A; margin: 0; }
  .ap-close {
    width: 34px; height: 34px; border-radius: 50%;
    border: none; background: #F1F5F9; cursor: pointer;
    font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
    color: #64748B; transition: background .15s;
  }
  .ap-close:hover { background: #E2E8F0; }
  .ap-preview {
    display: flex; flex-direction: column; align-items: center;
    padding: 20px 24px 16px; gap: 8px;
    background: linear-gradient(135deg, #F8FAFC, #F1F5F9);
    border-bottom: 2px solid #E2E8F0;
  }
  .ap-preview-ring {
    width: 100px; height: 100px; border-radius: 50%;
    box-shadow: 0 0 0 4px white, 0 0 0 6px #3B82F6;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
  }
  .ap-preview-name { font-size: .88rem; color: #64748B; font-weight: 600; }
  .ap-section { padding: 16px 24px 0; }
  .ap-section-label {
    font-size: .72rem; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #94A3B8; margin-bottom: 10px;
  }
  .ap-type-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  }
  .ap-type-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 5px; padding: 8px 4px; border-radius: 12px;
    border: 2px solid #E2E8F0; background: #F8FAFC;
    cursor: pointer; transition: all .15s; font-size: .7rem;
    font-weight: 700; color: #475569;
  }
  .ap-type-btn:hover { border-color: #93C5FD; background: #EFF6FF; }
  .ap-type-btn.selected { border-color: #3B82F6; background: #EFF6FF; color: #1D4ED8; }
  .ap-colour-grid {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .ap-colour-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 3px solid transparent; cursor: pointer;
    transition: all .15s; box-shadow: 0 2px 6px rgba(0,0,0,.15);
    display: flex; align-items: center; justify-content: center;
    font-size: .65rem; font-weight: 700; color: white;
  }
  .ap-colour-btn.selected { border-color: #1F2937; box-shadow: 0 0 0 2px white, 0 0 0 4px #1F2937; }
  .ap-acc-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  }
  .ap-acc-btn {
    padding: 8px; border-radius: 12px; border: 2px solid #E2E8F0;
    background: #F8FAFC; cursor: pointer; font-size: .72rem;
    font-weight: 700; color: #475569; transition: all .15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .ap-acc-btn:hover { border-color: #A5B4FC; background: #EEF2FF; }
  .ap-acc-btn.selected { border-color: #8B5CF6; background: #EEF2FF; color: #5B21B6; }
  .ap-bg-grid {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .ap-bg-btn {
    width: 38px; height: 38px; border-radius: 10px;
    border: 3px solid transparent; cursor: pointer;
    transition: all .15s; box-shadow: 0 2px 6px rgba(0,0,0,.15);
  }
  .ap-bg-btn.selected { border-color: #1F2937; box-shadow: 0 0 0 2px white, 0 0 0 4px #1F2937; transform: scale(1.1); }
  .ap-save-row {
    padding: 20px 24px 0; display: flex; justify-content: center;
  }
  .ap-save-btn {
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    color: white; border: none; border-radius: 14px;
    padding: 13px 36px; font-family: 'Quicksand', sans-serif;
    font-size: 1rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 16px rgba(59,130,246,.35);
    transition: opacity .15s, transform .15s;
  }
  .ap-save-btn:hover { opacity: .9; transform: translateY(-1px); }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const modal = document.createElement('div');
  modal.id = 'avatarPickerModal';
  modal.innerHTML = `
    <div id="avatarPickerBox">
      <div class="ap-header">
        <h2>Customise Your Avatar</h2>
        <button class="ap-close" id="apClose" aria-label="Close">✕</button>
      </div>
      <div class="ap-preview">
        <div class="ap-preview-ring" id="apPreviewRing"></div>
        <div class="ap-preview-name" id="apPreviewName"></div>
      </div>

      <div class="ap-section">
        <div class="ap-section-label">Character</div>
        <div class="ap-type-grid" id="apTypeGrid"></div>
      </div>

      <div class="ap-section" style="margin-top:16px;">
        <div class="ap-section-label">Colour</div>
        <div class="ap-colour-grid" id="apColourGrid"></div>
      </div>

      <div class="ap-section" style="margin-top:16px;">
        <div class="ap-section-label">Accessory</div>
        <div class="ap-acc-grid" id="apAccGrid"></div>
      </div>

      <div class="ap-section" style="margin-top:16px;">
        <div class="ap-section-label">Background</div>
        <div class="ap-bg-grid" id="apBgGrid"></div>
      </div>

      <div class="ap-save-row">
        <button class="ap-save-btn" id="apSaveBtn">Save Avatar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let current = { ...getStoredAvatar() };
  const user   = JSON.parse(localStorage.getItem('mm_user') || '{}');

  function refreshPreview() {
    document.getElementById('apPreviewRing').innerHTML = buildAvatarSVG(current, 96);
    document.getElementById('apPreviewName').textContent = (user.name || 'Explorer').split(' ')[0];
  }

  function renderTypeGrid() {
    const grid = document.getElementById('apTypeGrid');
    grid.innerHTML = '';
    AVATAR_TYPES.forEach(t => {
      const mini = buildAvatarSVG({ ...current, type: t.id }, 44);
      const btn  = document.createElement('button');
      btn.className = 'ap-type-btn' + (current.type === t.id ? ' selected' : '');
      btn.innerHTML = `${mini}<span>${t.label}</span>`;
      btn.onclick = () => {
        current.type = t.id;
        if (current.colour >= (AVATAR_TYPES.find(x => x.id === t.id)?.palettes.length || 6)) current.colour = 0;
        renderAll();
      };
      grid.appendChild(btn);
    });
  }

  function renderColourGrid() {
    const typeData = AVATAR_TYPES.find(t => t.id === current.type) || AVATAR_TYPES[0];
    const grid = document.getElementById('apColourGrid');
    grid.innerHTML = '';
    typeData.palettes.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'ap-colour-btn' + (current.colour === i ? ' selected' : '');
      btn.style.background = p.m;
      btn.title = p.name;
      btn.onclick = () => { current.colour = i; renderAll(); };
      grid.appendChild(btn);
    });
  }

  function renderAccGrid() {
    const accIcons = ['–', '👓', '🎉', '👑', '🎓', '✨'];
    const grid = document.getElementById('apAccGrid');
    grid.innerHTML = '';
    AVATAR_ACCESSORIES.forEach((a, i) => {
      const btn = document.createElement('button');
      btn.className = 'ap-acc-btn' + (current.accessory === i ? ' selected' : '');
      btn.innerHTML = `<span>${accIcons[i]}</span><span>${a.label}</span>`;
      btn.onclick = () => { current.accessory = i; renderAll(); };
      grid.appendChild(btn);
    });
  }

  function renderBgGrid() {
    const grid = document.getElementById('apBgGrid');
    grid.innerHTML = '';
    AVATAR_BACKGROUNDS.forEach((bg, i) => {
      const btn = document.createElement('button');
      btn.className = 'ap-bg-btn' + (current.bg === i ? ' selected' : '');
      btn.style.background = bg.hex;
      btn.title = bg.label;
      btn.onclick = () => { current.bg = i; renderAll(); };
      grid.appendChild(btn);
    });
  }

  function renderAll() {
    refreshPreview();
    renderTypeGrid();
    renderColourGrid();
    renderAccGrid();
    renderBgGrid();
  }

  document.getElementById('apClose').onclick  = closeAvatarPicker;
  modal.addEventListener('click', e => { if (e.target === modal) closeAvatarPicker(); });

  document.getElementById('apSaveBtn').onclick = () => {
    saveStoredAvatar(current);
    if (typeof onSaveCallback === 'function') onSaveCallback(current);
    closeAvatarPicker();
  };

  renderAll();
}

function openAvatarPicker() {
  const modal = document.getElementById('avatarPickerModal');
  if (modal) {
    // Re-sync current config in case it changed
    const current = getStoredAvatar();
    document.getElementById('apPreviewRing').innerHTML = buildAvatarSVG(current, 96);
    setTimeout(() => modal.classList.add('open'), 10);
  }
}

function closeAvatarPicker() {
  const modal = document.getElementById('avatarPickerModal');
  if (modal) modal.classList.remove('open');
}

// Expose globally
window.buildAvatarSVG    = buildAvatarSVG;
window.getStoredAvatar   = getStoredAvatar;
window.saveStoredAvatar  = saveStoredAvatar;
window.initAvatarPicker  = initAvatarPicker;
window.openAvatarPicker  = openAvatarPicker;
window.closeAvatarPicker = closeAvatarPicker;
window.AVATAR_TYPES      = AVATAR_TYPES;
window.AVATAR_BACKGROUNDS = AVATAR_BACKGROUNDS;
window.AVATAR_ACCESSORIES = AVATAR_ACCESSORIES;
