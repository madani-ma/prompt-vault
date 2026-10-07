import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Bookmark, Video, Image as ImageIcon, Sliders, ExternalLink } from 'lucide-react';
import { PromptItem } from '../types';

interface PromptDetailModalProps {
  item: PromptItem | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onCopyPrompt: (promptText: string, id: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onCopyPrompt,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    onCopyPrompt(item.prompt, item.id);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-black shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pr-10 mb-6">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-2">
            <span className="text-black font-semibold uppercase tracking-wider">{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.platform}</span>
            <span aria-hidden="true">·</span>
            <span className="uppercase">{item.type}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">
            {item.title}
          </h2>
        </div>

        {/* Prompt Container */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Prompt Text
            </label>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to clipboard' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200 font-mono text-xs sm:text-sm text-neutral-900 leading-relaxed break-words select-all">
            {item.prompt}
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mb-6 p-4 bg-neutral-100/70 border-l-2 border-black">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1">
            How to use this prompt
          </h3>
          <p className="text-sm text-neutral-800 leading-relaxed">
            {item.howToUse}
          </p>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs border-t border-neutral-200 pt-6">
          <div>
            <span className="text-neutral-500 block mb-1">Target Engine / Model</span>
            <span className="font-semibold text-black text-sm">{item.model}</span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Aspect Ratio</span>
            <span className="font-semibold text-black text-sm">{item.aspectRatio} (Vertical / Short-form)</span>
          </div>
          {item.cameraSettings && (
            <div className="sm:col-span-2">
              <span className="text-neutral-500 block mb-1">Camera & Lens Settings</span>
              <span className="font-normal text-neutral-800 leading-relaxed">{item.cameraSettings}</span>
            </div>
          )}
          {item.lighting && (
            <div className="sm:col-span-2">
              <span className="text-neutral-500 block mb-1">Lighting & Atmos</span>
              <span className="font-normal text-neutral-800 leading-relaxed">{item.lighting}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-200">
          <button
            onClick={() => onToggleSave(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border transition-colors ${
              isSaved
                ? 'bg-neutral-100 text-black border-black'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:text-black'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-black' : ''}`} />
            <span>{isSaved ? 'Saved to Favorites' : 'Save to Favorites'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Prompt Copied!' : 'Copy Full Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
