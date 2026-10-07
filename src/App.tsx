import React, { useState, useMemo, useEffect } from 'react';
import { PromptItem, Category, Platform, MediaType, SortOption } from './types';
import { INITIAL_PROMPTS } from './data/prompts';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { PromptDetailModal } from './components/PromptDetailModal';
import { SubmitPromptModal } from './components/SubmitPromptModal';
import { Footer } from './components/Footer';
import { Search, RotateCcw, Copy, Check, Sparkles, Filter } from 'lucide-react';

const SAVED_STORAGE_KEY = 'prompt_vault_saved_ids';
const USER_PROMPTS_STORAGE_KEY = 'prompt_vault_user_prompts';

export default function App() {
  // Saved / Bookmarked prompt IDs in localStorage
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : ['pv-01', 'pv-02'];
    } catch {
      return ['pv-01', 'pv-02'];
    }
  });

  // User-submitted prompts
  const [userPrompts, setUserPrompts] = useState<PromptItem[]>(() => {
    try {
      const stored = localStorage.getItem(USER_PROMPTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('All');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Modals & Selected Prompt
  const [activeModalPrompt, setActiveModalPrompt] = useState<PromptItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync savedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  // Sync user prompts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USER_PROMPTS_STORAGE_KEY, JSON.stringify(userPrompts));
    } catch (e) {
      console.error(e);
    }
  }, [userPrompts]);

  // Combined prompt list
  const allPrompts = useMemo(() => {
    return [...userPrompts, ...INITIAL_PROMPTS];
  }, [userPrompts]);

  // Handle Toggle Save
  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const isAlreadySaved = prev.includes(id);
      const updated = isAlreadySaved ? prev.filter((item) => item !== id) : [...prev, id];
      showToast(isAlreadySaved ? 'Removed from saved prompts' : 'Saved to favorites');
      return updated;
    });
  };

  // Toast trigger
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 2800);
  };

  // Handle Copy Prompt
  const handleCopyPrompt = (promptText: string, id: string) => {
    showToast('Prompt copied to clipboard');
  };

  // Add User-Submitted Prompt
  const handleAddNewPrompt = (newPrompt: PromptItem) => {
    setUserPrompts((prev) => [newPrompt, ...prev]);
    showToast('Prompt successfully added to vault!');
  };

  // Category counts based on active platform & media type filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allPrompts.length };
    allPrompts.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allPrompts]);

  // Filtered & Sorted prompts
  const filteredPrompts = useMemo(() => {
    let list = [...allPrompts];

    // Saved only filter
    if (showSavedOnly) {
      list = list.filter((p) => savedIds.includes(p.id));
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Platform filter
    if (selectedPlatform !== 'All') {
      list = list.filter((p) => p.platform === selectedPlatform || p.platform === 'Multi-Platform');
    }

    // Media type filter
    if (selectedMediaType !== 'all') {
      list = list.filter((p) => p.type === selectedMediaType);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          p.title.toLowerCase().includes(query) ||
          p.prompt.toLowerCase().includes(query) ||
          p.howToUse.toLowerCase().includes(query) ||
          p.model.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.platform.toLowerCase().includes(query) ||
          (p.cameraSettings && p.cameraSettings.toLowerCase().includes(query))
        );
      });
    }

    // Sorting
    if (sortOption === 'trending') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.copyCount - a.copyCount);
    } else if (sortOption === 'copies') {
      list.sort((a, b) => b.copyCount - a.copyCount);
    } else if (sortOption === 'newest') {
      list.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }

    return list;
  }, [
    allPrompts,
    savedIds,
    showSavedOnly,
    selectedCategory,
    selectedPlatform,
    selectedMediaType,
    searchQuery,
    sortOption,
  ]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'All') count++;
    if (selectedPlatform !== 'All') count++;
    if (selectedMediaType !== 'all') count++;
    if (showSavedOnly) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedPlatform, selectedMediaType, showSavedOnly]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPlatform('All');
    setSelectedMediaType('all');
    setShowSavedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] flex flex-col selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <Header
        savedCount={savedIds.length}
        showSavedOnly={showSavedOnly}
        onToggleSavedOnly={() => setShowSavedOnly((prev) => !prev)}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        totalPromptsCount={allPrompts.length}
      />

      {/* Hero Section */}
      <Hero totalCount={allPrompts.length} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Filter & Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (showSavedOnly) setShowSavedOnly(false);
          }}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          selectedMediaType={selectedMediaType}
          onSelectMediaType={setSelectedMediaType}
          sortOption={sortOption}
          onSortChange={setSortOption}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          categoryCounts={categoryCounts}
        />

        {/* Section Heading & Counter */}
        <div className="mt-10 mb-6 flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">
              {showSavedOnly ? 'Saved Prompts' : selectedCategory === 'All' ? 'All Prompts' : `${selectedCategory} Prompts`}
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              ({filteredPrompts.length} results)
            </span>
          </div>

          {showSavedOnly && (
            <button
              onClick={() => setShowSavedOnly(false)}
              className="text-xs text-neutral-600 hover:text-black font-medium underline underline-offset-2"
            >
              Show all prompts
            </button>
          )}
        </div>

        {/* Prompt Cards Grid */}
        {filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredPrompts.map((item) => (
              <PromptCard
                key={item.id}
                item={item}
                isSaved={savedIds.includes(item.id)}
                onToggleSave={handleToggleSave}
                onCopyPrompt={handleCopyPrompt}
                onSelectPrompt={(selected) => setActiveModalPrompt(selected)}
              />
            ))}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="py-20 text-center border border-neutral-200 bg-white p-8">
            <div className="max-w-md mx-auto space-y-4">
              <Search className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-lg font-bold text-black tracking-tight">
                No matching prompts found
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {showSavedOnly
                  ? "You haven't saved any prompts to your bookmarks yet. Click the bookmark icon on any card to save it."
                  : `No prompts matched "${searchQuery}". Try searching for keywords like "rain", "coffee", "macro", "drone", or "portrait".`}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Prompt Technical Detail Modal */}
      <PromptDetailModal
        item={activeModalPrompt}
        isOpen={!!activeModalPrompt}
        onClose={() => setActiveModalPrompt(null)}
        isSaved={activeModalPrompt ? savedIds.includes(activeModalPrompt.id) : false}
        onToggleSave={handleToggleSave}
        onCopyPrompt={handleCopyPrompt}
      />

      {/* Submit Prompt Modal */}
      <SubmitPromptModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleAddNewPrompt}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-3 shadow-xl border border-neutral-800 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
