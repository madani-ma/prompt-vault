import React, { useState } from 'react';
import { ArrowUp, Instagram, Copy, Check } from 'lucide-react';

export const Footer: React.FC = () => {
  const [handleCopied, setHandleCopied] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyHandle = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('@yourhandle');
    setHandleCopied(true);
    setTimeout(() => setHandleCopied(false), 2000);
  };

  return (
    <footer className="w-full bg-[#fafafa] border-t border-black/10 mt-24 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-neutral-200">
          {/* Brand Info */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">
                PV
              </span>
              <span className="font-bold text-base tracking-tight text-black">
                Prompt Vault
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Curated repository of production-grade AI prompts for video and image creators. Built with high-contrast typography and zero fluff.
            </p>
          </div>

          {/* Instagram Handle & Socials */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-black" />
              <a
                href="https://instagram.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-black hover:underline underline-offset-4 tracking-tight transition-colors"
              >
                @yourhandle
              </a>
              <button
                onClick={copyHandle}
                className="p-1 text-neutral-400 hover:text-black transition-colors"
                title="Copy Instagram handle"
                aria-label="Copy Instagram handle"
              >
                {handleCopied ? (
                  <Check className="w-3.5 h-3.5 text-black" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors border border-neutral-300 px-3 py-1.5 bg-white hover:border-black"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} Prompt Vault. All prompts curated for TikTok, Instagram Reels, and YouTube Shorts.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>No ads</span>
            <span aria-hidden="true">·</span>
            <span>Zero sponsored content</span>
            <span aria-hidden="true">·</span>
            <span>Open creator tool</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
