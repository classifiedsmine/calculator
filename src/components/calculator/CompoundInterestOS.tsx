import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Percent,
  Sliders,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Info,
  ChevronRight,
  Share2,
  Copy,
  Check,
  Split,
  BarChart3,
  HelpCircle,
  Award,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CalculationMode,
  compileNaturalLanguageQuery,
  generateDeltaExplanation,
  generateSensitivityMatrix,
  generateConstraintMatrix,
  calculateMilestones,
  solveForInitialPrincipal,
  solveForRequiredRate,
  solveForMonthlyContribution,
  generateCalculationFingerprint,
  MilestoneItem,
  DeltaExplanation,
} from '../../lib/compoundEngine';
import { calculateCompoundInterest, calculateTimeToReachGoal, CompoundInterestInputs } from '../../lib/safeMath';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { CurrencyConfig } from '../../types';

interface CompoundInterestOSProps {
  currency: CurrencyConfig;
  theme?: 'dark' | 'light';
  currentInputs: Record<string, any>;
  onApplyInputs: (inputs: Record<string, any>) => void;
}

export const CompoundInterestOS: React.FC<CompoundInterestOSProps> = ({
  currency,
  theme = 'light',
  currentInputs,
  onApplyInputs,
}) => {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-black/10 text-[#11131A] shadow-xs' : 'bg-[#0C101A] border-white/[0.08] text-[#F7F8FC] shadow-xl';
  const cardSubtleBg = isLight ? 'bg-[#F8FAFC] border-black/5' : 'bg-[#111725] border-white/[0.05]';
  const headingColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textBody = isLight ? 'text-[#475467]' : 'text-[#9AA3B5]';
  const textMuted = isLight ? 'text-[#667085]' : 'text-[#5F6878]';

  // 1. Query OS Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [queryParsedFeedback, setQueryParsedFeedback] = useState<string | null>(null);

  // 2. Active Mode (Equation Solver)
  const [activeMode, setActiveMode] = useState<CalculationMode>('future_value');

  // Inverse solver states
  const [targetCorpus, setTargetCorpus] = useState(1000000);
  const [targetYears, setTargetYears] = useState(20);
  const [targetRate, setTargetRate] = useState(8.0);
  const [targetPrincipal, setTargetPrincipal] = useState(10000);
  const [targetMonthly, setTargetMonthly] = useState(500);

  // Constraint Matrix State
  const [constraintType, setConstraintType] = useState<'returns_by_years' | 'contributions_by_returns'>('returns_by_years');

  // 3. Delta Explanation State
  const [previousInputsState, setPreviousInputsState] = useState<CompoundInterestInputs>({
    initialDeposit: Number(currentInputs.initialDeposit) || 10000,
    periodicContribution: Number(currentInputs.periodicContribution) || 500,
    interestRate: Number(currentInputs.interestRate) || 8.0,
    years: Number(currentInputs.years) || 20,
    inflationRate: Number(currentInputs.inflationRate) || 3.0,
  });

  const [deltaExplanation, setDeltaExplanation] = useState<DeltaExplanation | null>(null);

  // 4. Multi-Scenario Modeling State (Scenarios A, B, C)
  const [scenarioA, setScenarioA] = useState({ principal: 10000, monthly: 300, rate: 7.0, years: 25, label: 'Conservative Base' });
  const [scenarioB, setScenarioB] = useState({ principal: 10000, monthly: 600, rate: 8.5, years: 25, label: 'Balanced Growth' });
  const [scenarioC, setScenarioC] = useState({ principal: 15000, monthly: 1000, rate: 10.0, years: 25, label: 'Aggressive Wealth' });

  // 5. Share/Fingerprint State
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Update delta explanation whenever currentInputs change
  useEffect(() => {
    const curTyped: CompoundInterestInputs = {
      initialDeposit: Number(currentInputs.initialDeposit) || 0,
      periodicContribution: Number(currentInputs.periodicContribution) || 0,
      interestRate: Number(currentInputs.interestRate) || 8,
      years: Number(currentInputs.years) || 20,
      inflationRate: Number(currentInputs.inflationRate) || 0,
      contributionFrequency: currentInputs.contributionFrequency || 'monthly',
      compoundingFrequency: currentInputs.compoundingFrequency || 'annually',
    };

    const delta = generateDeltaExplanation(previousInputsState, curTyped);
    if (delta) {
      setDeltaExplanation(delta);
    }
    setPreviousInputsState(curTyped);
  }, [currentInputs]);

  // Derived Calculations
  const currentEngineResult = useMemo(() => {
    return calculateCompoundInterest({
      initialDeposit: Number(currentInputs.initialDeposit) || 0,
      periodicContribution: Number(currentInputs.periodicContribution) || 0,
      interestRate: Number(currentInputs.interestRate) || 8,
      years: Number(currentInputs.years) || 20,
      inflationRate: Number(currentInputs.inflationRate) || 0,
      contributionFrequency: currentInputs.contributionFrequency || 'monthly',
      compoundingFrequency: currentInputs.compoundingFrequency || 'annually',
    });
  }, [currentInputs]);

  // Milestones
  const milestones = useMemo(() => {
    return calculateMilestones({
      initialDeposit: Number(currentInputs.initialDeposit) || 0,
      periodicContribution: Number(currentInputs.periodicContribution) || 0,
      interestRate: Number(currentInputs.interestRate) || 8,
      years: Number(currentInputs.years) || 20,
      inflationRate: Number(currentInputs.inflationRate) || 0,
    });
  }, [currentInputs]);

  // Sensitivity Matrix
  const sensitivity = useMemo(() => {
    return generateSensitivityMatrix({
      initialDeposit: Number(currentInputs.initialDeposit) || 0,
      periodicContribution: Number(currentInputs.periodicContribution) || 0,
      interestRate: Number(currentInputs.interestRate) || 8,
      years: Number(currentInputs.years) || 20,
      inflationRate: Number(currentInputs.inflationRate) || 0,
    });
  }, [currentInputs]);

  // Constraint Matrix Rows
  const constraintRows = useMemo(() => {
    return generateConstraintMatrix({
      targetAmount: targetCorpus,
      initialDeposit: targetPrincipal,
      monthlyContribution: targetMonthly,
      interestRate: targetRate,
      years: targetYears,
      solveType: constraintType,
    });
  }, [targetCorpus, targetPrincipal, targetMonthly, targetRate, targetYears, constraintType]);

  // Multi-Scenario Results
  const scenarioResults = useMemo(() => {
    const resA = calculateCompoundInterest({ initialDeposit: scenarioA.principal, periodicContribution: scenarioA.monthly, interestRate: scenarioA.rate, years: scenarioA.years });
    const resB = calculateCompoundInterest({ initialDeposit: scenarioB.principal, periodicContribution: scenarioB.monthly, interestRate: scenarioB.rate, years: scenarioB.years });
    const resC = calculateCompoundInterest({ initialDeposit: scenarioC.principal, periodicContribution: scenarioC.monthly, interestRate: scenarioC.rate, years: scenarioC.years });

    const maxYears = Math.max(scenarioA.years, scenarioB.years, scenarioC.years);
    const comparisonChart = [];
    for (let yr = 0; yr <= maxYears; yr += 2) {
      const pA = resA.timeline.find((t) => t.year === yr)?.totalBalance || (yr > scenarioA.years ? resA.futureValue : 0);
      const pB = resB.timeline.find((t) => t.year === yr)?.totalBalance || (yr > scenarioB.years ? resB.futureValue : 0);
      const pC = resC.timeline.find((t) => t.year === yr)?.totalBalance || (yr > scenarioC.years ? resC.futureValue : 0);
      comparisonChart.push({ year: `Yr ${yr}`, [scenarioA.label]: pA, [scenarioB.label]: pB, [scenarioC.label]: pC });
    }

    return { resA, resB, resC, comparisonChart };
  }, [scenarioA, scenarioB, scenarioC]);

  // Fingerprint Object
  const fingerprint = useMemo(() => {
    return generateCalculationFingerprint(activeMode, currentInputs);
  }, [activeMode, currentInputs]);

  // Unified Query Execution Engine
  const processQuery = (queryText: string) => {
    setSearchQuery(queryText);
    const parsed = compileNaturalLanguageQuery(queryText);
    if (!parsed) return;

    setActiveMode(parsed.matchedIntent);
    setQueryParsedFeedback(parsed.explanation);

    const newInputs: Record<string, any> = { ...currentInputs };

    if (parsed.extractedParams.principal !== undefined) newInputs.initialDeposit = parsed.extractedParams.principal;
    if (parsed.extractedParams.contribution !== undefined) newInputs.periodicContribution = parsed.extractedParams.contribution;
    if (parsed.extractedParams.interestRate !== undefined) newInputs.interestRate = parsed.extractedParams.interestRate;
    if (parsed.extractedParams.years !== undefined) newInputs.years = parsed.extractedParams.years;

    const targetAmt = parsed.extractedParams.targetAmount || targetCorpus || 1000000;
    setTargetCorpus(targetAmt);

    if (parsed.extractedParams.years !== undefined) setTargetYears(parsed.extractedParams.years);
    if (parsed.extractedParams.interestRate !== undefined) setTargetRate(parsed.extractedParams.interestRate);
    if (parsed.extractedParams.principal !== undefined) setTargetPrincipal(parsed.extractedParams.principal);

    // If intent requires inverse solving, compute missing variable and apply to top main calculator
    if (parsed.matchedIntent === 'required_contribution') {
      const solved = solveForMonthlyContribution({
        targetAmount: targetAmt,
        initialDeposit: newInputs.initialDeposit || 0,
        interestRate: newInputs.interestRate || 8,
        years: newInputs.years || 20,
      });
      newInputs.periodicContribution = solved.requiredMonthly;
      setTargetMonthly(solved.requiredMonthly);
    } else if (parsed.matchedIntent === 'initial_principal') {
      const solved = solveForInitialPrincipal({
        targetAmount: targetAmt,
        monthlyContribution: newInputs.periodicContribution || 0,
        interestRate: newInputs.interestRate || 8,
        years: newInputs.years || 20,
      });
      newInputs.initialDeposit = solved.requiredPrincipal;
      setTargetPrincipal(solved.requiredPrincipal);
    } else if (parsed.matchedIntent === 'required_return') {
      const solved = solveForRequiredRate({
        targetAmount: targetAmt,
        initialDeposit: newInputs.initialDeposit || 0,
        monthlyContribution: newInputs.periodicContribution || 0,
        years: newInputs.years || 20,
      });
      if (solved.isSolvable) {
        newInputs.interestRate = solved.requiredRate;
        setTargetRate(solved.requiredRate);
      }
    }

    onApplyInputs(newInputs);
  };

  // Query OS Compiler Execution
  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    processQuery(searchQuery);
  };

  const handleCopyFingerprint = () => {
    const url = `${window.location.origin}${window.location.pathname}#state=${fingerprint.hash}`;
    navigator.clipboard.writeText(url);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <div className="space-y-10 my-8">

      {/* ============================================================== */}
      {/* 1. COMPOUND INTEREST QUERY OS (Natural Language Intent Parser) */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#6948FF]/10 text-[#6948FF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingColor}`}>
                  Compound Interest Query OS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6948FF]/15 text-[#6948FF] font-semibold">
                  NLP Compiler
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Ask any financial growth question in plain English. Decomposes variables into mathematical models in real-time.
              </p>
            </div>
          </div>

          {/* Shareable Fingerprint Token */}
          <button
            onClick={handleCopyFingerprint}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
              isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-[#11131A]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#F7F8FC]'
            }`}
          >
            {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-[#00875A] dark:text-[#35E6A0]" /> : <Share2 className="w-3.5 h-3.5 text-neutral-400" />}
            <span>Fingerprint: <span className="text-[#6948FF] dark:text-[#8B6CFF] font-bold">{fingerprint.hash}</span></span>
          </button>
        </div>

        {/* Natural Language Query Bar */}
        <form onSubmit={handleQuerySubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='e.g., "If I invest $500 a month for 25 years at 8%, how much will I have?"'
              className={`w-full pl-12 pr-28 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#6948FF]/40 ${
                isLight ? 'bg-[#F8FAFC] border-black/10 text-[#11131A]' : 'bg-[#111725] border-white/10 text-[#F7F8FC]'
              }`}
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Compile</span>
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Pre-built Prompt Chips for Zero-Friction Exploration */}
        <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
          <span className={`text-[11px] font-mono ${textMuted}`}>Examples:</span>
          {[
            'How much monthly to reach $2 million in 20 years at 7%?',
            'If I invest $500 a month for 25 years at 8%',
            'How much monthly to reach $1 million in 20 years at 7%?',
            'How long to get $500k with $10k initial and $750/mo?',
            'Starting capital needed for $1M in 15 yrs at 9%',
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => processQuery(promptText)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                isLight
                  ? 'bg-black/[0.02] hover:bg-black/5 border-black/5 text-[#475467]'
                  : 'bg-white/[0.02] hover:bg-white/5 border-white/5 text-[#9AA3B5]'
              }`}
            >
              "{promptText}"
            </button>
          ))}
        </div>

        {/* NLP Deconstruction Feedback */}
        {queryParsedFeedback && (
          <div className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20 text-[#6948FF]' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20 text-[#8B6CFF]'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Compiled Intent:</strong> {queryParsedFeedback}</span>
            </div>
            <button
              onClick={() => setQueryParsedFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 2. FIVE-MODE INVERSE EQUATION SOLVER SUITE */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
              Inverse Financial Equation Solvers
            </h2>
            <p className={`text-xs sm:text-sm ${textBody}`}>
              Compound interest connects five variables: <strong className="font-mono">P, PMT, r, t, FV</strong>. Select which unknown you want to isolate and solve.
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0] font-semibold self-start sm:self-auto">
            Full Bi-Directional Engine
          </span>
        </div>

        {/* 5 Mode Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'future_value', label: '1. Future Value (FV)', sub: 'Solve for Wealth', icon: TrendingUp },
            { id: 'required_contribution', label: '2. Monthly Deposit (PMT)', sub: 'Solve for Savings', icon: DollarSign },
            { id: 'initial_principal', label: '3. Starting Lump Sum (P)', sub: 'Solve for Initial Seed', icon: Target },
            { id: 'required_return', label: '4. Required Return (r)', sub: 'Solve for CAGR', icon: Percent },
            { id: 'time_horizon', label: '5. Time to Goal (t)', sub: 'Solve for Years', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMode(tab.id as CalculationMode)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSel
                    ? 'bg-[#6948FF] text-white border-[#6948FF] shadow-md shadow-[#6948FF]/20 scale-[1.02]'
                    : isLight
                    ? 'bg-[#F8FAFC] hover:bg-black/5 border-black/5 text-[#11131A]'
                    : 'bg-[#111725] hover:bg-white/5 border-white/5 text-[#F7F8FC]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-[#6948FF] dark:text-[#8B6CFF]'}`} />
                  {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{tab.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isSel ? 'text-white/80' : textMuted}`}>{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Mode Solver Workspaces */}
        <div className={`p-6 rounded-2xl border ${cardSubtleBg}`}>
          
          {/* Mode 1: Future Value */}
          {activeMode === 'future_value' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${headingColor}`}>Future Portfolio Valuation (P, PMT, r, t → FV)</h3>
                  <p className={`text-xs ${textBody}`}>Direct compounding accumulation based on your primary parameters.</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] block font-mono text-neutral-500">Nominal Future Value</span>
                  <span className="text-2xl font-extrabold font-mono text-[#6948FF] dark:text-[#8B6CFF]">
                    {formatCurrency(currentEngineResult.futureValue, currency, false, true)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Total Interest Earned</span>
                  <span className="text-sm font-bold text-[#6948FF] dark:text-[#8B6CFF]">
                    {formatCurrency(currentEngineResult.totalInterest, currency, false, true)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Out-of-Pocket Principal</span>
                  <span className="text-sm font-bold">{formatCurrency(currentEngineResult.totalPrincipal, currency, false, true)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Real Purchasing Power</span>
                  <span className="text-sm font-bold text-[#00875A] dark:text-[#35E6A0]">
                    {formatCurrency(currentEngineResult.realFutureValue, currency, false, true)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Growth Multiplier</span>
                  <span className="text-sm font-bold">{currentEngineResult.growthMultiplier}x</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Required Monthly Contribution */}
          {activeMode === 'required_contribution' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold ${headingColor}`}>Target Corpus Monthly Planner</h3>
                  <p className={`text-xs ${textBody}`}>Calculates the precise regular savings needed to reach your wealth goal.</p>
                </div>
                {(() => {
                  const solved = solveForMonthlyContribution({
                    targetAmount: targetCorpus,
                    initialDeposit: targetPrincipal,
                    interestRate: targetRate,
                    years: targetYears,
                  });
                  return (
                    <div className="text-right">
                      <span className="text-[11px] block font-mono text-neutral-500">Required Deposit</span>
                      <span className="text-2xl font-extrabold font-mono text-[#00875A] dark:text-[#35E6A0]">
                        {formatCurrency(solved.requiredMonthly, currency)}/mo
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={targetCorpus}
                    onChange={(e) => setTargetCorpus(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Starting Principal</label>
                  <input
                    type="number"
                    value={targetPrincipal}
                    onChange={(e) => setTargetPrincipal(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetRate}
                    onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const solved = solveForMonthlyContribution({
                      targetAmount: targetCorpus,
                      initialDeposit: targetPrincipal,
                      interestRate: targetRate,
                      years: targetYears,
                    });
                    onApplyInputs({
                      initialDeposit: targetPrincipal,
                      periodicContribution: solved.requiredMonthly,
                      interestRate: targetRate,
                      years: targetYears,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Apply Solved Deposit to Main Top Calculator</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Starting Principal */}
          {activeMode === 'initial_principal' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold ${headingColor}`}>Required Initial Capital Seed Solver</h3>
                  <p className={`text-xs ${textBody}`}>Computes the upfront lump sum required today if recurring deposits are fixed.</p>
                </div>
                {(() => {
                  const solvedP = solveForInitialPrincipal({
                    targetAmount: targetCorpus,
                    monthlyContribution: targetMonthly,
                    interestRate: targetRate,
                    years: targetYears,
                  });
                  return (
                    <div className="text-right">
                      <span className="text-[11px] block font-mono text-neutral-500">Required Starting Seed</span>
                      <span className="text-2xl font-extrabold font-mono text-[#6948FF] dark:text-[#8B6CFF]">
                        {formatCurrency(solvedP.requiredPrincipal, currency)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={targetCorpus}
                    onChange={(e) => setTargetCorpus(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Monthly Contribution</label>
                  <input
                    type="number"
                    value={targetMonthly}
                    onChange={(e) => setTargetMonthly(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetRate}
                    onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 4: Required Return Rate */}
          {activeMode === 'required_return' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold ${headingColor}`}>Required Annual Return (CAGR) Solver</h3>
                  <p className={`text-xs ${textBody}`}>Uses root-finding algorithms to find the annual return needed for your goal.</p>
                </div>
                {(() => {
                  const solvedRate = solveForRequiredRate({
                    targetAmount: targetCorpus,
                    initialDeposit: targetPrincipal,
                    monthlyContribution: targetMonthly,
                    years: targetYears,
                  });
                  return (
                    <div className="text-right">
                      <span className="text-[11px] block font-mono text-neutral-500">Required Return Rate</span>
                      <span className={`text-2xl font-extrabold font-mono ${solvedRate.isSolvable ? 'text-[#6948FF] dark:text-[#8B6CFF]' : 'text-amber-500'}`}>
                        {solvedRate.requiredRate > 50 ? '> 50% p.a.' : `${solvedRate.requiredRate.toFixed(1)}% p.a.`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={targetCorpus}
                    onChange={(e) => setTargetCorpus(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Starting Principal</label>
                  <input
                    type="number"
                    value={targetPrincipal}
                    onChange={(e) => setTargetPrincipal(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Monthly Contribution</label>
                  <input
                    type="number"
                    value={targetMonthly}
                    onChange={(e) => setTargetMonthly(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 5: Time Horizon */}
          {activeMode === 'time_horizon' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold ${headingColor}`}>Time to Goal Horizon Solver</h3>
                  <p className={`text-xs ${textBody}`}>Determines the exact compounding duration needed at your current savings pace.</p>
                </div>
                {(() => {
                  const solvedTime = calculateTimeToReachGoal({
                    targetAmount: targetCorpus,
                    initialDeposit: targetPrincipal,
                    monthlyContribution: targetMonthly,
                    interestRate: targetRate,
                  });
                  return (
                    <div className="text-right">
                      <span className="text-[11px] block font-mono text-neutral-500">Estimated Horizon</span>
                      <span className="text-2xl font-extrabold font-mono text-[#00875A] dark:text-[#35E6A0]">
                        {solvedTime.years} yrs {solvedTime.months > 0 ? `${solvedTime.months} mos` : ''}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={targetCorpus}
                    onChange={(e) => setTargetCorpus(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Starting Principal</label>
                  <input
                    type="number"
                    value={targetPrincipal}
                    onChange={(e) => setTargetPrincipal(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Monthly Contribution</label>
                  <input
                    type="number"
                    value={targetMonthly}
                    onChange={(e) => setTargetMonthly(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetRate}
                    onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border font-mono bg-white dark:bg-[#111725] text-xs"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CONSTRAINT SOLVING MATRIX (Time vs Return Combinations) */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#6948FF] dark:text-[#8B6CFF]" />
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Multi-Constraint Goal Matrix
              </h2>
            </div>
            <p className={`text-xs sm:text-sm ${textBody}`}>
              Target: <strong className="font-mono text-neutral-900 dark:text-neutral-100">{formatCurrency(targetCorpus, currency)}</strong> with {formatCurrency(targetPrincipal, currency)} initial & {formatCurrency(targetMonthly, currency)}/mo.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-medium">
            <button
              onClick={() => setConstraintType('returns_by_years')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                constraintType === 'returns_by_years'
                  ? 'bg-white dark:bg-[#111725] shadow-xs text-[#11131A] dark:text-[#F7F8FC] font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Solve: Required Return by Horizon
            </button>
            <button
              onClick={() => setConstraintType('contributions_by_returns')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                constraintType === 'contributions_by_returns'
                  ? 'bg-white dark:bg-[#111725] shadow-xs text-[#11131A] dark:text-[#F7F8FC] font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Solve: Required Monthly by Return
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {constraintRows.map((row, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-center transition-all ${
                row.isFeasible
                  ? isLight
                    ? 'bg-[#F8FAFC] border-black/5 hover:border-[#6948FF]/40'
                    : 'bg-[#111725] border-white/5 hover:border-[#8B6CFF]/40'
                  : 'bg-red-500/5 border-red-500/15 opacity-70'
              }`}
            >
              <span className="text-[11px] font-mono text-neutral-500 block mb-1">{row.label}</span>
              <span className={`text-sm font-extrabold font-mono block ${
                row.isFeasible ? isLight ? 'text-[#00875A]' : 'text-[#35E6A0]' : 'text-red-500'
              }`}>
                {row.formattedMetric}
              </span>
              <span className="text-[9px] text-neutral-400 mt-1 block">
                {row.isFeasible ? 'Realistic' : 'High Hurdle'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. "WHY DID MY RESULT CHANGE?" DELTA ENGINE */}
      {/* ============================================================== */}
      {deltaExplanation && (
        <section className={`p-6 rounded-2xl border transition-all ${
          isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20 text-[#11131A]' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20 text-[#F7F8FC]'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#6948FF] dark:text-[#8B6CFF] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#6948FF] dark:text-[#8B6CFF]">
                  Mathematical Attribution Engine
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#6948FF]/15 text-[#6948FF] dark:text-[#8B6CFF]">
                  {deltaExplanation.primaryCause}
                </span>
              </div>
              <p className="text-sm font-semibold leading-relaxed">
                {deltaExplanation.summary}
              </p>
              <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300 list-disc list-inside pt-1">
                {deltaExplanation.bulletPoints.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setDeltaExplanation(null)}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. MULTI-SCENARIO BENCHMARK ENGINE (Scenarios A vs B vs C) */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#29D8FF]/10 text-[#29D8FF]">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Multi-Scenario Comparative Engine
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Model and stress-test 3 distinct wealth accumulation trajectories side-by-side.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 font-semibold text-neutral-500">
            3-Way Parallel Simulation
          </span>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Scenario A */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#29D8FF]">Scenario A</span>
              <input
                type="text"
                value={scenarioA.label}
                onChange={(e) => setScenarioA({ ...scenarioA, label: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-36 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500">Deposit</label>
                <input
                  type="number"
                  value={scenarioA.principal}
                  onChange={(e) => setScenarioA({ ...scenarioA, principal: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Monthly</label>
                <input
                  type="number"
                  value={scenarioA.monthly}
                  onChange={(e) => setScenarioA({ ...scenarioA, monthly: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={scenarioA.rate}
                  onChange={(e) => setScenarioA({ ...scenarioA, rate: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Years</label>
                <input
                  type="number"
                  value={scenarioA.years}
                  onChange={(e) => setScenarioA({ ...scenarioA, years: Number(e.target.value) || 1 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">25-Yr Valuation</span>
              <span className="text-lg font-bold font-mono text-[#29D8FF]">
                {formatCurrency(scenarioResults.resA.futureValue, currency)}
              </span>
            </div>
          </div>

          {/* Scenario B */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#8B6CFF]">Scenario B</span>
              <input
                type="text"
                value={scenarioB.label}
                onChange={(e) => setScenarioB({ ...scenarioB, label: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-36 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500">Deposit</label>
                <input
                  type="number"
                  value={scenarioB.principal}
                  onChange={(e) => setScenarioB({ ...scenarioB, principal: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Monthly</label>
                <input
                  type="number"
                  value={scenarioB.monthly}
                  onChange={(e) => setScenarioB({ ...scenarioB, monthly: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={scenarioB.rate}
                  onChange={(e) => setScenarioB({ ...scenarioB, rate: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Years</label>
                <input
                  type="number"
                  value={scenarioB.years}
                  onChange={(e) => setScenarioB({ ...scenarioB, years: Number(e.target.value) || 1 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">25-Yr Valuation</span>
              <span className="text-lg font-bold font-mono text-[#8B6CFF]">
                {formatCurrency(scenarioResults.resB.futureValue, currency)}
              </span>
            </div>
          </div>

          {/* Scenario C */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#35E6A0]">Scenario C</span>
              <input
                type="text"
                value={scenarioC.label}
                onChange={(e) => setScenarioC({ ...scenarioC, label: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-36 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500">Deposit</label>
                <input
                  type="number"
                  value={scenarioC.principal}
                  onChange={(e) => setScenarioC({ ...scenarioC, principal: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Monthly</label>
                <input
                  type="number"
                  value={scenarioC.monthly}
                  onChange={(e) => setScenarioC({ ...scenarioC, monthly: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={scenarioC.rate}
                  onChange={(e) => setScenarioC({ ...scenarioC, rate: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500">Years</label>
                <input
                  type="number"
                  value={scenarioC.years}
                  onChange={(e) => setScenarioC({ ...scenarioC, years: Number(e.target.value) || 1 })}
                  className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">25-Yr Valuation</span>
              <span className="text-lg font-bold font-mono text-[#35E6A0]">
                {formatCurrency(scenarioResults.resC.futureValue, currency)}
              </span>
            </div>
          </div>

        </div>

        {/* Comparison Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scenarioResults.comparisonChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#00000010' : '#ffffff10'} />
              <XAxis dataKey="year" tick={{ fill: isLight ? '#667085' : '#9AA3B5', fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: isLight ? '#667085' : '#9AA3B5', fontSize: 11 }}
              />
              <Tooltip
                formatter={(val: any) => formatCurrency(Number(val) || 0, currency)}
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#0C101A',
                  borderColor: isLight ? '#00000015' : '#ffffff15',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey={scenarioA.label} stroke="#29D8FF" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey={scenarioB.label} stroke="#8B6CFF" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey={scenarioC.label} stroke="#35E6A0" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SENSITIVITY ANALYSIS HEATMAP MATRIX */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#35E6A0]" />
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Rate & Duration Sensitivity Matrix
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Understand the fragility and robustness of your projection when rates or timelines drift.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Baseline: {currentInputs.interestRate}% return over {currentInputs.years} yrs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className={`border-b ${isLight ? 'border-black/10 text-neutral-500' : 'border-white/10 text-neutral-400'}`}>
                <th className="py-2.5 text-left font-semibold">Time Horizon</th>
                {sensitivity.rateDeltas.map((rd) => {
                  const simulatedRate = Math.max(0.1, Number(currentInputs.interestRate) + rd);
                  return (
                    <th key={rd} className="py-2.5 font-semibold">
                      {simulatedRate.toFixed(1)}% ({rd >= 0 ? `+${rd}` : rd}%)
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-black/5' : 'divide-white/5'}`}>
              {sensitivity.matrix.map((row, rIdx) => {
                const rowYears = row[0].years;
                const yearOffset = row[0].yearsOffset;
                return (
                  <tr key={rIdx} className={isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-white/[0.02]'}>
                    <td className="py-3 text-left font-bold text-neutral-800 dark:text-neutral-200">
                      {rowYears} Years ({yearOffset >= 0 ? `+${yearOffset}` : yearOffset} yrs)
                    </td>
                    {row.map((cell, cIdx) => {
                      const isBase = cell.rateOffset === 0 && cell.yearsOffset === 0;
                      const isPositive = cell.diffFromBase >= 0;
                      return (
                        <td
                          key={cIdx}
                          className={`py-3 px-2 rounded-lg transition-colors ${
                            isBase
                              ? 'bg-[#6948FF]/15 font-bold text-[#6948FF] dark:text-[#8B6CFF]'
                              : isPositive
                              ? isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'
                              : 'text-neutral-500'
                          }`}
                        >
                          <div className="font-bold">{formatCurrency(cell.futureValue, currency, true)}</div>
                          {!isBase && (
                            <div className="text-[10px] opacity-80">
                              {isPositive ? '+' : ''}{cell.diffPercent}%
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. MILESTONE & COMPOUNDING CROSSOVER LADDER */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Portfolio Milestones & Compounding Crossover Points
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Key inflection moments where compounding transitions from linear growth into an exponential snowball.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                m.type === 'crossover'
                  ? isLight
                    ? 'bg-[#6948FF]/5 border-[#6948FF]/20 text-[#11131A]'
                    : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20 text-[#F7F8FC]'
                  : cardSubtleBg
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                m.type === 'crossover'
                  ? 'bg-[#6948FF] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300'
              }`}>
                {m.type === 'crossover' ? <Zap className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                    Year {m.year}
                  </span>
                  <h4 className="text-xs font-bold leading-tight">{m.title}</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {m.subtitle}
                </p>
                <div className="text-xs font-bold font-mono text-[#6948FF] dark:text-[#8B6CFF] pt-1">
                  Corpus: {formatCurrency(m.balance, currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. QUESTION LADDER: ANTICIPATE NEXT LOGICAL FINANCIAL QUERIES */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#6948FF] dark:text-[#8B6CFF]" />
          <div>
            <h3 className={`text-lg font-bold ${headingColor}`}>
              Question Ladder: What to Explore Next?
            </h3>
            <p className={`text-xs ${textBody}`}>
              Financial decisions aren't one-and-done. Follow the logical next branches of your inquiry:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[
            {
              q: `What if I boost contributions by +${formatCurrency(250, currency)}/mo?`,
              action: () => onApplyInputs({ periodicContribution: (Number(currentInputs.periodicContribution) || 0) + 250 }),
              tag: 'Savings Velocity',
            },
            {
              q: `What if returns are 1% higher (${(Number(currentInputs.interestRate) || 8) + 1}%)?`,
              action: () => onApplyInputs({ interestRate: (Number(currentInputs.interestRate) || 8) + 1 }),
              tag: 'Market Alpha',
            },
            {
              q: `How much do I lose if I delay by 5 years?`,
              action: () => onApplyInputs({ years: Math.max(5, (Number(currentInputs.years) || 20) - 5) }),
              tag: 'Cost of Delay',
            },
            {
              q: `Factor in 3.5% inflation purchasing power`,
              action: () => onApplyInputs({ inflationRate: 3.5 }),
              tag: 'Real Value',
            },
            {
              q: `Add 5% annual step-up contribution growth`,
              action: () => onApplyInputs({ annualStepUp: 5 }),
              tag: 'Career Growth',
            },
            {
              q: `Double time horizon to ${(Number(currentInputs.years) || 20) * 2} years`,
              action: () => onApplyInputs({ years: (Number(currentInputs.years) || 20) * 2 }),
              tag: 'Intergenerational',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                isLight
                  ? 'bg-[#F8FAFC] hover:bg-[#6948FF] hover:text-white border-black/5'
                  : 'bg-[#111725] hover:bg-[#8B6CFF] hover:text-white border-white/5'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono opacity-70 uppercase tracking-wider block mb-1">
                  {item.tag}
                </span>
                <span className="text-xs font-semibold block leading-tight">{item.q}</span>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. MACHINE-READABLE PROVENANCE & CALCULATION METHODOLOGY METADATA */}
      {/* ============================================================== */}
      <section className={`p-4 sm:p-5 rounded-2xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-black/[0.02] border-black/5 text-neutral-500' : 'bg-white/[0.02] border-white/5 text-neutral-400'
      }`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span><strong>Engine:</strong> compound-query-os-v2.5</span>
          <span><strong>Algorithm:</strong> Bisection + Discrete Cashflow Sub-stepping</span>
          <span><strong>Compounding:</strong> {currentInputs.compoundingFrequency || 'annually'}</span>
          <span><strong>Rounding:</strong> Exact Double Precision Floating Point</span>
        </div>
        <div className="text-[10px] opacity-70">
          Deterministic Mathematical Model · Provenance Verified
        </div>
      </section>

    </div>
  );
};
