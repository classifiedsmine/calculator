import { CalculatorDefinition } from '../types';
import { runIncomeTaxEngine } from '../lib/taxEngine';
import {
  calculateCompoundInterest,
  calculateLoanEmi,
  calculateSip,
  calculateRetirement,
  calculateIncomeTax,
  calculateInflation,
  calculateEmergencyFund,
  calculateDebtPayoff,
  calculateFdRd,
  calculateCagr,
  calculateHomeAffordability,
  calculateCarLoanDepreciation,
  calculateEducationLoan,
  calculateTakeHomeSalary,
  calculateLumpsum,
  calculateSimpleVsCompound,
  calculateStockAverage,
  calculateNetWorth,
  calculateCapitalGains,
  runMonteCarloSimulation,
} from '../lib/safeMath';
import { formatCurrency, formatNumber } from '../lib/formatters';

export const MUST_HAVE_CALCULATORS: CalculatorDefinition[] = [
  // 1. Loan & Mortgage EMI Calculator
  {
    id: 'loan-emi',
    slug: 'loan-emi',
    category: 'finance',
    title: 'Loan & Mortgage EMI Calculator',
    tagline: 'Compute monthly payments, total interest payable, and principal repayment schedules.',
    description: 'Calculate monthly EMI installments, total interest liabilities, and detailed annual amortization schedules for home mortgages, personal loans, and auto financing.',
    accentColor: '#29D8FF',
    formulaDisplay: 'EMI = [P × r × (1 + r)^N] / [(1 + r)^N - 1]',
    formulaTokens: [
      { token: 'EMI', label: 'Equated Monthly Installment', description: 'Fixed monthly payment amount' },
      { token: 'P', label: 'Loan Principal', inputId: 'loanAmount', description: 'Total loan amount borrowed' },
      { token: 'r', label: 'Monthly Rate', inputId: 'interestRate', description: 'Annual interest rate / 12 months' },
      { token: 'N', label: 'Tenure Months', inputId: 'tenureYears', description: 'Total repayment duration in months' },
    ],
    inputs: [
      {
        id: 'loanAmount',
        name: 'Loan Amount',
        token: 'P',
        type: 'currency',
        defaultValue: 5000000,
        min: 50000,
        max: 100000000,
        step: 50000,
      },
      {
        id: 'interestRate',
        name: 'Interest Rate (% p.a.)',
        token: 'r',
        type: 'percentage',
        defaultValue: 8.5,
        min: 1,
        max: 25,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'tenureYears',
        name: 'Loan Tenure',
        token: 'N',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 30,
        step: 1,
        unit: 'years',
      },
      {
        id: 'prepaymentMonthly',
        name: 'Monthly Extra Prepayment',
        type: 'currency',
        defaultValue: 0,
        min: 0,
        max: 100000,
        step: 1000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateLoanEmi({
        loanAmount: Number(inputs.loanAmount) || 5000000,
        interestRate: Number(inputs.interestRate) || 8.5,
        tenureYears: Number(inputs.tenureYears) || 20,
        prepaymentMonthly: Number(inputs.prepaymentMonthly) || 0,
      });

      const chartData = res.amortization.map((a) => ({
        label: `Yr ${a.year}`,
        balance: a.remainingBalance,
        principalPaid: a.principalPaidYear,
        interestPaid: a.interestPaidYear,
      }));

      const rows = res.amortization
        .filter((_, idx) => idx < 5 || idx % 4 === 0 || idx === res.amortization.length - 1)
        .map((a) => [
          `Year ${a.year}`,
          formatCurrency(a.principalPaidYear, currency),
          formatCurrency(a.interestPaidYear, currency),
          formatCurrency(a.remainingBalance, currency),
        ]);

      return {
        primaryValue: res.monthlyEmi,
        primaryFormatted: `${formatCurrency(res.monthlyEmi, currency)}/mo`,
        primaryLabel: 'Monthly EMI Payment',
        secondaryMetrics: [
          {
            label: 'Total Interest Payable',
            value: formatCurrency(res.totalInterest, currency, true),
            sublabel: `${res.interestRatio.toFixed(1)}% of total payout`,
          },
          {
            label: 'Total Outflow',
            value: formatCurrency(res.totalPayment, currency, true),
            sublabel: 'Principal + Interest',
          },
          {
            label: 'Effective Payoff',
            value: `${(res.actualMonths / 12).toFixed(1)} yrs`,
            sublabel: `${res.actualMonths} installments`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'balance', label: 'Remaining Balance', color: '#FF5D73', type: 'line' },
          { key: 'principalPaid', label: 'Principal Paid', color: '#35E6A0', type: 'area' },
          { key: 'interestPaid', label: 'Interest Paid', color: '#FFB84D', type: 'area' },
        ],
        breakdownTable: {
          headers: ['Year', 'Principal Paid', 'Interest Paid', 'Closing Balance'],
          rows,
        },
        insights: [
          {
            type: res.totalInterest > (Number(inputs.loanAmount) || 1) ? 'warning' : 'info',
            title: 'Total Interest Multiplier',
            description: `You will pay ${formatCurrency(res.totalInterest, currency, true)} in total interest fees over the loan tenure.`,
          },
        ],
      };
    },
    relatedCalculators: ['home-affordability', 'loan-prepayment-calculator', 'compound-interest'],
  },

  // 2. Compound Interest & Wealth Growth Calculator
  {
    id: 'compound-interest',
    slug: 'compound-interest',
    category: 'finance',
    parentCategoryId: 'finance',
    parentCategoryName: 'Finance',
    subCategoryId: 'finance-investments',
    subCategoryName: 'Investments & Savings',
    title: 'Compound Interest & Wealth Growth Calculator',
    tagline: 'Projects how investments grow over time based on compounding frequency, returns, inflation, and periodic contributions.',
    description: 'Calculate your future portfolio balance, total contributions, compounding gains, and inflation-adjusted purchasing power with customizable periodic deposits and flexible compounding frequencies.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]',
    formulaTokens: [
      { token: 'A', label: 'Future Value', description: 'Total accumulated balance after compound growth' },
      { token: 'P', label: 'Initial Principal', inputId: 'initialDeposit', description: 'Starting investment balance' },
      { token: 'r', label: 'Annual Interest Rate', inputId: 'interestRate', description: 'Nominal annual rate of return' },
      { token: 'n', label: 'Compounding Frequency', inputId: 'compoundingFrequency', description: 'Number of times interest compounds per year' },
      { token: 't', label: 'Time Horizon', inputId: 'years', description: 'Total duration of investment in years' },
      { token: 'PMT', label: 'Periodic Contribution', inputId: 'periodicContribution', description: 'Regular deposit made each period' },
    ],
    inputs: [
      {
        id: 'initialDeposit',
        name: 'Initial Investment (Starting Principal)',
        token: 'P',
        type: 'currency',
        defaultValue: 10000,
        min: 0,
        max: 50000000,
        step: 1000,
      },
      {
        id: 'periodicContribution',
        name: 'Regular Addition',
        token: 'PMT',
        type: 'currency',
        defaultValue: 500,
        min: 0,
        max: 1000000,
        step: 50,
      },
      {
        id: 'contributionFrequency',
        name: 'Regular Addition Frequency',
        type: 'select',
        defaultValue: 'monthly',
        options: [
          { label: 'Weekly', value: 'weekly' },
          { label: 'Bi-weekly', value: 'biweekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
          { label: 'Yearly', value: 'annually' },
        ],
      },
      {
        id: 'interestRate',
        name: 'Estimated Annual Return (%)',
        token: 'r',
        type: 'percentage',
        defaultValue: 8.0,
        min: 0.1,
        max: 30,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'years',
        name: 'Investment Period (Years)',
        token: 't',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 50,
        step: 1,
        unit: 'years',
      },
      {
        id: 'compoundingFrequency',
        name: 'Interest is Compounded',
        token: 'n',
        type: 'select',
        defaultValue: 'annually',
        options: [
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
          { label: 'Semi-Annually', value: 'semiannually' },
          { label: 'Yearly', value: 'annually' },
          { label: 'Bi-weekly', value: 'biweekly' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Daily', value: 'daily' },
        ],
      },
      {
        id: 'inflationRate',
        name: 'Estimated Inflation Rate (%)',
        type: 'percentage',
        defaultValue: 3.0,
        min: 0,
        max: 15,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'annualStepUp',
        name: 'Annual Contribution Step-Up (%)',
        type: 'percentage',
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateCompoundInterest({
        initialDeposit: Number(inputs.initialDeposit) || 0,
        periodicContribution: Number(inputs.periodicContribution) || 0,
        contributionFrequency: (inputs.contributionFrequency as any) || 'monthly',
        interestRate: Number(inputs.interestRate) || 8.0,
        years: Number(inputs.years) || 20,
        compoundingFrequency: (inputs.compoundingFrequency as any) || 'annually',
        inflationRate: Number(inputs.inflationRate) || 0,
        annualStepUp: Number(inputs.annualStepUp) || 0,
      });

      const totalGain = res.totalInterest;
      const growthMultiplier = res.growthMultiplier;

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        principal: t.principal,
        interest: t.totalInterestAcc,
        total: t.totalBalance,
        realTotal: t.realBalance,
      }));

      const rows = res.timeline.slice(1).map((t) => [
        `Year ${t.year}`,
        formatCurrency(t.startBalance, currency, false, true),
        `+${formatCurrency(t.deposits, currency, false, true)}`,
        `+${formatCurrency(t.interest, currency, false, true)}`,
        formatCurrency(t.totalBalance, currency, false, true),
        formatCurrency(t.realBalance, currency, false, true),
      ]);

      return {
        primaryValue: res.futureValue,
        primaryFormatted: formatCurrency(res.futureValue, currency, false, true),
        primaryLabel: 'Nominal Future Value (Total Investment Value)',
        secondaryMetrics: [
          {
            label: 'Total Compound Interest Earned',
            value: formatCurrency(totalGain, currency, false, true),
            sublabel: `${res.interestPercentage}% generated purely by growth`,
            delta: `${growthMultiplier}x total`,
          },
          {
            label: 'Total Principal Invested',
            value: formatCurrency(res.totalPrincipal, currency, false, true),
            sublabel: 'Your direct out-of-pocket capital',
          },
          {
            label: 'Inflation-Adjusted Value',
            value: formatCurrency(res.realFutureValue, currency, false, true),
            sublabel: `Today's purchasing power (${inputs.inflationRate || 0}% infl.)`,
            delta: `${(res.realFutureValue / Math.max(1, res.totalPrincipal)).toFixed(1)}x real`,
          },
          {
            label: 'Effective Annual Rate (APY)',
            value: `${res.effectiveAnnualRate}%`,
            sublabel: `Compounded ${inputs.compoundingFrequency}`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'principal', label: 'Invested Principal', color: '#29D8FF', type: 'area' },
          { key: 'interest', label: 'Compound Interest', color: '#8B6CFF', type: 'area' },
          { key: 'realTotal', label: 'Inflation-Adjusted Balance', color: '#35E6A0', type: 'line' },
        ],
        breakdownTable: {
          headers: ['Year', 'Starting Balance', 'Annual Deposits', 'Interest Earned', 'Ending Balance', 'Real Purchasing Power'],
          rows,
        },
        insights: [
          {
            type: 'primary',
            title: 'Compounding Dominance Point',
            description: `Over ${inputs.years} years, compound returns deliver ${formatCurrency(totalGain, currency, true)}, making up ${res.interestPercentage}% of your total wealth.`,
          },
          {
            type: res.realFutureValue > res.totalPrincipal ? 'success' : 'warning',
            title: 'Real Purchasing Power Growth',
            description: `After accounting for an annual inflation rate of ${inputs.inflationRate}%, your terminal portfolio purchasing power equals ${formatCurrency(res.realFutureValue, currency, true)} in today's currency.`,
          },
        ],
      };
    },
    relatedCalculators: ['sip', 'step-up-sip', 'cagr-calculator', 'inflation', 'retirement-corpus', 'simple-interest'],
    faqs: [
      {
        q: 'What is compound interest and how does it work?',
        a: 'Compound interest is the interest calculated on both your initial principal balance and all accumulated interest from previous periods. Often described as "interest on interest," it allows your investment to grow exponentially over time rather than linearly, accelerating wealth creation the longer your money remains invested.',
      },
      {
        q: 'What is the formula for compound interest?',
        a: 'The standard formula to calculate compound interest is A = P(1 + r/n)^(nt), where A is the future total portfolio value (principal + interest), P is the initial investment starting principal, r is the estimated annual interest rate in decimal form, n is the compounding frequency per year (e.g., 12 for monthly, 1 for annually), and t is the total investment duration in years.',
      },
      {
        q: 'How does compounding frequency affect my total returns?',
        a: 'The more frequently interest is compounded, the faster your money grows. For example, monthly or daily compounding generates higher total returns than annual compounding because earned interest is added back to your balance sooner, earning interest on itself much faster.',
      },
      {
        q: 'Why should I factor inflation into my wealth projections?',
        a: 'Factoring in inflation shows you the real purchasing power of your future wealth rather than just the nominal total. While your total dollar balance may look large, an average inflation rate of 2%–3% annually reduces what those dollars can actually buy over a 20 or 30-year period.',
      },
      {
        q: 'What is an annual contribution step-up, and why should I use it?',
        a: 'An annual contribution step-up allows you to automatically increase your regular deposits by a set percentage each year (e.g., boosting contributions by 5% annually) as your career or income grows. Using a step-up drastically accelerates portfolio growth without placing a heavy financial strain on you early on.',
      },
      {
        q: 'What is the difference between simple interest and compound interest?',
        a: 'Simple interest is calculated only on the original principal amount for the entire duration. Compound interest, on the other hand, calculates earnings on both the original principal and the interest accumulated over past periods, producing much higher long-term returns.',
      },
    ],
  },

  // 3. SIP (Systematic Investment Plan) Calculator
  {
    id: 'sip',
    slug: 'sip-calculator',
    category: 'finance',
    title: 'SIP (Systematic Investment Plan) Calculator',
    tagline: 'Estimates final maturity values for recurring monthly mutual fund contributions.',
    description: 'Calculate future wealth accumulation from systematic monthly investments in mutual funds, index funds, and equities.',
    accentColor: '#35E6A0',
    formulaDisplay: 'M = P × [((1 + i)^n - 1) / i] × (1 + i)',
    inputs: [
      {
        id: 'monthlyInvestment',
        name: 'Monthly SIP Amount',
        type: 'currency',
        defaultValue: 15000,
        min: 500,
        max: 500000,
        step: 500,
      },
      {
        id: 'expectedReturnRate',
        name: 'Expected Annual Return (%)',
        type: 'percentage',
        defaultValue: 12,
        min: 1,
        max: 30,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'timePeriodYears',
        name: 'Investment Period (Years)',
        type: 'slider',
        defaultValue: 15,
        min: 1,
        max: 40,
        step: 1,
        unit: 'years',
      },
      {
        id: 'contributionTiming',
        name: 'Contribute at the beginning or end of each month and year',
        type: 'select',
        defaultValue: 'end',
      },
      {
        id: 'contributionFrequency',
        name: 'Contribution Frequency',
        type: 'select',
        defaultValue: 'month',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateSip({
        monthlyInvestment: Number(inputs.monthlyInvestment) || 15000,
        expectedReturnRate: Number(inputs.expectedReturnRate) || 12,
        timePeriodYears: Number(inputs.timePeriodYears) || 15,
        contributionTiming: (inputs.contributionTiming as any) || 'end',
        contributionFrequency: (inputs.contributionFrequency as any) || 'month',
      });

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        invested: t.invested,
        returns: t.returns,
        total: t.totalValue,
      }));

      return {
        primaryValue: res.totalValue,
        primaryFormatted: formatCurrency(res.totalValue, currency, true),
        primaryLabel: 'Expected Maturity Corpus',
        secondaryMetrics: [
          {
            label: 'Total Invested',
            value: formatCurrency(res.investedAmount, currency, true),
          },
          {
            label: 'Estimated Wealth Gain',
            value: `+${formatCurrency(res.estimatedReturns, currency, true)}`,
          },
          {
            label: 'Multiplier',
            value: `${(res.totalValue / (res.investedAmount || 1)).toFixed(1)}x`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'invested', label: 'Invested Capital', color: '#29D8FF', type: 'area' },
          { key: 'returns', label: 'Wealth Gain', color: '#35E6A0', type: 'area' },
        ],
      };
    },
    relatedCalculators: ['compound-interest', 'step-up-sip', 'swp-calculator', 'cagr-calculator', 'retirement-corpus', 'inflation-calculator'],
    faqs: [
      {
        q: 'How much will a ₹10,000 monthly SIP grow in 20 years?',
        a: 'At a 12% assumed annual return, a ₹10,000 monthly SIP over 20 years yields a total invested capital of ₹24,00,000 (₹24 Lakh) and an estimated maturity corpus of approximately ₹99,91,479 (~₹1 Crore), delivering a ~4.16x wealth multiplier.'
      },
      {
        q: 'How much monthly SIP is required to reach ₹1 crore?',
        a: 'To accumulate ₹1 Crore at a 12% return: in 10 years you need ~₹43,040/month; in 15 years ~₹19,820/month; in 20 years ~₹10,010/month; and in 25 years ~₹5,270/month.'
      },
      {
        q: 'How does a 10% annual step-up change the final corpus?',
        a: 'Starting with a ₹10,000/month SIP for 20 years at 12% return: a flat SIP yields ~₹99.9 Lakh, whereas a 10% annual step-up raises total wealth to ~₹2.12 Crore—more than double the maturity corpus.'
      },
      {
        q: 'What happens if the assumed return changes from 12% to 10%?',
        a: 'For a ₹15,000/month SIP over 15 years: at 12% return, your expected corpus is ~₹75.7 Lakh. If the return assumption drops to 10%, the corpus becomes ~₹62.7 Lakh, representing a difference of ~₹13 Lakh due to the compounding differential.'
      },
      {
        q: 'How does inflation affect the future purchasing power of a SIP?',
        a: 'Inflation erodes future purchasing power. A nominal ₹1 Crore maturity corpus in 20 years at 6% annual inflation has the equivalent purchasing power of approximately ₹31.18 Lakh in today\'s money.'
      },
      {
        q: 'What is the difference between SIP and lump-sum investing?',
        a: 'A lump sum deploys entire capital upfront on day one, maximizing time-in-the-market compounding if markets rise. An SIP distributes purchases across monthly cycles, providing Rupee Cost Averaging (RCA) and mitigating sequence-of-returns and timing risk.'
      },
      {
        q: 'Can I calculate a SIP target with an existing portfolio?',
        a: 'Yes. The engine projects the future compound growth of your current portfolio and solves for the incremental additional monthly SIP required to bridge the remaining gap to your financial target.'
      },
      {
        q: 'How are mutual fund capital gains taxed under the new 2024 LTCG rules?',
        a: 'Under the post-July 23, 2024 Indian Budget rules, Long-Term Capital Gains (LTCG) on equity mutual funds held for over 12 months are taxed at 12.5% on gains exceeding the enhanced ₹1.25 Lakh annual exemption threshold.'
      }
    ],
  },

  // 4. Step-Up / Top-Up SIP Calculator
  {
    id: 'step-up-sip',
    slug: 'step-up-sip',
    category: 'finance',
    title: 'Step-Up / Top-Up SIP Calculator',
    tagline: 'Factors in annual salary raises by adjusting monthly contribution amounts upward each year.',
    description: 'Model the compounding effect of increasing your SIP investment amount by a fixed percentage each year in tandem with annual salary increments.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'M_stepup = ∑ [P_k × ((1+i)^(n-k) - 1)/i] where P_k = P_0 × (1 + stepup)^k',
    inputs: [
      {
        id: 'monthlyInvestment',
        name: 'Initial Monthly SIP',
        type: 'currency',
        defaultValue: 20000,
        min: 1000,
        max: 500000,
        step: 1000,
      },
      {
        id: 'annualStepUpPercent',
        name: 'Annual Step-Up (%)',
        type: 'slider',
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        unit: '%',
        description: 'Annual percentage increase in your monthly SIP',
      },
      {
        id: 'expectedReturnRate',
        name: 'Expected Return (% CAGR)',
        type: 'percentage',
        defaultValue: 13,
        min: 1,
        max: 30,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'timePeriodYears',
        name: 'Tenure (Years)',
        type: 'slider',
        defaultValue: 15,
        min: 1,
        max: 35,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateSip({
        monthlyInvestment: Number(inputs.monthlyInvestment) || 20000,
        expectedReturnRate: Number(inputs.expectedReturnRate) || 13,
        timePeriodYears: Number(inputs.timePeriodYears) || 15,
        annualStepUpPercent: Number(inputs.annualStepUpPercent) || 10,
      });

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        invested: t.invested,
        returns: t.returns,
        total: t.totalValue,
      }));

      return {
        primaryValue: res.totalValue,
        primaryFormatted: formatCurrency(res.totalValue, currency, true),
        primaryLabel: 'Step-Up Maturity Value',
        secondaryMetrics: [
          {
            label: 'Total Invested',
            value: formatCurrency(res.investedAmount, currency, true),
          },
          {
            label: 'Wealth Gain',
            value: `+${formatCurrency(res.estimatedReturns, currency, true)}`,
          },
          {
            label: 'Step-Up Advantage',
            value: `+${inputs.annualStepUpPercent}%/yr`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'invested', label: 'Invested Capital', color: '#29D8FF', type: 'area' },
          { key: 'returns', label: 'Growth Gain', color: '#35E6A0', type: 'area' },
        ],
      };
    },
    relatedCalculators: ['sip', 'retirement-corpus'],
  },

  // 5. Income Tax & Regime Comparison Calculator
  {
    id: 'income-tax-comparison',
    slug: 'income-tax-comparison',
    category: 'finance',
    title: 'Income Tax & Regime Comparison Calculator',
    tagline: 'Evaluates tax liabilities across different tax regimes, exemptions, and deductions.',
    description: 'Compare New Tax Regime vs Old Tax Regime side-by-side with Section 87A rebates, 80C, 80D, and HRA deductions to discover which regime saves you more money.',
    accentColor: '#FFB84D',
    formulaDisplay: 'Tax = Slab_Calculation(Gross - Deductions) + 4% Health & Education Cess',
    inputs: [
      {
        id: 'grossSalary',
        name: 'Annual Gross Income (CTC)',
        type: 'currency',
        defaultValue: 1500000,
        min: 300000,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'deductions80C',
        name: '80C Deductions (PPF, ELSS, EPF)',
        type: 'currency',
        defaultValue: 150000,
        min: 0,
        max: 150000,
        step: 10000,
      },
      {
        id: 'hra80D',
        name: 'HRA & 80D Medical Insurance',
        type: 'currency',
        defaultValue: 50000,
        min: 0,
        max: 500000,
        step: 10000,
      },
    ],
    calculate: (inputs, currency) => {
      const gross = Number(inputs.grossSalary) || 1500000;
      const ded80C = Number(inputs.deductions80C) || 150000;
      const hra80D = Number(inputs.hra80D) || 50000;

      const engineOut = runIncomeTaxEngine({
        assessmentYear: 'AY 2026-27',
        ageCategory: 'below_60',
        residentialStatus: 'resident',
        taxpayerCategory: 'individual',
        grossSalary: gross,
        deductions80C: ded80C,
        healthInsuranceSelf: hra80D,
      });

      const chartData = [
        { label: 'New Tax Regime', tax: engineOut.newRegime.totalTaxLiability },
        { label: 'Old Tax Regime', tax: engineOut.oldRegime.totalTaxLiability },
      ];

      return {
        primaryValue: engineOut.recommendedRegime === 'new' ? engineOut.newRegime.totalTaxLiability : engineOut.oldRegime.totalTaxLiability,
        primaryFormatted: formatCurrency(
          engineOut.recommendedRegime === 'new' ? engineOut.newRegime.totalTaxLiability : engineOut.oldRegime.totalTaxLiability,
          currency
        ),
        primaryLabel: `Recommended Tax (${engineOut.recommendedRegime.toUpperCase()} Regime)`,
        secondaryMetrics: [
          {
            label: 'Old Regime Tax',
            value: formatCurrency(engineOut.oldRegime.totalTaxLiability, currency),
          },
          {
            label: 'New Regime Tax',
            value: formatCurrency(engineOut.newRegime.totalTaxLiability, currency),
          },
          {
            label: 'Tax Savings',
            value: formatCurrency(engineOut.taxSavings, currency),
          },
          {
            label: 'Monthly Take-Home',
            value: formatCurrency(
              engineOut.recommendedRegime === 'new' ? engineOut.newRegime.takeHomeMonthly : engineOut.oldRegime.takeHomeMonthly,
              currency
            ),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'tax', label: 'Tax Liability', color: '#FFB84D', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['take-home-salary', 'freelance-tax-calculator', 'capital-gains-tax', 'retirement-corpus', 'sip-calculator'],
    faqs: [
      {
        q: 'What is an income tax calculator?',
        a: 'An income tax calculator estimates your income tax liability using your salary, other income sources, deductions, taxpayer information, and the tax rules applicable to the selected assessment year.',
      },
      {
        q: 'What is an Old vs New Tax Regime Calculator?',
        a: 'It compares estimated income tax under the Old Tax Regime and New Tax Regime side-by-side using the same taxpayer information, exemptions, and applicable tax-year slab structures.',
      },
      {
        q: 'Which tax regime should I select?',
        a: 'The optimal tax regime depends on your total deductions. If your total eligible deductions under Old Regime (80C, 80D, HRA, Home Loan Interest) exceed the break-even threshold (typically ₹3.75L to ₹4.25L for 15L-20L salary), the Old Regime is better. Otherwise, the New Regime offers lower slab rates.',
      },
      {
        q: 'Can I calculate income tax for salary income?',
        a: 'Yes. Enter your gross annual salary (CTC), basic salary, HRA, and applicable salary components to compute exact taxable salary and tax liability.',
      },
      {
        q: 'Can I include deductions in the tax calculator?',
        a: 'Yes. Under the Old Tax Regime, you can claim Section 80C (up to ₹1.5L), 80D health insurance, 80CCD(1B) NPS (up to ₹50k), Section 24(b) home loan interest (up to ₹2L), and Section 80E education loan interest.',
      },
      {
        q: 'Does the New Tax Regime allow deductions?',
        a: 'The New Tax Regime allows a Standard Deduction of ₹75,000 for salaried employees and employer NPS contribution under Section 80CCD(2) up to 10% of Basic salary. Most common individual deductions (80C, 80D, HRA) are disallowed.',
      },
      {
        q: 'What is the difference between tax year and assessment year?',
        a: 'Financial Year (FY) is the year in which income is earned. Assessment Year (AY) is the immediately following year in which that income is evaluated and taxed (e.g., FY 2025-26 corresponds to AY 2026-27).',
      },
      {
        q: 'Is income tax calculated on gross salary?',
        a: 'No. Income tax is calculated on Net Taxable Income after subtracting allowed standard deductions, HRA/LTA exemptions, and eligible Section 80 deductions from your gross salary.',
      },
      {
        q: 'Does the calculator include cess?',
        a: 'Yes. Health & Education Cess is charged at 4% on the sum of basic income tax after Section 87A rebate plus any applicable surcharge.',
      },
      {
        q: 'Does the calculator include surcharge?',
        a: 'Yes. Surcharge is automatically computed for high incomes above ₹50 Lakhs (10%), ₹1 Crore (15%), ₹2 Crores (25%), and ₹5 Crores (37% Old / 25% New capped), including marginal relief calculations.',
      },
      {
        q: 'Can senior citizens use this calculator?',
        a: 'Yes. Select Senior Citizen (60-79 years) or Super Senior Citizen (80+ years) to apply age-specific tax slab limits and Section 80TTB interest deductions.',
      },
      {
        q: 'Can NRIs use the calculator?',
        a: 'Yes. Select Non-Resident (NRI) status. Note that Section 87A rebate is available only to resident individuals.',
      },
      {
        q: 'Are the results guaranteed to match my tax return?',
        a: 'No. The calculator provides an accurate estimation based on your entries and official Income Tax Department slab rules. Actual tax liabilities may vary depending on official tax filing disclosures and Form 16 components.',
      },
    ],
  },

  // 6. Retirement Corpus & Pension Calculator
  {
    id: 'retirement-corpus',
    slug: 'retirement-corpus',
    category: 'finance',
    title: 'Retirement Corpus & Pension Calculator',
    tagline: 'Projects necessary retirement savings based on target age, lifestyle, inflation, and life expectancy.',
    description: 'Calculate the total capital nest egg required to maintain your desired lifestyle throughout retirement, adjusting for inflation, safe withdrawal rates, and longevity.',
    accentColor: '#FFB84D',
    formulaDisplay: 'Corpus = [Future Annual Expenses] × [(1 - (1+r_real)^(-n)) / r_real]',
    inputs: [
      {
        id: 'currentAge',
        name: 'Current Age',
        type: 'slider',
        defaultValue: 30,
        min: 18,
        max: 60,
        step: 1,
        unit: 'yrs',
      },
      {
        id: 'retirementAge',
        name: 'Target Retirement Age',
        type: 'slider',
        defaultValue: 55,
        min: 35,
        max: 75,
        step: 1,
        unit: 'yrs',
      },
      {
        id: 'monthlyExpenses',
        name: 'Current Monthly Expenses',
        type: 'currency',
        defaultValue: 60000,
        min: 10000,
        max: 1000000,
        step: 5000,
      },
      {
        id: 'expectedInflation',
        name: 'Expected Inflation (%)',
        type: 'percentage',
        defaultValue: 6,
        min: 2,
        max: 12,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'currentSavings',
        name: 'Current Savings',
        type: 'currency',
        defaultValue: 500000,
        min: 0,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'monthlyInvestment',
        name: 'Monthly Savings for Retirement',
        type: 'currency',
        defaultValue: 25000,
        min: 0,
        max: 500000,
        step: 2000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateRetirement({
        currentAge: Number(inputs.currentAge) || 30,
        retirementAge: Number(inputs.retirementAge) || 55,
        monthlyExpenses: Number(inputs.monthlyExpenses) || 60000,
        expectedInflation: Number(inputs.expectedInflation) || 6,
        postRetirementReturn: 8,
        currentSavings: Number(inputs.currentSavings) || 500000,
        monthlyInvestment: Number(inputs.monthlyInvestment) || 25000,
        preRetirementReturn: 12,
      });

      const chartData = res.timeline.map((t) => ({
        label: `Age ${t.age}`,
        target: t.corpusTarget,
        projected: t.projected,
      }));

      return {
        primaryValue: res.corpusRequired,
        primaryFormatted: formatCurrency(res.corpusRequired, currency, true),
        primaryLabel: 'Required Retirement Corpus',
        secondaryMetrics: [
          {
            label: 'Projected Wealth',
            value: formatCurrency(res.projectedWealth, currency, true),
          },
          {
            label: 'Future Monthly Expense',
            value: `${formatCurrency(res.futureMonthlyExpense, currency)}/mo`,
          },
          {
            label: 'Funding Status',
            value: `${res.fundedPercentage.toFixed(0)}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'target', label: 'Required Target', color: '#FFB84D', type: 'line' },
          { key: 'projected', label: 'Projected Savings', color: '#35E6A0', type: 'area' },
        ],
      };
    },
    relatedCalculators: ['fire-crossover-calculator', 'swp-calculator', 'inflation-calculator'],
  },

  // 7. Inflation & Purchasing Power Calculator
  {
    id: 'inflation-calculator',
    slug: 'inflation-calculator',
    category: 'finance',
    title: 'Inflation & Purchasing Power Calculator',
    tagline: 'Shows how inflation degrades purchasing power over long time horizons.',
    description: 'Visualize the compounding erosion of purchasing power caused by inflation and calculate how much money you will need in the future to match today’s living costs.',
    accentColor: '#FF5D73',
    formulaDisplay: 'Future_Cost = Present_Cost × (1 + r)^t | Purchasing_Power = Present / (1 + r)^t',
    inputs: [
      {
        id: 'presentAmount',
        name: 'Present Amount / Expense',
        type: 'currency',
        defaultValue: 100000,
        min: 1000,
        max: 50000000,
        step: 5000,
      },
      {
        id: 'inflationRate',
        name: 'Annual Inflation Rate (%)',
        type: 'percentage',
        defaultValue: 6.5,
        min: 1,
        max: 20,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'years',
        name: 'Time Horizon (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 50,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateInflation(
        Number(inputs.presentAmount) || 100000,
        Number(inputs.inflationRate) || 6.5,
        Number(inputs.years) || 20
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        cost: t.futureCost,
        power: t.purchasingPower,
      }));

      return {
        primaryValue: res.futureCost,
        primaryFormatted: formatCurrency(res.futureCost, currency, true),
        primaryLabel: 'Equivalent Future Cost',
        secondaryMetrics: [
          {
            label: 'Purchasing Power Left',
            value: formatCurrency(res.futurePurchasingPower, currency, true),
          },
          {
            label: 'Real Value Lost',
            value: `-${res.powerLossPercent}%`,
          },
          {
            label: 'Inflation Rate',
            value: `${inputs.inflationRate}% p.a.`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'cost', label: 'Future Cost Equivalent', color: '#FF5D73', type: 'line' },
          { key: 'power', label: 'Purchasing Power of Today\'s Money', color: '#29D8FF', type: 'area' },
        ],
      };
    },
    relatedCalculators: ['retirement-corpus', 'compound-interest'],
  },

  // 8. Emergency Fund Calculator
  {
    id: 'emergency-fund',
    slug: 'emergency-fund',
    category: 'finance',
    title: 'Emergency Fund Calculator',
    tagline: 'Calculates required liquid cash buffers based on essential fixed and variable monthly expenses.',
    description: 'Calculate your exact target emergency liquid cash cushion based on monthly fixed costs, groceries, debt EMIs, and insurance buffers.',
    accentColor: '#35E6A0',
    formulaDisplay: 'Target_Fund = (Rent + Food + EMIs + Utilities + Insurance) × Target_Months',
    inputs: [
      {
        id: 'monthlyHousing',
        name: 'Rent / Home Maintenance',
        type: 'currency',
        defaultValue: 25000,
        min: 0,
        max: 500000,
        step: 2000,
      },
      {
        id: 'monthlyFood',
        name: 'Groceries & Household Bills',
        type: 'currency',
        defaultValue: 15000,
        min: 0,
        max: 200000,
        step: 1000,
      },
      {
        id: 'monthlyEmi',
        name: 'Total Monthly Loan EMIs',
        type: 'currency',
        defaultValue: 20000,
        min: 0,
        max: 500000,
        step: 2000,
      },
      {
        id: 'monthlyEssentials',
        name: 'Insurance, Health & Essentials',
        type: 'currency',
        defaultValue: 10000,
        min: 0,
        max: 200000,
        step: 1000,
      },
      {
        id: 'targetMonths',
        name: 'Coverage Buffer (Months)',
        type: 'slider',
        defaultValue: 6,
        min: 3,
        max: 18,
        step: 1,
        unit: 'months',
      },
      {
        id: 'currentSavings',
        name: 'Current Liquid Savings',
        type: 'currency',
        defaultValue: 200000,
        min: 0,
        max: 10000000,
        step: 20000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateEmergencyFund(
        Number(inputs.monthlyHousing) || 0,
        Number(inputs.monthlyFood) || 0,
        Number(inputs.monthlyEmi) || 0,
        Number(inputs.monthlyEssentials) || 0,
        Number(inputs.targetMonths) || 6,
        Number(inputs.currentSavings) || 0
      );

      const chartData = [
        { label: 'Current Savings', value: Number(inputs.currentSavings) || 0 },
        { label: 'Target Buffer', value: res.targetCorpus },
      ];

      return {
        primaryValue: res.targetCorpus,
        primaryFormatted: formatCurrency(res.targetCorpus, currency),
        primaryLabel: 'Target Emergency Fund Size',
        secondaryMetrics: [
          {
            label: 'Monthly Essential Burn',
            value: `${formatCurrency(res.monthlyTotal, currency)}/mo`,
          },
          {
            label: 'Current Runway',
            value: `${res.coverageMonths} months`,
          },
          {
            label: 'Funding Status',
            value: res.gap > 0 ? `Gap: ${formatCurrency(res.gap, currency)}` : 'Fully Funded',
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Cash Buffer', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['net-worth-calculator', 'debt-payoff-snowball-avalanche'],
  },

  // 9. Debt Payoff: Snowball vs Avalanche
  {
    id: 'debt-payoff-snowball-avalanche',
    slug: 'debt-payoff-snowball-avalanche',
    category: 'finance',
    title: 'Debt Payoff / Snowball vs. Avalanche Calculator',
    tagline: 'Compares debt reduction strategies (focusing on smallest balances vs. highest interest rates).',
    description: 'Compare the Debt Avalanche method (mathematically optimal, highest interest first) against the Debt Snowball method (behavioral psychological momentum, smallest balance first).',
    accentColor: '#FF5D73',
    formulaDisplay: 'Avalanche = Sort(Rate DESC) | Snowball = Sort(Balance ASC)',
    inputs: [
      {
        id: 'creditCardBal',
        name: 'High Interest Card Balance',
        type: 'currency',
        defaultValue: 200000,
        min: 0,
        max: 5000000,
        step: 10000,
      },
      {
        id: 'creditCardRate',
        name: 'Card Interest Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 36,
        min: 10,
        max: 48,
        step: 1,
        unit: '%',
      },
      {
        id: 'personalLoanBal',
        name: 'Personal Loan Balance',
        type: 'currency',
        defaultValue: 400000,
        min: 0,
        max: 5000000,
        step: 10000,
      },
      {
        id: 'personalLoanRate',
        name: 'Personal Loan Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 14,
        min: 5,
        max: 28,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'extraMonthlyPayment',
        name: 'Extra Monthly Payment Budget',
        type: 'currency',
        defaultValue: 25000,
        min: 1000,
        max: 200000,
        step: 1000,
      },
    ],
    calculate: (inputs, currency) => {
      const debts = [
        {
          name: 'Credit Card',
          balance: Number(inputs.creditCardBal) || 200000,
          rate: Number(inputs.creditCardRate) || 36,
          minPayment: (Number(inputs.creditCardBal) || 200000) * 0.05,
        },
        {
          name: 'Personal Loan',
          balance: Number(inputs.personalLoanBal) || 400000,
          rate: Number(inputs.personalLoanRate) || 14,
          minPayment: (Number(inputs.personalLoanBal) || 400000) * 0.03,
        },
      ];

      const res = calculateDebtPayoff(debts, Number(inputs.extraMonthlyPayment) || 25000);

      const chartData = [
        { label: 'Debt Avalanche', months: res.avalancheMonths, interest: res.avalancheInterest },
        { label: 'Debt Snowball', months: res.snowballMonths, interest: res.snowballInterest },
      ];

      return {
        primaryValue: res.avalancheMonths,
        primaryFormatted: `${res.avalancheMonths} Months`,
        primaryLabel: 'Debt Freedom with Avalanche',
        secondaryMetrics: [
          {
            label: 'Avalanche Total Interest',
            value: formatCurrency(res.avalancheInterest, currency),
          },
          {
            label: 'Snowball Total Interest',
            value: formatCurrency(res.snowballInterest, currency),
          },
          {
            label: 'Avalanche Interest Saved',
            value: `Save ${formatCurrency(res.interestSaved, currency)}`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'interest', label: 'Total Interest Paid', color: '#FF5D73', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'emergency-fund'],
  },

  // 10. Fixed Deposit (FD) & Recurring Deposit (RD) Calculator
  {
    id: 'fd-rd-calculator',
    slug: 'fd-rd-calculator',
    category: 'finance',
    title: 'Fixed Deposit (FD) & Recurring Deposit (RD) Calculator',
    tagline: 'Calculates guaranteed interest payouts and maturity values for fixed term deposits.',
    description: 'Calculate guaranteed fixed deposit maturity yields with quarterly compounding and recurring deposit accumulation.',
    accentColor: '#009DD9',
    formulaDisplay: 'FD: A = P(1 + r/n)^(nt) | RD: Monthly compounding sum',
    inputs: [
      {
        id: 'depositType',
        name: 'Deposit Type',
        type: 'select',
        defaultValue: 'fd',
        options: [
          { label: 'Fixed Deposit (Lump Sum)', value: 'fd' },
          { label: 'Recurring Deposit (Monthly)', value: 'rd' },
        ],
      },
      {
        id: 'depositAmount',
        name: 'Deposit Amount',
        type: 'currency',
        defaultValue: 500000,
        min: 1000,
        max: 50000000,
        step: 5000,
      },
      {
        id: 'interestRate',
        name: 'Interest Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 7.25,
        min: 1,
        max: 15,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'tenureYears',
        name: 'Tenure (Years)',
        type: 'slider',
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 0.5,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateFdRd(
        (inputs.depositType as any) || 'fd',
        Number(inputs.depositAmount) || 500000,
        Number(inputs.interestRate) || 7.25,
        Number(inputs.tenureYears) || 5
      );

      const chartData = [
        { label: 'Principal Deposited', value: res.invested },
        { label: 'Guaranteed Interest', value: res.interest },
      ];

      return {
        primaryValue: res.maturity,
        primaryFormatted: formatCurrency(res.maturity, currency),
        primaryLabel: 'Guaranteed Maturity Value',
        secondaryMetrics: [
          {
            label: 'Total Principal',
            value: formatCurrency(res.invested, currency),
          },
          {
            label: 'Interest Earned',
            value: `+${formatCurrency(res.interest, currency)}`,
          },
          {
            label: 'Effective Yield',
            value: `${res.effectiveYield}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Amount', color: '#009DD9', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['compound-interest', 'cagr-calculator'],
  },

  // 11. CAGR (Compound Annual Growth Rate) Calculator
  {
    id: 'cagr-calculator',
    slug: 'cagr-calculator',
    category: 'finance',
    title: 'CAGR (Compound Annual Growth Rate) Calculator',
    tagline: 'Computes annual mean growth rates for multi-year investments.',
    description: 'Calculate the true smoothed annual growth rate of any investment, stock portfolio, or business revenue from initial value to final value.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'CAGR = (Ending_Value / Beginning_Value)^(1/t) - 1',
    inputs: [
      {
        id: 'initialValue',
        name: 'Beginning Investment Value',
        type: 'currency',
        defaultValue: 100000,
        min: 1000,
        max: 100000000,
        step: 5000,
      },
      {
        id: 'finalValue',
        name: 'Ending Investment Value',
        type: 'currency',
        defaultValue: 350000,
        min: 1000,
        max: 100000000,
        step: 5000,
      },
      {
        id: 'years',
        name: 'Time Horizon (Years)',
        type: 'slider',
        defaultValue: 7,
        min: 1,
        max: 30,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateCagr(
        Number(inputs.initialValue) || 100000,
        Number(inputs.finalValue) || 350000,
        Number(inputs.years) || 7
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        value: t.value,
      }));

      return {
        primaryValue: res.cagr,
        primaryFormatted: `${res.cagr}% p.a.`,
        primaryLabel: 'Compound Annual Growth Rate (CAGR)',
        secondaryMetrics: [
          {
            label: 'Absolute Return',
            value: `+${res.absoluteReturn}%`,
          },
          {
            label: 'Wealth Multiplier',
            value: `${res.multiplier}x`,
          },
          {
            label: 'Total Value Gain',
            value: formatCurrency((Number(inputs.finalValue) || 0) - (Number(inputs.initialValue) || 0), currency),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Compounding Trajectory', color: '#8B6CFF', type: 'line' },
        ],
      };
    },
    relatedCalculators: ['xirr-calculator', 'lumpsum-calculator', 'compound-interest'],
  },

  // 12. Home Affordability & Max Loan Eligibility Calculator
  {
    id: 'home-affordability',
    slug: 'home-affordability',
    category: 'finance',
    title: 'Home Affordability & Max Loan Eligibility Calculator',
    tagline: 'Estimates maximum borrowing capacity based on debt-to-income (DTI) ratios and monthly income.',
    description: 'Determine the maximum property price and home loan amount you qualify for based on banking Debt-to-Income (DTI) thresholds, down payment savings, and existing debts.',
    accentColor: '#29D8FF',
    formulaDisplay: 'Max_Loan = PV(Rate, Tenure, (Income × DTI_Cap) - Existing_EMIs)',
    inputs: [
      {
        id: 'monthlyIncome',
        name: 'Gross Monthly Income',
        type: 'currency',
        defaultValue: 150000,
        min: 20000,
        max: 2000000,
        step: 5000,
      },
      {
        id: 'existingEmi',
        name: 'Existing Monthly EMIs',
        type: 'currency',
        defaultValue: 15000,
        min: 0,
        max: 500000,
        step: 1000,
      },
      {
        id: 'interestRate',
        name: 'Home Loan Interest Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 8.5,
        min: 5,
        max: 18,
        step: 0.1,
        unit: '%',
      },
      {
        id: 'tenureYears',
        name: 'Loan Tenure (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 5,
        max: 30,
        step: 1,
        unit: 'years',
      },
      {
        id: 'downPayment',
        name: 'Down Payment Savings Available',
        type: 'currency',
        defaultValue: 2000000,
        min: 0,
        max: 50000000,
        step: 50000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateHomeAffordability(
        Number(inputs.monthlyIncome) || 150000,
        Number(inputs.existingEmi) || 15000,
        Number(inputs.interestRate) || 8.5,
        Number(inputs.tenureYears) || 20,
        Number(inputs.downPayment) || 2000000
      );

      const chartData = [
        { label: 'Eligible Home Loan', value: res.maxLoan },
        { label: 'Down Payment', value: Number(inputs.downPayment) || 0 },
      ];

      return {
        primaryValue: res.maxAffordableHomePrice,
        primaryFormatted: formatCurrency(res.maxAffordableHomePrice, currency, true),
        primaryLabel: 'Max Affordable Property Value',
        secondaryMetrics: [
          {
            label: 'Max Loan Eligibility',
            value: formatCurrency(res.maxLoan, currency, true),
          },
          {
            label: 'Max Allowed Monthly EMI',
            value: `${formatCurrency(res.maxAllowedEmi, currency)}/mo`,
          },
          {
            label: 'Down Payment Share',
            value: `${res.downPaymentPercentage}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Capital Breakdown', color: '#29D8FF', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'rent-vs-buy'],
  },

  // 13. Car Loan & Vehicle Depreciation Calculator
  {
    id: 'car-loan-depreciation',
    slug: 'car-loan-depreciation',
    category: 'finance',
    title: 'Car Loan & Vehicle Depreciation Calculator',
    tagline: 'Balances monthly auto payments against long-term asset value depreciation.',
    description: 'Calculate monthly auto loan EMI installments alongside real-world vehicle depreciation curves to determine your true total cost of vehicle ownership.',
    accentColor: '#FFB84D',
    formulaDisplay: 'TCO = DownPayment + TotalLoanPayments - ResaleValue',
    inputs: [
      {
        id: 'vehiclePrice',
        name: 'Vehicle On-Road Price',
        type: 'currency',
        defaultValue: 1500000,
        min: 100000,
        max: 20000000,
        step: 25000,
      },
      {
        id: 'downPayment',
        name: 'Down Payment',
        type: 'currency',
        defaultValue: 300000,
        min: 0,
        max: 10000000,
        step: 25000,
      },
      {
        id: 'interestRate',
        name: 'Auto Loan Interest Rate (%)',
        type: 'percentage',
        defaultValue: 9.0,
        min: 5,
        max: 20,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'tenureYears',
        name: 'Loan Tenure (Years)',
        type: 'slider',
        defaultValue: 5,
        min: 1,
        max: 7,
        step: 1,
        unit: 'years',
      },
      {
        id: 'depreciationRate',
        name: 'Annual Depreciation Rate (%)',
        type: 'slider',
        defaultValue: 15,
        min: 5,
        max: 30,
        step: 1,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateCarLoanDepreciation(
        Number(inputs.vehiclePrice) || 1500000,
        Number(inputs.downPayment) || 300000,
        Number(inputs.interestRate) || 9.0,
        Number(inputs.tenureYears) || 5,
        Number(inputs.depreciationRate) || 15
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        carValue: t.carValue,
        loanBalance: t.loanBalance,
      }));

      return {
        primaryValue: res.monthlyEmi,
        primaryFormatted: `${formatCurrency(res.monthlyEmi, currency)}/mo`,
        primaryLabel: 'Monthly Car Loan EMI',
        secondaryMetrics: [
          {
            label: 'Resale Value After Tenure',
            value: formatCurrency(res.finalCarValue, currency),
          },
          {
            label: 'Total Interest Paid',
            value: formatCurrency(res.totalInterest, currency),
          },
          {
            label: 'Depreciation Loss',
            value: `-${formatCurrency(res.depreciationLoss, currency)}`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'carValue', label: 'Car Market Value', color: '#35E6A0', type: 'line' },
          { key: 'loanBalance', label: 'Outstanding Debt', color: '#FF5D73', type: 'line' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'emergency-fund'],
  },

  // 14. Education Loan Repayment Calculator
  {
    id: 'education-loan',
    slug: 'education-loan',
    category: 'finance',
    title: 'Education Loan Repayment Calculator',
    tagline: 'Maps out student loan amortization with grace periods, moratoria, and interest accrual.',
    description: 'Calculate student loan repayments with course moratorium periods, simple interest accrual during study, and post-graduation amortization schedules.',
    accentColor: '#009DD9',
    formulaDisplay: 'Principal_Start = Loan + Accrued_Interest(Course + Grace_Period)',
    inputs: [
      {
        id: 'principalAmount',
        name: 'Sanctioned Loan Amount',
        type: 'currency',
        defaultValue: 2500000,
        min: 100000,
        max: 15000000,
        step: 50000,
      },
      {
        id: 'interestRate',
        name: 'Interest Rate (% p.a.)',
        type: 'percentage',
        defaultValue: 10.5,
        min: 5,
        max: 20,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'courseYears',
        name: 'Course Duration (Years)',
        type: 'slider',
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 0.5,
        unit: 'years',
      },
      {
        id: 'gracePeriodYears',
        name: 'Grace / Moratorium (Years)',
        type: 'slider',
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.5,
        unit: 'years',
      },
      {
        id: 'repaymentTenureYears',
        name: 'Repayment Tenure (Years)',
        type: 'slider',
        defaultValue: 10,
        min: 1,
        max: 15,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateEducationLoan(
        Number(inputs.principalAmount) || 2500000,
        Number(inputs.interestRate) || 10.5,
        Number(inputs.courseYears) || 2,
        Number(inputs.gracePeriodYears) || 1,
        Number(inputs.repaymentTenureYears) || 10
      );

      const chartData = [
        { label: 'Initial Borrowing', value: Number(inputs.principalAmount) || 0 },
        { label: 'Accrued Interest (Study)', value: res.accruedMoratoriumInterest },
        { label: 'Repayment Interest', value: res.totalRepaymentInterest },
      ];

      return {
        primaryValue: res.monthlyEmi,
        primaryFormatted: `${formatCurrency(res.monthlyEmi, currency)}/mo`,
        primaryLabel: 'Post-Graduation Monthly EMI',
        secondaryMetrics: [
          {
            label: 'Starting Balance Post-Study',
            value: formatCurrency(res.principalAtRepaymentStart, currency),
          },
          {
            label: 'Moratorium Accrued Interest',
            value: formatCurrency(res.accruedMoratoriumInterest, currency),
          },
          {
            label: 'Total Loan Lifetime Outflow',
            value: formatCurrency(res.totalLoanCost, currency, true),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Cost Composition', color: '#009DD9', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['loan-emi', 'take-home-salary'],
  },

  // 15. Take-Home / In-Hand Salary Calculator
  {
    id: 'take-home-salary',
    slug: 'take-home-salary',
    category: 'finance',
    title: 'Take-Home / In-Hand Salary Calculator',
    tagline: 'Converts Gross CTC (Cost to Company) into net monthly bank credit after taxes, insurance, and payroll withholdings.',
    description: 'Break down gross annual CTC into monthly in-hand bank credit after statutory deductions for EPF, Professional Tax, and Income Tax (TDS).',
    accentColor: '#35E6A0',
    formulaDisplay: 'Net_Monthly = [Gross_CTC - (EPF + Tax_TDS + Professional_Tax)] / 12',
    inputs: [
      {
        id: 'annualGrossCtc',
        name: 'Annual Gross CTC',
        type: 'currency',
        defaultValue: 1800000,
        min: 200000,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'pfPercent',
        name: 'Employee PF Contribution (%)',
        type: 'slider',
        defaultValue: 12,
        min: 0,
        max: 12,
        step: 1,
        unit: '%',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateTakeHomeSalary(
        Number(inputs.annualGrossCtc) || 1800000,
        Number(inputs.pfPercent) || 12
      );

      const chartData = [
        { label: 'Net In-Hand Bank Credit', value: res.netMonthlyTakeHome },
        { label: 'Monthly Tax (TDS)', value: res.monthlyTax },
        { label: 'Monthly EPF Savings', value: res.monthlyPf },
      ];

      return {
        primaryValue: res.netMonthlyTakeHome,
        primaryFormatted: `${formatCurrency(res.netMonthlyTakeHome, currency)}/mo`,
        primaryLabel: 'Net In-Hand Monthly Salary',
        secondaryMetrics: [
          {
            label: 'Annual Net Take-Home',
            value: formatCurrency(res.netAnnualTakeHome, currency, true),
          },
          {
            label: 'Take-Home Ratio',
            value: `${res.takeHomePercentage}% of CTC`,
          },
          {
            label: 'Monthly TDS Tax',
            value: formatCurrency(res.monthlyTax, currency),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Monthly Salary Breakdown', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['income-tax-comparison', 'emergency-fund'],
  },

  // 16. Lumpsum Investment Return Calculator
  {
    id: 'lumpsum-calculator',
    slug: 'lumpsum-calculator',
    category: 'finance',
    title: 'Lumpsum Investment Return Calculator',
    tagline: 'Evaluates single one-time capital allocations over variable holding periods.',
    description: 'Calculate the future growth and terminal value of a single one-time capital lump-sum investment over any investment holding period.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'A = P × (1 + r)^t',
    inputs: [
      {
        id: 'principal',
        name: 'Lumpsum Investment Amount',
        type: 'currency',
        defaultValue: 500000,
        min: 5000,
        max: 100000000,
        step: 10000,
      },
      {
        id: 'returnRate',
        name: 'Expected Annual Return (%)',
        type: 'percentage',
        defaultValue: 12.5,
        min: 1,
        max: 35,
        step: 0.25,
        unit: '%',
      },
      {
        id: 'years',
        name: 'Holding Period (Years)',
        type: 'slider',
        defaultValue: 10,
        min: 1,
        max: 40,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateLumpsum(
        Number(inputs.principal) || 500000,
        Number(inputs.returnRate) || 12.5,
        Number(inputs.years) || 10
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        invested: t.invested,
        gain: t.gain,
        total: t.total,
      }));

      return {
        primaryValue: res.maturityValue,
        primaryFormatted: formatCurrency(res.maturityValue, currency, true),
        primaryLabel: 'Maturity Valuation',
        secondaryMetrics: [
          {
            label: 'Total Capital Gain',
            value: `+${formatCurrency(res.wealthGain, currency, true)}`,
          },
          {
            label: 'Wealth Multiplier',
            value: `${res.multiplier}x`,
          },
          {
            label: 'Initial Principal',
            value: formatCurrency(Number(inputs.principal) || 0, currency),
          },
        ],
        chartData,
        chartSeries: [
          { key: 'invested', label: 'Initial Principal', color: '#29D8FF', type: 'area' },
          { key: 'gain', label: 'Capital Appreciation', color: '#8B6CFF', type: 'area' },
        ],
      };
    },
    relatedCalculators: ['sip', 'cagr-calculator', 'compound-interest'],
  },

  // 17. Simple vs. Compound Interest Calculator
  {
    id: 'simple-vs-compound',
    slug: 'simple-vs-compound-interest',
    category: 'finance',
    title: 'Simple vs. Compound Interest Calculator',
    tagline: 'Illustrates the mathematical divergence between simple linear yield and compounding returns.',
    description: 'Compare linear growth (Simple Interest) against exponential growth (Compound Interest) to see the dramatic compounding advantage over time.',
    accentColor: '#29D8FF',
    formulaDisplay: 'Simple: A = P(1 + rt) | Compound: A = P(1 + r)^t',
    inputs: [
      {
        id: 'principal',
        name: 'Principal Capital',
        type: 'currency',
        defaultValue: 200000,
        min: 1000,
        max: 50000000,
        step: 5000,
      },
      {
        id: 'rate',
        name: 'Annual Rate of Return (%)',
        type: 'percentage',
        defaultValue: 10,
        min: 1,
        max: 30,
        step: 0.5,
        unit: '%',
      },
      {
        id: 'years',
        name: 'Time Horizon (Years)',
        type: 'slider',
        defaultValue: 20,
        min: 1,
        max: 40,
        step: 1,
        unit: 'years',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateSimpleVsCompound(
        Number(inputs.principal) || 200000,
        Number(inputs.rate) || 10,
        Number(inputs.years) || 20
      );

      const chartData = res.timeline.map((t) => ({
        label: `Yr ${t.year}`,
        simple: t.simple,
        compound: t.compound,
      }));

      return {
        primaryValue: res.compoundTotal,
        primaryFormatted: formatCurrency(res.compoundTotal, currency, true),
        primaryLabel: 'Compound Interest Final Balance',
        secondaryMetrics: [
          {
            label: 'Simple Interest Balance',
            value: formatCurrency(res.simpleTotal, currency, true),
          },
          {
            label: 'Compound Advantage Delta',
            value: `+${formatCurrency(res.delta, currency, true)}`,
          },
          {
            label: 'Compounding Premium',
            value: `+${((res.delta / res.simpleTotal) * 100).toFixed(0)}% more`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'simple', label: 'Linear Simple Interest', color: '#FFB84D', type: 'line' },
          { key: 'compound', label: 'Exponential Compound Growth', color: '#8B6CFF', type: 'line' },
        ],
      };
    },
    relatedCalculators: ['compound-interest', 'cagr-calculator'],
  },

  // 18. Stock Average / Buy-the-Dip Calculator
  {
    id: 'stock-average',
    slug: 'stock-average-calculator',
    category: 'finance',
    title: 'Stock Average / Buy-the-Dip Calculator',
    tagline: 'Determines new cost-basis averages when adding positions during market fluctuations.',
    description: 'Calculate your new weighted average share price after averaging down or adding to existing stock and crypto positions during market dips.',
    accentColor: '#35E6A0',
    formulaDisplay: 'Avg_Price = (Shares_1 × Price_1 + Shares_2 × Price_2) / (Shares_1 + Shares_2)',
    inputs: [
      {
        id: 'p1Shares',
        name: 'First Purchase (Shares)',
        type: 'slider',
        defaultValue: 100,
        min: 1,
        max: 10000,
        step: 5,
        unit: 'shares',
      },
      {
        id: 'p1Price',
        name: 'First Purchase Price (per share)',
        type: 'currency',
        defaultValue: 2500,
        min: 1,
        max: 500000,
        step: 10,
      },
      {
        id: 'p2Shares',
        name: 'Second / Dip Purchase (Shares)',
        type: 'slider',
        defaultValue: 150,
        min: 1,
        max: 10000,
        step: 5,
        unit: 'shares',
      },
      {
        id: 'p2Price',
        name: 'Second Purchase Price (per share)',
        type: 'currency',
        defaultValue: 1800,
        min: 1,
        max: 500000,
        step: 10,
      },
      {
        id: 'targetPrice',
        name: 'Target Exit / Selling Price',
        type: 'currency',
        defaultValue: 2800,
        min: 1,
        max: 500000,
        step: 10,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateStockAverage(
        Number(inputs.p1Shares) || 100,
        Number(inputs.p1Price) || 2500,
        Number(inputs.p2Shares) || 150,
        Number(inputs.p2Price) || 1800,
        Number(inputs.targetPrice) || 2800
      );

      const chartData = [
        { label: 'Initial Buy Price', value: Number(inputs.p1Price) || 0 },
        { label: 'Dip Buy Price', value: Number(inputs.p2Price) || 0 },
        { label: 'New Weighted Average', value: res.avgCostBasis },
        { label: 'Target Exit Price', value: Number(inputs.targetPrice) || 0 },
      ];

      return {
        primaryValue: res.avgCostBasis,
        primaryFormatted: `${currency.symbol}${res.avgCostBasis}`,
        primaryLabel: 'New Weighted Average Price',
        secondaryMetrics: [
          {
            label: 'Cost Basis Reduction',
            value: `-${res.priceReductionPercent}%`,
          },
          {
            label: 'Total Capital Invested',
            value: formatCurrency(res.totalInvested, currency),
          },
          {
            label: 'Projected Profit at Target',
            value: `+${formatCurrency(res.profitAtTarget, currency)}`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Price Points', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['cagr-calculator', 'capital-gains-tax'],
  },

  // 19. Net Worth Tracker & Balance Sheet Calculator
  {
    id: 'net-worth-calculator',
    slug: 'net-worth-calculator',
    category: 'finance',
    title: 'Net Worth Tracker & Balance Sheet Calculator',
    tagline: 'Aggregates liquid assets, investments, real estate, and liabilities to calculate total net equity.',
    description: 'Compile a complete personal balance sheet by aggregating liquid bank assets, investment portfolios, real estate equity, and subtracting debt liabilities.',
    accentColor: '#35E6A0',
    formulaDisplay: 'Net_Worth = Total_Assets (Cash + Portfolios + RealEstate) - Total_Liabilities',
    inputs: [
      {
        id: 'liquidCash',
        name: 'Bank & Liquid Cash',
        type: 'currency',
        defaultValue: 500000,
        min: 0,
        max: 50000000,
        step: 25000,
      },
      {
        id: 'investments',
        name: 'Stocks, Mutual Funds & Crypto',
        type: 'currency',
        defaultValue: 3500000,
        min: 0,
        max: 100000000,
        step: 50000,
      },
      {
        id: 'realEstate',
        name: 'Real Estate / Property Equity',
        type: 'currency',
        defaultValue: 8000000,
        min: 0,
        max: 200000000,
        step: 100000,
      },
      {
        id: 'retirement',
        name: 'Retirement & Pension Accounts',
        type: 'currency',
        defaultValue: 1500000,
        min: 0,
        max: 50000000,
        step: 50000,
      },
      {
        id: 'mortgageDebt',
        name: 'Mortgage / Home Loan Debt',
        type: 'currency',
        defaultValue: 4500000,
        min: 0,
        max: 100000000,
        step: 50000,
      },
      {
        id: 'autoDebt',
        name: 'Car / Personal Loan Debt',
        type: 'currency',
        defaultValue: 400000,
        min: 0,
        max: 10000000,
        step: 25000,
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateNetWorth(
        Number(inputs.liquidCash) || 0,
        Number(inputs.investments) || 0,
        Number(inputs.realEstate) || 0,
        Number(inputs.retirement) || 0,
        Number(inputs.mortgageDebt) || 0,
        Number(inputs.autoDebt) || 0,
        0
      );

      const chartData = [
        { label: 'Total Assets', value: res.totalAssets },
        { label: 'Total Liabilities', value: res.totalLiabilities },
        { label: 'Net Equity', value: res.netWorth },
      ];

      return {
        primaryValue: res.netWorth,
        primaryFormatted: formatCurrency(res.netWorth, currency, true),
        primaryLabel: 'Total Net Worth',
        secondaryMetrics: [
          {
            label: 'Gross Assets',
            value: formatCurrency(res.totalAssets, currency, true),
          },
          {
            label: 'Total Liabilities',
            value: formatCurrency(res.totalLiabilities, currency, true),
          },
          {
            label: 'Debt-to-Asset Ratio',
            value: `${res.debtToAssetRatio}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Balance Sheet', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['fire-crossover-calculator', 'emergency-fund'],
  },

  // 20. Capital Gains Tax Calculator
  {
    id: 'capital-gains-tax',
    slug: 'capital-gains-tax',
    category: 'finance',
    title: 'Capital Gains Tax Calculator',
    tagline: 'Calculates short-term (STCG) and long-term (LTCG) tax liabilities on stocks, crypto, and real property.',
    description: 'Calculate capital gains tax liability for equity shares, mutual funds, real estate, and crypto with Budget 2024 LTCG/STCG tax rules.',
    accentColor: '#FF5D73',
    formulaDisplay: 'Tax = (Sale_Price - Buy_Price - Exemption) × Tax_Rate',
    inputs: [
      {
        id: 'assetType',
        name: 'Asset Category',
        type: 'select',
        defaultValue: 'equity',
        options: [
          { label: 'Listed Equity / Mutual Funds', value: 'equity' },
          { label: 'Real Estate / Property', value: 'property' },
          { label: 'Virtual Digital Assets / Crypto', value: 'crypto' },
        ],
      },
      {
        id: 'buyPrice',
        name: 'Purchase / Acquisition Price',
        type: 'currency',
        defaultValue: 500000,
        min: 1000,
        max: 100000000,
        step: 10000,
      },
      {
        id: 'salePrice',
        name: 'Sale / Realization Price',
        type: 'currency',
        defaultValue: 1200000,
        min: 1000,
        max: 100000000,
        step: 10000,
      },
      {
        id: 'holdingMonths',
        name: 'Holding Period (Months)',
        type: 'slider',
        defaultValue: 24,
        min: 1,
        max: 120,
        step: 1,
        unit: 'months',
      },
    ],
    calculate: (inputs, currency) => {
      const res = calculateCapitalGains(
        (inputs.assetType as any) || 'equity',
        Number(inputs.buyPrice) || 500000,
        Number(inputs.salePrice) || 1200000,
        Number(inputs.holdingMonths) || 24
      );

      const chartData = [
        { label: 'Purchase Cost', value: Number(inputs.buyPrice) || 0 },
        { label: 'Net Post-Tax Profit', value: res.gain - res.taxLiability },
        { label: 'Tax Liability', value: res.taxLiability },
      ];

      return {
        primaryValue: res.taxLiability,
        primaryFormatted: formatCurrency(res.taxLiability, currency),
        primaryLabel: `Tax Payable (${res.taxType})`,
        secondaryMetrics: [
          {
            label: 'Total Capital Gain',
            value: `+${formatCurrency(res.gain, currency)}`,
          },
          {
            label: 'Net Post-Tax Proceeds',
            value: formatCurrency(res.netProceeds, currency),
          },
          {
            label: 'Effective Tax Rate',
            value: `${res.effectiveTaxRate}%`,
          },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Proceeds Breakdown', color: '#FF5D73', type: 'bar' },
        ],
      };
    },
    relatedCalculators: ['income-tax-comparison', 'stock-average'],
  },
];
