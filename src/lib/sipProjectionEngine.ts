/**
 * SIP (Systematic Investment Plan) & Universal Investment Projection Engine
 * Comprehensive financial mathematical suite supporting:
 * - Deterministic Periodic Compounding (Annuity Due & Ordinary Annuity)
 * - Annual Contribution Step-Up / Top-Up (Percentage & Fixed Amount)
 * - Inverse Goal Solvers (Target Corpus -> Required Monthly Contribution)
 * - Goal Solver with Pre-existing Portfolio & Existing SIP
 * - Multi-Year Timeline & Cash Flow Decomposition
 * - Real Purchasing Power & Inflation Adjuster
 * - Expense Ratio (TER) & Compounding Fee Drag Model
 * - Post-July 2024 Indian Equity LTCG Tax Layer (12.5% above ₹1.25 Lakh exemption)
 * - Milestone Detection Engine (₹10L, ₹25L, ₹50L, ₹1Cr, ₹2Cr, ₹5Cr, ₹10Cr)
 * - Goal Ladders (Time Horizon & Return Sensitivity Matrices)
 * - Cost of Delay / "What If I Start Later?" Engine
 * - SIP vs. Lump Sum Comparative Engine
 * - Natural Language Query Intent Compiler
 */

export interface SipEngineInputs {
  mode: 'returns' | 'goal' | 'stepup' | 'inflation' | 'vs_lumpsum' | 'goal_existing';
  monthlySip: number; // Regular monthly investment
  assumedReturn: number; // Assumed annual nominal return rate (%)
  durationYears: number; // Investment horizon in years
  initialLumpSum: number; // Starting portfolio principal
  
  // Step-Up Configuration
  enableStepUp: boolean;
  stepUpType: 'percentage' | 'fixed';
  annualStepUpRate: number; // e.g. 10 (%)
  annualStepUpFixed: number; // e.g. 1000 (currency units added to monthly SIP every year)
  
  // Goal Solver Configuration
  targetCorpus: number; // Target terminal amount (e.g. ₹1,00,00,000 for 1 Crore)
  existingPortfolio: number; // Current corpus for mode 6
  existingSip: number; // Current ongoing SIP for mode 6
  
  // Compounding & Contribution Convention
  contributionTiming: 'beginning' | 'end'; // 'beginning' = mutual fund auto-debit (Annuity Due)
  contributionFrequency?: 'month' | 'year';
  compoundingFrequency: 'monthly' | 'annually' | 'half_yearly' | 'quarterly';
  
  // Advanced Layers
  inflationRate: number; // Assumed annual inflation (%)
  expenseRatio: number; // Annual Total Expense Ratio / Management Fee (%)
  includeTax: boolean;
  taxRegime: 'india_equity_ltcg_new' | 'custom';
  customTaxRate: number; // Custom LTCG/tax rate (%)
  taxExemptionLimit: number; // Tax exemption threshold (e.g. ₹1,25,000)
  
  // SIP vs Lump Sum Mode
  lumpSumAmount: number; // Lump sum amount to compare
}

export interface SipTimelineYear {
  year: number;
  startBalance: number;
  monthlyContribution: number;
  annualDeposits: number;
  returnsEarned: number;
  closingBalance: number;
  totalInvestedToDate: number;
  cumulativeReturns: number;
  realPurchasingPower: number;
  feeDragAccumulated: number;
  estimatedTaxLiability: number;
}

export interface MilestoneItem {
  id: string;
  label: string;
  targetValue: number;
  achievedYear: number;
  achievedMonth: number;
  formattedTime: string;
  isReached: boolean;
  investedAtMilestone: number;
  returnsAtMilestone: number;
}

export interface GoalLadderRow {
  parameterLabel: string;
  numericValue: number;
  requiredMonthly: number;
  totalInvested: number;
  totalReturns: number;
  wealthMultiplier: number;
}

export interface CostOfDelayRow {
  delayYears: number;
  label: string;
  requiredMonthly: number;
  totalInvested: number;
  totalReturns: number;
  extraSipRequiredMonthly: number;
  extraSipPercentage: number;
  opportunityCostLoss: number;
}

export interface SipVsLumpSumResult {
  sip: {
    totalInvested: number;
    futureValue: number;
    totalReturns: number;
    wealthMultiplier: number;
  };
  lumpSum: {
    totalInvested: number;
    futureValue: number;
    totalReturns: number;
    wealthMultiplier: number;
  };
  winner: 'sip' | 'lumpsum';
  difference: number;
  ratio: number;
}

export interface StepUpComparisonResult {
  withoutStepUp: {
    monthlySip: number;
    totalInvested: number;
    futureValue: number;
    totalReturns: number;
  };
  withStepUp: {
    startingMonthlySip: number;
    finalMonthlySip: number;
    totalInvested: number;
    futureValue: number;
    totalReturns: number;
  };
  deltaWealth: number;
  deltaInvested: number;
  stepUpEfficiencyRatio: number;
}

export interface ScenarioBandResult {
  label: string;
  rate: number;
  futureValue: number;
  totalInvested: number;
  totalReturns: number;
}

export interface SipEngineOutputs {
  inputs: SipEngineInputs;
  // Core Results
  totalInvested: number;
  modeledGrowth: number;
  futureValueGross: number;
  futureValueNetFees: number;
  growthPercentage: number;
  growthMultiplier: number;
  
  // Real Purchasing Power & Fee Drag
  realFutureValue: number;
  purchasingPowerLoss: number;
  totalFeesPaid: number;
  
  // Post-Tax Projection
  taxableGains: number;
  estimatedCapitalGainsTax: number;
  postTaxCorpus: number;
  effectiveTaxRate: number;
  
  // Goal Solutions
  requiredMonthlySip: number;
  additionalSipRequired: number;
  
  // Dynamic Datasets & Visuals
  timeline: SipTimelineYear[];
  milestones: MilestoneItem[];
  goalLadderTime: GoalLadderRow[];
  goalLadderReturns: GoalLadderRow[];
  costOfDelay: CostOfDelayRow[];
  stepUpComparison: StepUpComparisonResult;
  vsLumpSumComparison: SipVsLumpSumResult;
  scenarioBands: ScenarioBandResult[];
}

/**
 * Executes high-precision month-by-month investment projection simulation
 */
export function runSipProjectionEngine(inputs: SipEngineInputs): SipEngineOutputs {
  const {
    monthlySip = 10000,
    assumedReturn = 12,
    durationYears = 20,
    initialLumpSum = 0,
    enableStepUp = false,
    stepUpType = 'percentage',
    annualStepUpRate = 10,
    annualStepUpFixed = 1000,
    targetCorpus = 10000000,
    existingPortfolio = 500000,
    existingSip = 15000,
    contributionTiming = 'end',
    inflationRate = 6,
    expenseRatio = 0.75,
    includeTax = false,
    taxRegime = 'india_equity_ltcg_new',
    customTaxRate = 12.5,
    taxExemptionLimit = 125000,
    lumpSumAmount = 1200000,
  } = inputs;

  const validYears = Math.max(1, Math.min(50, Number(durationYears) || 20));
  const validNominalReturn = Math.max(0.01, Number(assumedReturn) || 12);
  const validInflation = Math.max(0, Number(inflationRate) || 0);
  const validExpenseRatio = Math.max(0, Number(expenseRatio) || 0);
  const netAnnualReturn = Math.max(0, validNominalReturn - validExpenseRatio);

  // Periodic rate conversion (nominal monthly rate r/12 used by standard SIP calculators)
  const rGross = validNominalReturn / 100;
  const monthlyRateGross = rGross / 12;

  const rNet = netAnnualReturn / 100;
  const monthlyRateNet = rNet / 12;

  const rInflation = validInflation / 100;
  const monthlyInflationRate = rInflation / 12;

  // Month-by-month simulation
  let balanceGross = Math.max(0, initialLumpSum);
  let balanceNet = Math.max(0, initialLumpSum);
  let totalInvestedAcc = Math.max(0, initialLumpSum);
  let currentMonthlyPmt = Math.max(0, monthlySip);

  const timeline: SipTimelineYear[] = [];
  const totalMonths = validYears * 12;

  // Track milestones
  const standardMilestones: { id: string; label: string; target: number }[] = [
    { id: '10L', label: '₹10 Lakh', target: 1000000 },
    { id: '25L', label: '₹25 Lakh', target: 2500000 },
    { id: '50L', label: '₹50 Lakh', target: 5000000 },
    { id: '1Cr', label: '₹1 Crore', target: 10000000 },
    { id: '2Cr', label: '₹2 Crore', target: 20000000 },
    { id: '5Cr', label: '₹5 Crore', target: 50000000 },
    { id: '10Cr', label: '₹10 Crore', target: 100000000 },
  ];

  const milestoneTracking: Record<string, { year: number; month: number; invested: number; returns: number }> = {};

  for (let m = 1; m <= totalMonths; m++) {
    const currentYear = Math.ceil(m / 12);
    const monthInYear = ((m - 1) % 12) + 1;

    // Apply Step-up at start of each subsequent year (m = 13, 25, 37...)
    if (enableStepUp && monthInYear === 1 && currentYear > 1) {
      if (stepUpType === 'percentage') {
        currentMonthlyPmt = currentMonthlyPmt * (1 + (annualStepUpRate / 100));
      } else {
        currentMonthlyPmt = currentMonthlyPmt + Math.max(0, annualStepUpFixed);
      }
    }

    // Contribution timing and frequency
    const freq = inputs.contributionFrequency || 'month';
    let isDepositMonth = false;
    if (freq === 'month') {
      isDepositMonth = true;
    } else if (freq === 'year') {
      if (contributionTiming === 'beginning' && monthInYear === 1) isDepositMonth = true;
      if (contributionTiming === 'end' && monthInYear === 12) isDepositMonth = true;
    }

    if (isDepositMonth) {
      if (contributionTiming === 'beginning') {
        balanceGross += currentMonthlyPmt;
        balanceNet += currentMonthlyPmt;
        totalInvestedAcc += currentMonthlyPmt;

        balanceGross += balanceGross * monthlyRateGross;
        balanceNet += balanceNet * monthlyRateNet;
      } else {
        balanceGross += balanceGross * monthlyRateGross;
        balanceNet += balanceNet * monthlyRateNet;

        balanceGross += currentMonthlyPmt;
        balanceNet += currentMonthlyPmt;
        totalInvestedAcc += currentMonthlyPmt;
      }
    } else {
      balanceGross += balanceGross * monthlyRateGross;
      balanceNet += balanceNet * monthlyRateNet;
    }

    // Check milestones
    for (const ms of standardMilestones) {
      if (!milestoneTracking[ms.id] && balanceNet >= ms.target) {
        milestoneTracking[ms.id] = {
          year: currentYear,
          month: monthInYear,
          invested: Math.round(totalInvestedAcc),
          returns: Math.round(Math.max(0, balanceNet - totalInvestedAcc)),
        };
      }
    }

    // Capture Year End Snapshots
    if (monthInYear === 12 || m === totalMonths) {
      const yearIdx = currentYear;
      const prevClosing = timeline.length > 0 ? timeline[timeline.length - 1].closingBalance : initialLumpSum;
      const annualDeposits = currentMonthlyPmt * 12; // approximate effective annual deposits
      const returnsEarnedYear = Math.max(0, balanceNet - prevClosing - annualDeposits);
      
      const realPower = balanceNet / Math.pow(1 + rInflation, yearIdx);
      const feeDrag = Math.max(0, balanceGross - balanceNet);

      // Tax calculation at liquidation point
      const totalGainsSoFar = Math.max(0, balanceNet - totalInvestedAcc);
      const taxablePortion = taxRegime === 'india_equity_ltcg_new' 
        ? Math.max(0, totalGainsSoFar - taxExemptionLimit) 
        : totalGainsSoFar;
      const taxRateUsed = taxRegime === 'india_equity_ltcg_new' ? 0.125 : customTaxRate / 100;
      const taxLiab = includeTax ? taxablePortion * taxRateUsed : 0;

      timeline.push({
        year: yearIdx,
        startBalance: Math.round(prevClosing),
        monthlyContribution: Math.round(currentMonthlyPmt),
        annualDeposits: Math.round(annualDeposits),
        returnsEarned: Math.round(returnsEarnedYear),
        closingBalance: Math.round(balanceNet),
        totalInvestedToDate: Math.round(totalInvestedAcc),
        cumulativeReturns: Math.round(Math.max(0, balanceNet - totalInvestedAcc)),
        realPurchasingPower: Math.round(realPower),
        feeDragAccumulated: Math.round(feeDrag),
        estimatedTaxLiability: Math.round(taxLiab),
      });
    }
  }

  const finalGross = Math.round(balanceGross);
  const finalNet = Math.round(balanceNet);
  const finalInvested = Math.round(totalInvestedAcc);
  const finalGains = Math.round(Math.max(0, finalNet - finalInvested));
  const finalReal = Math.round(finalNet / Math.pow(1 + rInflation, validYears));
  const finalFees = Math.round(Math.max(0, finalGross - finalNet));

  // Tax breakdown
  const taxableGains = taxRegime === 'india_equity_ltcg_new'
    ? Math.max(0, finalGains - taxExemptionLimit)
    : finalGains;
  const taxRate = taxRegime === 'india_equity_ltcg_new' ? 0.125 : (customTaxRate / 100);
  const estimatedCapitalGainsTax = includeTax ? Math.round(taxableGains * taxRate) : 0;
  const postTaxCorpus = finalNet - estimatedCapitalGainsTax;
  const effectiveTaxRate = finalGains > 0 ? (estimatedCapitalGainsTax / finalGains) * 100 : 0;

  // --- SOLVER: Required Monthly SIP for Target Goal ---
  const requiredMonthlySip = solveRequiredMonthlySip({
    targetAmount: targetCorpus,
    initialDeposit: initialLumpSum,
    annualReturnRate: validNominalReturn - validExpenseRatio,
    durationYears: validYears,
    stepUpRate: enableStepUp ? (stepUpType === 'percentage' ? annualStepUpRate : 0) : 0,
    timing: contributionTiming,
  });

  // --- SOLVER: Goal with Existing Portfolio + Existing SIP ---
  // Future Value of Existing Portfolio + Existing SIP
  const existingFutureValue = simulateFutureValue({
    monthlySip: existingSip,
    initialLumpSum: existingPortfolio,
    annualReturnRate: netAnnualReturn,
    durationYears: validYears,
    stepUpRate: enableStepUp ? annualStepUpRate : 0,
    timing: contributionTiming,
  });

  const gapCorpus = Math.max(0, targetCorpus - existingFutureValue);
  const additionalSipRequired = gapCorpus > 0
    ? solveRequiredMonthlySip({
        targetAmount: gapCorpus,
        initialDeposit: 0,
        annualReturnRate: netAnnualReturn,
        durationYears: validYears,
        stepUpRate: enableStepUp ? annualStepUpRate : 0,
        timing: contributionTiming,
      })
    : 0;

  // --- STEP-UP COMPARISON ---
  // Compare regular flat SIP vs Step-Up SIP
  const flatSipResult = simulateFutureValueBreakdown({
    monthlySip,
    initialLumpSum,
    annualReturnRate: netAnnualReturn,
    durationYears: validYears,
    enableStepUp: false,
    stepUpRate: 0,
    timing: contributionTiming,
  });

  const stepUpSipResult = simulateFutureValueBreakdown({
    monthlySip,
    initialLumpSum,
    annualReturnRate: netAnnualReturn,
    durationYears: validYears,
    enableStepUp: true,
    stepUpRate: annualStepUpRate,
    timing: contributionTiming,
  });

  const deltaWealth = Math.max(0, stepUpSipResult.futureValue - flatSipResult.futureValue);
  const deltaInvested = Math.max(0, stepUpSipResult.totalInvested - flatSipResult.totalInvested);
  const stepUpEfficiencyRatio = deltaInvested > 0 ? deltaWealth / deltaInvested : 0;

  const stepUpComparison: StepUpComparisonResult = {
    withoutStepUp: {
      monthlySip,
      totalInvested: flatSipResult.totalInvested,
      futureValue: flatSipResult.futureValue,
      totalReturns: flatSipResult.totalReturns,
    },
    withStepUp: {
      startingMonthlySip: monthlySip,
      finalMonthlySip: Math.round(monthlySip * Math.pow(1 + annualStepUpRate / 100, validYears - 1)),
      totalInvested: stepUpSipResult.totalInvested,
      futureValue: stepUpSipResult.futureValue,
      totalReturns: stepUpSipResult.totalReturns,
    },
    deltaWealth,
    deltaInvested,
    stepUpEfficiencyRatio: Math.round(stepUpEfficiencyRatio * 100) / 100,
  };

  // --- SIP VS LUMP SUM COMPARISON ---
  const lumpSumGrowth = simulateLumpSumGrowth({
    principal: lumpSumAmount || finalInvested,
    annualReturnRate: netAnnualReturn,
    durationYears: validYears,
  });

  const vsLumpSumComparison: SipVsLumpSumResult = {
    sip: {
      totalInvested: finalInvested,
      futureValue: finalNet,
      totalReturns: finalGains,
      wealthMultiplier: finalInvested > 0 ? finalNet / finalInvested : 1,
    },
    lumpSum: {
      totalInvested: lumpSumAmount || finalInvested,
      futureValue: lumpSumGrowth.futureValue,
      totalReturns: lumpSumGrowth.totalReturns,
      wealthMultiplier: (lumpSumAmount || finalInvested) > 0 ? lumpSumGrowth.futureValue / (lumpSumAmount || finalInvested) : 1,
    },
    winner: lumpSumGrowth.futureValue >= finalNet ? 'lumpsum' : 'sip',
    difference: Math.abs(lumpSumGrowth.futureValue - finalNet),
    ratio: finalNet > 0 ? lumpSumGrowth.futureValue / finalNet : 1,
  };

  // --- GOAL LADDERS ---
  const timeHorizons = [5, 10, 15, 20, 25, 30];
  const goalLadderTime: GoalLadderRow[] = timeHorizons.map((yrs) => {
    const reqSip = solveRequiredMonthlySip({
      targetAmount: targetCorpus,
      initialDeposit: initialLumpSum,
      annualReturnRate: netAnnualReturn,
      durationYears: yrs,
      stepUpRate: enableStepUp ? annualStepUpRate : 0,
      timing: contributionTiming,
    });
    const totalInv = reqSip * yrs * 12 + initialLumpSum;
    const totRet = Math.max(0, targetCorpus - totalInv);
    return {
      parameterLabel: `${yrs} Years`,
      numericValue: yrs,
      requiredMonthly: reqSip,
      totalInvested: Math.round(totalInv),
      totalReturns: Math.round(totRet),
      wealthMultiplier: totalInv > 0 ? Math.round((targetCorpus / totalInv) * 100) / 100 : 1,
    };
  });

  const returnScenarios = [8, 10, 12, 14, 15, 18];
  const goalLadderReturns: GoalLadderRow[] = returnScenarios.map((ret) => {
    const reqSip = solveRequiredMonthlySip({
      targetAmount: targetCorpus,
      initialDeposit: initialLumpSum,
      annualReturnRate: Math.max(0.1, ret - validExpenseRatio),
      durationYears: validYears,
      stepUpRate: enableStepUp ? annualStepUpRate : 0,
      timing: contributionTiming,
    });
    const totalInv = reqSip * validYears * 12 + initialLumpSum;
    const totRet = Math.max(0, targetCorpus - totalInv);
    return {
      parameterLabel: `${ret}% p.a.`,
      numericValue: ret,
      requiredMonthly: reqSip,
      totalInvested: Math.round(totalInv),
      totalReturns: Math.round(totRet),
      wealthMultiplier: totalInv > 0 ? Math.round((targetCorpus / totalInv) * 100) / 100 : 1,
    };
  });

  // --- COST OF DELAY ENGINE ---
  const baseReqSip = solveRequiredMonthlySip({
    targetAmount: targetCorpus,
    initialDeposit: initialLumpSum,
    annualReturnRate: netAnnualReturn,
    durationYears: validYears,
    stepUpRate: enableStepUp ? annualStepUpRate : 0,
    timing: contributionTiming,
  });
  const baseTotalInvested = baseReqSip * validYears * 12;

  const delayIntervals = [0, 3, 5, 10];
  const costOfDelay: CostOfDelayRow[] = delayIntervals
    .filter((d) => validYears - d >= 1)
    .map((delay) => {
      const remainingTenure = validYears - delay;
      const delayedReqSip = solveRequiredMonthlySip({
        targetAmount: targetCorpus,
        initialDeposit: initialLumpSum,
        annualReturnRate: netAnnualReturn,
        durationYears: remainingTenure,
        stepUpRate: enableStepUp ? annualStepUpRate : 0,
        timing: contributionTiming,
      });
      const totalInv = delayedReqSip * remainingTenure * 12 + initialLumpSum;
      const extraMonthly = Math.max(0, delayedReqSip - baseReqSip);
      const extraPercentage = baseReqSip > 0 ? (extraMonthly / baseReqSip) * 100 : 0;
      const opportunityLoss = Math.max(0, totalInv - baseTotalInvested);

      return {
        delayYears: delay,
        label: delay === 0 ? 'Start Today (No Delay)' : `Wait ${delay} Years to Start`,
        requiredMonthly: delayedReqSip,
        totalInvested: Math.round(totalInv),
        totalReturns: Math.round(Math.max(0, targetCorpus - totalInv)),
        extraSipRequiredMonthly: Math.round(extraMonthly),
        extraSipPercentage: Math.round(extraPercentage),
        opportunityCostLoss: Math.round(opportunityLoss),
      };
    });

  // --- MILESTONES PREPARATION ---
  const milestones: MilestoneItem[] = standardMilestones.map((ms) => {
    const reached = milestoneTracking[ms.id];
    if (reached) {
      return {
        id: ms.id,
        label: ms.label,
        targetValue: ms.target,
        achievedYear: reached.year,
        achievedMonth: reached.month,
        formattedTime: `Year ${reached.year}, Mo ${reached.month}`,
        isReached: true,
        investedAtMilestone: reached.invested,
        returnsAtMilestone: reached.returns,
      };
    }
    return {
      id: ms.id,
      label: ms.label,
      targetValue: ms.target,
      achievedYear: 0,
      achievedMonth: 0,
      formattedTime: `> ${validYears} Years`,
      isReached: false,
      investedAtMilestone: 0,
      returnsAtMilestone: 0,
    };
  });

  // --- SCENARIO RETURN BANDS ---
  const scenarioBands: ScenarioBandResult[] = [
    { label: 'Conservative (-3%)', rate: Math.max(1, validNominalReturn - 3) },
    { label: 'Assumed Baseline', rate: validNominalReturn },
    { label: 'Optimistic (+3%)', rate: validNominalReturn + 3 },
  ].map((band) => {
    const bandNet = Math.max(0.1, band.rate - validExpenseRatio);
    const bandRes = simulateFutureValueBreakdown({
      monthlySip,
      initialLumpSum,
      annualReturnRate: bandNet,
      durationYears: validYears,
      enableStepUp,
      stepUpRate: annualStepUpRate,
      timing: contributionTiming,
    });
    return {
      label: band.label,
      rate: band.rate,
      futureValue: bandRes.futureValue,
      totalInvested: bandRes.totalInvested,
      totalReturns: bandRes.totalReturns,
    };
  });

  return {
    inputs,
    totalInvested: finalInvested,
    modeledGrowth: finalGains,
    futureValueGross: finalGross,
    futureValueNetFees: finalNet,
    growthPercentage: finalInvested > 0 ? Math.round((finalGains / finalInvested) * 1000) / 10 : 0,
    growthMultiplier: finalInvested > 0 ? Math.round((finalNet / finalInvested) * 100) / 100 : 1,
    realFutureValue: finalReal,
    purchasingPowerLoss: Math.max(0, finalNet - finalReal),
    totalFeesPaid: finalFees,
    taxableGains,
    estimatedCapitalGainsTax,
    postTaxCorpus,
    effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    requiredMonthlySip,
    additionalSipRequired,
    timeline,
    milestones,
    goalLadderTime,
    goalLadderReturns,
    costOfDelay,
    stepUpComparison,
    vsLumpSumComparison,
    scenarioBands,
  };
}

/**
 * Solves the required monthly SIP to achieve a given target corpus
 */
function solveRequiredMonthlySip(params: {
  targetAmount: number;
  initialDeposit: number;
  annualReturnRate: number;
  durationYears: number;
  stepUpRate?: number;
  timing?: 'beginning' | 'end';
}): number {
  const {
    targetAmount,
    initialDeposit = 0,
    annualReturnRate,
    durationYears,
    stepUpRate = 0,
    timing = 'beginning',
  } = params;

  const target = Math.max(100, targetAmount);
  const years = Math.max(1, durationYears);
  const rAnnual = Math.max(0.001, annualReturnRate) / 100;
  const monthlyRate = rAnnual / 12;
  const totalMonths = years * 12;

  // Lump sum future value
  const initialGrowth = initialDeposit * Math.pow(1 + monthlyRate, totalMonths);
  const remainingGoal = Math.max(0, target - initialGrowth);

  if (remainingGoal <= 0) return 0;

  // If no step-up, use exact closed-form Annuity formula
  if (!stepUpRate || stepUpRate === 0) {
    const annuityFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    const timingMultiplier = timing === 'beginning' ? (1 + monthlyRate) : 1;
    const req = remainingGoal / (annuityFactor * timingMultiplier);
    return Math.round(req);
  }

  // With step-up: binary search root-finder (bisection)
  let low = 1;
  let high = remainingGoal;
  let best = remainingGoal;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const simulatedFV = simulateFutureValue({
      monthlySip: mid,
      initialLumpSum: 0,
      annualReturnRate,
      durationYears: years,
      stepUpRate,
      timing,
    });

    if (Math.abs(simulatedFV - remainingGoal) < 10) {
      best = mid;
      break;
    }

    if (simulatedFV < remainingGoal) {
      low = mid;
      best = mid;
    } else {
      high = mid;
      best = mid;
    }
  }

  return Math.round(best);
}

/**
 * Fast month-by-month future value simulator
 */
function simulateFutureValue(params: {
  monthlySip: number;
  initialLumpSum: number;
  annualReturnRate: number;
  durationYears: number;
  stepUpRate: number;
  timing: 'beginning' | 'end';
}): number {
  const { monthlySip, initialLumpSum, annualReturnRate, durationYears, stepUpRate, timing } = params;
  const r = Math.max(0.001, annualReturnRate) / 100;
  const monthlyRate = r / 12;
  const totalMonths = durationYears * 12;

  let balance = initialLumpSum;
  let currentMonthly = monthlySip;

  for (let m = 1; m <= totalMonths; m++) {
    const monthInYear = ((m - 1) % 12) + 1;
    const year = Math.ceil(m / 12);

    if (stepUpRate > 0 && monthInYear === 1 && year > 1) {
      currentMonthly *= (1 + stepUpRate / 100);
    }

    if (timing === 'beginning') {
      balance += currentMonthly;
      balance += balance * monthlyRate;
    } else {
      balance += balance * monthlyRate;
      balance += currentMonthly;
    }
  }

  return Math.round(balance);
}

/**
 * Simulates future value with breakdown of invested capital vs returns
 */
function simulateFutureValueBreakdown(params: {
  monthlySip: number;
  initialLumpSum: number;
  annualReturnRate: number;
  durationYears: number;
  enableStepUp: boolean;
  stepUpRate: number;
  timing: 'beginning' | 'end';
}): { totalInvested: number; futureValue: number; totalReturns: number } {
  const { monthlySip, initialLumpSum, annualReturnRate, durationYears, enableStepUp, stepUpRate, timing } = params;
  const r = Math.max(0.001, annualReturnRate) / 100;
  const monthlyRate = r / 12;
  const totalMonths = durationYears * 12;

  let balance = initialLumpSum;
  let totalInvested = initialLumpSum;
  let currentMonthly = monthlySip;

  for (let m = 1; m <= totalMonths; m++) {
    const monthInYear = ((m - 1) % 12) + 1;
    const year = Math.ceil(m / 12);

    if (enableStepUp && stepUpRate > 0 && monthInYear === 1 && year > 1) {
      currentMonthly *= (1 + stepUpRate / 100);
    }

    if (timing === 'beginning') {
      balance += currentMonthly;
      totalInvested += currentMonthly;
      balance += balance * monthlyRate;
    } else {
      balance += balance * monthlyRate;
      balance += currentMonthly;
      totalInvested += currentMonthly;
    }
  }

  const fv = Math.round(balance);
  const invested = Math.round(totalInvested);
  const ret = Math.max(0, fv - invested);

  return {
    totalInvested: invested,
    futureValue: fv,
    totalReturns: ret,
  };
}

/**
 * Simulates lump sum compound growth
 */
function simulateLumpSumGrowth(params: {
  principal: number;
  annualReturnRate: number;
  durationYears: number;
}): { totalInvested: number; futureValue: number; totalReturns: number } {
  const { principal, annualReturnRate, durationYears } = params;
  const r = Math.max(0.001, annualReturnRate) / 100;
  const fv = Math.round(principal * Math.pow(1 + r, durationYears));
  const returns = Math.max(0, fv - principal);

  return {
    totalInvested: principal,
    futureValue: fv,
    totalReturns: returns,
  };
}

/**
 * Natural language intent parser / Search Compiler
 * Parses queries like "10000 sip for 15 years at 12%" or "how much sip for 1 crore in 20 years"
 */
export function parseSipNaturalQuery(query: string): Partial<SipEngineInputs> | null {
  if (!query || query.trim().length < 3) return null;
  const normalized = query.toLowerCase().replace(/,/g, '').trim();

  const updates: Partial<SipEngineInputs> = {};

  // Check goal intent: "how much sip", "sip for 1 crore", "target 50 lakh"
  const isGoalQuery = /(how\s*much|required|reach|target|goal|to\s*get|for\s*1\s*cr|for\s*50\s*lakh)/i.test(normalized);
  if (isGoalQuery) {
    updates.mode = 'goal';
  }

  // Check step up intent: "step up", "top up", "increase 10%"
  if (/(step\s*up|top\s*up|annual\s*increase)/i.test(normalized)) {
    updates.mode = 'stepup';
    updates.enableStepUp = true;
  }

  // Check inflation intent
  if (/inflation|purchasing\s*power|real\s*value/i.test(normalized)) {
    updates.mode = 'inflation';
  }

  // Check vs lumpsum intent
  if (/vs\s*lump\s*sum|lumpsum/i.test(normalized)) {
    updates.mode = 'vs_lumpsum';
  }

  // Check tax intent
  if (/tax|ltcg/i.test(normalized)) {
    updates.includeTax = true;
  }

  // Extract amount: ₹1 Cr / 1 Crore / 50 Lakh / 10k / 5000 / 15000
  // 1. Crores
  const crMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
  if (crMatch) {
    const val = parseFloat(crMatch[1]) * 10000000;
    if (isGoalQuery) updates.targetCorpus = val;
    else updates.monthlySip = val;
  }

  // 2. Lakhs
  const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)/i);
  if (lakhMatch && !crMatch) {
    const val = parseFloat(lakhMatch[1]) * 100000;
    if (isGoalQuery) updates.targetCorpus = val;
    else updates.monthlySip = val;
  }

  // 3. Thousands (k) or direct number
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i);
  if (kMatch && !crMatch && !lakhMatch) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (isGoalQuery) updates.targetCorpus = val;
    else updates.monthlySip = val;
  }

  // 4. Raw numeric amount (e.g. "5000 sip" or "sip 15000")
  const rawNumMatch = normalized.match(/(?:sip|invest|amount|rs|inr|₹)\s*(\d{3,9})/i) || normalized.match(/(\d{3,9})\s*(?:sip|monthly|per\s*month)/i);
  if (rawNumMatch && !crMatch && !lakhMatch && !kMatch) {
    const val = parseInt(rawNumMatch[1], 10);
    if (val >= 100000) {
      if (isGoalQuery) updates.targetCorpus = val;
      else updates.monthlySip = val;
    } else {
      updates.monthlySip = val;
    }
  }

  // Extract years / tenure: "15 years", "20 yrs", "10y"
  const yearMatch = normalized.match(/(\d{1,2})\s*(?:years|year|yrs|yr|y)/i);
  if (yearMatch) {
    updates.durationYears = parseInt(yearMatch[1], 10);
  }

  // Extract return percentage: "12 percent", "15%", "12.5 %"
  const returnMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|pct|rate)/i);
  if (returnMatch) {
    const r = parseFloat(returnMatch[1]);
    if (r > 0 && r <= 40) {
      updates.assumedReturn = r;
    }
  }

  // Extract step up rate: "10% step up"
  const stepUpMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*(?:step\s*up|increase)/i);
  if (stepUpMatch) {
    updates.annualStepUpRate = parseFloat(stepUpMatch[1]);
    updates.enableStepUp = true;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}
