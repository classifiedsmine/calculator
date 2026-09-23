import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home, Share2, Sparkles, Folder, Lock, Power, ShieldCheck } from 'lucide-react';
import { CalculatorView } from '../components/calculator/CalculatorView';
import { CalculatorSEOContent } from '../components/calculator/CalculatorSEOContent';
import { CompoundInterestOS } from '../components/calculator/CompoundInterestOS';
import { UniversalCalculatorOS } from '../components/calculator/UniversalCalculatorOS';
import { MonteCarloOS } from '../components/calculator/MonteCarloOS';
import { BodyCompositionOS } from '../components/calculator/BodyCompositionOS';
import { SipOS } from '../components/calculator/SipOS';
import { RetirementOS } from '../components/calculator/RetirementOS';
import { IncomeTaxOS } from '../components/calculator/IncomeTaxOS';
import { SEOHead } from '../components/common/SEOHead';
import { NotFoundPage } from './NotFoundPage';
import { CALCULATORS } from '../data/calculators';
import { CurrencyConfig, CalculationHistoryItem, CalculatorDefinition } from '../types';
import { useAdmin } from '../context/AdminContext';

interface CalculatorPageProps {
  currency: CurrencyConfig;
  theme: 'dark' | 'light';
  onSaveHistory: (item: CalculationHistoryItem) => void;
}

export interface CalculatorSEOMetadataBundle {
  calculatorId: string;
  title: string;
  description: string;
  h1Text: string;
  canonicalUrl: string;
  keywords: string;
  jsonLdSchemas: Record<string, any>[];
}

/**
 * Dynamically injects structured data and meta tags (H1, title, meta description, OpenGraph, Twitter, Schema.org JSON-LD)
 * specific to the loaded calculator's ID to maximize search engine rankings and rich snippets.
 */
export function injectCalculatorSEOMetadata(
  calculator: CalculatorDefinition,
  customOrigin?: string
): CalculatorSEOMetadataBundle {
  const origin = customOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://calcula.app');
  const canonicalUrl = `${origin}/calculators/${calculator.slug}`;
  const categoryLabel = calculator.parentCategoryName || calculator.category.toUpperCase();

  // 1. High-CTR Branded Page Title (30-60 characters ideal for SERP display)
  const pageTitle = `${calculator.title} – Free Online Calculator | CALCULA X`;

  // 2. Engaging Search Snippet Meta Description (130-160 characters)
  const truncatedDesc = calculator.description.length > 110 
    ? `${calculator.description.slice(0, 107)}...` 
    : calculator.description;
  const pageDescription = `Free online ${calculator.title}. ${calculator.tagline} ${truncatedDesc}`;

  // 3. Primary Semantic H1 Text
  const h1Text = calculator.title;

  // 4. Targeted Search Keywords
  const keywords = [
    calculator.title.toLowerCase(),
    `online ${calculator.title.toLowerCase()}`,
    `${calculator.title.toLowerCase()} online`,
    `${calculator.category} calculator`,
    `${calculator.slug} calculator`,
    ...calculator.inputs.map((i) => `${i.name.toLowerCase()} calculator`),
    'free calculator',
    'instant calculation tool',
    'step by step formula'
  ].join(', ');

  // 5. Schema.org WebApplication / FinancialProduct / SoftwareApplication
  const isFinance = calculator.category === 'finance' || calculator.id === 'compound-interest' || calculator.slug === 'compound-interest';
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': isFinance ? ['WebApplication', 'FinancialProduct'] : 'WebApplication',
    'name': calculator.title,
    'alternateName': `${calculator.title} Online Tool`,
    'url': canonicalUrl,
    'description': pageDescription,
    'applicationCategory': isFinance ? 'Wealth Management Software' : `${categoryLabel}Application`,
    'applicationSubCategory': calculator.subCategoryName || 'Computation',
    'operatingSystem': 'Web Browser',
    'feesAndCommissionsSpecification': '0 USD',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    'softwareVersion': '2.0',
    'inLanguage': 'en-US',
    'isAccessibleForFree': true,
    'featureList': [
      `Real-time ${calculator.title} computation engine`,
      'Interactive formula & token inspector',
      'Dynamic multi-scenario comparison modeler',
      '2D sensitivity heatmap and uncertainty distribution',
      'Instant inverse goal-seeking and root-finder engine',
      'High-resolution PDF and CSV export'
    ].join(', '),
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'author': {
      '@type': 'Organization',
      'name': 'CALCULA X',
      'url': origin,
    },
  };

  // 6. Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': origin,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': categoryLabel,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': calculator.title,
        'item': canonicalUrl,
      },
    ],
  };

  // 8. Schema.org FAQPage (if FAQs are available)
  const faqSchema = calculator.faqs && calculator.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': calculator.faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.a,
      },
    })),
  } : null;

  const jsonLdSchemas: Record<string, any>[] = [
    webAppSchema,
    breadcrumbSchema,
    ...(faqSchema ? [faqSchema] : [])
  ];

  // 9. Client-side DOM Injection for Direct Search Engine Crawler and Head Synchronization
  if (typeof document !== 'undefined') {
    // Synchronize document.title
    document.title = pageTitle;

    // Helper to inject/update <meta> tags
    const setMeta = (attrKey: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrKey}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrKey, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // Standard SEO Meta Tags
    setMeta('name', 'description', pageDescription);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    
    // OpenGraph Social Graph Tags
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', 'CALCULA X');

    // Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);

    // Schema.org Structured Data Script Injection
    const scriptId = `schema-jsonld-${calculator.id}`;
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      // Remove any previously injected calculator schema tags to keep DOM clean
      const oldScripts = document.querySelectorAll('script[data-calculator-schema="true"]');
      oldScripts.forEach((s) => s.remove());

      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      scriptTag.setAttribute('data-calculator-schema', 'true');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLdSchemas);
  }

  return {
    calculatorId: calculator.id,
    title: pageTitle,
    description: pageDescription,
    h1Text,
    canonicalUrl,
    keywords,
    jsonLdSchemas,
  };
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  currency,
  theme,
  onSaveHistory,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isLight = theme === 'light';
  const [loadedInputs, setLoadedInputs] = useState<Record<string, any> | undefined>(undefined);

  // Normalize aliases for major calculators
  const normalizedSlug = useMemo(() => {
    if (!slug) return '';
    if (['bmi-calculator', 'bmi-body-composition-analyzer', 'body-composition-calculator', 'body-fat-calculator'].includes(slug)) {
      return 'bmi-body-composition';
    }
    if (['monte-carlo-simulation', 'monte-carlo-calculator', 'probability-simulator'].includes(slug)) {
      return 'monte-carlo-simulator';
    }
    if ([
      'sip-calculator',
      'sip',
      'sip-return-calculator',
      'step-up-sip-calculator',
      'step-up-sip',
      'sip-goal-calculator',
      'sip-vs-lumpsum-calculator',
      'sip-calculator-with-inflation',
      'sip-calculator-with-tax',
      'sip-for-1-crore',
      'sip-for-50-lakh',
      'sip-for-25-lakh',
      'sip-for-10-lakh',
      'how-much-sip-for-1-crore',
    ].includes(slug)) {
      return 'sip-calculator';
    }
    if ([
      'retirement-calculator',
      'retirement-corpus',
      'retirement-planning-calculator',
      'retirement-corpus-calculator',
      'retirement-corpus-calculator-india',
      'retirement-savings-calculator',
      'retirement-fund-calculator',
      'pension-calculator',
      'retirement-pension-calculator',
      'monthly-pension-calculator',
      'retirement-income-calculator',
      'pension-corpus-calculator',
      'how-much-corpus-do-i-need-for-retirement',
      'retirement-corpus-required',
      'how-much-money-do-i-need-to-retire',
      'retirement-corpus-for-1-crore',
      'retirement-corpus-for-2-crore',
      'retirement-corpus-for-5-crore',
      'retirement-calculator-india',
      'nps-calculator',
      'epf-calculator',
      'ppf-calculator',
      'pension-calculator-india',
      'retirement-calculator-with-inflation',
      'retirement-withdrawal-calculator',
      'swp-calculator',
      'how-long-will-my-retirement-corpus-last',
      'safe-withdrawal-calculator',
      'retirement-age-calculator',
      'early-retirement-calculator',
      'fire-calculator',
      'retirement-sip-calculator',
      'monthly-investment-for-retirement',
      'retirement-savings-required',
    ].includes(slug)) {
      return 'retirement-corpus';
    }
    if ([
      'income-tax-calculator',
      'income-tax-comparison',
      'income-tax',
      'old-vs-new-tax-regime',
      'tax-calculator',
      'tax-regime-calculator',
      'salary-tax-calculator',
      'new-tax-regime-calculator',
      'old-tax-regime-calculator',
      'tax-calculator-with-deductions',
      'take-home-salary-calculator',
      'tax-regime-break-even-calculator',
    ].includes(slug)) {
      return 'income-tax-comparison';
    }
    return slug;
  }, [slug]);

  const { isCalculatorDisabled, isAdminAuthenticated, enableCalculator } = useAdmin();

  // Find calculator by slug or id
  const calculator = CALCULATORS.find(
    (c) => c.slug === normalizedSlug || c.id === normalizedSlug || c.slug === slug || c.id === slug
  );

  // Enforce single search-engine-friendly canonical URL (redirect aliases to canonical slug)
  if (calculator && slug && slug !== calculator.slug) {
    return <Navigate to={`/calculators/${calculator.slug}`} replace />;
  }

  const isDisabled = calculator ? (isCalculatorDisabled(calculator.id) || isCalculatorDisabled(calculator.slug)) : false;

  // Dynamically compute and inject SEO metadata (H1, title, meta description, structured data)
  const seoBundle = useMemo(() => {
    if (!calculator) return null;
    return injectCalculatorSEOMetadata(calculator);
  }, [calculator]);

  // Ensure DOM injection triggers upon mounting or when calculator changes
  useEffect(() => {
    if (calculator) {
      injectCalculatorSEOMetadata(calculator);
    }
  }, [calculator]);

  if (!calculator || !seoBundle) {
    return <NotFoundPage theme={theme} />;
  }

  // If calculator is disabled and user is NOT an admin, show locked view
  if (isDisabled && !isAdminAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <SEOHead
          title={`Calculator Temporarily Disabled | CALCULA X`}
          description="This calculation model is currently disabled or undergoing administrative maintenance."
        />
        <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl space-y-6 ${
          isLight ? 'bg-white border-red-200' : 'bg-[#0C101A] border-red-900/30'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold shadow-lg border border-red-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-red-500/10 text-red-500 border border-red-500/20">
              OFFLINE / DISABLED BY ADMIN
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">{calculator.title}</h1>
            <p className={`text-xs sm:text-sm max-w-md mx-auto ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              This calculator has been turned off by the platform administrator and is temporarily unavailable for public calculations.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-[#6948FF] hover:bg-[#5736ea] text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Explore Available Calculators</span>
            </Link>

            <Link
              to="/admin"
              className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                isLight ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#6948FF]" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePresetLoad = (newInputs: Record<string, any>) => {
    setLoadedInputs(newInputs);
    const rootEl = document.getElementById('calculator-view-root');
    if (rootEl) {
      rootEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Declarative Dynamic SEO Head */}
      <SEOHead
        title={seoBundle.title}
        description={seoBundle.description}
        canonicalUrl={seoBundle.canonicalUrl}
        jsonLd={seoBundle.jsonLdSchemas}
      />

      {/* Admin Status Notice Banner if calculator is disabled */}
      {isDisabled && isAdminAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide">Admin Preview Notice: </span>
                <span className="text-xs">This calculator is currently <strong>TURNED OFF</strong> for public visitors.</span>
              </div>
            </div>

            <button
              onClick={() => {
                enableCalculator(calculator.id);
                if (calculator.slug !== calculator.id) {
                  enableCalculator(calculator.slug);
                }
              }}
              className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Power className="w-4 h-4" />
              <span>Turn ON Public Access</span>
            </button>
          </div>
        </div>
      )}

      {/* SEO-Optimized Semantic Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <nav aria-label="Breadcrumb" className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono flex-wrap">
            <Link
              to="/"
              className={`flex items-center gap-1 transition-colors ${
                isLight ? 'text-[#667085] hover:text-[#11131A]' : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
            
            <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#CBD5E1]' : 'text-[#334155]'}`} />
            
            <Link
              to="/"
              className={`px-2 py-0.5 rounded transition-colors ${
                isLight ? 'bg-black/5 text-[#667085] hover:text-[#11131A]' : 'bg-white/5 text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              {calculator.parentCategoryName || calculator.category}
            </Link>
            
            {calculator.subCategoryName && (
              <>
                <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#CBD5E1]' : 'text-[#334155]'}`} />
                <span className={`px-2 py-0.5 rounded hidden sm:inline-block ${
                  isLight ? 'bg-[#6948FF]/10 text-[#6948FF]' : 'bg-[#8B6CFF]/20 text-[#8B6CFF]'
                }`}>
                  {calculator.subCategoryName}
                </span>
              </>
            )}

            <ChevronRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#CBD5E1]' : 'text-[#334155]'}`} />
            
            <span className={`font-semibold truncate max-w-[180px] sm:max-w-none ${
              isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'
            }`}>
              {calculator.title}
            </span>
          </div>

          <Link
            to="/"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${
              isLight
                ? 'bg-white hover:bg-black/5 text-[#667085] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.08]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>
        </nav>
      </div>

      {/* Main Interactive Calculator Engine with Semantic H1 Target */}
      <CalculatorView
        calculator={calculator}
        currency={currency}
        onSaveHistory={onSaveHistory}
        externalInputs={loadedInputs}
        onSelectRelated={(relatedId) => {
          const targetCalc = CALCULATORS.find(c => c.id === relatedId || c.slug === relatedId);
          const targetSlug = targetCalc ? targetCalc.slug : relatedId;
          navigate(`/calculators/${targetSlug}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* Calculator Query OS Suite */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {calculator.id === 'sip' || calculator.slug === 'sip-calculator' || calculator.slug === 'step-up-sip' ? (
          <SipOS
            currency={currency}
            theme={theme}
            currentInputs={loadedInputs}
            onApplyInputs={handlePresetLoad}
          />
        ) : calculator.id === 'bmi-body-composition' || calculator.slug === 'bmi-body-composition' || calculator.slug === 'bmi-calculator' ? (
          <BodyCompositionOS
            currency={currency}
            theme={theme}
            currentInputs={loadedInputs}
            onApplyInputs={handlePresetLoad}
          />
        ) : calculator.id === 'monte-carlo-simulator' || calculator.slug === 'monte-carlo-simulator' ? (
          <MonteCarloOS
            currency={currency}
            theme={theme}
            initialMode="investment"
            onApplyInputs={handlePresetLoad}
          />
        ) : calculator.id === 'retirement-corpus' || calculator.id === 'retirement-calculator' || calculator.slug === 'retirement-corpus' || calculator.slug === 'retirement-calculator' ? (
          <RetirementOS
            currency={currency}
            theme={theme}
            currentInputs={loadedInputs}
            onApplyInputs={handlePresetLoad}
          />
        ) : calculator.id === 'income-tax-comparison' || calculator.slug === 'income-tax-comparison' || calculator.slug === 'income-tax-calculator' ? (
          <IncomeTaxOS
            currency={currency}
            theme={theme}
            currentInputs={loadedInputs}
            onApplyInputs={handlePresetLoad}
          />
        ) : calculator.id === 'compound-interest' || calculator.slug === 'compound-interest' ? (
          <CompoundInterestOS
            currency={currency}
            theme={theme}
            currentInputs={loadedInputs || {
              initialDeposit: 10000,
              periodicContribution: 500,
              interestRate: 8.0,
              years: 20,
              inflationRate: 3.0,
            }}
            onApplyInputs={handlePresetLoad}
          />
        ) : (
          <UniversalCalculatorOS
            calculator={calculator}
            currency={currency}
            theme={theme}
            currentInputs={
              loadedInputs ||
              calculator.inputs.reduce((acc, inp) => {
                acc[inp.id] = inp.defaultValue;
                return acc;
              }, {} as Record<string, any>)
            }
            onApplyInputs={handlePresetLoad}
          />
        )}
      </div>

      {/* Rich Supporting SEO & Educational Content */}
      <CalculatorSEOContent
        calculator={calculator}
        currency={currency}
        theme={theme}
        onLoadInputs={handlePresetLoad}
      />
    </div>
  );
};
