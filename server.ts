import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getPromptsFromDb, savePromptsToDb, getStorageDriver, getStorageStatus } from './api/prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support JSON bodies up to 15MB for uploaded images/previews
  app.use(express.json({ limit: '15mb' }));

  // Shared Cloud Database API: GET all prompts (sorted newest first, strictly no-cache)
  app.get('/api/prompts', async (_req, res) => {
    try {
      const { prompts, driver } = await getPromptsFromDb();
      prompts.sort((a, b) => {
        const timeA = getPromptTimestamp(a);
        const timeB = getPromptTimestamp(b);
        return timeB - timeA;
      });
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Storage-Driver', driver);
      res.json(prompts);
    } catch (err: any) {
      console.error('[server.ts GET /api/prompts error]', err);
      res.status(500).json({ error: 'Failed to retrieve prompts from database.' });
    }
  });

  // Shared Cloud Database API: POST new prompt (Directly accessible for admin)
  app.post('/api/prompts', async (req, res) => {
    try {
      // Support both nested { prompt: { title, prompt, ... } } and direct payload { title, prompt: "...", ... }
      const rawPrompt = (req.body && typeof req.body.prompt === 'object' && req.body.prompt !== null)
        ? req.body.prompt
        : (req.body || {});

      const cleanTitle = rawPrompt.title ? String(rawPrompt.title).trim() : '';
      const cleanPromptText = typeof rawPrompt.prompt === 'string'
        ? rawPrompt.prompt.trim()
        : (typeof rawPrompt.text === 'string' ? rawPrompt.text.trim() : '');

      if (!cleanTitle || !cleanPromptText) {
        return res.status(400).json({ error: 'Missing required prompt fields (title and prompt text are required).' });
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
      // Prepend new prompt
      const updated = [formattedPrompt, ...currentPrompts.filter((p: any) => p.id !== formattedPrompt.id)];
      const saveResult = await savePromptsToDb(updated);

      if (!saveResult.success) {
        console.error('[Server POST /api/prompts ERROR] Failed to save prompt:', saveResult.error);
        return res.status(500).json({
          success: false,
          error: saveResult.error || 'Failed to save prompt to database.',
          storage: saveResult.driver,
        });
      }

      console.log(`[Server POST /api/prompts] Added "${formattedPrompt.title}" (${formattedPrompt.id}). Database: ${saveResult.driver}. Total: ${updated.length}`);

      return res.status(201).json({
        success: true,
        prompt: formattedPrompt,
        storage: saveResult.driver,
      });
    } catch (err: any) {
      console.error('[Server POST /api/prompts error]', err);
      return res.status(500).json({ error: 'Server error saving prompt to database.' });
    }
  });

  // Admin API: DELETE prompt by ID
  app.delete('/api/prompts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { prompts: currentPrompts } = await getPromptsFromDb();
      const filtered = currentPrompts.filter((p) => p.id !== id);
      if (filtered.length === currentPrompts.length) {
        return res.status(404).json({ error: 'Prompt not found.' });
      }
      const saveResult = await savePromptsToDb(filtered);
      return res.json({ success: true, deletedId: id, storage: saveResult.driver });
    } catch (err: any) {
      console.error('[Server DELETE /api/prompts error]', err);
      return res.status(500).json({ error: 'Failed to delete prompt from database.' });
    }
  });

  // Storage / DB Status diagnostic endpoint
  app.get('/api/storage/status', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.json(getStorageStatus());
  });

  // Health / Status check endpoint
  app.get('/api/health', (_req, res) => {
    const status = getStorageStatus();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.json({
      status: 'ok',
      runtime: 'express-vite',
      storage: {
        driver: status.driver,
        isPersistent: status.isPersistent,
        connectionMode: status.connectionMode,
        detectedVariables: status.detectedVariables,
      },
      time: new Date().toISOString(),
    });
  });

  // Mount Vite dev server in development or serve production build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Global Express JSON error handler (catches JSON parse errors, payload limits, uncaught route errors)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Express API Error Handler]:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: String(err.stack || err),
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prompt Vault server running on http://0.0.0.0:${PORT} [Storage Driver: ${getStorageDriver()}]`);
  });
}

startServer();
