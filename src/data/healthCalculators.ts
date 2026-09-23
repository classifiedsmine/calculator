import { CalculatorDefinition } from '../types';
import { calculateBmi } from '../lib/safeMath';

export const HEALTH_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'bmi-body-composition',
    slug: 'bmi-body-composition',
    category: 'health',
    parentCategoryId: 'health',
    parentCategoryName: 'Health, Fitness & Biometrics',
    subCategoryId: 'body-composition',
    subCategoryName: 'Body Composition, BMI & Target Weight',
    title: 'BMI & Body Composition Analyzer',
    tagline: 'World Health Organization (WHO) BMI classification, healthy weight range, and Prime index.',
    description: 'Calculates Body Mass Index (BMI), clinical weight status, Robinson formula ideal body weight, and target weight delta.',
    accentColor: '#35E6A0',
    formulaDisplay: 'BMI = Weight(kg) / [Height(m)]²',
    formulaTokens: [
      { token: 'BMI', label: 'Body Mass Index', description: 'Clinical body mass to height ratio' },
      { token: 'Weight', label: 'Weight (kg)', inputId: 'weight', description: 'Current body mass' },
      { token: 'Height', label: 'Height (cm)', inputId: 'height', description: 'Standing stature' },
    ],
    inputs: [
      { id: 'weight', name: 'Body Weight', type: 'slider', defaultValue: 72, min: 30, max: 200, step: 0.5, unit: 'kg' },
      { id: 'height', name: 'Height', type: 'slider', defaultValue: 175, min: 120, max: 220, step: 1, unit: 'cm' },
      { id: 'age', name: 'Age', type: 'slider', defaultValue: 28, min: 14, max: 90, step: 1, unit: 'yrs' },
    ],
    relatedCalculators: ['bmr-tdee-calculator', 'macro-calorie-split', 'target-heart-rate'],
    faqs: [
      {
        q: 'How is Body Mass Index (BMI) calculated?',
        a: 'BMI is calculated by dividing your body weight in kilograms by the square of your height in meters: BMI = Weight (kg) / [Height (m)]². For imperial units, the formula is: BMI = 703 × Weight (lbs) / [Height (in)]².'
      },
      {
        q: 'What BMI would I have at 70 kg and 170 cm?',
        a: 'At 70 kg and 170 cm (1.70 m), your BMI is 70 / (1.70)² = 24.22 kg/m². Under the standard WHO classification, this falls within the Normal Weight category (18.5 – 24.9).'
      },
      {
        q: 'What weight corresponds to a BMI of 23 at 170 cm?',
        a: 'To achieve a BMI of 23 at 1.70 m, solve: Weight = 23 × (1.70)² = 66.47 kg (approx. 146.5 lbs).'
      },
      {
        q: 'Does BMI directly measure body fat percentage?',
        a: 'No. BMI is a screening ratio of total body mass relative to stature. It does not distinguish between adipose fat tissue, skeletal muscle mass, bone density, or water retention.'
      },
      {
        q: 'Why can my BMI and body-fat percentage tell different stories?',
        a: 'A muscular individual may have a high BMI (>25.0) while maintaining low, healthy body fat (<15%). Conversely, someone with low muscle mass and high abdominal visceral fat may have a normal BMI despite elevated cardiometabolic risk.'
      },
      {
        q: 'Can BMI be misleading for athletes and bodybuilders?',
        a: 'Yes. Because muscle tissue is denser than fat, strength athletes frequently register in the overweight or obese BMI categories despite having exceptional physical conditioning and low visceral fat.'
      },
      {
        q: 'How is estimated body fat calculated from circumferences?',
        a: 'The U.S. Navy Method uses log-transformed differences between waist, neck, and height circumferences to estimate total body density and derive body fat percentage.'
      },
      {
        q: 'What is the difference between fat mass and lean body mass?',
        a: 'Fat mass is the total weight of adipose tissue (essential fat + storage fat). Lean body mass (LBM) comprises all non-fat tissue, including skeletal muscle, organs, bone mineral content, and intracellular water.'
      },
      {
        q: 'Is BMI interpreted differently for children and adolescents?',
        a: 'Yes. For individuals under 18, BMI is evaluated using age- and sex-specific growth percentiles (e.g. CDC/WHO growth curves) rather than fixed adult category cutoffs.'
      }
    ],
    calculate: (inputs) => {
      const wt = Number(inputs.weight) || 72;
      const ht = Number(inputs.height) || 175;
      const age = Number(inputs.age) || 28;

      const res = calculateBmi(wt, ht);
      const htM = ht / 100;
      const bmiPrime = res.bmi / 25; // ratio to upper normal threshold
      const bmr = Math.round(10 * wt + 6.25 * ht - 5 * age + 5);

      const chartData = [
        { label: 'Underweight (<18.5)', threshold: 18.5 },
        { label: 'Normal (18.5-24.9)', threshold: 24.9 },
        { label: 'Overweight (25-29.9)', threshold: 29.9 },
        { label: 'Obese (≥30)', threshold: 35 },
      ];

      return {
        primaryValue: res.bmi,
        primaryFormatted: `${res.bmi}`,
        primaryLabel: `BMI (${res.category})`,
        secondaryMetrics: [
          { label: 'Clinical Weight Status', value: res.category },
          { label: 'Healthy Weight Band', value: res.healthyRange },
          { label: 'BMI Prime Ratio', value: `${bmiPrime.toFixed(2)} (Optimal: 0.74 - 1.00)` },
          { label: 'Basal Metabolic Rate (BMR)', value: `${bmr} kcal/day` },
        ],
        chartData,
        chartSeries: [
          { key: 'threshold', label: 'BMI Categories', color: res.color || '#35E6A0', type: 'bar' },
        ],
      };
    },
  },

  {
    id: 'bmr-tdee-calculator',
    slug: 'bmr-tdee-calculator',
    category: 'health',
    parentCategoryId: 'health',
    parentCategoryName: 'Health, Fitness & Biometrics',
    subCategoryId: 'metabolism-nutrition',
    subCategoryName: 'Caloric Metabolism, BMR & Macro Split',
    title: 'BMR & TDEE Daily Caloric Burn',
    tagline: 'Mifflin-St Jeor Basal Metabolic Rate and Total Daily Energy Expenditure across activity levels.',
    description: 'Calculates baseline BMR metabolic expenditure and TDEE maintenance calories with target deficit/surplus caloric guidelines.',
    accentColor: '#FFB84D',
    formulaDisplay: 'TDEE = BMR × Activity Factor',
    formulaTokens: [
      { token: 'BMR', label: 'Basal Metabolic Rate', description: 'Calories burned at complete rest' },
      { token: 'TDEE', label: 'Total Daily Energy', description: 'Maintenance calories including physical activity' },
    ],
    inputs: [
      { id: 'gender', name: 'Biological Sex', type: 'select', defaultValue: 'male', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
      { id: 'weight', name: 'Weight', type: 'slider', defaultValue: 75, min: 35, max: 200, step: 0.5, unit: 'kg' },
      { id: 'height', name: 'Height', type: 'slider', defaultValue: 178, min: 130, max: 220, step: 1, unit: 'cm' },
      { id: 'age', name: 'Age', type: 'slider', defaultValue: 30, min: 16, max: 85, step: 1, unit: 'yrs' },
      {
        id: 'activity',
        name: 'Activity Multiplier',
        type: 'select',
        defaultValue: 1.375,
        options: [
          { label: 'Sedentary (Desk Job, No Exercise) - 1.2x', value: 1.2 },
          { label: 'Light Exercise (1-3 days/week) - 1.375x', value: 1.375 },
          { label: 'Moderate Exercise (3-5 days/week) - 1.55x', value: 1.55 },
          { label: 'Heavy Athlete (6-7 days/week) - 1.725x', value: 1.725 },
        ],
      },
    ],
    calculate: (inputs) => {
      const isMale = inputs.gender === 'male';
      const wt = Number(inputs.weight) || 75;
      const ht = Number(inputs.height) || 178;
      const age = Number(inputs.age) || 30;
      const act = Number(inputs.activity) || 1.375;

      // Mifflin-St Jeor formula
      let bmr = 10 * wt + 6.25 * ht - 5 * age + (isMale ? 5 : -161);
      bmr = Math.round(bmr);
      const tdee = Math.round(bmr * act);

      const mildDeficit = tdee - 250;
      const weightLoss = tdee - 500;
      const leanBulk = tdee + 300;

      const chartData = [
        { label: 'BMR (Resting)', calories: bmr },
        { label: 'Sedentary (1.2x)', calories: Math.round(bmr * 1.2) },
        { label: 'Your Current TDEE', calories: tdee },
        { label: 'Weight Loss (-500 kcal)', calories: weightLoss },
        { label: 'Muscle Surplus (+300 kcal)', calories: leanBulk },
      ];

      return {
        primaryValue: tdee,
        primaryFormatted: `${tdee.toLocaleString()} kcal/day`,
        primaryLabel: 'Daily Maintenance Calories (TDEE)',
        secondaryMetrics: [
          { label: 'Basal Metabolic Rate (BMR)', value: `${bmr.toLocaleString()} kcal/day` },
          { label: 'Fat Loss Target (-0.5 kg/wk)', value: `${weightLoss.toLocaleString()} kcal/day` },
          { label: 'Mild Cut Target (-0.25 kg/wk)', value: `${mildDeficit.toLocaleString()} kcal/day` },
          { label: 'Lean Bulking Target', value: `${leanBulk.toLocaleString()} kcal/day` },
        ],
        chartData,
        chartSeries: [
          { key: 'calories', label: 'Caloric Targets', color: '#FFB84D', type: 'bar' },
        ],
      };
    },
  },

  {
    id: 'macro-nutrient-split',
    slug: 'macro-nutrient-split',
    category: 'health',
    parentCategoryId: 'health',
    parentCategoryName: 'Health, Fitness & Biometrics',
    subCategoryId: 'metabolism-nutrition',
    subCategoryName: 'Caloric Metabolism, BMR & Macro Split',
    title: 'Macronutrient Split (Carbs, Protein & Fat)',
    tagline: 'Calculate precise daily gram intake of Protein, Carbohydrates, and Fats based on dietary goals.',
    description: 'Converts daily caloric intake into macronutrient gram distributions across Balanced, High-Protein, Low-Carb, or Keto splits.',
    accentColor: '#8B6CFF',
    formulaDisplay: 'Total kcal = (Protein × 4) + (Carbs × 4) + (Fat × 9)',
    formulaTokens: [
      { token: 'Protein', label: 'Protein (4 kcal/g)', inputId: 'proteinPct', description: 'Muscle synthesis and tissue repair' },
      { token: 'Carbs', label: 'Carbs (4 kcal/g)', inputId: 'carbPct', description: 'Primary glycogen energy substrate' },
      { token: 'Fat', label: 'Fat (9 kcal/g)', description: 'Hormonal regulation and lipid absorption' },
    ],
    inputs: [
      { id: 'calories', name: 'Daily Target Calories', type: 'number', defaultValue: 2200, min: 1000, max: 6000, step: 50, unit: 'kcal' },
      {
        id: 'split',
        name: 'Dietary Protocol',
        type: 'select',
        defaultValue: 'high-protein',
        options: [
          { label: 'High Protein / Athletic (40% C / 35% P / 25% F)', value: 'high-protein' },
          { label: 'Balanced Lifestyle (45% C / 25% P / 30% F)', value: 'balanced' },
          { label: 'Low Carb / Cutting (20% C / 45% P / 35% F)', value: 'low-carb' },
          { label: 'Ketogenic (5% C / 25% P / 70% F)', value: 'keto' },
        ],
      },
    ],
    calculate: (inputs) => {
      const kcal = Number(inputs.calories) || 2200;
      const splitType = inputs.split || 'high-protein';

      let carbPct = 0.4;
      let proteinPct = 0.35;
      let fatPct = 0.25;

      if (splitType === 'balanced') {
        carbPct = 0.45;
        proteinPct = 0.25;
        fatPct = 0.3;
      } else if (splitType === 'low-carb') {
        carbPct = 0.2;
        proteinPct = 0.45;
        fatPct = 0.35;
      } else if (splitType === 'keto') {
        carbPct = 0.05;
        proteinPct = 0.25;
        fatPct = 0.7;
      }

      const proteinGrams = Math.round((kcal * proteinPct) / 4);
      const carbGrams = Math.round((kcal * carbPct) / 4);
      const fatGrams = Math.round((kcal * fatPct) / 9);

      const chartData = [
        { label: 'Carbohydrates', grams: carbGrams, calories: Math.round(carbGrams * 4) },
        { label: 'Protein', grams: proteinGrams, calories: Math.round(proteinGrams * 4) },
        { label: 'Healthy Fats', grams: fatGrams, calories: Math.round(fatGrams * 9) },
      ];

      return {
        primaryValue: proteinGrams,
        primaryFormatted: `${proteinGrams}g Protein`,
        primaryLabel: 'Daily Protein Target',
        secondaryMetrics: [
          { label: 'Carbohydrates', value: `${carbGrams}g (${Math.round(carbPct * 100)}% calories)` },
          { label: 'Healthy Fats', value: `${fatGrams}g (${Math.round(fatPct * 100)}% calories)` },
          { label: 'Total Calories', value: `${kcal.toLocaleString()} kcal` },
          { label: 'Selected Protocol', value: splitType.toUpperCase() },
        ],
        chartData,
        chartSeries: [
          { key: 'grams', label: 'Nutrient Mass (g)', color: '#8B6CFF', type: 'bar' },
        ],
      };
    },
  },

  {
    id: 'heart-rate-zones',
    slug: 'heart-rate-zones',
    category: 'health',
    parentCategoryId: 'health',
    parentCategoryName: 'Health, Fitness & Biometrics',
    subCategoryId: 'cardio-vitality',
    subCategoryName: 'Heart Rate Zones, Hydration & Cardio',
    title: 'Target Heart Rate & Karvonen Training Zones',
    tagline: 'Calculate HR max and 5 personalized aerobic/anaerobic cardiovascular training intensity zones.',
    description: 'Applies the Karvonen formula using resting heart rate and maximum heart rate to map precision exercise intensity zones 1 through 5.',
    accentColor: '#FF5D73',
    formulaDisplay: 'Target HR = [(Max HR - Resting HR) × % Intensity] + Resting HR',
    formulaTokens: [
      { token: 'Max HR', label: 'Max HR = 220 - Age', description: 'Theoretical maximum cardiac rate' },
      { token: 'Resting HR', label: 'Resting Pulse (BPM)', inputId: 'restingHr', description: 'Morning baseline heart rate' },
    ],
    inputs: [
      { id: 'age', name: 'Age', type: 'slider', defaultValue: 30, min: 15, max: 85, step: 1, unit: 'yrs' },
      { id: 'restingHr', name: 'Resting Heart Rate', type: 'slider', defaultValue: 62, min: 40, max: 100, step: 1, unit: 'bpm' },
    ],
    calculate: (inputs) => {
      const age = Number(inputs.age) || 30;
      const rhr = Number(inputs.restingHr) || 62;
      const maxHr = 220 - age;
      const hrr = maxHr - rhr; // Heart rate reserve

      const z1 = Math.round(rhr + hrr * 0.55); // Active Recovery (50-60%)
      const z2 = Math.round(rhr + hrr * 0.65); // Aerobic Fat Burn (60-70%)
      const z3 = Math.round(rhr + hrr * 0.75); // Tempo Endurance (70-80%)
      const z4 = Math.round(rhr + hrr * 0.85); // Threshold / Anaerobic (80-90%)
      const z5 = Math.round(rhr + hrr * 0.95); // Neuromuscular Max (90-100%)

      const chartData = [
        { label: 'Zone 1 (Recovery)', bpm: z1 },
        { label: 'Zone 2 (Endurance/Fat Burn)', bpm: z2 },
        { label: 'Zone 3 (Aerobic Tempo)', bpm: z3 },
        { label: 'Zone 4 (Threshold)', bpm: z4 },
        { label: 'Zone 5 (Max Capacity)', bpm: z5 },
      ];

      return {
        primaryValue: maxHr,
        primaryFormatted: `${maxHr} BPM`,
        primaryLabel: 'Estimated Maximum Heart Rate',
        secondaryMetrics: [
          { label: 'Zone 2 (Endurance/Fat Burn)', value: `${z1} - ${z2} BPM` },
          { label: 'Zone 3 (Aerobic Tempo)', value: `${z2} - ${z3} BPM` },
          { label: 'Zone 4 (Anaerobic Threshold)', value: `${z3} - ${z4} BPM` },
          { label: 'Heart Rate Reserve (HRR)', value: `${hrr} BPM` },
        ],
        chartData,
        chartSeries: [
          { key: 'bpm', label: 'Target Pulse Threshold (BPM)', color: '#FF5D73', type: 'line' },
        ],
      };
    },
  },
];
