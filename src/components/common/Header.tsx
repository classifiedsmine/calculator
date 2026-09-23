import React from 'react';
import { Search, History, Moon, Sun, Globe, Share2, Sparkles, Network } from 'lucide-react';
import { CurrencyCode, ActiveTab } from '../../types';
import { CURRENCIES } from '../../lib/formatters';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onOpenCommand: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  theme,
  setTheme,
  onOpenCommand,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-white/[0.07] bg-[#05060A]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-6">
          <button
            id="brand-home-btn"
            onClick={() => setActiveTab('calculators')}
            className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B6CFF]/20 via-[#29D8FF]/10 to-transparent border border-[#8B6CFF]/30 flex items-center justify-center text-[#8B6CFF] group-hover:border-[#8B6CFF]/60 transition-all shadow-[0_0_15px_rgba(139,108,255,0.15)]">
              <span className="text-lg font-bold select-none leading-none">◈</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#F7F8FC] flex items-center gap-1.5">
                CALCULA <span className="text-[#8B6CFF]">X</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#5F6878] font-mono -mt-1">
                OS FOR NUMBERS
              </span>
            </div>
          </button>

          {/* Primary View Switcher */}
          <nav className="hidden md:flex items-center bg-[#0C101A] p-1 rounded-xl border border-white/[0.07]">
            <button
              id="nav-calculators-btn"
              onClick={() => setActiveTab('calculators')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'calculators'
                  ? 'bg-[#111725] text-[#F7F8FC] shadow-sm border border-white/[0.1]'
                  : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              Calculators
            </button>
            <button
              id="nav-workspace-btn"
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-[#111725] text-[#F7F8FC] shadow-sm border border-white/[0.1]'
                  : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-[#29D8FF]" />
              Spatial Workspace
            </button>
            <button
              id="nav-math-btn"
              onClick={() => setActiveTab('math-studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'math-studio'
                  ? 'bg-[#111725] text-[#F7F8FC] shadow-sm border border-white/[0.1]'
                  : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B6CFF]" />
              Math & Graph Studio
            </button>
          </nav>
        </div>

        {/* Global Command Palette Trigger */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            id="global-command-search-btn"
            onClick={onOpenCommand}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0C101A] hover:bg-[#111725] border border-white/[0.07] hover:border-white/[0.14] text-xs text-[#9AA3B5] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#5F6878] group-hover:text-[#8B6CFF] transition-colors" />
              <span>Search calculators, models, or natural queries...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#111725] text-[#5F6878] border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Controls & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search trigger */}
          <button
            id="mobile-search-btn"
            onClick={onOpenCommand}
            className="sm:hidden p-2 rounded-lg bg-[#0C101A] text-[#9AA3B5] border border-white/[0.07]"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Currency Selector */}
          <div className="relative flex items-center bg-[#0C101A] border border-white/[0.07] rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-[#5F6878] mr-1.5" />
            <select
              id="currency-selector"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-xs font-mono font-medium text-[#F7F8FC] focus:outline-none cursor-pointer"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c} className="bg-[#0C101A] text-[#F7F8FC]">
                  {CURRENCIES[c].symbol} {c}
                </option>
              ))}
            </select>
          </div>

          {/* History Drawer Trigger */}
          <button
            id="history-drawer-btn"
            onClick={onOpenHistory}
            className="relative p-2 rounded-lg bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07] transition-all cursor-pointer"
            title="Calculation History"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B6CFF] text-[10px] font-bold text-white flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
