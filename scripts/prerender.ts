import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CALCULATORS } from '../src/data/calculators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

const baseUrl = 'https://ais-pre-imlglk7whto5i76mmwhawj-950284677903.asia-southeast1.run.app';

if (fs.existsSync(indexPath)) {
  const baseHtml = fs.readFileSync(indexPath, 'utf-8');

  CALCULATORS.forEach(calculator => {
    if (!calculator.slug) return;

    const canonicalUrl = `${baseUrl}/calculators/${calculator.slug}`;
    const pageTitle = `${calculator.title} – Free Online Calculator | CALCULA X`;
    const pageDescription = `Free online ${calculator.title}. ${calculator.tagline} ${calculator.description.slice(0, 110)}`;
    
    // JSON-LD schemas (WebApplication, BreadcrumbList, FAQPage only)
    const isFinance = calculator.category === 'finance' || calculator.id === 'compound-interest' || calculator.slug === 'compound-interest';
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
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

    const categoryLabel = calculator.parentCategoryName || calculator.category.toUpperCase();
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${baseUrl}/` },
        { '@type': 'ListItem', 'position': 2, 'name': categoryLabel },
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

    // Fully populated static SEO HTML for crawlers before hydration
    const staticContent = `
      <div id="root">
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2.5rem 1.5rem; max-width: 1000px; margin: 0 auto; color: #0F172A; background: #FFFFFF;">
          <nav style="margin-bottom: 1.5rem; font-size: 0.85rem; color: #64748B; display: flex; align-items: center; gap: 0.5rem;">
            <a href="/" style="color: #6948FF; text-decoration: none; font-weight: 500;">Home</a> › 
            <span style="color: #64748B;">${categoryLabel}</span> › 
            <span style="color: #0F172A; font-weight: 600;">${calculator.title}</span>
          </nav>
          
          <header style="margin-bottom: 2.5rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1.5rem;">
            <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.025em; color: #0F172A;">${calculator.title}</h1>
            <p style="font-size: 1.15rem; line-height: 1.6; color: #334155; margin: 0;">${calculator.description}</p>
          </header>

          ${calculator.formulaDisplay ? `
            <section style="margin-bottom: 2.5rem; padding: 1.75rem; background: #F8FAFC; border-radius: 1rem; border: 1px solid #E2E8F0;">
              <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #0F172A;">Mathematical Formula & Methodology</h2>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 1.1rem; font-weight: 600; color: #6948FF; background: #FFFFFF; padding: 1rem; border-radius: 0.5rem; border: 1px solid #E2E8F0; display: inline-block; margin-bottom: 1rem;">
                ${calculator.formulaDisplay}
              </div>
              <p style="color: #334155; line-height: 1.6; margin-bottom: 1rem;">
                This calculator models compound growth by separating initial principal growth <strong>A = P(1 + r/n)^(nt)</strong> from regular periodic additions (PMT), compounding each addition according to your selected compounding frequency and contribution schedule.
              </p>
              ${calculator.formulaTokens && calculator.formulaTokens.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
                  ${calculator.formulaTokens.map(t => `
                    <div style="background: #FFFFFF; padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #E2E8F0;">
                      <strong style="color: #6948FF; font-family: monospace;">${t.token}</strong>: <span style="font-size: 0.9rem; color: #334155;">${t.label} - ${t.description}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </section>
          ` : ''}

          <section style="margin-bottom: 2.5rem; padding: 1.75rem; background: #FFFFFF; border-radius: 1rem; border: 1px solid #E2E8F0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #0F172A;">Understanding Compounding Frequency, Contributions & Inflation</h2>
            <p style="color: #334155; line-height: 1.7; margin-bottom: 1rem;">
              <strong>Compounding Frequency (n):</strong> More frequent compounding (e.g., monthly or daily vs. annual) adds earned interest back to your principal sooner, resulting in a higher effective annual yield (APY) over time.
            </p>
            <p style="color: #334155; line-height: 1.7; margin-bottom: 1rem;">
              <strong>Regular Contributions (PMT):</strong> Consistent periodic deposits accelerate wealth accumulation significantly through dollar-cost averaging and compound returns.
            </p>
            <p style="color: #334155; line-height: 1.7; margin: 0;">
              <strong>Inflation Adjustment:</strong> Factoring in inflation reveals your portfolio's real purchasing power in today's currency, discounting future nominal gains by estimated annual price increases.
            </p>
          </section>

          ${calculator.faqs && calculator.faqs.length > 0 ? `
            <section style="margin-bottom: 2.5rem;">
              <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; color: #0F172A;">Frequently Asked Questions</h2>
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${calculator.faqs.map(f => `
                  <div style="padding: 1.25rem; border-left: 4px solid #6948FF; background: #F8FAFC; border-radius: 0.75rem; border-top: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; color: #0F172A;">${f.q}</h3>
                    <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin: 0;">${f.a}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <div style="text-align: center; color: #64748B; font-size: 0.85rem; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #E2E8F0;">
            Interactive calculation interface loading...
          </div>
        </div>
      </div>
    `;

    let html = baseHtml;

    // Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

    // Replace description meta
    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${pageDescription}">`);

    // Inject OG, robots & JSON-LD before </head> (No canonical tag)
    const headInjection = `
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

  // Generate sitemap.xml using ais-pre domain exclusively
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemap += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  
  CALCULATORS.forEach(c => {
    if (c.slug) {
      sitemap += `  <url><loc>${baseUrl}/calculators/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
    }
  });
  sitemap += `</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  const publicSitemapPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(publicSitemapPath, sitemap);
  console.log('Generated clean dist/sitemap.xml and public/sitemap.xml successfully.');

} else {
  console.warn('dist/index.html not found for prerendering.');
}
