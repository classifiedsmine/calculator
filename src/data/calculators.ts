import { CalculatorDefinition } from '../types';
import { MUST_HAVE_CALCULATORS } from './mustHaveCalculators';
import { MODERN_CALCULATORS } from './modernCalculators';
import { MATH_CALCULATORS } from './mathCalculators';
import { HEALTH_CALCULATORS } from './healthCalculators';
import { SCIENCE_CALCULATORS } from './scienceCalculators';
import { PARENT_CATEGORIES } from './categories';

// Assign parent category and subcategory to Must-Have calculators
const ENRICHED_MUST_HAVE = MUST_HAVE_CALCULATORS.map((c) => {
  let subCategoryId = 'investments';
  let subCategoryName = 'Investments, SIP & Compounding';

  if (['loan-emi', 'home-affordability', 'car-loan-depreciation', 'education-loan', 'debt-payoff-snowball-avalanche'].includes(c.slug)) {
    subCategoryId = 'loans';
    subCategoryName = 'Loans, Mortgages & Debt Payoff';
  } else if (['retirement-corpus', 'inflation-calculator'].includes(c.slug)) {
    subCategoryId = 'retirement';
    subCategoryName = 'Retirement, FIRE & Decumulation';
  } else if (['income-tax-comparison', 'take-home-salary', 'capital-gains-tax'].includes(c.slug)) {
    subCategoryId = 'taxes';
    subCategoryName = 'Taxes, CTC Salary & Freelancing';
  } else if (['net-worth-calculator', 'emergency-fund'].includes(c.slug)) {
    subCategoryId = 'personal-finance';
    subCategoryName = 'Personal Finance, Budgeting & Expenses';
  }

  return {
    ...c,
    parentCategoryId: 'finance',
    parentCategoryName: 'Finance & Wealth Management',
    subCategoryId,
    subCategoryName,
  };
});

// Assign parent category and subcategory to Modern calculators
const ENRICHED_MODERN = MODERN_CALCULATORS.map((c) => {
  let subCategoryId = 'investments';
  let subCategoryName = 'Investments, SIP & Compounding';

  if (['loan-prepayment-calculator'].includes(c.slug)) {
    subCategoryId = 'loans';
    subCategoryName = 'Loans, Mortgages & Debt Payoff';
  } else if (['fire-crossover-calculator', 'swp-calculator'].includes(c.slug)) {
    subCategoryId = 'retirement';
    subCategoryName = 'Retirement, FIRE & Decumulation';
  } else if (['freelance-tax-calculator'].includes(c.slug)) {
    subCategoryId = 'taxes';
    subCategoryName = 'Taxes, CTC Salary & Freelancing';
  } else if (['credit-card-rewards', 'subscription-drain-calculator'].includes(c.slug)) {
    subCategoryId = 'personal-finance';
    subCategoryName = 'Personal Finance, Budgeting & Expenses';
  } else if (['rent-vs-buy'].includes(c.slug)) {
    subCategoryId = 'real-estate';
    subCategoryName = 'Real Estate & Property Decisions';
  }

  return {
    ...c,
    parentCategoryId: 'finance',
    parentCategoryName: 'Finance & Wealth Management',
    subCategoryId,
    subCategoryName,
  };
});

export const CALCULATORS: CalculatorDefinition[] = [
  ...ENRICHED_MUST_HAVE,
  ...ENRICHED_MODERN,
  ...MATH_CALCULATORS,
  ...HEALTH_CALCULATORS,
  ...SCIENCE_CALCULATORS,
];

export { PARENT_CATEGORIES };
