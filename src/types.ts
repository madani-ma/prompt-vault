export type Category = 
  | 'All'
  | 'Cinematic'
  | 'Reel'
  | 'Comedy'
  | 'Product'
  | 'Character'
  | 'Sci-Fi'
  | 'Streetstyle'
  | 'Nature';

export type Platform = 'All' | 'TikTok' | 'Instagram Reel' | 'YouTube Shorts';

export type MediaType = 'all' | 'video' | 'image';

export interface PromptItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  category: Exclude<Category, 'All'>;
  platform: 'TikTok' | 'Instagram Reel' | 'YouTube Shorts' | 'Multi-Platform';
  model: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  prompt: string;
  howToUse: string;
  cameraSettings?: string;
  lighting?: string;
  copyCount: number;
  featured?: boolean;
  dateAdded: string;
}

export type SortOption = 'trending' | 'newest' | 'copies';
