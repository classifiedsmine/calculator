import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Network, 
  Sliders, 
  BarChart3, 
  FunctionSquare,
  Activity,
  Layers
} from 'lucide-react';
import { CALCULATORS } from '../../data/calculators';
import { CurrencyConfig, CategoryId } from '../../types';
import { parseNaturalLanguageQuery } from '../../lib/naturalLanguageParser';

interface HomeViewProps {
  currency: CurrencyConfig;
  onSelectCalculator: (calcId: string, prefilledInputs?: Record<string, any>) => void;
  onSelectTab: (tab: 'calculators' | 'workspace' | 'math-studio') => void;
  onOpenCommand: () => void;
}

const CATEGORIES: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'All Models' },
  { id: 'finance', label: 'Finance & Wealth' },
  { id: 'math', label: 'Mathematics' },
  { id: 'health', label: 'Biometrics & Health' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  currency,
  onSelectCalculator,
  onSelectTab,
  onOpenCommand,
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');

  const naturalResult = parseNaturalLanguageQuery(naturalInput);

  const handleNaturalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (naturalResult) {
      onSelectCalculator(naturalResult.calculatorId, naturalResult.extractedInputs);
    } else if (naturalInput.trim()) {
      onOpenCommand();
    }
  };

  const filteredCalculators = selectedCategory === 'all'
    ? CALCULATORS
    : CALCULATORS.filter((c) => c.category === selectedCategory);

  return (
    <div id="home-view-root" className="w-full space-y-12 py-8">
      
      {/* Cinematic Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111725] border border-white/[0.08] text-xs font-mono text-[#8B6CFF] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#35E6A0] animate-pulse" />
          <span>AN OPERATING SYSTEM FOR CALCULATIONS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F7F8FC] leading-[1.05]">
          CALCULATE ANYTHING.<br />
          <span className="bg-gradient-to-r from-[#8B6CFF] via-[#29D8FF] to-[#35E6A0] bg-clip-text text-transparent">
            SEE EVERYTHING.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#9AA3B5] max-w-2xl mx-auto font-normal leading-relaxed">
          A computational modeling environment transforming raw numbers into interactive graphs, sensitivity timelines, and probabilistic scenario models.
        </p>

        {/* Primary Natural Language Command Interface */}
        <form
          onSubmit={handleNaturalSubmit}
          className="max-w-2xl mx-auto relative group mt-8"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#8B6CFF]/30 to-[#29D8FF]/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-300" />
          
          <div className="relative flex items-center bg-[#0C101A] border border-white/[0.12] rounded-xl p-2 shadow-2xl">
            <Search className="w-5 h-5 text-[#8B6CFF] ml-3" />
            <input
              type="text"
              placeholder="What do you want to calculate? Try 'EMI for 50L at 8.5% 20y' or 'SIP 15000'..."
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-[#F7F8FC] placeholder-[#5F6878] focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#8B6CFF] hover:bg-[#7854f5] text-white text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md"
            >
              <span>Compute</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Instant Natural Parse Feedback Badge */}
          {naturalResult && (
            <div className="mt-2 text-left p-2.5 rounded-lg bg-[#111725] border border-[#8B6CFF]/30 text-xs flex items-center justify-between text-[#F7F8FC] animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#29D8FF]" />
                <span>Detected: <strong className="text-[#35E6A0]">{naturalResult.summary}</strong></span>
              </div>
              <span className="text-[10px] font-mono text-[#8B6CFF]">Press Enter to launch</span>
            </div>
          )}
        </form>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#8B6CFF] text-white shadow-md'
                  : 'bg-[#0C101A] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07] hover:border-white/[0.14]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Architecture Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F7F8FC]">
              Computational Model Engines
            </h2>
            <p className="text-xs text-[#5F6878]">
              Select a model to initialize interactive assumptions and live visualization
            </p>
          </div>
          <span className="text-xs font-mono text-[#5F6878]">
            {filteredCalculators.length} active engines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators.map((calc) => {
            // Compute preview sample
            const sampleInputs: Record<string, any> = {};
            calc.inputs.forEach((i) => {
              sampleInputs[i.id] = i.defaultValue;
            });
            const previewResult = calc.calculate(sampleInputs, currency);

            return (
              <div
                key={calc.id}
                onClick={() => onSelectCalculator(calc.id)}
                className="group relative p-6 rounded-2xl bg-[#0C101A] hover:bg-[#101624] border border-white/[0.08] hover:border-[#8B6CFF]/40 transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#8B6CFF] px-2 py-0.5 rounded bg-[#8B6CFF]/10 border border-[#8B6CFF]/20">
                      {calc.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#5F6878] group-hover:text-[#8B6CFF] group-hover:translate-x-1 transition-all" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#F7F8FC] group-hover:text-[#8B6CFF] transition-colors">
                      {calc.title}
                    </h3>
                    <p className="text-xs text-[#9AA3B5] mt-1 line-clamp-2 leading-relaxed">
                      {calc.tagline}
                    </p>
                  </div>

                  {/* Miniature Visual Spark Display */}
                  <div className="p-3.5 rounded-xl bg-[#05060A] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#5F6878] uppercase block">
                        {previewResult.primaryLabel}
                      </span>
                      <div className="text-xl font-bold font-mono text-[#F7F8FC] tabular-nums mt-0.5">
                        {previewResult.primaryFormatted}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#35E6A0] font-semibold block">
                        {previewResult.secondaryMetrics[0]?.label}
                      </span>
                      <span className="text-xs font-mono text-[#9AA3B5] tabular-nums">
                        {previewResult.secondaryMetrics[0]?.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Formula Preview */}
                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-[#5F6878]">
                  <span className="truncate max-w-[200px]">{calc.formulaDisplay}</span>
                  <span className="text-[#8B6CFF] group-hover:underline">Open Engine →</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Flagship Product Feature Showcases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Showcase 1: Spatial Workspace */}
          <div 
            onClick={() => onSelectTab('workspace')}
            className="p-8 rounded-2xl bg-gradient-to-br from-[#0C101A] via-[#111725] to-[#0C101A] border border-white/[0.08] hover:border-[#29D8FF]/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#29D8FF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#29D8FF] px-2 py-0.5 rounded bg-[#29D8FF]/10 border border-[#29D8FF]/20">
                INNOVATION
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-2">
              <Network className="w-5 h-5 text-[#29D8FF]" />
              <h3 className="text-xl font-bold text-[#F7F8FC]">Spatial Dependency Workspace</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#9AA3B5] leading-relaxed mb-6">
              Connect salary, tax, living expenses, savings, and investment growth into an infinite reactive computational node network.
            </p>
            <span className="text-xs font-mono text-[#29D8FF] group-hover:underline flex items-center gap-1.5">
              Launch Spatial Workspace <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Showcase 2: Math Studio & Grapher */}
          <div 
            onClick={() => onSelectTab('math-studio')}
            className="p-8 rounded-2xl bg-gradient-to-br from-[#0C101A] via-[#111725] to-[#0C101A] border border-white/[0.08] hover:border-[#8B6CFF]/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B6CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8B6CFF] px-2 py-0.5 rounded bg-[#8B6CFF]/10 border border-[#8B6CFF]/20">
                CALCULUS & ANALYTICAL
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-2">
              <FunctionSquare className="w-5 h-5 text-[#8B6CFF]" />
              <h3 className="text-xl font-bold text-[#F7F8FC]">Math & Function Graph Studio</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#9AA3B5] leading-relaxed mb-6">
              Plot 2D coordinate plane analytical functions: trigonometry, polynomial roots, exponential growth, and logarithmic curves.
            </p>
            <span className="text-xs font-mono text-[#8B6CFF] group-hover:underline flex items-center gap-1.5">
              Launch Function Grapher <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>
      </section>

    </div>
  );
};
