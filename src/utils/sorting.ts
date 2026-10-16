import { PromptItem } from '../types';

/**
 * Extracts a comparable timestamp in milliseconds from a PromptItem.
 * Handles:
 * 1. Explicit `createdAt` ISO string or timestamp
 * 2. Embedded millisecond timestamp in ID (e.g. `prompt-1792161419779-slug`)
 * 3. `dateAdded` date string (e.g. "2026-10-16", "2026-10-11")
 */
export function getPromptTimestamp(item: PromptItem): number {
  if (!item) return 0;

  // 1. Explicit createdAt (e.g. ISO string or timestamp number)
  if (item.createdAt) {
    const time = new Date(item.createdAt).getTime();
    if (!isNaN(time) && time > 0) {
      return time;
    }
  }

  // 2. Embedded millisecond timestamp in prompt ID (e.g. prompt-1792161419779-...)
  if (typeof item.id === 'string') {
    const match = item.id.match(/(\d{12,14})/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 1000000000000) {
        return parsed;
      }
    }
  }

  // 3. Parse dateAdded string (e.g. "2026-10-16", "2026-10-11")
  if (item.dateAdded) {
    const time = new Date(item.dateAdded).getTime();
    if (!isNaN(time) && time > 0) {
      return time;
    }
  }

  return 0;
}

/**
 * Sorts an array of PromptItems in descending order (newest to oldest).
 * Newest / most recently added prompt always appears first.
 */
export function sortPromptsNewestFirst(list: PromptItem[]): PromptItem[] {
  return [...list].sort((a, b) => {
    const timeA = getPromptTimestamp(a);
    const timeB = getPromptTimestamp(b);

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // Stable tiebreaker for identical calendar dates:
    // Items earlier in the array were prepended later (newer)
    return list.indexOf(a) - list.indexOf(b);
  });
}
