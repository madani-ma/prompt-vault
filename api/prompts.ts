import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { put, list } from '@vercel/blob';

// Key for Vercel KV Redis store
const KV_PROMPTS_KEY = 'vault_prompts_v1';
const ROOT_DIR = process.cwd();
const PRIMARY_DB_PATH = path.join(ROOT_DIR, 'data', 'prompts.json');
const TMP_DB_PATH = path.join('/tmp', 'prompts.json');

// In-memory cache for fast repeated reads within a single serverless instance
let memoryPromptsCache: any[] | null = null;

export type StorageDriver = 'vercel-kv' | 'vercel-blob' | 'local-filesystem';

/**
 * Detect which persistent storage driver is configured in the environment
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
 * Reads all prompts from persistent storage (Vercel KV -> Vercel Blob -> local JSON file)
 */
export async function getPromptsFromDb(): Promise<{ prompts: any[]; driver: StorageDriver }> {
  const driver = getStorageDriver();

  // 1. Try Vercel KV (Redis)
  if (driver === 'vercel-kv') {
    try {
      const kvData = await kv.get<any[]>(KV_PROMPTS_KEY);
      if (Array.isArray(kvData) && kvData.length > 0) {
        memoryPromptsCache = kvData;
        return { prompts: kvData, driver: 'vercel-kv' };
      }

      // First run: Seed Vercel KV with bundled prompts
      console.log('[Storage: Vercel KV] Seeding fresh KV store with bundled prompts...');
      const defaultPrompts = getBundledDefaultPrompts();
      if (defaultPrompts.length > 0) {
        await kv.set(KV_PROMPTS_KEY, defaultPrompts);
        memoryPromptsCache = defaultPrompts;
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
 * Saves prompts to persistent storage (Vercel KV -> Vercel Blob -> local JSON file)
 */
export async function savePromptsToDb(prompts: any[]): Promise<{
  success: boolean;
  driver: StorageDriver;
  error?: string;
}> {
  memoryPromptsCache = prompts;
  const driver = getStorageDriver();

  // 1. Save to Vercel KV
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

  // 3. Fallback: Local filesystem
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
        success: true,
        driver: 'local-filesystem',
        error: 'Saved in instance memory only.'
      };
    }
  }
}

function getPromptTimestamp(item: any): number {
  if (!item) return 0;
  if (item.createdAt) {
    const t = new Date(item.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof item.id === 'string') {
    const idMatch = item.id.match(/(\d{12,14})/);
    if (idMatch) {
      const idTs = parseInt(idMatch[1], 10);
      if (!isNaN(idTs) && idTs > 1000000000000) return idTs;
    }
  }
  if (item.dateAdded) {
    const d = new Date(item.dateAdded).getTime();
    if (!isNaN(d) && d > 0) return d;
  }
  return 0;
}

export default async function handler(req: any, res: any) {
  // Ensure status and json helper methods exist on standard ServerResponse
  if (typeof res.status !== 'function') {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }

  if (typeof res.json !== 'function') {
    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
  }

  // Set standard CORS & Content-Type headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    // GET: Retrieve all prompts from persistent database
    if (req.method === 'GET') {
      const { prompts, driver } = await getPromptsFromDb();
      
      // Sort newest-first in descending order by timestamp
      prompts.sort((a, b) => {
        const timeA = getPromptTimestamp(a);
        const timeB = getPromptTimestamp(b);
        return timeB - timeA;
      });

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('X-Storage-Driver', driver);
      return res.status(200).json(prompts);
    }

    // POST: Create new prompt and persist to cloud database (Vercel KV / Blob)
    if (req.method === 'POST') {
      let body = req.body;

      // Handle unparsed string bodies in serverless
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err: any) {
          console.error('[API /api/prompts] Malformed JSON payload:', err);
          return res.status(400).json({ 
            error: 'Invalid JSON request body.',
            details: err.message
          });
        }
      }

      // Support both nested { prompt: { ... } } and direct payload { title, prompt: "...", ... }
      const rawPrompt = (body && typeof body.prompt === 'object' && body.prompt !== null)
        ? body.prompt
        : (body || {});

      const cleanTitle = rawPrompt.title ? String(rawPrompt.title).trim() : '';
      const cleanPromptText = typeof rawPrompt.prompt === 'string'
        ? rawPrompt.prompt.trim()
        : (typeof rawPrompt.text === 'string' ? rawPrompt.text.trim() : '');

      if (!cleanTitle || !cleanPromptText) {
        console.warn('[API /api/prompts] Missing required fields in payload:', { title: cleanTitle, hasPromptText: Boolean(cleanPromptText) });
        return res.status(400).json({ 
          error: 'Missing required prompt fields: both title and prompt text are required.' 
        });
      }

      const typeValue = rawPrompt.type === 'video' || rawPrompt.type === 'Video Prompt' ? 'video' : 'image';
      const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);

      const now = new Date();
      const formattedPrompt = {
        id: rawPrompt.id || `prompt-${Date.now()}-${slug || 'item'}`,
        title: cleanTitle,
        prompt: cleanPromptText,
        category: rawPrompt.category || 'Cinematic',
        platform: rawPrompt.platform || 'Instagram Reel',
        type: typeValue,
        model: rawPrompt.model || (typeValue === 'video' ? 'Runway Gen-3 / Luma Dream Machine' : 'Midjourney v6.1 / Flux.1'),
        aspectRatio: rawPrompt.aspectRatio || '9:16',
        howToUse: rawPrompt.howToUse || (typeValue === 'video' ? 'Copy and paste into your favorite AI video tool.' : 'Copy and paste this prompt into your preferred AI generator.'),
        imageUrl: rawPrompt.imageUrl || undefined,
        cameraSettings: rawPrompt.cameraSettings || 'Cinematic vertical composition, 8K HDR',
        lighting: rawPrompt.lighting || 'Cinematic studio lighting',
        copyCount: typeof rawPrompt.copyCount === 'number' ? rawPrompt.copyCount : 0,
        featured: typeof rawPrompt.featured === 'boolean' ? rawPrompt.featured : false,
        dateAdded: rawPrompt.dateAdded || now.toISOString().split('T')[0],
        createdAt: rawPrompt.createdAt || now.toISOString(),
        submittedBy: rawPrompt.submittedBy || '@Admin',
      };

      const { prompts: currentPrompts } = await getPromptsFromDb();
      const updatedPrompts = [formattedPrompt, ...currentPrompts.filter((p) => p.id !== formattedPrompt.id)];

      // Write to persistent database (Vercel KV -> Vercel Blob -> fallback)
      const saveResult = await savePromptsToDb(updatedPrompts);

      console.log(`[API /api/prompts] Added prompt "${formattedPrompt.title}" (${formattedPrompt.id}). Database: ${saveResult.driver}. Total prompts: ${updatedPrompts.length}`);

      return res.status(201).json({
        success: true,
        prompt: formattedPrompt,
        storage: saveResult.driver,
        notice: saveResult.error || undefined
      });
    }

    // DELETE: Delete prompt by ID (supports ?id=... or body { id })
    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) {
        return res.status(400).json({ error: 'Missing prompt id parameter.' });
      }

      const { prompts: currentPrompts } = await getPromptsFromDb();
      const filtered = currentPrompts.filter((p) => p.id !== id);

      if (filtered.length === currentPrompts.length) {
        return res.status(404).json({ error: 'Prompt not found.' });
      }

      const saveResult = await savePromptsToDb(filtered);
      console.log(`[API /api/prompts] Deleted prompt ID: ${id}. Storage: ${saveResult.driver}. Remaining: ${filtered.length}`);
      return res.status(200).json({ success: true, deletedId: id, storage: saveResult.driver });
    }

    // Fallback for unsupported HTTP methods
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (fatalError: any) {
    console.error('[API /api/prompts UNCAUGHT ERROR]:', fatalError);
    return res.status(500).json({
      error: fatalError?.message || 'Internal Server Error',
      details: String(fatalError?.stack || fatalError)
    });
  }
}
