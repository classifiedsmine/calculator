import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Line,
  ReferenceLine,
} from 'recharts';
import {
  Sparkles,
  Activity,
  Sliders,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  Zap,
  Target,
  ArrowRight,
  Layers,
  Percent,
  DollarSign,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Share2,
  Download,
  Info,
  ChevronRight
} from 'lucide-react';
import { CurrencyConfig } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import {
  runInvestmentMonteCarlo,
  runRetirementMonteCarlo,
  runBusinessRiskMonteCarlo,
  computeInvestmentTornadoSensitivity,
  solveRequiredContributionForProbability,
  DistributionType,
  SimulatorMode,
  SimulationResult,
  InvestmentSimulationInputs,
} from '../../lib/monteCarloEngine';

interface MonteCarloOSProps {
  currency: CurrencyConfig;
  theme?: 'dark' | 'light';
  initialMode?: SimulatorMode;
  onApplyInputs?: (inputs: Record<string, any>) => void;
}

export const MonteCarloOS: React.FC<MonteCarloOSProps> = ({
  currency,
  theme = 'light',
  initialMode = 'investment',
  onApplyInputs,
}) => {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-black/10 text-[#11131A] shadow-xs' : 'bg-[#0C101A] border-white/[0.08] text-[#F7F8FC] shadow-xl';
  const cardSubtleBg = isLight ? 'bg-[#F8FAFC] border-black/5' : 'bg-[#111725] border-white/[0.05]';
  const headingColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textBody = isLight ? 'text-[#475467]' : 'text-[#9AA3B5]';
  const textMuted = isLight ? 'text-[#667085]' : 'text-[#5F6878]';

  // Active Mode State
  const [mode, setMode] = useState<SimulatorMode>(initialMode);
  const [trials, setTrials] = useState<number>(25000);
  const [randomSeed, setRandomSeed] = useState<number>(482917);
  const [distribution, setDistribution] = useState<DistributionType>('normal');
  const [enableCorrelation, setEnableCorrelation] = useState<boolean>(false);
  const [correlationCoeff, setCorrelationCoeff] = useState<number>(0.65);

  // Mode 1 & 4 (Investment & Goal) State
  const [startingPortfolio, setStartingPortfolio] = useState<number>(50000);
  const [annualContribution, setAnnualContribution] = useState<number>(12000); // $1k/mo
  const [years, setYears] = useState<number>(20);
  const [expectedReturn, setExpectedReturn] = useState<number>(8.0);
  const [volatility, setVolatility] = useState<number>(15.0);
  const [inflation, setInflation] = useState<number>(2.5);
  const [fees, setFees] = useState<number>(0.25);
  const [targetAmount, setTargetAmount] = useState<number>(1000000);

  // Mode 2 (Retirement) State
  const [retCurrentPortfolio, setRetCurrentPortfolio] = useState<number>(350000);
  const [currentAge, setCurrentAge] = useState<number>(45);
  const [retirementAge, setRetirementAge] = useState<number>(65);
  const [retAnnualContrib, setRetAnnualContrib] = useState<number>(18000);
  const [retAnnualSpending, setRetAnnualSpending] = useState<number>(60000);
  const [retirementDuration, setRetirementDuration] = useState<number>(30);

  // Mode 5 (Business Risk) State
  const [expectedCustomers, setExpectedCustomers] = useState<number>(5000);
  const [customerVolatility, setCustomerVolatility] = useState<number>(1200);
  const [pricePerUnit, setPricePerUnit] = useState<number>(120);
  const [costPerUnit, setCostPerUnit] = useState<number>(45);
  const [fixedCosts, setFixedCosts] = useState<number>(200000);

  // Reverse Monte Carlo Target Confidence
  const [desiredConfidence, setDesiredConfidence] = useState<number>(85);

  // Active Tab View within OS
  const [activeTab, setActiveTab] = useState<'distribution' | 'trajectory' | 'ladder' | 'sensitivity' | 'scenarios' | 'convergence'>('distribution');

  // Reroll Seed
  const handleRerollSeed = () => {
    setRandomSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  // Run Simulation based on Mode
  const simulationResult: SimulationResult = useMemo(() => {
    if (mode === 'retirement') {
      return runRetirementMonteCarlo({
        currentPortfolio: retCurrentPortfolio,
        currentAge,
        retirementAge,
        annualContribution: retAnnualContrib,
        annualSpending: retAnnualSpending,
        expectedReturn,
        volatility,
        inflation,
        retirementYears: retirementDuration,
        trials,
        seed: randomSeed,
      });
    }

    if (mode === 'business') {
      return runBusinessRiskMonteCarlo({
        expectedCustomers,
        customerVolatility,
        pricePerUnit,
        costPerUnit,
        fixedCosts,
        correlationPriceVolume: enableCorrelation ? correlationCoeff : 0,
        trials,
        seed: randomSeed,
      });
    }

    // Default: Investment & Goal
    return runInvestmentMonteCarlo({
      startingPortfolio,
      annualContribution,
      years,
      expectedReturn,
      volatility,
      inflation,
      fees,
      targetAmount,
      distribution,
      trials,
      seed: randomSeed,
    });
  }, [
    mode,
    trials,
    randomSeed,
    distribution,
    enableCorrelation,
    correlationCoeff,
    startingPortfolio,
    annualContribution,
    years,
    expectedReturn,
    volatility,
    inflation,
    fees,
    targetAmount,
    retCurrentPortfolio,
    currentAge,
    retirementAge,
    retAnnualContrib,
    retAnnualSpending,
    retirementDuration,
    expectedCustomers,
    customerVolatility,
    pricePerUnit,
    costPerUnit,
    fixedCosts,
  ]);

  // Sensitivity Analysis
  const sensitivityData = useMemo(() => {
    return computeInvestmentTornadoSensitivity({
      startingPortfolio,
      annualContribution,
      years,
      expectedReturn,
      volatility,
      inflation,
      fees,
      targetAmount,
      distribution,
    });
  }, [
    startingPortfolio,
    annualContribution,
    years,
    expectedReturn,
    volatility,
    inflation,
    fees,
    targetAmount,
    distribution,
  ]);

  // Reverse Monte Carlo Result
  const reverseSolvedSavings = useMemo(() => {
    return solveRequiredContributionForProbability(
      {
        startingPortfolio,
        annualContribution,
        years,
        expectedReturn,
        volatility,
        inflation,
        fees,
        targetAmount,
        distribution,
      },
      desiredConfidence
    );
  }, [
    startingPortfolio,
    annualContribution,
    years,
    expectedReturn,
    volatility,
    inflation,
    fees,
    targetAmount,
    distribution,
    desiredConfidence,
  ]);

  // 3 Scenarios Comparison
  const scenariosData = useMemo(() => {
    const baseSim = simulationResult;
    const conservativeSim = runInvestmentMonteCarlo({
      startingPortfolio,
      annualContribution,
      years,
      expectedReturn: Math.max(2, expectedReturn - 2.0),
      volatility: volatility + 3.0,
      inflation: inflation + 0.5,
      fees,
      targetAmount,
      distribution,
      trials: 10000,
      seed: randomSeed,
    });
    const aggressiveSim = runInvestmentMonteCarlo({
      startingPortfolio,
      annualContribution: annualContribution * 1.25,
      years,
      expectedReturn: expectedReturn + 1.5,
      volatility: Math.max(5, volatility - 2.0),
      inflation,
      fees,
      targetAmount,
      distribution,
      trials: 10000,
      seed: randomSeed,
    });

    return [
      { name: 'Baseline Model', prob: baseSim.probabilitySuccess, median: baseSim.median, p10: baseSim.p10, p90: baseSim.p90, color: '#6948FF' },
      { name: 'Stress Test (Low Return / High Risk)', prob: conservativeSim.probabilitySuccess, median: conservativeSim.median, p10: conservativeSim.p10, p90: conservativeSim.p90, color: '#FF5D73' },
      { name: 'Upside (+25% Savings / Growth)', prob: aggressiveSim.probabilitySuccess, median: aggressiveSim.median, p10: aggressiveSim.p10, p90: aggressiveSim.p90, color: '#00875A' },
    ];
  }, [simulationResult, startingPortfolio, annualContribution, years, expectedReturn, volatility, inflation, fees, targetAmount, distribution, randomSeed]);

  return (
    <div className="space-y-8 my-10" id="monte-carlo-simulator-root">
      
      {/* 1. Header Banner & Mode Selector */}
      <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#6948FF]/10 text-[#6948FF]">
                <Activity className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#6948FF] dark:text-[#8B6CFF]">
                PROBABILISTIC DECISION ENGINE
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${headingColor}`}>
              Monte Carlo Probabilistic Simulator
            </h2>
            <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${textBody}`}>
              Run thousands of stochastic iterations to explore how random variables and market uncertainty shape the range of possible outcomes.
            </p>
          </div>

          {/* Quick Simulation Batch & Seed Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${cardSubtleBg}`}>
              <span className={textMuted}>Trials:</span>
              <select
                value={trials}
                onChange={(e) => setTrials(Number(e.target.value))}
                className="bg-transparent font-bold cursor-pointer focus:outline-none"
              >
                <option value={5000} className="text-black">5,000</option>
                <option value={10000} className="text-black">10,000</option>
                <option value={25000} className="text-black">25,000</option>
                <option value={50000} className="text-black">50,000</option>
                <option value={100000} className="text-black">100,000</option>
              </select>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${cardSubtleBg}`}>
              <span className={textMuted}>Seed:</span>
              <span className="font-bold">{randomSeed}</span>
              <button
                onClick={handleRerollSeed}
                title="Reroll Pseudo-Random Seed"
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#6948FF] dark:text-[#8B6CFF]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Simulation Modes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          {[
            { id: 'investment', label: 'Investment Portfolio', icon: TrendingUp },
            { id: 'retirement', label: 'Retirement Longevity', icon: ShieldAlert },
            { id: 'goal', label: 'Goal Target ($1M)', icon: Target },
            { id: 'business', label: 'Business / Project Risk', icon: Briefcase },
            { id: 'generic', label: 'Generic Probability', icon: Sparkles },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as SimulatorMode)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#6948FF] text-white border-[#6948FF] shadow-md shadow-[#6948FF]/20 font-semibold'
                    : isLight
                    ? 'bg-[#F8FAFC] hover:bg-black/5 text-[#475467] border-black/5'
                    : 'bg-[#111725] hover:bg-white/5 text-[#9AA3B5] border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6948FF] dark:text-[#8B6CFF]'}`} />
                <span className="text-xs font-medium leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Input Controls & Distribution Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Parameter Sliders & Inputs */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border space-y-5 ${cardBg}`}>
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${headingColor}`}>
              Model Parameters
            </h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${isLight ? 'bg-[#6948FF]/10 text-[#6948FF]' : 'bg-[#8B6CFF]/20 text-[#8B6CFF]'}`}>
              {trials.toLocaleString()} Iterations
            </span>
          </div>

          {/* Investment & Goal Mode Inputs */}
          {(mode === 'investment' || mode === 'goal' || mode === 'generic') && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Starting Portfolio</span>
                  <span className={`font-bold ${headingColor}`}>{formatCurrency(startingPortfolio, currency, true)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={startingPortfolio}
                  onChange={(e) => setStartingPortfolio(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Annual Contribution</span>
                  <span className={`font-bold ${headingColor}`}>{formatCurrency(annualContribution, currency, true)}/yr</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60000}
                  step={1000}
                  value={annualContribution}
                  onChange={(e) => setAnnualContribution(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Time Horizon (Years)</span>
                  <span className={`font-bold ${headingColor}`}>{years} years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Expected Return</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                      }`}
                    />
                    <span className="absolute right-2.5 top-1.5 text-neutral-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Volatility (Risk)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={volatility}
                      onChange={(e) => setVolatility(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                      }`}
                    />
                    <span className="absolute right-2.5 top-1.5 text-neutral-400">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Inflation Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      value={inflation}
                      onChange={(e) => setInflation(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                      }`}
                    />
                    <span className="absolute right-2.5 top-1.5 text-neutral-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Expense Fee</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={fees}
                      onChange={(e) => setFees(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                      }`}
                    />
                    <span className="absolute right-2.5 top-1.5 text-neutral-400">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block mb-1 ${textMuted}`}>Target Wealth Milestone</label>
                <input
                  type="number"
                  step={50000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold font-mono ${
                    isLight ? 'bg-white border-black/15 text-[#00875A]' : 'bg-[#111725] border-white/15 text-[#35E6A0]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Retirement Mode Inputs */}
          {mode === 'retirement' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Nest Egg at Retirement</span>
                  <span className={`font-bold ${headingColor}`}>{formatCurrency(retCurrentPortfolio, currency, true)}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={2500000}
                  step={25000}
                  value={retCurrentPortfolio}
                  onChange={(e) => setRetCurrentPortfolio(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Current Age</label>
                  <input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Retirement Age</label>
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Annual Spending in Retirement</span>
                  <span className={`font-bold text-[#FF5D73]`}>{formatCurrency(retAnnualSpending, currency, true)}/yr</span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={150000}
                  step={5000}
                  value={retAnnualSpending}
                  onChange={(e) => setRetAnnualSpending(Number(e.target.value))}
                  className="w-full accent-[#FF5D73]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Retirement Horizon</span>
                  <span className={`font-bold ${headingColor}`}>{retirementDuration} Years</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={45}
                  step={1}
                  value={retirementDuration}
                  onChange={(e) => setRetirementDuration(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>
            </div>
          )}

          {/* Business Risk Mode Inputs */}
          {mode === 'business' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={textMuted}>Expected Customers (Mean)</span>
                  <span className={`font-bold ${headingColor}`}>{expectedCustomers.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={expectedCustomers}
                  onChange={(e) => setExpectedCustomers(Number(e.target.value))}
                  className="w-full accent-[#6948FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Price per Unit</label>
                  <input
                    type="number"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${textMuted}`}>Cost per Unit</label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 ${textMuted}`}>Fixed Overhead Costs</label>
                <input
                  type="number"
                  step={10000}
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'}`}
                />
              </div>
            </div>
          )}

          {/* Probability Distribution Selector */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
            <span className={`text-[11px] font-bold uppercase font-mono block ${headingColor}`}>
              Probability Distribution
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {(['normal', 'lognormal', 'uniform', 'triangular'] as DistributionType[]).map((dist) => (
                <button
                  key={dist}
                  onClick={() => setDistribution(dist)}
                  className={`py-1.5 px-2 rounded-lg border text-center capitalize transition-colors cursor-pointer ${
                    distribution === dist
                      ? 'bg-[#6948FF]/10 text-[#6948FF] border-[#6948FF] font-bold'
                      : isLight
                      ? 'bg-[#F8FAFC] border-black/5 text-[#667085]'
                      : 'bg-[#111725] border-white/5 text-[#9AA3B5]'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>

          {/* Correlation Control Toggle */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold ${headingColor}`}>Variable Correlation</span>
              <button
                onClick={() => setEnableCorrelation(!enableCorrelation)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                  enableCorrelation ? 'bg-[#00875A] text-white' : 'bg-black/10 dark:bg-white/10 text-neutral-500'
                }`}
              >
                {enableCorrelation ? 'Correlated (ρ=0.65)' : 'Independent'}
              </button>
            </div>
            <p className={`text-[11px] leading-relaxed ${textMuted}`}>
              {enableCorrelation
                ? 'Variables move in tandem according to the specified bivariate correlation coefficient.'
                : 'Variables are sampled independently across each stochastic scenario.'}
            </p>
          </div>

        </div>

        {/* Right Column: Hero Probability Gauge & Visual Analysis Tabs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hero Result Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            simulationResult.probabilitySuccess >= 70
              ? isLight ? 'bg-[#00875A]/5 border-[#00875A]/25' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'
              : simulationResult.probabilitySuccess >= 45
              ? isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/25' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20'
              : isLight ? 'bg-[#FF5D73]/5 border-[#FF5D73]/25' : 'bg-[#FF5D73]/10 border-[#FF5D73]/20'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              
              {/* Big Probability Number */}
              <div className="space-y-1 sm:border-r border-black/10 dark:border-white/10 sm:pr-4">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'
                }`}>
                  Probability of Success
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${headingColor}`}>
                    {simulationResult.probabilitySuccess}%
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  95% CI: [{simulationResult.ci95Low}%, {simulationResult.ci95High}%]
                </div>
              </div>

              {/* Median & Percentiles */}
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Median Simulated Outcome (P50)</span>
                  <span className={`text-lg font-bold ${headingColor}`}>
                    {formatCurrency(simulationResult.median, currency, true)}
                  </span>
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div>
                    <span className="text-neutral-500">10th %ile (Downside):</span>
                    <span className="font-bold block text-[#FF5D73]">
                      {formatCurrency(simulationResult.p10, currency, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">90th %ile (Upside):</span>
                    <span className="font-bold block text-[#00875A] dark:text-[#35E6A0]">
                      {formatCurrency(simulationResult.p90, currency, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Natural Language Explanation */}
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${cardBg}`}>
                <div className="flex items-center gap-1.5 font-bold mb-1 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#6948FF]" />
                  <span>Interpretation</span>
                </div>
                <p className={textBody}>
                  In <strong>{simulationResult.trials.toLocaleString()}</strong> scenarios, approx <strong>{simulationResult.probabilitySuccess}%</strong> met or exceeded your target. Half of outcomes fell above <strong>{formatCurrency(simulationResult.median, currency, true)}</strong>.
                </p>
              </div>

            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-black/5 dark:border-white/5 text-xs font-mono">
            {[
              { id: 'distribution', label: 'Outcome Distribution' },
              { id: 'trajectory', label: 'Percentile Cones' },
              { id: 'ladder', label: 'Probability Ladder' },
              { id: 'sensitivity', label: 'Tornado Sensitivity' },
              { id: 'scenarios', label: '3-Way Comparison' },
              { id: 'convergence', label: 'Convergence Test' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? isLight
                      ? 'bg-black text-white font-bold'
                      : 'bg-white text-black font-bold'
                    : isLight
                    ? 'text-[#667085] hover:bg-black/5'
                    : 'text-[#9AA3B5] hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Distribution Histogram */}
          {activeTab === 'distribution' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                    Probability Density Histogram ({simulationResult.trials.toLocaleString()} Runs)
                  </h4>
                  <p className={`text-xs ${textMuted}`}>
                    Distribution of ending wealth. The dashed line marks your target threshold.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulationResult.histogram} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-2.5 rounded-xl border text-xs font-mono shadow-lg ${cardBg}`}>
                              <div className="font-bold">{data.label}</div>
                              <div className="text-[#6948FF] font-semibold">{data.percentage.toFixed(1)}% of simulations</div>
                              <div className="text-neutral-500">{data.count.toLocaleString()} trials</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percentage" fill="#6948FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-black/5 dark:border-white/5">
                <div className={`p-2 rounded-xl ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">10th %ile (Worst 10%)</span>
                  <span className="font-bold text-[#FF5D73]">{formatCurrency(simulationResult.p10, currency, true)}</span>
                </div>
                <div className={`p-2 rounded-xl ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">50th %ile (Median)</span>
                  <span className="font-bold text-[#6948FF]">{formatCurrency(simulationResult.median, currency, true)}</span>
                </div>
                <div className={`p-2 rounded-xl ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">90th %ile (Top 10%)</span>
                  <span className="font-bold text-[#00875A] dark:text-[#35E6A0]">{formatCurrency(simulationResult.p90, currency, true)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Time Trajectory Percentile Cones */}
          {activeTab === 'trajectory' && simulationResult.timeTrajectories && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Percentile Growth Trajectory vs Deterministic Baseline
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Shaded envelope displays the 10th to 90th percentile simulation bounds over time.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationResult.timeTrajectories} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} unit=" yr" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className={`p-3 rounded-xl border text-xs font-mono shadow-xl space-y-1 ${cardBg}`}>
                              <div className="font-bold">Year {d.year}</div>
                              <div className="text-[#00875A]">90th %ile: {formatCurrency(d.p90, currency, true)}</div>
                              <div className="text-[#6948FF] font-bold">50th %ile (Median): {formatCurrency(d.p50, currency, true)}</div>
                              <div className="text-[#FF5D73]">10th %ile: {formatCurrency(d.p10, currency, true)}</div>
                              <div className="text-neutral-500 border-t border-black/10 pt-1">Deterministic: {formatCurrency(d.deterministic, currency, true)}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="p90" stroke="#6948FF" fill="#6948FF" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="p10" stroke="#FF5D73" fill="#ffffff" fillOpacity={0} />
                    <Line type="monotone" dataKey="p50" stroke="#6948FF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="deterministic" stroke="#667085" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-neutral-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#6948FF]" /> P50 (Median)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#6948FF]/20" /> P10–P90 Range</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-neutral-400" /> Deterministic</span>
              </div>
            </div>
          )}

          {/* TAB 3: Probability Ladder */}
          {activeTab === 'ladder' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Target Probability Curve Ladder
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  See the probability of hitting various target milestones across the spectrum.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-neutral-500">
                      <th className="pb-2">Milestone Target</th>
                      <th className="pb-2">Target Amount</th>
                      <th className="pb-2">Probability of Reaching</th>
                      <th className="pb-2 text-right">Confidence Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {simulationResult.probabilityLadder.map((step, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 font-bold text-[#6948FF]">{step.label}</td>
                        <td className="py-2.5">{formatCurrency(step.target, currency, true)}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  step.probability >= 70 ? 'bg-[#00875A]' : step.probability >= 40 ? 'bg-[#6948FF]' : 'bg-[#FF5D73]'
                                }`}
                                style={{ width: `${step.probability}%` }}
                              />
                            </div>
                            <span className="font-bold">{step.probability}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-medium text-neutral-500">
                          {step.probability >= 80 ? 'High Confidence' : step.probability >= 50 ? 'Moderate' : 'Low / High Risk'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Tornado Sensitivity Ranking */}
          {activeTab === 'sensitivity' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Tornado Sensitivity Ranking (What Moves the Needle Most?)
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Variables ranked by their partial derivative impact on the probability of reaching your target.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {sensitivityData.map((factor, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{factor.name}</span>
                      <span className="text-neutral-500 text-[11px]">
                        Impact Range: {factor.negativeProbability}% ↔ {factor.positiveProbability}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-[#6948FF] to-[#00875A] rounded-full transition-all"
                        style={{ width: `${factor.relativeRank}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: 3-Way Scenario Comparison */}
          {activeTab === 'scenarios' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  3-Way Parallel Scenario Stress Testing
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Compare baseline expectations against conservative risk and high-savings scenarios.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {scenariosData.map((sc, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
                    <div className="font-bold text-xs font-mono" style={{ color: sc.color }}>
                      {sc.name}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase font-mono block">Probability of Target</span>
                      <span className="text-2xl font-bold font-mono" style={{ color: sc.color }}>
                        {sc.prob}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono space-y-1 text-neutral-600 dark:text-neutral-400">
                      <div>Median: {formatCurrency(sc.median, currency, true)}</div>
                      <div>P10 (Worst): {formatCurrency(sc.p10, currency, true)}</div>
                      <div>P90 (Best): {formatCurrency(sc.p90, currency, true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Convergence Testing */}
          {activeTab === 'convergence' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Monte Carlo Convergence & Sampling Error Analysis
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Verifies that probability estimates stabilize as trial batches increase from 1,000 to {trials.toLocaleString()}.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-neutral-500">
                      <th className="pb-2">Trial Batch Size (N)</th>
                      <th className="pb-2">Estimated Probability</th>
                      <th className="pb-2">Sampling Margin of Error (SE)</th>
                      <th className="pb-2 text-right">Convergence Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {simulationResult.convergenceCurve.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold">{c.trials.toLocaleString()} Trials</td>
                        <td className="py-2.5 font-semibold text-[#6948FF]">{c.probability}%</td>
                        <td className="py-2.5 text-neutral-500">±{c.errorMargin}%</td>
                        <td className="py-2.5 text-right font-medium text-[#00875A] dark:text-[#35E6A0]">
                          {c.trials >= 25000 ? 'Fully Stabilized' : 'Sampling Variance'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reverse Monte Carlo Solver Callout */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20'
          }`}>
            <div>
              <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-[#6948FF] dark:text-[#8B6CFF] mb-1">
                <Target className="w-4 h-4" />
                <span>Reverse Probabilistic Goal Solver</span>
              </div>
              <p className={`text-xs ${textBody}`}>
                To reach <strong>{formatCurrency(targetAmount, currency, true)}</strong> with <strong>{desiredConfidence}% confidence</strong>, you need to save:
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xl font-extrabold font-mono text-[#6948FF] dark:text-[#8B6CFF]`}>
                {formatCurrency(reverseSolvedSavings, currency, true)}/yr
              </span>
              <span className="block text-[10px] text-neutral-500 font-mono">
                ({formatCurrency(Math.round(reverseSolvedSavings / 12), currency, true)}/month)
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
