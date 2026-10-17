import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { put, list } from '@vercel/blob';
import Redis from 'ioredis';

const KV_PROMPTS_KEY = 'vault_prompts_v1';
const ROOT_DIR = process.cwd();
const PRIMARY_DB_PATH = path.join(ROOT_DIR, 'data', 'prompts.json');
const TMP_DB_PATH = path.join('/tmp', 'prompts.json');

// In-memory cache for fast repeated reads within a single serverless instance
let memoryPromptsCache: any[] | null = null;
let ioredisInstance: Redis | null = null;

export type StorageDriver = 'vercel-kv' | 'redis-tcp' | 'vercel-blob' | 'local-filesystem';

export interface StorageConfig {
  driver: StorageDriver;
  isPersistent: boolean;
  connectionMode: 'vercel-kv-rest' | 'redis-tcp' | 'vercel-blob' | 'local-filesystem';
  detectedVars: string[];
  restUrl?: string;
  hasToken: boolean;
}

/**
 * Universal environment variable detector for Redis, Vercel KV, and Blob storage.
 * Detects all common naming conventions from Vercel, Upstash, and third-party integrations:
 * - KV_REST_API_URL / KV_REST_API_TOKEN
 * - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * - REDIS_URL / KV_URL (redis:// or rediss://)
 * - Auto-derives REST endpoints from Upstash TCP connection strings
 */
export function resolveStorageConfig(): StorageConfig {
  const detectedVars: string[] = [];
  let restUrl: string | undefined = undefined;
  let restToken: string | undefined = undefined;
  let redisTcpUrl: string | undefined = undefined;

  // 1. Scan for explicit REST API URLs
  const candidateRestUrlKeys = [
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
    'REDIS_REST_API_URL',
    'REST_API_URL',
  ];
  for (const key of candidateRestUrlKeys) {
    if (process.env[key] && typeof process.env[key] === 'string' && process.env[key]!.trim()) {
      restUrl = process.env[key]!.trim();
      detectedVars.push(key);
      break;
    }
  }

  // Also check any key ending with REST_API_URL (e.g. PROD_KV_REST_API_URL)
  if (!restUrl) {
    for (const [key, val] of Object.entries(process.env)) {
      if (typeof val === 'string' && val.trim() && (key.endsWith('_KV_REST_API_URL') || key.endsWith('_UPSTASH_REDIS_REST_URL') || key.endsWith('_REST_API_URL'))) {
        restUrl = val.trim();
        detectedVars.push(key);
        break;
      }
    }
  }

  // 2. Scan for explicit REST API Tokens
  const candidateRestTokenKeys = [
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
    'REDIS_REST_API_TOKEN',
    'REDIS_TOKEN',
    'REST_API_TOKEN',
  ];
  for (const key of candidateRestTokenKeys) {
    if (process.env[key] && typeof process.env[key] === 'string' && process.env[key]!.trim()) {
      restToken = process.env[key]!.trim();
      detectedVars.push(key);
      break;
    }
  }

  if (!restToken) {
    for (const [key, val] of Object.entries(process.env)) {
      if (typeof val === 'string' && val.trim() && (key.endsWith('_KV_REST_API_TOKEN') || key.endsWith('_UPSTASH_REDIS_REST_TOKEN') || key.endsWith('_REST_API_TOKEN'))) {
        restToken = val.trim();
        detectedVars.push(key);
        break;
      }
    }
  }

  // 3. Scan for Redis Connection Strings (redis:// or rediss://)
  const candidateRedisUrlKeys = [
    'KV_URL',
    'REDIS_URL',
    'UPSTASH_REDIS_URL',
    'STORAGE_REDIS_URL',
    'STORAGE_URL',
    'REDIS_URI',
  ];
  for (const key of candidateRedisUrlKeys) {
    if (process.env[key] && typeof process.env[key] === 'string' && (process.env[key]!.startsWith('redis://') || process.env[key]!.startsWith('rediss://'))) {
      redisTcpUrl = process.env[key]!.trim();
      detectedVars.push(key);
      break;
    }
  }

  // Dynamic search for any key whose value starts with redis:// or rediss://
  if (!redisTcpUrl) {
    for (const [key, val] of Object.entries(process.env)) {
      if (typeof val === 'string' && (val.startsWith('redis://') || val.startsWith('rediss://'))) {
        redisTcpUrl = val.trim();
        detectedVars.push(key);
        break;
      }
    }
  }

  // 4. If we have a Redis TCP URL from Upstash, auto-derive the REST URL and Token
  if (redisTcpUrl && (!restUrl || !restToken)) {
    try {
      const parsed = new URL(redisTcpUrl);
      if (parsed.hostname && parsed.hostname.includes('upstash.io')) {
        if (!restUrl) {
          restUrl = `https://${parsed.hostname}`;
          detectedVars.push('DERIVED_UPSTASH_REST_URL');
        }
        if (!restToken) {
          restToken = parsed.password || parsed.username;
          detectedVars.push('DERIVED_UPSTASH_REST_TOKEN');
        }
      }
    } catch (parseErr) {
      console.warn('[Storage] Error parsing redis connection URL:', parseErr);
    }
  }

  // 5. If REST credentials were found or derived, ensure @vercel/kv environment variables are set
  if (restUrl && restToken) {
    process.env.KV_REST_API_URL = restUrl;
    process.env.KV_REST_API_TOKEN = restToken;
    return {
      driver: 'vercel-kv',
      isPersistent: true,
      connectionMode: 'vercel-kv-rest',
      detectedVars,
      restUrl,
      hasToken: Boolean(restToken),
    };
  }

  // 6. If TCP Redis URL is found (e.g. non-Upstash Redis or direct TCP)
  if (redisTcpUrl) {
    return {
      driver: 'redis-tcp',
      isPersistent: true,
      connectionMode: 'redis-tcp',
      detectedVars,
      hasToken: true,
    };
  }

  // 7. Check for Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    detectedVars.push('BLOB_READ_WRITE_TOKEN');
    return {
      driver: 'vercel-blob',
      isPersistent: true,
      connectionMode: 'vercel-blob',
      detectedVars,
      hasToken: true,
    };
  }

  return {
    driver: 'local-filesystem',
    isPersistent: false,
    connectionMode: 'local-filesystem',
    detectedVars,
    hasToken: false,
  };
}

export function getStorageDriver(): StorageDriver {
  return resolveStorageConfig().driver;
}

export function getStorageStatus() {
  const config = resolveStorageConfig();
  return {
    status: 'ok',
    driver: config.driver,
    isPersistent: config.isPersistent,
    connectionMode: config.connectionMode,
    detectedVariables: config.detectedVars,
    hasCredentials: config.hasToken,
    time: new Date().toISOString(),
  };
}

/**
 * Returns a singleton ioredis client if TCP connection string is active
 */
function getRedisClient(): Redis | null {
  const config = resolveStorageConfig();
  if (config.driver !== 'redis-tcp') return null;

  if (!ioredisInstance) {
    const candidateKeys = ['KV_URL', 'REDIS_URL', 'UPSTASH_REDIS_URL', 'STORAGE_REDIS_URL', 'STORAGE_URL'];
    let connectionUrl = '';
    for (const key of candidateKeys) {
      if (process.env[key] && (process.env[key]!.startsWith('redis://') || process.env[key]!.startsWith('rediss://'))) {
        connectionUrl = process.env[key]!;
        break;
      }
    }
    if (!connectionUrl) {
      for (const val of Object.values(process.env)) {
        if (typeof val === 'string' && (val.startsWith('redis://') || val.startsWith('rediss://'))) {
          connectionUrl = val;
          break;
        }
      }
    }

    if (connectionUrl) {
      ioredisInstance = new Redis(connectionUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
      });
    }
  }

  return ioredisInstance;
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
 * Reads all prompts from persistent storage (Vercel KV REST -> ioredis TCP -> Vercel Blob -> local JSON file)
 */
export async function getPromptsFromDb(): Promise<{ prompts: any[]; driver: StorageDriver; mode: string }> {
  const config = resolveStorageConfig();

  // 1. Vercel KV REST (Native @vercel/kv)
  if (config.driver === 'vercel-kv') {
    try {
      const kvData = await kv.get<any[]>(KV_PROMPTS_KEY);
      if (Array.isArray(kvData) && kvData.length > 0) {
        memoryPromptsCache = kvData;
        return { prompts: kvData, driver: 'vercel-kv', mode: 'vercel-kv-rest' };
      }

      // First run: Seed Vercel KV with bundled prompts
      console.log('[Storage: Vercel KV] Seeding fresh KV store with default prompts...');
      const defaultPrompts = getBundledDefaultPrompts();
      if (defaultPrompts.length > 0) {
        await kv.set(KV_PROMPTS_KEY, defaultPrompts);
        memoryPromptsCache = defaultPrompts;
        return { prompts: defaultPrompts, driver: 'vercel-kv', mode: 'vercel-kv-rest' };
      }
    } catch (kvErr: any) {
      console.error('[Storage: Vercel KV REST ERROR]', kvErr?.message || kvErr);
    }
  }

  // 2. TCP Redis via ioredis
  if (config.driver === 'redis-tcp') {
    try {
      const client = getRedisClient();
      if (client) {
        if (client.status === 'wait') await client.connect();
        const raw = await client.get(KV_PROMPTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryPromptsCache = parsed;
            return { prompts: parsed, driver: 'redis-tcp', mode: 'redis-tcp' };
          }
        }
        // First run seed
        console.log('[Storage: Redis TCP] Seeding fresh Redis instance with default prompts...');
        const defaultPrompts = getBundledDefaultPrompts();
        if (defaultPrompts.length > 0) {
          await client.set(KV_PROMPTS_KEY, JSON.stringify(defaultPrompts));
          memoryPromptsCache = defaultPrompts;
          return { prompts: defaultPrompts, driver: 'redis-tcp', mode: 'redis-tcp' };
        }
      }
    } catch (tcpErr: any) {
      console.error('[Storage: Redis TCP ERROR]', tcpErr?.message || tcpErr);
    }
  }

  // 3. Vercel Blob
  if (config.driver === 'vercel-blob') {
    try {
      const blobs = await list({ prefix: 'prompts.json' });
      const promptsBlob = blobs.blobs.find((b) => b.pathname === 'prompts.json');
      if (promptsBlob?.url) {
        const res = await fetch(promptsBlob.url, {
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            memoryPromptsCache = data;
            return { prompts: data, driver: 'vercel-blob', mode: 'vercel-blob' };
          }
        }
      }
    } catch (blobErr: any) {
      console.error('[Storage: Vercel Blob ERROR]', blobErr?.message || blobErr);
    }
  }

  // 4. Fallback: Local filesystem / memory cache
  const localPrompts = getBundledDefaultPrompts();
  return { prompts: localPrompts, driver: 'local-filesystem', mode: 'local-filesystem' };
}

/**
 * Saves prompts to persistent storage and rigorously verifies the write.
 */
export async function savePromptsToDb(prompts: any[]): Promise<{
  success: boolean;
  driver: StorageDriver;
  error?: string;
}> {
  const config = resolveStorageConfig();

  // 1. Save to Vercel KV REST
  if (config.driver === 'vercel-kv') {
    try {
      console.log(`[Storage: Vercel KV] Writing ${prompts.length} prompts to KV key "${KV_PROMPTS_KEY}"...`);
      await kv.set(KV_PROMPTS_KEY, prompts);

      // Verify write by reading back
      const verified = await kv.get<any[]>(KV_PROMPTS_KEY);
      if (!Array.isArray(verified) || verified.length !== prompts.length) {
        const mismatchErr = `KV write verification failed: expected ${prompts.length} items, read back ${verified ? verified.length : 0}`;
        console.error('[Storage: Vercel KV ERROR]', mismatchErr);
        return { success: false, driver: 'vercel-kv', error: mismatchErr };
      }

      memoryPromptsCache = verified;
      console.log(`[Storage: Vercel KV] Write verified successfully: ${verified.length} prompts persistent.`);
      return { success: true, driver: 'vercel-kv' };
    } catch (kvErr: any) {
      const errorMsg = `Vercel KV write error: ${kvErr?.message || String(kvErr)}`;
      console.error('[Storage: Vercel KV CRITICAL ERROR]:', kvErr);
      return { success: false, driver: 'vercel-kv', error: errorMsg };
    }
  }

  // 2. Save to TCP Redis via ioredis
  if (config.driver === 'redis-tcp') {
    try {
      const client = getRedisClient();
      if (!client) throw new Error('Could not initialize Redis TCP client.');
      if (client.status === 'wait') await client.connect();

      await client.set(KV_PROMPTS_KEY, JSON.stringify(prompts));

      // Verify
      const checkRaw = await client.get(KV_PROMPTS_KEY);
      const checkParsed = checkRaw ? JSON.parse(checkRaw) : null;
      if (!Array.isArray(checkParsed) || checkParsed.length !== prompts.length) {
        throw new Error(`Redis TCP verification failed: expected ${prompts.length} items`);
      }

      memoryPromptsCache = checkParsed;
      console.log(`[Storage: Redis TCP] Write verified successfully: ${checkParsed.length} prompts persistent.`);
      return { success: true, driver: 'redis-tcp' };
    } catch (tcpErr: any) {
      const errorMsg = `Redis TCP write error: ${tcpErr?.message || String(tcpErr)}`;
      console.error('[Storage: Redis TCP CRITICAL ERROR]:', tcpErr);
      return { success: false, driver: 'redis-tcp', error: errorMsg };
    }
  }

  // 3. Save to Vercel Blob
  if (config.driver === 'vercel-blob') {
    try {
      console.log(`[Storage: Vercel Blob] Writing ${prompts.length} prompts to Blob storage...`);
      await put('prompts.json', JSON.stringify(prompts, null, 2), {
        access: 'public',
        addRandomSuffix: false,
      });
      memoryPromptsCache = prompts;
      console.log(`[Storage: Vercel Blob] Write successful: ${prompts.length} prompts persisted.`);
      return { success: true, driver: 'vercel-blob' };
    } catch (blobErr: any) {
      const errorMsg = `Vercel Blob write error: ${blobErr?.message || String(blobErr)}`;
      console.error('[Storage: Vercel Blob CRITICAL ERROR]:', blobErr);
      return { success: false, driver: 'vercel-blob', error: errorMsg };
    }
  }

  // 4. Fallback: Local filesystem
  const isVercelServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isVercelServerless) {
    const serverlessNotice =
      'Vercel Serverless environment detected with no persistent database connected. Serverless local disk writes are ephemeral and cannot persist across visitors. Please connect Vercel KV in your Vercel Project Dashboard (Storage -> Create Database -> KV).';
    console.error('[Storage: Vercel Serverless ERROR]', serverlessNotice);
    return {
      success: false,
      driver: 'local-filesystem',
      error: serverlessNotice,
    };
  }

  // Local development persistent disk environment (Node.js dev server)
  try {
    const dataDir = path.dirname(PRIMARY_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DB_PATH, JSON.stringify(prompts, null, 2), 'utf-8');

    // Verify
    const checkRaw = fs.readFileSync(PRIMARY_DB_PATH, 'utf-8');
    const checkParsed = JSON.parse(checkRaw);
    if (!Array.isArray(checkParsed) || checkParsed.length !== prompts.length) {
      throw new Error(`Local file verification failed: expected ${prompts.length} items`);
    }

    memoryPromptsCache = checkParsed;
    console.log(`[Storage: Local File] Successfully saved and verified ${checkParsed.length} prompts in ${PRIMARY_DB_PATH}`);
    return { success: true, driver: 'local-filesystem' };
  } catch (localErr: any) {
    console.error('[Storage: Local File ERROR]', localErr);
    return {
      success: false,
      driver: 'local-filesystem',
      error: `Failed to write to local filesystem: ${localErr?.message || String(localErr)}`,
    };
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
    // GET: Retrieve all prompts from persistent database (STRICT NO-CACHE)
    if (req.method === 'GET') {
      const { prompts, driver, mode } = await getPromptsFromDb();
      
      // Sort newest-first in descending order by timestamp
      prompts.sort((a, b) => {
        const timeA = getPromptTimestamp(a);
        const timeB = getPromptTimestamp(b);
        return timeB - timeA;
      });

      // Strict cache-busting headers to prevent stale cache on browsers, proxies, and Vercel edge
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Storage-Driver', driver);
      res.setHeader('X-Storage-Mode', mode);
      return res.status(200).json(prompts);
    }

    // POST: Create new prompt and persist to cloud database (Vercel KV / Redis / Blob)
    if (req.method === 'POST') {
      let body = req.body;

      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (err: any) {
          console.error('[API /api/prompts] Malformed JSON payload:', err);
          return res.status(400).json({ 
            success: false,
            error: 'Invalid JSON request body.',
            details: err.message,
          });
        }
      }

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
          success: false,
          error: 'Missing required prompt fields: both title and prompt text are required.',
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

      // Write to persistent database
      const saveResult = await savePromptsToDb(updatedPrompts);

      if (!saveResult.success) {
        console.error('[API /api/prompts ERROR] Failed to save prompt:', {
          title: formattedPrompt.title,
          error: saveResult.error,
          driver: saveResult.driver,
        });
        return res.status(500).json({
          success: false,
          error: saveResult.error || 'Failed to persist prompt to database.',
          storage: saveResult.driver,
        });
      }

      console.log(`[API /api/prompts] Confirmed write of "${formattedPrompt.title}" (${formattedPrompt.id}). Database: ${saveResult.driver}. Total prompts: ${updatedPrompts.length}`);

      return res.status(201).json({
        success: true,
        prompt: formattedPrompt,
        storage: saveResult.driver,
      });
    }

    // DELETE: Delete prompt by ID
    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing prompt id parameter.' });
      }

      const { prompts: currentPrompts } = await getPromptsFromDb();
      const filtered = currentPrompts.filter((p) => p.id !== id);

      if (filtered.length === currentPrompts.length) {
        return res.status(404).json({ success: false, error: 'Prompt not found.' });
      }

      const saveResult = await savePromptsToDb(filtered);
      if (!saveResult.success) {
        return res.status(500).json({ success: false, error: saveResult.error || 'Failed to delete prompt.' });
      }

      console.log(`[API /api/prompts] Confirmed deletion of ID: ${id}. Storage: ${saveResult.driver}. Remaining: ${filtered.length}`);
      return res.status(200).json({ success: true, deletedId: id, storage: saveResult.driver });
    }

    // Fallback for unsupported HTTP methods
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });

  } catch (fatalError: any) {
    console.error('[API /api/prompts UNCAUGHT ERROR]:', fatalError);
    return res.status(500).json({
      success: false,
      error: fatalError?.message || 'Internal Server Error',
      details: String(fatalError?.stack || fatalError),
    });
  }
}
