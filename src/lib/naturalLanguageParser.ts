export interface ParsedQueryIntent {
  calculatorId: string;
  confidence: number;
  extractedInputs: Record<string, any>;
  summary: string;
}

export function parseNaturalLanguageQuery(query: string): ParsedQueryIntent | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // Helper to extract numbers with units (e.g. 50 lakh, 50l, 2.5cr, 10k, 500000)
  const extractAmount = (text: string): number | null => {
    // Check crore
    const crMatch = text.match(/([0-9.]+)\s*(cr|crore|crores)/i);
    if (crMatch) return parseFloat(crMatch[1]) * 10000000;

    // Check lakh
    const lkMatch = text.match(/([0-9.]+)\s*(l|lac|lakh|lakhs)/i);
    if (lkMatch) return parseFloat(lkMatch[1]) * 100000;

    // Check k / thousand
    const kMatch = text.match(/([0-9.]+)\s*(k|thousand|thousands)/i);
    if (kMatch) return parseFloat(kMatch[1]) * 1000;

    // Check million
    const mMatch = text.match(/([0-9.]+)\s*(m|million|millions)/i);
    if (mMatch) return parseFloat(mMatch[1]) * 1000000;

    // Check pure numbers with optional commas or currency symbol
    const numMatch = text.match(/(?:₹|\$|€|£)?\s*([0-9,]+(?:\.[0-9]+)?)/);
    if (numMatch) {
      const clean = numMatch[1].replace(/,/g, '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  // Helper to extract percentages (e.g. 8.5%, 12 percent)
  const extractRate = (text: string): number | null => {
    const rateMatch = text.match(/([0-9.]+)\s*(?:%|percent)/i);
    if (rateMatch) return parseFloat(rateMatch[1]);
    return null;
  };

  // Helper to extract years (e.g. 20 years, 15 yr, 10y)
  const extractYears = (text: string): number | null => {
    const yrMatch = text.match(/([0-9.]+)\s*(?:years?|yrs?|y\b)/i);
    if (yrMatch) return parseFloat(yrMatch[1]);
    return null;
  };

  // 1. EMI / Loan / Mortgage match
  if (q.includes('emi') || q.includes('loan') || q.includes('mortgage') || q.includes('home loan')) {
    const inputs: Record<string, any> = {};
    const amount = extractAmount(q);
    const rate = extractRate(q);
    const years = extractYears(q);

    if (amount) inputs.loanAmount = amount;
    if (rate) inputs.interestRate = rate;
    if (years) inputs.tenureYears = years;

    return {
      calculatorId: 'loan-emi',
      confidence: 0.95,
      extractedInputs: inputs,
      summary: `Loan EMI calculation${amount ? ` for ₹${(amount).toLocaleString()}` : ''}${rate ? ` @ ${rate}%` : ''}${years ? ` for ${years} years` : ''}`,
    };
  }

  // 2. SIP match
  if (q.includes('sip') || q.includes('systematic investment')) {
    const inputs: Record<string, any> = {};
    const amount = extractAmount(q);
    const rate = extractRate(q);
    const years = extractYears(q);

    if (amount) inputs.monthlyInvestment = amount;
    if (rate) inputs.expectedReturnRate = rate;
    if (years) inputs.timePeriodYears = years;

    return {
      calculatorId: 'sip',
      confidence: 0.95,
      extractedInputs: inputs,
      summary: `SIP Wealth Model${amount ? ` of ₹${amount.toLocaleString()}/mo` : ''}${rate ? ` @ ${rate}%` : ''}${years ? ` for ${years} years` : ''}`,
    };
  }

  // 3. Compound Interest / Wealth match
  if (q.includes('compound') || q.includes('investment') || q.includes('future value') || q.includes('wealth')) {
    const inputs: Record<string, any> = {};
    const amount = extractAmount(q);
    const rate = extractRate(q);
    const years = extractYears(q);

    if (amount) inputs.initialDeposit = amount;
    if (rate) inputs.interestRate = rate;
    if (years) inputs.years = years;

    return {
      calculatorId: 'compound-interest',
      confidence: 0.9,
      extractedInputs: inputs,
      summary: `Compound Interest calculation${amount ? ` for ₹${amount.toLocaleString()}` : ''}${rate ? ` @ ${rate}%` : ''}${years ? ` for ${years} years` : ''}`,
    };
  }

  // 4. Retirement / FIRE
  if (q.includes('retire') || q.includes('retirement') || q.includes('fire') || q.includes('pension')) {
    const inputs: Record<string, any> = {};
    const amount = extractAmount(q);
    if (amount) inputs.monthlyExpenses = amount;

    return {
      calculatorId: 'retirement',
      confidence: 0.88,
      extractedInputs: inputs,
      summary: 'Retirement Freedom Corpus model',
    };
  }

  // 5. BMI / Health
  if (q.includes('bmi') || q.includes('weight') || q.includes('calories') || q.includes('health')) {
    const inputs: Record<string, any> = {};
    const wtMatch = q.match(/([0-9.]+)\s*(?:kg|kilos?)/i);
    const htMatch = q.match(/([0-9.]+)\s*(?:cm|centimeters?)/i);

    if (wtMatch) inputs.weight = parseFloat(wtMatch[1]);
    if (htMatch) inputs.height = parseFloat(htMatch[1]);

    return {
      calculatorId: 'bmi-health',
      confidence: 0.92,
      extractedInputs: inputs,
      summary: `BMI & Body Composition analysis${inputs.weight ? ` for ${inputs.weight}kg` : ''}${inputs.height ? ` / ${inputs.height}cm` : ''}`,
    };
  }

  // 6. Math / Graphing Function
  if (q.includes('graph') || q.includes('sin(') || q.includes('cos(') || q.includes('x^2') || q.includes('function') || q.includes('plot')) {
    return {
      calculatorId: 'math-studio',
      confidence: 0.9,
      extractedInputs: {},
      summary: 'Mathematical Coordinate Function Grapher',
    };
  }

  // 7. Unit Converter
  if (q.includes('to') && (q.includes('km') || q.includes('miles') || q.includes('kg') || q.includes('lbs') || q.includes('celsius') || q.includes('fahrenheit') || q.includes('gb') || q.includes('mb'))) {
    return {
      calculatorId: 'unit-converter',
      confidence: 0.85,
      extractedInputs: {},
      summary: 'Unit & Dimensional Converter',
    };
  }

  return null;
}
