import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ThemeConfig } from '../theme';

interface HeroProps {
  totalCount: number;
  theme: ThemeConfig;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ totalCount, theme, onExploreClick }) => {
  return (
    <section className={`relative overflow-hidden pt-14 pb-18 sm:pt-20 sm:pb-24 ${theme.heroGradient}`}>
      {/* Ambient decorative lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute -top-16 right-1/4 w-96 h-96 bg-[#84cc16]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Curated status pill */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-2xs mb-6 ${theme.heroBadgeBg}`}>
          <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
          <span className={`text-[11px] font-extrabold uppercase tracking-widest ${theme.heroBadgeText}`}>
            ENGINEERED PROMPT REPOSITORY
          </span>
          <span className="opacity-40">·</span>
          <span className="text-[11px] font-bold opacity-80">
            CREATOR VAULT
          </span>
        </div>

        {/* Bold uppercase heading */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase mb-5 leading-[0.95]">
          PROMPT <span className={theme.heroTitleGradient}>VAULT</span>
        </h1>

        {/* Tagline */}
        <p className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase mb-4 ${theme.textPrimary}`}>
          TRENDING AI PROMPTS, CURATED FOR CREATORS.
        </p>

        {/* Supporting description */}
        <p className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal mb-8 ${theme.cardSecondaryText}`}>
          High-retention visual prompts engineered for TikTok, Instagram Reels, and YouTube Shorts. Clean, fast, and password-protected.
        </p>

        {/* Action Button: ONLY Explore Prompts (NO extra + button here) */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={onExploreClick}
            className={`flex items-center gap-2 px-7 py-3.5 rounded-full font-black text-sm uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer group ${theme.accentPill} ${theme.accentPillHover} ${theme.accentPillText}`}
          >
            <span>Explore Prompts</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Minimal metrics strip */}
        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
          <div className={`backdrop-blur-xs border rounded-2xl p-4 shadow-2xs ${theme.heroMetricBg}`}>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.textPrimary}`}>{totalCount}</div>
            <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${theme.textSecondary}`}>Live Prompts</div>
          </div>
          <div className={`backdrop-blur-xs border rounded-2xl p-4 shadow-2xs ${theme.heroMetricBg}`}>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.textPrimary}`}>9:16</div>
            <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${theme.textSecondary}`}>Short-Form</div>
          </div>
          <div className={`backdrop-blur-xs border rounded-2xl p-4 shadow-2xs ${theme.heroMetricBg}`}>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight text-[#84cc16]`}>100%</div>
            <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${theme.textSecondary}`}>Tested Specs</div>
          </div>
        </div>
      </div>
    </section>
  );
};
