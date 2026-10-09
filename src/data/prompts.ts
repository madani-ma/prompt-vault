import { PromptItem } from '../types';

// The prompt grid starts completely empty as requested.
// Only prompts submitted through the + button appear on the site.
export const INITIAL_PROMPTS: PromptItem[] = [];

export const CATEGORIES = [
  'All',
  'Cinematic',
  'Reel',
  'Comedy',
  'Product',
  'Character',
  'Sci-Fi',
  'Streetstyle',
  'Nature'
] as const;

export const PLATFORMS = [
  'All',
  'TikTok',
  'Instagram Reel',
  'YouTube Shorts'
] as const;
