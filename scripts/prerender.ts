import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CALCULATORS } from '../src/data/calculators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  // Collect strictly unique official calculator slugs
  const slugs = new Set<string>();
  CALCULATORS.forEach(c => {
    if (c.slug) slugs.add(c.slug);
  });

  // Prerender strictly under /calculators/:slug
  slugs.forEach(slug => {
    const targetDir = path.join(distDir, 'calculators', slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);
    console.log(`Prerendered static fallback for /calculators/${slug}`);
  });

  // Generate clean XML sitemap strictly for official canonical URLs (no trailing slash, no admin, no 404, no explore)
  const baseUrl = 'https://ais-dev-imlglk7whto5i76mmwhawj-950284677903.asia-southeast1.run.app';
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemap += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  
  slugs.forEach(slug => {
    sitemap += `  <url><loc>${baseUrl}/calculators/${slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  });
  sitemap += `</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log('Generated clean dist/sitemap.xml successfully.');

} else {
  console.warn('dist/index.html not found for prerendering.');
}
