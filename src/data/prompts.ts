import { PromptItem } from '../types';

export const INITIAL_PROMPTS: PromptItem[] = [
  {
    id: 'prompt-celebrity-paparazzi',
    title: 'Celebrity Paparazzi',
    type: 'image',
    category: 'Cinematic',
    platform: 'Instagram Reel',
    model: 'Midjourney v6.1 / Flux.1',
    aspectRatio: '9:16',
    imageUrl: 'file_00000000b8ac8208a992034f2beb69af.png',
    prompt: "Transform this photo into a candid paparazzi-style celebrity shot. Add blurred photographers with cameras and flash lights in the background, a press crowd feel, dramatic night-time flash photography lighting, slight motion blur on the edges, high-fashion street-style mood, confident walking pose. Keep the main subject's face and outfit from the original photo unchanged.",
    howToUse: "Upload your original photo as an image-to-image reference. Use the prompt to wrap the subject in chaotic paparazzi camera flashes and night atmosphere while preserving exact identity.",
    cameraSettings: "24mm f/2.8 direct on-camera speedlite flash, 1/160s shutter, ISO 800",
    lighting: "Hard direct camera flash with ambient background crowd strobe flares",
    copyCount: 142,
    featured: true,
    dateAdded: "2026-10-09",
    submittedBy: "@Creator"
  }
];

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
