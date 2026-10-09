import React, { useRef, useEffect } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Category, Platform, SortOption } from '../types';
import { CATEGORIES } from '../data/prompts';
import { ThemeConfig } from '../theme';

interface FilterBarProps {
  theme: ThemeConfig;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  selectedPlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
  sortOption?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  categoryCounts: Record<string, number>;
}

// Official-style platform vector icons with fixed 24x24 scale and object-fit: contain
const TikTokIcon: React.FC<{ isSelected?: boolean }> = ({ isSelected }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="shrink-0"
    style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', objectFit: 'contain' }}
    fill={isSelected ? '#090d16' : '#cbd5e1'}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.35a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.61a6.34 6.34 0 0 0 10.81 4.48c.03-.03.06-.06.09-.1V11.2a8.27 8.27 0 0 0 5.69 2.26v-3.41a4.88 4.88 0 0 1-3-.76v-.01c.97-.66 2.08-1.57 3-2.59z" />
  </svg>
);

const InstagramIcon: React.FC<{ isSelected?: boolean }> = ({ isSelected }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="shrink-0"
    style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', objectFit: 'contain' }}
    fill={isSelected ? '#090d16' : '#cbd5e1'}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YouTubeIcon: React.FC<{ isSelected?: boolean }> = ({ isSelected }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="shrink-0"
    style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', objectFit: 'contain' }}
    fill={isSelected ? '#090d16' : '#cbd5e1'}
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// Exactly the 3 requested platforms
const PLATFORM_ITEMS = [
  { id: 'TikTok' as const, label: 'TikTok', icon: TikTokIcon },
  { id: 'Instagram Reel' as const, label: 'Instagram Reels', icon: InstagramIcon },
  { id: 'YouTube Shorts' as const, label: 'YouTube Shorts', icon: YouTubeIcon },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  theme,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  activeFilterCount,
  onResetFilters,
  categoryCounts,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlatformClick = (platformId: 'TikTok' | 'Instagram Reel' | 'YouTube Shorts') => {
    // If already active, toggle back to 'All', otherwise activate selected
    if (selectedPlatform === platformId) {
      onSelectPlatform('All');
    } else {
      onSelectPlatform(platformId);
    }
  };

  return (
    <div id="prompt-grid-anchor" className="w-full space-y-6 pt-2">
      {/* Search Input Bar with soft shadow and pill styling */}
      <div className="relative w-full max-w-3xl mx-auto">
        <div className="relative flex items-center shadow-xs">
          <Search className="absolute left-5 w-4 h-4 text-[#84cc16] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search prompts by keyword, subject, camera style, or AI model (press '/' to focus)..."
            className={`w-full pl-12 pr-12 py-4 rounded-full text-sm font-medium focus:outline-none transition-all shadow-xs border ${theme.filterInputBg} ${theme.filterInputBorder}`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Category Tabs — Kept exactly unchanged in position, order, counts, and styling */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar pt-2 justify-start sm:justify-center">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border select-none ${
                isSelected ? theme.filterTabActive : theme.filterTabInactive
              }`}
            >
              <span>{cat}</span>
              <span
                className={`ml-1.5 text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#84cc16] text-black' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Horizontal Divider below category tabs */}
      <div className="border-t border-slate-200/60 dark:border-slate-800 pt-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-xs">
          {/* 2. Platform Filters — Uniform 48px x 48px icons with labels cleanly below */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
            <span className={`font-black uppercase tracking-wider text-[11px] whitespace-nowrap shrink-0 ${theme.textSecondary}`}>
              PLATFORM:
            </span>

            {/* Exact uniform scale (48px x 48px), object-fit contain, zero text overlap */}
            <div className="flex items-center gap-5 sm:gap-7">
              {PLATFORM_ITEMS.map(({ id, label, icon: Icon }) => {
                const isSelected = selectedPlatform === id;
                return (
                  <button
                    key={id}
                    onClick={() => handlePlatformClick(id)}
                    className="group flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95 focus:outline-none"
                    title={`Filter by ${label}`}
                  >
                    {/* Fixed 48px x 48px icon container */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        minHeight: '48px',
                        maxWidth: '48px',
                        maxHeight: '48px',
                      }}
                      className={`rounded-2xl flex items-center justify-center transition-all duration-200 border shrink-0 shadow-xs ${
                        isSelected
                          ? 'bg-[#84cc16] text-slate-950 border-[#84cc16] shadow-md ring-2 ring-lime-400/50 scale-105'
                          : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon isSelected={isSelected} />
                    </div>

                    {/* Category title/label cleanly positioned below icon with zero text overlap */}
                    <span
                      className={`mt-1.5 text-[11px] font-bold tracking-tight text-center whitespace-nowrap transition-colors ${
                        isSelected ? 'text-[#84cc16]' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Professional Reset Filters Button with circular gold-outline icon button */}
          <div className="flex items-center sm:ml-auto shrink-0 self-center">
            <button
              onClick={onResetFilters}
              className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeFilterCount > 0
                  ? 'border-amber-400/80 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-300 shadow-xs'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-amber-500/50 hover:text-amber-300'
              }`}
              title="Reset all active category, platform, and search filters"
              aria-label="Reset Filters"
            >
              {/* Circular gold-outline icon button containing refresh-arrow symbol */}
              <span className="w-5 h-5 rounded-full border border-amber-400/80 flex items-center justify-center text-amber-400 group-hover:rotate-180 transition-transform duration-500 shrink-0">
                <RotateCcw className="w-2.5 h-2.5" />
              </span>

              {/* Text beside the circular icon */}
              <span className="tracking-wide font-bold">Reset Filters</span>

              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400/20 text-amber-300 font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
