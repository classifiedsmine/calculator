import { CalculatorDefinition } from '../types';

export const MATH_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'quadratic-equation-solver',
    slug: 'quadratic-equation-solver',
    category: 'math',
    parentCategoryId: 'math',
    parentCategoryName: 'Mathematics & Statistics',
    subCategoryId: 'algebra',
    subCategoryName: 'Algebra & Quadratic Equations',
    title: 'Quadratic Equation Solver & Roots',
    tagline: 'Solve ax² + bx + c = 0 with discriminant analysis, vertex coordinates, and step-by-step curve mapping.',
    description: 'Computes real or complex roots of any quadratic polynomial using the quadratic formula with parabolic vertex and discriminant analysis.',
    accentColor: '#29D8FF',
    formulaDisplay: 'x = [-b ± √(b² - 4ac)] / 2a',
    formulaTokens: [
      { token: 'a', label: 'Coefficient a', inputId: 'a', description: 'Leading quadratic coefficient (a ≠ 0)' },
      { token: 'b', label: 'Coefficient b', inputId: 'b', description: 'Linear coefficient' },
      { token: 'c', label: 'Constant c', inputId: 'c', description: 'Constant term' },
    ],
    inputs: [
      { id: 'a', name: 'Coefficient (a)', type: 'number', defaultValue: 1, min: -100, max: 100, step: 0.5 },
      { id: 'b', name: 'Coefficient (b)', type: 'number', defaultValue: -5, min: -100, max: 100, step: 0.5 },
      { id: 'c', name: 'Constant (c)', type: 'number', defaultValue: 6, min: -100, max: 100, step: 0.5 },
    ],
    calculate: (inputs) => {
      const a = Number(inputs.a) || 1;
      const b = Number(inputs.b) || 0;
      const c = Number(inputs.c) || 0;

      const discriminant = b * b - 4 * a * c;
      const vertexX = -b / (2 * a);
      const vertexY = a * vertexX * vertexX + b * vertexX + c;

      let rootsText = '';
      let r1 = 0;
      let r2 = 0;

      if (discriminant > 0) {
        r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        rootsText = `x₁ = ${r1.toFixed(3)}, x₂ = ${r2.toFixed(3)}`;
      } else if (discriminant === 0) {
        r1 = -b / (2 * a);
        rootsText = `x = ${r1.toFixed(3)} (Double Root)`;
      } else {
        const realPart = (-b / (2 * a)).toFixed(3);
        const imagPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(3);
        rootsText = `${realPart} ± ${imagPart}i (Complex)`;
      }

      // Parabolic chart points
      const chartData = [];
      const span = 6;
      for (let x = Math.floor(vertexX - span); x <= Math.ceil(vertexX + span); x += 0.5) {
        const y = a * x * x + b * x + c;
        chartData.push({
          label: `${x}`,
          y: Math.round(y * 100) / 100,
          zero: 0,
        });
      }

      return {
        primaryValue: r1,
        primaryFormatted: rootsText,
        primaryLabel: 'Equation Roots (Solutions)',
        secondaryMetrics: [
          { label: 'Discriminant (Δ = b² - 4ac)', value: discriminant.toFixed(2), delta: discriminant >= 0 ? 'Real Roots' : 'Complex Roots' },
          { label: 'Parabolic Vertex', value: `(${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})` },
          { label: 'Parabola Orientation', value: a > 0 ? 'Opens Upwards (Min)' : 'Opens Downwards (Max)' },
          { label: 'Y-Intercept', value: `(0, ${c})` },
        ],
        chartData,
        chartSeries: [
          { key: 'y', label: 'f(x) = ax² + bx + c', color: '#29D8FF', type: 'line' },
          { key: 'zero', label: 'y = 0 Axis', color: '#667085', type: 'line' },
        ],
      };
    },
  },

  {
    id: 'percentage-change-calculator',
    slug: 'percentage-change-calculator',
    category: 'math',
    parentCategoryId: 'math',
    parentCategoryName: 'Mathematics & Statistics',
    subCategoryId: 'arithmetic-ratios',
    subCategoryName: 'Percentage, Fractions & Proportions',
    title: 'Percentage Increase, Decrease & Difference',
    tagline: 'Calculate percentage growth, margin vs markup, absolute difference, and relative fractional change.',
    description: 'Determines percentage increase, decrease, relative change, and profit markup across any initial and final values.',
    accentColor: '#35E6A0',
    formulaDisplay: '% Change = [(V₂ - V₁) / |V₁|] × 100',
    formulaTokens: [
      { token: 'V₁', label: 'Initial Value', inputId: 'initialValue', description: 'Starting quantity' },
      { token: 'V₂', label: 'Final Value', inputId: 'finalValue', description: 'Ending quantity' },
    ],
    inputs: [
      { id: 'initialValue', name: 'Initial Value (V₁)', type: 'number', defaultValue: 150, min: 0.01, max: 1000000, step: 1 },
      { id: 'finalValue', name: 'Final Value (V₂)', type: 'number', defaultValue: 225, min: 0.01, max: 1000000, step: 1 },
    ],
    calculate: (inputs) => {
      const v1 = Number(inputs.initialValue) || 1;
      const v2 = Number(inputs.finalValue) || 1;

      const diff = v2 - v1;
      const pctChange = (diff / Math.abs(v1)) * 100;
      const multiplier = v2 / v1;
      const margin = (diff / v2) * 100;

      const chartData = [
        { label: 'Initial (V₁)', value: v1 },
        { label: 'Absolute Change (Δ)', value: Math.abs(diff) },
        { label: 'Final (V₂)', value: v2 },
      ];

      return {
        primaryValue: pctChange,
        primaryFormatted: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`,
        primaryLabel: pctChange >= 0 ? 'Percentage Increase' : 'Percentage Decrease',
        secondaryMetrics: [
          { label: 'Absolute Difference (Δ)', value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}` },
          { label: 'Growth Multiplier', value: `${multiplier.toFixed(3)}x` },
          { label: 'Profit Margin (on Final)', value: `${margin.toFixed(2)}%` },
          { label: 'Ratio (V₁ : V₂)', value: `1 : ${multiplier.toFixed(2)}` },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Values Comparison', color: pctChange >= 0 ? '#35E6A0' : '#FF5D73', type: 'bar' },
        ],
      };
    },
  },

  {
    id: 'pythagorean-triangle-solver',
    slug: 'pythagorean-triangle-solver',
    category: 'math',
    parentCategoryId: 'math',
    parentCategoryName: 'Mathematics & Statistics',
    subCategoryId: 'geometry-trig',
    subCategoryName: 'Geometry, Shapes & Trigonometry',
    title: 'Pythagorean Theorem & Right Triangle Solver',
    tagline: 'Compute hypotenuse, side lengths, interior angles, perimeter, and area with trigonometric precision.',
    description: 'Applies a² + b² = c² to calculate unknown sides, hypotenuse, trigonometric sine/cosine/tangent ratios, and area.',
    accentColor: '#FFB84D',
    formulaDisplay: 'c = √(a² + b²), Area = ½ × a × b',
    formulaTokens: [
      { token: 'a', label: 'Leg Side a', inputId: 'sideA', description: 'First perpendicular side length' },
      { token: 'b', label: 'Leg Side b', inputId: 'sideB', description: 'Second perpendicular side length' },
      { token: 'c', label: 'Hypotenuse c', description: 'Longest opposite side' },
    ],
    inputs: [
      { id: 'sideA', name: 'Side (a)', type: 'number', defaultValue: 6, min: 0.1, max: 1000, step: 0.5, unit: 'units' },
      { id: 'sideB', name: 'Side (b)', type: 'number', defaultValue: 8, min: 0.1, max: 1000, step: 0.5, unit: 'units' },
    ],
    calculate: (inputs) => {
      const a = Number(inputs.sideA) || 3;
      const b = Number(inputs.sideB) || 4;

      const c = Math.sqrt(a * a + b * b);
      const area = 0.5 * a * b;
      const perimeter = a + b + c;

      const angleARad = Math.atan(a / b);
      const angleADeg = (angleARad * 180) / Math.PI;
      const angleBDeg = 90 - angleADeg;

      const chartData = [
        { label: 'Side a', length: a },
        { label: 'Side b', length: b },
        { label: 'Hypotenuse c', length: Math.round(c * 100) / 100 },
        { label: 'Perimeter', length: Math.round(perimeter * 100) / 100 },
      ];

      return {
        primaryValue: c,
        primaryFormatted: `${c.toFixed(3)} units`,
        primaryLabel: 'Hypotenuse (c)',
        secondaryMetrics: [
          { label: 'Triangle Area', value: `${area.toFixed(2)} sq units` },
          { label: 'Perimeter', value: `${perimeter.toFixed(2)} units` },
          { label: 'Angle α (opp a)', value: `${angleADeg.toFixed(1)}°` },
          { label: 'Angle β (opp b)', value: `${angleBDeg.toFixed(1)}°` },
        ],
        chartData,
        chartSeries: [
          { key: 'length', label: 'Geometric Dimensions', color: '#FFB84D', type: 'bar' },
        ],
      };
    },
  },

  {
    id: 'statistics-standard-deviation',
    slug: 'statistics-standard-deviation',
    category: 'math',
    parentCategoryId: 'math',
    parentCategoryName: 'Mathematics & Statistics',
    subCategoryId: 'statistics-prob',
    subCategoryName: 'Statistics, Probability & Distributions',
    title: 'Standard Deviation, Variance & Mean',
    tagline: 'Calculate sample and population standard deviation, variance, mean, median, range, and standard error.',
    description: 'Computes comprehensive descriptive statistics including sample variance (s²), population standard deviation (σ), and mean error.',
    accentColor: '#6948FF',
    formulaDisplay: 'σ = √[Σ(xᵢ - μ)² / N], s = √[Σ(xᵢ - x̄)² / (n - 1)]',
    formulaTokens: [
      { token: 'σ', label: 'Pop. Std Dev', description: 'Square root of population variance' },
      { token: 's', label: 'Sample Std Dev', description: 'Bessel-corrected sample standard deviation' },
      { token: 'μ', label: 'Mean', description: 'Arithmetic average of dataset' },
    ],
    inputs: [
      { id: 'v1', name: 'Value 1', type: 'number', defaultValue: 12, min: -1000, max: 1000, step: 1 },
      { id: 'v2', name: 'Value 2', type: 'number', defaultValue: 18, min: -1000, max: 1000, step: 1 },
      { id: 'v3', name: 'Value 3', type: 'number', defaultValue: 25, min: -1000, max: 1000, step: 1 },
      { id: 'v4', name: 'Value 4', type: 'number', defaultValue: 32, min: -1000, max: 1000, step: 1 },
      { id: 'v5', name: 'Value 5', type: 'number', defaultValue: 44, min: -1000, max: 1000, step: 1 },
    ],
    calculate: (inputs) => {
      const vals = [
        Number(inputs.v1) || 0,
        Number(inputs.v2) || 0,
        Number(inputs.v3) || 0,
        Number(inputs.v4) || 0,
        Number(inputs.v5) || 0,
      ];

      const n = vals.length;
      const sum = vals.reduce((a, b) => a + b, 0);
      const mean = sum / n;

      const sqDiffs = vals.map((x) => Math.pow(x - mean, 2));
      const popVariance = sqDiffs.reduce((a, b) => a + b, 0) / n;
      const sampleVariance = sqDiffs.reduce((a, b) => a + b, 0) / (n - 1);

      const popStdDev = Math.sqrt(popVariance);
      const sampleStdDev = Math.sqrt(sampleVariance);
      const stdError = sampleStdDev / Math.sqrt(n);

      const sorted = [...vals].sort((a, b) => a - b);
      const median = sorted[Math.floor(n / 2)];
      const range = sorted[n - 1] - sorted[0];

      const chartData = vals.map((val, idx) => ({
        label: `x${idx + 1}`,
        value: val,
        mean: Math.round(mean * 100) / 100,
      }));

      return {
        primaryValue: sampleStdDev,
        primaryFormatted: `s = ${sampleStdDev.toFixed(3)}`,
        primaryLabel: 'Sample Standard Deviation (s)',
        secondaryMetrics: [
          { label: 'Arithmetic Mean (x̄)', value: mean.toFixed(2) },
          { label: 'Sample Variance (s²)', value: sampleVariance.toFixed(2) },
          { label: 'Population Std Dev (σ)', value: popStdDev.toFixed(3) },
          { label: 'Median & Range', value: `${median} (Range: ${range})` },
          { label: 'Standard Error (SE)', value: stdError.toFixed(3) },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Data Points', color: '#6948FF', type: 'bar' },
          { key: 'mean', label: 'Mean Level', color: '#35E6A0', type: 'line' },
        ],
      };
    },
  },

  {
    id: 'permutations-combinations',
    slug: 'permutations-combinations',
    category: 'math',
    parentCategoryId: 'math',
    parentCategoryName: 'Mathematics & Statistics',
    subCategoryId: 'statistics-prob',
    subCategoryName: 'Statistics, Probability & Distributions',
    title: 'Permutations & Combinations (nPr & nCr)',
    tagline: 'Calculate combinations nCr (order does not matter) and permutations nPr (order matters) with factorials.',
    description: 'Solves combinatorics counting problems evaluating combinations nCr and ordered permutations nPr from set size n.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'nCr = n! / [r!(n - r)!],  nPr = n! / (n - r)!',
    formulaTokens: [
      { token: 'n', label: 'Total Items (n)', inputId: 'totalN', description: 'Total number of elements in collection' },
      { token: 'r', label: 'Chosen Items (r)', inputId: 'chosenR', description: 'Number of elements to select' },
    ],
    inputs: [
      { id: 'totalN', name: 'Total Items (n)', type: 'slider', defaultValue: 10, min: 1, max: 25, step: 1 },
      { id: 'chosenR', name: 'Chosen Items (r)', type: 'slider', defaultValue: 3, min: 0, max: 25, step: 1 },
    ],
    calculate: (inputs) => {
      let n = Math.round(Number(inputs.totalN) || 10);
      let r = Math.round(Number(inputs.chosenR) || 3);
      if (r > n) r = n;

      const fact = (num: number): number => {
        let res = 1;
        for (let i = 2; i <= num; i++) res *= i;
        return res;
      };

      const nCr = fact(n) / (fact(r) * fact(n - r));
      const nPr = fact(n) / fact(n - r);

      const chartData = [];
      for (let k = 0; k <= n; k++) {
        const combK = fact(n) / (fact(k) * fact(n - k));
        chartData.push({
          label: `r=${k}`,
          combinations: combK,
        });
      }

      return {
        primaryValue: nCr,
        primaryFormatted: `${nCr.toLocaleString()} ways`,
        primaryLabel: `Combinations C(${n}, ${r})`,
        secondaryMetrics: [
          { label: `Permutations P(${n}, ${r})`, value: `${nPr.toLocaleString()} ways` },
          { label: `Total Subset Combinations (2ⁿ)`, value: Math.pow(2, n).toLocaleString() },
          { label: `Factorial n! (${n}!)`, value: fact(n).toLocaleString() },
          { label: `Factorial r! (${r}!)`, value: fact(r).toLocaleString() },
        ],
        chartData,
        chartSeries: [
          { key: 'combinations', label: `Binomial Distribution C(${n}, r)`, color: '#8B6CFF', type: 'bar' },
        ],
      };
    },
  },
];
