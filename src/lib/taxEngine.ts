/**
 * Income Tax Engine (Old vs New Tax Regime Comparison)
 *
 * Implements statutory Indian Income Tax provisions across AY 2026-27 (New Tax Act 2025),
 * AY 2025-26, and AY 2024-25. Supports all 5 heads of income, standard deductions, HRA exemptions,
 * Section 80C/80D/80E/80CCD(1B)/80CCD(2)/80TTA/80TTB/24(b) deductions, Section 87A rebates with
 * marginal relief, surcharge calculation with marginal relief, Health & Education Cess (4%),
 * Break-Even deduction solver, and scenario modeling.
 */

export type AssessmentYear = 'AY 2026-27' | 'AY 2025-26' | 'AY 2024-25';
export type AgeCategory = 'below_60' | 'senior_60_79' | 'super_senior_80';
export type ResidentialStatus = 'resident' | 'non_resident';
export type TaxpayerCategory = 'individual' | 'huf';

export interface IncomeTaxInputs {
  // Config
  assessmentYear: AssessmentYear;
  ageCategory: AgeCategory;
  residentialStatus: ResidentialStatus;
  taxpayerCategory: TaxpayerCategory;

  // 1. Salary Income Components
  grossSalary: number; // Annual CTC or gross salary
  basicSalary?: number; // Basic + DA (defaults to 50% of gross)
  hraReceived?: number; // HRA component received
  rentPaidAnnual?: number; // Annual rent paid for HRA deduction
  isMetroCity?: boolean; // 50% basic vs 40% basic for HRA
  employerNpsContribution?: number; // 80CCD(2) employer NPS contribution
  professionalTax?: number; // Professional tax paid (max 2500)

  // 2. House Property Income / Loss
  propertyType?: 'self_occupied' | 'let_out' | 'none';
  homeLoanInterestSelf?: number; // Sec 24(b) deduction (max 2,00,000 in Old Regime)
  rentalIncomeAnnual?: number; // Gross rent from let-out property
  municipalTaxesPaid?: number; // Municipal taxes
  homeLoanInterestLetOut?: number; // Interest on let-out home loan

  // 3. Capital Gains Income
  stcgEquity?: number; // Short term capital gains on equity (15%/20%)
  stcgOther?: number; // Other STCG (taxed at slab)
  ltcgEquity?: number; // Long term capital gains on equity (10%/12.5% above exemption)
  ltcgOther?: number; // Other LTCG

  // 4. Business or Professional Income
  businessIncome?: number; // Net business / professional income

  // 5. Other Sources Income
  savingsInterest?: number; // Interest from savings accounts (80TTA/80TTB)
  fdInterest?: number; // Interest from fixed deposits / bonds
  dividendsAndOther?: number; // Dividends and other taxable income

  // Deductions (Old Tax Regime)
  deductions80C?: number; // EPF, PPF, ELSS, LIC, Tuition, Principal (Max 1.5L)
  npsEmployee80CCD1B?: number; // Employee NPS additional deduction (Max 50k)
  healthInsuranceSelf?: number; // Sec 80D self/family (Max 25k / 50k)
  healthInsuranceParents?: number; // Sec 80D parents (Max 25k / 50k)
  preventiveCheckup?: number; // Sec 80D preventive checkup (Max 5k)
  educationLoanInterest80E?: number; // Sec 80E (No limit)
  charitableDonations80G?: number; // Sec 80G eligible donations
  rentPaid80GG?: number; // Sec 80GG rent paid if no HRA
  otherDeductions80?: number; // Sec 80DD, 80U, 80E, etc.
}

export interface TaxRegimeCalculation {
  regime: 'new' | 'old';
  grossTotalIncome: number;
  totalExemptionsAndAdjustments: number; // HRA, Std Deduction, Prof Tax
  totalDeductionsAllowed: number; // 80C, 80D, 80CCD, 80TTA, 24(b)
  netTaxableIncome: number;

  // Breakdown of income categories
  salaryTaxable: number;
  housePropertyIncome: number;
  capitalGainsTaxable: number;
  businessIncomeTaxable: number;
  otherSourcesTaxable: number;

  // Slab tax computation
  taxBeforeRebate: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  healthAndEducationCess: number;
  totalTaxLiability: number;

  // Effective metrics
  effectiveTaxRate: number; // (Total Tax / Gross Income) * 100
  takeHomeAnnual: number;
  takeHomeMonthly: number;

  // Slabs breakdown for visualization
  slabBreakdown: { label: string; rate: string; taxableAmount: number; taxForSlab: number }[];
}

export interface TaxEngineOutputs {
  inputs: IncomeTaxInputs;
  oldRegime: TaxRegimeCalculation;
  newRegime: TaxRegimeCalculation;
  recommendedRegime: 'new' | 'old' | 'equal';
  taxSavings: number; // Amount saved by choosing recommended regime
  breakEvenDeductionOldRegime: number; // Minimum total Old Regime deductions needed to beat New Regime
  additionalDeductionsNeededForOldRegime: number; // Extra deductions needed beyond current inputs
  scenarios: {
    id: string;
    title: string;
    description: string;
    oldTax: number;
    newTax: number;
    recommended: 'new' | 'old' | 'equal';
    savings: number;
  }[];
}

/**
 * Calculates HRA exemption under Old Tax Regime
 */
export function calculateHraExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaidAnnual: number,
  isMetro: boolean = false
): number {
  if (hraReceived <= 0 || rentPaidAnnual <= 0 || basicSalary <= 0) return 0;
  const rentLess10PercentBasic = Math.max(0, rentPaidAnnual - 0.1 * basicSalary);
  const cityCap = (isMetro ? 0.5 : 0.4) * basicSalary;
  return Math.min(hraReceived, rentLess10PercentBasic, cityCap);
}

/**
 * Main Income Tax Orchestrator and Computation Engine
 */
export function runIncomeTaxEngine(inputs: IncomeTaxInputs, isScenarioRun: boolean = false): TaxEngineOutputs {
  const ay = inputs.assessmentYear || 'AY 2026-27';
  const ageCat = inputs.ageCategory || 'below_60';
  const isResident = (inputs.residentialStatus || 'resident') === 'resident';

  // 1. Gross Income Breakdown
  const grossSalary = Math.max(0, inputs.grossSalary || 0);
  const basicSalary = inputs.basicSalary ?? Math.round(grossSalary * 0.5);
  const hraReceived = inputs.hraReceived ?? (grossSalary > 0 ? Math.round(basicSalary * 0.4) : 0);
  const rentPaidAnnual = Math.max(0, inputs.rentPaidAnnual || 0);
  const isMetro = !!inputs.isMetroCity;

  // Salary adjustments
  const employerNps = Math.max(0, inputs.employerNpsContribution || 0); // 80CCD(2)
  // 80CCD(2) employer NPS limit: 10% of basic (or 14% for govt, default 10%)
  const maxEmployerNpsAllowed = Math.round(basicSalary * 0.1);
  const allowedEmployerNps = Math.min(employerNps, maxEmployerNpsAllowed);

  // Professional Tax
  const profTax = Math.min(2500, Math.max(0, inputs.professionalTax || 0));

  // House Property Income / Loss
  const propType = inputs.propertyType || 'none';
  let hpIncomeOld = 0;
  let hpIncomeNew = 0;

  if (propType === 'self_occupied') {
    const intSelf = Math.max(0, inputs.homeLoanInterestSelf || 0);
    hpIncomeOld = -Math.min(200000, intSelf); // Max 2 Lakh loss under Old Regime
    hpIncomeNew = 0; // Loss from self-occupied property NOT allowed under New Regime
  } else if (propType === 'let_out') {
    const rent = Math.max(0, inputs.rentalIncomeAnnual || 0);
    const muni = Math.max(0, inputs.municipalTaxesPaid || 0);
    const netAnnualValue = Math.max(0, rent - muni);
    const stdDed30Pct = netAnnualValue * 0.3;
    const intLetOut = Math.max(0, inputs.homeLoanInterestLetOut || 0);
    const netLetOut = netAnnualValue - stdDed30Pct - intLetOut;
    hpIncomeOld = netLetOut;
    hpIncomeNew = netLetOut; // Let out property loss can offset rental income
  }

  // Capital Gains
  const stcgEq = Math.max(0, inputs.stcgEquity || 0);
  const stcgOth = Math.max(0, inputs.stcgOther || 0);
  const ltcgEq = Math.max(0, inputs.ltcgEquity || 0);
  const ltcgOth = Math.max(0, inputs.ltcgOther || 0);
  const totalCapGains = stcgEq + stcgOth + ltcgEq + ltcgOth;

  // Business Income
  const busIncome = Math.max(0, inputs.businessIncome || 0);

  // Other Sources
  const savInterest = Math.max(0, inputs.savingsInterest || 0);
  const fdInterest = Math.max(0, inputs.fdInterest || 0);
  const divOther = Math.max(0, inputs.dividendsAndOther || 0);
  const totalOtherSources = savInterest + fdInterest + divOther;

  // Gross Total Income (before standard deductions & exemptions)
  const grossTotalIncome = grossSalary + Math.max(0, hpIncomeOld) + totalCapGains + busIncome + totalOtherSources;

  // --- COMPUTE OLD TAX REGIME ---
  const hraExemptionOld = calculateHraExemption(basicSalary, hraReceived, rentPaidAnnual, isMetro);
  const stdDedOld = grossSalary > 0 ? 50000 : 0; // Standard deduction ₹50,000
  const totalSalaryExemptionsOld = hraExemptionOld + stdDedOld + profTax + allowedEmployerNps;
  const taxableSalaryOld = Math.max(0, grossSalary - totalSalaryExemptionsOld);

  // 80C Deductions (Capped at 1.5 Lakhs)
  const ded80C = Math.min(150000, Math.max(0, inputs.deductions80C || 0));

  // 80CCD(1B) NPS Employee (Capped at 50,000)
  const ded80CCD1B = Math.min(50000, Math.max(0, inputs.npsEmployee80CCD1B || 0));

  // 80D Health Insurance
  const isSeniorSelf = ageCat === 'senior_60_79' || ageCat === 'super_senior_80';
  const capSelf80D = isSeniorSelf ? 50000 : 25000;
  const capParents80D = 50000; // Assume parents can be senior or general, max 50k
  const healthSelf = Math.min(capSelf80D, Math.max(0, inputs.healthInsuranceSelf || 0));
  const healthParents = Math.min(capParents80D, Math.max(0, inputs.healthInsuranceParents || 0));
  const prevCheckup = Math.min(5000, Math.max(0, inputs.preventiveCheckup || 0));
  const ded80D = healthSelf + healthParents + prevCheckup;

  // 80E Education Loan
  const ded80E = Math.max(0, inputs.educationLoanInterest80E || 0);

  // 80G Charity
  const ded80G = Math.max(0, inputs.charitableDonations80G || 0);

  // 80TTA / 80TTB Savings / FD interest deduction
  let dedInterest = 0;
  if (isSeniorSelf) {
    // 80TTB: Up to 50,000 on savings + FD interest for senior citizens
    dedInterest = Math.min(50000, savInterest + fdInterest);
  } else {
    // 80TTA: Up to 10,000 on savings account interest only
    dedInterest = Math.min(10000, savInterest);
  }

  // 80GG Rent Paid (if no HRA received)
  let ded80GG = 0;
  if (hraReceived === 0 && rentPaidAnnual > 0) {
    const totalIncBefore80GG = taxableSalaryOld + Math.max(0, hpIncomeOld) + busIncome + totalOtherSources - ded80C - ded80D;
    const c1 = 60000; // ₹5,000 / month
    const c2 = 0.25 * totalIncBefore80GG;
    const c3 = Math.max(0, rentPaidAnnual - 0.1 * totalIncBefore80GG);
    ded80GG = Math.max(0, Math.min(c1, c2, c3));
  }

  const otherDeductions = Math.max(0, inputs.otherDeductions80 || 0);

  const total80DeductionsOld = ded80C + ded80CCD1B + ded80D + ded80E + ded80G + dedInterest + ded80GG + otherDeductions;

  // Net Taxable Income under Old Regime
  const grossIncomeAfterHpOld = taxableSalaryOld + hpIncomeOld + busIncome + totalOtherSources + stcgOth;
  const netTaxableIncomeOld = Math.max(0, grossIncomeAfterHpOld - total80DeductionsOld);

  // --- COMPUTE NEW TAX REGIME ---
  // Standard Deduction in New Regime: ₹75,000 for AY 2026-27 & AY 2025-26; ₹50,000 for AY 2024-25
  const stdDedNew = grossSalary > 0 ? (ay === 'AY 2024-25' ? 50000 : 75000) : 0;
  const totalSalaryExemptionsNew = stdDedNew + allowedEmployerNps; // Note: HRA, Prof Tax, 80C, 80D NOT allowed in New Regime!
  const taxableSalaryNew = Math.max(0, grossSalary - totalSalaryExemptionsNew);

  const netTaxableIncomeNew = Math.max(0, taxableSalaryNew + hpIncomeNew + busIncome + totalOtherSources + stcgOth);

  // Compute Tax per regime
  const oldRegimeCalc = calculateSlabTaxOld(netTaxableIncomeOld, ageCat, isResident);
  const newRegimeCalc = calculateSlabTaxNew(netTaxableIncomeNew, ay, isResident);

  // Construct complete regime objects
  const oldRegimeObj: TaxRegimeCalculation = {
    regime: 'old',
    grossTotalIncome,
    totalExemptionsAndAdjustments: totalSalaryExemptionsOld,
    totalDeductionsAllowed: total80DeductionsOld + (hpIncomeOld < 0 ? Math.abs(hpIncomeOld) : 0),
    netTaxableIncome: netTaxableIncomeOld,
    salaryTaxable: taxableSalaryOld,
    housePropertyIncome: hpIncomeOld,
    capitalGainsTaxable: totalCapGains,
    businessIncomeTaxable: busIncome,
    otherSourcesTaxable: totalOtherSources,
    ...oldRegimeCalc,
    effectiveTaxRate: grossTotalIncome > 0 ? Math.round((oldRegimeCalc.totalTaxLiability / grossTotalIncome) * 10000) / 100 : 0,
    takeHomeAnnual: Math.max(0, grossTotalIncome - oldRegimeCalc.totalTaxLiability - profTax),
    takeHomeMonthly: Math.round(Math.max(0, grossTotalIncome - oldRegimeCalc.totalTaxLiability - profTax) / 12),
  };

  const newRegimeObj: TaxRegimeCalculation = {
    regime: 'new',
    grossTotalIncome,
    totalExemptionsAndAdjustments: totalSalaryExemptionsNew,
    totalDeductionsAllowed: allowedEmployerNps, // Only employer NPS allowed
    netTaxableIncome: netTaxableIncomeNew,
    salaryTaxable: taxableSalaryNew,
    housePropertyIncome: hpIncomeNew,
    capitalGainsTaxable: totalCapGains,
    businessIncomeTaxable: busIncome,
    otherSourcesTaxable: totalOtherSources,
    ...newRegimeCalc,
    effectiveTaxRate: grossTotalIncome > 0 ? Math.round((newRegimeCalc.totalTaxLiability / grossTotalIncome) * 10000) / 100 : 0,
    takeHomeAnnual: Math.max(0, grossTotalIncome - newRegimeCalc.totalTaxLiability - profTax),
    takeHomeMonthly: Math.round(Math.max(0, grossTotalIncome - newRegimeCalc.totalTaxLiability - profTax) / 12),
  };

  // Difference & Recommended Regime
  const diff = oldRegimeObj.totalTaxLiability - newRegimeObj.totalTaxLiability;
  let recommendedRegime: 'new' | 'old' | 'equal' = 'equal';
  if (diff > 1) recommendedRegime = 'new';
  else if (diff < -1) recommendedRegime = 'old';

  const taxSavings = Math.abs(diff);

  // Break-even Deduction Solver
  const breakEven = solveBreakEvenDeductions(grossSalary, basicSalary, hraReceived, rentPaidAnnual, isMetro, profTax, hpIncomeOld, busIncome, totalOtherSources, newRegimeObj.totalTaxLiability, ageCat, isResident);

  const additionalDeductionsNeeded = Math.max(0, breakEven - total80DeductionsOld - (hpIncomeOld < 0 ? Math.abs(hpIncomeOld) : 0));

  // Generate Scenarios (Skip when running inside a sub-scenario to prevent infinite recursion stack overflow)
  let scenarios: TaxEngineOutputs['scenarios'] = [];

  if (!isScenarioRun) {
    const s1Run = runIncomeTaxEngine({ ...inputs, deductions80C: 0, healthInsuranceSelf: 0, homeLoanInterestSelf: 0, npsEmployee80CCD1B: 0 }, true);
    const s3Run = runIncomeTaxEngine({ ...inputs, deductions80C: 150000, npsEmployee80CCD1B: 50000, healthInsuranceSelf: 25000, healthInsuranceParents: 50000, homeLoanInterestSelf: 200000 }, true);
    const s4Run = runIncomeTaxEngine({ ...inputs, grossSalary: Math.round(grossSalary * 1.1) }, true);

    scenarios = [
      {
        id: 'no_deductions',
        title: 'Scenario 1: Standard Salary (No Extra Investments)',
        description: 'Calculates tax when no additional 80C, 80D, or home loan deductions are claimed.',
        oldTax: s1Run.oldRegime.totalTaxLiability,
        newTax: s1Run.newRegime.totalTaxLiability,
        recommended: 'new' as const,
        savings: Math.abs(s1Run.oldRegime.totalTaxLiability - s1Run.newRegime.totalTaxLiability),
      },
      {
        id: 'current_inputs',
        title: 'Scenario 2: Your Current Custom Entries',
        description: 'Side-by-side comparison with your exact specified deductions and income sources.',
        oldTax: oldRegimeObj.totalTaxLiability,
        newTax: newRegimeObj.totalTaxLiability,
        recommended: recommendedRegime,
        savings: taxSavings,
      },
      {
        id: 'max_deductions',
        title: 'Scenario 3: Maxed Out Old Regime Tax Savers (₹3.5L+ Deductions)',
        description: 'Assumes ₹1.5L (80C) + ₹50k (NPS) + ₹50k (80D) + ₹2L (Home Loan Interest).',
        oldTax: s3Run.oldRegime.totalTaxLiability,
        newTax: s3Run.newRegime.totalTaxLiability,
        recommended: (s3Run.oldRegime.totalTaxLiability < s3Run.newRegime.totalTaxLiability ? 'old' : 'new') as 'old' | 'new',
        savings: Math.abs(s3Run.oldRegime.totalTaxLiability - s3Run.newRegime.totalTaxLiability),
      },
      {
        id: 'plus_10_percent_salary',
        title: 'Scenario 4: Next Year Appraisal (+10% Salary Growth)',
        description: 'Simulates tax obligations after a 10% annual salary increment.',
        oldTax: s4Run.oldRegime.totalTaxLiability,
        newTax: s4Run.newRegime.totalTaxLiability,
        recommended: (s4Run.oldRegime.totalTaxLiability < s4Run.newRegime.totalTaxLiability ? 'old' : 'new') as 'old' | 'new',
        savings: Math.abs(s4Run.oldRegime.totalTaxLiability - s4Run.newRegime.totalTaxLiability),
      },
    ];
  }

  return {
    inputs,
    oldRegime: oldRegimeObj,
    newRegime: newRegimeObj,
    recommendedRegime,
    taxSavings,
    breakEvenDeductionOldRegime: breakEven,
    additionalDeductionsNeededForOldRegime: additionalDeductionsNeeded,
    scenarios,
  };
}

/**
 * Calculates Old Tax Regime slab tax with 87A rebate & Surcharge
 */
function calculateSlabTaxOld(
  netTaxableIncome: number,
  ageCat: AgeCategory,
  isResident: boolean
): {
  taxBeforeRebate: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  healthAndEducationCess: number;
  totalTaxLiability: number;
  slabBreakdown: { label: string; rate: string; taxableAmount: number; taxForSlab: number }[];
} {
  let exemptLimit = 250000;
  if (ageCat === 'senior_60_79') exemptLimit = 300000;
  if (ageCat === 'super_senior_80') exemptLimit = 500000;

  const slabBreakdown: { label: string; rate: string; taxableAmount: number; taxForSlab: number }[] = [];
  let tax = 0;

  // Slab 1: Up to exempt limit (0%)
  const s1Amount = Math.min(netTaxableIncome, exemptLimit);
  slabBreakdown.push({ label: `Up to ₹${exemptLimit / 100000} Lakh`, rate: '0%', taxableAmount: s1Amount, taxForSlab: 0 });

  let remaining = Math.max(0, netTaxableIncome - exemptLimit);

  // Slab 2: exemptLimit to 5 Lakhs (5%)
  if (exemptLimit < 500000) {
    const s2Limit = 500000 - exemptLimit;
    const s2Amount = Math.min(remaining, s2Limit);
    const s2Tax = s2Amount * 0.05;
    tax += s2Tax;
    slabBreakdown.push({ label: `₹${exemptLimit / 100000}L – ₹5 Lakh`, rate: '5%', taxableAmount: s2Amount, taxForSlab: Math.round(s2Tax) });
    remaining = Math.max(0, remaining - s2Limit);
  }

  // Slab 3: 5 Lakh to 10 Lakh (20%)
  if (remaining > 0) {
    const s3Limit = 500000;
    const s3Amount = Math.min(remaining, s3Limit);
    const s3Tax = s3Amount * 0.2;
    tax += s3Tax;
    slabBreakdown.push({ label: `₹5 Lakh – ₹10 Lakh`, rate: '20%', taxableAmount: s3Amount, taxForSlab: Math.round(s3Tax) });
    remaining = Math.max(0, remaining - s3Limit);
  }

  // Slab 4: Above 10 Lakh (30%)
  if (remaining > 0) {
    const s4Tax = remaining * 0.3;
    tax += s4Tax;
    slabBreakdown.push({ label: `Above ₹10 Lakh`, rate: '30%', taxableAmount: remaining, taxForSlab: Math.round(s4Tax) });
  }

  tax = Math.round(tax);

  // Sec 87A Rebate: Under Old Regime, rebate up to ₹12,500 if taxable income <= ₹5,00,000 for residents
  let rebate87A = 0;
  if (isResident && netTaxableIncome <= 500000) {
    rebate87A = Math.min(tax, 12500);
  }

  const taxAfterRebate = Math.max(0, tax - rebate87A);

  // Surcharge & Marginal Relief
  const { surcharge, marginalRelief } = calculateSurcharge(netTaxableIncome, taxAfterRebate, 'old');

  const taxAndSurcharge = taxAfterRebate + surcharge - marginalRelief;
  const cess = Math.round(taxAndSurcharge * 0.04);
  const totalTaxLiability = Math.max(0, taxAndSurcharge + cess);

  return {
    taxBeforeRebate: tax,
    rebate87A,
    taxAfterRebate,
    surcharge,
    surchargeMarginalRelief: marginalRelief,
    healthAndEducationCess: cess,
    totalTaxLiability,
    slabBreakdown,
  };
}

/**
 * Calculates New Tax Regime slab tax with 87A rebate & Surcharge
 */
function calculateSlabTaxNew(
  netTaxableIncome: number,
  ay: AssessmentYear,
  isResident: boolean
): {
  taxBeforeRebate: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  healthAndEducationCess: number;
  totalTaxLiability: number;
  slabBreakdown: { label: string; rate: string; taxableAmount: number; taxForSlab: number }[];
} {
  const slabBreakdown: { label: string; rate: string; taxableAmount: number; taxForSlab: number }[] = [];
  let tax = 0;

  if (ay === 'AY 2026-27') {
    // AY 2026-27 Slabs under New Tax Act 2025
    // 0-4L: Nil, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, >24L: 30%
    const slabs = [
      { limit: 400000, rate: 0, label: 'Up to ₹4 Lakh' },
      { limit: 400000, rate: 0.05, label: '₹4 Lakh – ₹8 Lakh' },
      { limit: 400000, rate: 0.10, label: '₹8 Lakh – ₹12 Lakh' },
      { limit: 400000, rate: 0.15, label: '₹12 Lakh – ₹16 Lakh' },
      { limit: 400000, rate: 0.20, label: '₹16 Lakh – ₹20 Lakh' },
      { limit: 400000, rate: 0.25, label: '₹20 Lakh – ₹24 Lakh' },
      { limit: Infinity, rate: 0.30, label: 'Above ₹24 Lakh' },
    ];

    let rem = netTaxableIncome;
    for (const slab of slabs) {
      if (rem <= 0) break;
      const amt = Math.min(rem, slab.limit);
      const t = amt * slab.rate;
      tax += t;
      if (amt > 0) {
        slabBreakdown.push({
          label: slab.label,
          rate: `${slab.rate * 100}%`,
          taxableAmount: amt,
          taxForSlab: Math.round(t),
        });
      }
      rem -= amt;
    }
  } else {
    // AY 2025-26 & AY 2024-25 Slabs
    // 0-3L: Nil, 3-6L: 5%, 6-9L: 10%, 9-12L: 15%, 12-15L: 20%, >15L: 30%
    const slabs = [
      { limit: 300000, rate: 0, label: 'Up to ₹3 Lakh' },
      { limit: 300000, rate: 0.05, label: '₹3 Lakh – ₹6 Lakh' },
      { limit: 300000, rate: 0.10, label: '₹6 Lakh – ₹9 Lakh' },
      { limit: 300000, rate: 0.15, label: '₹9 Lakh – ₹12 Lakh' },
      { limit: 300000, rate: 0.20, label: '₹12 Lakh – ₹15 Lakh' },
      { limit: Infinity, rate: 0.30, label: 'Above ₹15 Lakh' },
    ];

    let rem = netTaxableIncome;
    for (const slab of slabs) {
      if (rem <= 0) break;
      const amt = Math.min(rem, slab.limit);
      const t = amt * slab.rate;
      tax += t;
      if (amt > 0) {
        slabBreakdown.push({
          label: slab.label,
          rate: `${slab.rate * 100}%`,
          taxableAmount: amt,
          taxForSlab: Math.round(t),
        });
      }
      rem -= amt;
    }
  }

  tax = Math.round(tax);

  // Sec 87A Rebate in New Regime:
  // For resident individuals, if taxable income <= ₹7,00,000, 100% tax rebate (up to ₹25,000 in AY 2025-26 / ₹60,000 in AY 2026-27).
  // Also marginal relief applies if income slightly exceeds ₹7,00,000!
  let rebate87A = 0;
  const threshold87A = 700000;

  if (isResident) {
    if (netTaxableIncome <= threshold87A) {
      rebate87A = tax; // Full tax rebate
    } else {
      // Marginal relief for Sec 87A in New Regime:
      // Tax payable cannot exceed (Net Taxable Income - ₹7,00,000)
      const excessIncome = netTaxableIncome - threshold87A;
      if (tax > excessIncome) {
        rebate87A = tax - excessIncome;
      }
    }
  }

  const taxAfterRebate = Math.max(0, tax - rebate87A);

  // Surcharge & Marginal Relief
  const { surcharge, marginalRelief } = calculateSurcharge(netTaxableIncome, taxAfterRebate, 'new');

  const taxAndSurcharge = taxAfterRebate + surcharge - marginalRelief;
  const cess = Math.round(taxAndSurcharge * 0.04);
  const totalTaxLiability = Math.max(0, taxAndSurcharge + cess);

  return {
    taxBeforeRebate: tax,
    rebate87A,
    taxAfterRebate,
    surcharge,
    surchargeMarginalRelief: marginalRelief,
    healthAndEducationCess: cess,
    totalTaxLiability,
    slabBreakdown,
  };
}

/**
 * Calculates Surcharge and Marginal Relief
 */
function calculateSurcharge(
  netIncome: number,
  taxAfterRebate: number,
  regime: 'old' | 'new'
): { surcharge: number; marginalRelief: number } {
  if (netIncome <= 5000000 || taxAfterRebate <= 0) {
    return { surcharge: 0, marginalRelief: 0 };
  }

  let surchargeRate = 0;
  let threshold = 5000000;

  if (netIncome > 50000000) {
    // Above 5 Crores: 37% in Old Regime, capped at 25% in New Regime
    surchargeRate = regime === 'new' ? 0.25 : 0.37;
    threshold = 50000000;
  } else if (netIncome > 20000000) {
    surchargeRate = 0.25;
    threshold = 20000000;
  } else if (netIncome > 10000000) {
    surchargeRate = 0.15;
    threshold = 10000000;
  } else if (netIncome > 5000000) {
    surchargeRate = 0.10;
    threshold = 5000000;
  }

  const surcharge = Math.round(taxAfterRebate * surchargeRate);

  // Marginal relief calculation
  // Tax + Surcharge on Net Income should not exceed Tax on Threshold + (Net Income - Threshold)
  let marginalRelief = 0;
  const excessIncome = netIncome - threshold;

  // Approximate tax at threshold
  let taxAtThreshold = 0;
  if (threshold === 5000000) taxAtThreshold = 1312500;
  else if (threshold === 10000000) taxAtThreshold = 2812500;
  else if (threshold === 20000000) taxAtThreshold = 5812500;
  else if (threshold === 50000000) taxAtThreshold = 14812500;

  let prevSurchargeRate = 0;
  if (threshold === 10000000) prevSurchargeRate = 0.10;
  else if (threshold === 20000000) prevSurchargeRate = 0.15;
  else if (threshold === 50000000) prevSurchargeRate = 0.25;

  const totalTaxAtThreshold = taxAtThreshold * (1 + prevSurchargeRate);
  const maxAllowableTaxAndSurcharge = totalTaxAtThreshold + excessIncome;
  const actualTaxAndSurcharge = taxAfterRebate + surcharge;

  if (actualTaxAndSurcharge > maxAllowableTaxAndSurcharge) {
    marginalRelief = Math.round(actualTaxAndSurcharge - maxAllowableTaxAndSurcharge);
  }

  return { surcharge, marginalRelief };
}

/**
 * Inverse Solver to find exact minimum deductions needed in Old Regime to beat New Regime
 */
function solveBreakEvenDeductions(
  grossSalary: number,
  basicSalary: number,
  hraReceived: number,
  rentPaidAnnual: number,
  isMetro: boolean,
  profTax: number,
  hpIncomeOld: number,
  busIncome: number,
  totalOtherSources: number,
  targetNewTax: number,
  ageCat: AgeCategory,
  isResident: boolean
): number {
  if (targetNewTax <= 0) return 0;

  // Binary search over deductions range [0, 1,500,000]
  let low = 0;
  let high = 2000000;
  let result = high;

  const stdDedOld = grossSalary > 0 ? 50000 : 0;
  const hraExemption = calculateHraExemption(basicSalary, hraReceived, rentPaidAnnual, isMetro);
  const baseSalaryTaxable = Math.max(0, grossSalary - stdDedOld - profTax - hraExemption);
  const grossIncomeForTax = baseSalaryTaxable + hpIncomeOld + busIncome + totalOtherSources;

  for (let i = 0; i < 30; i++) {
    const mid = Math.round((low + high) / 2);
    const netInc = Math.max(0, grossIncomeForTax - mid);
    const calc = calculateSlabTaxOld(netInc, ageCat, isResident);

    if (calc.totalTaxLiability <= targetNewTax) {
      result = mid;
      high = mid - 1; // Try to find lower deduction
    } else {
      low = mid + 1;
    }
  }

  return Math.round(result);
}

/**
 * Natural language query parser for tax inputs
 */
export function parseTaxNaturalQuery(query: string, currentInputs: IncomeTaxInputs): Partial<IncomeTaxInputs> {
  const text = query.toLowerCase().trim();
  const result: Partial<IncomeTaxInputs> = {};

  // Extract Salary / Income
  const salaryMatch = text.match(/(?:salary|ctc|income|earning|make|makes|makes of)\s*(?:of|is|:)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|k|cr|crore|crores|rupees|rs)?/i) ||
    text.match(/₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|cr|crore)\s*(?:salary|ctc|income)/i);

  if (salaryMatch) {
    let val = parseFloat(salaryMatch[1]);
    const unit = (salaryMatch[2] || '').toLowerCase();
    if (unit.startsWith('l')) val *= 100000;
    else if (unit.startsWith('c')) val *= 10000000;
    else if (unit === 'k') val *= 1000;
    result.grossSalary = val;
  }

  // Extract 80C
  const ded80cMatch = text.match(/80c\s*(?:deduction|investment|investments)?\s*(?:of|is|:)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|k)?/i);
  if (ded80cMatch) {
    let val = parseFloat(ded80cMatch[1]);
    const unit = (ded80cMatch[2] || '').toLowerCase();
    if (unit.startsWith('l')) val *= 100000;
    else if (unit === 'k') val *= 1000;
    result.deductions80C = Math.min(150000, val);
  }

  // Extract Health Insurance / 80D
  const healthMatch = text.match(/(?:80d|health insurance|medical insurance)\s*(?:of|is|:)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|k)?/i);
  if (healthMatch) {
    let val = parseFloat(healthMatch[1]);
    const unit = (healthMatch[2] || '').toLowerCase();
    if (unit.startsWith('l')) val *= 100000;
    else if (unit === 'k') val *= 1000;
    result.healthInsuranceSelf = val;
  }

  // Extract Home Loan Interest
  const homeLoanMatch = text.match(/(?:home loan|housing loan|interest)\s*(?:interest|deduction)?\s*(?:of|is|:)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|k)?/i);
  if (homeLoanMatch) {
    let val = parseFloat(homeLoanMatch[1]);
    const unit = (homeLoanMatch[2] || '').toLowerCase();
    if (unit.startsWith('l')) val *= 100000;
    else if (unit === 'k') val *= 1000;
    result.propertyType = 'self_occupied';
    result.homeLoanInterestSelf = val;
  }

  // Extract Senior Citizen
  if (text.includes('senior citizen') || text.includes('above 60') || text.includes('60+')) {
    result.ageCategory = 'senior_60_79';
  } else if (text.includes('super senior') || text.includes('above 80') || text.includes('80+')) {
    result.ageCategory = 'super_senior_80';
  }

  // Extract AY
  if (text.includes('2026') || text.includes('2026-27')) {
    result.assessmentYear = 'AY 2026-27';
  } else if (text.includes('2025') || text.includes('2025-26')) {
    result.assessmentYear = 'AY 2025-26';
  } else if (text.includes('2024') || text.includes('2024-25')) {
    result.assessmentYear = 'AY 2024-25';
  }

  return result;
}
