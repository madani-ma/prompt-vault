import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PromptItem, Category, Platform, SortOption, ThemeGrading } from './types';
import { THEMES } from './theme';
import { Hero } from './components/Hero';
import { NavyFeatureSection } from './components/NavyFeatureSection';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { Pagination } from './components/Pagination';
import { PromptDetailModal } from './components/PromptDetailModal';
import { SubmitPromptModal } from './components/SubmitPromptModal';
import { SettingsModal } from './components/SettingsModal';
import { BottomNavBar } from './components/BottomNavBar';
import { Footer } from './components/Footer';
import { Check, Inbox, Cloud, RefreshCw } from 'lucide-react';

const SAVED_STORAGE_KEY = 'prompt_vault_saved_ids_v6';
const THEME_STORAGE_KEY = 'prompt_vault_theme_v6';
const ITEMS_PER_PAGE = 6;

export default function App() {
  // Theme state: Live color grading
  const [currentTheme, setCurrentTheme] = useState<ThemeGrading>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return (stored as ThemeGrading) || 'lavender';
    } catch {
      return 'lavender';
    }
  });

  const activeTheme = useMemo(() => {
    return THEMES[currentTheme] || THEMES.lavender;
  }, [currentTheme]);

  // Saved / Bookmarked prompt IDs (personal to each browser session)
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Shared Cloud Database: Prompts are fetched from /api/prompts
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('All');
  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [activeModalPrompt, setActiveModalPrompt] = useState<PromptItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync personal saved bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (e) {
      console.error(e);
    }
  }, [currentTheme]);

  // Fetch prompts directly from shared cloud database
  const fetchPromptsFromCloud = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPrompts(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch from cloud database:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  // On page load: Fetch from cloud database and keep synced across all devices
  useEffect(() => {
    fetchPromptsFromCloud();

    // Auto-sync every 6 seconds so other visitors and devices see newly submitted prompts live
    const interval = setInterval(fetchPromptsFromCloud, 6000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPromptsFromCloud();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchPromptsFromCloud]);

  // Handle Toggle Save
  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const isAlreadySaved = prev.includes(id);
      const updated = isAlreadySaved ? prev.filter((item) => item !== id) : [...prev, id];
      showToast(isAlreadySaved ? 'Removed from saved prompts' : 'Saved to favorites');
      return updated;
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 2800);
  };

  const handleCopyPrompt = (_promptText: string, _id: string) => {
    showToast('Prompt copied to clipboard!');
  };

  // Add Public Verified Submission
  const handleAddNewPrompt = (newPrompt: PromptItem) => {
    setPrompts((prev) => [newPrompt, ...prev.filter((p) => p.id !== newPrompt.id)]);
    showToast('Prompt published to cloud database!');
    // Re-verify from cloud
    setTimeout(fetchPromptsFromCloud, 600);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: prompts.length };
    prompts.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [prompts]);

  // Filtered & Sorted prompts
  const filteredPrompts = useMemo(() => {
    let list = [...prompts];

    if (showSavedOnly) {
      list = list.filter((p) => savedIds.includes(p.id));
    }

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (selectedPlatform !== 'All') {
      list = list.filter((p) => p.platform === selectedPlatform || p.platform === 'Multi-Platform');
    }

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

    if (sortOption === 'trending') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.copyCount - a.copyCount);
    } else if (sortOption === 'copies') {
      list.sort((a, b) => b.copyCount - a.copyCount);
    } else if (sortOption === 'newest') {
      list.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }

    return list;
  }, [
    prompts,
    savedIds,
    showSavedOnly,
    selectedCategory,
    selectedPlatform,
    searchQuery,
    sortOption,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedPlatform, showSavedOnly, sortOption]);

  // Paginated slice
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPrompts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPrompts, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'All') count++;
    if (selectedPlatform !== 'All') count++;
    if (showSavedOnly) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedPlatform, showSavedOnly]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPlatform('All');
    setShowSavedOnly(false);
  };

  const scrollToGrid = () => {
    const el = document.getElementById('prompt-grid-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${activeTheme.pageBg} ${activeTheme.textPrimary}`}>
      {/* Hero Section: Live theme background and single Explore button */}
      <Hero
        totalCount={prompts.length}
        theme={activeTheme}
        onExploreClick={scrollToGrid}
      />

      {/* Main Single-Scroll Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Filter & Search Bar with live theme pill tabs */}
        <FilterBar
          theme={activeTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (showSavedOnly) setShowSavedOnly(false);
          }}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          sortOption={sortOption}
          onSortChange={setSortOption}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          categoryCounts={categoryCounts}
        />

        {/* Section Heading & Counter with Cloud Sync status */}
        <div className="mt-10 mb-6 flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-black uppercase tracking-wider">
              {showSavedOnly ? 'Saved Bookmarks' : selectedCategory === 'All' ? 'Prompt Directory' : `${selectedCategory} Prompts`}
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/60 text-slate-800">
              {filteredPrompts.length} Prompts
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Cloud Sync indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <Cloud className="w-3.5 h-3.5" />
              <span>Shared Cloud DB Connected</span>
            </div>

            {showSavedOnly && (
              <button
                onClick={() => setShowSavedOnly(false)}
                className="text-xs font-bold underline underline-offset-2 cursor-pointer text-[#84cc16] hover:opacity-80"
              >
                Show all prompts
              </button>
            )}
          </div>
        </div>

        {/* Prompt Cards Grid / Empty State */}
        {isLoadingCloud ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#84cc16]" />
              <span>Connecting to shared cloud database...</span>
            </div>
          </div>
        ) : prompts.length === 0 ? (
          /* Empty Vault State */
          <div className={`py-24 text-center border rounded-3xl p-8 shadow-xs my-6 ${activeTheme.cardBg} ${activeTheme.cardBorder}`}>
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[#84cc16]/20 text-[#84cc16]">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">
                Vault is Ready for Your Prompts
              </h3>
              <p className={`text-xs leading-relaxed font-normal ${activeTheme.cardSecondaryText}`}>
                All sample and placeholder prompts have been cleared. Tap the prominent <strong>+</strong> button in the bottom navigation bar to submit your first prompt with password <strong>MBS777ZX</strong>. It will be saved directly to the cloud database and instantly viewable on all devices.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  Cloud database live for all visitors
                </span>
              </div>
            </div>
          </div>
        ) : paginatedPrompts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedPrompts.map((item) => (
                <PromptCard
                  key={item.id}
                  item={item}
                  theme={activeTheme}
                  isSaved={savedIds.includes(item.id)}
                  onToggleSave={handleToggleSave}
                  onCopyPrompt={handleCopyPrompt}
                  onSelectPrompt={(selected) => setActiveModalPrompt(selected)}
                />
              ))}
            </div>

            {/* Numbered Pagination (1, 2, 3...) with green circular highlight */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPrompts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              theme={activeTheme}
            />
          </>
        ) : (
          /* Filtered empty state */
          <div className={`py-20 text-center border rounded-3xl p-8 shadow-xs ${activeTheme.cardBg} ${activeTheme.cardBorder}`}>
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tight">
                No matching prompts
              </h3>
              <p className={`text-xs leading-relaxed font-normal ${activeTheme.cardSecondaryText}`}>
                {showSavedOnly
                  ? "You haven't bookmarked any prompts yet. Click the bookmark icon on any card to save it."
                  : `No prompts matched "${searchQuery}".`}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84cc16] hover:bg-[#a3e635] text-slate-950 text-xs font-black uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer"
                >
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dark Navy Feature / Info Section */}
        <NavyFeatureSection
          theme={activeTheme}
          onOpenSettingsClick={() => setIsSettingsModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Single fixed bottom navigation bar (Settings left, + center, Saved right) */}
      <BottomNavBar
        savedCount={savedIds.length}
        showSavedOnly={showSavedOnly}
        theme={activeTheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
        onToggleSaved={() => {
          setShowSavedOnly((prev) => !prev);
          scrollToGrid();
        }}
      />

      {/* Prompt Technical Detail Modal */}
      <PromptDetailModal
        item={activeModalPrompt}
        isOpen={!!activeModalPrompt}
        onClose={() => setActiveModalPrompt(null)}
        isSaved={activeModalPrompt ? savedIds.includes(activeModalPrompt.id) : false}
        onToggleSave={handleToggleSave}
        onCopyPrompt={handleCopyPrompt}
      />

      {/* Password-Protected Submission Modal: Writes to Cloud Database */}
      <SubmitPromptModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleAddNewPrompt}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={(themeKey) => {
          setCurrentTheme(themeKey);
          showToast(`Applied ${THEMES[themeKey].name} theme!`);
        }}
        allPrompts={prompts}
        onApplyAISearch={(query) => {
          setSearchQuery(query);
          scrollToGrid();
        }}
        onSelectPrompt={(selected) => setActiveModalPrompt(selected)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 shadow-2xl rounded-2xl border border-slate-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#84cc16]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
