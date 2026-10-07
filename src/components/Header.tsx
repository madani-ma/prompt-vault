import React from 'react';
import { Bookmark, Plus, Sparkles, Video } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  showSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  onOpenSubmitModal: () => void;
  totalPromptsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  savedCount,
  showSavedOnly,
  onToggleSavedOnly,
  onOpenSubmitModal,
  totalPromptsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#fafafa]/90 backdrop-blur-md border-b border-black/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm tracking-wider">
              PV
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-black group-hover:opacity-80 transition-opacity">
                Prompt Vault
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest hidden sm:inline-block">
                Curated AI Repository
              </span>
            </div>
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Saved Prompts Toggle */}
          <button
            onClick={onToggleSavedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
              showSavedOnly
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:text-black'
            }`}
            title="View saved bookmarks"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className={`ml-1 text-[11px] font-semibold ${showSavedOnly ? 'text-neutral-300' : 'text-neutral-900'}`}>
                {savedCount}
              </span>
            )}
          </button>

          {/* Submit Prompt CTA */}
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Prompt</span>
            <span className="sm:hidden">Submit</span>
          </button>

          {/* Instagram Handle quick link */}
          <a
            href="https://instagram.com/yourhandle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-neutral-500 hover:text-black transition-colors hidden md:inline-flex items-center ml-2 border-l border-neutral-200 pl-4 py-1"
          >
            @yourhandle
          </a>
        </div>
      </div>
    </header>
  );
};
