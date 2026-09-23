import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Calculator, History, X } from 'lucide-react';
import { CALCULATORS } from '../../data/calculators';
import { parseNaturalLanguageQuery } from '../../lib/naturalLanguageParser';
import { CalculationHistoryItem } from '../../types';
import { useAdmin } from '../../context/AdminContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCalculator: (calcId: string, prefilledInputs?: Record<string, any>) => void;
  recentHistory: CalculationHistoryItem[];
  theme?: 'dark' | 'light';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectCalculator,
  recentHistory,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const { isCalculatorDisabled, isAdminAuthenticated } = useAdmin();
  const [query, setQuery] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // toggle handled by parent
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Natural language parsing check
  const naturalMatch = parseNaturalLanguageQuery(query);

  // Filter calculators by title/description/category/subcategories & admin state
  const filteredCalculators = CALCULATORS.filter((c) => {
    if (!isAdminAuthenticated && (isCalculatorDisabled(c.id) || isCalculatorDisabled(c.slug))) {
      return false;
    }
    return (
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.tagline.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()) ||
      (c.parentCategoryName && c.parentCategoryName.toLowerCase().includes(query.toLowerCase())) ||
      (c.subCategoryName && c.subCategoryName.toLowerCase().includes(query.toLowerCase())) ||
      c.slug.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleSelectCalc = (id: string, inputs?: Record<string, any>) => {
    onSelectCalculator(id, inputs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="command-palette-modal"
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          isLight
            ? 'bg-white border-black/10 text-[#11131A] shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
            : 'bg-[#0C101A] border-white/[0.12] text-[#F7F8FC]'
        }`}
      >
        {/* Search Input Box */}
        <div className={`flex items-center px-4 py-3.5 border-b gap-3 ${isLight ? 'border-black/10' : 'border-white/[0.08]'}`}>
          <Search className={`w-5 h-5 ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`} />
          <input
            autoFocus
            type="text"
            placeholder="Search calculators, formulas, or type e.g. 'EMI for 50L at 8.5% 20y'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm sm:text-base focus:outline-none font-medium ${
              isLight ? 'text-[#11131A] placeholder-[#8C95A6]' : 'text-[#F7F8FC] placeholder-[#5F6878]'
            }`}
          />
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isLight ? 'text-[#8C95A6] hover:text-[#11131A]' : 'text-[#5F6878] hover:text-[#F7F8FC]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-3">
          
          {/* Natural Language Intent Detection Result */}
          {naturalMatch && (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight
                ? 'bg-[#EBF7FC] border-[#009DD9]/30 text-[#11131A]'
                : 'bg-gradient-to-r from-[#8B6CFF]/15 to-[#29D8FF]/10 border-[#8B6CFF]/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isLight ? 'text-[#007EA7]' : 'text-[#8B6CFF]'}`}>
                  <Sparkles className="w-4 h-4" />
                  <span>NATURAL LANGUAGE INTENT DETECTED</span>
                </div>
                <span className={`text-[10px] font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                  {(naturalMatch.confidence * 100).toFixed(0)}% MATCH
                </span>
              </div>
              <p className={`text-sm font-semibold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>{naturalMatch.summary}</p>
              
              <button
                onClick={() => handleSelectCalc(naturalMatch.calculatorId, naturalMatch.extractedInputs)}
                className={`mt-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isLight ? 'bg-[#6948FF] hover:bg-[#5835ea]' : 'bg-[#8B6CFF] hover:bg-[#7854f5]'
                }`}
              >
                <span>Launch Configured Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Calculators List */}
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 block mb-1.5 ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
              CALCULATORS & PLATFORM TOOLS
            </span>
            <div className="space-y-1">
              {filteredCalculators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCalc(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between group cursor-pointer border ${
                    isLight
                      ? 'hover:bg-[#F4F6FB] border-transparent hover:border-black/10'
                      : 'hover:bg-[#111725] border-transparent hover:border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                      isLight
                        ? 'bg-[#F4F6FB] border-black/10 text-[#6948FF] group-hover:text-white group-hover:bg-[#6948FF]'
                        : 'bg-[#111725] border-white/[0.08] text-[#8B6CFF] group-hover:text-white group-hover:bg-[#8B6CFF]'
                    }`}>
                      <Calculator className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className={`font-bold text-sm block ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
                        {c.title}
                      </span>
                      <span className={`text-[11px] line-clamp-1 ${isLight ? 'text-[#667085]' : 'text-[#5F6878]'}`}>
                        {c.tagline}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isLight ? 'text-[#667085] bg-black/[0.04]' : 'text-[#5F6878] bg-white/[0.03]'
                  }`}>
                    {c.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Calculations */}
          {recentHistory.length > 0 && (
            <div className={`pt-2 border-t ${isLight ? 'border-black/10' : 'border-white/[0.06]'}`}>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 block mb-1.5 ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
                RECENT CALCULATIONS
              </span>
              <div className="space-y-1">
                {recentHistory.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCalc(item.calculatorId, item.inputs)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-[#F4F6FB] hover:bg-[#E5E7EB] text-[#11131A]'
                        : 'bg-[#111725]/50 hover:bg-[#111725]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <History className={`w-3 h-3 ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`} />
                      <span className={`font-medium ${isLight ? 'text-[#475467]' : 'text-[#9AA3B5]'}`}>{item.calculatorTitle}</span>
                    </div>
                    <span className={`font-mono font-bold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
                      {item.primaryFormatted}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer shortcuts */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
          isLight ? 'bg-[#F4F6FB] border-black/10 text-[#8C95A6]' : 'bg-[#080B12] border-white/[0.06] text-[#5F6878]'
        }`}>
          <span>Natural Language Parser active</span>
          <span>ESC to close</span>
        </div>

      </div>
    </div>
  );
};
