import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreCatalog } from '../components/explore/ExploreCatalog';
import { SEOHead } from '../components/common/SEOHead';
import { CurrencyConfig } from '../types';

interface HomePageProps {
  currency: CurrencyConfig;
  theme: 'dark' | 'light';
}

export const HomePage: React.FC<HomePageProps> = ({ currency, theme }) => {
  const navigate = useNavigate();

  const handleSelectCalculator = (calcId: string) => {
    navigate(`/calculators/${calcId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'CALCULA X - Next-Gen Interactive Visual Calculator Platform',
    'url': typeof window !== 'undefined' ? window.location.origin : 'https://calcula.app',
    'description': 'Explore high-precision financial, loan EMI, SIP compound growth, taxation, retirement, and mathematical calculators with interactive sensitivity charts.',
    'applicationCategory': 'FinanceApplication, EducationalApplication',
    'operatingSystem': 'All',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };

  return (
    <>
      <SEOHead
        title="CALCULA X – Interactive Financial, Tax & Math Calculators"
        description="Explore 20+ next-generation interactive calculators for EMI loans, SIP wealth growth, FIRE planning, taxes, and mathematics with real-time visual charts."
        jsonLd={schemaData}
      />
      <ExploreCatalog
        currency={currency}
        theme={theme}
        onSelectCalculator={handleSelectCalculator}
      />
    </>
  );
};
