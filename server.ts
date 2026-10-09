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

  // Shared Cloud Database API: POST new prompt (Password-protected with MBS777ZX)
  app.post('/api/prompts', (req, res) => {
    const { password, prompt } = req.body;

    const normalizedPassword = String(password || '')
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();

    if (normalizedPassword !== 'MBS777ZX') {
      return res.status(401).json({ error: 'Incorrect submission password. Access denied.' });
    }

    if (!prompt || !prompt.title || !prompt.prompt) {
      return res.status(400).json({ error: 'Missing required prompt fields.' });
    }

    const currentPrompts = readPrompts();
    // Prepend new prompt
    const updated = [prompt, ...currentPrompts];
    const ok = writePrompts(updated);

    if (!ok) {
      return res.status(500).json({ error: 'Failed to write prompt to cloud database.' });
    }

    return res.status(201).json({ success: true, prompt });
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
