import React from 'react';
import { Bookmark, Plus, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  showSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  onOpenSubmitModal: () => void;
  onOpenSettingsModal: () => void;
  totalPromptsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  savedCount,
  showSavedOnly,
  onToggleSavedOnly,
  onOpenSubmitModal,
  onOpenSettingsModal,
  totalPromptsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-purple-100/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#84cc16] to-[#65a30d] text-black font-black text-base flex items-center justify-center shadow-sm tracking-tight group-hover:scale-105 transition-transform">
              PV
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-purple-900 transition-colors uppercase">
                Prompt Vault
              </span>
              <span className="text-[10px] text-purple-700 font-semibold tracking-wider uppercase -mt-0.5">
                Curated AI Engine · {totalPromptsCount} Prompts
              </span>
            </div>
          </a>
        </div>

        {/* Action Controls with pill-shaped buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Settings / AI Search trigger */}
          <button
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors border border-purple-200/60 cursor-pointer"
            title="Settings & AI Natural Language Search"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline">Settings & AI Search</span>
          </button>

          {/* Saved Prompts Toggle */}
          <button
            onClick={onToggleSavedOnly}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all border cursor-pointer ${
              showSavedOnly
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title="View saved bookmarks"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current text-[#84cc16]' : 'text-slate-500'}`} />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                showSavedOnly ? 'bg-[#84cc16] text-black' : 'bg-slate-100 text-slate-700'
              }`}>
                {savedCount}
              </span>
            )}
          </button>

          {/* Submit Prompt CTA - Rounded pill button with lime-green accent and small arrow icon */}
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-black bg-[#84cc16] text-slate-950 hover:bg-[#a3e635] active:scale-98 rounded-full shadow-sm hover:shadow transition-all cursor-pointer group"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Submit Prompt</span>
            <span className="sm:hidden">Submit</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
