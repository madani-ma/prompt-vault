import React, { useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Category, Platform, MediaType, SortOption } from '../types';
import { CATEGORIES, PLATFORMS } from '../data/prompts';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  selectedPlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
  selectedMediaType: MediaType;
  onSelectMediaType: (type: MediaType) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  categoryCounts: Record<string, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  selectedMediaType,
  onSelectMediaType,
  sortOption,
  onSortChange,
  activeFilterCount,
  onResetFilters,
  categoryCounts,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
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

  return (
    <div className="w-full space-y-6">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search prompts by keyword, subject, camera style, or AI model (press '/' to focus)..."
            className="w-full pl-11 pr-12 py-3.5 bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-1 text-neutral-400 hover:text-black transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (styled simply in black and white) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:text-black'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`ml-1.5 text-[10px] ${
                  isSelected ? 'text-neutral-300' : 'text-neutral-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Sub-Filters Strip: Platforms, Media Type, Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-neutral-150">
        {/* Platform segmented buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-neutral-400 font-medium mr-1 uppercase tracking-wider text-[10px]">
            Platform:
          </span>
          {PLATFORMS.map((platform) => {
            const isSelected = selectedPlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => onSelectPlatform(platform)}
                className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white border-black font-medium'
                    : 'bg-transparent text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                }`}
              >
                {platform}
              </button>
            );
          })}
        </div>

        {/* Media type & Sort controls */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {/* Format (Video vs Image) */}
          <div className="flex items-center gap-1 border border-neutral-200 p-0.5 bg-neutral-50">
            <button
              onClick={() => onSelectMediaType('all')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                selectedMediaType === 'all'
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => onSelectMediaType('video')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                selectedMediaType === 'video'
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Video Prompts
            </button>
            <button
              onClick={() => onSelectMediaType('image')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                selectedMediaType === 'image'
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Image Prompts
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-neutral-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-white border border-neutral-200 px-2.5 py-1 text-xs text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="trending">Sort: Trending</option>
              <option value="copies">Sort: Most Copied</option>
              <option value="newest">Sort: Newest Added</option>
            </select>
          </div>

          {/* Reset Filters if any active */}
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-neutral-500 hover:text-black underline underline-offset-2 text-xs transition-colors"
            >
              Reset filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
