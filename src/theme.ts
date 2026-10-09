export type ThemeGrading = 'lavender' | 'cyber' | 'emerald' | 'monochrome';

export interface ThemeConfig {
  id: ThemeGrading;
  name: string;
  description: string;
  pageBg: string;
  textPrimary: string;
  textSecondary: string;
  heroGradient: string;
  heroTitleGradient: string;
  heroBadgeBg: string;
  heroBadgeText: string;
  heroMetricBg: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardText: string;
  cardSecondaryText: string;
  cardPromptBox: string;
  cardPromptText: string;
  cardGuideBg: string;
  cardGuideText: string;
  filterInputBg: string;
  filterInputBorder: string;
  filterTabActive: string;
  filterTabInactive: string;
  accentPill: string;
  accentPillHover: string;
  accentPillText: string;
  navySectionBg: string;
  navySectionCardBg: string;
  bottomNavBg: string;
  bottomNavBorder: string;
  bottomNavCenterBtn: string;
  paginationActiveCircle: string;
}

export const THEMES: Record<ThemeGrading, ThemeConfig> = {
  lavender: {
    id: 'lavender',
    name: 'Lavender & Lime',
    description: 'Soft purple gradient with vibrant lime-green accents',
    pageBg: 'bg-[#faf5ff]',
    textPrimary: 'text-slate-950',
    textSecondary: 'text-purple-800',
    heroGradient: 'bg-gradient-to-b from-[#ede9fe] via-[#f5f3ff] to-[#faf5ff] border-b border-purple-200/80',
    heroTitleGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-purple-950 to-slate-900',
    heroBadgeBg: 'bg-white/80 border-purple-200/80',
    heroBadgeText: 'text-purple-900',
    heroMetricBg: 'bg-white/80 border-purple-100',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-200/80',
    cardBorderHover: 'hover:border-purple-400',
    cardText: 'text-slate-900',
    cardSecondaryText: 'text-slate-500',
    cardPromptBox: 'bg-slate-50 border-slate-200',
    cardPromptText: 'text-slate-800',
    cardGuideBg: 'bg-purple-50/70 border-purple-100',
    cardGuideText: 'text-slate-700',
    filterInputBg: 'bg-white',
    filterInputBorder: 'border-purple-200/90 focus:border-purple-600',
    filterTabActive: 'bg-slate-950 text-white border-slate-950',
    filterTabInactive: 'bg-white text-slate-700 border-slate-200 hover:border-purple-300',
    accentPill: 'bg-[#84cc16]',
    accentPillHover: 'hover:bg-[#a3e635]',
    accentPillText: 'text-slate-950',
    navySectionBg: 'bg-[#0a0f1d] border-slate-800',
    navySectionCardBg: 'bg-slate-900/90 border-slate-800',
    bottomNavBg: 'bg-slate-950/90 border-slate-800',
    bottomNavBorder: 'border-slate-800',
    bottomNavCenterBtn: 'bg-[#84cc16] hover:bg-[#a3e635] text-slate-950',
    paginationActiveCircle: 'bg-[#84cc16] text-slate-950',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Navy',
    description: 'Deep high-tech navy with electric lime and cyan highlights',
    pageBg: 'bg-[#050811]',
    textPrimary: 'text-white',
    textSecondary: 'text-cyan-400',
    heroGradient: 'bg-gradient-to-b from-[#0b1120] via-[#080d19] to-[#050811] border-b border-slate-800',
    heroTitleGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-lime-400 to-white',
    heroBadgeBg: 'bg-slate-900/90 border-cyan-500/40',
    heroBadgeText: 'text-cyan-300',
    heroMetricBg: 'bg-[#0d1527] border-slate-800',
    cardBg: 'bg-[#0d1527]',
    cardBorder: 'border-slate-800',
    cardBorderHover: 'hover:border-cyan-500/60',
    cardText: 'text-white',
    cardSecondaryText: 'text-slate-400',
    cardPromptBox: 'bg-[#070b14] border-slate-800',
    cardPromptText: 'text-slate-200',
    cardGuideBg: 'bg-slate-900/90 border-cyan-900/50',
    cardGuideText: 'text-slate-300',
    filterInputBg: 'bg-[#0d1527]',
    filterInputBorder: 'border-slate-800 focus:border-cyan-500 text-white',
    filterTabActive: 'bg-[#84cc16] text-black border-[#84cc16]',
    filterTabInactive: 'bg-[#0d1527] text-slate-300 border-slate-800 hover:border-slate-700',
    accentPill: 'bg-[#84cc16]',
    accentPillHover: 'hover:bg-[#a3e635]',
    accentPillText: 'text-black',
    navySectionBg: 'bg-[#080d1a] border-cyan-950',
    navySectionCardBg: 'bg-[#0f172a] border-slate-800',
    bottomNavBg: 'bg-[#0b1120]/95 border-slate-700',
    bottomNavBorder: 'border-slate-700',
    bottomNavCenterBtn: 'bg-[#84cc16] hover:bg-[#a3e635] text-black',
    paginationActiveCircle: 'bg-[#84cc16] text-black',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    description: 'Fresh organic mint & botanical emerald tones',
    pageBg: 'bg-[#f0fdf4]',
    textPrimary: 'text-emerald-950',
    textSecondary: 'text-emerald-700',
    heroGradient: 'bg-gradient-to-b from-[#dcfce7] via-[#f0fdf4] to-[#f0fdf4] border-b border-emerald-200/80',
    heroTitleGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900',
    heroBadgeBg: 'bg-white/90 border-emerald-200',
    heroBadgeText: 'text-emerald-900',
    heroMetricBg: 'bg-white/80 border-emerald-100',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200/80',
    cardBorderHover: 'hover:border-emerald-500',
    cardText: 'text-emerald-950',
    cardSecondaryText: 'text-slate-500',
    cardPromptBox: 'bg-emerald-50/50 border-emerald-100',
    cardPromptText: 'text-slate-800',
    cardGuideBg: 'bg-emerald-50 border-emerald-200/60',
    cardGuideText: 'text-emerald-900',
    filterInputBg: 'bg-white',
    filterInputBorder: 'border-emerald-200 focus:border-emerald-600',
    filterTabActive: 'bg-emerald-950 text-white border-emerald-950',
    filterTabInactive: 'bg-white text-emerald-800 border-emerald-200 hover:border-emerald-400',
    accentPill: 'bg-[#10b981]',
    accentPillHover: 'hover:bg-[#059669]',
    accentPillText: 'text-white',
    navySectionBg: 'bg-[#064e3b] border-emerald-900',
    navySectionCardBg: 'bg-[#043e30] border-emerald-800',
    bottomNavBg: 'bg-emerald-950/95 border-emerald-800',
    bottomNavBorder: 'border-emerald-800',
    bottomNavCenterBtn: 'bg-[#84cc16] hover:bg-[#a3e635] text-black',
    paginationActiveCircle: 'bg-[#84cc16] text-black',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Pure Monochrome',
    description: 'Clean stark gallery black & white contrast',
    pageBg: 'bg-[#fafafa]',
    textPrimary: 'text-black',
    textSecondary: 'text-neutral-600',
    heroGradient: 'bg-gradient-to-b from-[#f4f4f5] via-[#fafafa] to-[#fafafa] border-b border-neutral-200',
    heroTitleGradient: 'text-black',
    heroBadgeBg: 'bg-white border-neutral-300',
    heroBadgeText: 'text-black',
    heroMetricBg: 'bg-white border-neutral-200',
    cardBg: 'bg-white',
    cardBorder: 'border-neutral-200',
    cardBorderHover: 'hover:border-black',
    cardText: 'text-black',
    cardSecondaryText: 'text-neutral-500',
    cardPromptBox: 'bg-neutral-50 border-neutral-200',
    cardPromptText: 'text-neutral-800',
    cardGuideBg: 'bg-neutral-100 border-neutral-200',
    cardGuideText: 'text-neutral-800',
    filterInputBg: 'bg-white',
    filterInputBorder: 'border-neutral-300 focus:border-black',
    filterTabActive: 'bg-black text-white border-black',
    filterTabInactive: 'bg-white text-neutral-700 border-neutral-200 hover:border-black',
    accentPill: 'bg-black',
    accentPillHover: 'hover:bg-neutral-800',
    accentPillText: 'text-white',
    navySectionBg: 'bg-[#121212] border-neutral-800',
    navySectionCardBg: 'bg-[#1c1c1c] border-neutral-800',
    bottomNavBg: 'bg-black/95 border-neutral-800',
    bottomNavBorder: 'border-neutral-800',
    bottomNavCenterBtn: 'bg-[#84cc16] hover:bg-[#a3e635] text-black',
    paginationActiveCircle: 'bg-[#84cc16] text-black',
  },
};
