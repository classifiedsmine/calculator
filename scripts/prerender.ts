import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CALCULATORS } from '../src/data/calculators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

const baseUrl = 'https://ais-dev-imlglk7whto5i76mmwhawj-950284677903.asia-southeast1.run.app';

if (fs.existsSync(indexPath)) {
  const baseHtml = fs.readFileSync(indexPath, 'utf-8');

  CALCULATORS.forEach(calculator => {
    if (!calculator.slug) return;

    const canonicalUrl = `${baseUrl}/calculators/${calculator.slug}`;
    const pageTitle = `${calculator.title} – Free Online Calculator | CALCULA X`;
    const pageDescription = `Free online ${calculator.title}. ${calculator.tagline} ${calculator.description.slice(0, 120)}...`;
    
    // JSON-LD schemas
    const isFinance = calculator.category === 'finance' || calculator.id === 'compound-interest' || calculator.slug === 'compound-interest';
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': isFinance ? ['WebApplication', 'FinancialProduct'] : 'WebApplication',
      'name': calculator.title,
      'alternateName': `${calculator.title} Online Tool`,
      'url': canonicalUrl,
      'description': pageDescription,
      'applicationCategory': isFinance ? 'Wealth Management Software' : 'ComputationApplication',
      'operatingSystem': 'Web Browser',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'softwareVersion': '2.0',
      'inLanguage': 'en-US',
      'isAccessibleForFree': true,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock',
      },
      'author': {
        '@type': 'Organization',
        'name': 'CALCULA X',
        'url': baseUrl,
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${baseUrl}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Calculators', 'item': `${baseUrl}/` },
        { '@type': 'ListItem', 'position': 3, 'name': calculator.title, 'item': canonicalUrl },
      ],
    };

    const faqSchema = calculator.faqs && calculator.faqs.length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': calculator.faqs.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
      })),
    } : null;

    const schemas = [webAppSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])];
    const jsonLdScript = `<script type="application/ld+json" id="prerendered-schema">${JSON.stringify(schemas)}</script>`;

    // Static HTML fallback content for crawlers before hydration
    const staticContent = `
      <div id="root">
        <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; color: #111;">
          <nav style="margin-bottom: 1rem; font-size: 0.85rem; color: #666;">
            <a href="/">Home</a> › <a href="/">Calculators</a> › <span>${calculator.title}</span>
          </nav>
          <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.025em;">${calculator.title}</h1>
          <p style="font-size: 1.125rem; line-height: 1.6; color: #444; margin-bottom: 2rem;">${calculator.description}</p>
          
          <section style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 1rem; border: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">Formula & Methodology</h2>
            <p style="color: #334155; line-height: 1.6; font-family: monospace;">${calculator.formulaDisplay || 'Standard mathematical computation algorithm.'}</p>
          </section>

          ${calculator.faqs && calculator.faqs.length > 0 ? `
            <section style="margin-bottom: 2rem;">
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Frequently Asked Questions</h2>
              ${calculator.faqs.map(f => `
                <div style="margin-bottom: 1rem; padding: 1rem; border-left: 3px solid #6948FF; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 0.5rem;">
                  <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a;">${f.q}</h3>
                  <p style="font-size: 0.95rem; color: #334155; line-height: 1.5; margin: 0;">${f.a}</p>
                </div>
              `).join('')}
            </section>
          ` : ''}
          <div style="text-align: center; color: #888; font-size: 0.85rem; margin-top: 3rem;">Loading interactive calculator application...</div>
        </div>
      </div>
    `;

    let html = baseHtml;

    // Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

    // Replace description meta
    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${pageDescription}">`);

    // Inject canonical & JSON-LD before </head>
    const headInjection = `
      <link rel="canonical" href="${canonicalUrl}" />
      <meta property="og:title" content="${pageTitle}" />
      <meta property="og:description" content="${pageDescription}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      ${jsonLdScript}
    `;
    html = html.replace('</head>', `${headInjection}\n</head>`);

    // Replace root with static content
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, staticContent);

    const targetDir = path.join(distDir, 'calculators', calculator.slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, 'index.html'), html);
    console.log(`Prerendered true SEO HTML for /calculators/${calculator.slug}`);
  });

  // Generate sitemap.xml
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemap += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  
  CALCULATORS.forEach(c => {
    if (c.slug) {
      sitemap += `  <url><loc>${baseUrl}/calculators/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
    }
  });
  sitemap += `</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log('Generated clean dist/sitemap.xml successfully.');

} else {
  console.warn('dist/index.html not found for prerendering.');
}
