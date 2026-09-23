import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  HelpCircle, 
  Calculator, 
  Layers, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Target, 
  Clock, 
  Sparkles,
  BarChart3,
  Percent,
  DollarSign,
  Activity,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { CalculatorDefinition, CurrencyConfig } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { calculateRequiredInvestmentForGoal, calculateTimeToReachGoal, calculateCompoundInterest } from '../../lib/safeMath';

interface CalculatorSEOContentProps {
  calculator: CalculatorDefinition;
  currency: CurrencyConfig;
  theme?: 'dark' | 'light';
  onLoadInputs?: (inputs: Record<string, any>) => void;
}

export const CalculatorSEOContent: React.FC<CalculatorSEOContentProps> = ({
  calculator,
  currency,
  theme = 'light',
  onLoadInputs,
}) => {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-black/10 text-[#11131A] shadow-xs' : 'bg-[#0C101A] border-white/[0.08] text-[#F7F8FC] shadow-xl';
  const cardSubtleBg = isLight ? 'bg-[#F8FAFC] border-black/5' : 'bg-[#111725] border-white/[0.05]';
  const headingColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textBody = isLight ? 'text-[#475467]' : 'text-[#9AA3B5]';
  const textMuted = isLight ? 'text-[#667085]' : 'text-[#5F6878]';

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Companion Solvers State (only used for Compound Interest)
  const [goalTarget, setGoalTarget] = useState(1000000);
  const [goalInitial, setGoalInitial] = useState(10000);
  const [goalRate, setGoalRate] = useState(8.0);
  const [goalYears, setGoalYears] = useState(20);

  const [timeTarget, setTimeTarget] = useState(500000);
  const [timeInitial, setTimeInitial] = useState(5000);
  const [timeMonthly, setTimeMonthly] = useState(600);
  const [timeRate, setTimeRate] = useState(8.0);

  const goalResult = calculateRequiredInvestmentForGoal({
    targetAmount: goalTarget,
    initialDeposit: goalInitial,
    interestRate: goalRate,
    years: goalYears,
  });

  const timeResult = calculateTimeToReachGoal({
    targetAmount: timeTarget,
    initialDeposit: timeInitial,
    monthlyContribution: timeMonthly,
    interestRate: timeRate,
  });

  const benchmarkAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const isCompoundInterest = calculator.id === 'compound-interest' || calculator.slug === 'compound-interest';
  const isMonteCarlo = calculator.id === 'monte-carlo-simulator' || calculator.slug === 'monte-carlo-simulator';
  const isBmi = calculator.id === 'bmi-body-composition' || calculator.slug === 'bmi-body-composition' || calculator.slug === 'bmi-calculator';
  const isSip = calculator.id === 'sip' || calculator.slug === 'sip-calculator' || calculator.slug === 'step-up-sip';
  const isRetirement = calculator.id === 'retirement-corpus' || calculator.slug === 'retirement-corpus';

  // Calculate live sample evaluation with default inputs
  const sampleEvaluation = useMemo(() => {
    const defaultInputs = calculator.inputs.reduce((acc, input) => {
      acc[input.id] = input.defaultValue;
      return acc;
    }, {} as Record<string, any>);

    const output = calculator.calculate(defaultInputs, currency);
    return { defaultInputs, output };
  }, [calculator, currency]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 space-y-12">
      
      {/* 1. Companion Interactive Tools (Goal Solver & Time Solver) ONLY FOR Compound Interest */}
      {isCompoundInterest && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#6948FF]/10 text-[#6948FF]">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Interactive Wealth Goal Solvers
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Work backwards from your target nest egg: solve for required monthly savings or time horizon.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Goal Planner Tool: How Much to Invest Monthly */}
            <div className={`p-6 rounded-2xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#00875A] dark:text-[#35E6A0]" />
                  <h3 className={`text-base font-bold ${headingColor}`}>
                    Target Corpus Planner
                  </h3>
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${isLight ? 'bg-[#00875A]/10 text-[#00875A]' : 'bg-[#35E6A0]/10 text-[#35E6A0]'}`}>
                  Reverse Solver
                </span>
              </div>
              <p className={`text-xs ${textBody}`}>
                Determine how much you need to save each month to hit your specific wealth milestone.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Starting Principal</label>
                  <input
                    type="number"
                    value={goalInitial}
                    onChange={(e) => setGoalInitial(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={goalRate}
                    onChange={(e) => setGoalRate(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={goalYears}
                    onChange={(e) => setGoalYears(Number(e.target.value) || 1)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
              </div>

              {/* Solved Result Card */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#00875A]/5 border-[#00875A]/20' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] block uppercase font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                      Required Monthly Investment
                    </span>
                    <span className={`text-2xl font-extrabold font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                      {formatCurrency(goalResult.requiredMonthly, currency)}/mo
                    </span>
                  </div>
                  {onLoadInputs && (
                    <button
                      onClick={() => onLoadInputs({
                        initialDeposit: goalInitial,
                        periodicContribution: goalResult.requiredMonthly,
                        interestRate: goalRate,
                        years: goalYears,
                      })}
                      className="px-3 py-1.5 rounded-lg bg-[#6948FF] hover:bg-[#5835ea] text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Load in Calculator</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="mt-2 text-[11px] flex gap-4 text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>Out-of-Pocket: {formatCurrency(goalResult.totalInvested, currency, true)}</span>
                  <span>Compound Gain: +{formatCurrency(goalResult.totalInterest, currency, true)}</span>
                </div>
              </div>
            </div>

            {/* Time to Goal Solver: How Long Will It Take */}
            <div className={`p-6 rounded-2xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6948FF] dark:text-[#8B6CFF]" />
                  <h3 className={`text-base font-bold ${headingColor}`}>
                    Time to Goal Horizon Solver
                  </h3>
                </div>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${isLight ? 'bg-[#6948FF]/10 text-[#6948FF]' : 'bg-[#8B6CFF]/10 text-[#8B6CFF]'}`}>
                  Timeline Solver
                </span>
              </div>
              <p className={`text-xs ${textBody}`}>
                Find out exactly how many years and months it will take to reach your target savings at your current pace.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Target Wealth Goal</label>
                  <input
                    type="number"
                    value={timeTarget}
                    onChange={(e) => setTimeTarget(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Starting Balance</label>
                  <input
                    type="number"
                    value={timeInitial}
                    onChange={(e) => setTimeInitial(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Monthly Contribution</label>
                  <input
                    type="number"
                    value={timeMonthly}
                    onChange={(e) => setTimeMonthly(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-medium block mb-1 ${textMuted}`}>Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={timeRate}
                    onChange={(e) => setTimeRate(Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                </div>
              </div>

              {/* Time Result Card */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] block uppercase font-mono ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                      Estimated Time Horizon
                    </span>
                    <span className={`text-2xl font-extrabold font-mono ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                      {timeResult.years} yrs {timeResult.months > 0 ? `${timeResult.months} mos` : ''}
                    </span>
                  </div>
                  {onLoadInputs && (
                    <button
                      onClick={() => onLoadInputs({
                        initialDeposit: timeInitial,
                        periodicContribution: timeMonthly,
                        interestRate: timeRate,
                        years: Math.max(1, timeResult.years),
                      })}
                      className="px-3 py-1.5 rounded-lg bg-[#6948FF] hover:bg-[#5835ea] text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Simulate Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="mt-2 text-[11px] flex gap-4 text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>Total Capital Saved: {formatCurrency(timeResult.totalInvested, currency, true)}</span>
                  <span>Goal Achieved: {formatCurrency(timeTarget, currency, true)}</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 2. Compound Interest Benchmark Matrix ONLY FOR Compound Interest */}
      {isCompoundInterest && (
        <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Compound Growth Benchmark Matrix
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Compare future values across initial deposits and timeframes (assuming 8% annualized return with $250/mo contributions).
              </p>
            </div>
            <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${isLight ? 'bg-[#6948FF]/10 text-[#6948FF]' : 'bg-[#8B6CFF]/20 text-[#8B6CFF]'}`}>
              1-Click Instant Pre-load
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b ${isLight ? 'border-black/10 text-[#475467]' : 'border-white/[0.08] text-[#9AA3B5]'}`}>
                  <th className="pb-3 font-semibold">Initial Lump Sum</th>
                  <th className="pb-3 font-semibold">In 10 Years</th>
                  <th className="pb-3 font-semibold">In 20 Years</th>
                  <th className="pb-3 font-semibold">In 30 Years</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-black/5' : 'divide-white/[0.04]'}`}>
                {benchmarkAmounts.map((p) => {
                  const res10 = calculateCompoundInterest({ initialDeposit: p, periodicContribution: 250, interestRate: 8, years: 10 });
                  const res20 = calculateCompoundInterest({ initialDeposit: p, periodicContribution: 250, interestRate: 8, years: 20 });
                  const res30 = calculateCompoundInterest({ initialDeposit: p, periodicContribution: 250, interestRate: 8, years: 30 });
                  
                  return (
                    <tr key={p} className={isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-white/[0.02]'}>
                      <td className={`py-3 font-bold ${headingColor}`}>
                        {formatCurrency(p, currency, true)}
                      </td>
                      <td className={`py-3 ${textBody}`}>
                        {formatCurrency(res10.futureValue, currency, true)}
                      </td>
                      <td className={`py-3 font-semibold ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                        {formatCurrency(res20.futureValue, currency, true)}
                      </td>
                      <td className={`py-3 font-bold ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                        {formatCurrency(res30.futureValue, currency, true)}
                      </td>
                      <td className="py-3 text-right">
                        {onLoadInputs && (
                          <button
                            onClick={() => onLoadInputs({
                              initialDeposit: p,
                              periodicContribution: 250,
                              interestRate: 8,
                              years: 20,
                            })}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-black/5 hover:bg-[#6948FF] hover:text-white text-[#11131A]'
                                : 'bg-white/5 hover:bg-[#8B6CFF] hover:text-white text-[#F7F8FC]'
                            }`}
                          >
                            Load
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. DYNAMIC CALCULATOR-SPECIFIC EDUCATIONAL & SEO CONTENT */}
      {/* ============================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Explanations, Formulas, Step-by-Step, Worked Example */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* H2: What Is [Calculator Title]? / Computational Overview */}
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#6948FF]/10 text-[#6948FF]">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                {isCompoundInterest
                  ? 'What Is the Compound Interest & Wealth Growth Calculator?'
                  : isMonteCarlo 
                  ? 'Understand Your Simulation Results' 
                  : isBmi 
                  ? 'More Than a BMI Number: Body Composition Interpretation' 
                  : isSip
                  ? 'SIP Calculator – Calculate SIP Returns, Goals & Investment Growth'
                  : `What Is the ${calculator.title}?`}
              </h2>
            </div>
            
            <div className={`text-sm leading-relaxed space-y-3 ${textBody}`}>
              {isCompoundInterest ? (
                <>
                  <p>
                    The <strong>Compound Interest & Wealth Growth Calculator</strong> is a powerful financial planning tool designed to accurately project your long-term investment growth. Unlike basic interest calculators, this tool evaluates how your portfolio compounds over time while accounting for regular deposits, variable compounding frequencies, estimated market returns, and the eroding effect of inflation.
                  </p>

                  <div className="pt-2">
                    <h3 className={`text-sm font-bold mb-2.5 ${headingColor}`}>
                      Key Benefits & What You Can Calculate:
                    </h3>
                    <ul className={`list-disc list-inside space-y-2 text-xs sm:text-sm ${textBody}`}>
                      <li>
                        <strong>Project Total Future Value:</strong> Visualize how small, consistent contributions turn into significant wealth through the power of compounding.
                      </li>
                      <li>
                        <strong>Measure Real Purchasing Power:</strong> Estimate your <strong>inflation-adjusted returns</strong> so you know what your money will actually be worth in tomorrow's economy.
                      </li>
                      <li>
                        <strong>Simulate Custom Scenarios:</strong> Compare different contribution amounts, step-up rates, and investment horizons to optimize your retirement and savings strategy.
                      </li>
                      <li>
                        <strong>Analyze Returns with Transparency:</strong> Instantly see a complete breakdown comparing your total out-of-pocket contributions against pure compound interest earned.
                      </li>
                    </ul>
                  </div>
                </>
              ) : isMonteCarlo ? (
                <>
                  <p>
                    Unlike a deterministic calculator that assumes a single fixed return every year, a <strong>Monte Carlo simulation</strong> runs thousands of randomized trials to explore how market uncertainty, sequence of returns risk, and volatility shape your wealth over time.
                  </p>
                  <p>
                    Rather than predicting one single future balance, the engine computes an empirical probability distribution of outcomes—giving you realistic insight into your downside exposure (10th percentile), expected median path (50th percentile), and high-growth upside (90th percentile).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#6948FF] block mb-1">Deterministic Model (Baseline)</span>
                      <p className="text-xs text-neutral-500">Assumes steady constant return (e.g. 8% p.a.). Produces exactly 1 theoretical outcome without volatility.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#00875A] dark:text-[#35E6A0] block mb-1">Monte Carlo Model (Stochastic)</span>
                      <p className="text-xs text-neutral-500">Models thousands of market trajectories with volatility and sequence risk. Generates an empirical distribution.</p>
                    </div>
                  </div>
                </>
              ) : isBmi ? (
                <>
                  <p>
                    <strong>BMI</strong> uses height and weight to produce a standardized body-size ratio (kg/m²), but it does not directly measure body fat percentage, skeletal muscle mass, bone density, or abdominal fat distribution.
                  </p>
                  <p>
                    This analyzer separates BMI from other body-composition signals (Deurenberg age/sex regressions, U.S. Navy circumference methods, and Waist-to-Height Ratio) instead of treating them as interchangeable.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#6948FF] block mb-1">BMI Ratio</span>
                      <p className="text-xs text-neutral-500">Weight relative to stature. Standardized population-level screening metric.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#00875A] dark:text-[#35E6A0] block mb-1">Body Fat % & Lean Mass</span>
                      <p className="text-xs text-neutral-500">Estimated or measured proportion of total body mass attributable to adipose tissue.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#FFB84D] block mb-1">Waist-to-Height (WHtR)</span>
                      <p className="text-xs text-neutral-500">Central adiposity and visceral fat distribution indicator (healthy target &lt; 0.50).</p>
                    </div>
                  </div>
                </>
              ) : isSip ? (
                <>
                  <p>
                    Calculate the potential future value of a <strong>Systematic Investment Plan (SIP)</strong> using your monthly investment, investment period, and assumed annual return. Explore how changing your SIP amount, time horizon, return assumption, contribution increases, inflation, fees, and other inputs can affect the modeled outcome.
                  </p>
                  <p>
                    The calculator separates your direct out-of-pocket contributions from modeled compound growth so you can clearly see how wealth accumulates over multi-year horizons.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#6948FF] block mb-1">Rupee Cost Averaging</span>
                      <p className="text-xs text-neutral-500">Disciplined periodic buying averages purchase NAVs across market bull and bear cycles.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#00875A] dark:text-[#35E6A0] block mb-1">Annual Step-Up Habit</span>
                      <p className="text-xs text-neutral-500">Increasing contributions alongside annual salary hikes can more than double your terminal corpus.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                      <span className="font-bold text-xs font-mono text-[#FFB84D] block mb-1">Real Purchasing Power</span>
                      <p className="text-xs text-neutral-500">Models inflation erosion to show the future corpus value in today's currency.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>{calculator.title}</strong> is a dedicated computational engine designed to evaluate <em>{calculator.tagline.toLowerCase()}</em> with high precision and transparency.
                  </p>
                  <p>
                    {calculator.description}
                  </p>
                </>
              )}
            </div>

            {/* Dynamic Formula Display Callout */}
            {calculator.formulaDisplay && (
              <div className={`mt-4 p-5 rounded-2xl border ${cardSubtleBg}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5 ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Mathematical Formula & Stochastic Process</span>
                </h3>
                <div className="py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 font-mono text-sm sm:text-base font-bold text-center overflow-x-auto text-[#11131A] dark:text-[#F7F8FC]">
                  {calculator.formulaDisplay}
                </div>
                
                {/* Variable Tokens Breakdown */}
                {calculator.formulaTokens && calculator.formulaTokens.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-xs font-mono">
                    {calculator.formulaTokens.map((token, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                        <span className="font-bold text-[#6948FF] dark:text-[#8B6CFF] px-1.5 py-0.5 rounded bg-[#6948FF]/10">
                          {token.token}
                        </span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{token.label}:</span>
                        <span className="text-neutral-500 truncate">{token.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs font-mono">
                    {calculator.inputs.map((inp) => (
                      <div key={inp.id} className="flex items-center gap-2 text-neutral-500">
                        <span className="font-bold text-[#6948FF] dark:text-[#8B6CFF]">{inp.name}:</span>
                        <span>{inp.type} {inp.unit ? `(${inp.unit})` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* H2: How to Use / Step-by-Step Guides for All Calculator Categories */}
          {isCompoundInterest ? (
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0]">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  How to Calculate Compound Interest & Wealth Growth
                </h2>
              </div>
              
              <p className={`text-sm ${textBody}`}>
                Follow this quick guide to run precise investment projections, test different contribution scenarios, and calculate inflation-adjusted returns using the calculator above.
              </p>

              <div className="space-y-5 text-sm leading-relaxed">
                {/* Step 1 */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 1</span>
                    <span>Define Your Starting Capital & Regular Contributions</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Initial Investment (Starting Principal):</strong> Enter your starting capital (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">$10,000</code>). This is the lump sum you are investing at Day 1.
                    </li>
                    <li>
                      <strong>Regular Addition:</strong> Set the recurring amount you plan to save and invest continuously.
                    </li>
                    <li>
                      <strong>Contribution Frequency:</strong> Choose how often you deposit funds—monthly, quarterly, or annually.
                    </li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 2</span>
                    <span>Set Growth & Timeline Parameters</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Estimated Annual Return (%):</strong> Input your expected annualized rate of return (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">8%</code>) based on your asset allocation (stocks, bonds, or mutual funds).
                    </li>
                    <li>
                      <strong>Investment Horizon (Years):</strong> Specify the number of years you plan to hold and grow the investment.
                    </li>
                    <li>
                      <strong>Compounding Frequency:</strong> Select how often interest compounds (e.g., annually, semi-annually, or monthly). More frequent compounding increases overall wealth yield.
                    </li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 3</span>
                    <span>Adjust for Inflation & Growth Strategy</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Estimated Inflation Rate (%):</strong> Enter an expected inflation rate (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">3%</code>) to view your future balance in today's real purchasing power.
                    </li>
                    <li>
                      <strong>Annual Step-Up (%):</strong> Specify if you plan to increase your regular deposits each year as your income grows (e.g., boosting contributions by <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">5%</code> annually).
                    </li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0] font-mono text-xs">Step 4</span>
                    <span>Analyze & Export Your Results</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Real-Time Portfolio Metrics:</strong> Instantaneously review your <strong>Nominal Future Value</strong>, total out-of-pocket contributions vs. total compound returns earned, and interactive wealth growth charts.
                    </li>
                    <li>
                      <strong>Export & Share Reports:</strong> Download a detailed PDF or CSV breakdown for your financial records, or copy a shareable link to save your custom scenario.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isSip ? (
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0]">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  How to Calculate SIP Returns & Mutual Fund Growth
                </h2>
              </div>
              
              <p className={`text-sm ${textBody}`}>
                Follow this guide to project systematically invested mutual funds, evaluate Rupee Cost Averaging benefits, and model annual step-up contribution growth.
              </p>

              <div className="space-y-5 text-sm leading-relaxed">
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 1</span>
                    <span>Set Monthly SIP Deposit & Initial Seed Capital</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Monthly Investment:</strong> Specify your recurring monthly SIP commitment (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">$500</code> or <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">₹5,000</code>).
                    </li>
                    <li>
                      <strong>Initial Lump Sum:</strong> Enter any upfront seed capital invested on Day 1.
                    </li>
                  </ul>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 2</span>
                    <span>Select Expected CAGR & Investment Duration</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Expected Return Rate (% p.a.):</strong> Input expected equity or index fund returns (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">12%</code>).
                    </li>
                    <li>
                      <strong>Time Horizon (Years):</strong> Define the total multi-year holding period (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">15 years</code>).
                    </li>
                  </ul>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0] font-mono text-xs">Step 3</span>
                    <span>Configure Annual Step-Up & Inflation Adjustments</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Annual Step-Up (%):</strong> Model increasing your monthly deposit each year alongside career raises (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">10%</code>).
                    </li>
                    <li>
                      <strong>Inflation Adjustment:</strong> Factor in consumer inflation to calculate real inflation-adjusted wealth.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isBmi ? (
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0]">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  How to Assess Body Composition & BMI Metrics
                </h2>
              </div>
              
              <p className={`text-sm ${textBody}`}>
                Follow these simple steps to analyze your body mass index, estimated body fat percentage, lean body mass, and health classification.
              </p>

              <div className="space-y-5 text-sm leading-relaxed">
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#6948FF]/10 text-[#6948FF] font-mono text-xs">Step 1</span>
                    <span>Input Physical Characteristics & Stature</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Height & Weight:</strong> Provide current stature measurements (e.g., <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">175 cm</code> / <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-xs">70 kg</code>).
                    </li>
                    <li>
                      <strong>Age & Sex:</strong> Select biological parameters for accurate body fat regression equations.
                    </li>
                  </ul>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${headingColor}`}>
                    <span className="px-2 py-0.5 rounded-md bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0] font-mono text-xs">Step 2</span>
                    <span>Include Circumference Measures for Fat Distribution</span>
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 pt-1 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Waist & Neck Circumference:</strong> Measure waist at the navel to compute Waist-to-Height Ratio (WHtR) and visceral fat indicators.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0]">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  How to Use the {calculator.title}
                </h2>
              </div>
              
              <p className={`text-sm ${textBody}`}>
                Follow this step-by-step guide to run accurate calculations, test custom assumptions, and analyze your results:
              </p>

              <div className="space-y-4 text-sm leading-relaxed">
                <div className={`p-4 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-xs uppercase font-mono tracking-wider text-[#6948FF] dark:text-[#8B6CFF]`}>
                    Step 1: Input Baseline Model Parameters
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 text-xs sm:text-sm ${textBody}`}>
                    {calculator.inputs.slice(0, 4).map((input) => {
                      const cleanName = input.name.replace(/\s*\([^)]*\)/g, '').trim();
                      return (
                        <li key={input.id}>
                          <strong>{cleanName}:</strong>{' '}
                          {input.description
                            ? input.description
                            : input.type === 'select'
                            ? `Choose your preferred setting for ${cleanName.toLowerCase()}.`
                            : `Set your target ${cleanName.toLowerCase()}${input.defaultValue !== undefined ? ` (e.g., ${input.defaultValue} ${input.unit || ''})` : ''}.`}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${cardSubtleBg}`}>
                  <h3 className={`font-bold text-xs uppercase font-mono tracking-wider text-[#00875A] dark:text-[#35E6A0]`}>
                    Step 2: Review Real-Time Outputs & Export Analysis
                  </h3>
                  <ul className={`list-disc list-inside space-y-1.5 text-xs sm:text-sm ${textBody}`}>
                    <li>
                      <strong>Real-Time Results:</strong> Instantly review primary calculated outputs, visual charts, and detailed mathematical breakdowns.
                    </li>
                    <li>
                      <strong>Export & Share:</strong> Download a PDF or CSV report for your records, or copy a direct link to save your scenario.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* H2: Live Worked Calculation Example */}
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#29D8FF]/10 text-[#29D8FF]">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Worked Calculation Example
              </h2>
            </div>

            <p className={`text-sm leading-relaxed ${textBody}`}>
              To see how the {calculator.title} operates under baseline parameters, consider the following calculation:
            </p>

            <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                {calculator.inputs.slice(0, 6).map((inp) => (
                  <div key={inp.id} className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-neutral-500 block truncate">{inp.name}</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {inp.type === 'currency' ? formatCurrency(Number(inp.defaultValue) || 0, currency) : `${inp.defaultValue} ${inp.unit || ''}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-[#00875A]/5 border-[#00875A]/20' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'
              }`}>
                <div>
                  <span className={`text-[10px] uppercase font-mono font-bold block ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                    Calculated Result ({sampleEvaluation.output.primaryLabel})
                  </span>
                  <span className={`text-2xl font-extrabold font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                    {sampleEvaluation.output.primaryFormatted || sampleEvaluation.output.primaryValue.toLocaleString()}
                  </span>
                </div>
                {sampleEvaluation.output.secondaryMetrics && sampleEvaluation.output.secondaryMetrics[0] && (
                  <div className="text-right text-xs font-mono text-neutral-500">
                    <div>{sampleEvaluation.output.secondaryMetrics[0].label}</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200">
                      {sampleEvaluation.output.secondaryMetrics[0].value}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Specific FAQ Accordion + Relevant Related Calculators */}
        <div className="space-y-6">
          
          {/* FAQ Accordion Section */}
          <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#6948FF] dark:text-[#8B6CFF]" />
              <h2 className={`text-lg font-bold ${headingColor}`}>
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="space-y-3">
              {(calculator.faqs || [
                {
                  q: `How accurate is the ${calculator.title}?`,
                  a: `This calculator performs continuous double-precision computation based on standard mathematical formulas. While exact for given input parameters, real-world conditions may introduce external variables.`
                },
                {
                  q: `Can I export or save my calculation?`,
                  a: `Yes, you can export your complete breakdown in PDF and CSV format, or copy the unique fingerprint URL to restore your exact calculation state anytime.`
                }
              ]).map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all ${
                      isOpen
                        ? isLight ? 'bg-[#F8FAFC] border-black/15' : 'bg-[#111725] border-white/15'
                        : isLight ? 'bg-white border-black/5 hover:border-black/10' : 'bg-[#0C101A] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className={`text-xs font-semibold ${headingColor}`}>
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 border-t border-black/5 dark:border-white/5 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contextual Related Calculators */}
          {calculator.relatedCalculators && calculator.relatedCalculators.length > 0 && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#35E6A0]" />
                <h3 className={`text-lg font-bold ${headingColor}`}>
                  Explore Related Calculators
                </h3>
              </div>
              <p className={`text-xs ${textBody}`}>
                Complement your analysis with related calculation tools in our directory:
              </p>

              <div className="space-y-2">
                {calculator.relatedCalculators.map((relId) => (
                  <Link
                    key={relId}
                    to={`/calculator/${relId}`}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-all group ${
                      isLight
                        ? 'bg-[#F8FAFC] hover:bg-[#6948FF] hover:text-white border-black/5'
                        : 'bg-[#111725] hover:bg-[#8B6CFF] hover:text-white border-white/5'
                    }`}
                  >
                    <span className="capitalize">{relId.replace(/-/g, ' ')} Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </section>

      {/* FAQPage JSON-LD Schema for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: (calculator.faqs || [
              {
                q: `How accurate is the ${calculator.title}?`,
                a: `This calculator performs continuous double-precision computation based on standard mathematical formulas. While exact for given input parameters, real-world conditions may introduce external variables.`
              },
              {
                q: `Can I export or save my calculation?`,
                a: `Yes, you can export your complete breakdown in PDF and CSV format, or copy the unique fingerprint URL to restore your exact calculation state anytime.`
              }
            ]).map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />

    </div>
  );
};
