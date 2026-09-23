import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';

interface NotFoundPageProps {
  theme: 'dark' | 'light';
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ theme }) => {
  const isLight = theme === 'light';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEOHead
        title="404 - Page Not Found | CALCULA X"
        description="The requested calculator or page could not be found."
        noIndex={true}
      />
      <div className={`max-w-md w-full p-8 rounded-3xl border text-center space-y-6 shadow-xl transition-all ${
        isLight ? 'bg-white border-black/10 text-[#11131A]' : 'bg-[#0C101A] border-white/10 text-white'
      }`}>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
          <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>
            The calculator or page you are looking for does not exist or has been removed.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6948FF] text-white font-medium hover:bg-[#5837EE] transition-all shadow-lg shadow-[#6948FF]/25"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
