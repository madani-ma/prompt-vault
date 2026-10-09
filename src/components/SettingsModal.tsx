import React, { useState } from 'react';
import { X, Sparkles, Search, Palette, ArrowRight, Check, Sliders } from 'lucide-react';
import { ThemeGrading, PromptItem } from '../types';
import { THEMES } from '../theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeGrading;
  onSelectTheme: (theme: ThemeGrading) => void;
  allPrompts: PromptItem[];
  onApplyAISearch: (query: string) => void;
  onSelectPrompt: (prompt: PromptItem) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  allPrompts,
  onApplyAISearch,
  onSelectPrompt,
}) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [aiResults, setAiResults] = useState<PromptItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  // AI-powered Natural Language Semantic Matcher
  const handleAISearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalQuery.trim()) return;

    const query = naturalQuery.toLowerCase();
    
    // Extract keywords and semantic concepts
    const tokens = query
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => !['find', 'me', 'a', 'the', 'for', 'with', 'in', 'and', 'or', 'prompt', 'prompts'].includes(w));

    // Semantic synonym mapping
    const conceptMap: Record<string, string[]> = {
      whatsapp: ['reel', 'tiktok', 'trending', 'social', 'mobile', 'status', 'drop', 'paparazzi'],
      trending: ['viral', 'hook', 'celebrity', 'candid', 'shibuya', 'paparazzi', 'drop'],
      cinematic: ['rain', 'shibuya', 'film', 'flash', 'night', 'paparazzi', '35mm', 'cinema'],
      coffee: ['espresso', 'artisan', 'crema', 'morning', 'cafe', 'macro'],
      comedy: ['cat', 'funny', 'corporate', 'office', 'humor', 'skit'],
      street: ['streetstyle', 'seoul', 'candid', 'fashion', 'denim', 'blazer'],
      luxury: ['perfume', 'travertine', 'minimalist', 'flacon', 'sculptural'],
      space: ['sci-fi', 'orbital', 'greenhouse', 'astronaut', 'future'],
    };

    const expandedTokens = new Set<string>(tokens);
    tokens.forEach((t) => {
      if (conceptMap[t]) {
        conceptMap[t].forEach((syn) => expandedTokens.add(syn));
      }
    });

    // Score prompts based on matches
    const scored = allPrompts.map((p) => {
      let score = 0;
      const fullText = `${p.title} ${p.prompt} ${p.howToUse} ${p.category} ${p.platform} ${p.model} ${p.cameraSettings || ''}`.toLowerCase();
      
      if (fullText.includes(query)) score += 10;

      expandedTokens.forEach((token) => {
        if (fullText.includes(token)) score += 3;
        if (p.title.toLowerCase().includes(token)) score += 4;
        if (p.category.toLowerCase().includes(token)) score += 2;
        if (p.platform.toLowerCase().includes(token)) score += 2;
      });

      return { prompt: p, score };
    });

    const matches = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.prompt);

    setAiResults(matches);
    setHasSearched(true);
  };

  const handleQuickSuggestion = (text: string) => {
    setNaturalQuery(text);
    setTimeout(() => {
      const inputElem = document.getElementById('ai-search-input') as HTMLInputElement;
      if (inputElem) inputElem.value = text;
      const query = text.toLowerCase();
      const matches = allPrompts.filter((p) => {
        const full = `${p.title} ${p.prompt} ${p.howToUse} ${p.category} ${p.platform}`.toLowerCase();
        return query.split(' ').some((word) => word.length > 3 && full.includes(word));
      });
      setAiResults(matches.length > 0 ? matches : allPrompts.slice(0, 3));
      setHasSearched(true);
    }, 50);
  };

  const handleApplyToMainGrid = () => {
    if (naturalQuery) {
      onApplyAISearch(naturalQuery);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-black uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>STUDIO PREFERENCES & AI TOOLS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
            SETTINGS & AI SEARCH
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Switch site color theme immediately or search prompts using conversational natural language.
          </p>
        </div>

        {/* Section 1: Color Theme / Color Grading (Live Application) */}
        <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-700" />
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Site Theme & Color Grading (Instant Live Switch)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Clicking a theme immediately applies the palette across the entire site:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Lavender & Lime (Default) */}
            <button
              onClick={() => onSelectTheme('lavender')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                currentTheme === 'lavender'
                  ? 'border-purple-600 bg-purple-50/90 ring-2 ring-purple-600 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-400" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#84cc16]" />
                </div>
                {currentTheme === 'lavender' && <Check className="w-4 h-4 text-purple-700 stroke-[3]" />}
              </div>
              <div className="text-xs font-black text-slate-900">Lavender & Lime</div>
              <div className="text-[10px] text-slate-500">Soft Purple & Lime</div>
            </button>

            {/* Cyber Navy */}
            <button
              onClick={() => onSelectTheme('cyber')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                currentTheme === 'cyber'
                  ? 'border-cyan-500 bg-slate-900 ring-2 ring-cyan-500 shadow-xs text-white'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#050811] border border-cyan-400" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#84cc16]" />
                </div>
                {currentTheme === 'cyber' && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
              </div>
              <div className={`text-xs font-black ${currentTheme === 'cyber' ? 'text-white' : 'text-slate-900'}`}>
                Cyber Navy
              </div>
              <div className={`text-[10px] ${currentTheme === 'cyber' ? 'text-cyan-300' : 'text-slate-500'}`}>
                Dark High-Tech
              </div>
            </button>

            {/* Emerald Mint */}
            <button
              onClick={() => onSelectTheme('emerald')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                currentTheme === 'emerald'
                  ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-600 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#84cc16]" />
                </div>
                {currentTheme === 'emerald' && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
              </div>
              <div className="text-xs font-black text-slate-900">Emerald Mint</div>
              <div className="text-[10px] text-slate-500">Fresh Botanical</div>
            </button>

            {/* Pure Monochrome */}
            <button
              onClick={() => onSelectTheme('monochrome')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                currentTheme === 'monochrome'
                  ? 'border-black bg-neutral-100 ring-2 ring-black shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-black" />
                  <span className="w-3.5 h-3.5 rounded-full bg-neutral-300" />
                </div>
                {currentTheme === 'monochrome' && <Check className="w-4 h-4 text-black stroke-[3]" />}
              </div>
              <div className="text-xs font-black text-slate-900">Pure Mono</div>
              <div className="text-[10px] text-slate-500">Black & White</div>
            </button>
          </div>
        </div>

        {/* Section 2: AI-Powered Natural Language Search Box */}
        <div className="p-5 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 rounded-2xl border border-purple-200/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#84cc16]" />
              <h3 className="text-xs font-black uppercase text-purple-950 tracking-wider">
                AI Natural Language Search Box
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-700 uppercase bg-purple-100/80 px-2 py-0.5 rounded-full">
              Semantic Search
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mb-3">
            Ask in plain conversational English what kind of prompt you need:
          </p>

          <form onSubmit={handleAISearch} className="space-y-3">
            <div className="relative">
              <input
                id="ai-search-input"
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder='e.g. "find me a WhatsApp trending prompt" or "night paparazzi flash"'
                className="w-full pl-4 pr-12 py-3 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#84cc16] hover:bg-[#a3e635] text-slate-950 rounded-lg transition-colors cursor-pointer"
                title="Search with AI"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-bold uppercase mr-1">Try:</span>
              {[
                'find me a WhatsApp trending prompt',
                'candid paparazzi celebrity flash',
                'artisan coffee morning aesthetic',
                'viral comedy cat spreadsheet',
              ].map((queryText) => (
                <button
                  key={queryText}
                  type="button"
                  onClick={() => handleQuickSuggestion(queryText)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 rounded-full border border-purple-200/70 font-semibold transition-colors cursor-pointer"
                >
                  "{queryText}"
                </button>
              ))}
            </div>
          </form>

          {/* AI Search Results Preview */}
          {hasSearched && (
            <div className="mt-5 pt-4 border-t border-purple-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Found {aiResults.length} matching prompts:</span>
                {aiResults.length > 0 && (
                  <button
                    onClick={handleApplyToMainGrid}
                    className="text-purple-700 hover:text-purple-900 underline text-[11px] cursor-pointer"
                  >
                    Apply filter to main vault view
                  </button>
                )}
              </div>

              {aiResults.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {aiResults.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectPrompt(item);
                        onClose();
                      }}
                      className="p-3 bg-white hover:bg-purple-50/70 rounded-xl border border-purple-100 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-purple-950 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {item.category} · {item.platform} · {item.model}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#84cc16] group-hover:underline flex-shrink-0 flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No matching prompts found in your vault yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
