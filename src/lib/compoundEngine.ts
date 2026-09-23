import { calculateCompoundInterest, CompoundInterestInputs, CompoundInterestResult } from './safeMath';

// ==========================================
// 1. FINANCIAL CALCULATION ONTOLOGY & TYPES
// ==========================================

export type CalculationMode = 
  | 'future_value'        // P, PMT, r, t -> FV
  | 'required_contribution' // FV, P, r, t -> PMT
  | 'initial_principal'   // FV, PMT, r, t -> P
  | 'required_return'     // FV, P, PMT, t -> r
  | 'time_horizon';       // FV, P, PMT, r -> t

export interface CalculationFingerprint {
  version: string;
  mode: CalculationMode;
  inputs: {
    principal: number;
    contribution: number;
    contributionFreq: string;
    rate: number;
    compoundingFreq: string;
    years: number;
    targetAmount?: number;
    inflationRate?: number;
    annualStepUp?: number;
    feeRate?: number;
  };
  hash: string;
  timestamp: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  balance: number;
  type: 'crossover' | 'milestone' | 'doubling' | 'target';
  icon: string;
  achieved: boolean;
}

export interface DeltaExplanation {
  primaryCause: string;
  summary: string;
  absoluteDiff: number;
  percentDiff: number;
  timeDiffYears?: number;
  contributionDiff?: number;
  growthDiff?: number;
  bulletPoints: string[];
}

export interface ConstraintMatrixRow {
  label: string;
  value: number;
  requiredMetric: number;
  formattedMetric: string;
  isFeasible: boolean;
}

export interface SensitivityCell {
  rateOffset: number;
  rate: number;
  yearsOffset: number;
  years: number;
  futureValue: number;
  realFutureValue: number;
  diffFromBase: number;
  diffPercent: number;
}

// ==========================================
// 2. ADVANCED INVERSE & CONSTRAINT SOLVERS
// ==========================================

/**
 * Solve for Required Initial Principal (P) given Target FV, PMT, r, t
 */
export function solveForInitialPrincipal(params: {
  targetAmount: number;
  monthlyContribution: number;
  interestRate: number;
  years: number;
}): { requiredPrincipal: number; totalInvested: number; totalInterest: number } {
  const FV = Math.max(0, params.targetAmount);
  const PMT = Math.max(0, params.monthlyContribution);
  const r = Math.max(0.01, params.interestRate) / 100;
  const t = Math.max(1, params.years);
  const n = 12;
  const monthlyRate = r / n;
  const totalMonths = t * 12;

  // Annuity future value component
  const annuityFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
  const annuityFV = PMT * annuityFactor;

  const remainingFV = Math.max(0, FV - annuityFV);
  const compoundingFactor = Math.pow(1 + monthlyRate, totalMonths);
  const requiredP = remainingFV / compoundingFactor;

  const totalInvested = requiredP + PMT * totalMonths;
  const totalInterest = Math.max(0, FV - totalInvested);

  return {
    requiredPrincipal: Math.round(requiredP),
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(totalInterest),
  };
}

/**
 * Solve for Required Annual Return (r) given Target FV, P, PMT, t using Bisection Method
 */
export function solveForRequiredRate(params: {
  targetAmount: number;
  initialDeposit: number;
  monthlyContribution: number;
  years: number;
}): { requiredRate: number; totalInvested: number; totalInterest: number; isSolvable: boolean } {
  const FV = Math.max(10, params.targetAmount);
  const PV = Math.max(0, params.initialDeposit);
  const PMT = Math.max(0, params.monthlyContribution);
  const t = Math.max(1, params.years);
  const totalInvested = PV + PMT * t * 12;

  if (totalInvested >= FV) {
    return { requiredRate: 0, totalInvested: Math.round(totalInvested), totalInterest: 0, isSolvable: true };
  }

  // Bisection search between 0.1% and 100% annual return
  let low = 0.001;
  let high = 1.0;
  let iterations = 0;
  let bestRate = 0;

  const calcFV = (annualRate: number) => {
    const monthlyRate = annualRate / 12;
    const totalMonths = t * 12;
    const pvGrowth = PV * Math.pow(1 + monthlyRate, totalMonths);
    const annuityGrowth = PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    return pvGrowth + annuityGrowth;
  };

  while (iterations < 60) {
    const mid = (low + high) / 2;
    const val = calcFV(mid);
    if (Math.abs(val - FV) < 1) {
      bestRate = mid;
      break;
    }
    if (val < FV) {
      low = mid;
    } else {
      high = mid;
    }
    bestRate = mid;
    iterations++;
  }

  const roundedRate = Math.round(bestRate * 10000) / 100;
  return {
    requiredRate: roundedRate,
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(Math.max(0, FV - totalInvested)),
    isSolvable: roundedRate <= 50,
  };
}

/**
 * Generate Constraint-solving Matrix
 */
export function generateConstraintMatrix(params: {
  targetAmount: number;
  initialDeposit: number;
  monthlyContribution: number;
  interestRate: number;
  years: number;
  solveType: 'returns_by_years' | 'contributions_by_returns';
}): ConstraintMatrixRow[] {
  if (params.solveType === 'returns_by_years') {
    const yearOptions = [5, 10, 15, 20, 25, 30, 35, 40];
    return yearOptions.map((yr) => {
      const res = solveForRequiredRate({
        targetAmount: params.targetAmount,
        initialDeposit: params.initialDeposit,
        monthlyContribution: params.monthlyContribution,
        years: yr,
      });
      return {
        label: `${yr} Years`,
        value: yr,
        requiredMetric: res.requiredRate,
        formattedMetric: res.requiredRate > 50 ? '> 50% (High risk)' : `${res.requiredRate.toFixed(1)}% p.a.`,
        isFeasible: res.requiredRate <= 25,
      };
    });
  } else {
    const returnOptions = [4, 6, 8, 10, 12, 14];
    return returnOptions.map((rate) => {
      const { requiredMonthly } = solveForMonthlyContribution({
        targetAmount: params.targetAmount,
        initialDeposit: params.initialDeposit,
        interestRate: rate,
        years: params.years,
      });
      return {
        label: `${rate}% Return`,
        value: rate,
        requiredMetric: requiredMonthly,
        formattedMetric: `$${requiredMonthly.toLocaleString()}/mo`,
        isFeasible: requiredMonthly >= 0,
      };
    });
  }
}

export function solveForMonthlyContribution(params: {
  targetAmount: number;
  initialDeposit: number;
  interestRate: number;
  years: number;
}): { requiredMonthly: number; totalInvested: number; totalInterest: number } {
  const FV = Math.max(100, params.targetAmount);
  const PV = Math.max(0, params.initialDeposit);
  const r = Math.max(0.1, params.interestRate) / 100;
  const t = Math.max(1, params.years);
  const monthlyRate = r / 12;
  const totalMonths = t * 12;

  const pvGrowth = PV * Math.pow(1 + monthlyRate, totalMonths);
  const remainingGoal = Math.max(0, FV - pvGrowth);

  if (remainingGoal <= 0) {
    return { requiredMonthly: 0, totalInvested: PV, totalInterest: Math.round(pvGrowth - PV) };
  }

  const annuityFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
  const requiredMonthly = remainingGoal / annuityFactor;
  const totalInvested = PV + requiredMonthly * totalMonths;

  return {
    requiredMonthly: Math.round(requiredMonthly),
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(Math.max(0, FV - totalInvested)),
  };
}

// ==========================================
// 3. MILESTONE & CROSSOVER TRACKER
// ==========================================

export function calculateMilestones(params: {
  initialDeposit: number;
  periodicContribution: number;
  interestRate: number;
  years: number;
  inflationRate?: number;
}): MilestoneItem[] {
  const result = calculateCompoundInterest({
    initialDeposit: params.initialDeposit,
    periodicContribution: params.periodicContribution,
    interestRate: params.interestRate,
    years: params.years,
    inflationRate: params.inflationRate || 0,
  });

  const milestones: MilestoneItem[] = [];
  const annualContrib = params.periodicContribution * 12;

  // 1. Crossover Point: Year when annual interest earned exceeds annual contributions
  let crossoverYear: number | null = null;
  for (const t of result.timeline) {
    if (t.year > 0 && t.interest >= annualContrib && annualContrib > 0) {
      crossoverYear = t.year;
      milestones.push({
        id: 'crossover',
        title: 'Compounding Crossover Point',
        subtitle: `Your portfolio's annual growth ($${t.interest.toLocaleString()}/yr) exceeds your annual contributions ($${annualContrib.toLocaleString()}/yr).`,
        year: t.year,
        balance: t.totalBalance,
        type: 'crossover',
        icon: 'Zap',
        achieved: true,
      });
      break;
    }
  }

  // 2. Rule of 72 Doubling Milestones
  if (params.initialDeposit > 0) {
    const doubleTarget = params.initialDeposit * 2;
    const quadTarget = params.initialDeposit * 4;

    const doubleRow = result.timeline.find((t) => t.totalBalance >= doubleTarget);
    if (doubleRow) {
      milestones.push({
        id: 'double',
        title: 'Principal 2x Doubled',
        subtitle: `Accumulated balance crossed 2x your initial deposit ($${doubleTarget.toLocaleString()}).`,
        year: doubleRow.year,
        balance: doubleRow.totalBalance,
        type: 'doubling',
        icon: 'TrendingUp',
        achieved: true,
      });
    }

    const quadRow = result.timeline.find((t) => t.totalBalance >= quadTarget);
    if (quadRow) {
      milestones.push({
        id: 'quad',
        title: 'Principal 4x Quadrupled',
        subtitle: `Wealth scaled past 4x original capital ($${quadTarget.toLocaleString()}).`,
        year: quadRow.year,
        balance: quadRow.totalBalance,
        type: 'doubling',
        icon: 'Sparkles',
        achieved: true,
      });
    }
  }

  // 3. Absolute Target Milestones ($100k, $250k, $500k, $1M, $2M)
  const targets = [100000, 250000, 500000, 1000000, 2000000];
  targets.forEach((tgt) => {
    const hitRow = result.timeline.find((t) => t.totalBalance >= tgt);
    if (hitRow && !milestones.some((m) => Math.abs(m.balance - hitRow.totalBalance) < 10000)) {
      milestones.push({
        id: `target-${tgt}`,
        title: `$${(tgt / 1000).toFixed(0)}k Milestone Reached`,
        subtitle: `Hit in Year ${hitRow.year} with $${hitRow.deposits > 0 ? (hitRow.principal).toLocaleString() : ''} total principal invested.`,
        year: hitRow.year,
        balance: hitRow.totalBalance,
        type: 'target',
        icon: 'Target',
        achieved: true,
      });
    }
  });

  return milestones.sort((a, b) => a.year - b.year);
}

// ==========================================
// 4. SENSITIVITY MATRIX GENERATOR
// ==========================================

export function generateSensitivityMatrix(params: {
  initialDeposit: number;
  periodicContribution: number;
  interestRate: number;
  years: number;
  inflationRate?: number;
}): {
  baseValue: number;
  rateDeltas: number[];
  yearDeltas: number[];
  matrix: SensitivityCell[][];
} {
  const baseResult = calculateCompoundInterest({
    initialDeposit: params.initialDeposit,
    periodicContribution: params.periodicContribution,
    interestRate: params.interestRate,
    years: params.years,
    inflationRate: params.inflationRate || 0,
  });

  const rateDeltas = [-2, -1, 0, 1, 2];
  const yearDeltas = [-5, -2, 0, 2, 5];

  const matrix: SensitivityCell[][] = [];

  yearDeltas.forEach((yOffset) => {
    const row: SensitivityCell[] = [];
    const simulatedYears = Math.max(1, params.years + yOffset);

    rateDeltas.forEach((rOffset) => {
      const simulatedRate = Math.max(0.1, params.interestRate + rOffset);
      const cellRes = calculateCompoundInterest({
        initialDeposit: params.initialDeposit,
        periodicContribution: params.periodicContribution,
        interestRate: simulatedRate,
        years: simulatedYears,
        inflationRate: params.inflationRate || 0,
      });

      const diffFromBase = cellRes.futureValue - baseResult.futureValue;
      const diffPercent = baseResult.futureValue > 0 ? (diffFromBase / baseResult.futureValue) * 100 : 0;

      row.push({
        rateOffset: rOffset,
        rate: Math.round(simulatedRate * 10) / 10,
        yearsOffset: yOffset,
        years: simulatedYears,
        futureValue: cellRes.futureValue,
        realFutureValue: cellRes.realFutureValue,
        diffFromBase,
        diffPercent: Math.round(diffPercent * 10) / 10,
      });
    });

    matrix.push(row);
  });

  return {
    baseValue: baseResult.futureValue,
    rateDeltas,
    yearDeltas,
    matrix,
  };
}

// ==========================================
// 5. "WHY DID MY RESULT CHANGE?" DELTA ENGINE
// ==========================================

export function generateDeltaExplanation(
  prevInputs: CompoundInterestInputs,
  currentInputs: CompoundInterestInputs
): DeltaExplanation | null {
  const prevRes = calculateCompoundInterest(prevInputs);
  const curRes = calculateCompoundInterest(currentInputs);

  const diffFV = curRes.futureValue - prevRes.futureValue;
  if (Math.abs(diffFV) < 1) return null;

  const percentDiff = prevRes.futureValue > 0 ? (diffFV / prevRes.futureValue) * 100 : 0;
  const bullets: string[] = [];

  // Rate change
  const rateDiff = (currentInputs.interestRate || 0) - (prevInputs.interestRate || 0);
  if (Math.abs(rateDiff) >= 0.05) {
    bullets.push(
      `Rate shifted from ${prevInputs.interestRate}% to ${currentInputs.interestRate}% (${rateDiff > 0 ? '+' : ''}${rateDiff.toFixed(1)}%), altering exponential growth velocity by ${rateDiff > 0 ? '+' : ''}$${Math.abs(diffFV).toLocaleString()}.`
    );
  }

  // Years change
  const yearDiff = (currentInputs.years || 0) - (prevInputs.years || 0);
  if (yearDiff !== 0) {
    bullets.push(
      `Time horizon shifted by ${yearDiff > 0 ? '+' : ''}${yearDiff} year(s). Additional duration allows the existing corpus to compound recursively through ${Math.abs(yearDiff)} extra growth cycles.`
    );
  }

  // Contribution change
  const pmtDiff = (currentInputs.periodicContribution || 0) - (prevInputs.periodicContribution || 0);
  if (Math.abs(pmtDiff) > 0) {
    const totalExtraDeposits = pmtDiff * 12 * (currentInputs.years || 1);
    bullets.push(
      `Monthly contribution adjusted by ${pmtDiff > 0 ? '+' : ''}$${pmtDiff.toLocaleString()}/mo (${pmtDiff > 0 ? '+' : ''}$${totalExtraDeposits.toLocaleString()} total principal deposited).`
    );
  }

  // Principal change
  const pDiff = (currentInputs.initialDeposit || 0) - (prevInputs.initialDeposit || 0);
  if (Math.abs(pDiff) > 0) {
    bullets.push(
      `Initial principal changed by ${pDiff > 0 ? '+' : ''}$${pDiff.toLocaleString()}, compounding from Day 1.`
    );
  }

  let primaryCause = 'Multiple Parameters Modified';
  if (Math.abs(rateDiff) >= 0.05 && yearDiff === 0 && pmtDiff === 0 && pDiff === 0) {
    primaryCause = `Annual Return Rate ${rateDiff > 0 ? 'Increase' : 'Decrease'}`;
  } else if (yearDiff !== 0 && Math.abs(rateDiff) < 0.05 && pmtDiff === 0 && pDiff === 0) {
    primaryCause = `Investment Horizon ${yearDiff > 0 ? 'Extended' : 'Shortened'}`;
  } else if (pmtDiff !== 0 && Math.abs(rateDiff) < 0.05 && yearDiff === 0 && pDiff === 0) {
    primaryCause = `Periodic Contribution ${pmtDiff > 0 ? 'Boost' : 'Reduction'}`;
  }

  return {
    primaryCause,
    summary: `Your projected portfolio shifted by ${diffFV >= 0 ? '+' : ''}$${diffFV.toLocaleString()} (${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%).`,
    absoluteDiff: diffFV,
    percentDiff: Math.round(percentDiff * 10) / 10,
    contributionDiff: curRes.totalPrincipal - prevRes.totalPrincipal,
    growthDiff: curRes.totalInterest - prevRes.totalInterest,
    bulletPoints: bullets,
  };
}

// ==========================================
// 6. NATURAL LANGUAGE QUERY COMPILER
// ==========================================

export interface ParsedFinancialQuery {
  rawQuery: string;
  matchedIntent: CalculationMode;
  confidence: number;
  extractedParams: {
    principal?: number;
    contribution?: number;
    interestRate?: number;
    years?: number;
    targetAmount?: number;
    inflationRate?: number;
  };
  inferredAssumptions: string[];
  explanation: string;
}

export function compileNaturalLanguageQuery(query: string): ParsedFinancialQuery | null {
  if (!query || query.trim().length < 3) return null;
  const text = query.toLowerCase();

  const extracted: ParsedFinancialQuery['extractedParams'] = {};
  const assumptions: string[] = [];

  // Match numbers with k/m/million/k modifiers or currency signs
  // e.g., "$500 a month", "$10,000", "$1 million", "1m", "8%", "20 years"
  
  // 1. Monthly contribution matching
  const monthlyMatch = text.match(/(?:\$|€|£|₹)?\s*(\d+(?:[,\.]\d+)?)\s*(?:k)?\s*(?:\/mo|a month|per month|monthly)/i);
  if (monthlyMatch) {
    let val = parseFloat(monthlyMatch[1].replace(/,/g, ''));
    if (monthlyMatch[0].includes('k')) val *= 1000;
    extracted.contribution = val;
  }

  // 2. Lump sum / Initial principal / Target
  const dollarMatches = Array.from(text.matchAll(/(?:\$|€|£|₹)\s*(\d+(?:[,\.]\d+)?)\s*(k|m|million|billion)?/gi));
  dollarMatches.forEach((m) => {
    let val = parseFloat(m[1].replace(/,/g, ''));
    const unit = (m[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    if (unit === 'm' || unit === 'million') val *= 1000000;
    if (unit === 'billion') val *= 1000000000;

    const surrounding = text.substring(Math.max(0, m.index! - 20), Math.min(text.length, m.index! + 30));
    if (surrounding.includes('target') || surrounding.includes('reach') || surrounding.includes('goal') || surrounding.includes('to get') || surrounding.includes('accumulate') || surrounding.includes('retire with')) {
      extracted.targetAmount = val;
    } else if (surrounding.includes('month') || surrounding.includes('mo')) {
      if (!extracted.contribution) extracted.contribution = val;
    } else {
      if (!extracted.principal && !extracted.targetAmount) extracted.principal = val;
      else if (!extracted.targetAmount && val >= 50000) extracted.targetAmount = val;
    }
  });

  // Plain word million/k check (e.g., "1 million")
  const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:million|mil|m\b)/i);
  if (millionMatch && !extracted.targetAmount) {
    extracted.targetAmount = parseFloat(millionMatch[1]) * 1000000;
  }

  // 3. Percentage / Rate matching
  const rateMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (rateMatch) {
    extracted.interestRate = parseFloat(rateMatch[1]);
  } else {
    const returnWordMatch = text.match(/(?:at|with|return of|interest of)\s*(\d+(?:\.\d+)?)/i);
    if (returnWordMatch) {
      extracted.interestRate = parseFloat(returnWordMatch[1]);
    }
  }

  // 4. Years / Duration matching
  const yearsMatch = text.match(/(\d+)\s*(?:years|yrs|year|yr)/i);
  if (yearsMatch) {
    extracted.years = parseInt(yearsMatch[1], 10);
  }

  // 5. Detect Intent / Operation
  let matchedIntent: CalculationMode = 'future_value';
  let explanation = 'Calculating Future Value based on regular savings and compounding.';

  if (text.includes('how much should i invest') || text.includes('how much to save') || text.includes('required contribution') || text.includes('monthly to reach') || text.includes('how much monthly')) {
    matchedIntent = 'required_contribution';
    explanation = 'Solving for Required Monthly Contribution to achieve target wealth.';
  } else if (text.includes('how long') || text.includes('how many years') || text.includes('time to reach') || text.includes('when will i')) {
    matchedIntent = 'time_horizon';
    explanation = 'Solving for Time Horizon (years and months) to hit target balance.';
  } else if (text.includes('starting investment') || text.includes('initial deposit') || text.includes('starting lump sum')) {
    matchedIntent = 'initial_principal';
    explanation = 'Solving for Required Initial Starting Capital.';
  } else if (text.includes('what return') || text.includes('required rate') || text.includes('what interest rate')) {
    matchedIntent = 'required_return';
    explanation = 'Solving for Required Annualized Rate of Return.';
  }

  // Infill standard defaults if not mentioned
  if (!extracted.interestRate) {
    extracted.interestRate = 8.0;
    assumptions.push('Assumed default 8.0% annual index fund return');
  }
  if (!extracted.years && matchedIntent !== 'time_horizon') {
    extracted.years = 20;
    assumptions.push('Assumed 20-year investment horizon');
  }
  if (extracted.principal === undefined) {
    extracted.principal = 10000;
  }
  if (extracted.contribution === undefined && matchedIntent !== 'required_contribution') {
    extracted.contribution = 500;
  }
  if (!extracted.targetAmount && (matchedIntent === 'required_contribution' || matchedIntent === 'time_horizon' || matchedIntent === 'required_return')) {
    extracted.targetAmount = 1000000;
    assumptions.push('Assumed $1,000,000 target nest egg');
  }

  return {
    rawQuery: query,
    matchedIntent,
    confidence: 0.95,
    extractedParams: extracted,
    inferredAssumptions: assumptions,
    explanation,
  };
}

// ==========================================
// 7. CALCULATION FINGERPRINT & ENCODER
// ==========================================

export function generateCalculationFingerprint(
  mode: CalculationMode,
  inputs: Record<string, any>
): CalculationFingerprint {
  const normInputs = {
    principal: Number(inputs.initialDeposit || inputs.principal || 0),
    contribution: Number(inputs.periodicContribution || inputs.contribution || 0),
    contributionFreq: String(inputs.contributionFrequency || 'monthly'),
    rate: Number(inputs.interestRate || inputs.rate || 8),
    compoundingFreq: String(inputs.compoundingFrequency || 'annually'),
    years: Number(inputs.years || 20),
    targetAmount: Number(inputs.targetAmount || 1000000),
    inflationRate: Number(inputs.inflationRate || 0),
    annualStepUp: Number(inputs.annualStepUp || 0),
  };

  const rawKey = `${mode}-${normInputs.principal}-${normInputs.contribution}-${normInputs.rate}-${normInputs.years}-${normInputs.inflationRate}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }

  return {
    version: 'compound-v2.5',
    mode,
    inputs: normInputs,
    hash: `ci_${Math.abs(hash).toString(36)}`,
    timestamp: Date.now(),
  };
}
