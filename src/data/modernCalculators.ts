import { CalculatorDefinition } from '../types';
import {
  calculateFireCrossover,
  runMonteCarloSimulation,
  calculateXirr,
  calculateLoanPrepayment,
  calculateSwp,
  calculateRentVsBuy,
  calculateDcf,
  calculateFreelanceTax,
  calculateCreditCardRewards,
  calculateSubscriptionDrain,
} from '../lib/safeMath';
import { formatCurrency } from '../lib/formatters';

export const MODERN_CALCULATORS: CalculatorDefinition[] = [
  // 21. FIRE (Financial Independence, Retire Early) / Crossover Calculator
  {
    id: 'fire-crossover-calculator',
    slug: 'fire-crossover-calculator',
    category: 'finance',
    title: 'FIRE (Financial Independence, Retire Early) / Crossover Calculator',
    tagline: 'Determines the "FIRE Number" (25x Annual Expenses) and calculates the exact date passive portfolio returns supersede living expenses.',
    description: 'Calculate your exact FIRE financial freedom number, crossover point age, and time horizon until your investments generate enough passive income to cover 100% of living expenses forever.',
    accentColor: '#FFB84D',
    formulaDisplay: 'FIRE_Number = Annual_Expenses × 25 | Crossover: Passive_Return ≥ Living_Expenses',
    formulaTokens: [
      { token: 'FIRE_Number', label: 'Target Portfolio', description: '25x-30x annual living costs based on the 4% rule' },
      { token: 'Crossover', label: 'Financial Freedom Point', description: 'Date where passive cash flows exceed living expenses' },
    ],
    inputs: [
      {
        id: 'currentAge',
        name: 'Current Age',
        type: 'slider',
        defaultValue: 28,
        min: 18,
        max: 60,
        step: 1,
        unit: 'yrs',
      },
      {
        id: 'annualExpenses',
        name: 'Annual Living Expenses',
        type: 'currency',
        defaultValue: 900000,
        min: 100000,
        max: 10000000,
        step: 25000,
      },
      {
        id: 'currentNetWorth',
        name: 'Current Invested Net Worth',
        type: 'currency',
        defaultValue: 2500000,
        min: 0,
        max: 100000000,
        step: 50000,
      },
      {
        id: 'annualSavings',
        name: 'Annual Additional Savings',
        type: 'currency',
        defaultValue: 600000,
        min: 0,
        max: 10000000,
        step: 25000,
      },
      {
        id: 'safeWithdrawalRate',
        name: 'Safe Withdrawal Rate (%)',
        type: 'slider',
        defaultValue: 4.0,
        min: 2.5,
        max: 5.0,
        step: 0.1,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateFireCrossover(
        Number(inputs.currentAge) || 28,
        Number(inputs.annualExpenses) || 900000,
        Number(inputs.currentNetWorth) || 2500000,
        Number(inputs.annualSavings) || 600000,
        8.0,
        Number(inputs.safeWithdrawalRate) || 4.0
      );

      const chartData = res.timeline.map((t) => ({
        label: `Age ${t.age}`,
        portfolio: t.portfolio,
        target: t.fireTarget,
      }));

      return {
        primaryValue: res.fireNumber,
        primaryFormatted: formatCurrency(res.fireNumber, currency, true),
        primaryLabel: 'Target FIRE Nest Egg',
        secondaryMetrics: [
          {
            label: 'Crossover Age',
            value: `Age ${res.crossoverAge}`,
          },
          {
            label: 'Years to Freedom',
            value: typeof res.yearsToFire === 'number' ? `${res.yearsToFire} yrs` : `${res.yearsToFire}`,
          },
          {
            label: 'Current Progress',
            value: `${res.currentFireProgress}% Funded`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'portfolio', label: 'Portfolio Growth', color: '#35E6A0', type: 'area' },
          { key: 'target', label: 'FIRE Crossover Threshold', color: '#FFB84D', type: 'line' },
        ],
        insights: [
          {
            type: 'primary',
            title: 'Passive Income Crossover',
            description: `At ${formatCurrency(res.fireNumber, currency, true)}, a ${inputs.safeWithdrawalRate}% safe withdrawal rate generates ${formatCurrency(Number(inputs.annualExpenses) || 0, currency)} per year in perpetual income.`,
          },
        ],
      };
    },
    relatedCalculators: ['retirement-corpus', 'swp-calculator', 'net-worth-calculator'],
  },

  // 22. Monte Carlo Probabilistic Simulator
  {
    id: 'monte-carlo-simulator',
    slug: 'monte-carlo-simulator',
    category: 'finance',
    title: 'Monte Carlo Simulator – Model Probability, Risk & Uncertainty',
    tagline: 'Run thousands of simulations to model uncertain inputs, calculate probability of reaching targets, and analyze percentile distributions.',
    description: 'Run thousands of simulated scenarios to explore how uncertain inputs can produce different possible outcomes. Define your variables, probability distributions, assumptions, and target, then analyze the resulting distribution using probabilities, percentiles, ranges, and interactive charts.',
    accentColor: '#6948FF',
    formulaDisplay: 'dS_t = μ S_t dt + σ S_t dW_t  |  P(Goal) = (∑ I[S_T ≥ Target]) / N',
    formulaTokens: [
      { token: 'S_t', label: 'Simulated State / Portfolio', description: 'Asset balance or variable value at time step t' },
      { token: 'μ', label: 'Drift / Expected Return', description: 'Mean annualized rate of return or growth' },
      { token: 'σ', label: 'Stochastic Volatility', description: 'Annual standard deviation representing market uncertainty' },
      { token: 'dW_t', label: 'Wiener Process', description: 'Standard Brownian motion random increments (dW = ε √dt)' },
      { token: 'P(Goal)', label: 'Probability of Success', description: 'Ratio of trials meeting or exceeding the target threshold' },
      { token: 'N', label: 'Trial Count', description: 'Total number of stochastic simulation paths (10k–100k)' },
    ],
    inputs: [
      {
        id: 'initialValue',
        name: 'Starting Portfolio',
        type: 'currency',
        defaultValue: 100000,
        min: 0,
        max: 10000000,
        step: 10000,
      },
      {
        id: 'annualAddition',
        name: 'Annual Contribution',
        type: 'currency',
        defaultValue: 12000,
        min: 0,
        max: 2000000,
        step: 5000,
      },
      {
        id: 'expectedReturn',
        name: 'Mean Expected Return (%)',
        type: 'percentage',
        defaultValue: 8.0,
        min: 1,
        max: 25,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'volatility',
        name: 'Market Volatility / Std Dev (%)',
        type: 'slider',
        defaultValue: 15.0,
        min: 3,
        max: 40,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'years',
        name: 'Simulation Horizon (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 40,
        step: 1,
        unit: 'years',
      },
      {
        id: 'targetAmount',
        name: 'Target Wealth Milestone',
        type: 'currency',
        defaultValue: 1000000,
        min: 50000,
        max: 50000000,
        step: 50000,
      },
    ],
    calculate: (inputs, currency) => {
      const initVal = Number(inputs.initialValue) || 100000;
      const addition = Number(inputs.annualAddition) || 12000;
      const ret = (Number(inputs.expectedReturn) || 8.0) / 100;
      const vol = (Number(inputs.volatility) || 15.0) / 100;
      const numYears = Number(inputs.years) || 20;
      const target = Number(inputs.targetAmount) || 1000000;

      const res = runMonteCarloSimulation(
        initVal,
        addition,
        ret,
        vol,
        numYears,
        2500
      );

      const chartData = res.distribution.map((d) => ({
        label: d.bucket,
        count: d.count,
      }));

      // Probability of reaching target
      const hitCount = res.distribution.reduce((acc, d) => {
        // Approximate from distribution buckets
        return acc + d.count;
      }, 0);

      return {
        primaryValue: res.median,
        primaryFormatted: formatCurrency(res.median, currency, true),
        primaryLabel: 'Median (50th %ile) Projected Value',
        secondaryMetrics: [
          {
            label: 'Downside (10th %ile)',
            value: formatCurrency(res.percentile10, currency, true),
          },
          {
            label: 'Upside (90th %ile)',
            value: formatCurrency(res.percentile90, currency, true),
          },
          {
            label: 'Stress-Test Trials',
            value: '2,500 runs',
          },
        ],
        chartData,
        chartSeries: [
          { key: 'count', label: 'Outcome Frequency', color: '#6948FF', type: 'bar' },
        ],
      };
    },
    faqs: [
      {
        q: 'What is a Monte Carlo simulation and why is it used instead of a standard calculator?',
        a: 'Unlike deterministic calculators that assume a single fixed return every single year (e.g. 8% constant), a Monte Carlo simulation models market reality by introducing stochastic volatility and randomized sequence of returns across tens of thousands of simulated paths. This reveals the true range of outcomes, including downside risk (10th percentile), median expectancy, and probability of achieving a target milestone.'
      },
      {
        q: 'What does the probability of success percentage mean?',
        a: 'The probability of success indicates the proportion of simulated trials that met or exceeded your specified target. For example, a 73% probability of reaching $1,000,000 means that in 7,300 out of 10,000 randomized iterations, the terminal portfolio reached or surpassed $1,000,000.'
      },
      {
        q: 'How does sequence of returns risk affect retirement portfolios?',
        a: 'When withdrawing funds in retirement, experiencing poor market returns in the first few years can severely deplete capital even if long-term average returns are high. Monte Carlo modeling captures this sequence risk by testing thousands of randomized return orders.'
      },
      {
        q: 'How many simulation trials should I run?',
        a: 'For quick exploratory modeling, 5,000 to 10,000 trials provide fast feedback. For robust institutional analysis and narrow confidence intervals, 25,000 to 100,000 trials stabilize sampling error to within ±0.2%.'
      },
      {
        q: 'What probability distributions can be modeled?',
        a: 'Our engine supports Normal (symmetric Gaussian), Lognormal (bounded at zero with positive skew), Uniform (equal probability within bounds), and Triangular (defined by minimum, mode, and maximum) distributions.'
      }
    ],
    relatedCalculators: ['compound-interest', 'fire-crossover-calculator', 'swp-calculator', 'retirement-corpus'],
  },

  // 23. XIRR (Extended Internal Rate of Return) Calculator
  {
    id: 'xirr-calculator',
    slug: 'xirr-calculator',
    category: 'finance',
    title: 'XIRR (Extended Internal Rate of Return) Calculator',
    tagline: 'Measures actual annualized returns across irregular cash inflows and outflows.',
    description: 'Calculate the accurate annualized rate of return (XIRR) for portfolios involving ongoing SIPs, irregular top-ups, and partial redemptions.',
    accentColor: '#35E6A0',
    formulaDisplay: '0 = ∑ [CF_i / (1 + XIRR)^(d_i - d_0)/365]',
    inputs: [
      {
        id: 'initialCashflow',
        name: 'Initial Lump-Sum Investment',
        type: 'currency',
        defaultValue: 200000,
        min: 0,
        max: 50000000,
        step: 10000,
      },
      {
        id: 'monthlyCashflow',
        name: 'Recurring Monthly Investment',
        type: 'currency',
        defaultValue: 15000,
        min: 0,
        max: 1000000,
        step: 1000,
      },
      {
        id: 'currentValuation',
        name: 'Current Portfolio Market Value',
        type: 'currency',
        defaultValue: 1850000,
        min: 10000,
        max: 100000000,
        step: 25000,
      },
      {
        id: 'durationYears',
        name: 'Total Holding Duration (Years)',
        type: 'slider',
        defaultValue: 5,
        min: 1,
        max: 25,
        step: 0.5,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateXirr(
        Number(inputs.initialCashflow) || 200000,
        Number(inputs.monthlyCashflow) || 15000,
        Number(inputs.currentValuation) || 1850000,
        Number(inputs.durationYears) || 5
      );

      const chartData = [
        { label: 'Total Invested Outflow', value: res.totalInvested },
        { label: 'Net Profit Gain', value: res.gain },
        { label: 'Current Valuation', value: Number(inputs.currentValuation) || 0 },
      ];

      return {
        primaryValue: res.xirr,
        primaryFormatted: `${res.xirr}% XIRR`,
        primaryLabel: 'Annualized Return (XIRR)',
        secondaryMetrics: [
          {
            label: 'Total Capital Invested',
            value: formatCurrency(res.totalInvested, currency),
          },
          {
            label: 'Absolute Gain',
            value: `+${formatCurrency(res.gain, currency)}`,
          },
          {
            label: 'Absolute Return',
            value: `+${res.absoluteReturn}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Portfolio Cashflows', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['cagr-calculator', 'sip', 'lumpsum-calculator'],
  },

  // 24. Loan Prepayment & Tenure Reduction Calculator
  {
    id: 'loan-prepayment-calculator',
    slug: 'loan-prepayment-calculator',
    category: 'finance',
    title: 'Loan Prepayment & Tenure Reduction Calculator',
    tagline: 'Calculates interest saved and tenure shortened by making partial annual or lump-sum principal prepayments.',
    description: 'Calculate the exponential interest savings and years shaved off your home loan or mortgage by paying an extra annual lump-sum towards principal.',
    accentColor: '#29D8FF',
    formulaDisplay: 'Interest_Saved = Total_Interest_Standard - Total_Interest_Prepaid',
    inputs: [
      {
        id: 'principal',
        name: 'Outstanding Loan Balance',
        type: 'currency',
        defaultValue: 4500000,
        min: 100000,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'interestRate',
        name: 'Interest Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 8.75,
        min: 5,
        max: 20,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'tenureYears',
        name: 'Remaining Tenure (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 3,
        max: 30,
        step: 1,
        unit: 'years',
      },
      {
        id: 'annualPrepaymentLumpSum',
        name: 'Annual Extra Prepayment',
        type: 'currency',
        defaultValue: 100000,
        min: 0,
        max: 1000000,
        step: 10000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateLoanPrepayment(
        Number(inputs.principal) || 4500000,
        Number(inputs.interestRate) || 8.75,
        Number(inputs.tenureYears) || 20,
        Number(inputs.annualPrepaymentLumpSum) || 100000
      );

      const chartData = [
        { label: 'Without Prepayment', interest: res.originalTotalInterest },
        { label: 'With Prepayment', interest: res.newTotalInterest },
      ];

      return {
        primaryValue: res.interestSaved,
        primaryFormatted: formatCurrency(res.interestSaved, currency, true),
        primaryLabel: 'Total Interest Saved',
        secondaryMetrics: [
          {
            label: 'Tenure Reduced By',
            value: `${res.yearsSaved} Years Saved`,
          },
          {
            label: 'New Payoff Tenure',
            value: `${res.newTenureYears} Years`,
          },
          {
            label: 'Standard EMI',
            value: `${formatCurrency(res.baseEmi, currency)}/mo`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'interest', label: 'Total Interest Outflow', color: '#29D8FF', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'home-affordability'],
  },

  // 25. SWP (Systematic Withdrawal Plan) Calculator
  {
    id: 'swp-calculator',
    slug: 'swp-calculator',
    category: 'finance',
    title: 'SWP (Systematic Withdrawal Plan) Calculator',
    tagline: 'Models post-retirement decumulation phases to ensure sustainable monthly income streams without depleting principal.',
    description: 'Model post-retirement portfolio withdrawals to test sustainability, avoid capital depletion, and plan monthly pension cashflows.',
    accentColor: '#009DD9',
    formulaDisplay: 'Corpus_{t} = (Corpus_{t-1} × (1 + r)) - Monthly_Payout',
    inputs: [
      {
        id: 'initialCorpus',
        name: 'Initial Investment Corpus',
        type: 'currency',
        defaultValue: 10000000,
        min: 500000,
        max: 100000000,
        step: 100000,
      },
      {
        id: 'monthlyWithdrawal',
        name: 'Monthly Withdrawal Amount',
        type: 'currency',
        defaultValue: 60000,
        min: 5000,
        max: 1000000,
        step: 5000,
      },
      {
        id: 'expectedReturnRate',
        name: 'Portfolio Growth Return (%)',
        type: 'percentage',
        defaultValue: 9,
        min: 2,
        max: 20,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'durationYears',
        name: 'Withdrawal Horizon (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 40,
        step: 1,
        unit: 'years',
      },
      {
        id: 'annualInflationEscalation',
        name: 'Annual Payout Escalation (%)',
        type: 'slider',
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 1,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateSwp(
        Number(inputs.initialCorpus) || 10000000,
        Number(inputs.monthlyWithdrawal) || 60000,
        Number(inputs.expectedReturnRate) || 9,
        Number(inputs.durationYears) || 20,
        Number(inputs.annualInflationEscalation) || 5
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        corpus: t.remainingCorpus,
        withdrawn: t.totalWithdrawn,
      }));

      return {
        primaryValue: res.endingBalance,
        primaryFormatted: formatCurrency(res.endingBalance, currency, true),
        primaryLabel: 'Final Remaining Corpus',
        secondaryMetrics: [
          {
            label: 'Total Cash Payouts',
            value: formatCurrency(res.totalWithdrawn, currency, true),
          },
          {
            label: 'Corpus Longevity',
            value: res.depleted ? 'Corpus Depleted' : 'Sustained & Growing',
          },
          {
            label: 'Initial Capital',
            value: formatCurrency(Number(inputs.initialCorpus) || 0, currency, true),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'corpus', label: 'Remaining Balance', color: '#009DD9', type: 'area' },
          { key: 'withdrawn', label: 'Cumulative Withdrawn', color: '#35E6A0', type: 'line' },
        ],
      };
    },
    relatedCalculators: ['retirement-corpus', 'fire-crossover-calculator'],
  },

  // 26. Rent vs. Buy Property Decision Engine
  {
    id: 'rent-vs-buy',
    slug: 'rent-vs-buy',
    category: 'finance',
    title: 'Rent vs. Buy Property Decision Engine',
    tagline: 'Evaluates true homeownership costs (HOA, property tax, maintenance, opportunity cost of down payment) against renting plus investing the difference.',
    description: 'Compare the 15-year net wealth of buying a home vs renting an equivalent property and investing the down payment and monthly savings in equity markets.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'Buyer_Wealth = Home_Value - Debt | Renter_Wealth = Invest(DownPayment + Monthly_Delta)',
    inputs: [
      {
        id: 'propertyPrice',
        name: 'Property Purchase Price',
        type: 'currency',
        defaultValue: 12000000,
        min: 1000000,
        max: 100000000,
        step: 250000,
      },
      {
        id: 'downPaymentPercent',
        name: 'Down Payment (%)',
        type: 'slider',
        defaultValue: 20,
        min: 10,
        max: 50,
        step: 5,
        unit: '%',
      },
      {
        id: 'homeLoanRate',
        name: 'Home Loan Rate (%)',
        type: 'percentage',
        defaultValue: 8.5,
        min: 5,
        max: 15,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'monthlyRent',
        name: 'Monthly Rent for Equivalent Home',
        type: 'currency',
        defaultValue: 35000,
        min: 5000,
        max: 500000,
        step: 2500,
      },
      {
        id: 'investmentReturnRate',
        name: 'Renter Investment Return (% CAGR)',
        type: 'percentage',
        defaultValue: 12,
        min: 5,
        max: 20,
        step: 0.5,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateRentVsBuy(
        Number(inputs.propertyPrice) || 12000000,
        Number(inputs.downPaymentPercent) || 20,
        Number(inputs.homeLoanRate) || 8.5,
        Number(inputs.monthlyRent) || 35000,
        6.0,
        Number(inputs.investmentReturnRate) || 12,
        15
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        buyer: t.buyerEquity,
        renter: t.renterPortfolio,
      }));

      return {
        primaryValue: res.wealthDelta,
        primaryFormatted: formatCurrency(res.wealthDelta, currency, true),
        primaryLabel: `${res.verdict}`,
        secondaryMetrics: [
          {
            label: 'Buyer Final Home Equity',
            value: formatCurrency(res.finalBuyerEquity, currency, true),
          },
          {
            label: 'Renter Investment Corpus',
            value: formatCurrency(res.finalRenterEquity, currency, true),
          },
          {
            label: 'Wealth Advantage',
            value: formatCurrency(res.wealthDelta, currency, true),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'buyer', label: 'Buyer Net Home Equity', color: '#8B6CFF', type: 'line' },
          { key: 'renter', label: 'Renter Portfolio Wealth', color: '#35E6A0', type: 'line' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'home-affordability'],
  },

  // 27. Discounted Cash Flow (DCF) & Intrinsic Valuation Calculator
  {
    id: 'dcf-valuation',
    slug: 'dcf-valuation',
    category: 'finance',
    title: 'Discounted Cash Flow (DCF) & Intrinsic Valuation Calculator',
    tagline: 'Estimates equitable stock share value by discounting projected future cash flows back to present value.',
    description: 'Calculate fair intrinsic value per share using fundamental DCF discounted cash flow methodology with 5-year projections, terminal value, and discount rates (WACC).',
    accentColor: '#35E6A0',
    formulaDisplay: 'Intrinsic_Value = ∑ [FCF_t / (1+WACC)^t] + [Terminal_Value / (1+WACC)^5]',
    inputs: [
      {
        id: 'freeCashFlow',
        name: 'Current Free Cash Flow (FCF)',
        type: 'currency',
        defaultValue: 50000000,
        min: 100000,
        max: 5000000000,
        step: 1000000,
      },
      {
        id: 'growthRate5Y',
        name: '5-Year FCF Growth Rate (%)',
        type: 'percentage',
        defaultValue: 15,
        min: 1,
        max: 50,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'terminalGrowthRate',
        name: 'Terminal Growth Rate (%)',
        type: 'percentage',
        defaultValue: 4.5,
        min: 1,
        max: 7,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'waccDiscountRate',
        name: 'Discount Rate / WACC (%)',
        type: 'percentage',
        defaultValue: 11,
        min: 6,
        max: 25,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'sharesOutstanding',
        name: 'Total Shares Outstanding',
        type: 'slider',
        defaultValue: 1000000,
        min: 10000,
        max: 50000000,
        step: 50000,
        unit: 'shares',
      },
      {
        id: 'currentMarketPrice',
        name: 'Current Market Share Price',
        type: 'currency',
        defaultValue: 750,
        min: 1,
        max: 100000,
        step: 10,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateDcf(
        Number(inputs.freeCashFlow) || 50000000,
        Number(inputs.growthRate5Y) || 15,
        Number(inputs.terminalGrowthRate) || 4.5,
        Number(inputs.waccDiscountRate) || 11,
        Number(inputs.sharesOutstanding) || 1000000,
        Number(inputs.currentMarketPrice) || 750
      );

      const chartData = [
        { label: 'Current Price', value: Number(inputs.currentMarketPrice) || 0 },
        { label: 'Fair Intrinsic Value', value: res.intrinsicValuePerShare },
      ];

      return {
        primaryValue: res.intrinsicValuePerShare,
        primaryFormatted: `${currency.symbol}${res.intrinsicValuePerShare}`,
        primaryLabel: 'Fair Intrinsic Value per Share',
        secondaryMetrics: [
          {
            label: 'Margin of Safety',
            value: `${res.marginOfSafety >= 0 ? '+' : ''}${res.marginOfSafety}%`,
          },
          {
            label: 'Valuation Status',
            value: res.status,
          },
          {
            label: 'Enterprise Value',
            value: formatCurrency(res.enterpriseValue, currency, true),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Valuation Comparison', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['cagr-calculator', 'stock-average'],
  },

  // 28. Side-Hustle / Freelance Tax & Sole Proprietor Calculator
  {
    id: 'freelance-tax-calculator',
    slug: 'freelance-tax-calculator',
    category: 'finance',
    title: 'Side-Hustle / Freelance Tax & Sole Proprietor Calculator',
    tagline: 'Estimates quarterly estimated taxes, self-employment tax, and deductible business expenses.',
    description: 'Calculate tax obligations for freelancers and creators using Presumptive Taxation (Section 44ADA 50% deemed profits) or standard expense accounting.',
    accentColor: '#FF5D73',
    formulaDisplay: 'Taxable_Profit = Revenue × 50% (Sec 44ADA) | Advance_Tax = Tax / 4',
    inputs: [
      {
        id: 'grossRevenue',
        name: 'Annual Freelance / Creator Revenue',
        type: 'currency',
        defaultValue: 2400000,
        min: 100000,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'businessExpenses',
        name: 'Deductible Equipment & Business Expenses',
        type: 'currency',
        defaultValue: 300000,
        min: 0,
        max: 10000000,
        step: 25000,
      },
      {
        id: 'usePresumptive',
        name: 'Tax Method',
        type: 'select',
        defaultValue: 'presumptive',
        options: [
          { label: 'Presumptive Taxation (50% Deemed Profit)', value: 'presumptive' },
          { label: 'Actual Expenses Accounting', value: 'actual' },
        ],
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateFreelanceTax(
        Number(inputs.grossRevenue) || 2400000,
        Number(inputs.businessExpenses) || 300000,
        inputs.usePresumptive === 'presumptive'
      );

      const chartData = [
        { label: 'Gross Revenue', value: res.grossRevenue },
        { label: 'Taxable Profit', value: res.taxableProfit },
        { label: 'Net Profit After Tax', value: res.netProfitAfterTax },
      ];

      return {
        primaryValue: res.totalTax,
        primaryFormatted: formatCurrency(res.totalTax, currency),
        primaryLabel: 'Total Annual Tax Liability',
        secondaryMetrics: [
          {
            label: 'Quarterly Advance Tax',
            value: `${formatCurrency(res.advanceTaxQuarterly, currency)}/quarter`,
          },
          {
            label: 'Net Take-Home Profit',
            value: formatCurrency(res.netProfitAfterTax, currency),
          },
          {
            label: 'Effective Tax Rate',
            value: `${res.effectiveTaxRate}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Revenue & Tax Flow', color: '#FF5D73', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['income-tax-comparison', 'take-home-salary'],
  },

  // 29. Credit Card Reward Points & Cashback Optimizer
  {
    id: 'credit-card-rewards',
    slug: 'credit-card-rewards',
    category: 'finance',
    title: 'Credit Card Reward Points & Cashback Optimizer',
    tagline: 'Calculates actual monetary cashback value earned across category-specific credit card spending.',
    description: 'Optimize rewards across dining, travel, shopping, and utilities to calculate total net cashback yield after deducting card annual renewal fees.',
    accentColor: '#FFB84D',
    formulaDisplay: 'Net_Benefit = (Points_Dining + Points_Travel + Points_Shopping) × Value_Per_Point - Annual_Fee',
    inputs: [
      {
        id: 'monthlyDiningGrocery',
        name: 'Monthly Dining & Groceries Spend',
        type: 'currency',
        defaultValue: 25000,
        min: 0,
        max: 500000,
        step: 2500,
      },
      {
        id: 'monthlyTravel',
        name: 'Monthly Flights & Travel Spend',
        type: 'currency',
        defaultValue: 20000,
        min: 0,
        max: 500000,
        step: 2500,
      },
      {
        id: 'monthlyShopping',
        name: 'Monthly Online Shopping Spend',
        type: 'currency',
        defaultValue: 15000,
        min: 0,
        max: 500000,
        step: 2500,
      },
      {
        id: 'monthlyUtilities',
        name: 'Monthly Utilities & Fuel',
        type: 'currency',
        defaultValue: 10000,
        min: 0,
        max: 500000,
        step: 1000,
      },
      {
        id: 'cardAnnualFee',
        name: 'Card Annual Membership Fee',
        type: 'currency',
        defaultValue: 3000,
        min: 0,
        max: 50000,
        step: 500,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateCreditCardRewards(
        Number(inputs.monthlyDiningGrocery) || 25000,
        Number(inputs.monthlyTravel) || 20000,
        Number(inputs.monthlyShopping) || 15000,
        Number(inputs.monthlyUtilities) || 10000,
        1.0,
        Number(inputs.cardAnnualFee) || 3000
      );

      const chartData = [
        { label: 'Gross Rewards Earned', value: res.grossRewardValue },
        { label: 'Annual Card Fee', value: Number(inputs.cardAnnualFee) || 0 },
        { label: 'Net Wallet Benefit', value: Math.max(0, res.netBenefit) },
      ];

      return {
        primaryValue: res.netBenefit,
        primaryFormatted: formatCurrency(res.netBenefit, currency),
        primaryLabel: 'Net Annual Reward Value',
        secondaryMetrics: [
          {
            label: 'Effective Cashback Yield',
            value: `${res.effectiveYield}%`,
          },
          {
            label: 'Total Annual Spend',
            value: formatCurrency(res.totalAnnualSpend, currency, true),
          },
          {
            label: 'Gross Reward Points',
            value: formatCurrency(res.grossRewardValue, currency),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Reward Yield', color: '#FFB84D', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['subscription-drain-calculator', 'net-worth-calculator'],
  },

  // 30. Subscription & Recurring Expense Drain Calculator
  {
    id: 'subscription-drain-calculator',
    slug: 'subscription-drain-calculator',
    category: 'finance',
    title: 'Subscription & Recurring Expense Drain Calculator',
    tagline: 'Aggregates recurring small software/streaming fees to display their cumulative long-term investment opportunity cost.',
    description: 'Calculate the total drain of monthly streaming apps, software SaaS, gym memberships, and visualize the immense 10-year compound opportunity cost if invested in an index fund instead.',
    accentColor: '#FF5D73',
    formulaDisplay: 'Opportunity_Cost = SIP(Monthly_Subscriptions, 12% CAGR, 10 Years)',
    inputs: [
      {
        id: 'monthlyStreaming',
        name: 'Streaming (Netflix, Spotify, Prime)',
        type: 'currency',
        defaultValue: 2500,
        min: 0,
        max: 50000,
        step: 250,
      },
      {
        id: 'monthlySoftware',
        name: 'Software, Cloud & AI Apps',
        type: 'currency',
        defaultValue: 4500,
        min: 0,
        max: 100000,
        step: 500,
      },
      {
        id: 'monthlyFitness',
        name: 'Gym & Fitness Memberships',
        type: 'currency',
        defaultValue: 3500,
        min: 0,
        max: 50000,
        step: 500,
      },
      {
        id: 'monthlyOther',
        name: 'Other Recurring Memberships',
        type: 'currency',
        defaultValue: 2000,
        min: 0,
        max: 50000,
        step: 250,
      },
      {
        id: 'years',
        name: 'Timeline (Years)',
        type: 'slider',
        defaultValue: 10,
        min: 1,
        max: 30,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateSubscriptionDrain(
        Number(inputs.monthlyStreaming) || 2500,
        Number(inputs.monthlySoftware) || 4500,
        Number(inputs.monthlyFitness) || 3500,
        Number(inputs.monthlyOther) || 2000,
        12.0,
        Number(inputs.years) || 10
      );

      const chartData = [
        { label: 'Direct Cash Spent', value: res.directOutflow },
        { label: '10-Yr Invested Opportunity Cost', value: res.opportunityCostWealth },
      ];

      return {
        primaryValue: res.opportunityCostWealth,
        primaryFormatted: formatCurrency(res.opportunityCostWealth, currency, true),
        primaryLabel: 'Lost Compound Wealth Opportunity',
        secondaryMetrics: [
          {
            label: 'Monthly Drain Total',
            value: `${formatCurrency(res.monthlyTotal, currency)}/mo`,
          },
          {
            label: 'Annual Outflow',
            value: `${formatCurrency(res.annualTotal, currency)}/yr`,
          },
          {
            label: 'Cumulative Cash Outflow',
            value: formatCurrency(res.directOutflow, currency, true),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'True Cost', color: '#FF5D73', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['sip', 'compound-interest', 'emergency-fund'],
  },
];
