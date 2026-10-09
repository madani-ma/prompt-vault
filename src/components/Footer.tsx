import React from 'react';
import { ArrowUp } from 'lucide-react';

// Exact official SVG paths with consistent viewBox (0 0 24 24)
const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current flex-shrink-0`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.35a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.61a6.34 6.34 0 0 0 10.81 4.48c.03-.03.06-.06.09-.1V11.2a8.27 8.27 0 0 0 5.69 2.26v-3.41a4.88 4.88 0 0 1-3-.76v-.01c.97-.66 2.08-1.57 3-2.59z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current flex-shrink-0`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current flex-shrink-0`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface SocialPlatform {
  name: string;
  url: string;
  hoverBorder: string;
  icon: React.FC<{ className?: string }>;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@bucket_movies243',
    hoverBorder: 'group-hover:border-cyan-400 group-hover:text-cyan-300',
    icon: TikTokIcon,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/bucket_movies243',
    hoverBorder: 'group-hover:border-pink-500 group-hover:text-pink-400',
    icon: InstagramIcon,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/watch?v=MN6kYkr3DOQ',
    hoverBorder: 'group-hover:border-red-500 group-hover:text-red-400',
    icon: YouTubeIcon,
  },
];

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-slate-950 text-white border-t border-purple-900/40 mt-20 pt-16 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#84cc16] text-black flex items-center justify-center font-black text-xs shadow-xs">
                PV
              </span>
              <span className="font-black text-lg uppercase tracking-tight text-white">
                Prompt Vault
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Curated repository of production-grade AI image prompts for TikTok, Instagram Reels, and YouTube Shorts creators.
            </p>
          </div>

          {/* Social Media Section: Clean, professional, evenly-spaced horizontal row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-6 sm:gap-7">
              {SOCIAL_PLATFORMS.map(({ name, url, hoverBorder, icon: Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer"
                  title={`${name} Link`}
                  aria-label={name}
                >
                  {/* Consistent width and height dark circular button (w-11 h-11) */}
                  <div
                    className={`w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 transition-all shadow-xs group-hover:bg-slate-800/90 ${hoverBorder}`}
                  >
                    <Icon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Clean text label displayed below the icon with zero overlap */}
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 group-hover:text-white transition-colors">
                    {name}
                  </span>
                </a>
              ))}
            </div>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors border border-slate-800 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#84cc16]" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Prompt Vault · Curated for TikTok, Instagram Reels, and YouTube Shorts.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Verified Submissions</span>
            <span aria-hidden="true">·</span>
            <span>Zero Ads</span>
            <span aria-hidden="true">·</span>
            <span>Open Creator Tool</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
