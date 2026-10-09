import React, { useState } from 'react';
import { Copy, Check, Bookmark, ArrowUpRight, Info, Share2, ArrowRight } from 'lucide-react';
import { PromptItem } from '../types';
import { ThemeConfig } from '../theme';

interface PromptCardProps {
  item: PromptItem;
  theme: ThemeConfig;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onCopyPrompt: (promptText: string, id: string) => void;
  onSelectPrompt: (item: PromptItem) => void;
}

const resolveImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
};

export const PromptCard: React.FC<PromptCardProps> = ({
  item,
  theme,
  isSaved,
  onToggleSave,
  onCopyPrompt,
  onSelectPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    onCopyPrompt(item.prompt, item.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + window.location.pathname + `#${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(item.id);
  };

  return (
    <article
      id={item.id}
      className={`group relative rounded-2xl border ${theme.cardBg} ${theme.cardBorder} ${theme.cardBorderHover} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden`}
    >
      {/* Top Image if present */}
      {item.imageUrl ? (
        <div 
          onClick={() => onSelectPrompt(item)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100 cursor-pointer"
        >
          <img
            src={resolveImageUrl(item.imageUrl)}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-[#84cc16] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
            Preview
          </div>
          {item.submittedBy && (
            <div className="absolute top-3 right-3 bg-white/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {item.submittedBy}
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => onSelectPrompt(item)}
          className="w-full h-12 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-5 cursor-pointer"
        >
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>
            {item.category} · {item.model}
          </span>
          <span className="text-[10px] font-mono opacity-60">
            {item.aspectRatio}
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header: Title and Actions */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2
            onClick={() => onSelectPrompt(item)}
            className={`text-lg font-black uppercase tracking-tight ${theme.cardText} cursor-pointer transition-colors leading-snug`}
          >
            {item.title}
          </h2>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Share link button */}
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              title={shareFeedback ? 'Link copied!' : 'Share prompt'}
              aria-label="Share prompt"
            >
              {shareFeedback ? (
                <Check className="w-4 h-4 text-[#84cc16]" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleSaveToggle}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              title={isSaved ? 'Remove from saved' : 'Save prompt'}
              aria-label={isSaved ? 'Remove from saved' : 'Save prompt'}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? 'fill-[#84cc16] text-[#84cc16]' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Clean Unboxed Metadata Line */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mb-4 font-semibold">
          <span className={`${theme.textSecondary} uppercase tracking-wide`}>{item.category}</span>
          <span aria-hidden="true" className="opacity-30">·</span>
          <span className={theme.cardSecondaryText}>{item.platform}</span>
          <span aria-hidden="true" className="opacity-30">·</span>
          <span className={theme.cardSecondaryText}>{item.model}</span>
          <span aria-hidden="true" className="opacity-30">·</span>
          <span className="font-mono text-[11px] opacity-70">{item.aspectRatio}</span>
        </div>

        {/* Prompt Content Box */}
        <div className="relative mb-4 flex-1">
          <div className={`p-3.5 rounded-xl border text-xs font-mono leading-relaxed break-words select-all ${theme.cardPromptBox} ${theme.cardPromptText}`}>
            <p className={!isExpanded && item.prompt.length > 200 ? 'line-clamp-4' : ''}>
              {item.prompt}
            </p>
          </div>

          {item.prompt.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1.5 text-[11px] font-bold underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isExpanded ? 'Collapse prompt' : 'Show full prompt'}
            </button>
          )}
        </div>

        {/* Short one-line "How to use this prompt" guide */}
        <div className="pt-3 border-t border-slate-100 mt-auto">
          <div className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${theme.cardGuideBg} ${theme.cardGuideText}`}>
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#84cc16]" />
            <p className="leading-snug">
              <strong className="font-bold uppercase text-[11px]">How to use:</strong>{' '}
              {item.howToUse}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer: Rounded pill buttons */}
      <div className="px-5 py-3.5 sm:px-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => onSelectPrompt(item)}
          className="text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer opacity-70 hover:opacity-100"
        >
          <span>Camera specs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* Rounded pill-shaped Copy button with lime-green accent and small arrow icon */}
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer group active:scale-95 ${
            copied
              ? 'bg-slate-900 text-white'
              : 'bg-[#84cc16] hover:bg-[#a3e635] text-slate-950'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </article>
  );
};
