import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'prompts.json');

// Ensure database directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readPrompts(): any[] {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading prompts DB:', err);
    return [];
  }
}

function writePrompts(prompts: any[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(prompts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing prompts DB:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support JSON bodies up to 15MB for uploaded images/previews
  app.use(express.json({ limit: '15mb' }));

  // Shared Cloud Database API: GET all prompts
  app.get('/api/prompts', (_req, res) => {
    const prompts = readPrompts();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(prompts);
  });

  // Shared Cloud Database API: POST new prompt (Directly accessible for admin)
  app.post('/api/prompts', (req, res) => {
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
      dateAdded: rawPrompt.dateAdded || new Date().toISOString().split('T')[0],
      submittedBy: rawPrompt.submittedBy || '@Admin',
    };

    const currentPrompts = readPrompts();
    // Prepend new prompt
    const updated = [formattedPrompt, ...currentPrompts];
    const ok = writePrompts(updated);

    if (!ok) {
      return res.status(500).json({ error: 'Failed to write prompt to cloud database.' });
    }

    return res.status(201).json({ success: true, prompt: formattedPrompt });
  });

  // Admin API: DELETE prompt by ID
  app.delete('/api/prompts/:id', (req, res) => {
    const { id } = req.params;
    const currentPrompts = readPrompts();
    const filtered = currentPrompts.filter((p) => p.id !== id);
    if (filtered.length === currentPrompts.length) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }
    const ok = writePrompts(filtered);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to update database.' });
    }
    return res.json({ success: true, deletedId: id });
  });

  // Health / Status check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prompt Vault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
