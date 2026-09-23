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

  const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 - Calculator Not Found | CALCULA X</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="The requested calculator could not be found." />
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #05060A; color: #F7F8FC;">
    <div style="text-align: center; padding: 2.5rem; max-width: 480px; width: 90%; background: #0C101A; border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <h1 style="font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; color: #FF5D73; line-height: 1;">404</h1>
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #F7F8FC;">Calculator Not Found</h2>
      <p style="color: #9AA3B5; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.75rem;">The calculation model or page you are looking for does not exist or has been removed.</p>
      <a href="/" style="display: inline-block; padding: 0.75rem 1.5rem; background: #6948FF; color: #fff; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 0.9rem;">Return to Calculator Catalog</a>
    </div>
  </body>
</html>`;

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

    // 2. Strict server-side HTTP status routing & calculator prerendered HTML serving
    app.get('/calculators/:slug', (req, res) => {
      const slug = req.params.slug;
      if (!validSlugs.has(slug)) {
        return res.status(404).send(notFoundHtml);
      }
      const prerenderedFile = path.join(distPath, 'calculators', slug, 'index.html');
      if (fs.existsSync(prerenderedFile)) {
        return res.sendFile(prerenderedFile);
      }
      res.status(404).send(notFoundHtml);
    });

    app.get('*', (req, res) => {
      const pathParts = req.path.split('/').filter(Boolean);

      if (pathParts[0] === 'calculators') {
        const slug = pathParts[1];
        if (!slug || !validSlugs.has(slug)) {
          return res.status(404).send(notFoundHtml);
        }
      } else if (pathParts.length > 0 && pathParts[0] !== 'admin' && pathParts[0] !== 'sitemap.xml' && pathParts[0] !== 'robots.txt') {
        // Unmatched top-level routes return genuine 404
        return res.status(404).send(notFoundHtml);
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
