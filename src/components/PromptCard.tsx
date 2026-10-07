import React, { useState } from 'react';
import { Copy, Check, Bookmark, ArrowUpRight, Info, Share2 } from 'lucide-react';
import { PromptItem } from '../types';

interface PromptCardProps {
  item: PromptItem;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onCopyPrompt: (promptText: string, id: string) => void;
  onSelectPrompt: (item: PromptItem) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  item,
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
      className="group relative bg-white border border-neutral-200 hover:border-black transition-all duration-200 flex flex-col justify-between"
    >
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header: Title and Bookmark Action */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2
            onClick={() => onSelectPrompt(item)}
            className="text-lg font-bold text-black tracking-tight group-hover:text-neutral-900 cursor-pointer"
          >
            {item.title}
          </h2>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share link button */}
            <button
              onClick={handleShare}
              className="p-1.5 text-neutral-400 hover:text-black transition-colors"
              title={shareFeedback ? 'Link copied!' : 'Share prompt'}
              aria-label="Share prompt"
            >
              {shareFeedback ? (
                <Check className="w-4 h-4 text-black" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleSaveToggle}
              className="p-1.5 text-neutral-400 hover:text-black transition-colors"
              title={isSaved ? 'Remove from saved' : 'Save prompt'}
              aria-label={isSaved ? 'Remove from saved' : 'Save prompt'}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? 'fill-black text-black' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500 mb-4 font-medium">
          <span className="text-black font-semibold">{item.category}</span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span>{item.platform}</span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span>{item.model}</span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span>{item.aspectRatio}</span>
        </div>

        {/* Prompt Content Box */}
        <div className="relative mb-4 flex-1">
          <div className="p-3.5 bg-neutral-50 border border-neutral-150 text-xs font-mono text-neutral-800 leading-relaxed break-words select-all">
            <p className={!isExpanded && item.prompt.length > 220 ? 'line-clamp-4' : ''}>
              {item.prompt}
            </p>
          </div>

          {item.prompt.length > 220 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1.5 text-[11px] text-neutral-500 hover:text-black font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isExpanded ? 'Collapse prompt' : 'Show full prompt'}
            </button>
          )}
        </div>

        {/* Short one-line "How to use this prompt" guide under each prompt card */}
        <div className="pt-3 border-t border-neutral-100 mt-auto">
          <div className="flex items-start gap-2 text-xs text-neutral-600 bg-neutral-50/60 p-2.5 border border-neutral-100">
            <Info className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="font-semibold text-black">How to use:</strong>{' '}
              {item.howToUse}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer: Copy Button & Detail Trigger */}
      <div className="px-5 py-3.5 sm:px-6 bg-neutral-50/50 border-t border-neutral-150 flex items-center justify-between gap-3">
        <button
          onClick={() => onSelectPrompt(item)}
          className="text-xs text-neutral-500 hover:text-black font-medium flex items-center gap-1 transition-colors"
        >
          <span>Camera specs</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>

        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all ${
            copied
              ? 'bg-neutral-800 text-white'
              : 'bg-black text-white hover:bg-neutral-800 active:scale-[0.98]'
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
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
