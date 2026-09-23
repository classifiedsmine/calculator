/**
 * Safe Mathematical and Financial Calculations
 * High-precision, deterministic, edge-case guarded calculations for 30+ financial models
 */

// 1. Compound Interest
export interface CompoundInterestInputs {
  initialDeposit: number;
  periodicContribution: number;
  contributionFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'yearly';
  interestRate: number;
  years: number;
  compoundingFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually' | 'yearly';
  inflationRate?: number;
  annualStepUp?: number;
}

export interface CompoundInterestResult {
  futureValue: number;
  realFutureValue: number; // Inflation adjusted purchasing power
  totalPrincipal: number;
  totalInterest: number;
  effectiveAnnualRate: number; // APY / EAR
  interestPercentage: number;
  growthMultiplier: number;
  timeline: {
    year: number;
    startBalance: number;
    deposits: number;
    interest: number; // interest earned in this year
    totalInterestAcc: number; // accumulated interest
    principal: number; // total invested to date
    totalBalance: number;
    realBalance: number;
  }[];
}

export function calculateCompoundInterest(inputs: CompoundInterestInputs): CompoundInterestResult {
  const parseFinite = (val: unknown, fallback = 0): number => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  const P = Math.max(0, parseFinite(inputs.initialDeposit, 0));
  let basePMT = Math.max(0, parseFinite(inputs.periodicContribution, 0));
  const r = Math.max(0, parseFinite(inputs.interestRate, 0) / 100);
  const years = Math.max(1, Math.min(100, Math.round(parseFinite(inputs.years, 1))));
  const inflation = Math.max(0, parseFinite(inputs.inflationRate, 0) / 100);
  const stepUp = Math.max(0, parseFinite(inputs.annualStepUp, 0) / 100);

  // Compounding periods per year
  const compFreqStr = inputs.compoundingFrequency || 'annually';
  let n = 1;
  if (compFreqStr === 'daily') n = 365;
  else if (compFreqStr === 'weekly') n = 52;
  else if (compFreqStr === 'biweekly') n = 26;
  else if (compFreqStr === 'monthly') n = 12;
  else if (compFreqStr === 'quarterly') n = 4;
  else if (compFreqStr === 'semiannually') n = 2;
  else n = 1;

  // Effective Annual Rate (EAR) = (1 + r/n)^n - 1
  const effectiveAnnualRate = n > 0 ? (Math.pow(1 + r / n, n) - 1) * 100 : r * 100;

  // Contribution periods per year
  const contribFreqStr = inputs.contributionFrequency || 'monthly';
  let pmtPeriodsPerYear = 12;
  if (contribFreqStr === 'weekly') pmtPeriodsPerYear = 52;
  else if (contribFreqStr === 'biweekly') pmtPeriodsPerYear = 26;
  else if (contribFreqStr === 'monthly') pmtPeriodsPerYear = 12;
  else if (contribFreqStr === 'quarterly') pmtPeriodsPerYear = 4;
  else if (contribFreqStr === 'annually' || contribFreqStr === 'yearly') pmtPeriodsPerYear = 1;
  else pmtPeriodsPerYear = 12;

  // Rate per deposit period: (1 + r/n)^(n / pmtPeriodsPerYear) - 1
  const periodRate = Math.pow(1 + r / n, n / pmtPeriodsPerYear) - 1;

  let currentBalance = P;
  let totalInvested = P;

  const timeline: CompoundInterestResult['timeline'] = [
    {
      year: 0,
      startBalance: P,
      deposits: 0,
      interest: 0,
      totalInterestAcc: 0,
      principal: P,
      totalBalance: P,
      realBalance: P,
    },
  ];

  for (let yr = 1; yr <= years; yr++) {
    const startBalanceYear = currentBalance;
    let depositsThisYear = 0;
    const currentPMT = basePMT * Math.pow(1 + stepUp, yr - 1);

    for (let k = 1; k <= pmtPeriodsPerYear; k++) {
      // Compound interest for deposit period
      currentBalance += currentBalance * periodRate;

      // Regular addition deposit
      if (currentPMT > 0) {
        currentBalance += currentPMT;
        totalInvested += currentPMT;
        depositsThisYear += currentPMT;
      }
    }

    const interestThisYear = Math.max(0, currentBalance - startBalanceYear - depositsThisYear);

    // Inflation adjustment factor: (1 + inflation)^yr
    const inflationFactor = Math.pow(1 + inflation, yr);
    const realBalance = currentBalance / inflationFactor;

    timeline.push({
      year: yr,
      startBalance: Number(startBalanceYear.toFixed(2)),
      deposits: Number(depositsThisYear.toFixed(2)),
      interest: Number(interestThisYear.toFixed(2)),
      totalInterestAcc: Number(Math.max(0, currentBalance - totalInvested).toFixed(2)),
      principal: Number(totalInvested.toFixed(2)),
      totalBalance: Number(currentBalance.toFixed(2)),
      realBalance: Number(realBalance.toFixed(2)),
    });
  }

  const finalBalance = Number(currentBalance.toFixed(2));
  const finalPrincipal = Number(totalInvested.toFixed(2));
  const finalInterest = Number(Math.max(0, finalBalance - finalPrincipal).toFixed(2));
  const finalReal = Number((finalBalance / Math.pow(1 + inflation, years)).toFixed(2));
  const interestPercentage = finalBalance > 0 ? (finalInterest / finalBalance) * 100 : 0;
  const growthMultiplier = finalPrincipal > 0 ? finalBalance / finalPrincipal : 1;

  return {
    futureValue: finalBalance,
    realFutureValue: finalReal,
    totalPrincipal: finalPrincipal,
    totalInterest: finalInterest,
    effectiveAnnualRate: Math.round(effectiveAnnualRate * 100) / 100,
    interestPercentage: Math.round(interestPercentage * 10) / 10,
    growthMultiplier: Math.round(growthMultiplier * 100) / 100,
    timeline,
  };
}

/**
 * Calculates Required Monthly Contribution to reach a Target Corpus
 */
export function calculateRequiredInvestmentForGoal(params: {
  targetAmount: number;
  initialDeposit: number;
  interestRate: number;
  years: number;
}): { requiredMonthly: number; totalInvested: number; totalInterest: number } {
  const FV = Math.max(100, params.targetAmount);
  const PV = Math.max(0, params.initialDeposit);
  const r = Math.max(0.1, params.interestRate) / 100;
  const n = 12;
  const t = Math.max(1, params.years);
  const monthlyRate = r / n;
  const totalMonths = t * 12;

  // FV = PV*(1+monthlyRate)^totalMonths + PMT * [((1+monthlyRate)^totalMonths - 1) / monthlyRate]
  const pvGrowth = PV * Math.pow(1 + monthlyRate, totalMonths);
  const remainingGoal = Math.max(0, FV - pvGrowth);

  if (remainingGoal <= 0) {
    return { requiredMonthly: 0, totalInvested: PV, totalInterest: Math.round(pvGrowth - PV) };
  }

  const annuityFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
  const requiredMonthly = remainingGoal / annuityFactor;
  const totalInvested = PV + requiredMonthly * totalMonths;
  const totalInterest = Math.max(0, FV - totalInvested);

  return {
    requiredMonthly: Math.round(requiredMonthly),
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(totalInterest),
  };
}

/**
 * Calculates Time Horizon in Years to reach a Target Goal
 */
export function calculateTimeToReachGoal(params: {
  targetAmount: number;
  initialDeposit: number;
  monthlyContribution: number;
  interestRate: number;
}): { years: number; months: number; totalInvested: number } {
  const FV = Math.max(100, params.targetAmount);
  const PV = Math.max(0, params.initialDeposit);
  const PMT = Math.max(0, params.monthlyContribution);
  const r = Math.max(0.1, params.interestRate) / 100;
  const monthlyRate = r / 12;

  if (PV >= FV) return { years: 0, months: 0, totalInvested: PV };

  let current = PV;
  let months = 0;
  let totalInvested = PV;

  while (current < FV && months < 1200) {
    months++;
    current = current * (1 + monthlyRate) + PMT;
    totalInvested += PMT;
  }

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    totalInvested: Math.round(totalInvested),
  };
}

// 2. Loan EMI
export interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  prepaymentMonthly?: number;
}

export interface LoanResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  interestRatio: number;
  actualMonths: number;
  amortization: {
    year: number;
    principalPaidYear: number;
    interestPaidYear: number;
    remainingBalance: number;
  }[];
}

export function calculateLoanEmi(inputs: LoanInputs): LoanResult {
  const P = Math.max(1, inputs.loanAmount || 0);
  const annualRate = Math.max(0.1, inputs.interestRate || 0);
  const r = annualRate / 12 / 100;
  const totalMonths = Math.max(1, Math.round((inputs.tenureYears || 1) * 12));
  const extraPmt = Math.max(0, inputs.prepaymentMonthly || 0);

  const emi = (P * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);

  let balance = P;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let monthsElapsed = 0;

  const amortization: LoanResult['amortization'] = [];
  let currentYearPrincipal = 0;
  let currentYearInterest = 0;

  for (let m = 1; m <= totalMonths && balance > 0; m++) {
    monthsElapsed++;
    const interestForMonth = balance * r;
    let principalForMonth = (emi - interestForMonth) + extraPmt;

    if (principalForMonth > balance) {
      principalForMonth = balance;
    }

    balance -= principalForMonth;
    totalInterestPaid += interestForMonth;
    totalPaid += (principalForMonth + interestForMonth);

    currentYearPrincipal += principalForMonth;
    currentYearInterest += interestForMonth;

    if (m % 12 === 0 || balance <= 0) {
      amortization.push({
        year: Math.ceil(m / 12),
        principalPaidYear: Math.round(currentYearPrincipal),
        interestPaidYear: Math.round(currentYearInterest),
        remainingBalance: Math.max(0, Math.round(balance)),
      });
      currentYearPrincipal = 0;
      currentYearInterest = 0;
    }
  }

  return {
    monthlyEmi: Math.round(emi),
    totalPayment: Math.round(totalPaid),
    totalInterest: Math.round(totalInterestPaid),
    interestRatio: totalPaid > 0 ? (totalInterestPaid / totalPaid) * 100 : 0,
    actualMonths: monthsElapsed,
    amortization,
  };
}

// 3. SIP & Step-Up
export interface SipInputs {
  monthlyInvestment: number;
  expectedReturnRate: number;
  timePeriodYears: number;
  annualStepUpPercent?: number;
  contributionTiming?: 'beginning' | 'end';
  contributionFrequency?: 'month' | 'year';
}

export function calculateSip(inputs: SipInputs) {
  const parseFinite = (val: unknown, fallback = 0): number => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  const monthlyInvestmentParsed = inputs.monthlyInvestment === undefined || inputs.monthlyInvestment === null
    ? 1000
    : parseFinite(inputs.monthlyInvestment, 1000);
  const p0 = Math.max(0, monthlyInvestmentParsed);

  const rateParsed = inputs.expectedReturnRate === undefined || inputs.expectedReturnRate === null
    ? 12
    : parseFinite(inputs.expectedReturnRate, 12);
  const r = Math.max(0, rateParsed) / 100 / 12;

  const yearsParsed = inputs.timePeriodYears === undefined || inputs.timePeriodYears === null
    ? 10
    : parseFinite(inputs.timePeriodYears, 10);
  const years = Math.max(1, Math.min(50, Math.round(yearsParsed)));

  const stepUpParsed = inputs.annualStepUpPercent === undefined || inputs.annualStepUpPercent === null
    ? 0
    : parseFinite(inputs.annualStepUpPercent, 0);
  const stepUp = Math.max(0, stepUpParsed / 100);

  const timing = inputs.contributionTiming || 'end';
  const freq = inputs.contributionFrequency || 'month';

  let totalInvested = 0;
  let currentBalance = 0;
  let currentContribution = p0;

  const timeline: { year: number; invested: number; returns: number; totalValue: number }[] = [
    { year: 0, invested: 0, returns: 0, totalValue: 0 }
  ];

  for (let yr = 1; yr <= years; yr++) {
    for (let m = 1; m <= 12; m++) {
      let isDepositMonth = false;
      if (freq === 'month') {
        isDepositMonth = true;
      } else if (freq === 'year') {
        if (timing === 'beginning' && m === 1) isDepositMonth = true;
        if (timing === 'end' && m === 12) isDepositMonth = true;
      }

      if (isDepositMonth) {
        if (timing === 'beginning') {
          currentBalance = (currentBalance + currentContribution) * (1 + r);
        } else {
          currentBalance = currentBalance * (1 + r) + currentContribution;
        }
        totalInvested += currentContribution;
      } else {
        currentBalance = currentBalance * (1 + r);
      }
    }

    timeline.push({
      year: yr,
      invested: Math.round(totalInvested),
      returns: Math.round(Math.max(0, currentBalance - totalInvested)),
      totalValue: Math.round(currentBalance)
    });

    if (stepUp > 0) {
      currentContribution = currentContribution * (1 + stepUp);
    }
  }

  return {
    investedAmount: Math.round(totalInvested),
    estimatedReturns: Math.round(Math.max(0, currentBalance - totalInvested)),
    totalValue: Math.round(currentBalance),
    timeline
  };
}

// 4. Retirement Corpus
export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  monthlyExpenses: number;
  expectedInflation: number;
  postRetirementReturn: number;
  currentSavings: number;
  monthlyInvestment: number;
  preRetirementReturn: number;
}

export function calculateRetirement(inputs: RetirementInputs) {
  const curAge = inputs.currentAge || 30;
  const retAge = Math.max(curAge + 1, inputs.retirementAge || 60);
  const yearsToRetire = retAge - curAge;
  const monthlyExp = inputs.monthlyExpenses || 50000;
  const inflation = (inputs.expectedInflation || 6) / 100;
  const preRet = (inputs.preRetirementReturn || 12) / 100;
  const postRet = (inputs.postRetirementReturn || 8) / 100;

  const futureMonthlyExpense = monthlyExp * Math.pow(1 + inflation, yearsToRetire);
  const futureAnnualExpense = futureMonthlyExpense * 12;
  const yearsInRetirement = Math.max(15, 85 - retAge);
  const realPostRate = (postRet - inflation) / (1 + inflation);
  
  let corpusRequired = 0;
  if (Math.abs(realPostRate) < 0.0001) {
    corpusRequired = futureAnnualExpense * yearsInRetirement;
  } else {
    corpusRequired = futureAnnualExpense * ((1 - Math.pow(1 + realPostRate, -yearsInRetirement)) / realPostRate) * (1 + realPostRate);
  }

  const pmtMonth = inputs.monthlyInvestment || 20000;
  const rMonth = preRet / 12;
  const months = yearsToRetire * 12;

  let projectedWealth = (inputs.currentSavings || 0) * Math.pow(1 + preRet, yearsToRetire);
  if (rMonth > 0) {
    projectedWealth += pmtMonth * ((Math.pow(1 + rMonth, months) - 1) / rMonth) * (1 + rMonth);
  } else {
    projectedWealth += pmtMonth * months;
  }

  const timeline: { age: number; corpusTarget: number; projected: number }[] = [];
  for (let age = curAge; age <= retAge; age++) {
    const yr = age - curAge;
    const pWealth = (inputs.currentSavings || 0) * Math.pow(1 + preRet, yr) + 
      (rMonth > 0 ? pmtMonth * ((Math.pow(1 + rMonth, yr * 12) - 1) / rMonth) * (1 + rMonth) : pmtMonth * yr * 12);
    timeline.push({
      age,
      corpusTarget: Math.round((corpusRequired / yearsToRetire) * Math.max(1, yr)),
      projected: Math.round(pWealth)
    });
  }

  return {
    futureMonthlyExpense: Math.round(futureMonthlyExpense),
    corpusRequired: Math.round(corpusRequired),
    projectedWealth: Math.round(projectedWealth),
    shortfallOrSurplus: Math.round(projectedWealth - corpusRequired),
    fundedPercentage: corpusRequired > 0 ? Math.min(250, (projectedWealth / corpusRequired) * 100) : 100,
    timeline
  };
}

// 5. Income Tax Comparison (New Regime vs Old Regime)
export function calculateIncomeTax(grossSalary: number, deductions80C: number = 150000, hra80D: number = 50000) {
  const stdDeductionNew = 75000;
  const stdDeductionOld = 50000;

  // New Regime (FY 2024-25 / 2025-26 Indian Slabs)
  const taxableNew = Math.max(0, grossSalary - stdDeductionNew);
  let taxNew = 0;
  if (taxableNew > 1500000) {
    taxNew = 150000 + (taxableNew - 1500000) * 0.30;
  } else if (taxableNew > 1200000) {
    taxNew = 90000 + (taxableNew - 1200000) * 0.20;
  } else if (taxableNew > 1000000) {
    taxNew = 60000 + (taxableNew - 1000000) * 0.15;
  } else if (taxableNew > 700000) {
    taxNew = 30000 + (taxableNew - 700000) * 0.10;
  } else if (taxableNew > 300000) {
    taxNew = (taxableNew - 300000) * 0.05;
  }
  // Section 87A rebate for taxable income <= 7,00,000 in new regime
  if (taxableNew <= 700000) {
    taxNew = 0;
  }
  const cessNew = taxNew * 0.04;
  const totalTaxNew = Math.round(taxNew + cessNew);

  // Old Regime
  const totalDeductionsOld = stdDeductionOld + Math.min(150000, deductions80C) + hra80D;
  const taxableOld = Math.max(0, grossSalary - totalDeductionsOld);
  let taxOld = 0;
  if (taxableOld > 1000000) {
    taxOld = 112500 + (taxableOld - 1000000) * 0.30;
  } else if (taxableOld > 500000) {
    taxOld = 12500 + (taxableOld - 500000) * 0.20;
  } else if (taxableOld > 250000) {
    taxOld = (taxableOld - 250000) * 0.05;
  }
  if (taxableOld <= 500000) {
    taxOld = 0;
  }
  const cessOld = taxOld * 0.04;
  const totalTaxOld = Math.round(taxOld + cessOld);

  const difference = totalTaxOld - totalTaxNew;
  const recommendedRegime = totalTaxNew <= totalTaxOld ? 'New Tax Regime' : 'Old Tax Regime';

  return {
    taxNew: totalTaxNew,
    taxOld: totalTaxOld,
    difference: Math.abs(difference),
    recommendedRegime,
    effectiveRateNew: grossSalary > 0 ? (totalTaxNew / grossSalary) * 100 : 0,
    effectiveRateOld: grossSalary > 0 ? (totalTaxOld / grossSalary) * 100 : 0,
  };
}

// 6. Inflation & Purchasing Power
export function calculateInflation(presentAmount: number, inflationRate: number, years: number) {
  const r = inflationRate / 100;
  const futureCost = presentAmount * Math.pow(1 + r, years);
  const futurePurchasingPower = presentAmount / Math.pow(1 + r, years);
  const powerLossPercent = ((presentAmount - futurePurchasingPower) / presentAmount) * 100;

  const timeline = [];
  for (let y = 0; y <= years; y++) {
    timeline.push({
      year: y,
      futureCost: Math.round(presentAmount * Math.pow(1 + r, y)),
      purchasingPower: Math.round(presentAmount / Math.pow(1 + r, y)),
    });
  }

  return {
    futureCost: Math.round(futureCost),
    futurePurchasingPower: Math.round(futurePurchasingPower),
    powerLossPercent: Math.round(powerLossPercent),
    timeline,
  };
}

// 7. Emergency Fund
export function calculateEmergencyFund(
  monthlyHousing: number,
  monthlyFood: number,
  monthlyEmi: number,
  monthlyEssentials: number,
  targetMonths: number = 6,
  currentSavings: number = 0
) {
  const monthlyTotal = monthlyHousing + monthlyFood + monthlyEmi + monthlyEssentials;
  const targetCorpus = monthlyTotal * targetMonths;
  const gap = targetCorpus - currentSavings;
  const coverageMonths = monthlyTotal > 0 ? currentSavings / monthlyTotal : 0;

  return {
    monthlyTotal: Math.round(monthlyTotal),
    targetCorpus: Math.round(targetCorpus),
    gap: Math.round(gap),
    coverageMonths: Number(coverageMonths.toFixed(1)),
    status: currentSavings >= targetCorpus ? 'Fully Funded' : 'Deficit',
  };
}

// 8. Debt Payoff: Snowball vs Avalanche
export interface DebtItem {
  name: string;
  balance: number;
  rate: number;
  minPayment: number;
}

export function calculateDebtPayoff(debts: DebtItem[], extraMonthlyPayment: number) {
  // Avalanche (sort by highest rate first)
  const avalancheDebts = debts.map(d => ({ ...d })).sort((a, b) => b.rate - a.rate);
  // Snowball (sort by lowest balance first)
  const snowballDebts = debts.map(d => ({ ...d })).sort((a, b) => a.balance - b.balance);

  const simulatePayoff = (debtList: DebtItem[]) => {
    let months = 0;
    let totalInterest = 0;
    let currentDebts = debtList.map(d => ({ ...d }));

    while (currentDebts.some(d => d.balance > 0) && months < 360) {
      months++;
      let extra = extraMonthlyPayment;

      // Apply interest
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const mInterest = d.balance * (d.rate / 100 / 12);
          totalInterest += mInterest;
          d.balance += mInterest;
        }
      });

      // Pay minimums
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const pmt = Math.min(d.balance, d.minPayment);
          d.balance -= pmt;
        }
      });

      // Apply extra snowball/avalanche payment to top active debt
      for (const d of currentDebts) {
        if (d.balance > 0 && extra > 0) {
          const pmt = Math.min(d.balance, extra);
          d.balance -= pmt;
          extra -= pmt;
        }
      }
    }

    return { months, totalInterest: Math.round(totalInterest) };
  };

  const avalanche = simulatePayoff(avalancheDebts);
  const snowball = simulatePayoff(snowballDebts);

  return {
    avalancheMonths: avalanche.months,
    avalancheInterest: avalanche.totalInterest,
    snowballMonths: snowball.months,
    snowballInterest: snowball.totalInterest,
    interestSaved: Math.max(0, snowball.totalInterest - avalanche.totalInterest),
  };
}

// 9. Fixed Deposit (FD) & Recurring Deposit (RD)
export function calculateFdRd(
  type: 'fd' | 'rd',
  amount: number,
  rate: number,
  tenureYears: number,
  compounding: 'monthly' | 'quarterly' | 'annually' = 'quarterly'
) {
  const r = rate / 100;
  const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1;
  const t = tenureYears;

  if (type === 'fd') {
    // FD Formula: A = P(1 + r/n)^(n*t)
    const maturity = amount * Math.pow(1 + r / n, n * t);
    const interest = maturity - amount;
    return {
      invested: Math.round(amount),
      maturity: Math.round(maturity),
      interest: Math.round(interest),
      effectiveYield: Number((((maturity - amount) / (amount * t)) * 100).toFixed(2)),
    };
  } else {
    // RD Formula: Monthly installments with compounding
    const months = t * 12;
    let totalInvested = amount * months;
    let totalMaturity = 0;
    for (let m = 1; m <= months; m++) {
      const remainingTimeYears = (months - m + 1) / 12;
      totalMaturity += amount * Math.pow(1 + r / n, n * remainingTimeYears);
    }
    const interest = totalMaturity - totalInvested;
    return {
      invested: Math.round(totalInvested),
      maturity: Math.round(totalMaturity),
      interest: Math.round(interest),
      effectiveYield: Number(((interest / totalInvested) * 100).toFixed(2)),
    };
  }
}

// 10. CAGR (Compound Annual Growth Rate)
export function calculateCagr(initialValue: number, finalValue: number, years: number) {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) {
    return { cagr: 0, absoluteReturn: 0, multiplier: 1, timeline: [] };
  }
  const cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  const absoluteReturn = ((finalValue - initialValue) / initialValue) * 100;
  const multiplier = finalValue / initialValue;

  const timeline = [];
  for (let y = 0; y <= years; y++) {
    timeline.push({
      year: y,
      value: Math.round(initialValue * Math.pow(1 + cagr / 100, y)),
    });
  }

  return {
    cagr: Number(cagr.toFixed(2)),
    absoluteReturn: Number(absoluteReturn.toFixed(1)),
    multiplier: Number(multiplier.toFixed(2)),
    timeline,
  };
}

// 11. Home Affordability & Max Loan Eligibility
export function calculateHomeAffordability(
  grossMonthlyIncome: number,
  existingMonthlyEmi: number,
  interestRate: number,
  tenureYears: number,
  downPaymentAvailable: number,
  dtiCapPercent: number = 45
) {
  const maxAllowedEmi = Math.max(0, (grossMonthlyIncome * (dtiCapPercent / 100)) - existingMonthlyEmi);
  const r = (interestRate / 100) / 12;
  const n = tenureYears * 12;

  // Max Loan from max EMI: P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
  let maxLoan = 0;
  if (r > 0 && n > 0) {
    maxLoan = maxAllowedEmi * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }

  const maxAffordableHomePrice = maxLoan + downPaymentAvailable;

  return {
    maxAllowedEmi: Math.round(maxAllowedEmi),
    maxLoan: Math.round(maxLoan),
    maxAffordableHomePrice: Math.round(maxAffordableHomePrice),
    downPaymentPercentage: maxAffordableHomePrice > 0 ? Number(((downPaymentAvailable / maxAffordableHomePrice) * 100).toFixed(1)) : 0,
  };
}

// 12. Car Loan & Vehicle Depreciation
export function calculateCarLoanDepreciation(
  vehiclePrice: number,
  downPayment: number,
  interestRate: number,
  tenureYears: number,
  annualDepreciationRate: number = 15
) {
  const loanAmount = Math.max(0, vehiclePrice - downPayment);
  const loanRes = calculateLoanEmi({
    loanAmount,
    interestRate,
    tenureYears,
  });

  const timeline = [];
  let remainingCarValue = vehiclePrice;
  for (let y = 0; y <= tenureYears; y++) {
    const loanBal = y === 0 ? loanAmount : (loanRes.amortization[y - 1]?.remainingBalance ?? 0);
    timeline.push({
      year: y,
      carValue: Math.round(remainingCarValue),
      loanBalance: Math.round(loanBal),
      equity: Math.round(remainingCarValue - loanBal),
    });
    remainingCarValue = remainingCarValue * (1 - annualDepreciationRate / 100);
  }

  const finalCarValue = vehiclePrice * Math.pow(1 - annualDepreciationRate / 100, tenureYears);
  const totalCostOfOwnership = downPayment + loanRes.totalPayment;

  return {
    monthlyEmi: loanRes.monthlyEmi,
    totalInterest: loanRes.totalInterest,
    finalCarValue: Math.round(finalCarValue),
    totalCostOfOwnership: Math.round(totalCostOfOwnership),
    depreciationLoss: Math.round(vehiclePrice - finalCarValue),
    timeline,
  };
}

// 13. Education Loan Repayment
export function calculateEducationLoan(
  principalAmount: number,
  interestRate: number,
  courseYears: number,
  gracePeriodYears: number,
  repaymentTenureYears: number
) {
  const r = (interestRate / 100) / 12;
  const moratoriumMonths = (courseYears + gracePeriodYears) * 12;
  
  // Simple interest accrues during study moratorium
  const accruedMoratoriumInterest = principalAmount * (interestRate / 100) * (courseYears + gracePeriodYears);
  const principalAtRepaymentStart = principalAmount + accruedMoratoriumInterest;

  const repaymentRes = calculateLoanEmi({
    loanAmount: principalAtRepaymentStart,
    interestRate,
    tenureYears: repaymentTenureYears,
  });

  return {
    accruedMoratoriumInterest: Math.round(accruedMoratoriumInterest),
    principalAtRepaymentStart: Math.round(principalAtRepaymentStart),
    monthlyEmi: repaymentRes.monthlyEmi,
    totalRepaymentInterest: repaymentRes.totalInterest,
    totalLoanCost: Math.round(principalAtRepaymentStart + repaymentRes.totalInterest),
  };
}

// 14. Take-Home / In-Hand Salary
export function calculateTakeHomeSalary(annualGrossCtc: number, pfPercent: number = 12) {
  const basicSalary = annualGrossCtc * 0.50;
  const employeePf = basicSalary * (pfPercent / 100);
  const professionalTax = 2500; // standard annual professional tax
  const taxRes = calculateIncomeTax(annualGrossCtc);

  const totalDeductions = employeePf + professionalTax + taxRes.taxNew;
  const netAnnualTakeHome = Math.max(0, annualGrossCtc - totalDeductions);
  const netMonthlyTakeHome = Math.round(netAnnualTakeHome / 12);

  return {
    netMonthlyTakeHome,
    netAnnualTakeHome: Math.round(netAnnualTakeHome),
    monthlyGross: Math.round(annualGrossCtc / 12),
    monthlyPf: Math.round(employeePf / 12),
    monthlyTax: Math.round(taxRes.taxNew / 12),
    takeHomePercentage: Number(((netAnnualTakeHome / annualGrossCtc) * 100).toFixed(1)),
  };
}

// 15. Lumpsum Investment Return
export function calculateLumpsum(principal: number, returnRate: number, years: number) {
  const r = returnRate / 100;
  const maturityValue = principal * Math.pow(1 + r, years);
  const wealthGain = maturityValue - principal;
  const multiplier = maturityValue / (principal || 1);

  const timeline = [];
  for (let y = 0; y <= years; y++) {
    timeline.push({
      year: y,
      invested: principal,
      gain: Math.round(principal * Math.pow(1 + r, y) - principal),
      total: Math.round(principal * Math.pow(1 + r, y)),
    });
  }

  return {
    maturityValue: Math.round(maturityValue),
    wealthGain: Math.round(wealthGain),
    multiplier: Number(multiplier.toFixed(2)),
    timeline,
  };
}

// 16. Simple vs Compound Interest
export function calculateSimpleVsCompound(principal: number, rate: number, years: number) {
  const r = rate / 100;
  const simpleInterestTotal = principal + (principal * r * years);
  const compoundInterestTotal = principal * Math.pow(1 + r, years);
  const delta = compoundInterestTotal - simpleInterestTotal;

  const timeline = [];
  for (let y = 0; y <= years; y++) {
    timeline.push({
      year: y,
      simple: Math.round(principal + (principal * r * y)),
      compound: Math.round(principal * Math.pow(1 + r, y)),
    });
  }

  return {
    simpleTotal: Math.round(simpleInterestTotal),
    compoundTotal: Math.round(compoundInterestTotal),
    delta: Math.round(delta),
    timeline,
  };
}

// 17. Stock Average / Buy the Dip
export function calculateStockAverage(
  p1Shares: number,
  p1Price: number,
  p2Shares: number,
  p2Price: number,
  targetPrice: number
) {
  const totalCost = (p1Shares * p1Price) + (p2Shares * p2Price);
  const totalShares = p1Shares + p2Shares;
  const avgCostBasis = totalShares > 0 ? totalCost / totalShares : 0;
  const profitAtTarget = totalShares * (targetPrice - avgCostBasis);
  const priceReduction = p1Price - avgCostBasis;

  return {
    avgCostBasis: Number(avgCostBasis.toFixed(2)),
    totalShares,
    totalInvested: Math.round(totalCost),
    profitAtTarget: Math.round(profitAtTarget),
    priceReductionPercent: p1Price > 0 ? Number(((priceReduction / p1Price) * 100).toFixed(2)) : 0,
  };
}

// 18. Net Worth Tracker
export function calculateNetWorth(
  liquidCash: number,
  investments: number,
  realEstate: number,
  retirement: number,
  mortgageDebt: number,
  autoDebt: number,
  creditCardDebt: number
) {
  const totalAssets = liquidCash + investments + realEstate + retirement;
  const totalLiabilities = mortgageDebt + autoDebt + creditCardDebt;
  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  return {
    netWorth: Math.round(netWorth),
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    debtToAssetRatio: Number(debtToAssetRatio.toFixed(1)),
  };
}

// 19. Capital Gains Tax (STCG vs LTCG)
export function calculateCapitalGains(
  assetType: 'equity' | 'property' | 'crypto',
  buyPrice: number,
  salePrice: number,
  holdingMonths: number
) {
  const gain = Math.max(0, salePrice - buyPrice);
  let isLongTerm = false;
  let taxRate = 0;
  let exemption = 0;

  if (assetType === 'equity') {
    isLongTerm = holdingMonths >= 12;
    taxRate = isLongTerm ? 12.5 : 20; // Budget 2024 revised rates
    exemption = isLongTerm ? 125000 : 0;
  } else if (assetType === 'property') {
    isLongTerm = holdingMonths >= 24;
    taxRate = 12.5; // Budget 2024 property LTCG without indexation
  } else {
    // Crypto
    isLongTerm = false;
    taxRate = 30; // Flat 30% VDA tax
  }

  const taxableGain = Math.max(0, gain - exemption);
  const taxLiability = taxableGain * (taxRate / 100);
  const netProceeds = salePrice - taxLiability;

  return {
    gain: Math.round(gain),
    taxableGain: Math.round(taxableGain),
    taxLiability: Math.round(taxLiability),
    netProceeds: Math.round(netProceeds),
    taxType: isLongTerm ? 'Long Term Capital Gains (LTCG)' : 'Short Term Capital Gains (STCG)',
    effectiveTaxRate: gain > 0 ? Number(((taxLiability / gain) * 100).toFixed(1)) : 0,
  };
}

// 20. FIRE / Crossover Calculator
export function calculateFireCrossover(
  currentAge: number,
  annualExpenses: number,
  currentNetWorth: number,
  annualSavings: number,
  realReturnRate: number = 7,
  safeWithdrawalRate: number = 4
) {
  const fireNumber = annualExpenses * (100 / safeWithdrawalRate);
  let age = currentAge;
  let portfolio = currentNetWorth;
  let crossoverYear = 0;

  const timeline = [];
  while (age <= 80) {
    const passiveIncome = portfolio * (safeWithdrawalRate / 100);
    timeline.push({
      age,
      portfolio: Math.round(portfolio),
      fireTarget: Math.round(fireNumber),
      passiveIncome: Math.round(passiveIncome),
      annualExpenses,
    });

    if (portfolio >= fireNumber && crossoverYear === 0) {
      crossoverYear = age;
    }

    portfolio = (portfolio + annualSavings) * (1 + realReturnRate / 100);
    age++;
  }

  return {
    fireNumber: Math.round(fireNumber),
    crossoverAge: crossoverYear || '80+',
    yearsToFire: crossoverYear ? Math.max(0, crossoverYear - currentAge) : '30+ yrs',
    currentFireProgress: Math.min(100, Number(((currentNetWorth / fireNumber) * 100).toFixed(1))),
    timeline: timeline.slice(0, 35),
  };
}

// 21. Monte Carlo Probabilistic Simulation
export function runMonteCarloSimulation(
  initialValue: number,
  annualAddition: number,
  expectedReturn: number,
  volatility: number = 0.15,
  years: number = 20,
  runs: number = 1000
) {
  const outcomes: number[] = [];

  for (let r = 0; r < runs; r++) {
    let balance = initialValue;
    for (let y = 1; y <= years; y++) {
      const u1 = Math.max(0.00001, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const simulatedReturn = expectedReturn + z * volatility;
      balance = (balance + annualAddition) * (1 + simulatedReturn);
    }
    outcomes.push(Math.max(0, balance));
  }

  outcomes.sort((a, b) => a - b);
  const p10 = outcomes[Math.floor(runs * 0.1)];
  const median = outcomes[Math.floor(runs * 0.5)];
  const p90 = outcomes[Math.floor(runs * 0.9)];

  const minVal = outcomes[0];
  const maxVal = outcomes[outcomes.length - 1];
  const bucketCount = 10;
  const step = (maxVal - minVal) / bucketCount || 1;
  const distribution: { bucket: string; count: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bStart = minVal + i * step;
    const bEnd = bStart + step;
    const count = outcomes.filter(v => v >= bStart && (i === bucketCount - 1 ? v <= bEnd : v < bEnd)).length;
    distribution.push({
      bucket: `${Math.round(bStart / 100000)}L`,
      count
    });
  }

  return {
    percentile10: Math.round(p10),
    median: Math.round(median),
    percentile90: Math.round(p90),
    distribution
  };
}

// 22. XIRR (Extended Internal Rate of Return)
export function calculateXirr(
  initialCashflow: number,
  monthlyCashflow: number,
  currentValuation: number,
  durationYears: number
) {
  const totalInvested = initialCashflow + (monthlyCashflow * durationYears * 12);
  const gain = currentValuation - totalInvested;

  // Newton-Raphson approximation for annualized XIRR
  let rate = 0.10;
  for (let iter = 0; iter < 20; iter++) {
    let npv = -initialCashflow;
    let dNpv = 0;
    const months = durationYears * 12;
    for (let m = 1; m <= months; m++) {
      const t = m / 12;
      const df = Math.pow(1 + rate, -t);
      npv -= monthlyCashflow * df;
      dNpv += t * monthlyCashflow * Math.pow(1 + rate, -t - 1);
    }
    const finalDf = Math.pow(1 + rate, -durationYears);
    npv += currentValuation * finalDf;
    dNpv -= durationYears * currentValuation * Math.pow(1 + rate, -durationYears - 1);

    const nextRate = rate - (npv / (dNpv || 1));
    if (Math.abs(nextRate - rate) < 0.0001) break;
    rate = Math.max(-0.5, Math.min(2.0, nextRate));
  }

  return {
    xirr: Number((rate * 100).toFixed(2)),
    totalInvested: Math.round(totalInvested),
    gain: Math.round(gain),
    absoluteReturn: totalInvested > 0 ? Number(((gain / totalInvested) * 100).toFixed(1)) : 0,
  };
}

// 23. Loan Prepayment & Tenure Reduction
export function calculateLoanPrepayment(
  principal: number,
  interestRate: number,
  tenureYears: number,
  annualPrepaymentLumpSum: number
) {
  const baseRes = calculateLoanEmi({
    loanAmount: principal,
    interestRate,
    tenureYears,
  });

  const r = (interestRate / 100) / 12;
  let balance = principal;
  let totalInterestWithPrepay = 0;
  let monthsWithPrepay = 0;

  for (let m = 1; m <= tenureYears * 12 && balance > 0; m++) {
    monthsWithPrepay++;
    const interest = balance * r;
    let principalPaid = baseRes.monthlyEmi - interest;
    if (m % 12 === 0) {
      principalPaid += annualPrepaymentLumpSum;
    }
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
    totalInterestWithPrepay += interest;
  }

  const interestSaved = Math.max(0, baseRes.totalInterest - totalInterestWithPrepay);
  const monthsSaved = Math.max(0, (tenureYears * 12) - monthsWithPrepay);

  return {
    baseEmi: baseRes.monthlyEmi,
    originalTotalInterest: baseRes.totalInterest,
    newTotalInterest: Math.round(totalInterestWithPrepay),
    interestSaved: Math.round(interestSaved),
    yearsSaved: Number((monthsSaved / 12).toFixed(1)),
    newTenureYears: Number((monthsWithPrepay / 12).toFixed(1)),
  };
}

// 24. SWP (Systematic Withdrawal Plan)
export function calculateSwp(
  initialCorpus: number,
  monthlyWithdrawal: number,
  expectedReturnRate: number,
  durationYears: number,
  annualInflationEscalation: number = 0
) {
  const r = (expectedReturnRate / 100) / 12;
  let balance = initialCorpus;
  let currentMonthlyPayout = monthlyWithdrawal;
  let totalWithdrawn = 0;

  const timeline = [];
  for (let yr = 1; yr <= durationYears; yr++) {
    let yearWithdrawn = 0;
    for (let m = 1; m <= 12; m++) {
      if (balance > 0) {
        balance = balance * (1 + r);
        const payout = Math.min(balance, currentMonthlyPayout);
        balance -= payout;
        yearWithdrawn += payout;
        totalWithdrawn += payout;
      }
    }
    timeline.push({
      year: yr,
      remainingCorpus: Math.max(0, Math.round(balance)),
      totalWithdrawn: Math.round(totalWithdrawn),
    });

    if (annualInflationEscalation > 0) {
      currentMonthlyPayout = currentMonthlyPayout * (1 + annualInflationEscalation / 100);
    }
  }

  return {
    endingBalance: Math.max(0, Math.round(balance)),
    totalWithdrawn: Math.round(totalWithdrawn),
    depleted: balance <= 0,
    timeline,
  };
}

// 25. Rent vs Buy Decision Engine
export function calculateRentVsBuy(
  propertyPrice: number,
  downPaymentPercent: number,
  homeLoanRate: number,
  monthlyRent: number,
  homeAppreciationRate: number = 6,
  investmentReturnRate: number = 12,
  years: number = 15
) {
  const downPayment = propertyPrice * (downPaymentPercent / 100);
  const loanAmount = propertyPrice - downPayment;
  const loanRes = calculateLoanEmi({ loanAmount, interestRate: homeLoanRate, tenureYears: years });

  let renterPortfolio = downPayment; // Renter invests down payment in market
  const rentGrowth = 0.05; // 5% annual rent inflation

  const timeline = [];
  for (let y = 1; y <= years; y++) {
    // Buyer home value
    const homeVal = propertyPrice * Math.pow(1 + homeAppreciationRate / 100, y);
    const remainingLoan = loanRes.amortization[Math.min(y - 1, loanRes.amortization.length - 1)]?.remainingBalance ?? 0;
    const buyerNetEquity = homeVal - remainingLoan;

    // Renter equity growth
    const currentYearRent = (monthlyRent * 12) * Math.pow(1 + rentGrowth, y - 1);
    const buyerAnnualCost = (loanRes.monthlyEmi * 12) + (propertyPrice * 0.01); // 1% maintenance
    const renterMonthlySavings = Math.max(0, buyerAnnualCost - currentYearRent);

    renterPortfolio = (renterPortfolio + renterMonthlySavings) * (1 + investmentReturnRate / 100);

    timeline.push({
      year: y,
      buyerEquity: Math.round(buyerNetEquity),
      renterPortfolio: Math.round(renterPortfolio),
    });
  }

  const finalBuyerEquity = timeline[timeline.length - 1]?.buyerEquity ?? 0;
  const finalRenterEquity = timeline[timeline.length - 1]?.renterPortfolio ?? 0;

  return {
    finalBuyerEquity,
    finalRenterEquity,
    verdict: finalBuyerEquity >= finalRenterEquity ? 'Buying Creates More Wealth' : 'Renting & Investing Creates More Wealth',
    wealthDelta: Math.abs(finalBuyerEquity - finalRenterEquity),
    timeline,
  };
}

// 26. Discounted Cash Flow (DCF) & Intrinsic Valuation
export function calculateDcf(
  freeCashFlow: number,
  growthRate5Y: number,
  terminalGrowthRate: number,
  waccDiscountRate: number,
  sharesOutstanding: number,
  currentMarketPrice: number
) {
  const g = growthRate5Y / 100;
  const tg = terminalGrowthRate / 100;
  const r = waccDiscountRate / 100;

  let pvCashFlows = 0;
  let currentFcf = freeCashFlow;

  for (let y = 1; y <= 5; y++) {
    currentFcf = currentFcf * (1 + g);
    const pv = currentFcf / Math.pow(1 + r, y);
    pvCashFlows += pv;
  }

  const terminalValue = (currentFcf * (1 + tg)) / (r - tg);
  const pvTerminalValue = terminalValue / Math.pow(1 + r, 5);
  const enterpriseValue = pvCashFlows + pvTerminalValue;
  const intrinsicValuePerShare = sharesOutstanding > 0 ? enterpriseValue / sharesOutstanding : 0;
  const marginOfSafety = currentMarketPrice > 0 ? ((intrinsicValuePerShare - currentMarketPrice) / currentMarketPrice) * 100 : 0;

  return {
    intrinsicValuePerShare: Number(intrinsicValuePerShare.toFixed(2)),
    marginOfSafety: Number(marginOfSafety.toFixed(1)),
    status: marginOfSafety >= 0 ? 'Undervalued (Favorable)' : 'Overvalued',
    enterpriseValue: Math.round(enterpriseValue),
    pvCashFlows: Math.round(pvCashFlows),
    pvTerminalValue: Math.round(pvTerminalValue),
  };
}

// 27. Freelance & Side-Hustle Tax
export function calculateFreelanceTax(
  grossRevenue: number,
  businessExpenses: number,
  usePresumptiveTax: boolean = true
) {
  // Presumptive 44ADA (50% deemed profit) vs Actual Expense
  const taxableProfit = usePresumptiveTax 
    ? grossRevenue * 0.50 
    : Math.max(0, grossRevenue - businessExpenses);

  const taxRes = calculateIncomeTax(taxableProfit);
  const advanceTaxQuarterly = Math.round(taxRes.taxNew / 4);

  return {
    grossRevenue,
    taxableProfit: Math.round(taxableProfit),
    totalTax: taxRes.taxNew,
    advanceTaxQuarterly,
    netProfitAfterTax: Math.round(grossRevenue - (usePresumptiveTax ? 0 : businessExpenses) - taxRes.taxNew),
    effectiveTaxRate: grossRevenue > 0 ? Number(((taxRes.taxNew / grossRevenue) * 100).toFixed(1)) : 0,
  };
}

// 28. Credit Card Reward Points & Cashback Optimizer
export function calculateCreditCardRewards(
  monthlyDiningGrocery: number,
  monthlyTravel: number,
  monthlyShopping: number,
  monthlyUtilities: number,
  pointValueCents: number = 1.0, // e.g. 1 rupee / 1 cent per pt
  cardAnnualFee: number = 2500
) {
  const pointsDining = (monthlyDiningGrocery * 12) * 0.05; // 5% rewards
  const pointsTravel = (monthlyTravel * 12) * 0.10; // 10% rewards
  const pointsShopping = (monthlyShopping * 12) * 0.03; // 3% rewards
  const pointsUtilities = (monthlyUtilities * 12) * 0.01; // 1% rewards

  const totalPointsAnnual = pointsDining + pointsTravel + pointsShopping + pointsUtilities;
  const grossRewardValue = totalPointsAnnual * pointValueCents;
  const netBenefit = grossRewardValue - cardAnnualFee;
  const totalAnnualSpend = (monthlyDiningGrocery + monthlyTravel + monthlyShopping + monthlyUtilities) * 12;

  return {
    grossRewardValue: Math.round(grossRewardValue),
    netBenefit: Math.round(netBenefit),
    effectiveYield: totalAnnualSpend > 0 ? Number(((grossRewardValue / totalAnnualSpend) * 100).toFixed(2)) : 0,
    totalAnnualSpend: Math.round(totalAnnualSpend),
  };
}

// 29. Subscription & Recurring Expense Drain
export function calculateSubscriptionDrain(
  monthlyStreaming: number,
  monthlySoftware: number,
  monthlyFitness: number,
  monthlyOther: number,
  expectedReturnRate: number = 12,
  years: number = 10
) {
  const monthlyTotal = monthlyStreaming + monthlySoftware + monthlyFitness + monthlyOther;
  const annualTotal = monthlyTotal * 12;
  const directOutflow = annualTotal * years;

  // Opportunity cost if invested instead
  const sipRes = calculateSip({
    monthlyInvestment: monthlyTotal,
    expectedReturnRate,
    timePeriodYears: years,
  });

  return {
    monthlyTotal: Math.round(monthlyTotal),
    annualTotal: Math.round(annualTotal),
    directOutflow: Math.round(directOutflow),
    opportunityCostWealth: sipRes.totalValue,
    lostGrowthGain: sipRes.estimatedReturns,
  };
}

// 30. Biometrics / BMI
export function calculateBmi(weightKg: number, heightCm: number) {
  const hM = heightCm / 100;
  if (hM <= 0 || weightKg <= 0) return { bmi: 0, category: 'Unknown', healthyRange: '18.5 - 24.9' };
  const bmi = weightKg / (hM * hM);
  let category = 'Normal';
  let color = '#35E6A0';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#29D8FF';
  } else if (bmi < 25) {
    category = 'Optimal Weight';
    color = '#35E6A0';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#FFB84D';
  } else {
    category = 'Obese';
    color = '#FF5D73';
  }

  const minHealthyWeight = 18.5 * (hM * hM);
  const maxHealthyWeight = 24.9 * (hM * hM);

  return {
    bmi: Number(bmi.toFixed(1)),
    category,
    color,
    healthyRange: `${minHealthyWeight.toFixed(1)}kg - ${maxHealthyWeight.toFixed(1)}kg`
  };
}
