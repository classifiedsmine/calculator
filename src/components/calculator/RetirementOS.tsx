import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Search,
  Download,
  Share2,
  Info,
  Calendar,
  Layers,
  Activity,
  HeartPulse,
  Sliders,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  Target,
  RefreshCw,
  Award,
  ShieldAlert,
  Coins,
  Scale,
} from 'lucide-react';
import { CurrencyConfig } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import {
  RetirementEngineInputs,
  ExpenseBreakdownInputs,
  AssetBreakdownInputs,
  runRetirementEngine,
  parseRetirementNaturalQuery,
} from '../../lib/retirementEngine';

interface RetirementOSProps {
  currency: CurrencyConfig;
  theme?: string;
  currentInputs?: Partial<RetirementEngineInputs>;
  onApplyInputs?: (inputs: Record<string, any>) => void;
}

const SEARCH_INTENT_PRESETS = [
  {
    label: 'Standard Plan (Age 35, Retire 60, ₹60K Exp)',
    inputs: {
      currentAge: 35,
      retirementAge: 60,
      lifeExpectancy: 90,
      currentSavings: 1000000,
      monthlySip: 25000,
      annualStepUp: 10,
      preRetirementReturn: 11,
      postRetirementReturn: 7.5,
      generalInflation: 6,
      healthcareInflation: 8,
      customTotalMonthlyExpense: 60000,
      pensionIncome: 0,
    },
  },
  {
    label: 'FIRE Early Retirement (Age 32, Retire 50)',
    inputs: {
      currentAge: 32,
      retirementAge: 50,
      lifeExpectancy: 92,
      currentSavings: 2500000,
      monthlySip: 60000,
      annualStepUp: 12,
      preRetirementReturn: 12,
      postRetirementReturn: 8,
      generalInflation: 6.5,
      healthcareInflation: 8.5,
      customTotalMonthlyExpense: 85000,
      pensionIncome: 0,
    },
  },
  {
    label: 'NPS 60:40 + EPF + Pension Hybrid',
    inputs: {
      currentAge: 40,
      retirementAge: 60,
      lifeExpectancy: 90,
      currentSavings: 3500000,
      monthlySip: 35000,
      annualStepUp: 8,
      preRetirementReturn: 10.5,
      postRetirementReturn: 7,
      generalInflation: 6,
      healthcareInflation: 8,
      customTotalMonthlyExpense: 100000,
      pensionIncome: 25000,
    },
  },
  {
    label: 'Medical Shock Stress Test (Age 75 Shock)',
    inputs: {
      currentAge: 38,
      retirementAge: 60,
      lifeExpectancy: 90,
      currentSavings: 2000000,
      monthlySip: 40000,
      annualStepUp: 10,
      preRetirementReturn: 11.5,
      postRetirementReturn: 7.5,
      generalInflation: 6,
      healthcareInflation: 8,
      customTotalMonthlyExpense: 90000,
      pensionIncome: 10000,
    },
  },
];

export const RetirementOS: React.FC<RetirementOSProps> = ({
  currency,
  currentInputs,
}) => {
  // 1. Natural Language Search Query State
  const [naturalQuery, setNaturalQuery] = useState('');
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // 2. Base Input States
  const [currentAge, setCurrentAge] = useState<number>(currentInputs?.currentAge ?? 35);
  const [retirementAge, setRetirementAge] = useState<number>(currentInputs?.retirementAge ?? 60);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(currentInputs?.lifeExpectancy ?? 90);

  const [currentSavings, setCurrentSavings] = useState<number>(currentInputs?.currentSavings ?? 1000000); // 10 Lakhs
  const [monthlySip, setMonthlySip] = useState<number>(currentInputs?.monthlySip ?? 25000);
  const [employerContribution, setEmployerContribution] = useState<number>(currentInputs?.employerContribution ?? 5000);
  const [annualStepUp, setAnnualStepUp] = useState<number>(currentInputs?.annualStepUp ?? 10);
  const [preRetirementReturn, setPreRetirementReturn] = useState<number>(currentInputs?.preRetirementReturn ?? 11);

  // Expense & Healthcare States
  const [expenseMode, setExpenseMode] = useState<'quick' | 'detailed'>('quick');
  const [customTotalMonthlyExpense, setCustomTotalMonthlyExpense] = useState<number>(
    currentInputs?.customTotalMonthlyExpense ?? 60000
  );
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownInputs>({
    essentialHousing: 18000,
    essentialFood: 15000,
    essentialUtilities: 7000,
    essentialHealthcare: 5000,
    discretionaryTravel: 8000,
    discretionaryLifestyle: 5000,
    discretionaryHobbies: 2000,
    discretionaryOther: 0,
  });

  const [generalInflation, setGeneralInflation] = useState<number>(currentInputs?.generalInflation ?? 6);
  const [healthcareInflation, setHealthcareInflation] = useState<number>(
    currentInputs?.healthcareInflation ?? 8
  );
  const [postRetirementReturn, setPostRetirementReturn] = useState<number>(
    currentInputs?.postRetirementReturn ?? 7.5
  );

  // Advanced Pro Features States
  const [enableNpsAnnuitySplit, setEnableNpsAnnuitySplit] = useState<boolean>(true);
  const [npsAnnuityPercent, setNpsAnnuityPercent] = useState<number>(40); // 40% mandatory annuity
  const [npsAnnuityRate, setNpsAnnuityRate] = useState<number>(6.5); // 6.5% rate

  const [enableMedicalShock, setEnableMedicalShock] = useState<boolean>(false);
  const [medicalShockAge, setMedicalShockAge] = useState<number>(75);
  const [medicalShockAmountToday, setMedicalShockAmountToday] = useState<number>(2000000); // ₹20 Lakhs

  const [enablePostTaxSwpMode, setEnablePostTaxSwpMode] = useState<boolean>(true); // 12.5% LTCG tax

  // Asset Class Breakdown States
  const [assetBreakdown, setAssetBreakdown] = useState<AssetBreakdownInputs>({
    epf: 350000,
    ppf: 150000,
    nps: 150000,
    mutualFunds: 250000,
    fixedDeposits: 50000,
    cashOther: 50000,
  });

  // Pension & Offsets
  const [pensionIncome, setPensionIncome] = useState<number>(currentInputs?.pensionIncome ?? 0);
  const [otherGuaranteedIncome, setOtherGuaranteedIncome] = useState<number>(
    currentInputs?.otherGuaranteedIncome ?? 0
  );

  // Strategy & View Preferences
  const [withdrawalStrategy, setWithdrawalStrategy] = useState<
    'swp_inflation_adjusted' | 'fixed_nominal' | 'percentage_portfolio' | 'three_phase_spending'
  >('swp_inflation_adjusted');
  const [isTodaysMoneyView, setIsTodaysMoneyView] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'plan' | 'expenses' | 'assets' | 'longevity' | 'ladders' | 'monte_carlo' | 'assumptions'
  >('plan');

  const [activeTabSubView, setActiveTabSubView] = useState<'accum' | 'scenarios' | 'buckets'>('accum');

  // Handle Natural Language Query Compile
  const handleCompileQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalQuery.trim()) return;

    const parsed = parseRetirementNaturalQuery(naturalQuery);
    if (parsed) {
      if (parsed.currentAge !== undefined) setCurrentAge(parsed.currentAge);
      if (parsed.retirementAge !== undefined) setRetirementAge(parsed.retirementAge);
      if (parsed.currentSavings !== undefined) setCurrentSavings(parsed.currentSavings);
      if (parsed.monthlySip !== undefined) setMonthlySip(parsed.monthlySip);
      if (parsed.annualStepUp !== undefined) setAnnualStepUp(parsed.annualStepUp);
      if (parsed.preRetirementReturn !== undefined) setPreRetirementReturn(parsed.preRetirementReturn);
      if (parsed.generalInflation !== undefined) setGeneralInflation(parsed.generalInflation);
      if (parsed.customTotalMonthlyExpense !== undefined) {
        setCustomTotalMonthlyExpense(parsed.customTotalMonthlyExpense);
        setExpenseMode('quick');
      }

      setParseNotice(`✨ Applied input parameters from query.`);
      setTimeout(() => setParseNotice(null), 4000);
    } else {
      setParseNotice('⚠️ Could not extract specific parameters. Try e.g. "35 years old, retire at 60, ₹60,000 monthly expense, 6% inflation".');
      setTimeout(() => setParseNotice(null), 5000);
    }
  };

  const applyPreset = (presetInputs: any) => {
    if (presetInputs.currentAge) setCurrentAge(presetInputs.currentAge);
    if (presetInputs.retirementAge) setRetirementAge(presetInputs.retirementAge);
    if (presetInputs.lifeExpectancy) setLifeExpectancy(presetInputs.lifeExpectancy);
    if (presetInputs.currentSavings) setCurrentSavings(presetInputs.currentSavings);
    if (presetInputs.monthlySip) setMonthlySip(presetInputs.monthlySip);
    if (presetInputs.annualStepUp) setAnnualStepUp(presetInputs.annualStepUp);
    if (presetInputs.preRetirementReturn) setPreRetirementReturn(presetInputs.preRetirementReturn);
    if (presetInputs.postRetirementReturn) setPostRetirementReturn(presetInputs.postRetirementReturn);
    if (presetInputs.generalInflation) setGeneralInflation(presetInputs.generalInflation);
    if (presetInputs.healthcareInflation) setHealthcareInflation(presetInputs.healthcareInflation);
    if (presetInputs.customTotalMonthlyExpense) {
      setCustomTotalMonthlyExpense(presetInputs.customTotalMonthlyExpense);
      setExpenseMode('quick');
    }
    if (presetInputs.pensionIncome !== undefined) setPensionIncome(presetInputs.pensionIncome);
  };

  // Run Engine
  const engineResults = useMemo(() => {
    const inputs: RetirementEngineInputs = {
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentSavings,
      monthlySip,
      employerContribution,
      annualStepUp,
      preRetirementReturn,
      postRetirementReturn,
      generalInflation,
      healthcareInflation,
      customTotalMonthlyExpense: expenseMode === 'quick' ? customTotalMonthlyExpense : 0,
      expenseBreakdown: expenseMode === 'detailed' ? expenseBreakdown : undefined,
      assetBreakdown,
      pensionIncome,
      otherGuaranteedIncome,
      withdrawalStrategy,
      npsAnnuitySplit: {
        enabled: enableNpsAnnuitySplit,
        annuityPercent: npsAnnuityPercent,
        annuityRate: npsAnnuityRate,
      },
      medicalShock: {
        enabled: enableMedicalShock,
        shockAge: medicalShockAge,
        shockAmountToday: medicalShockAmountToday,
      },
      enablePostTaxSwpMode,
    };

    return runRetirementEngine(inputs);
  }, [
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentSavings,
    monthlySip,
    employerContribution,
    annualStepUp,
    preRetirementReturn,
    postRetirementReturn,
    generalInflation,
    healthcareInflation,
    expenseMode,
    customTotalMonthlyExpense,
    expenseBreakdown,
    assetBreakdown,
    pensionIncome,
    otherGuaranteedIncome,
    withdrawalStrategy,
    enableNpsAnnuitySplit,
    npsAnnuityPercent,
    npsAnnuityRate,
    enableMedicalShock,
    medicalShockAge,
    medicalShockAmountToday,
    enablePostTaxSwpMode,
  ]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Retirement Corpus & Pension Plan Report'],
      ['Generated On', new Date().toLocaleDateString()],
      [],
      ['PARAMETER', 'VALUE'],
      ['Current Age', currentAge],
      ['Retirement Age', retirementAge],
      ['Life Expectancy', lifeExpectancy],
      ['Current Savings', currentSavings],
      ['Monthly SIP', monthlySip],
      ['Annual Step-Up (%)', annualStepUp],
      ['Pre-Retirement Return (%)', preRetirementReturn],
      ['Post-Retirement Return (%)', postRetirementReturn],
      ['General Inflation (%)', generalInflation],
      ['Healthcare Inflation (%)', healthcareInflation],
      ['Today Monthly Expenses', engineResults.todayTotalMonthlyExpense],
      ['Modeled Monthly Expense at Retirement', engineResults.modeledMonthlyExpenseAtRetirement],
      ['Pension & Annuity Offset', engineResults.pensionAndGuaranteedIncome + engineResults.npsAnnuityMonthlyIncome],
      [],
      ['RESULTS', 'VALUE'],
      ['Retirement Health Score', `${engineResults.healthScore.score}/100 (${engineResults.healthScore.label})`],
      ['Required Corpus', engineResults.requiredCorpus],
      ['Projected Corpus', engineResults.projectedCorpus],
      ['Readiness Gap', engineResults.readinessGap],
      ['Additional Monthly SIP Required', engineResults.additionalMonthlySipRequired],
      ['Corpus Will Last (Years)', engineResults.yearsCorpusWillLast],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Retirement_Plan_Age${currentAge}_Retire${retirementAge}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Link
  const handleShareLink = () => {
    const params = new URLSearchParams({
      age: currentAge.toString(),
      retAge: retirementAge.toString(),
      sav: currentSavings.toString(),
      sip: monthlySip.toString(),
      exp: engineResults.todayTotalMonthlyExpense.toString(),
      inf: generalInflation.toString(),
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    alert('✨ Retirement scenario link copied to clipboard!');
  };

  const fmt = (val: number, compact = false) => formatCurrency(val, currency, compact);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Search Intent Query Compiler Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Natural Language Intent Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                NPS 60:40 & SWP Tax Drag Engine
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Retirement Corpus & Pension OS
            </h1>
            <p className="text-sm text-blue-200 mt-1 max-w-2xl">
              Advanced dual-phase simulation with NPS 60:40 annuity splits, 3-Bucket allocators, medical emergency shock stress tests, and post-tax SWP yields.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Export CSV Report"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleShareLink}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Natural Language Search Input Bar */}
        <form onSubmit={handleCompileQuery} className="relative mt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-blue-300" />
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder='Type natural query, e.g. "I am 35, retire at 60, current savings 10 lakhs, monthly expense 60000, 6% inflation"'
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950/60 border border-blue-500/40 rounded-xl text-sm placeholder-blue-300/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Compile
            </button>
          </div>
        </form>

        {parseNotice && (
          <div className="mt-2 text-xs font-medium text-amber-200 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {parseNotice}
          </div>
        )}

        {/* High-Intent Search Presets */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-blue-300 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Presets:
          </span>
          {SEARCH_INTENT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset.inputs)}
              className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-800/80 text-blue-200 border border-blue-700/50 rounded-lg text-xs whitespace-nowrap transition-all hover:scale-102"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* EXECUTIVE DASHBOARD & RETIREMENT HEALTH SCORE GAUGE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-4">
            {/* Health Score Badge Gauge */}
            <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[90px] ${engineResults.healthScore.color}`}>
              <Award className="w-5 h-5 mb-0.5" />
              <span className="text-xl font-extrabold tracking-tight">{engineResults.healthScore.score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">{engineResults.healthScore.label}</span>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                YOUR RETIREMENT PLAN SUMMARY
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Age {currentAge} → Retire {retirementAge} → Duration {lifeExpectancy - retirementAge} Yrs. Health index incorporates coverage ratio, longevity, & sequence risk.
              </p>
            </div>
          </div>

          {/* Today's Money Toggle */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer ${!isTodaysMoneyView ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setIsTodaysMoneyView(false)}
            >
              Nominal Future Value
            </span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer ${isTodaysMoneyView ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setIsTodaysMoneyView(true)}
            >
              Today's Purchasing Power
            </span>
          </div>
        </div>

        {/* 4 Core Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Required Corpus */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>REQUIRED CORPUS</span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {fmt(isTodaysMoneyView ? engineResults.realPurchasingPowerRequiredCorpus : engineResults.requiredCorpus)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>To fund {fmt(engineResults.modeledMonthlyExpenseAtRetirement)}/mo</span>
            </div>
          </div>

          {/* Projected Corpus */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>PROJECTED CORPUS</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {fmt(isTodaysMoneyView ? engineResults.realPurchasingPowerProjectedCorpus : engineResults.projectedCorpus)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              From current SIP & {annualStepUp}% step-up
            </div>
          </div>

          {/* Readiness Gap */}
          <div className={`p-4 rounded-xl border ${engineResults.isCorpusSufficient ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'}`}>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className={engineResults.isCorpusSufficient ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                READINESS GAP
              </span>
              {engineResults.isCorpusSufficient ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <div className={`text-xl font-extrabold ${engineResults.isCorpusSufficient ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {engineResults.isCorpusSufficient ? `+${fmt(engineResults.readinessGap)}` : fmt(engineResults.readinessGap)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {engineResults.isCorpusSufficient ? '100% Fully Funded Plan 🎉' : `Deficit: ${fmt(Math.abs(engineResults.readinessGap))}`}
            </div>
          </div>

          {/* Actionable Solution Bridge */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-1">
              <span>ACTIONABLE BRIDGE</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            {engineResults.isCorpusSufficient ? (
              <div>
                <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  Surplus Reserve
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                  Corpus lasts through age {lifeExpectancy}+
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">
                  +{fmt(engineResults.additionalMonthlySipRequired)}/mo
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Extra SIP needed today, OR work +{engineResults.additionalAccumulationYearsRequired} yrs
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Score Drivers */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Health Score Factors:</span>
            <span className="text-slate-600 dark:text-slate-400">
              {engineResults.healthScore.reasons.join(' • ')}
            </span>
          </div>
          {enableNpsAnnuitySplit && engineResults.npsAnnuityMonthlyIncome > 0 && (
            <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0">
              NPS Annuity Output: +{fmt(engineResults.npsAnnuityMonthlyIncome)}/mo
            </span>
          )}
        </div>
      </div>

      {/* INPUT CONTROLS & MAIN TABBED NAVIGATION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PARAMETER INPUT CONTROLS (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              MODEL PARAMETERS
            </h3>
            <button
              onClick={() => {
                setCurrentAge(35);
                setRetirementAge(60);
                setLifeExpectancy(90);
                setCurrentSavings(1000000);
                setMonthlySip(25000);
                setAnnualStepUp(10);
                setPreRetirementReturn(11);
                setPostRetirementReturn(7.5);
                setGeneralInflation(6);
                setHealthcareInflation(8);
                setCustomTotalMonthlyExpense(60000);
                setPensionIncome(0);
                setEnableNpsAnnuitySplit(true);
                setEnableMedicalShock(false);
                setEnablePostTaxSwpMode(true);
              }}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Age Sliders */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Current Age vs. Retirement Age
              </label>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {currentAge} yrs → {retirementAge} yrs ({retirementAge - currentAge} yrs left)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500">Current Age</span>
                <input
                  type="range"
                  min="20"
                  max="70"
                  value={currentAge}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCurrentAge(val);
                    if (val >= retirementAge) setRetirementAge(val + 5);
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Retirement Age</span>
                <input
                  type="range"
                  min={currentAge + 1}
                  max="80"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Life Expectancy Target:</span>
              <div className="flex items-center gap-2">
                {[80, 85, 90, 95].map((age) => (
                  <button
                    key={age}
                    onClick={() => setLifeExpectancy(age)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${lifeExpectancy === age ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    {age} Yrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Phase 1 Accumulation Inputs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Phase 1: Accumulation Inputs
            </h4>

            {/* Current Savings */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Current Retirement Savings</span>
                <span className="font-bold text-slate-900 dark:text-white">{fmt(currentSavings)}</span>
              </div>
              <input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Monthly Investment SIP */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Monthly Investment (SIP)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(monthlySip)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="2500"
                value={monthlySip}
                onChange={(e) => setMonthlySip(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Step Up & Returns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Annual Step-Up (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={annualStepUp}
                    onChange={(e) => setAnnualStepUp(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Pre-Ret. Return (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={preRetirementReturn}
                    onChange={(e) => setPreRetirementReturn(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Phase 2 Retirement Expenses Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Phase 2: Monthly Expenses Today
              </h4>
              <div className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setExpenseMode('quick')}
                  className={`px-2 py-0.5 rounded font-medium ${expenseMode === 'quick' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setExpenseMode('detailed')}
                  className={`px-2 py-0.5 rounded font-medium ${expenseMode === 'detailed' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
                >
                  Breakdown
                </button>
              </div>
            </div>

            {expenseMode === 'quick' ? (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Monthly Spending Today</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fmt(customTotalMonthlyExpense)}/mo</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="300000"
                  step="5000"
                  value={customTotalMonthlyExpense}
                  onChange={(e) => setCustomTotalMonthlyExpense(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Essential Monthly Expenses</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Housing/Rent</span>
                    <input
                      type="number"
                      value={expenseBreakdown.essentialHousing}
                      onChange={(e) => setExpenseBreakdown({ ...expenseBreakdown, essentialHousing: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Food & Groceries</span>
                    <input
                      type="number"
                      value={expenseBreakdown.essentialFood}
                      onChange={(e) => setExpenseBreakdown({ ...expenseBreakdown, essentialFood: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Essential Healthcare Today</span>
                  <input
                    type="number"
                    value={expenseBreakdown.essentialHealthcare}
                    onChange={(e) => setExpenseBreakdown({ ...expenseBreakdown, essentialHealthcare: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                  />
                </div>
              </div>
            )}

            {/* Inflation & Post Returns */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">General Inf.</label>
                <input
                  type="number"
                  step="0.5"
                  value={generalInflation}
                  onChange={(e) => setGeneralInflation(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Medical Inf.</label>
                <input
                  type="number"
                  step="0.5"
                  value={healthcareInflation}
                  onChange={(e) => setHealthcareInflation(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-rose-600 dark:text-rose-400 font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Post Ret Return</label>
                <input
                  type="number"
                  step="0.5"
                  value={postRetirementReturn}
                  onChange={(e) => setPostRetirementReturn(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Advanced Pro Toggles (NPS Split, Post Tax SWP) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Advanced Regulatory & Tax Engines
            </h4>

            {/* NPS 60:40 Split Toggle */}
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900 dark:text-purple-200">NPS 60:40 Annuity Split Engine</span>
                <input
                  type="checkbox"
                  checked={enableNpsAnnuitySplit}
                  onChange={(e) => setEnableNpsAnnuitySplit(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
              </div>
              {enableNpsAnnuitySplit && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200 dark:border-purple-800">
                  <div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300">Mandatory Annuity %</span>
                    <input
                      type="number"
                      value={npsAnnuityPercent}
                      onChange={(e) => setNpsAnnuityPercent(parseFloat(e.target.value) || 40)}
                      className="w-full px-2 py-0.5 bg-white dark:bg-slate-900 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300">Annuity Payout Rate %</span>
                    <input
                      type="number"
                      step="0.1"
                      value={npsAnnuityRate}
                      onChange={(e) => setNpsAnnuityRate(parseFloat(e.target.value) || 6.5)}
                      className="w-full px-2 py-0.5 bg-white dark:bg-slate-900 border rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Post-Tax SWP LTCG Drag */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-blue-500" /> Model SWP LTCG Tax Drag (12.5%)
                </div>
                <div className="text-[10px] text-slate-500">Applies 12.5% tax on capital gains above ₹1.25L/yr</div>
              </div>
              <input
                type="checkbox"
                checked={enablePostTaxSwpMode}
                onChange={(e) => setEnablePostTaxSwpMode(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 7 SPECIALIZED ANALYSIS TABS (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB HEADER SWITCHER */}
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'plan', label: '1. Dual-Phase Plan', icon: BarChart3 },
              { id: 'expenses', label: '2. Expenses & Shock', icon: HeartPulse },
              { id: 'assets', label: '3. NPS & Asset Breakdown', icon: PieIcon },
              { id: 'longevity', label: '4. Longevity & 3-Buckets', icon: Clock },
              { id: 'ladders', label: '5. Age & Goal Ladders', icon: Layers },
              { id: 'monte_carlo', label: '6. Monte Carlo Risk', icon: Activity },
              { id: 'assumptions', label: '7. Assumptions', icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL CONTAINER */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[460px]">
            {/* TAB 1: DUAL-PHASE ACCUMULATION & SCENARIO PLAN */}
            {activeTab === 'plan' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Phase 1: Accumulation Growth Timeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Yearly progression of contributions vs. compound investment returns.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTabSubView('accum')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${activeTabSubView === 'accum' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
                    >
                      Accumulation
                    </button>
                    <button
                      onClick={() => setActiveTabSubView('scenarios')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${activeTabSubView === 'scenarios' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
                    >
                      3-Scenario Yields
                    </button>
                  </div>
                </div>

                {activeTabSubView === 'accum' ? (
                  <div className="space-y-4">
                    {/* Visual Growth Chart Bar Representation */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Target Readiness Progression</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {Math.min(100, Math.round((engineResults.projectedCorpus / (engineResults.requiredCorpus || 1)) * 100))}% Funded
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
                        <div
                          style={{ width: `${Math.min(100, (engineResults.projectedCorpus / (engineResults.requiredCorpus || 1)) * 100)}%` }}
                          className={`h-full transition-all duration-500 ${engineResults.isCorpusSufficient ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        />
                      </div>
                    </div>

                    {/* Timeline Data Table Preview */}
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Age</th>
                            <th className="py-2.5 px-3">Monthly SIP</th>
                            <th className="py-2.5 px-3">Cumul. Invested</th>
                            <th className="py-2.5 px-3">Growth Returns</th>
                            <th className="py-2.5 px-3 text-right">Year End Corpus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {engineResults.accumulationTimeline.filter((_, idx) => idx % Math.max(1, Math.floor(engineResults.accumulationTimeline.length / 6)) === 0 || idx === engineResults.accumulationTimeline.length - 1).map((row) => (
                            <tr key={row.age} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">Age {row.age}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{fmt(row.monthlySip)}/mo</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{fmt(row.cumulativeContributions)}</td>
                              <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-medium">+{fmt(row.cumulativeReturns)}</td>
                              <td className="py-2 px-3 font-bold text-right text-blue-600 dark:text-blue-400">{fmt(row.endBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Scenario Comparisons */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { title: 'Conservative', data: engineResults.scenarioAnalysis.conservative, color: 'slate' },
                      { title: 'Base Scenario', data: engineResults.scenarioAnalysis.base, color: 'blue' },
                      { title: 'Aggressive Growth', data: engineResults.scenarioAnalysis.aggressive, color: 'emerald' },
                    ].map((scen, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white uppercase">{scen.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Return: Pre {scen.data.preReturn}% / Post {scen.data.postReturn}%
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-[11px] text-slate-500">Projected Corpus</div>
                          <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">{fmt(scen.data.projectedCorpus)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">Required Corpus</div>
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt(scen.data.requiredCorpus)}</div>
                        </div>
                        <div className={`text-xs font-bold pt-1 ${scen.data.gap >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {scen.data.gap >= 0 ? `Surplus +${fmt(scen.data.gap)}` : `Gap ${fmt(scen.data.gap)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXPENSES & MEDICAL SHOCK STRESS TEST */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" /> Essential vs. Discretionary Spending & Medical Emergency Shock
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test how a major medical hospitalization event impacts your portfolio survival.
                  </p>
                </div>

                {/* Medical Emergency Shock Simulator Box */}
                <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      MEDICAL EMERGENCY SHOCK STRESS TEST
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableMedicalShock}
                        onChange={(e) => setEnableMedicalShock(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      Enable Shock Event
                    </label>
                  </div>

                  {enableMedicalShock && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-rose-200 dark:border-rose-900 text-xs">
                      <div>
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 block mb-1">Age of Emergency Shock</span>
                        <input
                          type="number"
                          value={medicalShockAge}
                          onChange={(e) => setMedicalShockAge(parseInt(e.target.value, 10) || 75)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 block mb-1">Shock Amount (Today's Money)</span>
                        <input
                          type="number"
                          value={medicalShockAmountToday}
                          onChange={(e) => setMedicalShockAmountToday(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {enableMedicalShock && (
                    <div className="text-xs font-semibold text-rose-800 dark:text-rose-200 pt-1">
                      Modeled Shock at Age {medicalShockAge}: <strong>{fmt(engineResults.medicalShockSummary.shockAmountAtAge)}</strong> (Inflation adjusted @ {healthcareInflation}%)
                      — {engineResults.medicalShockSummary.didCorpusSurviveShock ? '✅ Portfolio withstands shock!' : '❌ Shock causes premature depletion.'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Essential Expenses Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                      <span>ESSENTIAL SPENDING</span>
                      <span className="text-blue-600 dark:text-blue-400">{fmt(engineResults.todayEssentialExpense)}/mo Today</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li className="flex justify-between"><span>Housing & Utilities:</span> <span>{fmt(expenseBreakdown.essentialHousing + expenseBreakdown.essentialUtilities)}</span></li>
                      <li className="flex justify-between"><span>Food & Groceries:</span> <span>{fmt(expenseBreakdown.essentialFood)}</span></li>
                      <li className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                        <span>Healthcare ({healthcareInflation}% Inflation):</span> <span>{fmt(expenseBreakdown.essentialHealthcare)}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Discretionary Expenses Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                      <span>DISCRETIONARY LIFESTYLE</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{fmt(engineResults.todayDiscretionaryExpense)}/mo Today</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li className="flex justify-between"><span>Travel & Vacation:</span> <span>{fmt(expenseBreakdown.discretionaryTravel)}</span></li>
                      <li className="flex justify-between"><span>Lifestyle & Dining:</span> <span>{fmt(expenseBreakdown.discretionaryLifestyle)}</span></li>
                      <li className="flex justify-between"><span>Hobbies & Other:</span> <span>{fmt(expenseBreakdown.discretionaryHobbies + expenseBreakdown.discretionaryOther)}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ASSET BREAKDOWN & NPS 60:40 ANNUITY SPLIT */}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-500" /> EPF, PPF, NPS & NPS 60:40 Annuity Split
                  </h3>
                  <p className="text-xs text-slate-500">
                    PFRDA rules mandate 40% NPS annuity conversion with guaranteed lifelong pension.
                  </p>
                </div>

                {/* NPS 60:40 Annuity Split Summary Card */}
                {enableNpsAnnuitySplit && engineResults.npsSplitSummary.totalNpsAtRetirement > 0 && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-purple-600" /> NPS MATURITY BREAKDOWN AT AGE {retirementAge}
                      </span>
                      <span>Total NPS Corpus: {fmt(engineResults.npsSplitSummary.totalNpsAtRetirement)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900">
                        <div className="text-[10px] text-slate-500 font-semibold">40% Mandatory Annuity</div>
                        <div className="text-sm font-bold text-purple-700 dark:text-purple-300">{fmt(engineResults.npsSplitSummary.annuityLumpSum40)}</div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900">
                        <div className="text-[10px] text-slate-500 font-semibold">60% Tax-Free Lump Sum</div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(engineResults.npsSplitSummary.swpPortfolio60)}</div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900">
                        <div className="text-[10px] text-slate-500 font-semibold">Guaranteed Annuity Payout</div>
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">+{fmt(engineResults.npsSplitSummary.monthlyAnnuityPayout)}/mo</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Asset Component</th>
                        <th className="py-2.5 px-3">Current Value</th>
                        <th className="py-2.5 px-3">Share</th>
                        <th className="py-2.5 px-3 text-right">Projected at Age {retirementAge}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {engineResults.assetBreakdownProjections.map((asset, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{asset.assetName}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{fmt(asset.currentValue)}</td>
                          <td className="py-2.5 px-3 text-slate-500">{asset.shareOfTotal.toFixed(1)}%</td>
                          <td className="py-2.5 px-3 font-bold text-right text-purple-600 dark:text-purple-400">
                            {fmt(asset.projectedValueAtRetirement)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: LONGEVITY & 3-BUCKET STRATEGY */}
            {activeTab === 'longevity' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" /> Drawdown, 3-Bucket Strategy & Longevity
                    </h3>
                    <p className="text-xs text-slate-500">
                      Glidepath strategy allocating Bucket 1 (Cash/FD), Bucket 2 (Debt/Hybrid), and Bucket 3 (Equity Growth).
                    </p>
                  </div>

                  <select
                    value={withdrawalStrategy}
                    onChange={(e) => setWithdrawalStrategy(e.target.value as any)}
                    className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="swp_inflation_adjusted">SWP Inflation-Adjusted (Recommended)</option>
                    <option value="fixed_nominal">Fixed Nominal Monthly Amount</option>
                    <option value="percentage_portfolio">4% Portfolio Percentage Rule</option>
                    <option value="three_phase_spending">Three-Phase Active/Passive Lifestyle</option>
                  </select>
                </div>

                {/* 3-Bucket Strategy Allocator Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" /> THREE-BUCKET GLIDEPATH ALLOCATION AT RETIREMENT
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                      <div className="font-bold text-blue-900 dark:text-blue-200">Bucket 1: Liquid Cash/FD</div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-300">Years 1–3 Living Expenses</div>
                      <div className="text-base font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                        {fmt(engineResults.bucketAllocation.bucket1CashFd.amount)}
                      </div>
                      <div className="text-[10px] text-blue-600 font-semibold">{engineResults.bucketAllocation.bucket1CashFd.percent}% of Corpus</div>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                      <div className="font-bold text-purple-900 dark:text-purple-200">Bucket 2: Debt & Hybrid</div>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300">Years 4–10 Buffer Reserves</div>
                      <div className="text-base font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                        {fmt(engineResults.bucketAllocation.bucket2DebtHybrid.amount)}
                      </div>
                      <div className="text-[10px] text-purple-600 font-semibold">{engineResults.bucketAllocation.bucket2DebtHybrid.percent}% of Corpus</div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200">Bucket 3: Equity Growth</div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300">Years 11+ Inflation Protection</div>
                      <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                        {fmt(engineResults.bucketAllocation.bucket3EquityGrowth.amount)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{engineResults.bucketAllocation.bucket3EquityGrowth.percent}% of Corpus</div>
                    </div>
                  </div>
                </div>

                {/* Drawdown Year-by-Year Table Preview */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Age</th>
                        <th className="py-2.5 px-3">Monthly Expense</th>
                        <th className="py-2.5 px-3">Guaranteed Income</th>
                        <th className="py-2.5 px-3">Net SWP Withdrawal</th>
                        <th className="py-2.5 px-3 text-right">Remaining Corpus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {engineResults.drawdownTimeline
                        .filter((_, idx) => idx % 5 === 0 || idx === engineResults.drawdownTimeline.length - 1)
                        .map((row) => (
                          <tr key={row.age} className={row.isDepleted ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-slate-50/50'}>
                            <td className="py-2 px-3 font-bold">Age {row.age}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{fmt(row.monthlyExpenses)}/mo</td>
                            <td className="py-2 px-3 text-purple-600 dark:text-purple-400">-{fmt(row.monthlyPensionIncome + row.monthlyAnnuityIncome)}</td>
                            <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">{fmt(row.netAnnualWithdrawal)}/yr</td>
                            <td className={`py-2 px-3 font-bold text-right ${row.endBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {fmt(row.endBalance)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: AGE & GOAL LADDERS */}
            {activeTab === 'ladders' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" /> Retirement Age & Target Income Sensitivity Ladders
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare how retiring earlier vs. later changes corpus and SIP requirements.
                  </p>
                </div>

                {/* Age Ladder */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    1. Retirement Age Sensitivity Ladder
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="py-2 px-3">Retire Age</th>
                          <th className="py-2 px-3">Modeled Expense</th>
                          <th className="py-2 px-3">Required Corpus</th>
                          <th className="py-2 px-3 text-right">Required SIP Today</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {engineResults.retirementAgeLadder.map((item) => (
                          <tr key={item.retirementAge} className={item.retirementAge === retirementAge ? 'bg-blue-50/70 dark:bg-blue-950/40 font-bold' : ''}>
                            <td className="py-2 px-3">Age {item.retirementAge}</td>
                            <td className="py-2 px-3">{fmt(item.modeledMonthlyExpenseAtRetirement)}/mo</td>
                            <td className="py-2 px-3 text-blue-600 dark:text-blue-400">{fmt(item.requiredCorpus)}</td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{fmt(item.requiredMonthlySip)}/mo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Goal Income Ladder */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Target Monthly Income Goal Ladder
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="py-2 px-3">Target Income Today</th>
                          <th className="py-2 px-3">Expense at Age {retirementAge}</th>
                          <th className="py-2 px-3">Required Corpus</th>
                          <th className="py-2 px-3 text-right">Required Monthly SIP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {engineResults.goalIncomeLadder.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold">{fmt(item.targetMonthlyIncomeToday)}/mo</td>
                            <td className="py-2 px-3 text-slate-600">{fmt(item.modeledMonthlyExpenseAtRetirement)}/mo</td>
                            <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-bold">{fmt(item.requiredCorpusAtRetirement)}</td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{fmt(item.requiredMonthlySipToday)}/mo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: MONTE CARLO & SEQUENCE RISK */}
            {activeTab === 'monte_carlo' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" /> Monte Carlo Probabilistic Risk Simulator
                  </h3>
                  <p className="text-xs text-slate-500">
                    500 randomized market volatility trials testing sequence-of-returns risk during retirement.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase">PROBABILISTIC SURVIVAL RATE</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                      500 Market Trials
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-400">
                    {engineResults.monteCarloResults.survivalProbability}%
                  </div>
                  <p className="text-xs text-slate-300">
                    {engineResults.monteCarloResults.sequenceRiskAlert}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border text-center">
                    <div className="text-[10px] text-slate-500 font-semibold">10th Percentile (Bear)</div>
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                      {fmt(engineResults.monteCarloResults.percentile10EndingCorpus)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border text-center">
                    <div className="text-[10px] text-slate-500 font-semibold">Median Outcome</div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {fmt(engineResults.monteCarloResults.medianEndingCorpus)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border text-center">
                    <div className="text-[10px] text-slate-500 font-semibold">90th Percentile (Bull)</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {fmt(engineResults.monteCarloResults.percentile90EndingCorpus)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: ASSUMPTIONS MATRIX */}
            {activeTab === 'assumptions' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> Full Calculation Traceability Matrix
                  </h3>
                  <p className="text-xs text-slate-500">All underlying parameters powering this engine.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border">
                    <div className="font-bold text-slate-900 dark:text-white">Accumulation Parameters</div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Current Age:</span> <span>{currentAge}</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Retirement Age:</span> <span>{retirementAge}</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Accumulation Return:</span> <span>{preRetirementReturn}%</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>SIP Annual Step-Up:</span> <span>{annualStepUp}%</span></div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border">
                    <div className="font-bold text-slate-900 dark:text-white">Retirement Parameters</div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Life Expectancy:</span> <span>{lifeExpectancy}</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>General Inflation:</span> <span>{generalInflation}%</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Medical Inflation:</span> <span>{healthcareInflation}%</span></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Post-Ret Return:</span> <span>{postRetirementReturn}%</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
