import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Landmark, 
  ShieldCheck, 
  Coins, 
  Briefcase, 
  Sigma,
  HeartPulse,
  Atom,
  Sparkles,
  LayoutGrid,
  Layers,
  CheckCircle2,
  ChevronRight,
  Filter,
  Flame,
  Droplets,
  Activity,
  Divide,
  Triangle,
  BarChart3,
  Percent,
  Zap,
  ArrowLeftRight,
  Home as HomeIcon
} from 'lucide-react';
import { CALCULATORS, PARENT_CATEGORIES } from '../../data/calculators';
import { CurrencyConfig, CalculatorDefinition, ParentCategoryMeta, SubCategoryMeta } from '../../types';
import { useAdmin } from '../../context/AdminContext';

interface ExploreCatalogProps {
  currency: CurrencyConfig;
  onSelectCalculator: (calcId: string) => void;
  theme?: 'dark' | 'light';
}

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  Landmark,
  ShieldCheck,
  Coins,
  Briefcase,
  Sigma,
  HeartPulse,
  Atom,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  Divide,
  Triangle,
  BarChart3,
  Percent,
  Zap,
  ArrowLeftRight,
  Home: HomeIcon
};

export const ExploreCatalog: React.FC<ExploreCatalogProps> = ({
  currency,
  onSelectCalculator,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const { isCalculatorDisabled, isAdminAuthenticated } = useAdmin();
  const [selectedParentId, setSelectedParentId] = useState<string>('all');
  const [selectedSubId, setSelectedSubId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchical' | 'grid'>('hierarchical');

  // Available subcategories for the currently selected parent category
  const activeSubcategories = useMemo(() => {
    if (selectedParentId === 'all') return [];
    const parent = PARENT_CATEGORIES.find((p) => p.id === selectedParentId);
    return parent ? parent.subCategories : [];
  }, [selectedParentId]);

  // Filtered calculators
  const filteredCalculators = useMemo(() => {
    return CALCULATORS.filter((c) => {
      // Admin disabled check: hide disabled calculators from public users
      if (!isAdminAuthenticated && (isCalculatorDisabled(c.id) || isCalculatorDisabled(c.slug))) {
        return false;
      }
      // Parent category check
      if (selectedParentId !== 'all' && c.parentCategoryId !== selectedParentId) {
        return false;
      }
      // Subcategory check
      if (selectedSubId !== 'all' && c.subCategoryId !== selectedSubId) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.title.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.parentCategoryName?.toLowerCase().includes(q) ||
          c.subCategoryName?.toLowerCase().includes(q) ||
          c.formulaDisplay.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedParentId, selectedSubId, searchQuery, isCalculatorDisabled, isAdminAuthenticated]);

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedSubId('all');
  };

  const renderCalculatorCard = (calc: CalculatorDefinition) => {
    const sampleInputs = calc.inputs.reduce((acc, input) => {
      acc[input.id] = input.defaultValue;
      return acc;
    }, {} as Record<string, any>);

    const previewResult = calc.calculate(sampleInputs, currency);
    const isDisabled = isCalculatorDisabled(calc.id) || isCalculatorDisabled(calc.slug);

    return (
      <Link
        key={calc.id}
        to={`/calculators/${calc.slug}`}
        className={`group p-5 sm:p-6 rounded-2xl ${
          isDisabled
            ? 'bg-red-500/5 border-red-500/30'
            : isLight 
              ? 'bg-white hover:bg-[#F9FAFD] border-black/10 hover:border-[#6948FF]/50 shadow-xs hover:shadow-md' 
              : 'bg-[#0C101A] hover:bg-[#101624] border-white/[0.08] hover:border-[#8B6CFF]/40 shadow-lg'
        } border transition-all duration-300 flex flex-col justify-between no-underline`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border font-semibold"
                style={{
                  borderColor: `${calc.accentColor}40`,
                  color: calc.accentColor,
                  backgroundColor: `${calc.accentColor}12`
                }}
              >
                {calc.subCategoryName || calc.category}
              </span>

              {isDisabled && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-red-500 text-white">
                  OFF (Disabled)
                </span>
              )}
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#8C95A6] group-hover:text-[#6948FF]' : 'text-[#5F6878] group-hover:text-[#8B6CFF]'} group-hover:translate-x-1 transition-all`} />
          </div>

          <div>
            <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-[#11131A] group-hover:text-[#6948FF]' : 'text-[#F7F8FC] group-hover:text-[#8B6CFF]'} transition-colors leading-snug`}>
              {calc.title}
            </h3>
            <p className={`text-xs ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'} mt-1.5 line-clamp-2 leading-relaxed`}>
              {calc.tagline}
            </p>
          </div>

          <div className={`p-3.5 rounded-xl ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#05060A] border-white/[0.05]'} border flex items-center justify-between`}>
            <div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'} uppercase block font-medium`}>
                {previewResult.primaryLabel}
              </span>
              <div className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'} tabular-nums mt-0.5`}>
                {previewResult.primaryFormatted}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono font-semibold block" style={{ color: calc.accentColor }}>
                {previewResult.secondaryMetrics[0]?.label}
              </span>
              <span className={`text-xs font-mono ${isLight ? 'text-[#475467]' : 'text-[#9AA3B5]'} tabular-nums font-semibold`}>
                {previewResult.secondaryMetrics[0]?.value}
              </span>
            </div>
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t ${isLight ? 'border-black/5 text-[#8C95A6]' : 'border-white/[0.05] text-[#5F6878]'} flex items-center justify-between text-[11px] font-mono`}>
          <span className="truncate max-w-[170px]">{calc.formulaDisplay}</span>
          <span className={`${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'} font-semibold group-hover:underline flex items-center gap-1`}>
            <span>Calculate</span>
            <span>→</span>
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div id="explore-catalog-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Header & Search Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${isLight ? 'border-black/10' : 'border-white/[0.08]'} pb-6`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isLight ? 'bg-[#6948FF]/10 text-[#6948FF]' : 'bg-[#8B6CFF]/20 text-[#8B6CFF]'
            }`}>
              Search Engine Friendly Calculator Directory
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
              {CALCULATORS.length} Engines Across {PARENT_CATEGORIES.length} Categories
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
            Categories & Subcategories
          </h1>
          <p className={`text-xs sm:text-sm ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'} mt-1`}>
            Explore our curated index of Finance, Mathematics, Health, Biometrics, and Science calculators with dedicated canonical URLs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className={`flex items-center p-1 rounded-xl border ${isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'}`}>
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                viewMode === 'hierarchical'
                  ? isLight ? 'bg-[#6948FF] text-white font-semibold' : 'bg-[#8B6CFF] text-white font-semibold'
                  : isLight ? 'text-[#667085] hover:text-[#11131A]' : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                viewMode === 'grid'
                  ? isLight ? 'bg-[#6948FF] text-white font-semibold' : 'bg-[#8B6CFF] text-white font-semibold'
                  : isLight ? 'text-[#667085] hover:text-[#11131A]' : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Compact Grid</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className={`w-4 h-4 ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'} absolute left-3 top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              placeholder="Search all calculators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${
                isLight ? 'bg-white border-black/10 text-[#11131A] placeholder-[#8C95A6]' : 'bg-[#0C101A] border-white/[0.08] text-[#F7F8FC] placeholder-[#5F6878]'
              } border rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6948FF]/50 transition-all`}
            />
          </div>
        </div>
      </div>

      {/* PARENT CATEGORY SELECTOR TABS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#8C95A6]">
          <Filter className="w-3.5 h-3.5" />
          <span>Parent Categories:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => handleParentSelect('all')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
              selectedParentId === 'all'
                ? isLight 
                  ? 'bg-[#6948FF] text-white border-[#6948FF] shadow-sm' 
                  : 'bg-[#8B6CFF] text-white border-[#8B6CFF] shadow-md'
                : isLight
                  ? 'bg-white hover:bg-[#F0F2F7] text-[#11131A] border-black/10'
                  : 'bg-[#0C101A] hover:bg-[#111725] text-[#F7F8FC] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">All Categories</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                selectedParentId === 'all' ? 'bg-white/20' : isLight ? 'bg-black/5' : 'bg-white/10'
              }`}>
                {CALCULATORS.length}
              </span>
            </div>
            <p className={`text-[11px] mt-1 line-clamp-1 ${selectedParentId === 'all' ? 'text-white/80' : isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
              All 4 domains indexed
            </p>
          </button>

          {PARENT_CATEGORIES.map((parent) => {
            const Icon = ICON_MAP[parent.iconName] || TrendingUp;
            const isSelected = selectedParentId === parent.id;
            const count = CALCULATORS.filter((c) => c.parentCategoryId === parent.id).length;

            return (
              <button
                key={parent.id}
                onClick={() => handleParentSelect(parent.id)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? isLight 
                      ? 'bg-[#6948FF] text-white border-[#6948FF] shadow-sm' 
                      : 'bg-[#8B6CFF] text-white border-[#8B6CFF] shadow-md'
                    : isLight
                      ? 'bg-white hover:bg-[#F0F2F7] text-[#11131A] border-black/10'
                      : 'bg-[#0C101A] hover:bg-[#111725] text-[#F7F8FC] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? '#FFFFFF' : parent.accentColor }} />
                    <span className="text-xs font-bold font-mono truncate">{parent.name.split('&')[0]}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-white/20' : isLight ? 'bg-black/5' : 'bg-white/10'
                  }`}>
                    {count}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-white/80' : isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                  {parent.subCategories.length} subcategories
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBCATEGORY PILLS (Shown when a parent is selected or 'all') */}
      {selectedParentId !== 'all' && activeSubcategories.length > 0 && (
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#070A12] border-white/[0.05]'} space-y-2.5`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${isLight ? 'text-[#475467]' : 'text-[#9AA3B5]'}`}>
              Subcategories in {PARENT_CATEGORIES.find(p => p.id === selectedParentId)?.name}:
            </span>
            <button
              onClick={() => setSelectedSubId('all')}
              className={`text-xs font-mono font-semibold ${selectedSubId === 'all' ? (isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]') : 'text-[#8C95A6]'}`}
            >
              View All Subcategories
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedSubId === 'all'
                  ? isLight ? 'bg-[#6948FF] text-white shadow-xs' : 'bg-[#8B6CFF] text-white shadow-xs'
                  : isLight ? 'bg-white text-[#475467] border border-black/10' : 'bg-[#0C101A] text-[#9AA3B5] border border-white/[0.08]'
              }`}
            >
              All Subcategories
            </button>
            {activeSubcategories.map((sub) => {
              const SubIcon = sub.iconName ? ICON_MAP[sub.iconName] : Coins;
              const subCount = CALCULATORS.filter(c => c.subCategoryId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubId(sub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    selectedSubId === sub.id
                      ? isLight ? 'bg-[#6948FF] text-white shadow-xs font-semibold' : 'bg-[#8B6CFF] text-white shadow-xs font-semibold'
                      : isLight ? 'bg-white hover:bg-[#F0F2F7] text-[#475467] border border-black/10' : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] border border-white/[0.08]'
                  }`}
                >
                  {SubIcon && <SubIcon className="w-3.5 h-3.5 opacity-80" />}
                  <span>{sub.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({subCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* HIERARCHICAL VIEW BY PARENT & SUBCATEGORY */}
      {viewMode === 'hierarchical' ? (
        <div className="space-y-12">
          {PARENT_CATEGORIES.filter(p => selectedParentId === 'all' || p.id === selectedParentId).map((parent) => {
            const ParentIcon = ICON_MAP[parent.iconName] || TrendingUp;
            const parentCalcs = CALCULATORS.filter(c => c.parentCategoryId === parent.id);

            // Filter subcategories that have matching calculators
            const visibleSubs = parent.subCategories.filter(sub => {
              if (selectedSubId !== 'all' && sub.id !== selectedSubId) return false;
              const calcsInSub = parentCalcs.filter(c => c.subCategoryId === sub.id && (
                !searchQuery ||
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.slug.toLowerCase().includes(searchQuery.toLowerCase())
              ));
              return calcsInSub.length > 0;
            });

            if (visibleSubs.length === 0) return null;

            return (
              <section key={parent.id} className="space-y-6">
                {/* Parent Category Header */}
                <div className={`p-5 rounded-2xl border ${
                  isLight ? 'bg-white border-black/10 shadow-xs' : 'bg-[#0C101A] border-white/[0.08] shadow-lg'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${parent.accentColor}15` }}
                    >
                      <ParentIcon className="w-6 h-6" style={{ color: parent.accentColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className={`text-lg sm:text-xl font-bold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
                          {parent.name}
                        </h2>
                        <span 
                          className="text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold"
                          style={{
                            backgroundColor: `${parent.accentColor}15`,
                            color: parent.accentColor
                          }}
                        >
                          {parentCalcs.length} Models
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'} mt-1`}>
                        {parent.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategories Breakdown */}
                <div className="space-y-8 pl-1 sm:pl-3">
                  {visibleSubs.map((sub) => {
                    const SubIcon = sub.iconName ? ICON_MAP[sub.iconName] : Coins;
                    const subCalcs = parentCalcs.filter(c => c.subCategoryId === sub.id && (
                      !searchQuery ||
                      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
                    ));

                    return (
                      <div key={sub.id} className="space-y-4">
                        {/* Subcategory Label & Description */}
                        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                          {SubIcon && <SubIcon className="w-4 h-4 text-[#8C95A6]" />}
                          <h3 className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
                            {sub.name}
                          </h3>
                          <span className={`text-[11px] font-mono ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
                            — {subCalcs.length} {subCalcs.length === 1 ? 'calculator' : 'calculators'}
                          </span>
                        </div>

                        {/* Grid of calculators */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {subCalcs.map(renderCalculatorCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* FLAT COMPACT GRID */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C95A6]">
            <span>Showing {filteredCalculators.length} calculators</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCalculators.map(renderCalculatorCard)}
          </div>
        </div>
      )}

    </div>
  );
};
