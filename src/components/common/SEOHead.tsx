import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, any> | Record<string, any>[];
  noIndex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  jsonLd,
  noIndex = false,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Set standard SEO, Robots and OpenGraph tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'CALCULA X');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (currentUrl) {
      setMetaTag('property', 'og:url', currentUrl);
    }

    // 4. Set Schema.org JSON-LD Structured Data
    if (jsonLd) {
      const scriptId = 'schema-org-jsonld';
      let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, canonicalUrl, ogType, jsonLd]);

  return null;
};
