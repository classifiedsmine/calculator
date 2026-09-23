export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export type CategoryId = 'finance' | 'math' | 'health' | 'science' | 'conversion' | 'statistics';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  useIndianUnits?: boolean; // lakh, crore
}

export type InputType = 'currency' | 'number' | 'percentage' | 'slider' | 'select' | 'toggle';

export interface CalculatorInput {
  id: string;
  name: string;
  token?: string; // Formula symbol (e.g. 'P', 'r', 't')
  description?: string;
  type: InputType;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string | number }[];
}

export interface FormulaToken {
  token: string;
  label: string;
  inputId?: string;
  description: string;
}

export interface ChartDataPoint {
  label: string | number;
  [key: string]: string | number;
}

export interface InsightItem {
  type: 'primary' | 'success' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  color: string;
  inputs: Record<string, number | string | boolean>;
  isCustom?: boolean;
}

export interface CalculatorOutput {
  primaryValue: number;
  primaryFormatted: string;
  primaryLabel: string;
  secondaryMetrics: {
    label: string;
    value: string | number;
    delta?: string;
    sublabel?: string;
  }[];
  chartData: ChartDataPoint[];
  chartSeries: {
    key: string;
    label: string;
    color: string;
    type?: 'area' | 'line' | 'bar';
  }[];
  breakdownTable?: {
    headers: string[];
    rows: (string | number)[][];
  };
  insights?: InsightItem[];
  simulationData?: {
    percentile10: number;
    median: number;
    percentile90: number;
    distribution: { bucket: string; count: number }[];
  };
}

export interface SubCategoryMeta {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string;
  iconName?: string;
}

export interface ParentCategoryMeta {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  accentColor: string;
  subCategories: SubCategoryMeta[];
}

export interface CalculatorDefinition {
  id: string;
  slug: string;
  category: CategoryId;
  parentCategoryId?: string;
  parentCategoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  title: string;
  tagline: string;
  description: string;
  accentColor: string;
  formulaDisplay: string;
  formulaTokens?: FormulaToken[];
  inputs: CalculatorInput[];
  calculate: (inputs: Record<string, any>, currency: CurrencyConfig) => CalculatorOutput;
  generateScenarios?: (baseInputs: Record<string, any>) => ScenarioDefinition[];
  relatedCalculators?: string[];
  faqs?: { q: string; a: string }[];
}

export interface CalculationHistoryItem {
  id: string;
  calculatorId: string;
  calculatorTitle: string;
  category: CategoryId;
  timestamp: number;
  primaryFormatted: string;
  primaryLabel: string;
  inputs: Record<string, any>;
  notes?: string;
}

export interface WorkspaceNode {
  id: string;
  type: 'input' | 'formula' | 'calculator' | 'output' | 'note';
  title: string;
  x: number;
  y: number;
  value: number | string;
  label?: string;
  inputs?: Record<string, any>;
  expression?: string;
  unit?: string;
  connectedTo?: string[]; // Target node IDs
}

export type ActiveTab = 'calculators' | 'workspace' | 'math-studio' | 'history';
