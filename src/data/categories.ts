import { ParentCategoryMeta } from '../types';

export const PARENT_CATEGORIES: ParentCategoryMeta[] = [
  {
    id: 'finance',
    name: 'Finance & Wealth Management',
    slug: 'finance',
    description: 'Comprehensive financial planning engines for debt payoff, wealth compounding, tax minimization, retirement, and real estate valuation.',
    iconName: 'TrendingUp',
    accentColor: '#6948FF',
    subCategories: [
      {
        id: 'investments',
        name: 'Investments, SIP & Compounding',
        slug: 'investments',
        description: 'Compound interest engines, mutual fund SIPs, CAGR/XIRR calculators, and intrinsic stock valuation models.',
        parentCategoryId: 'finance',
        iconName: 'Coins'
      },
      {
        id: 'loans',
        name: 'Loans, Mortgages & Debt Payoff',
        slug: 'loans',
        description: 'Monthly loan amortization, interest savings via prepayments, debt snowball/avalanche, and auto/education loans.',
        parentCategoryId: 'finance',
        iconName: 'Landmark'
      },
      {
        id: 'retirement',
        name: 'Retirement, FIRE & Decumulation',
        slug: 'retirement',
        description: 'FIRE crossover milestones, nest egg corpus calculations, systematic withdrawal plans (SWP), and inflation preservation.',
        parentCategoryId: 'finance',
        iconName: 'Sparkles'
      },
      {
        id: 'taxes',
        name: 'Taxes, CTC Salary & Freelancing',
        slug: 'taxes',
        description: 'Old vs New tax regime evaluators, in-hand salary calculations, capital gains tax (STCG/LTCG), and Section 44ADA presumptive tax.',
        parentCategoryId: 'finance',
        iconName: 'Briefcase'
      },
      {
        id: 'personal-finance',
        name: 'Personal Finance, Budgeting & Expenses',
        slug: 'personal-finance',
        description: 'Net worth balance sheets, liquid emergency funds, recurring subscription drains, and credit card reward yields.',
        parentCategoryId: 'finance',
        iconName: 'ShieldCheck'
      },
      {
        id: 'real-estate',
        name: 'Real Estate & Property Decisions',
        slug: 'real-estate',
        description: '15-year comparative wealth modeling for buying vs renting and home purchase affordability checks.',
        parentCategoryId: 'finance',
        iconName: 'Home'
      }
    ]
  },
  {
    id: 'math',
    name: 'Mathematics & Statistics',
    slug: 'math',
    description: 'High-precision algebraic solvers, geometric calculators, combinatorics engines, and statistical distribution models.',
    iconName: 'Sigma',
    accentColor: '#29D8FF',
    subCategories: [
      {
        id: 'algebra',
        name: 'Algebra & Quadratic Equations',
        slug: 'algebra',
        description: 'Quadratic roots solvers, discriminant analysis, polynomial factoring, and matrix calculations.',
        parentCategoryId: 'math',
        iconName: 'Divide'
      },
      {
        id: 'geometry-trig',
        name: 'Geometry, Shapes & Trigonometry',
        slug: 'geometry-trig',
        description: 'Trigonometric functions, Pythagorean right-triangle solver, circle perimeter & volume equations.',
        parentCategoryId: 'math',
        iconName: 'Triangle'
      },
      {
        id: 'statistics-prob',
        name: 'Statistics, Probability & Distributions',
        slug: 'statistics-prob',
        description: 'Standard deviation, variance, combinations/permutations (nCr/nPr), and Gaussian Z-score percentiles.',
        parentCategoryId: 'math',
        iconName: 'BarChart3'
      },
      {
        id: 'arithmetic-ratios',
        name: 'Percentage, Fractions & Proportions',
        slug: 'arithmetic-ratios',
        description: 'Percentage increase/decrease, margin/markup, fractional simplifiers, and golden ratio divisions.',
        parentCategoryId: 'math',
        iconName: 'Percent'
      }
    ]
  },
  {
    id: 'health',
    name: 'Health, Fitness & Biometrics',
    slug: 'health',
    description: 'Clinical health benchmarks, WHO body composition formulas, basal metabolic rates, and cardiovascular target zones.',
    iconName: 'HeartPulse',
    accentColor: '#35E6A0',
    subCategories: [
      {
        id: 'body-composition',
        name: 'Body Composition, BMI & Target Weight',
        slug: 'body-composition',
        description: 'World Health Organization (WHO) BMI classifications, Robinson ideal weight, and US Navy body fat calculations.',
        parentCategoryId: 'health',
        iconName: 'Activity'
      },
      {
        id: 'metabolism-nutrition',
        name: 'Caloric Metabolism, BMR & Macro Split',
        slug: 'metabolism-nutrition',
        description: 'Mifflin-St Jeor Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and macro grams breakdown.',
        parentCategoryId: 'health',
        iconName: 'Flame'
      },
      {
        id: 'cardio-vitality',
        name: 'Heart Rate Zones, Hydration & Cardio',
        slug: 'cardio-vitality',
        description: 'Karvonen target heart rate aerobic zones (Zones 1-5) and daily hydration fluid requirements.',
        parentCategoryId: 'health',
        iconName: 'Droplets'
      }
    ]
  },
  {
    id: 'science',
    name: 'Science, Physics & Conversions',
    slug: 'science',
    description: 'Classical Newtonian mechanics, energy conservation calculators, and multi-unit conversion suites.',
    iconName: 'Atom',
    accentColor: '#FFB84D',
    subCategories: [
      {
        id: 'physics-mechanics',
        name: 'Classical Mechanics, Force & Energy',
        slug: 'physics-mechanics',
        description: 'Kinematics motion equations, Newton second law (F=ma), gravitational potential energy, and kinetic velocity.',
        parentCategoryId: 'science',
        iconName: 'Zap'
      },
      {
        id: 'unit-converters',
        name: 'Universal Unit & Measure Converters',
        slug: 'unit-converters',
        description: 'Multi-system temperature (°C/°F/K), length, imperial/metric weight mass, and data storage byte bandwidth.',
        parentCategoryId: 'science',
        iconName: 'ArrowLeftRight'
      }
    ]
  }
];
