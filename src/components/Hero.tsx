import React from 'react';

interface HeroProps {
  totalCount: number;
}

export const Hero: React.FC<HeroProps> = ({ totalCount }) => {
  return (
    <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center border-b border-black/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Curated status tag - clean text, no candy pill */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-6">
          <span>Engineered Prompts</span>
          <span aria-hidden="true">·</span>
          <span>Runway · Midjourney · Kling · Sora</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-black mb-5">
          Prompt Vault
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-2xl text-neutral-800 font-medium tracking-tight mb-4">
          Trending AI prompts, curated for creators.
        </p>

        {/* Subtext description */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-500 leading-relaxed font-normal">
          High-performing video and image generation prompts optimized for vertical short-form formats, cinematic lighting, and camera motion. Copy, adapt, and generate in seconds.
        </p>

        {/* Minimal metrics strip - zero pills, pure typographic numbers */}
        <div className="mt-10 pt-8 border-t border-neutral-200/80 max-w-xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-black tracking-tight">{totalCount}+</div>
            <div className="text-xs text-neutral-500 mt-0.5">Curated Prompts</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-black tracking-tight">9:16</div>
            <div className="text-xs text-neutral-500 mt-0.5">Mobile-Optimized</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-black tracking-tight">100%</div>
            <div className="text-xs text-neutral-500 mt-0.5">Production Tested</div>
          </div>
        </div>
      </div>
    </section>
  );
};
