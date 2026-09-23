/**
 * High-Performance Monte Carlo Probabilistic Engine
 * Supports PRNG with seed reproducibility, multi-distribution generation,
 * correlated stochastic variables, convergence analysis, tornado sensitivity,
 * and reverse probability solvers.
 */

// Simple, ultra-fast Mulberry32 PRNG
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DistributionType = 'normal' | 'lognormal' | 'uniform' | 'triangular';

export interface DistributionConfig {
  type: DistributionType;
  mean?: number; // for normal / lognormal
  stdDev?: number; // for normal / lognormal
  min?: number; // for uniform / triangular
  max?: number; // for uniform / triangular
  mode?: number; // for triangular
}

/**
 * Generates standard normal random variable using Box-Muller transform
 */
export function sampleStandardNormal(prng: () => number): [number, number] {
  let u1 = prng();
  let u2 = prng();
  while (u1 <= 1e-15) u1 = prng(); // Avoid log(0)
  const r = Math.sqrt(-2.0 * Math.log(u1));
  const theta = 2.0 * Math.PI * u2;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * Sample a single value from a specified distribution
 */
export function sampleDistribution(dist: DistributionConfig, prng: () => number): number {
  switch (dist.type) {
    case 'normal': {
      const [z] = sampleStandardNormal(prng);
      const mean = dist.mean ?? 0;
      const stdDev = dist.stdDev ?? 1;
      return mean + z * stdDev;
    }
    case 'lognormal': {
      const [z] = sampleStandardNormal(prng);
      const mean = dist.mean ?? 0;
      const stdDev = dist.stdDev ?? 1;
      // Convert normal parameters to lognormal underlying parameters
      const varNorm = Math.log(1 + (stdDev * stdDev) / (mean * mean || 1));
      const muNorm = Math.log(Math.max(0.001, mean)) - 0.5 * varNorm;
      const sigmaNorm = Math.sqrt(varNorm);
      return Math.exp(muNorm + z * sigmaNorm);
    }
    case 'uniform': {
      const min = dist.min ?? 0;
      const max = dist.max ?? 1;
      return min + prng() * (max - min);
    }
    case 'triangular': {
      const min = dist.min ?? 0;
      const max = dist.max ?? 1;
      const mode = dist.mode ?? (min + max) / 2;
      const u = prng();
      const f = (mode - min) / (max - min || 1);
      if (u <= f) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
      } else {
        return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
      }
    }
    default:
      return prng();
  }
}

/**
 * Correlated 2-Variable Standard Normal Pair via Cholesky factor (rho)
 */
export function sampleCorrelatedNormals(rho: number, prng: () => number): [number, number] {
  const [z1, z2] = sampleStandardNormal(prng);
  const zCorrelated = rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2;
  return [z1, zCorrelated];
}

export type SimulatorMode = 'generic' | 'investment' | 'retirement' | 'goal' | 'business';

export interface SimulationResult {
  mode: SimulatorMode;
  trials: number;
  seed: number;
  mean: number;
  median: number;
  stdDev: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p05: number;
  probabilitySuccess: number; // 0 to 100
  probabilityLoss: number; // 0 to 100
  standardError: number;
  ci95Low: number;
  ci95High: number;
  targetValue: number;
  histogram: { binStart: number; binEnd: number; count: number; percentage: number; label: string }[];
  timeTrajectories?: {
    year: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    deterministic: number;
  }[];
  convergenceCurve: { trials: number; probability: number; errorMargin: number }[];
  probabilityLadder: { target: number; probability: number; label: string }[];
}

export interface InvestmentSimulationInputs {
  startingPortfolio: number;
  annualContribution: number;
  years: number;
  expectedReturn: number; // in %
  volatility: number; // in %
  inflation: number; // in %
  fees: number; // in %
  targetAmount: number;
  distribution: DistributionType;
  trials?: number;
  seed?: number;
}

export interface RetirementSimulationInputs {
  currentPortfolio: number;
  currentAge: number;
  retirementAge: number;
  annualContribution: number;
  annualSpending: number;
  expectedReturn: number;
  volatility: number;
  inflation: number;
  retirementYears: number;
  trials?: number;
  seed?: number;
}

export interface BusinessRiskInputs {
  expectedCustomers: number;
  customerVolatility: number;
  pricePerUnit: number;
  costPerUnit: number;
  fixedCosts: number;
  correlationPriceVolume: number;
  trials?: number;
  seed?: number;
}

export interface GenericSimulationInputs {
  distribution: DistributionConfig;
  targetValue: number;
  operator: 'gte' | 'lte';
  trials?: number;
  seed?: number;
}

/**
 * Execute Investment Monte Carlo Simulation
 */
export function runInvestmentMonteCarlo(inputs: InvestmentSimulationInputs): SimulationResult {
  const trials = Math.min(100000, Math.max(1000, inputs.trials || 10000));
  const seed = inputs.seed ?? 123456;
  const prng = createPRNG(seed);

  const years = Math.max(1, inputs.years);
  const mu = (inputs.expectedReturn - inputs.fees - inputs.inflation) / 100;
  const sigma = inputs.volatility / 100;

  const terminalBalances: number[] = new Array(trials);
  let successCount = 0;
  let lossCount = 0;

  // Track yearly distribution points (sample 200 paths for percentiles over time)
  const trajectorySampleCount = Math.min(2000, trials);
  const trajectoryMatrix: number[][] = Array.from({ length: years + 1 }, () => []);

  for (let i = 0; i < trials; i++) {
    let balance = inputs.startingPortfolio;
    const isTrajectorySample = i < trajectorySampleCount;

    if (isTrajectorySample) {
      trajectoryMatrix[0].push(balance);
    }

    for (let yr = 1; yr <= years; yr++) {
      // Annual return generated from distribution
      let annualReturn = 0;
      if (inputs.distribution === 'normal' || !inputs.distribution) {
        const [z] = sampleStandardNormal(prng);
        annualReturn = mu + z * sigma;
      } else if (inputs.distribution === 'lognormal') {
        annualReturn = sampleDistribution({ type: 'lognormal', mean: 1 + mu, stdDev: sigma }, prng) - 1;
      } else if (inputs.distribution === 'uniform') {
        annualReturn = sampleDistribution({ type: 'uniform', min: mu - 1.732 * sigma, max: mu + 1.732 * sigma }, prng);
      } else if (inputs.distribution === 'triangular') {
        annualReturn = sampleDistribution({ type: 'triangular', min: mu - 2.45 * sigma, mode: mu, max: mu + 2.45 * sigma }, prng);
      }

      balance = balance * (1 + annualReturn) + inputs.annualContribution;
      if (balance < 0) balance = 0;

      if (isTrajectorySample) {
        trajectoryMatrix[yr].push(balance);
      }
    }

    terminalBalances[i] = balance;
    if (balance >= inputs.targetAmount) successCount++;
    if (balance < inputs.startingPortfolio) lossCount++;
  }

  // Sort terminal values for percentile calculation
  terminalBalances.sort((a, b) => a - b);

  const mean = terminalBalances.reduce((sum, v) => sum + v, 0) / trials;
  const getPercentile = (p: number) => terminalBalances[Math.floor(p * (trials - 1))];

  const p05 = getPercentile(0.05);
  const p10 = getPercentile(0.10);
  const p25 = getPercentile(0.25);
  const p50 = getPercentile(0.50);
  const p75 = getPercentile(0.75);
  const p90 = getPercentile(0.90);
  const p95 = getPercentile(0.95);

  const variance = terminalBalances.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / trials;
  const stdDev = Math.sqrt(variance);

  const probabilitySuccess = (successCount / trials) * 100;
  const probabilityLoss = (lossCount / trials) * 100;
  const p = probabilitySuccess / 100;
  const standardError = Math.sqrt((p * (1 - p)) / trials) * 100;
  const ci95Low = Math.max(0, probabilitySuccess - 1.96 * standardError);
  const ci95High = Math.min(100, probabilitySuccess + 1.96 * standardError);

  // Compute Histogram (24 bins)
  const minVal = p05;
  const maxVal = p95;
  const binCount = 20;
  const binSize = (maxVal - minVal) / binCount || 1;
  const histogram = Array.from({ length: binCount }, (_, idx) => {
    const binStart = minVal + idx * binSize;
    const binEnd = binStart + binSize;
    const count = terminalBalances.filter((v) => v >= binStart && (idx === binCount - 1 ? v <= binEnd : v < binEnd)).length;
    return {
      binStart,
      binEnd,
      count,
      percentage: (count / trials) * 100,
      label: `$${(binStart / 1000).toFixed(0)}k–$${(binEnd / 1000).toFixed(0)}k`,
    };
  });

  // Yearly trajectory percentiles
  const timeTrajectories = Array.from({ length: years + 1 }, (_, yr) => {
    const list = trajectoryMatrix[yr].sort((a, b) => a - b);
    const count = list.length;
    const getTP = (pct: number) => list[Math.floor(pct * (count - 1))] || 0;

    // Deterministic compound baseline
    let det = inputs.startingPortfolio;
    for (let y = 1; y <= yr; y++) {
      det = det * (1 + mu) + inputs.annualContribution;
    }

    return {
      year: yr,
      p10: getTP(0.10),
      p25: getTP(0.25),
      p50: getTP(0.50),
      p75: getTP(0.75),
      p90: getTP(0.90),
      deterministic: det,
    };
  });

  // Convergence batches (1k, 2.5k, 5k, 10k, 25k, 50k, trials)
  const batchSteps = [1000, 2500, 5000, 10000, 25000, 50000, 100000].filter((b) => b <= trials);
  if (!batchSteps.includes(trials)) batchSteps.push(trials);

  const convergenceCurve = batchSteps.map((b) => {
    const sample = terminalBalances.slice(0, b);
    const successInSample = sample.filter((v) => v >= inputs.targetAmount).length;
    const prob = (successInSample / b) * 100;
    const err = Math.sqrt(((prob / 100) * (1 - prob / 100)) / b) * 100;
    return { trials: b, probability: Number(prob.toFixed(1)), errorMargin: Number(err.toFixed(2)) };
  });

  // Probability Ladder around target (-50%, -25%, 0%, +25%, +50%, +100%)
  const ladderMultipliers = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const probabilityLadder = ladderMultipliers.map((mult) => {
    const target = inputs.targetAmount * mult;
    const hits = terminalBalances.filter((v) => v >= target).length;
    const prob = (hits / trials) * 100;
    return {
      target,
      probability: Number(prob.toFixed(1)),
      label: mult === 1.0 ? 'Baseline Target' : `${mult > 1 ? '+' : ''}${Math.round((mult - 1) * 100)}% Target`,
    };
  });

  return {
    mode: 'investment',
    trials,
    seed,
    mean,
    median: p50,
    stdDev,
    p10,
    p25,
    p50,
    p75,
    p90,
    p95,
    p05,
    probabilitySuccess: Number(probabilitySuccess.toFixed(1)),
    probabilityLoss: Number(probabilityLoss.toFixed(1)),
    standardError: Number(standardError.toFixed(2)),
    ci95Low: Number(ci95Low.toFixed(1)),
    ci95High: Number(ci95High.toFixed(1)),
    targetValue: inputs.targetAmount,
    histogram,
    timeTrajectories,
    convergenceCurve,
    probabilityLadder,
  };
}

/**
 * Execute Retirement Portfolio Longevity Monte Carlo Simulation
 */
export function runRetirementMonteCarlo(inputs: RetirementSimulationInputs): SimulationResult {
  const trials = Math.min(100000, Math.max(1000, inputs.trials || 10000));
  const seed = inputs.seed ?? 987654;
  const prng = createPRNG(seed);

  const accumulationYears = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const decumulationYears = Math.max(1, inputs.retirementYears);
  const totalYears = accumulationYears + decumulationYears;

  const mu = (inputs.expectedReturn - inputs.inflation) / 100;
  const sigma = inputs.volatility / 100;

  const terminalBalances: number[] = new Array(trials);
  let survivingCount = 0;

  const trajectorySampleCount = Math.min(2000, trials);
  const trajectoryMatrix: number[][] = Array.from({ length: totalYears + 1 }, () => []);

  for (let i = 0; i < trials; i++) {
    let balance = inputs.currentPortfolio;
    const isSample = i < trajectorySampleCount;

    if (isSample) trajectoryMatrix[0].push(balance);

    for (let yr = 1; yr <= totalYears; yr++) {
      const [z] = sampleStandardNormal(prng);
      const annualReturn = mu + z * sigma;

      if (yr <= accumulationYears) {
        // Accumulation phase
        balance = balance * (1 + annualReturn) + inputs.annualContribution;
      } else {
        // Decumulation phase
        balance = (balance - inputs.annualSpending) * (1 + annualReturn);
      }

      if (balance < 0) balance = 0;
      if (isSample) trajectoryMatrix[yr].push(balance);
    }

    terminalBalances[i] = balance;
    if (balance > 0) survivingCount++;
  }

  terminalBalances.sort((a, b) => a - b);

  const mean = terminalBalances.reduce((sum, v) => sum + v, 0) / trials;
  const getPercentile = (p: number) => terminalBalances[Math.floor(p * (trials - 1))];

  const p05 = getPercentile(0.05);
  const p10 = getPercentile(0.10);
  const p25 = getPercentile(0.25);
  const p50 = getPercentile(0.50);
  const p75 = getPercentile(0.75);
  const p90 = getPercentile(0.90);
  const p95 = getPercentile(0.95);

  const variance = terminalBalances.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / trials;
  const stdDev = Math.sqrt(variance);

  const probabilitySuccess = (survivingCount / trials) * 100;
  const p = probabilitySuccess / 100;
  const standardError = Math.sqrt((p * (1 - p)) / trials) * 100;

  // Histogram
  const minVal = p05;
  const maxVal = p95;
  const binCount = 20;
  const binSize = (maxVal - minVal) / binCount || 1;
  const histogram = Array.from({ length: binCount }, (_, idx) => {
    const binStart = minVal + idx * binSize;
    const binEnd = binStart + binSize;
    const count = terminalBalances.filter((v) => v >= binStart && (idx === binCount - 1 ? v <= binEnd : v < binEnd)).length;
    return {
      binStart,
      binEnd,
      count,
      percentage: (count / trials) * 100,
      label: `$${(binStart / 1000).toFixed(0)}k–$${(binEnd / 1000).toFixed(0)}k`,
    };
  });

  // Time trajectories
  const timeTrajectories = Array.from({ length: totalYears + 1 }, (_, yr) => {
    const list = trajectoryMatrix[yr].sort((a, b) => a - b);
    const count = list.length;
    const getTP = (pct: number) => list[Math.floor(pct * (count - 1))] || 0;

    let det = inputs.currentPortfolio;
    for (let y = 1; y <= yr; y++) {
      if (y <= accumulationYears) {
        det = det * (1 + mu) + inputs.annualContribution;
      } else {
        det = (det - inputs.annualSpending) * (1 + mu);
      }
      if (det < 0) det = 0;
    }

    return {
      year: yr,
      p10: getTP(0.10),
      p25: getTP(0.25),
      p50: getTP(0.50),
      p75: getTP(0.75),
      p90: getTP(0.90),
      deterministic: det,
    };
  });

  const convergenceCurve = [1000, 5000, 10000, 25000, 50000, trials].filter((b) => b <= trials).map((b) => {
    const sample = terminalBalances.slice(0, b);
    const sCount = sample.filter((v) => v > 0).length;
    const prob = (sCount / b) * 100;
    const err = Math.sqrt(((prob / 100) * (1 - prob / 100)) / b) * 100;
    return { trials: b, probability: Number(prob.toFixed(1)), errorMargin: Number(err.toFixed(2)) };
  });

  const spendingMultipliers = [0.7, 0.85, 1.0, 1.15, 1.3];
  const probabilityLadder = spendingMultipliers.map((mult) => {
    // Approximate survival probability under adjusted spending
    const adjProb = Math.min(100, Math.max(0, probabilitySuccess + (1.0 - mult) * 45));
    return {
      target: inputs.annualSpending * mult,
      probability: Number(adjProb.toFixed(1)),
      label: mult === 1.0 ? 'Current Spending' : `${mult > 1 ? '+' : ''}${Math.round((mult - 1) * 100)}% Spending`,
    };
  });

  return {
    mode: 'retirement',
    trials,
    seed,
    mean,
    median: p50,
    stdDev,
    p10,
    p25,
    p50,
    p75,
    p90,
    p95,
    p05,
    probabilitySuccess: Number(probabilitySuccess.toFixed(1)),
    probabilityLoss: Number((100 - probabilitySuccess).toFixed(1)),
    standardError: Number(standardError.toFixed(2)),
    ci95Low: Number(Math.max(0, probabilitySuccess - 1.96 * standardError).toFixed(1)),
    ci95High: Number(Math.min(100, probabilitySuccess + 1.96 * standardError).toFixed(1)),
    targetValue: 0,
    histogram,
    timeTrajectories,
    convergenceCurve,
    probabilityLadder,
  };
}

/**
 * Execute Business / Project Risk Monte Carlo Simulation
 */
export function runBusinessRiskMonteCarlo(inputs: BusinessRiskInputs): SimulationResult {
  const trials = Math.min(100000, Math.max(1000, inputs.trials || 10000));
  const seed = inputs.seed ?? 554433;
  const prng = createPRNG(seed);

  const profits: number[] = new Array(trials);
  let profitableCount = 0;

  for (let i = 0; i < trials; i++) {
    // Generate correlated customer demand and effective realized price
    const [zVol, zPrice] = sampleCorrelatedNormals(inputs.correlationPriceVolume, prng);

    const customers = Math.max(0, inputs.expectedCustomers + zVol * inputs.customerVolatility);
    const price = Math.max(0.01, inputs.pricePerUnit * (1 + zPrice * 0.15));
    const variableCost = customers * inputs.costPerUnit;
    const revenue = customers * price;
    const profit = revenue - variableCost - inputs.fixedCosts;

    profits[i] = profit;
    if (profit > 0) profitableCount++;
  }

  profits.sort((a, b) => a - b);

  const mean = profits.reduce((sum, v) => sum + v, 0) / trials;
  const getPercentile = (p: number) => profits[Math.floor(p * (trials - 1))];

  const p05 = getPercentile(0.05);
  const p10 = getPercentile(0.10);
  const p25 = getPercentile(0.25);
  const p50 = getPercentile(0.50);
  const p75 = getPercentile(0.75);
  const p90 = getPercentile(0.90);
  const p95 = getPercentile(0.95);

  const variance = profits.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / trials;
  const stdDev = Math.sqrt(variance);

  const probabilitySuccess = (profitableCount / trials) * 100;
  const standardError = Math.sqrt(((probabilitySuccess / 100) * (1 - probabilitySuccess / 100)) / trials) * 100;

  const minVal = p05;
  const maxVal = p95;
  const binCount = 20;
  const binSize = (maxVal - minVal) / binCount || 1;
  const histogram = Array.from({ length: binCount }, (_, idx) => {
    const binStart = minVal + idx * binSize;
    const binEnd = binStart + binSize;
    const count = profits.filter((v) => v >= binStart && (idx === binCount - 1 ? v <= binEnd : v < binEnd)).length;
    return {
      binStart,
      binEnd,
      count,
      percentage: (count / trials) * 100,
      label: `$${(binStart / 1000).toFixed(0)}k–$${(binEnd / 1000).toFixed(0)}k`,
    };
  });

  const probabilityLadder = [
    { target: 0, probability: Number(probabilitySuccess.toFixed(1)), label: 'Break-Even (Profit > $0)' },
    { target: 50000, probability: Number(((profits.filter((p) => p >= 50000).length / trials) * 100).toFixed(1)), label: '$50,000 Profit' },
    { target: 100000, probability: Number(((profits.filter((p) => p >= 100000).length / trials) * 100).toFixed(1)), label: '$100,000 Profit' },
    { target: 250000, probability: Number(((profits.filter((p) => p >= 250000).length / trials) * 100).toFixed(1)), label: '$250,000 Profit' },
  ];

  return {
    mode: 'business',
    trials,
    seed,
    mean,
    median: p50,
    stdDev,
    p10,
    p25,
    p50,
    p75,
    p90,
    p95,
    p05,
    probabilitySuccess: Number(probabilitySuccess.toFixed(1)),
    probabilityLoss: Number((100 - probabilitySuccess).toFixed(1)),
    standardError: Number(standardError.toFixed(2)),
    ci95Low: Number(Math.max(0, probabilitySuccess - 1.96 * standardError).toFixed(1)),
    ci95High: Number(Math.min(100, probabilitySuccess + 1.96 * standardError).toFixed(1)),
    targetValue: 0,
    histogram,
    convergenceCurve: [],
    probabilityLadder,
  };
}

/**
 * Dynamic Tornado Sensitivity Engine
 * Computes partial derivatives of success probability with respect to each input parameter.
 */
export interface SensitivityFactor {
  name: string;
  key: string;
  baseValue: number;
  unit: string;
  impactDelta: number; // change in probability points (+/- %)
  positiveProbability: number;
  negativeProbability: number;
  relativeRank: number; // 0 to 100 normalized bar
}

export function computeInvestmentTornadoSensitivity(
  baseInputs: InvestmentSimulationInputs
): SensitivityFactor[] {
  const baseResult = runInvestmentMonteCarlo({ ...baseInputs, trials: 5000 });
  const baseProb = baseResult.probabilitySuccess;

  const factors: { name: string; key: keyof InvestmentSimulationInputs; delta: number; unit: string }[] = [
    { name: 'Annual Contribution', key: 'annualContribution', delta: baseInputs.annualContribution * 0.2 || 1000, unit: '$' },
    { name: 'Expected Return (CAGR)', key: 'expectedReturn', delta: 1.5, unit: '%' },
    { name: 'Volatility (Risk)', key: 'volatility', delta: 3.0, unit: '%' },
    { name: 'Investment Time Horizon', key: 'years', delta: 3, unit: 'yrs' },
    { name: 'Inflation Rate', key: 'inflation', delta: 1.0, unit: '%' },
    { name: 'Investment Fees', key: 'fees', delta: 0.5, unit: '%' },
  ];

  const results: SensitivityFactor[] = factors.map((f) => {
    const baseVal = Number(baseInputs[f.key]) || 0;

    // Positive shift (+delta)
    const posInputs = { ...baseInputs, [f.key]: baseVal + f.delta, trials: 5000 };
    const posProb = runInvestmentMonteCarlo(posInputs).probabilitySuccess;

    // Negative shift (-delta)
    const negInputs = { ...baseInputs, [f.key]: Math.max(0, baseVal - f.delta), trials: 5000 };
    const negProb = runInvestmentMonteCarlo(negInputs).probabilitySuccess;

    const maxSpread = Math.abs(posProb - negProb);

    return {
      name: f.name,
      key: f.key,
      baseValue: baseVal,
      unit: f.unit,
      impactDelta: Number((posProb - baseProb).toFixed(1)),
      positiveProbability: Number(posProb.toFixed(1)),
      negativeProbability: Number(negProb.toFixed(1)),
      relativeRank: maxSpread,
    };
  });

  // Normalize relative ranks to 0-100%
  const maxImpact = Math.max(...results.map((r) => r.relativeRank), 1);
  results.forEach((r) => {
    r.relativeRank = Math.round((r.relativeRank / maxImpact) * 100);
  });

  return results.sort((a, b) => b.relativeRank - a.relativeRank);
}

/**
 * Reverse Monte Carlo Solver (Goal / Contribution Inverse Root-Finder)
 * Finds required monthly/annual savings or target corpus for a target probability (e.g. 75%, 90%).
 */
export function solveRequiredContributionForProbability(
  inputs: InvestmentSimulationInputs,
  targetProbability: number = 80 // 80% confidence
): number {
  let low = 0;
  let high = inputs.targetAmount / Math.max(1, inputs.years);

  for (let iter = 0; iter < 12; iter++) {
    const mid = (low + high) / 2;
    const sim = runInvestmentMonteCarlo({
      ...inputs,
      annualContribution: mid,
      trials: 4000,
    });

    if (sim.probabilitySuccess >= targetProbability) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(high);
}
