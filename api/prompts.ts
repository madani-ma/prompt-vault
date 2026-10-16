import type { IncomingMessage, ServerResponse } from 'http';
import { getPromptsFromDb, savePromptsToDb, getStorageDriver } from './_storage';

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
