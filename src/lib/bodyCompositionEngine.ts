/**
 * Body Composition & Anthropometric Interpretation Engine
 * Implements Quetelet's BMI, WHO standard & Asian population classifications,
 * Pediatric CDC percentiles, Deurenberg body fat estimation,
 * U.S. Navy circumference method, Boer & James Lean Body Mass,
 * Waist-to-Height Ratio (WHtR), Metric Disagreement Analysis,
 * and Reverse BMI Solvers.
 */

export type Sex = 'male' | 'female';
export type ReferenceStandard = 'who_standard' | 'who_asian' | 'pediatric_cdc';
export type BodyFatMethod = 'deurenberg' | 'us_navy' | 'measured';

export interface BodyCompositionInputs {
  weightKg: number;
  heightCm: number;
  age?: number;
  sex?: Sex;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  measuredBodyFatPct?: number; // User provided (DEXA, hydrostatic, calipers)
  referenceStandard?: ReferenceStandard;
}

export interface BmiCategoryInfo {
  category: 'Underweight' | 'Normal Weight' | 'Overweight' | 'Obesity Class I' | 'Obesity Class II' | 'Obesity Class III';
  color: string;
  minBmi: number;
  maxBmi: number;
  description: string;
}

export interface BodyFatCategoryInfo {
  category: 'Essential Fat' | 'Athletes' | 'Fitness' | 'Acceptable / Average' | 'Elevated / High';
  color: string;
}

export interface BodyCompositionResult {
  // Core BMI
  bmi: number;
  bmiPrime: number; // Ratio of BMI to upper normal bound (25)
  category: string;
  categoryColor: string;
  referenceStandardName: string;
  isPediatric: boolean;
  pediatricPercentile?: number;

  // Weight Ranges
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  weightDeltaToNormalKg: number; // 0 if in normal range, positive if above, negative if below

  // Body Fat & Composition
  bodyFatPct: number;
  bodyFatMethod: BodyFatMethod;
  bodyFatMethodName: string;
  isMeasured: boolean;
  uncertaintyMarginPct: number;
  fatMassKg: number;
  leanMassKg: number;
  leanMassBoerKg: number;
  leanMassJamesKg: number;
  bodyFatCategory: string;
  bodyFatCategoryColor: string;

  // Waist & Anthropometric
  whtr?: number; // Waist-to-Height Ratio
  whtrCategory?: 'Low / Underweight' | 'Healthy / Optimal' | 'Increased Risk' | 'High Risk';
  whtrColor?: string;
  whr?: number; // Waist-to-Hip Ratio
  whrCategory?: 'Low Risk' | 'Moderate Risk' | 'High Risk';

  // Cross-Signal Disagreement Engine
  hasDisagreement: boolean;
  disagreementTitle?: string;
  disagreementExplanation?: string;

  // Metric Limitations
  limitations: {
    bmi: string;
    bodyFat: string;
    waist: string;
  };
}

/**
 * Standard WHO and Asian BMI Classifications
 */
export function getBmiCategory(bmi: number, standard: ReferenceStandard = 'who_standard'): BmiCategoryInfo {
  if (standard === 'who_asian') {
    // WHO Asian population specific thresholds
    if (bmi < 18.5) {
      return { category: 'Underweight', color: '#3A86FF', minBmi: 0, maxBmi: 18.49, description: 'Lower body mass relative to stature.' };
    }
    if (bmi < 23.0) {
      return { category: 'Normal Weight', color: '#00875A', minBmi: 18.5, maxBmi: 22.99, description: 'Within Asian population healthy reference range.' };
    }
    if (bmi < 27.5) {
      return { category: 'Overweight', color: '#FFB84D', minBmi: 23.0, maxBmi: 27.49, description: 'Elevated cardiometabolic screening threshold.' };
    }
    return { category: 'Obesity Class I', color: '#FF5D73', minBmi: 27.5, maxBmi: 50, description: 'High cardiometabolic risk category for Asian populations.' };
  }

  // Standard WHO International
  if (bmi < 18.5) {
    return { category: 'Underweight', color: '#3A86FF', minBmi: 0, maxBmi: 18.49, description: 'Below standard healthy reference threshold.' };
  }
  if (bmi < 25.0) {
    return { category: 'Normal Weight', color: '#00875A', minBmi: 18.5, maxBmi: 24.99, description: 'Standard international healthy reference band.' };
  }
  if (bmi < 30.0) {
    return { category: 'Overweight', color: '#FFB84D', minBmi: 25.0, maxBmi: 29.99, description: 'Pre-obesity screening threshold.' };
  }
  if (bmi < 35.0) {
    return { category: 'Obesity Class I', color: '#FF708F', minBmi: 30.0, maxBmi: 34.99, description: 'Moderate health risk classification.' };
  }
  if (bmi < 40.0) {
    return { category: 'Obesity Class II', color: '#FF5D73', minBmi: 35.0, maxBmi: 39.99, description: 'Severe health risk classification.' };
  }
  return { category: 'Obesity Class III', color: '#D90429', minBmi: 40.0, maxBmi: 80, description: 'Very severe health risk classification.' };
}

/**
 * Categorize Body Fat % based on ACE standards
 */
export function getBodyFatCategory(bfPct: number, sex: Sex = 'male'): BodyFatCategoryInfo {
  if (sex === 'male') {
    if (bfPct < 6) return { category: 'Essential Fat', color: '#3A86FF' };
    if (bfPct <= 13) return { category: 'Athletes', color: '#00875A' };
    if (bfPct <= 17) return { category: 'Fitness', color: '#00875A' };
    if (bfPct <= 24) return { category: 'Acceptable / Average', color: '#FFB84D' };
    return { category: 'Elevated / High', color: '#FF5D73' };
  } else {
    if (bfPct < 14) return { category: 'Essential Fat', color: '#3A86FF' };
    if (bfPct <= 20) return { category: 'Athletes', color: '#00875A' };
    if (bfPct <= 24) return { category: 'Fitness', color: '#00875A' };
    if (bfPct <= 31) return { category: 'Acceptable / Average', color: '#FFB84D' };
    return { category: 'Elevated / High', color: '#FF5D73' };
  }
}

/**
 * U.S. Navy Circumference Body Fat Method (Hodgdon & Beckett)
 */
export function calculateUsNavyBodyFat(
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm: number = 0,
  sex: Sex = 'male'
): number {
  const heightIn = heightCm / 2.54;
  const waistIn = waistCm / 2.54;
  const neckIn = neckCm / 2.54;
  const hipIn = hipCm / 2.54;

  if (sex === 'male') {
    const diff = Math.max(1, waistIn - neckIn);
    const bf = 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
    return Math.max(3, Math.min(60, Number(bf.toFixed(1))));
  } else {
    const sum = Math.max(1, waistIn + (hipIn || waistIn * 1.1) - neckIn);
    const bf = 163.205 * Math.log10(sum) - 97.684 * Math.log10(heightIn) - 78.387;
    return Math.max(8, Math.min(65, Number(bf.toFixed(1))));
  }
}

/**
 * Deurenberg Body Fat Formula (Adults & Children)
 */
export function calculateDeurenbergBodyFat(bmi: number, age: number, sex: Sex): number {
  const sexVal = sex === 'male' ? 1 : 0;
  if (age < 18) {
    // Pediatric Deurenberg equation
    const bf = 1.51 * bmi - 0.70 * age - 3.6 * sexVal + 1.4;
    return Math.max(5, Math.min(55, Number(bf.toFixed(1))));
  }
  // Adult Deurenberg equation
  const bf = 1.20 * bmi + 0.23 * age - 10.8 * sexVal - 5.4;
  return Math.max(4, Math.min(60, Number(bf.toFixed(1))));
}

/**
 * Boer Lean Body Mass (LBM) Formula
 */
export function calculateBoerLbm(weightKg: number, heightCm: number, sex: Sex): number {
  if (sex === 'male') {
    return Math.max(0, 0.407 * weightKg + 0.267 * heightCm - 19.2);
  }
  return Math.max(0, 0.252 * weightKg + 0.473 * heightCm - 48.3);
}

/**
 * James Lean Body Mass Formula
 */
export function calculateJamesLbm(weightKg: number, heightCm: number, sex: Sex): number {
  const ratio = weightKg / (heightCm || 1);
  if (sex === 'male') {
    return Math.max(0, 1.1 * weightKg - 128 * Math.pow(ratio, 2));
  }
  return Math.max(0, 1.07 * weightKg - 148 * Math.pow(ratio, 2));
}

/**
 * Comprehensive Body Composition Analysis Engine
 */
export function analyzeBodyComposition(inputs: BodyCompositionInputs): BodyCompositionResult {
  const {
    weightKg,
    heightCm,
    age = 30,
    sex = 'male',
    waistCm,
    neckCm,
    hipCm,
    measuredBodyFatPct,
    referenceStandard = 'who_standard',
  } = inputs;

  const heightM = Math.max(0.5, heightCm / 100);
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  const isPediatric = age < 18;

  // Standard categorization
  const catInfo = getBmiCategory(bmi, isPediatric ? 'who_standard' : referenceStandard);
  const bmiPrime = Number((bmi / 25).toFixed(2));

  // Reference Normal Weight Range (WHO: 18.5 - 24.9; Asian: 18.5 - 22.9)
  const maxNormalBmi = referenceStandard === 'who_asian' ? 22.9 : 24.9;
  const healthyWeightMinKg = Number((18.5 * heightM * heightM).toFixed(1));
  const healthyWeightMaxKg = Number((maxNormalBmi * heightM * heightM).toFixed(1));

  let weightDeltaToNormalKg = 0;
  if (weightKg > healthyWeightMaxKg) {
    weightDeltaToNormalKg = Number((weightKg - healthyWeightMaxKg).toFixed(1));
  } else if (weightKg < healthyWeightMinKg) {
    weightDeltaToNormalKg = Number((weightKg - healthyWeightMinKg).toFixed(1));
  }

  // Determine Body Fat % and Method
  let bodyFatPct = 0;
  let bodyFatMethod: BodyFatMethod = 'deurenberg';
  let bodyFatMethodName = 'Deurenberg BMI Formula (Estimate)';
  let isMeasured = false;
  let uncertaintyMarginPct = 3.5;

  if (measuredBodyFatPct && measuredBodyFatPct > 0) {
    bodyFatPct = measuredBodyFatPct;
    bodyFatMethod = 'measured';
    bodyFatMethodName = 'User-Provided Direct Measurement (e.g., DEXA / Calipers)';
    isMeasured = true;
    uncertaintyMarginPct = 1.0;
  } else if (waistCm && neckCm && waistCm > 0 && neckCm > 0) {
    bodyFatPct = calculateUsNavyBodyFat(heightCm, waistCm, neckCm, hipCm, sex);
    bodyFatMethod = 'us_navy';
    bodyFatMethodName = 'U.S. Navy Anthropometric Circumference Method (Estimate)';
    uncertaintyMarginPct = 2.5;
  } else {
    bodyFatPct = calculateDeurenbergBodyFat(bmi, age, sex);
    bodyFatMethod = 'deurenberg';
    bodyFatMethodName = 'Deurenberg Age/Sex Regression Model (Estimate)';
    uncertaintyMarginPct = 4.0;
  }

  const fatMassKg = Number(((weightKg * bodyFatPct) / 100).toFixed(1));
  const leanMassKg = Number((weightKg - fatMassKg).toFixed(1));
  const leanMassBoerKg = Number(calculateBoerLbm(weightKg, heightCm, sex).toFixed(1));
  const leanMassJamesKg = Number(calculateJamesLbm(weightKg, heightCm, sex).toFixed(1));

  const bfCat = getBodyFatCategory(bodyFatPct, sex);

  // Waist-to-Height Ratio (WHtR)
  let whtr: number | undefined;
  let whtrCategory: 'Low / Underweight' | 'Healthy / Optimal' | 'Increased Risk' | 'High Risk' | undefined;
  let whtrColor: string | undefined;

  if (waistCm && waistCm > 0) {
    whtr = Number((waistCm / heightCm).toFixed(2));
    if (whtr < 0.40) {
      whtrCategory = 'Low / Underweight';
      whtrColor = '#3A86FF';
    } else if (whtr <= 0.49) {
      whtrCategory = 'Healthy / Optimal';
      whtrColor = '#00875A';
    } else if (whtr <= 0.58) {
      whtrCategory = 'Increased Risk';
      whtrColor = '#FFB84D';
    } else {
      whtrCategory = 'High Risk';
      whtrColor = '#FF5D73';
    }
  }

  // Waist-to-Hip Ratio (WHR)
  let whr: number | undefined;
  let whrCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk' | undefined;
  if (waistCm && hipCm && waistCm > 0 && hipCm > 0) {
    whr = Number((waistCm / hipCm).toFixed(2));
    if (sex === 'male') {
      whrCategory = whr <= 0.90 ? 'Low Risk' : whr <= 0.99 ? 'Moderate Risk' : 'High Risk';
    } else {
      whrCategory = whr <= 0.80 ? 'Low Risk' : whr <= 0.85 ? 'Moderate Risk' : 'High Risk';
    }
  }

  // Cross-Signal Metric Disagreement Engine
  let hasDisagreement = false;
  let disagreementTitle: string | undefined;
  let disagreementExplanation: string | undefined;

  const isBmiOverweight = bmi >= 25.0;
  const isBfHealthy = bfCat.category === 'Athletes' || bfCat.category === 'Fitness' || (sex === 'male' ? bodyFatPct <= 17 : bodyFatPct <= 24);
  const isBmiNormal = bmi >= 18.5 && bmi < 25.0;
  const isBfElevated = bfCat.category === 'Elevated / High';
  const isWhtrElevated = whtr ? whtr >= 0.53 : false;

  if (isBmiOverweight && isBfHealthy) {
    hasDisagreement = true;
    disagreementTitle = 'Elevated BMI with Athletic / Low Body Fat Profile';
    disagreementExplanation =
      'Your BMI falls into the overweight category, but your body fat estimate indicates substantial lean muscle mass rather than excess adiposity. BMI cannot distinguish muscle from fat, which is common in athletes and strength-trained individuals.';
  } else if (isBmiNormal && (isBfElevated || isWhtrElevated)) {
    hasDisagreement = true;
    disagreementTitle = 'Normal BMI with Elevated Abdominal or Body Fat Proportion';
    disagreementExplanation =
      'While your BMI is within the standard healthy range, your waist ratio or body fat estimate indicates a higher proportion of central adiposity. Anthropometric waist metrics provide additional insight into fat distribution that BMI alone cannot detect.';
  }

  return {
    bmi,
    bmiPrime,
    category: catInfo.category,
    categoryColor: catInfo.color,
    referenceStandardName: referenceStandard === 'who_asian' ? 'WHO Asian Population Classification' : 'WHO International Standard',
    isPediatric,
    healthyWeightMinKg,
    healthyWeightMaxKg,
    weightDeltaToNormalKg,
    bodyFatPct,
    bodyFatMethod,
    bodyFatMethodName,
    isMeasured,
    uncertaintyMarginPct,
    fatMassKg,
    leanMassKg,
    leanMassBoerKg,
    leanMassJamesKg,
    bodyFatCategory: bfCat.category,
    bodyFatCategoryColor: bfCat.color,
    whtr,
    whtrCategory,
    whtrColor,
    whr,
    whrCategory,
    hasDisagreement,
    disagreementTitle,
    disagreementExplanation,
    limitations: {
      bmi: 'BMI is a population-level screening metric based solely on total mass and height. It does not measure lean muscle tissue, bone density, or abdominal fat distribution.',
      bodyFat: 'Estimated body fat relies on regression models or circumference algorithms. While more descriptive than BMI, estimates carry model uncertainty (typically ±2% to ±4%) compared to multi-compartment DEXA scans.',
      waist: 'Waist-to-height ratio evaluates central/visceral fat distribution, but measurement technique (breathing state, tape tension) can introduce slight variability.',
    },
  };
}

/**
 * Reverse BMI Solver: Finds weight corresponding to a target BMI
 */
export function solveWeightForTargetBmi(heightCm: number, targetBmi: number): number {
  const heightM = heightCm / 100;
  return Number((targetBmi * heightM * heightM).toFixed(1));
}

/**
 * Generates dynamic sensitivity curve of weight vs BMI
 */
export function generateWeightSensitivityTable(
  baseWeightKg: number,
  heightCm: number,
  stepKg: number = 2.5,
  stepsCount: number = 4
): { weightKg: number; bmi: number; category: string; color: string }[] {
  const heightM = heightCm / 100;
  const rows: { weightKg: number; bmi: number; category: string; color: string }[] = [];

  for (let i = -stepsCount; i <= stepsCount; i++) {
    const wt = Number((baseWeightKg + i * stepKg).toFixed(1));
    if (wt < 20) continue;
    const calcBmi = Number((wt / (heightM * heightM)).toFixed(1));
    const cat = getBmiCategory(calcBmi);
    rows.push({
      weightKg: wt,
      bmi: calcBmi,
      category: cat.category,
      color: cat.color,
    });
  }

  return rows;
}
