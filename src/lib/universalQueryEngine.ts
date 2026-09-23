import { CalculatorDefinition, CalculatorInput, CalculatorOutput, CurrencyConfig } from '../types';

// ============================================================================
// 1. UNIVERSAL NUMERICAL INVERSE SOLVER (Root Finding on any pure calculate fn)
// ============================================================================

export interface UniversalInverseSolveResult {
  targetInputId: string;
  targetInputName: string;
  solvedValue: number;
  formattedSolvedValue: string;
  achievedOutputValue: number;
  formattedAchievedOutput: string;
  targetOutputValue: number;
  iterations: number;
  isSolvable: boolean;
  unit?: string;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
};

/**
 * Universal Numerical Root-Finder (Bisection + Secant Method)
 * Solves for `targetInputId` such that `calculator.calculate(inputs)` yields `targetOutputValue`.
 */
export function solveUniversalInverse(
  calculator: CalculatorDefinition,
  baseInputs: Record<string, any>,
  targetInputId: string,
  targetOutputValue: number,
  currency?: CurrencyConfig
): UniversalInverseSolveResult {
  const inputDef = calculator.inputs.find((i) => i.id === targetInputId);
  const targetInputName = inputDef ? inputDef.name : targetInputId;
  const activeCurrency = currency || DEFAULT_CURRENCY;

  // Determine realistic search bounds
  let minBound = inputDef?.min !== undefined ? inputDef.min : 0;
  let maxBound = inputDef?.max !== undefined ? inputDef.max : 100000000;

  // If bounds are equal or standard default, expand appropriately
  if (minBound === maxBound) {
    minBound = 0;
    maxBound = 1000000;
  }

  // Ensure reasonable bounds for percentages or small units
  if (inputDef?.type === 'percentage') {
    minBound = Math.max(0, minBound);
    maxBound = Math.min(100, Math.max(50, maxBound));
  }

  const evalAt = (val: number): number => {
    const testInputs = { ...baseInputs, [targetInputId]: val };
    const out = calculator.calculate(testInputs, activeCurrency);
    return out.primaryValue;
  };

  const fMin = evalAt(minBound);
  const fMax = evalAt(maxBound);

  // Check monotonicity direction
  const isAscending = fMax >= fMin;

  let low = minBound;
  let high = maxBound;
  let bestVal = Number(baseInputs[targetInputId]) || (minBound + maxBound) / 2;
  let bestOut = evalAt(bestVal);
  let iterations = 0;
  let isSolvable = true;

  // Bisection loop (up to 40 iterations for high precision)
  while (iterations < 45) {
    const mid = (low + high) / 2;
    const outVal = evalAt(mid);
    const diff = outVal - targetOutputValue;

    if (Math.abs(diff) < 0.01 || Math.abs(high - low) < 0.0001) {
      bestVal = mid;
      bestOut = outVal;
      break;
    }

    if (isAscending) {
      if (outVal < targetOutputValue) {
        low = mid;
      } else {
        high = mid;
      }
    } else {
      if (outVal < targetOutputValue) {
        high = mid;
      } else {
        low = mid;
      }
    }

    bestVal = mid;
    bestOut = outVal;
    iterations++;
  }

  // Formatting solved value
  let formattedSolved = '';
  if (inputDef?.type === 'currency' && currency) {
    formattedSolved = `${currency.symbol}${Math.round(bestVal).toLocaleString()}`;
  } else if (inputDef?.type === 'percentage') {
    formattedSolved = `${(Math.round(bestVal * 100) / 100).toFixed(2)}%`;
  } else {
    formattedSolved = `${(Math.round(bestVal * 100) / 100).toLocaleString()} ${inputDef?.unit || ''}`.trim();
  }

  const roundedOutput = Math.round(bestOut * 100) / 100;
  const targetTolerance = Math.abs(targetOutputValue) * 0.1 || 10;
  if (Math.abs(bestOut - targetOutputValue) > targetTolerance) {
    isSolvable = false;
  }

  return {
    targetInputId,
    targetInputName,
    solvedValue: Math.round(bestVal * 100) / 100,
    formattedSolvedValue: formattedSolved,
    achievedOutputValue: roundedOutput,
    formattedAchievedOutput: roundedOutput.toLocaleString(),
    targetOutputValue,
    iterations,
    isSolvable,
    unit: inputDef?.unit,
  };
}

// ============================================================================
// 2. UNIVERSAL CONSTRAINT MATRIX GENERATOR (Variable 1 vs Solved Variable 2)
// ============================================================================

export interface UniversalConstraintRow {
  var1Label: string;
  var1Value: number;
  solvedVar2Value: number;
  formattedSolvedVar2: string;
  isFeasible: boolean;
}

export function generateUniversalConstraintMatrix(
  calculator: CalculatorDefinition,
  baseInputs: Record<string, any>,
  var1Id: string,
  var2Id: string,
  targetOutputValue: number,
  currency?: CurrencyConfig
): UniversalConstraintRow[] {
  const var1Def = calculator.inputs.find((i) => i.id === var1Id);
  if (!var1Def) return [];

  const baseVar1 = Number(baseInputs[var1Id]) || Number(var1Def.defaultValue) || 10;

  // Generate 6-8 sample stepped values for Var 1
  const steps: number[] = [];
  if (var1Def.type === 'percentage') {
    steps.push(4, 6, 8, 10, 12, 14, 16);
  } else if (var1Def.id.includes('year') || var1Def.id.includes('tenure') || var1Def.id.includes('time') || var1Def.id.includes('duration')) {
    steps.push(5, 10, 15, 20, 25, 30);
  } else {
    const factors = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    factors.forEach((f) => {
      const v = Math.round(baseVar1 * f * 100) / 100;
      if (v > 0 && !steps.includes(v)) steps.push(v);
    });
  }

  return steps.map((v1) => {
    const customInputs = { ...baseInputs, [var1Id]: v1 };
    const res = solveUniversalInverse(calculator, customInputs, var2Id, targetOutputValue, currency);

    let v1Formatted = `${v1} ${var1Def.unit || ''}`.trim();
    if (var1Def.type === 'percentage') v1Formatted = `${v1}%`;
    if (var1Def.type === 'currency' && currency) v1Formatted = `${currency.symbol}${v1.toLocaleString()}`;

    return {
      var1Label: v1Formatted,
      var1Value: v1,
      solvedVar2Value: res.solvedValue,
      formattedSolvedVar2: res.formattedSolvedValue,
      isFeasible: res.isSolvable,
    };
  });
}

// ============================================================================
// 3. UNIVERSAL 2D SENSITIVITY HEATMAP MATRIX
// ============================================================================

export interface UniversalSensitivityCell {
  var1Offset: number;
  var1Val: number;
  var2Offset: number;
  var2Val: number;
  outputVal: number;
  formattedOutput: string;
  diffFromBase: number;
  diffPercent: number;
}

export interface UniversalSensitivityMatrix {
  var1Def: CalculatorInput;
  var2Def: CalculatorInput;
  var1Offsets: number[];
  var2Offsets: number[];
  matrix: UniversalSensitivityCell[][];
  baseOutput: number;
}

export function generateUniversalSensitivityMatrix(
  calculator: CalculatorDefinition,
  currentInputs: Record<string, any>,
  currency?: CurrencyConfig
): UniversalSensitivityMatrix | null {
  const activeCurrency = currency || DEFAULT_CURRENCY;
  // Find top 2 numeric inputs
  const numericInputs = calculator.inputs.filter(
    (i) => i.type === 'number' || i.type === 'currency' || i.type === 'percentage' || i.type === 'slider'
  );

  if (numericInputs.length < 2) return null;

  const var1Def = numericInputs[0];
  const var2Def = numericInputs[1];

  const baseV1 = Number(currentInputs[var1Def.id]) ?? Number(var1Def.defaultValue) ?? 10;
  const baseV2 = Number(currentInputs[var2Def.id]) ?? Number(var2Def.defaultValue) ?? 10;

  const baseOutput = calculator.calculate(currentInputs, activeCurrency).primaryValue;

  // Determine smart offset percentages
  const v1Offsets = [-20, -10, 0, 10, 20];
  const v2Offsets = [-20, -10, 0, 10, 20];

  const matrix: UniversalSensitivityCell[][] = [];

  v2Offsets.forEach((o2) => {
    const row: UniversalSensitivityCell[] = [];
    const v2Val = Math.max(
      var2Def.min ?? 0.01,
      Math.round((baseV2 * (1 + o2 / 100)) * 100) / 100
    );

    v1Offsets.forEach((o1) => {
      const v1Val = Math.max(
        var1Def.min ?? 0.01,
        Math.round((baseV1 * (1 + o1 / 100)) * 100) / 100
      );

      const testInputs = { ...currentInputs, [var1Def.id]: v1Val, [var2Def.id]: v2Val };
      const out = calculator.calculate(testInputs, activeCurrency);
      const diffFromBase = out.primaryValue - baseOutput;
      const diffPercent = baseOutput !== 0 ? (diffFromBase / Math.abs(baseOutput)) * 100 : 0;

      row.push({
        var1Offset: o1,
        var1Val: v1Val,
        var2Offset: o2,
        var2Val: v2Val,
        outputVal: out.primaryValue,
        formattedOutput: out.primaryFormatted || out.primaryValue.toLocaleString(),
        diffFromBase,
        diffPercent: Math.round(diffPercent * 10) / 10,
      });
    });

    matrix.push(row);
  });

  return {
    var1Def,
    var2Def,
    var1Offsets: v1Offsets,
    var2Offsets: v2Offsets,
    matrix,
    baseOutput,
  };
}

// ============================================================================
// 4. UNIVERSAL "WHY DID MY RESULT CHANGE?" DELTA ENGINE
// ============================================================================

export interface UniversalDeltaExplanation {
  primaryCause: string;
  summary: string;
  absoluteDiff: number;
  percentDiff: number;
  bulletPoints: string[];
}

export function generateUniversalDeltaExplanation(
  calculator: CalculatorDefinition,
  prevInputs: Record<string, any>,
  currentInputs: Record<string, any>,
  currency?: CurrencyConfig
): UniversalDeltaExplanation | null {
  const activeCurrency = currency || DEFAULT_CURRENCY;
  const prevOut = calculator.calculate(prevInputs, activeCurrency);
  const curOut = calculator.calculate(currentInputs, activeCurrency);

  const diff = curOut.primaryValue - prevOut.primaryValue;
  if (Math.abs(diff) < 0.0001) return null;

  const percentDiff = prevOut.primaryValue !== 0 ? (diff / Math.abs(prevOut.primaryValue)) * 100 : 0;
  const bullets: string[] = [];
  const modifiedInputs: { name: string; oldVal: any; newVal: any }[] = [];

  calculator.inputs.forEach((input) => {
    const oldVal = prevInputs[input.id];
    const newVal = currentInputs[input.id];
    if (oldVal !== undefined && newVal !== undefined && oldVal !== newVal) {
      modifiedInputs.push({ name: input.name, oldVal, newVal });
      bullets.push(
        `${input.name} changed from ${oldVal}${input.unit ? ` ${input.unit}` : ''} to ${newVal}${input.unit ? ` ${input.unit}` : ''}.`
      );
    }
  });

  if (bullets.length === 0) return null;

  let primaryCause = 'Multiple Inputs Modified';
  if (modifiedInputs.length === 1) {
    primaryCause = `${modifiedInputs[0].name} Adjusted`;
  }

  const isPositive = diff >= 0;
  const formattedDiff = `${isPositive ? '+' : ''}${Math.round(diff * 100) / 100}`;

  return {
    primaryCause,
    summary: `${curOut.primaryLabel || 'Result'} shifted by ${formattedDiff} (${isPositive ? '+' : ''}${percentDiff.toFixed(1)}%) from previous calculation.`,
    absoluteDiff: diff,
    percentDiff: Math.round(percentDiff * 10) / 10,
    bulletPoints: bullets,
  };
}

// ============================================================================
// 5. UNIVERSAL NATURAL LANGUAGE SEARCH-TO-CALCULATION COMPILER
// ============================================================================

export interface ParsedUniversalQuery {
  rawQuery: string;
  confidence: number;
  matchedInputs: Record<string, number | string | boolean>;
  targetDesiredOutput?: number;
  targetDesiredInputId?: string;
  explanation: string;
  inferredAssumptions: string[];
}

export function compileUniversalCalculatorQuery(
  calculator: CalculatorDefinition,
  query: string
): ParsedUniversalQuery | null {
  if (!query || query.trim().length < 2) return null;

  const text = query.toLowerCase();
  const matchedInputs: Record<string, any> = {};
  const assumptions: string[] = [];
  let targetDesiredOutput: number | undefined;
  let targetDesiredInputId: string | undefined;

  // 1. Extract all numbers and standard multipliers
  const numberTokens: { raw: string; num: number; index: number }[] = [];
  const regex = /(?:\$|€|£|₹)?\s*(\d+(?:[,\.]\d+)?)\s*(k|m|million|billion|%|yrs?|years?|months?|kg|lbs?|ft|in|cm)?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    let val = parseFloat(match[1].replace(/,/g, ''));
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    if (unit === 'm' || unit === 'million') val *= 1000000;
    if (unit === 'billion') val *= 1000000000;

    numberTokens.push({
      raw: match[0],
      num: val,
      index: match.index,
    });
  }

  // 2. Map numbers to calculator inputs based on keyword proximity
  calculator.inputs.forEach((input) => {
    const nameKeywords = input.name.toLowerCase().split(/\s+/);
    const idKeywords = input.id.toLowerCase().split(/[_-]/);
    const allKeywords = Array.from(new Set([...nameKeywords, ...idKeywords]));

    for (const token of numberTokens) {
      const surrounding = text.substring(
        Math.max(0, token.index - 25),
        Math.min(text.length, token.index + 25)
      );

      const matchesKeyword = allKeywords.some((kw) => kw.length > 2 && surrounding.includes(kw));
      const matchesType =
        (input.type === 'percentage' && token.raw.includes('%')) ||
        (input.type === 'currency' && (token.raw.includes('$') || token.raw.includes('k') || token.raw.includes('m')));

      if (matchesKeyword || matchesType) {
        matchedInputs[input.id] = token.num;
        break;
      }
    }
  });

  // 3. Detect inverse goal queries (e.g. "reach 1 million", "how to get 25 BMI")
  const goalRegex = /(?:reach|get|target|achieve|have|solve for)\s*(?:\$|€|£|₹)?\s*(\d+(?:[,\.]\d+)?)\s*(k|m|million)?/i;
  const goalMatch = text.match(goalRegex);
  if (goalMatch) {
    let goalVal = parseFloat(goalMatch[1].replace(/,/g, ''));
    if (goalMatch[2]?.toLowerCase() === 'k') goalVal *= 1000;
    if (goalMatch[2]?.toLowerCase() === 'm' || goalMatch[2]?.toLowerCase() === 'million') goalVal *= 1000000;
    targetDesiredOutput = goalVal;
  }

  // Fallback infilling
  if (Object.keys(matchedInputs).length === 0 && numberTokens.length > 0) {
    const numericInputs = calculator.inputs.filter((i) => i.type !== 'select' && i.type !== 'toggle');
    numberTokens.forEach((tok, idx) => {
      if (idx < numericInputs.length) {
        matchedInputs[numericInputs[idx].id] = tok.num;
      }
    });
  }

  if (Object.keys(matchedInputs).length === 0) return null;

  return {
    rawQuery: query,
    confidence: 0.9,
    matchedInputs,
    targetDesiredOutput,
    targetDesiredInputId,
    explanation: `Compiled ${Object.keys(matchedInputs).length} variable(s) directly into ${calculator.title}.`,
    inferredAssumptions: assumptions,
  };
}

// ============================================================================
// 6. QUESTION LADDER SYNTHESIZER FOR ANY CALCULATOR
// ============================================================================

export interface UniversalQuestionLadderItem {
  question: string;
  tag: string;
  applyInputs: Record<string, any>;
}

export function generateUniversalQuestionLadder(
  calculator: CalculatorDefinition,
  currentInputs: Record<string, any>
): UniversalQuestionLadderItem[] {
  const numericInputs = calculator.inputs.filter(
    (i) => i.type === 'number' || i.type === 'currency' || i.type === 'percentage' || i.type === 'slider'
  );

  const ladder: UniversalQuestionLadderItem[] = [];

  numericInputs.forEach((input) => {
    const currentVal = Number(currentInputs[input.id]) ?? Number(input.defaultValue) ?? 10;
    if (ladder.length >= 6) return;

    if (input.type === 'percentage') {
      ladder.push({
        question: `What if ${input.name} increases to ${(currentVal + 2).toFixed(1)}%?`,
        tag: 'Rate Drift',
        applyInputs: { [input.id]: currentVal + 2 },
      });
      ladder.push({
        question: `What if ${input.name} is reduced to ${Math.max(0.1, currentVal - 1).toFixed(1)}%?`,
        tag: 'Conservative',
        applyInputs: { [input.id]: Math.max(0.1, currentVal - 1) },
      });
    } else {
      const stepUp = Math.round(currentVal * 1.25);
      const stepDown = Math.round(currentVal * 0.75);

      ladder.push({
        question: `What if ${input.name} increases by +25% (${stepUp.toLocaleString()})?`,
        tag: 'Scale Up',
        applyInputs: { [input.id]: stepUp },
      });

      if (stepDown > (input.min ?? 0)) {
        ladder.push({
          question: `What if ${input.name} is reduced by 25% (${stepDown.toLocaleString()})?`,
          tag: 'Stress Test',
          applyInputs: { [input.id]: stepDown },
        });
      }
    }
  });

  return ladder.slice(0, 6);
}

// ============================================================================
// 7. UNIVERSAL FINGERPRINT GENERATOR
// ============================================================================

export function generateUniversalFingerprint(
  calculatorId: string,
  inputs: Record<string, any>
): { hash: string; version: string; timestamp: number } {
  const entries = Object.entries(inputs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');

  const rawKey = `${calculatorId}::${entries}`;
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }

  return {
    hash: `calc_${Math.abs(hash).toString(36)}`,
    version: 'universal-calc-os-v3.0',
    timestamp: Date.now(),
  };
}
