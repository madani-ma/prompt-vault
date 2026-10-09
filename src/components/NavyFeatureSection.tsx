import React from 'react';
import { Sparkles, Shield, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';
import { ThemeConfig } from '../theme';

interface NavyFeatureSectionProps {
  theme: ThemeConfig;
  onOpenSettingsClick: () => void;
}

export const NavyFeatureSection: React.FC<NavyFeatureSectionProps> = ({
  theme,
  onOpenSettingsClick,
}) => {
  return (
    <section className={`my-16 py-14 px-4 sm:px-6 rounded-3xl max-w-6xl mx-auto shadow-xl relative overflow-hidden border ${theme.navySectionBg}`}>
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[#84cc16] text-[11px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOW PROMPT VAULT WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4">
            BUILT FOR VIRAL CREATORS & HIGH-RETENTION CONTENT
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Every prompt in the vault is engineered with specific camera focal lengths, lighting setups, and aspect ratios tailored for modern short-form feeds.
          </p>
        </div>

        {/* Feature blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between transition-colors ${theme.navySectionCardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold mb-4">
                01
              </div>
              <h3 className="text-base font-extrabold uppercase text-white tracking-wide mb-2">
                1-CLICK COPY & PASTE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Directly paste into Midjourney v6, Flux.1, or Ideogram without manual formatting or syntax cleanup.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-[#84cc16] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full camera & lens specs included</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between transition-colors ${theme.navySectionCardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#84cc16]/20 text-[#84cc16] flex items-center justify-center font-bold mb-4">
                02
              </div>
              <h3 className="text-base font-extrabold uppercase text-white tracking-wide mb-2">
                VERIFIED CREATOR REPO
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Production-tested visual prompts optimized for viral short-form retention across TikTok, Reels, and Shorts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-[#84cc16] font-semibold">
              <Shield className="w-4 h-4" />
              <span>Tested & verified specs</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between transition-colors ${theme.navySectionCardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold mb-4">
                03
              </div>
              <h3 className="text-base font-extrabold uppercase text-white tracking-wide mb-2">
                AI NATURAL LANGUAGE SEARCH
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Type what kind of prompt you are looking for in natural language in the bottom Settings menu.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-[#84cc16] font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Custom themes & color grading</span>
            </div>
          </div>
        </div>

        {/* CTA: Only settings/themes navigation, NO extra + button */}
        <div className="flex items-center justify-center text-center">
          <button
            onClick={onOpenSettingsClick}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-700 group"
          >
            <span>Open AI Search & Theme Grading</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#84cc16] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
