import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Calendar,
  Sparkles,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Info,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Scale,
  DollarSign,
  PieChart as PieChartIcon,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  SipEngineInputs,
  runSipProjectionEngine,
  parseSipNaturalQuery,
  SipEngineOutputs,
} from '../../lib/sipProjectionEngine';
import { formatCurrency } from '../../lib/formatters';
import { CurrencyConfig } from '../../types';

interface SipOSProps {
  currency: CurrencyConfig;
  theme: 'dark' | 'light';
  currentInputs?: Record<string, any>;
  onApplyInputs?: (inputs: Record<string, any>) => void;
}

export const SipOS: React.FC<SipOSProps> = ({
  currency,
  theme,
  currentInputs,
  onApplyInputs,
}) => {
  const isLight = theme === 'light';

  // Natural query input state
  const [naturalQuery, setNaturalQuery] = useState('');
  const [queryFeedback, setQueryFeedback] = useState<string | null>(null);

  // Active OS sub-mode
  const [mode, setMode] = useState<
    'returns' | 'goal' | 'stepup' | 'inflation' | 'vs_lumpsum' | 'goal_existing'
  >('returns');

  // Core Simulation Inputs
  const [monthlySip, setMonthlySip] = useState<number>(15000);
  const [assumedReturn, setAssumedReturn] = useState<number>(12);
  const [durationYears, setDurationYears] = useState<number>(15);
  const [initialLumpSum, setInitialLumpSum] = useState<number>(0);

  // Step-Up
  const [enableStepUp, setEnableStepUp] = useState<boolean>(false);
  const [stepUpType, setStepUpType] = useState<'percentage' | 'fixed'>('percentage');
  const [annualStepUpRate, setAnnualStepUpRate] = useState<number>(10);
  const [annualStepUpFixed, setAnnualStepUpFixed] = useState<number>(1000);

  // Goal Mode
  const [targetCorpus, setTargetCorpus] = useState<number>(10000000); // 1 Crore default
  const [existingPortfolio, setExistingPortfolio] = useState<number>(500000); // 5 Lakh
  const [existingSip, setExistingSip] = useState<number>(15000);

  // Compounding & Advanced Options
  const [contributionTiming, setContributionTiming] = useState<'beginning' | 'end'>('end');
  const [contributionFrequency, setContributionFrequency] = useState<'month' | 'year'>('month');
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [expenseRatio, setExpenseRatio] = useState<number>(0.75); // 0.75% Mutual Fund TER
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [taxRegime, setTaxRegime] = useState<'india_equity_ltcg_new' | 'custom'>('india_equity_ltcg_new');
  const [customTaxRate, setCustomTaxRate] = useState<number>(12.5);
  const [taxExemptionLimit, setTaxExemptionLimit] = useState<number>(125000); // ₹1.25L exemption
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(1200000); // 12 Lakh

  // Tab & UI States
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    'chart' | 'goal_ladder' | 'delay_cost' | 'milestones' | 'cashflow' | 'tax_fees'
  >('chart');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Hydrate from props if present
  useEffect(() => {
    if (currentInputs) {
      if (currentInputs.monthlyInvestment !== undefined) setMonthlySip(Number(currentInputs.monthlyInvestment));
      if (currentInputs.monthlySip !== undefined) setMonthlySip(Number(currentInputs.monthlySip));
      if (currentInputs.expectedReturnRate !== undefined) setAssumedReturn(Number(currentInputs.expectedReturnRate));
      if (currentInputs.assumedReturn !== undefined) setAssumedReturn(Number(currentInputs.assumedReturn));
      if (currentInputs.timePeriodYears !== undefined) setDurationYears(Number(currentInputs.timePeriodYears));
      if (currentInputs.durationYears !== undefined) setDurationYears(Number(currentInputs.durationYears));
      if (currentInputs.annualStepUp !== undefined) {
        setAnnualStepUpRate(Number(currentInputs.annualStepUp));
        if (Number(currentInputs.annualStepUp) > 0) setEnableStepUp(true);
      }
      if (currentInputs.targetCorpus !== undefined) setTargetCorpus(Number(currentInputs.targetCorpus));
    }
  }, [currentInputs]);

  // Adjust step up enable status based on mode
  useEffect(() => {
    if (mode === 'stepup') {
      setEnableStepUp(true);
    }
  }, [mode]);

  // Execute Simulation
  const simulationResult: SipEngineOutputs = useMemo(() => {
    const inputs: SipEngineInputs = {
      mode,
      monthlySip,
      assumedReturn,
      durationYears,
      initialLumpSum,
      enableStepUp: mode === 'stepup' ? true : enableStepUp,
      stepUpType,
      annualStepUpRate,
      annualStepUpFixed,
      targetCorpus,
      existingPortfolio,
      existingSip,
      contributionTiming,
      contributionFrequency,
      compoundingFrequency: 'monthly',
      inflationRate,
      expenseRatio,
      includeTax,
      taxRegime,
      customTaxRate,
      taxExemptionLimit,
      lumpSumAmount,
    };
    return runSipProjectionEngine(inputs);
  }, [
    mode,
    monthlySip,
    assumedReturn,
    durationYears,
    initialLumpSum,
    enableStepUp,
    stepUpType,
    annualStepUpRate,
    annualStepUpFixed,
    targetCorpus,
    existingPortfolio,
    existingSip,
    contributionTiming,
    contributionFrequency,
    inflationRate,
    expenseRatio,
    includeTax,
    taxRegime,
    customTaxRate,
    taxExemptionLimit,
    lumpSumAmount,
  ]);

  // Handle Natural Search Compiler
  const handleCompileQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalQuery.trim()) return;

    const parsed = parseSipNaturalQuery(naturalQuery);
    if (parsed) {
      if (parsed.mode) setMode(parsed.mode);
      if (parsed.monthlySip !== undefined) setMonthlySip(parsed.monthlySip);
      if (parsed.durationYears !== undefined) setDurationYears(parsed.durationYears);
      if (parsed.assumedReturn !== undefined) setAssumedReturn(parsed.assumedReturn);
      if (parsed.targetCorpus !== undefined) setTargetCorpus(parsed.targetCorpus);
      if (parsed.annualStepUpRate !== undefined) {
        setAnnualStepUpRate(parsed.annualStepUpRate);
        setEnableStepUp(true);
      }
      if (parsed.includeTax !== undefined) setIncludeTax(parsed.includeTax);

      setQueryFeedback(`Intent Compiled: Loaded structured parameters!`);
      setTimeout(() => setQueryFeedback(null), 3000);
    } else {
      setQueryFeedback(`Could not parse query. Try "10000 sip for 15 years at 12%" or "how much sip for 1 crore"`);
      setTimeout(() => setQueryFeedback(null), 4000);
    }
  };

  // Helper for presets
  const applyPreset = (preset: {
    label: string;
    mode: 'returns' | 'goal' | 'stepup' | 'inflation' | 'vs_lumpsum' | 'goal_existing';
    monthlySip?: number;
    durationYears?: number;
    assumedReturn?: number;
    targetCorpus?: number;
    annualStepUpRate?: number;
    enableStepUp?: boolean;
    lumpSumAmount?: number;
  }) => {
    setMode(preset.mode);
    if (preset.monthlySip !== undefined) setMonthlySip(preset.monthlySip);
    if (preset.durationYears !== undefined) setDurationYears(preset.durationYears);
    if (preset.assumedReturn !== undefined) setAssumedReturn(preset.assumedReturn);
    if (preset.targetCorpus !== undefined) setTargetCorpus(preset.targetCorpus);
    if (preset.annualStepUpRate !== undefined) setAnnualStepUpRate(preset.annualStepUpRate);
    if (preset.enableStepUp !== undefined) setEnableStepUp(preset.enableStepUp);
    if (preset.lumpSumAmount !== undefined) setLumpSumAmount(preset.lumpSumAmount);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Year',
      'Opening Balance',
      'Monthly SIP',
      'Annual Deposits',
      'Returns Earned (Year)',
      'Closing Balance',
      'Total Invested to Date',
      'Cumulative Returns',
      'Real Purchasing Power (Inflation-Adjusted)',
      'Estimated Tax Liability',
    ];

    const rows = simulationResult.timeline.map((t) => [
      t.year,
      t.startBalance,
      t.monthlyContribution,
      t.annualDeposits,
      t.returnsEarned,
      t.closingBalance,
      t.totalInvestedToDate,
      t.cumulativeReturns,
      t.realPurchasingPower,
      t.estimatedTaxLiability,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIP_Projection_${durationYears}Y_${assumedReturn}pct.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share URL
  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sip', monthlySip.toString());
    url.searchParams.set('ret', assumedReturn.toString());
    url.searchParams.set('yrs', durationYears.toString());
    if (enableStepUp) url.searchParams.set('stepup', annualStepUpRate.toString());
    if (mode === 'goal') url.searchParams.set('target', targetCorpus.toString());

    navigator.clipboard.writeText(url.toString());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // UI Theme variables
  const cardBg = isLight ? 'bg-white border-black/[0.08] shadow-sm' : 'bg-[#0E131F] border-white/[0.08] shadow-xl';
  const cardSubtleBg = isLight ? 'bg-neutral-50/80 border-neutral-200/80' : 'bg-[#141A29]/80 border-white/[0.06]';
  const headingColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textBody = isLight ? 'text-[#4A5568]' : 'text-[#9AA3B5]';
  const inputBg = isLight ? 'bg-white border-black/15 text-[#11131A] focus:border-[#6948FF]' : 'bg-[#182033] border-white/10 text-white focus:border-[#8B6CFF]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="sip-os-root">
      {/* 1. Header Banner & Natural Query Search Compiler */}
      <div className={`p-5 sm:p-7 rounded-3xl border relative overflow-hidden ${cardBg}`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35E6A0]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6948FF]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#35E6A0]/10 text-[#00A86B] dark:text-[#35E6A0] mb-2 border border-[#35E6A0]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INVESTMENT PROJECTION & GOAL OS</span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${headingColor}`}>
                SIP (Systematic Investment Plan) Calculator
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${textBody}`}>
                Calculates maturity wealth, decomposes contributions vs modeled growth, solves for target goals, and models step-ups, inflation purchasing power, and post-July 2024 capital gains tax.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isLight ? 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200' : 'bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedUrl ? 'Link Copied!' : 'Share Scenario'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#35E6A0] hover:bg-[#28d48e] text-neutral-950 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search Compiler Input */}
          <form onSubmit={handleCompileQuery} className="pt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder='Search intent compiler: e.g. "10000 sip for 15 years at 12%" or "how much sip for 1 crore in 20 years"'
                className={`w-full pl-4 pr-28 py-3 rounded-2xl text-xs sm:text-sm font-medium border transition-all outline-none ${inputBg}`}
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 rounded-xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile</span>
              </button>
            </div>
            {queryFeedback && (
              <p className="text-xs font-mono text-[#6948FF] dark:text-[#8B6CFF] mt-1.5 pl-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>{queryFeedback}</span>
              </p>
            )}
          </form>

          {/* Quick Search Cluster Intent Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-mono">
            <span className={`text-[11px] uppercase font-bold tracking-wider mr-1 flex items-center gap-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              <Flame className="w-3.5 h-3.5 text-[#FF5D73]" />
              <span>Clusters:</span>
            </span>
            <button
              onClick={() => applyPreset({ label: '1Cr in 15Y', mode: 'goal', targetCorpus: 10000000, durationYears: 15, assumedReturn: 12 })}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                targetCorpus === 10000000 && mode === 'goal'
                  ? 'bg-[#35E6A0]/15 text-[#00A86B] dark:text-[#35E6A0] border-[#35E6A0]/40 font-bold'
                  : 'bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border-transparent'
              }`}
            >
              🎯 ₹1 Cr in 15 Yrs (Goal)
            </button>
            <button
              onClick={() => applyPreset({ label: '10k 20Y', mode: 'returns', monthlySip: 10000, durationYears: 20, assumedReturn: 12 })}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                monthlySip === 10000 && mode === 'returns'
                  ? 'bg-[#6948FF]/15 text-[#6948FF] dark:text-[#8B6CFF] border-[#6948FF]/40 font-bold'
                  : 'bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border-transparent'
              }`}
            >
              📈 ₹10k/mo @ 12%
            </button>
            <button
              onClick={() => applyPreset({ label: '10% Step-Up', mode: 'stepup', monthlySip: 15000, annualStepUpRate: 10, durationYears: 15, assumedReturn: 12, enableStepUp: true })}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                mode === 'stepup'
                  ? 'bg-[#8B6CFF]/15 text-[#8B6CFF] border-[#8B6CFF]/40 font-bold'
                  : 'bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border-transparent'
              }`}
            >
              🚀 10% Step-Up Habit
            </button>
            <button
              onClick={() => applyPreset({ label: '50L Child', mode: 'goal', targetCorpus: 5000000, durationYears: 12, assumedReturn: 12 })}
              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border border-transparent whitespace-nowrap"
            >
              🎓 ₹50 Lakh Child Goal
            </button>
            <button
              onClick={() => applyPreset({ label: '5Cr FIRE', mode: 'goal', targetCorpus: 50000000, durationYears: 25, assumedReturn: 12 })}
              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border border-transparent whitespace-nowrap"
            >
              🏝️ ₹5 Cr FIRE Target
            </button>
            <button
              onClick={() => applyPreset({ label: 'SIP vs Lump', mode: 'vs_lumpsum', monthlySip: 10000, lumpSumAmount: 1200000, durationYears: 15, assumedReturn: 12 })}
              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:border-black/20 text-neutral-700 dark:text-neutral-300 border border-transparent whitespace-nowrap"
            >
              ⚖️ SIP vs ₹12L Lump Sum
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode Selector Bar (6 Primary Calculation Intents) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'returns', label: '1. SIP Returns', desc: 'Maturity Future Value', icon: TrendingUp },
          { id: 'goal', label: '2. Goal Solver', desc: 'Find Required Monthly SIP', icon: Target },
          { id: 'stepup', label: '3. Step-Up SIP', desc: 'Annual Salary Increment', icon: ArrowUpRight },
          { id: 'inflation', label: '4. SIP + Inflation', desc: "Today's Purchasing Power", icon: Scale },
          { id: 'vs_lumpsum', label: '5. SIP vs Lump Sum', desc: 'Dollar Cost Averaging', icon: DollarSign },
          { id: 'goal_existing', label: '6. Portfolio + Goal', desc: 'Current Assets + Top-up', icon: Layers },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? isLight
                    ? 'bg-[#6948FF]/10 border-[#6948FF] shadow-sm'
                    : 'bg-[#6948FF]/20 border-[#8B6CFF] shadow-lg shadow-[#6948FF]/10'
                  : `${cardBg} hover:border-[#6948FF]/40 opacity-80 hover:opacity-100`
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`p-1.5 rounded-xl ${isSelected ? 'bg-[#6948FF] text-white' : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#35E6A0] animate-pulse" />
                )}
              </div>
              <p className={`text-xs font-bold ${isSelected ? (isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]') : headingColor}`}>
                {item.label}
              </p>
              <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace: Interactive Controls + Hero Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Parameter Inputs (5 Cols) */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-3 border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#6948FF]/10 text-[#6948FF]">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${headingColor}`}>
                {mode === 'goal'
                  ? 'Goal Target Parameters'
                  : mode === 'goal_existing'
                  ? 'Existing Portfolio & Goal Target'
                  : mode === 'vs_lumpsum'
                  ? 'SIP vs Lump Sum Inputs'
                  : 'Investment Parameters'}
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-neutral-500">
              {currency.code}
            </span>
          </div>

          <div className="space-y-5">
            {/* Conditional Input: Goal Target Corpus (When in Goal or Goal Existing Mode) */}
            {(mode === 'goal' || mode === 'goal_existing') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Target Wealth Corpus Goal
                  </label>
                  <span className="font-mono font-bold text-[#00A86B] dark:text-[#35E6A0]">
                    {formatCurrency(targetCorpus, currency, true)} ({formatCurrency(targetCorpus, currency)})
                  </span>
                </div>
                <input
                  type="range"
                  min={500000}
                  max={100000000}
                  step={500000}
                  value={targetCorpus}
                  onChange={(e) => setTargetCorpus(Number(e.target.value))}
                  className="w-full accent-[#35E6A0] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[
                    { label: '₹25L', val: 2500000 },
                    { label: '₹50L', val: 5000000 },
                    { label: '₹1 Cr', val: 10000000 },
                    { label: '₹2 Cr', val: 20000000 },
                    { label: '₹5 Cr', val: 50000000 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => setTargetCorpus(btn.val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                        targetCorpus === btn.val
                          ? 'bg-[#35E6A0]/15 text-[#00A86B] dark:text-[#35E6A0] border-[#35E6A0]/50 font-bold'
                          : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-transparent hover:border-black/20'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 6 Inputs: Current Portfolio & Existing Ongoing SIP */}
            {mode === 'goal_existing' && (
              <div className={`p-4 rounded-2xl border space-y-4 ${cardSubtleBg}`}>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Existing Portfolio Value Today
                    </label>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {formatCurrency(existingPortfolio, currency, true)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20000000}
                    step={100000}
                    value={existingPortfolio}
                    onChange={(e) => setExistingPortfolio(Number(e.target.value))}
                    className="w-full accent-[#6948FF] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Existing Ongoing Monthly SIP
                    </label>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {formatCurrency(existingSip, currency)}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200000}
                    step={2500}
                    value={existingSip}
                    onChange={(e) => setExistingSip(Number(e.target.value))}
                    className="w-full accent-[#6948FF] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Mode 5 Inputs: Lump Sum Amount to compare */}
            {mode === 'vs_lumpsum' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Lump Sum Investment Amount
                  </label>
                  <span className="font-mono font-bold text-[#FFB84D]">
                    {formatCurrency(lumpSumAmount, currency, true)}
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={lumpSumAmount}
                  onChange={(e) => setLumpSumAmount(Number(e.target.value))}
                  className="w-full accent-[#FFB84D] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                />
              </div>
            )}

            {/* Standard Input: Monthly Investment (When not in pure Goal solver mode) */}
            {mode !== 'goal' && mode !== 'goal_existing' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Monthly SIP Amount
                  </label>
                  <span className="font-mono font-bold text-[#6948FF] dark:text-[#8B6CFF]">
                    {formatCurrency(monthlySip, currency)}/month
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={250000}
                  step={500}
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Number(e.target.value))}
                  className="w-full accent-[#6948FF] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[
                    { label: '₹1k', val: 1000 },
                    { label: '₹5k', val: 5000 },
                    { label: '₹10k', val: 10000 },
                    { label: '₹15k', val: 15000 },
                    { label: '₹25k', val: 25000 },
                    { label: '₹50k', val: 50000 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => setMonthlySip(btn.val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                        monthlySip === btn.val
                          ? 'bg-[#6948FF]/15 text-[#6948FF] dark:text-[#8B6CFF] border-[#6948FF]/50 font-bold'
                          : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-transparent hover:border-black/20'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calculator.net Style Contribution Timing & Frequency Checkboxes */}
            <div className={`p-4 rounded-2xl border-2 border-[#6948FF]/30 space-y-3 bg-[#6948FF]/5 dark:bg-[#6948FF]/10`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Contributions made at the:
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6948FF]/10 text-[#6948FF] font-semibold">
                  Calculator.net Style
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  { id: 'beginning_month', label: 'beginning of each month', timing: 'beginning', freq: 'month' },
                  { id: 'end_month', label: 'end of each month', timing: 'end', freq: 'month' },
                  { id: 'beginning_year', label: 'beginning of each year', timing: 'beginning', freq: 'year' },
                  { id: 'end_year', label: 'end of each year', timing: 'end', freq: 'year' },
                ].map((opt) => {
                  const isSelected = contributionTiming === opt.timing && contributionFrequency === opt.freq;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => {
                        setContributionTiming(opt.timing as 'beginning' | 'end');
                        setContributionFrequency(opt.freq as 'month' | 'year');
                      }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'bg-[#6948FF] text-white border-[#6948FF] font-bold shadow-sm'
                          : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-[#6948FF]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setContributionTiming(opt.timing as 'beginning' | 'end');
                          setContributionFrequency(opt.freq as 'month' | 'year');
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-[#6948FF] focus:ring-[#6948FF] accent-[#6948FF] cursor-pointer"
                      />
                      <span className="text-xs">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                {contributionTiming === 'beginning'
                  ? `✓ Annuity Due: Contributions deposited at the beginning of each ${contributionFrequency} earn compounding interest for that full period.`
                  : `✓ Ordinary Annuity: Contributions deposited at the end of each ${contributionFrequency} (standard default).`}
              </p>
            </div>

            {/* Assumed Annual Return */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Assumed Annual Return
                  </label>
                  <span className="block text-[10px] text-neutral-500 font-normal">
                    Modeling assumption (not guaranteed)
                  </span>
                </div>
                <span className="font-mono font-bold text-[#00A86B] dark:text-[#35E6A0] text-sm">
                  {assumedReturn}% p.a.
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={25}
                step={0.5}
                value={assumedReturn}
                onChange={(e) => setAssumedReturn(Number(e.target.value))}
                className="w-full accent-[#35E6A0] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[
                  { label: '8% (Debt/FD+)', val: 8 },
                  { label: '10% (Hybrid/Large)', val: 10 },
                  { label: '12% (Nifty Index)', val: 12 },
                  { label: '14% (Flexi-Cap)', val: 14 },
                  { label: '15% (Mid/Small)', val: 15 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => setAssumedReturn(btn.val)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                      assumedReturn === btn.val
                        ? 'bg-[#35E6A0]/15 text-[#00A86B] dark:text-[#35E6A0] border-[#35E6A0]/50 font-bold'
                        : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-transparent hover:border-black/20'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Duration (Years) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Investment Time Horizon
                </label>
                <span className="font-mono font-bold text-[#8B6CFF] text-sm">
                  {durationYears} Years ({durationYears * 12} Installments)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="w-full accent-[#8B6CFF] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[5, 10, 15, 20, 25, 30].map((yrs) => (
                  <button
                    key={yrs}
                    onClick={() => setDurationYears(yrs)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono border transition-all ${
                      durationYears === yrs
                        ? 'bg-[#8B6CFF]/15 text-[#8B6CFF] border-[#8B6CFF]/50 font-bold'
                        : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-transparent hover:border-black/20'
                    }`}
                  >
                    {yrs} Yrs
                  </button>
                ))}
              </div>
            </div>

            {/* Step-Up / Top-Up Switcher */}
            <div className={`p-4 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-[#8B6CFF]" />
                  <div>
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Annual Step-Up / Top-Up SIP
                    </label>
                    <p className="text-[10px] text-neutral-500">
                      Increase contributions yearly with salary hikes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableStepUp(!enableStepUp)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    enableStepUp ? 'bg-[#8B6CFF]' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      enableStepUp ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {enableStepUp && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">Annual Increase:</span>
                    <span className="font-mono font-bold text-[#8B6CFF]">
                      +{annualStepUpRate}% / year
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={annualStepUpRate}
                    onChange={(e) => setAnnualStepUpRate(Number(e.target.value))}
                    className="w-full accent-[#8B6CFF] h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setAnnualStepUpRate(rate)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          annualStepUpRate === rate
                            ? 'bg-[#8B6CFF]/20 text-[#8B6CFF] border-[#8B6CFF]/50 font-bold'
                            : 'bg-black/5 dark:bg-white/5 text-neutral-500 border-transparent'
                        }`}
                      >
                        +{rate}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-[#6948FF]" />
                  <span>Inflation, Expense Ratio & Tax Engine</span>
                </div>
                {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedSettings && (
                <div className={`mt-3 p-4 rounded-2xl border space-y-4 ${cardSubtleBg}`}>
                  {/* Inflation Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-neutral-700 dark:text-neutral-300">
                        Assumed Inflation Rate
                      </label>
                      <span className="font-mono font-bold text-amber-500">{inflationRate}% p.a.</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={inflationRate}
                      onChange={(e) => setInflationRate(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                    />
                  </div>

                  {/* Mutual Fund Expense Ratio */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-neutral-700 dark:text-neutral-300">
                        Fund Total Expense Ratio (TER)
                      </label>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{expenseRatio}% / yr</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2.5}
                      step={0.05}
                      value={expenseRatio}
                      onChange={(e) => setExpenseRatio(Number(e.target.value))}
                      className="w-full accent-neutral-500 h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 cursor-pointer"
                    />
                  </div>

                  {/* Tax Layer Toggle */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                          Model Capital Gains Tax (LTCG)
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Post-July 23, 2024 Indian Equity LTCG: 12.5% above ₹1.25 Lakh exemption
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeTax(!includeTax)}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          includeTax ? 'bg-[#35E6A0]' : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            includeTax ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Hero Projections & Primary Metrics Dashboard (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Hero Highlight Card */}
          <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#35E6A0]" />
                  <span>
                    {mode === 'goal'
                      ? 'REQUIRED MONTHLY CONTRIBUTION SOLVED'
                      : mode === 'goal_existing'
                      ? 'ADDITIONAL TOP-UP SIP REQUIRED'
                      : 'PROJECTED MATURITY VALUE (NOMINAL)'}
                  </span>
                </span>
                
                <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#00A86B] dark:text-[#35E6A0]">
                    {mode === 'goal'
                      ? `${formatCurrency(simulationResult.requiredMonthlySip, currency)}/mo`
                      : mode === 'goal_existing'
                      ? `${formatCurrency(simulationResult.additionalSipRequired, currency)}/mo`
                      : formatCurrency(simulationResult.futureValueNetFees, currency, true)}
                  </span>
                  {mode !== 'goal' && mode !== 'goal_existing' && (
                    <span className="text-xs font-mono text-neutral-500">
                      ({formatCurrency(simulationResult.futureValueNetFees, currency)})
                    </span>
                  )}
                </div>
              </div>

              {/* Multiplier / Efficiency Pill */}
              <div className="text-right sm:self-center">
                <span className="text-[11px] font-mono text-neutral-500 block">Growth Multiplier</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-[#6948FF] dark:text-[#8B6CFF]">
                  {simulationResult.growthMultiplier}x
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  +{simulationResult.growthPercentage}% modeled gain
                </span>
              </div>
            </div>

            {/* 3-Part Metric Breakdown: Invested vs Wealth Gain vs Inflation Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
              <div className={`p-4 rounded-2xl border ${cardSubtleBg}`}>
                <span className="text-[11px] font-mono uppercase text-neutral-500 block mb-1">
                  Total Capital Invested
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-neutral-800 dark:text-neutral-100 block">
                  {formatCurrency(simulationResult.totalInvested, currency, true)}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  {((simulationResult.totalInvested / Math.max(1, simulationResult.futureValueNetFees)) * 100).toFixed(1)}% of final corpus
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardSubtleBg}`}>
                <span className="text-[11px] font-mono uppercase text-[#00A86B] dark:text-[#35E6A0] block mb-1">
                  Modeled Wealth Gain
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-[#00A86B] dark:text-[#35E6A0] block">
                  +{formatCurrency(simulationResult.modeledGrowth, currency, true)}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  Pure compounding return
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardSubtleBg}`}>
                <span className="text-[11px] font-mono uppercase text-amber-500 block mb-1">
                  Real Value (Today's Money)
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-amber-500 block">
                  {formatCurrency(simulationResult.realFutureValue, currency, true)}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  At {inflationRate}% annual inflation
                </span>
              </div>
            </div>

            {/* Contribution Efficiency Visual Bar */}
            <div className="pt-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6948FF]" />
                  <span>Contributions: {formatCurrency(simulationResult.totalInvested, currency, true)}</span>
                </span>
                <span className="text-[#00A86B] dark:text-[#35E6A0] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35E6A0]" />
                  <span>Compounding Gains: +{formatCurrency(simulationResult.modeledGrowth, currency, true)}</span>
                </span>
              </div>
              <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.min(100, Math.max(5, (simulationResult.totalInvested / Math.max(1, simulationResult.futureValueNetFees)) * 100))}%`,
                  }}
                  className="bg-[#6948FF] h-full"
                />
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (simulationResult.modeledGrowth / Math.max(1, simulationResult.futureValueNetFees)) * 100))}%`,
                  }}
                  className="bg-[#35E6A0] h-full"
                />
              </div>
            </div>

            {/* Transparent Calculation Assumptions Banner */}
            <div className="mt-5 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
              <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                <Info className="w-3.5 h-3.5 text-[#6948FF]" />
                <span className="font-bold">Active Assumptions:</span>
              </div>
              <span>Monthly SIP: {formatCurrency(monthlySip, currency)}</span>
              <span>Return: {assumedReturn}%</span>
              <span>Tenure: {durationYears}Y</span>
              <span>Step-Up: {enableStepUp ? `+${annualStepUpRate}%` : '0%'}</span>
              <span>Inflation: {inflationRate}%</span>
              <span>TER: {expenseRatio}%</span>
              <span>Tax: {includeTax ? '12.5% LTCG' : 'Gross'}</span>
            </div>
          </div>

          {/* Analysis View Tabs */}
          <div className={`p-6 rounded-3xl border space-y-5 ${cardBg}`}>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-black/[0.06] dark:border-white/[0.06] no-scrollbar">
              {[
                { id: 'chart', label: 'Growth Projection', icon: TrendingUp },
                { id: 'goal_ladder', label: 'Goal Ladder & Returns', icon: Target },
                { id: 'delay_cost', label: 'Cost of Delay', icon: Clock },
                { id: 'milestones', label: 'Milestone Timeline', icon: Flame },
                { id: 'cashflow', label: 'Amortization Table', icon: Layers },
                { id: 'tax_fees', label: 'Tax & Fee Drag', icon: Receipt },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeAnalysisTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalysisTab(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#6948FF] text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Growth Chart */}
            {activeAnalysisTab === 'chart' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>Year-by-Year Cumulative Corpus ($ Nominal vs Real)</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#6948FF]">
                      <span className="w-2 h-2 rounded-full bg-[#6948FF]" /> Principal
                    </span>
                    <span className="flex items-center gap-1 text-[#35E6A0]">
                      <span className="w-2 h-2 rounded-full bg-[#35E6A0]" /> Nominal Value
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Real Purchasing Power
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={simulationResult.timeline}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#35E6A0" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#35E6A0" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6948FF" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6948FF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#1f293d'} />
                      <XAxis dataKey="year" tickFormatter={(yr) => `Yr ${yr}`} stroke="#6b7280" textAnchor="middle" />
                      <YAxis tickFormatter={(v) => formatCurrency(v, currency, true)} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#0e131f',
                          borderColor: isLight ? '#e5e7eb' : '#2d3748',
                          borderRadius: '16px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="closingBalance"
                        name="Nominal Value"
                        stroke="#35E6A0"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorNominal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalInvestedToDate"
                        name="Invested Principal"
                        stroke="#6948FF"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrincipal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="realPurchasingPower"
                        name="Real Purchasing Power"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Return Scenario Bands Callout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {simulationResult.scenarioBands.map((band) => (
                    <div key={band.label} className={`p-3 rounded-xl border ${cardSubtleBg} text-center`}>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">{band.label} ({band.rate}%)</span>
                      <span className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-200 block mt-0.5">
                        {formatCurrency(band.futureValue, currency, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Goal Ladder & Sensitivity Matrix */}
            {activeAnalysisTab === 'goal_ladder' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${headingColor}`}>
                      Time Horizon Goal Ladder (Target: {formatCurrency(targetCorpus, currency, true)})
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-500">At {assumedReturn}% Assumed Return</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black/5 dark:bg-white/5 text-neutral-500">
                        <tr>
                          <th className="p-2.5 rounded-l-lg">Horizon</th>
                          <th className="p-2.5">Required Monthly SIP</th>
                          <th className="p-2.5">Total Invested</th>
                          <th className="p-2.5">Modeled Growth</th>
                          <th className="p-2.5 rounded-r-lg">Multiplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {simulationResult.goalLadderTime.map((row) => (
                          <tr
                            key={row.parameterLabel}
                            className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
                              durationYears === row.numericValue ? 'bg-[#35E6A0]/10 font-bold' : ''
                            }`}
                          >
                            <td className="p-2.5 text-neutral-800 dark:text-neutral-200">{row.parameterLabel}</td>
                            <td className="p-2.5 text-[#00A86B] dark:text-[#35E6A0] font-bold">
                              {formatCurrency(row.requiredMonthly, currency)}/mo
                            </td>
                            <td className="p-2.5 text-neutral-600 dark:text-neutral-400">
                              {formatCurrency(row.totalInvested, currency, true)}
                            </td>
                            <td className="p-2.5 text-neutral-600 dark:text-neutral-400">
                              +{formatCurrency(row.totalReturns, currency, true)}
                            </td>
                            <td className="p-2.5 text-[#6948FF] dark:text-[#8B6CFF]">{row.wealthMultiplier}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${headingColor}`}>
                      Return Sensitivity Matrix (Horizon: {durationYears} Years)
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-500">Target: {formatCurrency(targetCorpus, currency, true)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black/5 dark:bg-white/5 text-neutral-500">
                        <tr>
                          <th className="p-2.5 rounded-l-lg">Return Rate</th>
                          <th className="p-2.5">Required Monthly SIP</th>
                          <th className="p-2.5">Total Outflow</th>
                          <th className="p-2.5 rounded-r-lg">Growth Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {simulationResult.goalLadderReturns.map((row) => (
                          <tr
                            key={row.parameterLabel}
                            className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
                              assumedReturn === row.numericValue ? 'bg-[#6948FF]/10 font-bold' : ''
                            }`}
                          >
                            <td className="p-2.5 text-neutral-800 dark:text-neutral-200">{row.parameterLabel}</td>
                            <td className="p-2.5 text-[#00A86B] dark:text-[#35E6A0] font-bold">
                              {formatCurrency(row.requiredMonthly, currency)}/mo
                            </td>
                            <td className="p-2.5 text-neutral-600 dark:text-neutral-400">
                              {formatCurrency(row.totalInvested, currency, true)}
                            </td>
                            <td className="p-2.5 text-[#6948FF] dark:text-[#8B6CFF]">
                              +{formatCurrency(row.totalReturns, currency, true)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Cost of Delay Engine ("What if I start later?") */}
            {activeAnalysisTab === 'delay_cost' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FF5D73]/10 border border-[#FF5D73]/20 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-[#FF5D73] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#FF5D73] block mb-0.5">The Exponential Mathematical Penalty of Delay</span>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      Postponing an investment forces you to save substantially more out-of-pocket capital because you sacrifice the most compounding years at the end of the investment horizon.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {simulationResult.costOfDelay.map((row) => (
                    <div
                      key={row.label}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        row.delayYears === 0
                          ? 'bg-[#35E6A0]/10 border-[#35E6A0]/30'
                          : cardSubtleBg
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                            {row.label}
                          </span>
                          {row.delayYears === 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#35E6A0] text-neutral-950">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          Total out-of-pocket investment: {formatCurrency(row.totalInvested, currency, true)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-mono font-bold text-[#00A86B] dark:text-[#35E6A0] block">
                          {formatCurrency(row.requiredMonthly, currency)}/month
                        </span>
                        {row.delayYears > 0 ? (
                          <span className="text-[10px] font-mono text-[#FF5D73] block font-semibold">
                            +{row.extraSipPercentage.toFixed(0)}% more/mo (+{formatCurrency(row.extraSipRequiredMonthly, currency)}/mo)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 block">Baseline Plan</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Milestone Detection Timeline */}
            {activeAnalysisTab === 'milestones' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 font-mono">
                  Autonomous milestone detection tracking when your portfolio crosses key wealth thresholds based on your active parameters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simulationResult.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        ms.isReached
                          ? 'bg-[#35E6A0]/10 border-[#35E6A0]/30'
                          : `${cardSubtleBg} opacity-50`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-extrabold font-mono text-neutral-900 dark:text-neutral-100">
                          {ms.label} ({formatCurrency(ms.targetValue, currency, true)})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          ms.isReached ? 'bg-[#35E6A0] text-neutral-950' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                        }`}>
                          {ms.isReached ? 'ACHIEVED' : 'UNREACHED'}
                        </span>
                      </div>

                      <div className="text-xs font-mono space-y-1 text-neutral-600 dark:text-neutral-400">
                        <div className="flex justify-between">
                          <span>Timeline Arrival:</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{ms.formattedTime}</span>
                        </div>
                        {ms.isReached && (
                          <>
                            <div className="flex justify-between text-[11px]">
                              <span>Invested by then:</span>
                              <span>{formatCurrency(ms.investedAtMilestone, currency, true)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-[#00A86B] dark:text-[#35E6A0]">
                              <span>Returns earned:</span>
                              <span>+{formatCurrency(ms.returnsAtMilestone, currency, true)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Year-by-Year Cash Flow Amortization Table */}
            {activeAnalysisTab === 'cashflow' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500">
                    Showing full {durationYears}-year cash flow trajectory
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="text-xs font-mono text-[#6948FF] dark:text-[#8B6CFF] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-2xl border-black/10 dark:border-white/10">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/5 dark:bg-white/5 text-neutral-500 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="p-2.5">Yr</th>
                        <th className="p-2.5">Monthly SIP</th>
                        <th className="p-2.5">Annual Deposits</th>
                        <th className="p-2.5">Yearly Gains</th>
                        <th className="p-2.5">Closing Balance</th>
                        <th className="p-2.5">Real Purchasing Power</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {simulationResult.timeline.map((row) => (
                        <tr key={row.year} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="p-2.5 font-bold text-neutral-700 dark:text-neutral-300">Yr {row.year}</td>
                          <td className="p-2.5 text-neutral-600 dark:text-neutral-400">{formatCurrency(row.monthlyContribution, currency)}</td>
                          <td className="p-2.5 text-neutral-600 dark:text-neutral-400">{formatCurrency(row.annualDeposits, currency, true)}</td>
                          <td className="p-2.5 text-[#00A86B] dark:text-[#35E6A0]">+{formatCurrency(row.returnsEarned, currency, true)}</td>
                          <td className="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(row.closingBalance, currency, true)}</td>
                          <td className="p-2.5 text-amber-500">{formatCurrency(row.realPurchasingPower, currency, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: Tax & Fee Drag Breakdown */}
            {activeAnalysisTab === 'tax_fees' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fee Impact Box */}
                  <div className={`p-4 rounded-2xl border ${cardSubtleBg} space-y-2`}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      <Receipt className="w-4 h-4 text-[#6948FF]" />
                      <span>Expense Ratio (TER) Impact</span>
                    </div>
                    <div className="text-xs font-mono space-y-1.5 text-neutral-600 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Nominal Gross Value (0% TER):</span>
                        <span className="font-bold">{formatCurrency(simulationResult.futureValueGross, currency, true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Value with {expenseRatio}% TER:</span>
                        <span className="font-bold text-[#00A86B] dark:text-[#35E6A0]">
                          {formatCurrency(simulationResult.futureValueNetFees, currency, true)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#FF5D73] font-bold border-t pt-1 border-black/5 dark:border-white/5">
                        <span>Compounding Fee Drag:</span>
                        <span>-{formatCurrency(simulationResult.totalFeesPaid, currency, true)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Impact Box */}
                  <div className={`p-4 rounded-2xl border ${cardSubtleBg} space-y-2`}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      <Scale className="w-4 h-4 text-amber-500" />
                      <span>Capital Gains Tax Layer (Section 112A)</span>
                    </div>
                    <div className="text-xs font-mono space-y-1.5 text-neutral-600 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Total Capital Gains:</span>
                        <span>{formatCurrency(simulationResult.modeledGrowth, currency, true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Exemption Threshold:</span>
                        <span>{formatCurrency(taxExemptionLimit, currency, true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated LTCG Tax (12.5%):</span>
                        <span className="text-[#FF5D73] font-bold">
                          {includeTax ? `-${formatCurrency(simulationResult.estimatedCapitalGainsTax, currency, true)}` : 'Not Applied'}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-[#00A86B] dark:text-[#35E6A0] border-t pt-1 border-black/5 dark:border-white/5">
                        <span>Net Post-Tax Corpus:</span>
                        <span>{formatCurrency(simulationResult.postTaxCorpus, currency, true)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 italic">
                  Note: Tax computations model terminal redemption under post-July 23, 2024 Indian Equity LTCG rates (12.5% above ₹1.25 Lakh exemption per financial year).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
