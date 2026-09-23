import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  History, 
  Sun, 
  Moon,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CurrencyCode } from '../../types';

interface FloatingCommandDockProps {
  onGoHome: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onOpenCommand: () => void;
  onOpenHistory: () => void;
}

export const FloatingCommandDock: React.FC<FloatingCommandDockProps> = ({
  onGoHome,
  currency,
  setCurrency,
  theme,
  setTheme,
  onOpenCommand,
  onOpenHistory,
}) => {
  const isLight = theme === 'light';

  return (
    <header 
      id="floating-command-dock"
      className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(12, 16, 26, 0.92)',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        {/* Brand Mark */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="CALCULA X Explore"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 border ${
            isLight 
              ? 'bg-[#6948FF]/10 text-[#6948FF] border-[#6948FF]/30' 
              : 'bg-[#8B6CFF]/20 text-[#8B6CFF] border-[#8B6CFF]/30'
          }`}>
            ◈
          </div>
          <div className="flex flex-col">
            <span className={`font-extrabold tracking-tight text-sm sm:text-base leading-none ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
              CALCULA X
            </span>
            <span className={`text-[10px] font-mono leading-tight ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
              Explore & Calculations
            </span>
          </div>
        </div>

        {/* Center Search / Command Bar Trigger (Cmd+K) */}
        <button
          onClick={onOpenCommand}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
            isLight
              ? 'bg-[#F0F2F7] hover:bg-[#E5E7EB] border-black/5 text-[#667085] hover:text-[#11131A]'
              : 'bg-[#111725] hover:bg-[#182133] border-white/[0.06] text-[#9AA3B5] hover:text-[#F7F8FC]'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#6948FF]" />
          <span className="hidden sm:inline">Search calculators, formulas, natural language...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className={`text-[10px] px-1.5 py-0.5 rounded border ml-1 ${
            isLight
              ? 'bg-white text-[#667085] border-black/10'
              : 'bg-black/40 text-[#5F6878] border-white/[0.06]'
          }`}>
            ⌘K
          </kbd>
        </button>

        {/* Right Tools (History, Currency, Theme) */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight
                ? 'bg-[#F0F2F7] hover:bg-[#E5E7EB] text-[#11131A] border-black/10'
                : 'bg-[#111725] hover:bg-[#182133] text-[#F7F8FC] border-white/[0.08]'
            }`}
            title="Open Calculation History"
          >
            <History className="w-3.5 h-3.5 text-[#6948FF]" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={`border rounded-xl px-2 py-1.5 text-xs font-mono focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-[#F0F2F7] text-[#11131A] border-black/10'
                : 'bg-[#111725] text-[#F7F8FC] border-white/[0.08]'
            }`}
          >
            <option value="INR">₹ INR (Lakh/Cr)</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="JPY">¥ JPY</option>
          </select>

          {/* Admin Panel Link */}
          <Link
            to="/admin"
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              isLight
                ? 'bg-[#F0F2F7] hover:bg-[#E5E7EB] text-[#11131A] border-black/10'
                : 'bg-[#111725] hover:bg-[#182133] text-[#F7F8FC] border-white/[0.08]'
            }`}
            title="Admin Panel"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#6948FF]" />
            <span className="hidden md:inline text-xs font-mono">Admin</span>
          </Link>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-[#F0F2F7] hover:bg-[#E5E7EB] text-[#11131A] border-black/10'
                : 'bg-[#111725] hover:bg-[#182133] text-[#F7F8FC] border-white/[0.08]'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[#FFB84D]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#6948FF]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
