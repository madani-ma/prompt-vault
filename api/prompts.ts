import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

// In-memory cache for serverless environment
let inMemoryPrompts: any[] | null = null;

const ROOT_DIR = process.cwd();
const PRIMARY_DB_PATH = path.join(ROOT_DIR, 'data', 'prompts.json');
const TMP_DB_PATH = path.join('/tmp', 'prompts.json');

/**
 * Safely read prompts from available storage targets:
 * 1. /tmp/prompts.json (writable cache in serverless)
 * 2. data/prompts.json (bundled project data)
 * 3. in-memory fallback
 */
function readPromptsFromStorage(): any[] {
  // If memory cache exists, verify with disk
  if (inMemoryPrompts && inMemoryPrompts.length > 0) {
    return inMemoryPrompts;
  }

  // 1. Try reading from /tmp/prompts.json first (contains latest runtime writes in serverless)
  if (fs.existsSync(TMP_DB_PATH)) {
    try {
      const raw = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryPrompts = parsed;
        return parsed;
      }
    } catch (err) {
      console.error('[API Storage] Error reading from /tmp/prompts.json:', err);
    }
  }

  // 2. Try reading from project data/prompts.json
  if (fs.existsSync(PRIMARY_DB_PATH)) {
    try {
      const raw = fs.readFileSync(PRIMARY_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryPrompts = parsed;
        return parsed;
      }
    } catch (err) {
      console.error('[API Storage] Error reading from data/prompts.json:', err);
    }
  }

  return inMemoryPrompts || [];
}

/**
 * Safely persist prompts to storage with multi-tier fallback:
 * Tier 1: Project data/prompts.json (works in persistent Node / Docker)
 * Tier 2: /tmp/prompts.json (works in Vercel Serverless / AWS Lambda read-only FS)
 * Tier 3: In-memory cache
 */
function writePromptsToStorage(prompts: any[]): { success: boolean; storageLocation: string; error?: string } {
  // Always update in-memory cache first
  inMemoryPrompts = prompts;

  const jsonString = JSON.stringify(prompts, null, 2);

  // Tier 1: Try writing to project data/prompts.json
  try {
    const dataDir = path.dirname(PRIMARY_DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_DB_PATH, jsonString, 'utf-8');
    console.log('[API Storage] Successfully saved to primary data/prompts.json');
    return { success: true, storageLocation: 'primary' };
  } catch (primaryErr: any) {
    console.warn('[API Storage] Could not write to data/prompts.json (expected in Vercel serverless read-only environment):', primaryErr?.message || primaryErr);

    // Tier 2: Fallback to /tmp/prompts.json (writable in AWS Lambda/Vercel serverless)
    try {
      fs.writeFileSync(TMP_DB_PATH, jsonString, 'utf-8');
      console.log('[API Storage] Successfully saved to /tmp/prompts.json');
      return { success: true, storageLocation: 'tmp' };
    } catch (tmpErr: any) {
      console.error('[API Storage CRITICAL] Failed to write to /tmp/prompts.json:', tmpErr);
      // Retained in memory at least
      return { 
        success: true, 
        storageLocation: 'memory-only',
        error: `Disk write failed (${tmpErr.message}), preserved in instance memory.`
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
  // Helper to ensure json response method exists on standard ServerResponse
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
    // GET: Retrieve all prompts (sorted newest first)
    if (req.method === 'GET') {
      const prompts = readPromptsFromStorage();
      prompts.sort((a, b) => {
        const timeA = getPromptTimestamp(a);
        const timeB = getPromptTimestamp(b);
        return timeB - timeA;
      });
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json(prompts);
    }

    // POST: Create new prompt
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

      const currentPrompts = readPromptsFromStorage();
      const updatedPrompts = [formattedPrompt, ...currentPrompts];

      const saveResult = writePromptsToStorage(updatedPrompts);

      console.log(`[API /api/prompts] Added prompt "${formattedPrompt.title}" (${formattedPrompt.id}). Storage: ${saveResult.storageLocation}. Total prompts: ${updatedPrompts.length}`);

      return res.status(201).json({
        success: true,
        prompt: formattedPrompt,
        storage: saveResult.storageLocation,
        notice: saveResult.error || undefined
      });
    }

    // DELETE: Delete prompt by ID (supports ?id=... or body { id })
    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) {
        return res.status(400).json({ error: 'Missing prompt id parameter.' });
      }

      const currentPrompts = readPromptsFromStorage();
      const filtered = currentPrompts.filter((p) => p.id !== id);

      if (filtered.length === currentPrompts.length) {
        return res.status(404).json({ error: 'Prompt not found.' });
      }

      writePromptsToStorage(filtered);
      console.log(`[API /api/prompts] Deleted prompt ID: ${id}. Remaining: ${filtered.length}`);
      return res.status(200).json({ success: true, deletedId: id });
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
