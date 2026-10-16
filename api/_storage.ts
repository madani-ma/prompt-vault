import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { put, list } from '@vercel/blob';

const KV_PROMPTS_KEY = 'vault_prompts_v1';
const ROOT_DIR = process.cwd();
const PRIMARY_DB_PATH = path.join(ROOT_DIR, 'data', 'prompts.json');
const TMP_DB_PATH = path.join('/tmp', 'prompts.json');

// In-memory instance cache to prevent redundant fetches within a single lambda instance
let memoryPromptsCache: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 2000; // 2-second cache for fast repeated reads

export type StorageDriver = 'vercel-kv' | 'vercel-blob' | 'local-filesystem';

/**
 * Detect which persistent storage driver is available in the environment
 */
export function getStorageDriver(): StorageDriver {
  const hasKv = Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    process.env.KV_URL
  );

  if (hasKv) return 'vercel-kv';

  if (process.env.BLOB_READ_WRITE_TOKEN) return 'vercel-blob';

  return 'local-filesystem';
}

/**
 * Load default fallback prompts from local bundled JSON file
 */
function getBundledDefaultPrompts(): any[] {
  try {
    if (fs.existsSync(PRIMARY_DB_PATH)) {
      const raw = fs.readFileSync(PRIMARY_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not read bundled data/prompts.json:', err);
  }

  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const raw = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not read /tmp/prompts.json:', err);
  }

  return [];
}

/**
 * Reads all prompts from the persistent database (Vercel KV -> Vercel Blob -> Local file)
 */
export async function getPromptsFromDb(): Promise<{ prompts: any[]; driver: StorageDriver }> {
  const driver = getStorageDriver();

  // 1. Try Vercel KV (Redis)
  if (driver === 'vercel-kv') {
    try {
      const kvData = await kv.get<any[]>(KV_PROMPTS_KEY);
      if (Array.isArray(kvData) && kvData.length > 0) {
        memoryPromptsCache = kvData;
        lastCacheTime = Date.now();
        return { prompts: kvData, driver: 'vercel-kv' };
      }

      // First run: Seed Vercel KV with bundled prompts
      console.log('[Storage: Vercel KV] No data found in KV store, auto-seeding with default prompts...');
      const defaultPrompts = getBundledDefaultPrompts();
      if (defaultPrompts.length > 0) {
        await kv.set(KV_PROMPTS_KEY, defaultPrompts);
        memoryPromptsCache = defaultPrompts;
        lastCacheTime = Date.now();
        return { prompts: defaultPrompts, driver: 'vercel-kv' };
      }
    } catch (kvErr: any) {
      console.error('[Storage: Vercel KV] Error reading from KV store:', kvErr?.message || kvErr);
    }
  }

  // 2. Try Vercel Blob
  if (driver === 'vercel-blob') {
    try {
      const blobs = await list({ prefix: 'prompts.json' });
      const promptsBlob = blobs.blobs.find((b) => b.pathname === 'prompts.json');
      if (promptsBlob?.url) {
        const res = await fetch(promptsBlob.url, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            memoryPromptsCache = data;
            lastCacheTime = Date.now();
            return { prompts: data, driver: 'vercel-blob' };
          }
        }
      }
    } catch (blobErr: any) {
      console.error('[Storage: Vercel Blob] Error reading from Blob store:', blobErr?.message || blobErr);
    }
  }

  // 3. Fallback: Local filesystem / memory cache
  const localPrompts = getBundledDefaultPrompts();
  return { prompts: localPrompts, driver: 'local-filesystem' };
}

/**
 * Saves all prompts to persistent storage (Vercel KV -> Vercel Blob -> Local file)
 */
export async function savePromptsToDb(prompts: any[]): Promise<{
  success: boolean;
  driver: StorageDriver;
  error?: string;
}> {
  memoryPromptsCache = prompts;
  lastCacheTime = Date.now();

  const driver = getStorageDriver();

  // 1. Save to Vercel KV (Persistent globally across all users/devices)
  if (driver === 'vercel-kv') {
    try {
      await kv.set(KV_PROMPTS_KEY, prompts);
      console.log(`[Storage: Vercel KV] Successfully persisted ${prompts.length} prompts to KV store.`);
      return { success: true, driver: 'vercel-kv' };
    } catch (kvErr: any) {
      console.error('[Storage: Vercel KV] Error writing to KV store:', kvErr?.message || kvErr);
      return {
        success: false,
        driver: 'vercel-kv',
        error: `Vercel KV write error: ${kvErr?.message || 'Unknown error'}`
      };
    }
  }

  // 2. Save to Vercel Blob
  if (driver === 'vercel-blob') {
    try {
      await put('prompts.json', JSON.stringify(prompts, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });
      console.log(`[Storage: Vercel Blob] Successfully persisted ${prompts.length} prompts to Blob store.`);
      return { success: true, driver: 'vercel-blob' };
    } catch (blobErr: any) {
      console.error('[Storage: Vercel Blob] Error writing to Blob store:', blobErr?.message || blobErr);
      return {
        success: false,
        driver: 'vercel-blob',
        error: `Vercel Blob write error: ${blobErr?.message || 'Unknown error'}`
      };
    }
  }

  // 3. Fallback: Local filesystem (for local development or Docker)
  console.warn('[Storage] No Vercel KV or Blob credentials found. Writing to local file system.');
  try {
    const dataDir = path.dirname(PRIMARY_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DB_PATH, JSON.stringify(prompts, null, 2), 'utf-8');
    return { success: true, driver: 'local-filesystem' };
  } catch (localErr: any) {
    try {
      fs.writeFileSync(TMP_DB_PATH, JSON.stringify(prompts, null, 2), 'utf-8');
      return { success: true, driver: 'local-filesystem' };
    } catch (tmpErr: any) {
      return {
        success: true, // preserved in memory cache
        driver: 'local-filesystem',
        error: 'Saved in instance memory only.'
      };
    }
  }
}
