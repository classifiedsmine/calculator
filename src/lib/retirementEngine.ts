/**
 * Advanced Dual-Phase Retirement Corpus, Pension & Drawdown Engine
 *
 * Implements a complete retirement model:
 * Phase 1: Accumulation Phase (Current Age -> Retirement Age)
 * Phase 2: Retirement & Drawdown Phase (Retirement Age -> Life Expectancy)
 *
 * Handles:
 * - Asset class breakdowns (EPF, PPF, NPS, Mutual Funds, Cash/FDs)
 * - Step-up investment escalation
 * - Essential vs Discretionary spending breakdown + Healthcare Inflation
 * - Today's Money vs Future Purchasing Power conversions
 * - Pension & Guaranteed Income offsets
 * - Withdrawal strategies (SWP Inflation-Adjusted, Fixed Nominal, Portfolio %, Multi-Phase)
 * - Solvers for Readiness Gap, Extra Monthly SIP required, Extra Work Years
 * - Retirement Age & Goal Income Ladders
 * - Scenario Analysis & Monte Carlo / Sequence-of-returns stress testing
 * - Tax & Post-Tax Real Yield Engine (SWP Tax Efficiency vs. Slabs)
 * - NPS 60:40 Annuity Split Engine (40% mandatory annuity + 60% lump sum SWP)
 * - 3-Bucket Strategy Allocator (Bucket 1: Cash/FD 0-3 yrs, Bucket 2: Debt/Hybrid 4-10 yrs, Bucket 3: Equity 10+ yrs)
 * - Medical Emergency Shock Simulator (e.g. ₹20 Lakh shock at age 75)
 * - Retirement Health Index Score (0-100 Gauge)
 */

export interface AssetBreakdownInputs {
  epf: number;
  ppf: number;
  nps: number;
  mutualFunds: number;
  fixedDeposits: number;
  cashOther: number;
}

export interface ExpenseBreakdownInputs {
  essentialHousing: number;
  essentialFood: number;
  essentialUtilities: number;
  essentialHealthcare: number;
  discretionaryTravel: number;
  discretionaryLifestyle: number;
  discretionaryHobbies: number;
  discretionaryOther: number;
}

export interface MedicalShockInputs {
  enabled: boolean;
  shockAge: number; // e.g. 75
  shockAmountToday: number; // e.g. 2,000,000 (20 Lakhs)
}

export interface NpsAnnuityInputs {
  enabled: boolean;
  annuityPercent: number; // e.g. 40% (mandatory minimum)
  annuityRate: number; // e.g. 6.5% p.a. guaranteed
}

export interface RetirementEngineInputs {
  mode?: 'plan' | 'target_income' | 'longevity' | 'age_ladder' | 'income_ladder' | 'asset_breakdown' | 'monte_carlo';
  currentAge: number; // e.g. 35
  retirementAge: number; // e.g. 60
  lifeExpectancy: number; // e.g. 90
  
  // Phase 1 Accumulation Inputs
  currentSavings: number; // total existing savings
  assetBreakdown?: AssetBreakdownInputs;
  monthlySip: number; // current monthly investment
  employerContribution?: number; // monthly employer pension/EPF match
  annualStepUp: number; // percentage annual step-up in SIP e.g. 10%
  preRetirementReturn: number; // expected return % p.a. e.g. 11%

  // Phase 2 Retirement Expense Inputs
  expenseBreakdown?: ExpenseBreakdownInputs;
  customTotalMonthlyExpense?: number; // override if non-zero
  generalInflation: number; // e.g. 6%
  healthcareInflation: number; // e.g. 8%
  postRetirementReturn: number; // e.g. 7.5%
  
  // Income & Pension Offsets
  pensionIncome: number; // monthly pension starting at retirement
  otherGuaranteedIncome: number; // other monthly guaranteed cash flow
  
  // Withdrawal Strategy
  withdrawalStrategy?: 'swp_inflation_adjusted' | 'fixed_nominal' | 'percentage_portfolio' | 'three_phase_spending';
  percentageWithdrawalRate?: number; // for percentage strategy (e.g. 4%)
  threePhaseFactors?: {
    earlyPhaseFactor: number; // Age retirement to retirement + 10 (e.g. 1.15)
    middlePhaseFactor: number; // Age + 10 to +20 (e.g. 0.90)
    latePhaseFactor: number; // Age + 20 onwards (e.g. 1.05)
  };

  // Advanced Pro Features
  npsAnnuitySplit?: NpsAnnuityInputs;
  medicalShock?: MedicalShockInputs;
  enablePostTaxSwpMode?: boolean; // LTCG 12.5% taxation on SWP gains
  targetMonthlyIncomeToday?: number;
}

export interface AccumulationYearData {
  age: number;
  year: number;
  startBalance: number;
  monthlySip: number;
  annualContributions: number;
  investmentReturns: number;
  endBalance: number;
  cumulativeContributions: number;
  cumulativeReturns: number;
}

export interface AssetProjectionData {
  assetName: string;
  category: 'EPF' | 'PPF' | 'NPS' | 'Mutual Funds' | 'Fixed Deposits' | 'Cash / Other';
  currentValue: number;
  projectedValueAtRetirement: number;
  shareOfTotal: number;
}

export interface DrawdownYearData {
  age: number;
  year: number;
  startBalance: number;
  monthlyExpenses: number;
  annualExpenses: number;
  monthlyPensionIncome: number;
  monthlyAnnuityIncome: number;
  annualPensionIncome: number;
  medicalShockAmount: number;
  netAnnualWithdrawal: number;
  taxPaidInSwp: number;
  investmentReturns: number;
  endBalance: number;
  isDepleted: boolean;
  realPurchasingPowerRemaining: number;
}

export interface BucketAllocation {
  bucket1CashFd: { amount: number; percent: number; yearsCovered: number };
  bucket2DebtHybrid: { amount: number; percent: number; yearsCovered: number };
  bucket3EquityGrowth: { amount: number; percent: number; yearsCovered: number };
}

export interface AgeLadderItem {
  retirementAge: number;
  yearsToRetirement: number;
  retirementDuration: number;
  modeledMonthlyExpenseAtRetirement: number;
  requiredCorpus: number;
  projectedCorpus: number;
  requiredMonthlySip: number;
  isSufficient: boolean;
}

export interface GoalIncomeLadderItem {
  targetMonthlyIncomeToday: number;
  modeledMonthlyExpenseAtRetirement: number;
  requiredCorpusAtRetirement: number;
  requiredMonthlySipToday: number;
}

export interface MonteCarloSummary {
  survivalProbability: number;
  medianEndingCorpus: number;
  percentile10EndingCorpus: number;
  percentile90EndingCorpus: number;
  sequenceRiskAlert: string;
}

export interface RetirementHealthScore {
  score: number; // 0 to 100
  label: 'Critical Deficit' | 'At Risk' | 'On Track' | 'Bulletproof';
  color: string;
  reasons: string[];
}

export interface RetirementEngineOutputs {
  // Expense Summaries
  todayEssentialExpense: number;
  todayDiscretionaryExpense: number;
  todayTotalMonthlyExpense: number;
  modeledMonthlyExpenseAtRetirement: number;
  pensionAndGuaranteedIncome: number;
  npsAnnuityMonthlyIncome: number;
  netMonthlyPortfolioIncomeGapAtRetirement: number;

  // Primary Corpus & Readiness Metrics
  requiredCorpus: number;
  projectedCorpus: number;
  readinessGap: number; // projected - required
  isCorpusSufficient: boolean;
  additionalMonthlySipRequired: number;
  additionalAccumulationYearsRequired: number;

  // Real Purchasing Power (Today's Money)
  realPurchasingPowerRequiredCorpus: number;
  realPurchasingPowerProjectedCorpus: number;

  // Timelines
  accumulationTimeline: AccumulationYearData[];
  drawdownTimeline: DrawdownYearData[];
  assetBreakdownProjections: AssetProjectionData[];

  // Advanced Pro Features Output
  bucketAllocation: BucketAllocation;
  npsSplitSummary: {
    totalNpsAtRetirement: number;
    annuityLumpSum40: number;
    swpPortfolio60: number;
    monthlyAnnuityPayout: number;
  };
  medicalShockSummary: {
    applied: boolean;
    shockAge: number;
    shockAmountAtAge: number;
    didCorpusSurviveShock: boolean;
  };
  postTaxSwpSummary: {
    totalEstimatedLtcgTaxPaid: number;
    effectiveTaxRateOnWithdrawals: number;
  };
  healthScore: RetirementHealthScore;

  // Longevity & Depletion
  corpusDepletionAge: number | null;
  yearsCorpusWillLast: number;

  // Ladders & Solvers
  retirementAgeLadder: AgeLadderItem[];
  goalIncomeLadder: GoalIncomeLadderItem[];

  // Scenario Analysis
  scenarioAnalysis: {
    conservative: { preReturn: number; postReturn: number; projectedCorpus: number; requiredCorpus: number; gap: number };
    base: { preReturn: number; postReturn: number; projectedCorpus: number; requiredCorpus: number; gap: number };
    aggressive: { preReturn: number; postReturn: number; projectedCorpus: number; requiredCorpus: number; gap: number };
  };

  // Monte Carlo & Sequence Risk
  monteCarloResults: MonteCarloSummary;
}

/**
 * Calculates present value of an annuity with growing expenses at retirement
 */
function calculateRequiredCorpusAtRetirement(
  monthlyIncomeGapAtRetirement: number,
  retirementDurationYears: number,
  postRetirementReturnPct: number,
  generalInflationPct: number,
  withdrawalStrategy: 'swp_inflation_adjusted' | 'fixed_nominal' | 'percentage_portfolio' | 'three_phase_spending',
  percentageWithdrawalRate: number = 4,
  threePhaseFactors = { earlyPhaseFactor: 1.15, middlePhaseFactor: 0.90, latePhaseFactor: 1.05 }
): number {
  if (monthlyIncomeGapAtRetirement <= 0) return 0;

  const rMonthly = Math.pow(1 + postRetirementReturnPct / 100, 1 / 12) - 1;

  if (withdrawalStrategy === 'percentage_portfolio') {
    const annualGap = monthlyIncomeGapAtRetirement * 12;
    return annualGap / (percentageWithdrawalRate / 100);
  }

  let corpus = 0;
  let currentMonthlyWithdrawal = monthlyIncomeGapAtRetirement;
  const totalMonths = Math.max(1, Math.round(retirementDurationYears * 12));

  if (withdrawalStrategy === 'fixed_nominal') {
    for (let m = totalMonths; m >= 1; m--) {
      corpus = (corpus + currentMonthlyWithdrawal) / (1 + rMonthly);
    }
    return Math.max(0, corpus);
  }

  // SWP Inflation-Adjusted & Three-Phase Strategy
  let monthByMonthWithdrawals: number[] = [];
  for (let m = 0; m < totalMonths; m++) {
    const yearIndex = Math.floor(m / 12);
    let inflationFactor = Math.pow(1 + generalInflationPct / 100, yearIndex);
    let phaseMultiplier = 1.0;

    if (withdrawalStrategy === 'three_phase_spending') {
      if (yearIndex < 10) phaseMultiplier = threePhaseFactors.earlyPhaseFactor;
      else if (yearIndex < 20) phaseMultiplier = threePhaseFactors.middlePhaseFactor;
      else phaseMultiplier = threePhaseFactors.latePhaseFactor;
    }

    const w = monthlyIncomeGapAtRetirement * inflationFactor * phaseMultiplier;
    monthByMonthWithdrawals.push(w);
  }

  let requiredPV = 0;
  for (let m = totalMonths - 1; m >= 0; m--) {
    requiredPV = (requiredPV + monthByMonthWithdrawals[m]) / (1 + rMonthly);
  }

  return Math.max(0, requiredPV);
}

/**
 * Calculates projected corpus at retirement
 */
function runAccumulationSimulation(
  currentAge: number,
  retirementAge: number,
  currentSavings: number,
  monthlySip: number,
  annualStepUpPct: number,
  preRetirementReturnPct: number,
  employerContribution: number = 0
): { projectedCorpus: number; timeline: AccumulationYearData[] } {
  const years = Math.max(1, retirementAge - currentAge);
  const monthlyReturn = Math.pow(1 + preRetirementReturnPct / 100, 1 / 12) - 1;

  let balance = currentSavings;
  let currentMonthlyContribution = monthlySip + employerContribution;
  let cumulativeContrib = currentSavings;
  const timeline: AccumulationYearData[] = [];

  for (let y = 1; y <= years; y++) {
    const startBal = balance;
    let yearContrib = 0;

    for (let m = 1; m <= 12; m++) {
      balance += currentMonthlyContribution;
      yearContrib += currentMonthlyContribution;
      const interestMonth = balance * monthlyReturn;
      balance += interestMonth;
    }

    const returnsInYear = balance - startBal - yearContrib;
    cumulativeContrib += yearContrib;

    timeline.push({
      age: currentAge + y,
      year: y,
      startBalance: Math.round(startBal),
      monthlySip: Math.round(currentMonthlyContribution),
      annualContributions: Math.round(yearContrib),
      investmentReturns: Math.round(returnsInYear),
      endBalance: Math.round(balance),
      cumulativeContributions: Math.round(cumulativeContrib),
      cumulativeReturns: Math.round(Math.max(0, balance - cumulativeContrib)),
    });

    currentMonthlyContribution = currentMonthlyContribution * (1 + annualStepUpPct / 100);
  }

  return { projectedCorpus: Math.round(balance), timeline };
}

/**
 * Solves for required initial monthly SIP
 */
function solveRequiredMonthlySip(
  currentAge: number,
  retirementAge: number,
  currentSavings: number,
  targetCorpus: number,
  annualStepUpPct: number,
  preRetirementReturnPct: number,
  employerContribution: number = 0
): number {
  const years = Math.max(1, retirementAge - currentAge);
  if (years <= 0) return 0;

  const savingsFutureValue = currentSavings * Math.pow(1 + preRetirementReturnPct / 100, years);
  const remainingTarget = targetCorpus - savingsFutureValue;
  if (remainingTarget <= 0) return 0;

  let low = 0;
  let high = remainingTarget / 12;
  let bestSip = high;

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const sim = runAccumulationSimulation(
      currentAge,
      retirementAge,
      currentSavings,
      mid,
      annualStepUpPct,
      preRetirementReturnPct,
      employerContribution
    );

    if (sim.projectedCorpus >= targetCorpus) {
      bestSip = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(bestSip);
}

/**
 * Computes Retirement Health Score (0-100)
 */
function computeHealthScore(
  projectedCorpus: number,
  requiredCorpus: number,
  survivalProb: number,
  yearsCorpusLasts: number,
  targetDuration: number,
  stepUp: number
): RetirementHealthScore {
  const coverageRatio = requiredCorpus > 0 ? projectedCorpus / requiredCorpus : 1;
  let score = 0;
  const reasons: string[] = [];

  // Coverage ratio component (up to 50 pts)
  if (coverageRatio >= 1.2) {
    score += 50;
    reasons.push('Corpus has a 20%+ surplus reserve');
  } else if (coverageRatio >= 1.0) {
    score += 42;
    reasons.push('Projected corpus fully meets 100% required target');
  } else if (coverageRatio >= 0.75) {
    score += 28;
    reasons.push('Minor deficit gap present (75%-99% funded)');
  } else {
    score += 10;
    reasons.push('Significant readiness deficit (<75% funded)');
  }

  // Survival & Duration component (up to 30 pts)
  if (yearsCorpusLasts >= targetDuration) {
    score += 30;
    reasons.push(`Portfolio lasts full ${targetDuration} years through life expectancy`);
  } else if (yearsCorpusLasts >= targetDuration - 5) {
    score += 18;
    reasons.push(`Portfolio covers most of retirement (${yearsCorpusLasts} / ${targetDuration} years)`);
  } else {
    score += 5;
    reasons.push(`Portfolio depletes early (${yearsCorpusLasts} years)`);
  }

  // Monte Carlo Probability component (up to 15 pts)
  if (survivalProb >= 85) {
    score += 15;
    reasons.push('Low sequence-of-returns market risk (>85% trial survival)');
  } else if (survivalProb >= 65) {
    score += 10;
    reasons.push('Moderate sequence risk (65%-84% trial survival)');
  } else {
    score += 2;
    reasons.push('High sequence risk under bad market cycles');
  }

  // Step-up Discipline component (up to 5 pts)
  if (stepUp >= 8) {
    score += 5;
    reasons.push('Strong annual contribution step-up discipline (>=8%)');
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let label: RetirementHealthScore['label'] = 'On Track';
  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (score >= 85) {
    label = 'Bulletproof';
    color = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300';
  } else if (score >= 65) {
    label = 'On Track';
    color = 'text-blue-700 bg-blue-100 dark:bg-blue-950/60 border-blue-300';
  } else if (score >= 45) {
    label = 'At Risk';
    color = 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 border-amber-300';
  } else {
    label = 'Critical Deficit';
    color = 'text-rose-700 bg-rose-100 dark:bg-rose-950/60 border-rose-300';
  }

  return { score, label, color, reasons };
}

/**
 * Executes the full dual-phase Retirement Projection Engine
 */
export function runRetirementEngine(inputs: RetirementEngineInputs): RetirementEngineOutputs {
  const currentAge = Math.max(18, inputs.currentAge);
  const retirementAge = Math.max(currentAge + 1, inputs.retirementAge);
  const lifeExpectancy = Math.max(retirementAge + 1, inputs.lifeExpectancy);
  const yearsToRetirement = retirementAge - currentAge;
  const retirementDurationYears = lifeExpectancy - retirementAge;

  // 1. Calculate Expenses Breakdown
  const eb = inputs.expenseBreakdown || {
    essentialHousing: 18000,
    essentialFood: 15000,
    essentialUtilities: 7000,
    essentialHealthcare: 5000,
    discretionaryTravel: 8000,
    discretionaryLifestyle: 5000,
    discretionaryHobbies: 2000,
    discretionaryOther: 0,
  };

  const todayEssential = eb.essentialHousing + eb.essentialFood + eb.essentialUtilities + eb.essentialHealthcare;
  const todayDiscretionary = eb.discretionaryTravel + eb.discretionaryLifestyle + eb.discretionaryHobbies + eb.discretionaryOther;
  const defaultTotalExpense = todayEssential + todayDiscretionary;

  const todayTotalMonthlyExpense =
    inputs.customTotalMonthlyExpense && inputs.customTotalMonthlyExpense > 0
      ? inputs.customTotalMonthlyExpense
      : defaultTotalExpense;

  const nonHealthcareExpense = Math.max(0, todayTotalMonthlyExpense - eb.essentialHealthcare);
  const generalInf = inputs.generalInflation / 100;
  const healthInf = inputs.healthcareInflation / 100;

  const nonHealthAtRetirement = nonHealthcareExpense * Math.pow(1 + generalInf, yearsToRetirement);
  const healthAtRetirement = eb.essentialHealthcare * Math.pow(1 + healthInf, yearsToRetirement);
  const modeledMonthlyExpenseAtRetirement = Math.round(nonHealthAtRetirement + healthAtRetirement);

  // 2. Asset Breakdown Projections & NPS Annuity Split
  const ab = inputs.assetBreakdown || {
    epf: inputs.currentSavings * 0.35,
    ppf: inputs.currentSavings * 0.15,
    nps: inputs.currentSavings * 0.15,
    mutualFunds: inputs.currentSavings * 0.25,
    fixedDeposits: inputs.currentSavings * 0.05,
    cashOther: inputs.currentSavings * 0.05,
  };

  const assetReturnsMap = {
    EPF: 8.15,
    PPF: 7.1,
    NPS: 10.0,
    'Mutual Funds': inputs.preRetirementReturn,
    'Fixed Deposits': 6.8,
    'Cash / Other': 4.0,
  };

  const assetList: { name: string; category: AssetProjectionData['category']; val: number; returnRate: number }[] = [
    { name: 'EPF (Employee Provident Fund)', category: 'EPF', val: ab.epf, returnRate: assetReturnsMap.EPF },
    { name: 'PPF (Public Provident Fund)', category: 'PPF', val: ab.ppf, returnRate: assetReturnsMap.PPF },
    { name: 'NPS (National Pension Scheme)', category: 'NPS', val: ab.nps, returnRate: assetReturnsMap.NPS },
    { name: 'Equity & Mutual Funds', category: 'Mutual Funds', val: ab.mutualFunds, returnRate: assetReturnsMap['Mutual Funds'] },
    { name: 'Fixed Deposits & Bonds', category: 'Fixed Deposits', val: ab.fixedDeposits, returnRate: assetReturnsMap['Fixed Deposits'] },
    { name: 'Cash & Liquid Savings', category: 'Cash / Other', val: ab.cashOther, returnRate: assetReturnsMap['Cash / Other'] },
  ];

  const totalCurrentAssetVal = assetList.reduce((acc, a) => acc + a.val, 0);
  const assetBreakdownProjections: AssetProjectionData[] = assetList.map((a) => {
    const proj = a.val * Math.pow(1 + a.returnRate / 100, yearsToRetirement);
    return {
      assetName: a.name,
      category: a.category,
      currentValue: Math.round(a.val),
      projectedValueAtRetirement: Math.round(proj),
      shareOfTotal: totalCurrentAssetVal > 0 ? (a.val / totalCurrentAssetVal) * 100 : 0,
    };
  });

  // NPS 60:40 Annuity Split Calculation
  const npsProjectionObj = assetBreakdownProjections.find((a) => a.category === 'NPS');
  const totalNpsAtRetirement = npsProjectionObj ? npsProjectionObj.projectedValueAtRetirement : 0;
  
  const npsConfig = inputs.npsAnnuitySplit || { enabled: true, annuityPercent: 40, annuityRate: 6.5 };
  let npsAnnuityMonthlyIncome = 0;
  let annuityLumpSum40 = 0;
  let swpPortfolio60 = totalNpsAtRetirement;

  if (npsConfig.enabled && totalNpsAtRetirement > 0) {
    const pct = Math.min(100, Math.max(20, npsConfig.annuityPercent)) / 100;
    annuityLumpSum40 = Math.round(totalNpsAtRetirement * pct);
    swpPortfolio60 = totalNpsAtRetirement - annuityLumpSum40;
    const annualAnnuity = annuityLumpSum40 * (npsConfig.annuityRate / 100);
    npsAnnuityMonthlyIncome = Math.round(annualAnnuity / 12);
  }

  const pensionAndGuaranteedIncome = Math.round(
    (inputs.pensionIncome || 0) + (inputs.otherGuaranteedIncome || 0)
  );

  const totalMonthlyGuaranteedIncome = pensionAndGuaranteedIncome + npsAnnuityMonthlyIncome;

  const netMonthlyPortfolioIncomeGapAtRetirement = Math.max(
    0,
    modeledMonthlyExpenseAtRetirement - totalMonthlyGuaranteedIncome
  );

  // 3. Required Corpus Calculation
  const withdrawalStrat = inputs.withdrawalStrategy || 'swp_inflation_adjusted';
  const requiredCorpus = Math.round(
    calculateRequiredCorpusAtRetirement(
      netMonthlyPortfolioIncomeGapAtRetirement,
      retirementDurationYears,
      inputs.postRetirementReturn,
      inputs.generalInflation,
      withdrawalStrat,
      inputs.percentageWithdrawalRate || 4,
      inputs.threePhaseFactors
    )
  );

  // 4. Run Accumulation Simulation (Phase 1)
  const accumulation = runAccumulationSimulation(
    currentAge,
    retirementAge,
    inputs.currentSavings,
    inputs.monthlySip,
    inputs.annualStepUp,
    inputs.preRetirementReturn,
    inputs.employerContribution || 0
  );

  const projectedCorpus = accumulation.projectedCorpus;
  const readinessGap = projectedCorpus - requiredCorpus;
  const isCorpusSufficient = readinessGap >= 0;

  let additionalMonthlySipRequired = 0;
  if (!isCorpusSufficient) {
    additionalMonthlySipRequired = solveRequiredMonthlySip(
      currentAge,
      retirementAge,
      inputs.currentSavings,
      requiredCorpus,
      inputs.annualStepUp,
      inputs.preRetirementReturn,
      inputs.employerContribution || 0
    ) - inputs.monthlySip;

    if (additionalMonthlySipRequired < 0) additionalMonthlySipRequired = 0;
  }

  let additionalAccumulationYearsRequired = 0;
  if (!isCorpusSufficient) {
    for (let extraY = 1; extraY <= 15; extraY++) {
      const testRetAge = retirementAge + extraY;
      const testSim = runAccumulationSimulation(
        currentAge,
        testRetAge,
        inputs.currentSavings,
        inputs.monthlySip,
        inputs.annualStepUp,
        inputs.preRetirementReturn,
        inputs.employerContribution || 0
      );
      if (testSim.projectedCorpus >= requiredCorpus) {
        additionalAccumulationYearsRequired = extraY;
        break;
      }
    }
  }

  const cumulativeInflationFactor = Math.pow(1 + generalInf, yearsToRetirement);
  const realPurchasingPowerRequiredCorpus = Math.round(requiredCorpus / cumulativeInflationFactor);
  const realPurchasingPowerProjectedCorpus = Math.round(projectedCorpus / cumulativeInflationFactor);

  // 5. Drawdown Timeline Simulation with Medical Shock & Post-Tax SWP LTCG
  const drawdownTimeline: DrawdownYearData[] = [];
  let currentCorpusBalance = projectedCorpus;
  let corpusDepletionAge: number | null = null;
  const postReturnMonthly = Math.pow(1 + inputs.postRetirementReturn / 100, 1 / 12) - 1;

  const medicalShockConfig = inputs.medicalShock || { enabled: false, shockAge: 75, shockAmountToday: 2000000 };
  let totalLtcgTaxPaid = 0;
  let totalWithdrawalCumulative = 0;

  for (let y = 1; y <= retirementDurationYears; y++) {
    const ageAtYear = retirementAge + y;
    const startBal = currentCorpusBalance;

    if (startBal <= 0) {
      if (corpusDepletionAge === null) corpusDepletionAge = ageAtYear - 1;
      drawdownTimeline.push({
        age: ageAtYear,
        year: y,
        startBalance: 0,
        monthlyExpenses: 0,
        annualExpenses: 0,
        monthlyPensionIncome: 0,
        monthlyAnnuityIncome: 0,
        annualPensionIncome: 0,
        medicalShockAmount: 0,
        netAnnualWithdrawal: 0,
        taxPaidInSwp: 0,
        investmentReturns: 0,
        endBalance: 0,
        isDepleted: true,
        realPurchasingPowerRemaining: 0,
      });
      continue;
    }

    const inflationYearsFromRetirement = y - 1;
    let yearPhaseFactor = 1.0;
    if (withdrawalStrat === 'three_phase_spending') {
      if (inflationYearsFromRetirement < 10) yearPhaseFactor = inputs.threePhaseFactors?.earlyPhaseFactor || 1.15;
      else if (inflationYearsFromRetirement < 20) yearPhaseFactor = inputs.threePhaseFactors?.middlePhaseFactor || 0.90;
      else yearPhaseFactor = inputs.threePhaseFactors?.latePhaseFactor || 1.05;
    }

    const yearMonthlyExpense =
      modeledMonthlyExpenseAtRetirement *
      Math.pow(1 + generalInf, inflationYearsFromRetirement) *
      yearPhaseFactor;

    const yearMonthlyGuaranteed = totalMonthlyGuaranteedIncome;
    let yearMonthlyWithdrawal = Math.max(0, yearMonthlyExpense - yearMonthlyGuaranteed);

    if (withdrawalStrat === 'fixed_nominal') {
      yearMonthlyWithdrawal = netMonthlyPortfolioIncomeGapAtRetirement;
    } else if (withdrawalStrat === 'percentage_portfolio') {
      const pct = (inputs.percentageWithdrawalRate || 4) / 100;
      yearMonthlyWithdrawal = (startBal * pct) / 12;
    }

    let yearMedicalShock = 0;
    if (medicalShockConfig.enabled && ageAtYear === medicalShockConfig.shockAge) {
      const shockInflationFactor = Math.pow(1 + healthInf, yearsToRetirement + y);
      yearMedicalShock = Math.round(medicalShockConfig.shockAmountToday * shockInflationFactor);
    }

    let totalWithdrawalInYear = yearMedicalShock;
    let tempBal = startBal - yearMedicalShock;

    for (let m = 1; m <= 12; m++) {
      if (tempBal <= 0) break;
      tempBal -= yearMonthlyWithdrawal;
      totalWithdrawalInYear += yearMonthlyWithdrawal;
      if (tempBal > 0) {
        tempBal += tempBal * postReturnMonthly;
      }
    }

    // Tax Engine: Equity SWP LTCG (12.5% tax on gain component above threshold)
    let taxInYear = 0;
    if (inputs.enablePostTaxSwpMode && totalWithdrawalInYear > 0) {
      const gainRatio = Math.max(0.2, (projectedCorpus - inputs.currentSavings) / (projectedCorpus || 1));
      const taxableGains = Math.max(0, totalWithdrawalInYear * gainRatio - 125000);
      taxInYear = Math.round(taxableGains * 0.125);
      tempBal = Math.max(0, tempBal - taxInYear);
    }

    totalLtcgTaxPaid += taxInYear;
    totalWithdrawalCumulative += totalWithdrawalInYear;

    const returnsInYear = tempBal - (startBal - totalWithdrawalInYear - taxInYear);
    currentCorpusBalance = Math.max(0, Math.round(tempBal));

    const totalInflationFromToday = Math.pow(1 + generalInf, yearsToRetirement + y);
    const realRemaining = Math.round(currentCorpusBalance / totalInflationFromToday);

    if (currentCorpusBalance <= 0 && corpusDepletionAge === null) {
      corpusDepletionAge = ageAtYear;
    }

    drawdownTimeline.push({
      age: ageAtYear,
      year: y,
      startBalance: Math.round(startBal),
      monthlyExpenses: Math.round(yearMonthlyExpense),
      annualExpenses: Math.round(yearMonthlyExpense * 12),
      monthlyPensionIncome: Math.round(pensionAndGuaranteedIncome),
      monthlyAnnuityIncome: Math.round(npsAnnuityMonthlyIncome),
      annualPensionIncome: Math.round(totalMonthlyGuaranteedIncome * 12),
      medicalShockAmount: yearMedicalShock,
      netAnnualWithdrawal: Math.round(totalWithdrawalInYear),
      taxPaidInSwp: taxInYear,
      investmentReturns: Math.round(returnsInYear),
      endBalance: currentCorpusBalance,
      isDepleted: currentCorpusBalance <= 0,
      realPurchasingPowerRemaining: realRemaining,
    });
  }

  const yearsCorpusWillLast = corpusDepletionAge
    ? corpusDepletionAge - retirementAge
    : retirementDurationYears;

  // 6. 3-Bucket Allocator Strategy
  const annualNetGapAtRetirement = netMonthlyPortfolioIncomeGapAtRetirement * 12;
  const bucket1Amount = Math.min(projectedCorpus, Math.round(annualNetGapAtRetirement * 3)); // 3 years cash
  const bucket2Amount = Math.min(projectedCorpus - bucket1Amount, Math.round(annualNetGapAtRetirement * 7)); // 7 years debt
  const bucket3Amount = Math.max(0, projectedCorpus - bucket1Amount - bucket2Amount); // Equity growth

  const bucketAllocation: BucketAllocation = {
    bucket1CashFd: {
      amount: bucket1Amount,
      percent: Math.round((bucket1Amount / (projectedCorpus || 1)) * 100),
      yearsCovered: 3,
    },
    bucket2DebtHybrid: {
      amount: bucket2Amount,
      percent: Math.round((bucket2Amount / (projectedCorpus || 1)) * 100),
      yearsCovered: 7,
    },
    bucket3EquityGrowth: {
      amount: bucket3Amount,
      percent: Math.round((bucket3Amount / (projectedCorpus || 1)) * 100),
      yearsCovered: Math.max(0, Math.round((bucket3Amount / (annualNetGapAtRetirement || 1)))),
    },
  };

  // 7. Retirement Age Ladder (Ages 50, 55, 60, 65, 70)
  const targetRetirementAges = [50, 55, 60, 65, 70].filter((a) => a > currentAge);
  const retirementAgeLadder: AgeLadderItem[] = targetRetirementAges.map((retAge) => {
    const dur = lifeExpectancy - retAge;
    const yrsTo = retAge - currentAge;
    const expAtRet = Math.round(
      nonHealthcareExpense * Math.pow(1 + generalInf, yrsTo) +
        eb.essentialHealthcare * Math.pow(1 + healthInf, yrsTo)
    );
    const netGap = Math.max(0, expAtRet - totalMonthlyGuaranteedIncome);
    const reqCorpus = Math.round(
      calculateRequiredCorpusAtRetirement(
        netGap,
        dur,
        inputs.postRetirementReturn,
        inputs.generalInflation,
        withdrawalStrat
      )
    );

    const accumSim = runAccumulationSimulation(
      currentAge,
      retAge,
      inputs.currentSavings,
      inputs.monthlySip,
      inputs.annualStepUp,
      inputs.preRetirementReturn,
      inputs.employerContribution || 0
    );

    const reqSip = solveRequiredMonthlySip(
      currentAge,
      retAge,
      inputs.currentSavings,
      reqCorpus,
      inputs.annualStepUp,
      inputs.preRetirementReturn,
      inputs.employerContribution || 0
    );

    return {
      retirementAge: retAge,
      yearsToRetirement: yrsTo,
      retirementDuration: dur,
      modeledMonthlyExpenseAtRetirement: expAtRet,
      requiredCorpus: reqCorpus,
      projectedCorpus: accumSim.projectedCorpus,
      requiredMonthlySip: reqSip,
      isSufficient: accumSim.projectedCorpus >= reqCorpus,
    };
  });

  // 8. Goal Income Ladder (₹50K, ₹75K, ₹1L, ₹1.5L, ₹2L, ₹3L/mo)
  const incomeTargets = [50000, 75000, 100000, 150000, 200000, 300000];
  const goalIncomeLadder: GoalIncomeLadderItem[] = incomeTargets.map((incToday) => {
    const expAtRet = Math.round(incToday * Math.pow(1 + generalInf, yearsToRetirement));
    const netGap = Math.max(0, expAtRet - totalMonthlyGuaranteedIncome);
    const reqCorpus = Math.round(
      calculateRequiredCorpusAtRetirement(
        netGap,
        retirementDurationYears,
        inputs.postRetirementReturn,
        inputs.generalInflation,
        withdrawalStrat
      )
    );
    const reqSip = solveRequiredMonthlySip(
      currentAge,
      retirementAge,
      inputs.currentSavings,
      reqCorpus,
      inputs.annualStepUp,
      inputs.preRetirementReturn,
      inputs.employerContribution || 0
    );

    return {
      targetMonthlyIncomeToday: incToday,
      modeledMonthlyExpenseAtRetirement: expAtRet,
      requiredCorpusAtRetirement: reqCorpus,
      requiredMonthlySipToday: reqSip,
    };
  });

  // 9. Scenario Analysis (Conservative, Base, Aggressive)
  const runScenario = (preR: number, postR: number) => {
    const req = Math.round(
      calculateRequiredCorpusAtRetirement(
        netMonthlyPortfolioIncomeGapAtRetirement,
        retirementDurationYears,
        postR,
        inputs.generalInflation,
        withdrawalStrat
      )
    );
    const proj = runAccumulationSimulation(
      currentAge,
      retirementAge,
      inputs.currentSavings,
      inputs.monthlySip,
      inputs.annualStepUp,
      preR,
      inputs.employerContribution || 0
    ).projectedCorpus;
    return { preReturn: preR, postReturn: postR, projectedCorpus: proj, requiredCorpus: req, gap: proj - req };
  };

  const scenarioAnalysis = {
    conservative: runScenario(inputs.preRetirementReturn - 2.5, inputs.postRetirementReturn - 1.5),
    base: runScenario(inputs.preRetirementReturn, inputs.postRetirementReturn),
    aggressive: runScenario(inputs.preRetirementReturn + 2.5, inputs.postRetirementReturn + 1.5),
  };

  // 10. Monte Carlo & Sequence Risk
  const monteCarloResults = runRetirementMonteCarlo(
    projectedCorpus,
    netMonthlyPortfolioIncomeGapAtRetirement,
    retirementDurationYears,
    inputs.postRetirementReturn,
    inputs.generalInflation,
    withdrawalStrat
  );

  // 11. Health Score
  const healthScore = computeHealthScore(
    projectedCorpus,
    requiredCorpus,
    monteCarloResults.survivalProbability,
    yearsCorpusWillLast,
    retirementDurationYears,
    inputs.annualStepUp
  );

  return {
    todayEssentialExpense: Math.round(todayEssential),
    todayDiscretionaryExpense: Math.round(todayDiscretionary),
    todayTotalMonthlyExpense: Math.round(todayTotalMonthlyExpense),
    modeledMonthlyExpenseAtRetirement,
    pensionAndGuaranteedIncome,
    npsAnnuityMonthlyIncome,
    netMonthlyPortfolioIncomeGapAtRetirement,
    requiredCorpus,
    projectedCorpus,
    readinessGap: Math.round(readinessGap),
    isCorpusSufficient,
    additionalMonthlySipRequired,
    additionalAccumulationYearsRequired,
    realPurchasingPowerRequiredCorpus,
    realPurchasingPowerProjectedCorpus,
    accumulationTimeline: accumulation.timeline,
    drawdownTimeline,
    assetBreakdownProjections,
    bucketAllocation,
    npsSplitSummary: {
      totalNpsAtRetirement,
      annuityLumpSum40,
      swpPortfolio60,
      monthlyAnnuityPayout: npsAnnuityMonthlyIncome,
    },
    medicalShockSummary: {
      applied: medicalShockConfig.enabled,
      shockAge: medicalShockConfig.shockAge,
      shockAmountAtAge: Math.round(
        medicalShockConfig.shockAmountToday *
          Math.pow(1 + healthInf, yearsToRetirement + Math.max(1, medicalShockConfig.shockAge - retirementAge))
      ),
      didCorpusSurviveShock: corpusDepletionAge === null || corpusDepletionAge > medicalShockConfig.shockAge,
    },
    postTaxSwpSummary: {
      totalEstimatedLtcgTaxPaid: totalLtcgTaxPaid,
      effectiveTaxRateOnWithdrawals:
        totalWithdrawalCumulative > 0 ? (totalLtcgTaxPaid / totalWithdrawalCumulative) * 100 : 0,
    },
    healthScore,
    corpusDepletionAge,
    yearsCorpusWillLast,
    retirementAgeLadder,
    goalIncomeLadder,
    scenarioAnalysis,
    monteCarloResults,
  };
}

/**
 * Monte Carlo simulator for retirement portfolio survival
 */
function runRetirementMonteCarlo(
  startingCorpus: number,
  initialMonthlyGap: number,
  durationYears: number,
  meanReturnPct: number,
  inflationPct: number,
  withdrawalStrategy: string,
  simulationsCount: number = 500
): MonteCarloSummary {
  if (startingCorpus <= 0) {
    return {
      survivalProbability: 0,
      medianEndingCorpus: 0,
      percentile10EndingCorpus: 0,
      percentile90EndingCorpus: 0,
      sequenceRiskAlert: 'High Risk: Initial starting portfolio is zero.',
    };
  }

  const meanReturn = meanReturnPct / 100;
  const stdDev = 0.14;
  const inf = inflationPct / 100;

  const endingCorpuses: number[] = [];
  let successfulSurvivals = 0;

  for (let s = 0; s < simulationsCount; s++) {
    let corpus = startingCorpus;
    let isSurvived = true;

    for (let y = 1; y <= durationYears; y++) {
      if (corpus <= 0) {
        isSurvived = false;
        break;
      }

      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      const annualReturn = meanReturn + z * stdDev;

      const yearMonthlyGap = initialMonthlyGap * Math.pow(1 + inf, y - 1);
      const annualWithdrawal = yearMonthlyGap * 12;

      corpus -= annualWithdrawal;
      if (corpus > 0) {
        corpus += corpus * annualReturn;
      } else {
        isSurvived = false;
        corpus = 0;
        break;
      }
    }

    if (isSurvived && corpus > 0) {
      successfulSurvivals++;
    }
    endingCorpuses.push(Math.round(corpus));
  }

  endingCorpuses.sort((a, b) => a - b);
  const survivalProbability = Math.round((successfulSurvivals / simulationsCount) * 100);
  const medianEndingCorpus = endingCorpuses[Math.floor(simulationsCount * 0.5)];
  const percentile10EndingCorpus = endingCorpuses[Math.floor(simulationsCount * 0.1)];
  const percentile90EndingCorpus = endingCorpuses[Math.floor(simulationsCount * 0.9)];

  let sequenceRiskAlert = 'Balanced Portfolio Health: Low sequence-of-returns risk.';
  if (survivalProbability < 70) {
    sequenceRiskAlert = 'CRITICAL SEQUENCE RISK: Over 30% chance of portfolio exhaustion during severe market drawdowns early in retirement.';
  } else if (survivalProbability < 90) {
    sequenceRiskAlert = 'MODERATE SEQUENCE RISK: Consider maintaining a 2-3 year cash bucket buffer for early retirement years.';
  }

  return {
    survivalProbability,
    medianEndingCorpus,
    percentile10EndingCorpus,
    percentile90EndingCorpus,
    sequenceRiskAlert,
  };
}

/**
 * Natural language parser for retirement intent compiler
 */
export function parseRetirementNaturalQuery(query: string): Partial<RetirementEngineInputs> | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const result: Partial<RetirementEngineInputs> = {};

  const ageMatch = q.match(/age\s*(\d{2})/) || q.match(/(\d{2})\s*years?\s*old/);
  if (ageMatch) result.currentAge = parseInt(ageMatch[1], 10);

  const retAgeMatch = q.match(/retire\s*(?:at|by)?\s*(\d{2})/) || q.match(/retirement\s*age\s*(\d{2})/);
  if (retAgeMatch) result.retirementAge = parseInt(retAgeMatch[1], 10);

  if (q.includes('crore') || q.includes('cr')) {
    const crMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)/);
    if (crMatch) {
      const crVal = parseFloat(crMatch[1]) * 10000000;
      if (q.includes('expense') || q.includes('income') || q.includes('pension')) {
        result.customTotalMonthlyExpense = Math.round(crVal / 12);
      } else {
        result.currentSavings = crVal;
      }
    }
  }

  if (q.includes('lakh') || q.includes('lac') || q.includes('l')) {
    const lkMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/);
    if (lkMatch) {
      const lkVal = parseFloat(lkMatch[1]) * 100000;
      if (q.includes('expense') || q.includes('income') || q.includes('per month') || q.includes('/month')) {
        result.customTotalMonthlyExpense = lkVal;
        result.targetMonthlyIncomeToday = lkVal;
      } else if (q.includes('sip') || q.includes('invest')) {
        result.monthlySip = lkVal;
      } else {
        result.currentSavings = lkVal;
      }
    }
  }

  const kMatch = q.match(/(\d+)k/);
  if (kMatch && !result.customTotalMonthlyExpense && !result.monthlySip) {
    const kVal = parseInt(kMatch[1], 10) * 1000;
    if (q.includes('expense') || q.includes('pension') || q.includes('income')) {
      result.customTotalMonthlyExpense = kVal;
    } else {
      result.monthlySip = kVal;
    }
  }

  const infMatch = q.match(/(\d+(?:\.\d+)?)%\s*inflation/);
  if (infMatch) result.generalInflation = parseFloat(infMatch[1]);

  const retMatch = q.match(/(\d+(?:\.\d+)?)%\s*(?:return|growth|p\.a)/);
  if (retMatch) {
    result.preRetirementReturn = parseFloat(retMatch[1]);
  }

  const stepMatch = q.match(/(\d+(?:\.\d+)?)%\s*step\s*up/);
  if (stepMatch) result.annualStepUp = parseFloat(stepMatch[1]);

  if (Object.keys(result).length > 0) {
    return result;
  }

  return null;
}
