/**
 * International Enterprise POS Theme System
 * Provides curated, world-class color palettes modeled after international retail & fintech standards
 * (Geneva Slate, Paris Obsidian, Stockholm Daylight, Tokyo Midnight, Dubai Jade).
 */

export type InternationalThemeId = 'slate' | 'obsidian' | 'nordic' | 'tokyo' | 'emerald';

export interface InternationalTheme {
  id: InternationalThemeId;
  name: string;
  flag: string;
  subtitle: string;
  bgRoot: string;
  cardBg: string;
  headerBg: string;
  border: string;
  accent: string;
  textColor: string;
  mutedText: string;
}

export const INTERNATIONAL_THEMES: Record<InternationalThemeId, InternationalTheme> = {
  slate: {
    id: 'slate',
    name: 'International Slate Navy',
    flag: '🌐',
    subtitle: 'Geneva & London Enterprise Terminal standard',
    bgRoot: 'bg-[#0b1329]',
    cardBg: 'bg-[#121d38]',
    headerBg: 'bg-[#0e172e]',
    border: 'border-[#1e2e54]',
    accent: '#38bdf8',
    textColor: 'text-slate-100',
    mutedText: 'text-slate-400',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian & Champagne Gold',
    flag: '🇫🇷',
    subtitle: 'Paris & Milan High-End Luxury Boutique',
    bgRoot: 'bg-[#0f1014]',
    cardBg: 'bg-[#18191f]',
    headerBg: 'bg-[#14151a]',
    border: 'border-[#272832]',
    accent: '#f59e0b',
    textColor: 'text-neutral-100',
    mutedText: 'text-neutral-400',
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Cyber Indigo',
    flag: '🇯🇵',
    subtitle: 'Roppongi High-Velocity Retail & Cafe',
    bgRoot: 'bg-[#070b18]',
    cardBg: 'bg-[#0e152d]',
    headerBg: 'bg-[#0a1024]',
    border: 'border-[#1b2752]',
    accent: '#06b6d4',
    textColor: 'text-cyan-50',
    mutedText: 'text-cyan-400/70',
  },
  emerald: {
    id: 'emerald',
    name: 'Dubai Emerald Mint',
    flag: '🇦🇪',
    subtitle: 'Emirates Exchange & Gourmet Emporium',
    bgRoot: 'bg-[#061412]',
    cardBg: 'bg-[#0c2420]',
    headerBg: 'bg-[#091b18]',
    border: 'border-[#143b34]',
    accent: '#10b981',
    textColor: 'text-emerald-50',
    mutedText: 'text-emerald-400/70',
  },
  nordic: {
    id: 'nordic',
    name: 'Stockholm Nordic Frost',
    flag: '🇸🇪',
    subtitle: 'Scandinavian Crisp Clean Day Mode',
    bgRoot: 'bg-[#f1f5f9]',
    cardBg: 'bg-[#ffffff]',
    headerBg: 'bg-[#ffffff]',
    border: 'border-slate-200',
    accent: '#2563eb',
    textColor: 'text-slate-900',
    mutedText: 'text-slate-500',
  },
};

const THEME_STORAGE_KEY = 'gsr_pos_international_theme';

export function getStoredTheme(): InternationalThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && saved in INTERNATIONAL_THEMES) {
      return saved as InternationalThemeId;
    }
    // Default to the elite International Slate Navy
    return 'slate';
  } catch {
    return 'slate';
  }
}

export function saveStoredTheme(themeId: InternationalThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // ignore
  }
}
