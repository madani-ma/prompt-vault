import React from 'react';
import { Settings, Bookmark } from 'lucide-react';
import { ThemeConfig } from '../theme';

interface BottomNavBarProps {
  savedCount: number;
  showSavedOnly: boolean;
  theme: ThemeConfig;
  onOpenSettings: () => void;
  onToggleSaved: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  savedCount,
  showSavedOnly,
  theme,
  onOpenSettings,
  onToggleSaved,
}) => {
  return (
    <aside aria-label="Quick Navigation" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md ${theme.bottomNavBg} ${theme.bottomNavBorder}`}>
        {/* Left: Settings icon */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer group"
          title="Settings & Appearance"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-slate-400 group-hover:text-white">
            Settings
          </span>
        </button>

        {/* Divider between Settings and Saved */}
        <div className="w-[1px] h-6 bg-white/15" />

        {/* Right: Saved icon */}
        <button
          onClick={onToggleSaved}
          className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer group ${
            showSavedOnly
              ? 'text-[#84cc16] bg-white/15'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="View Saved Bookmarks"
          aria-label="Saved Prompts"
        >
          <Bookmark className={`w-5 h-5 ${showSavedOnly ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
            Saved
          </span>
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#84cc16] text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
