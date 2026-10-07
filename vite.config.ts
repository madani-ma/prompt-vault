import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Determine base path for GitHub Pages deployment:
  // 1. Explicit env variable VITE_BASE_PATH if provided (e.g. "/prompt-vault/")
  // 2. Extracted from GitHub Actions GITHUB_REPOSITORY (e.g. "username/prompt-vault" -> "/prompt-vault/")
  // 3. Fallback to './' for relative asset resolution (works in any subdirectory or preview environment)
  let rawBase = process.env.VITE_BASE_PATH;

  if (!rawBase && process.env.GITHUB_REPOSITORY) {
    const [, repoName] = process.env.GITHUB_REPOSITORY.split('/');
    if (repoName) {
      rawBase = repoName.endsWith('.github.io') ? '/' : `/${repoName}/`;
    }
  }

  let basePath = './';
  if (rawBase) {
    const trimmed = rawBase.trim();
    if (trimmed === './' || trimmed === '.') {
      basePath = './';
    } else {
      const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      basePath = withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
    }
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
