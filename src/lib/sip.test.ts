import { calculateSip } from './safeMath.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runTests() {
  console.log('Running SIP Calculator Regression Tests...');

  // 1. Benchmark: ₹15,000/month, 12%, 20 years (Beginning of period timing)
  const resBenchmarkBeginning = calculateSip({
    monthlyInvestment: 15000,
    expectedReturnRate: 12,
    timePeriodYears: 20,
    contributionTiming: 'beginning',
    contributionFrequency: 'month'
  });
  console.log(`Benchmark Beginning Corpus: ${resBenchmarkBeginning.totalValue}`);
  assert(
    Math.abs(resBenchmarkBeginning.totalValue - 14987219) <= 20,
    `₹15,000/month, 12%, 20 years with beginning timing should be approximately ₹1,49,87,219. Got: ${resBenchmarkBeginning.totalValue}`
  );

  // 2. Benchmark: ₹15,000/month, 12%, 20 years (End of period timing)
  const resBenchmarkEnd = calculateSip({
    monthlyInvestment: 15000,
    expectedReturnRate: 12,
    timePeriodYears: 20,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  console.log(`Benchmark End Corpus: ${resBenchmarkEnd.totalValue}`);
  assert(
    Math.abs(resBenchmarkEnd.totalValue - 14838830) <= 20,
    `₹15,000/month, 12%, 20 years with end timing should be approximately ₹14,838,830. Got: ${resBenchmarkEnd.totalValue}`
  );

  // 3. 0% return -> corpus equals total invested
  const resZeroReturn = calculateSip({
    monthlyInvestment: 5000,
    expectedReturnRate: 0,
    timePeriodYears: 10,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  assert(
    resZeroReturn.totalValue === resZeroReturn.investedAmount,
    `At 0% return, corpus (${resZeroReturn.totalValue}) must equal total invested (${resZeroReturn.investedAmount})`
  );
  assert(
    resZeroReturn.estimatedReturns === 0,
    `At 0% return, estimated returns must be exactly 0. Got: ${resZeroReturn.estimatedReturns}`
  );

  // 4. ₹15,000/month, 0% return, 20 years -> ₹36,00,000
  const resZeroReturnBenchmark = calculateSip({
    monthlyInvestment: 15000,
    expectedReturnRate: 0,
    timePeriodYears: 20,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  assert(
    resZeroReturnBenchmark.totalValue === 3600000,
    `₹15,000/month, 0% return, 20 years should yield exactly ₹36,00,000. Got: ${resZeroReturnBenchmark.totalValue}`
  );

  // 5. Beginning vs End Timing Comparison
  // For positive rates, beginning of month contributions compound earlier and must yield more than end of month contributions.
  assert(
    resBenchmarkBeginning.totalValue > resBenchmarkEnd.totalValue,
    'Beginning-of-period timing must yield a higher final value than end-of-period timing'
  );

  // 6. Step-up rate testing at 0%, 5%, and 10%
  const resNoStepUp = calculateSip({
    monthlyInvestment: 10000,
    expectedReturnRate: 12,
    timePeriodYears: 5,
    annualStepUpPercent: 0,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  const resStepUp5 = calculateSip({
    monthlyInvestment: 10000,
    expectedReturnRate: 12,
    timePeriodYears: 5,
    annualStepUpPercent: 5,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  const resWithStepUp = calculateSip({
    monthlyInvestment: 10000,
    expectedReturnRate: 12,
    timePeriodYears: 5,
    annualStepUpPercent: 10,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  console.log(`Flat SIP Corpus (5 yrs): ${resNoStepUp.totalValue}, Invested: ${resNoStepUp.investedAmount}`);
  console.log(`Step-up 5% Corpus (5 yrs): ${resStepUp5.totalValue}, Invested: ${resStepUp5.investedAmount}`);
  console.log(`Step-up 10% Corpus (5 yrs): ${resWithStepUp.totalValue}, Invested: ${resWithStepUp.investedAmount}`);
  
  assert(resNoStepUp.totalValue === 816697 && resNoStepUp.investedAmount === 600000, '0% step-up must match 816697 corpus');
  assert(resStepUp5.totalValue === 892133 && resStepUp5.investedAmount === 663076, '5% step-up must match 892133 corpus');
  assert(resWithStepUp.totalValue === 974822 && resWithStepUp.investedAmount === 732612, '10% step-up must match 974822 corpus');

  // 6.1 Zero investment handling
  const resZeroInvestment = calculateSip({
    monthlyInvestment: 0,
    expectedReturnRate: 12,
    timePeriodYears: 10,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  assert(resZeroInvestment.totalValue === 0 && resZeroInvestment.investedAmount === 0, 'Zero monthly investment must result in exactly zero final corpus and invested amount');

  // 7. Invalid / NaN / Infinity inputs fallback safely
  const resInvalid = calculateSip({
    monthlyInvestment: NaN,
    expectedReturnRate: Infinity,
    timePeriodYears: -10, // will be clamped to min years 1
    annualStepUpPercent: NaN,
    contributionTiming: 'end',
    contributionFrequency: 'month'
  });
  console.log(`Invalid input fallback corpus: ${resInvalid.totalValue}, Invested: ${resInvalid.investedAmount}`);
  assert(
    Number.isFinite(resInvalid.totalValue) && resInvalid.totalValue >= 0,
    'Invalid/NaN/Infinity inputs must fallback to valid safe numbers and not propagate NaN'
  );
  assert(
    Number.isFinite(resInvalid.investedAmount) && resInvalid.investedAmount >= 0,
    'Invalid/NaN/Infinity inputs must fallback to valid safe invested amounts and not propagate NaN'
  );

  console.log('\n[SUCCESS] All SIP Calculator Regression Tests Completed Successfully!');
}

runTests();
