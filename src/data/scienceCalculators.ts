import { CalculatorDefinition } from '../types';

export const SCIENCE_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'kinematics-motion-calculator',
    slug: 'kinematics-motion-calculator',
    category: 'science',
    parentCategoryId: 'science',
    parentCategoryName: 'Science, Physics & Conversions',
    subCategoryId: 'physics-mechanics',
    subCategoryName: 'Classical Mechanics, Force & Energy',
    title: 'Kinematics & Projectile Motion Physics',
    tagline: 'Solve velocity, uniform acceleration, displacement, and trajectory time.',
    description: 'Applies classical equations of uniform acceleration motion (SUVAT) to calculate final velocity, travel distance, and time curves.',
    accentColor: '#FFB84D',
    formulaDisplay: 'v = u + at,  s = ut + ½at²,  v² = u² + 2as',
    formulaTokens: [
      { token: 'u', label: 'Initial Velocity (m/s)', inputId: 'initialVelocity', description: 'Starting speed' },
      { token: 'a', label: 'Acceleration (m/s²)', inputId: 'acceleration', description: 'Rate of velocity change' },
      { token: 't', label: 'Time Elapsed (s)', inputId: 'time', description: 'Duration of motion' },
    ],
    inputs: [
      { id: 'initialVelocity', name: 'Initial Velocity (u)', type: 'number', defaultValue: 10, min: 0, max: 1000, step: 1, unit: 'm/s' },
      { id: 'acceleration', name: 'Acceleration (a)', type: 'number', defaultValue: 9.8, min: -100, max: 100, step: 0.1, unit: 'm/s²' },
      { id: 'time', name: 'Time (t)', type: 'slider', defaultValue: 5, min: 0.5, max: 60, step: 0.5, unit: 'sec' },
    ],
    calculate: (inputs) => {
      const u = Number(inputs.initialVelocity) || 0;
      const a = Number(inputs.acceleration) || 0;
      const t = Number(inputs.time) || 1;

      const v = u + a * t;
      const s = u * t + 0.5 * a * t * t;
      const avgVelocity = (u + v) / 2;

      const chartData = [];
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const currT = (t / steps) * i;
        const currV = u + a * currT;
        const currS = u * currT + 0.5 * a * currT * currT;
        chartData.push({
          label: `${currT.toFixed(1)}s`,
          velocity: Math.round(currV * 100) / 100,
          displacement: Math.round(currS * 100) / 100,
        });
      }

      return {
        primaryValue: s,
        primaryFormatted: `${s.toFixed(2)} meters`,
        primaryLabel: 'Total Displacement (s)',
        secondaryMetrics: [
          { label: 'Final Velocity (v)', value: `${v.toFixed(2)} m/s (${(v * 3.6).toFixed(1)} km/h)` },
          { label: 'Average Velocity', value: `${avgVelocity.toFixed(2)} m/s` },
          { label: 'Initial Velocity (u)', value: `${u.toFixed(2)} m/s` },
          { label: 'Acceleration (a)', value: `${a.toFixed(2)} m/s²` },
        ],
        chartData,
        chartSeries: [
          { key: 'displacement', label: 'Displacement (m)', color: '#FFB84D', type: 'line' },
          { key: 'velocity', label: 'Velocity (m/s)', color: '#29D8FF', type: 'line' },
        ],
      };
    },
  },

  {
    id: 'temperature-unit-converter',
    slug: 'temperature-unit-converter',
    category: 'conversion',
    parentCategoryId: 'science',
    parentCategoryName: 'Science, Physics & Conversions',
    subCategoryId: 'unit-converters',
    subCategoryName: 'Universal Unit & Measure Converters',
    title: 'Temperature Converter (°C, °F & Kelvin)',
    tagline: 'Simultaneous thermal scale conversion between Celsius, Fahrenheit, Kelvin, and Rankine.',
    description: 'Instantaneous multi-scale temperature conversions with absolute zero thermodynamic reference baselines.',
    accentColor: '#35E6A0',
    formulaDisplay: '°F = (°C × 9/5) + 32,  K = °C + 273.15',
    formulaTokens: [
      { token: '°C', label: 'Celsius Scale', inputId: 'celsius', description: 'Metric water freezing/boiling baseline' },
      { token: '°F', label: 'Fahrenheit Scale', description: 'Imperial thermodynamic scale' },
      { token: 'K', label: 'Kelvin', description: 'Absolute thermodynamic temperature' },
    ],
    inputs: [
      { id: 'celsius', name: 'Input Celsius (°C)', type: 'slider', defaultValue: 25, min: -100, max: 200, step: 0.5, unit: '°C' },
    ],
    calculate: (inputs) => {
      const c = Number(inputs.celsius) || 0;
      const f = (c * 9) / 5 + 32;
      const k = c + 273.15;
      const rankine = ((c + 273.15) * 9) / 5;

      const chartData = [
        { label: 'Celsius (°C)', value: c },
        { label: 'Fahrenheit (°F)', value: Math.round(f * 10) / 10 },
        { label: 'Kelvin (K)', value: Math.round(k * 10) / 10 },
      ];

      return {
        primaryValue: f,
        primaryFormatted: `${f.toFixed(1)}°F`,
        primaryLabel: 'Fahrenheit Equivalent',
        secondaryMetrics: [
          { label: 'Celsius (°C)', value: `${c.toFixed(1)}°C` },
          { label: 'Kelvin Absolute (K)', value: `${k.toFixed(2)} K` },
          { label: 'Rankine (°R)', value: `${rankine.toFixed(2)}°R` },
          { label: 'Water Status', value: c < 0 ? 'Solid Ice' : c >= 100 ? 'Steam Vapor' : 'Liquid' },
        ],
        chartData,
        chartSeries: [
          { key: 'value', label: 'Temperature Scale Value', color: '#35E6A0', type: 'bar' },
        ],
      };
    },
  },
];
