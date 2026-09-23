import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { CALCULATORS } from './src/data/calculators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  // Collect valid calculator slugs
  const validSlugs = new Set<string>();
  CALCULATORS.forEach(c => {
    if (c.slug) validSlugs.add(c.slug);
  });

  if (hasDist) {
    console.log(`[Production] Serving static files from ${distPath}`);

    // 1. Trailing slash normalization: 301 redirect non-root trailing slash to clean URL
    app.use((req, res, next) => {
      if (req.path.length > 1 && req.path.endsWith('/')) {
        const query = req.url.slice(req.path.length);
        const newPath = req.path.slice(0, -1);
        return res.redirect(301, newPath + query);
      }
      next();
    });

    app.use(express.static(distPath));

    // 2. Strict server-side HTTP status routing (200 for valid routes, 404 for invalid slugs/pages)
    app.get('*', (req, res) => {
      const pathParts = req.path.split('/').filter(Boolean);

      if (pathParts[0] === 'calculators') {
        const slug = pathParts[1];
        if (!slug || !validSlugs.has(slug)) {
          return res.status(404).sendFile(path.join(distPath, 'index.html'));
        }
      } else if (pathParts.length > 0 && pathParts[0] !== 'admin' && pathParts[0] !== 'sitemap.xml' && pathParts[0] !== 'robots.txt') {
        // Unmatched top-level routes return genuine 404
        return res.status(404).sendFile(path.join(distPath, 'index.html'));
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Development] Starting Vite middleware server');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('Failed to start Vite middleware, falling back to static root', err);
      app.use(express.static(process.cwd()));
      app.get('*', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
