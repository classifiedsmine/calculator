import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Activity,
  Heart,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  Target,
  Scale,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserCheck,
  Clock,
  Layers,
  CheckCircle2,
  Sliders,
  Share2,
} from 'lucide-react';
import { CurrencyConfig } from '../../types';
import { formatNumber } from '../../lib/formatters';
import {
  analyzeBodyComposition,
  solveWeightForTargetBmi,
  generateWeightSensitivityTable,
  getBmiCategory,
  Sex,
  ReferenceStandard,
  BodyCompositionResult,
} from '../../lib/bodyCompositionEngine';

interface BodyCompositionOSProps {
  currency: CurrencyConfig;
  theme?: 'dark' | 'light';
  currentInputs?: {
    weight?: number;
    height?: number;
    age?: number;
    sex?: string;
    waist?: number;
    neck?: number;
    hip?: number;
  };
  onApplyInputs?: (inputs: Record<string, any>) => void;
}

export const BodyCompositionOS: React.FC<BodyCompositionOSProps> = ({
  currency,
  theme = 'light',
  currentInputs,
  onApplyInputs,
}) => {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-black/10 text-[#11131A] shadow-xs' : 'bg-[#0C101A] border-white/[0.08] text-[#F7F8FC] shadow-xl';
  const cardSubtleBg = isLight ? 'bg-[#F8FAFC] border-black/5' : 'bg-[#111725] border-white/[0.05]';
  const headingColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textBody = isLight ? 'text-[#475467]' : 'text-[#9AA3B5]';
  const textMuted = isLight ? 'text-[#667085]' : 'text-[#5F6878]';

  // Unit Mode (Metric vs Imperial)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Core Inputs
  const [weightKg, setWeightKg] = useState<number>(currentInputs?.weight || 74);
  const [heightCm, setHeightCm] = useState<number>(currentInputs?.height || 176);
  const [age, setAge] = useState<number>(currentInputs?.age || 32);
  const [sex, setSex] = useState<Sex>((currentInputs?.sex as Sex) || 'male');
  const [referenceStandard, setReferenceStandard] = useState<ReferenceStandard>('who_standard');

  // Progressive Disclosure Extra Anthropometrics
  const [waistCm, setWaistCm] = useState<number>(84);
  const [neckCm, setNeckCm] = useState<number>(38);
  const [hipCm, setHipCm] = useState<number>(98);
  const [useMeasuredBodyFat, setUseMeasuredBodyFat] = useState<boolean>(false);
  const [measuredBodyFatPct, setMeasuredBodyFatPct] = useState<number>(18.0);

  // Solvers & Simulators State
  const [reverseTargetBmi, setReverseTargetBmi] = useState<number>(22.5);
  const [activeTab, setActiveTab] = useState<'composition' | 'reverse' | 'sensitivity' | 'comparator' | 'methodology'>('composition');

  // Comparator Timepoints (Month A vs Month B)
  const [compMonthA, setCompMonthA] = useState({ weight: 78, waist: 88, bf: 22 });
  const [compMonthB, setCompMonthB] = useState({ weight: 73, waist: 82, bf: 17 });

  // Main Calculation Engine Call
  const analysis: BodyCompositionResult = useMemo(() => {
    return analyzeBodyComposition({
      weightKg,
      heightCm,
      age,
      sex,
      waistCm: waistCm > 0 ? waistCm : undefined,
      neckCm: neckCm > 0 ? neckCm : undefined,
      hipCm: sex === 'female' && hipCm > 0 ? hipCm : undefined,
      measuredBodyFatPct: useMeasuredBodyFat ? measuredBodyFatPct : undefined,
      referenceStandard,
    });
  }, [weightKg, heightCm, age, sex, waistCm, neckCm, hipCm, useMeasuredBodyFat, measuredBodyFatPct, referenceStandard]);

  // Reverse Solver Target Weight
  const solvedWeight = useMemo(() => {
    return solveWeightForTargetBmi(heightCm, reverseTargetBmi);
  }, [heightCm, reverseTargetBmi]);

  // Weight Sensitivity Matrix
  const sensitivityRows = useMemo(() => {
    return generateWeightSensitivityTable(weightKg, heightCm, 2.5, 4);
  }, [weightKg, heightCm]);

  // Body Composition Bar Chart Data
  const compositionBarData = useMemo(() => {
    return [
      {
        name: 'Mass Breakdown',
        leanMass: analysis.leanMassKg,
        fatMass: analysis.fatMassKg,
      },
    ];
  }, [analysis]);

  return (
    <div className="space-y-8 my-10" id="body-composition-os-root">
      
      {/* 1. Top Positioning & System Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0]">
                <Scale className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#00875A] dark:text-[#35E6A0]">
                BODY COMPOSITION INTERPRETATION ENGINE
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${headingColor}`}>
              BMI & Multi-Signal Body Composition Analyzer
            </h2>
            <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${textBody}`}>
              BMI is a screening metric based on total mass and stature. This engine separates BMI from body fat percentage, lean muscle mass, and waist-to-height distribution to provide complete anthropometric context.
            </p>
          </div>

          {/* Unit Toggle & Reference Standard Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`p-1 rounded-xl border flex text-xs font-mono ${cardSubtleBg}`}>
              <button
                onClick={() => setUnitSystem('metric')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  unitSystem === 'metric' ? 'bg-[#00875A] text-white font-bold' : textMuted
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  unitSystem === 'imperial' ? 'bg-[#00875A] text-white font-bold' : textMuted
                }`}
              >
                Imperial (lb/in)
              </button>
            </div>

            <select
              value={referenceStandard}
              onChange={(e) => setReferenceStandard(e.target.value as ReferenceStandard)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer ${cardSubtleBg} ${headingColor}`}
            >
              <option value="who_standard">WHO Standard (18.5–24.9)</option>
              <option value="who_asian">WHO Asian Population (18.5–22.9)</option>
            </select>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-black/5 dark:border-white/5 text-xs font-mono">
          <div className={`p-3 rounded-2xl border ${cardSubtleBg}`}>
            <span className="text-neutral-500 block text-[10px]">BMI CLASSIFICATION</span>
            <span className="font-bold text-base" style={{ color: analysis.categoryColor }}>
              {analysis.bmi} ({analysis.category})
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${cardSubtleBg}`}>
            <span className="text-neutral-500 block text-[10px]">ESTIMATED BODY FAT</span>
            <span className="font-bold text-base text-[#6948FF] dark:text-[#8B6CFF]">
              {analysis.bodyFatPct}% ({analysis.bodyFatCategory})
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${cardSubtleBg}`}>
            <span className="text-neutral-500 block text-[10px]">LEAN BODY MASS</span>
            <span className="font-bold text-base text-[#00875A] dark:text-[#35E6A0]">
              {analysis.leanMassKg} kg ({(100 - analysis.bodyFatPct).toFixed(1)}%)
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${cardSubtleBg}`}>
            <span className="text-neutral-500 block text-[10px]">WAIST-TO-HEIGHT (WHtR)</span>
            <span className="font-bold text-base" style={{ color: analysis.whtrColor || '#00875A' }}>
              {analysis.whtr || '0.48'} ({analysis.whtrCategory || 'Optimal'})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Left Controls (Progressive Disclosure) & Right Multi-Signal Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Progressive Anthropometric Inputs */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${headingColor}`}>
              Anthropometric Inputs
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500">
              Step-by-Step
            </span>
          </div>

          {/* Step 1: Core Stature & Mass */}
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between font-bold text-neutral-500 text-[11px]">
              <span>STEP 1: HEIGHT & WEIGHT</span>
              <span className="text-[#00875A]">Required</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className={textMuted}>Body Weight</span>
                <span className={`font-bold ${headingColor}`}>
                  {unitSystem === 'metric' ? `${weightKg} kg` : `${(weightKg * 2.20462).toFixed(1)} lbs`}
                </span>
              </div>
              <input
                type="range"
                min={35}
                max={180}
                step={0.5}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-[#00875A]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className={textMuted}>Standing Height</span>
                <span className={`font-bold ${headingColor}`}>
                  {unitSystem === 'metric' ? `${heightCm} cm` : `${Math.floor(heightCm / 30.48)}' ${Math.round((heightCm % 30.48) / 2.54)}"`}
                </span>
              </div>
              <input
                type="range"
                min={130}
                max={220}
                step={1}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-[#00875A]"
              />
            </div>
          </div>

          {/* Step 2: Demographics & Sex */}
          <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5 text-xs font-mono">
            <div className="flex items-center justify-between font-bold text-neutral-500 text-[11px]">
              <span>STEP 2: DEMOGRAPHICS</span>
              <span className="text-[#6948FF]">For Body Fat & BMR</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${textMuted}`}>Age (Years)</label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                    isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${textMuted}`}>Biological Sex</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSex('male')}
                    className={`flex-1 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      sex === 'male'
                        ? 'bg-[#00875A] text-white font-bold border-[#00875A]'
                        : isLight ? 'bg-[#F8FAFC] border-black/5 text-[#667085]' : 'bg-[#111725] border-white/5 text-[#9AA3B5]'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setSex('female')}
                    className={`flex-1 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      sex === 'female'
                        ? 'bg-[#00875A] text-white font-bold border-[#00875A]'
                        : isLight ? 'bg-[#F8FAFC] border-black/5 text-[#667085]' : 'bg-[#111725] border-white/5 text-[#9AA3B5]'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Circumferences for Navy Body Fat & Waist Ratio */}
          <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5 text-xs font-mono">
            <div className="flex items-center justify-between font-bold text-neutral-500 text-[11px]">
              <span>STEP 3: BODY CIRCUMFERENCES</span>
              <span className="text-[#00875A]">Navy Method</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${textMuted}`}>Waist (at navel)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                  <span className="absolute right-2 top-1.5 text-neutral-400 text-[10px]">cm</span>
                </div>
              </div>

              <div>
                <label className={`block mb-1 ${textMuted}`}>Neck (below larynx)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                  <span className="absolute right-2 top-1.5 text-neutral-400 text-[10px]">cm</span>
                </div>
              </div>
            </div>

            {sex === 'female' && (
              <div>
                <label className={`block mb-1 ${textMuted}`}>Hip Circumference (widest point)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={hipCm}
                    onChange={(e) => setHipCm(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                    }`}
                  />
                  <span className="absolute right-2 top-1.5 text-neutral-400 text-[10px]">cm</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Optional Direct Measured Body Fat */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold ${headingColor}`}>Direct Measurement (DEXA)</span>
              <button
                onClick={() => setUseMeasuredBodyFat(!useMeasuredBodyFat)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                  useMeasuredBodyFat ? 'bg-[#00875A] text-white font-bold' : 'bg-black/10 dark:bg-white/10 text-neutral-500'
                }`}
              >
                {useMeasuredBodyFat ? 'Measured' : 'Estimated'}
              </button>
            </div>

            {useMeasuredBodyFat ? (
              <div>
                <label className={`block mb-1 ${textMuted} text-[11px]`}>Enter Known Body Fat %</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={measuredBodyFatPct}
                    onChange={(e) => setMeasuredBodyFatPct(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                      isLight ? 'bg-white border-black/10 text-[#00875A]' : 'bg-[#111725] border-white/10 text-[#35E6A0]'
                    }`}
                  />
                  <span className="absolute right-2.5 top-1.5 text-neutral-400">%</span>
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">Tagged as user-provided laboratory measurement.</span>
              </div>
            ) : (
              <p className={`text-[11px] leading-relaxed ${textMuted}`}>
                Using {analysis.bodyFatMethodName}. You can enter direct DEXA / caliper results if available.
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Multi-Metric Dashboard & Analysis */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hero Result Banner */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${cardBg}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              
              {/* Primary BMI Display */}
              <div className="space-y-1 sm:border-r border-black/10 dark:border-white/10 sm:pr-4">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider text-neutral-500`}>
                  Body Mass Index (BMI)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight" style={{ color: analysis.categoryColor }}>
                    {analysis.bmi}
                  </span>
                  <span className="text-xs font-mono font-bold" style={{ color: analysis.categoryColor }}>
                    {analysis.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Ref Range: {analysis.healthyWeightMinKg}–{analysis.healthyWeightMaxKg} kg
                </div>
              </div>

              {/* Body Fat & Lean Composition */}
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-[11px]">Body Fat Proportion:</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      analysis.isMeasured ? 'bg-[#00875A]/10 text-[#00875A]' : 'bg-[#6948FF]/10 text-[#6948FF]'
                    }`}>
                      {analysis.isMeasured ? 'Measured' : `~±${analysis.uncertaintyMarginPct}% Est`}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${headingColor}`}>
                    {analysis.bodyFatPct}% ({analysis.bodyFatCategory})
                  </span>
                </div>

                <div className="flex gap-4 text-[11px]">
                  <div>
                    <span className="text-neutral-500">Lean Mass:</span>
                    <span className="font-bold block text-[#00875A] dark:text-[#35E6A0]">
                      {analysis.leanMassKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Fat Mass:</span>
                    <span className="font-bold block text-[#FF5D73]">
                      {analysis.fatMassKg} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Anthropometric Waist-to-Height Ratio */}
              <div className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1.5 ${cardSubtleBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-bold uppercase">Waist Ratio (WHtR)</span>
                  <span className="font-bold" style={{ color: analysis.whtrColor || '#00875A' }}>
                    {analysis.whtr || '0.48'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((analysis.whtr || 0.48) / 0.7) * 100)}%`,
                      backgroundColor: analysis.whtrColor || '#00875A',
                    }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  {analysis.whtrCategory || 'Optimal abdominal distribution'} (Target: &lt; 0.50)
                </p>
              </div>

            </div>
          </div>

          {/* Cross-Signal Metric Disagreement Card (Advanced Intelligence) */}
          {analysis.hasDisagreement && (
            <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
              isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/25' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/25'
            }`}>
              <div className="p-2 rounded-xl bg-[#6948FF]/10 text-[#6948FF] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className={`font-bold font-mono text-sm text-[#6948FF] dark:text-[#8B6CFF]`}>
                  Cross-Signal Analysis: {analysis.disagreementTitle}
                </h4>
                <p className={`leading-relaxed ${textBody}`}>
                  {analysis.disagreementExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Tab View Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-black/5 dark:border-white/5 text-xs font-mono">
            {[
              { id: 'composition', label: 'Body Composition Breakdown' },
              { id: 'reverse', label: 'Reverse BMI Goal Solver' },
              { id: 'sensitivity', label: 'Weight Sensitivity (Δkg)' },
              { id: 'comparator', label: '2-Point Progress Comparator' },
              { id: 'methodology', label: 'Metric Limitations' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? isLight
                      ? 'bg-black text-white font-bold'
                      : 'bg-white text-black font-bold'
                    : isLight
                    ? 'text-[#667085] hover:bg-black/5'
                    : 'text-[#9AA3B5] hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Lean vs Fat Composition Visualization */}
          {activeTab === 'composition' && (
            <div className={`p-6 rounded-3xl border space-y-5 ${cardBg}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                    Total Mass Partition: Lean Tissue vs Adipose Fat Mass
                  </h4>
                  <p className={`text-xs ${textMuted}`}>
                    Formula: {analysis.bodyFatMethodName}
                  </p>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-2">
                <div className="w-full h-8 rounded-xl bg-black/5 dark:bg-white/5 overflow-hidden flex font-mono text-xs font-bold text-white">
                  <div
                    className="bg-[#00875A] dark:bg-[#35E6A0] flex items-center justify-center transition-all"
                    style={{ width: `${100 - analysis.bodyFatPct}%` }}
                    title={`Lean Body Mass: ${analysis.leanMassKg} kg`}
                  >
                    Lean: {analysis.leanMassKg} kg ({(100 - analysis.bodyFatPct).toFixed(0)}%)
                  </div>
                  <div
                    className="bg-[#FF5D73] flex items-center justify-center transition-all"
                    style={{ width: `${analysis.bodyFatPct}%` }}
                    title={`Fat Mass: ${analysis.fatMassKg} kg`}
                  >
                    Fat: {analysis.fatMassKg} kg ({analysis.bodyFatPct.toFixed(0)}%)
                  </div>
                </div>

                <div className="flex justify-between text-[11px] font-mono text-neutral-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#00875A]" />
                    Lean Mass (Muscles, Organs, Bone Mineral Content, Water)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#FF5D73]" />
                    Total Adipose Fat Mass
                  </span>
                </div>
              </div>

              {/* Multi-Model Comparison Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className={`p-3 rounded-xl border ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">DEURENBERG LBM</span>
                  <span className="font-bold text-sm text-[#00875A]">{analysis.leanMassKg} kg</span>
                  <span className="text-[10px] text-neutral-400 block">BMI & Age Regression</span>
                </div>
                <div className={`p-3 rounded-xl border ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">BOER FORMULA LBM</span>
                  <span className="font-bold text-sm text-[#00875A]">{analysis.leanMassBoerKg} kg</span>
                  <span className="text-[10px] text-neutral-400 block">Height-Weight Linear</span>
                </div>
                <div className={`p-3 rounded-xl border ${cardSubtleBg}`}>
                  <span className="text-neutral-500 block text-[10px]">JAMES FORMULA LBM</span>
                  <span className="font-bold text-sm text-[#00875A]">{analysis.leanMassJamesKg} kg</span>
                  <span className="text-[10px] text-neutral-400 block">Pharmacokinetic Standard</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Reverse BMI Goal Solver */}
          {activeTab === 'reverse' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Reverse BMI Target Weight Solver
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Find the exact body weight corresponding to any desired BMI at your current height ({heightCm} cm).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between mb-1 text-xs font-mono">
                    <span className={textMuted}>Target BMI Index</span>
                    <span className="font-bold text-[#00875A]">{reverseTargetBmi} ({getBmiCategory(reverseTargetBmi).category})</span>
                  </div>
                  <input
                    type="range"
                    min={18.0}
                    max={32.0}
                    step={0.1}
                    value={reverseTargetBmi}
                    onChange={(e) => setReverseTargetBmi(Number(e.target.value))}
                    className="w-full accent-[#00875A]"
                  />
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isLight ? 'bg-[#00875A]/5 border-[#00875A]/20' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 block">
                      Target Body Weight Required
                    </span>
                    <span className={`text-2xl font-extrabold font-mono text-[#00875A] dark:text-[#35E6A0]`}>
                      {solvedWeight} kg
                    </span>
                    <span className="text-xs font-mono text-neutral-500 ml-2">
                      ({(solvedWeight * 2.20462).toFixed(1)} lbs)
                    </span>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-neutral-500 block text-[10px]">Difference from Current</span>
                    <span className={`font-bold ${solvedWeight < weightKg ? 'text-[#FF5D73]' : 'text-[#00875A]'}`}>
                      {solvedWeight < weightKg ? `-${(weightKg - solvedWeight).toFixed(1)} kg` : `+${(solvedWeight - weightKg).toFixed(1)} kg`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Weight Sensitivity (Δkg) */}
          {activeTab === 'sensitivity' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Weight Sensitivity & Gradient Table (at {heightCm} cm)
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Every 1 kg change in body weight shifts your BMI by approximately {(1 / Math.pow(heightCm / 100, 2)).toFixed(2)} points.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-neutral-500">
                      <th className="pb-2">Body Weight</th>
                      <th className="pb-2">Calculated BMI</th>
                      <th className="pb-2">Clinical Classification</th>
                      <th className="pb-2 text-right">Weight Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {sensitivityRows.map((r, idx) => {
                      const isCurrent = Math.abs(r.weightKg - weightKg) < 0.1;
                      return (
                        <tr
                          key={idx}
                          className={`${
                            isCurrent
                              ? isLight ? 'bg-[#00875A]/10 font-bold' : 'bg-[#35E6A0]/10 font-bold'
                              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-2">{r.weightKg} kg ({Math.round(r.weightKg * 2.20462)} lbs)</td>
                          <td className="py-2 font-bold" style={{ color: r.color }}>{r.bmi}</td>
                          <td className="py-2" style={{ color: r.color }}>{r.category}</td>
                          <td className="py-2 text-right text-neutral-500">
                            {r.weightKg === weightKg ? 'Current' : `${r.weightKg > weightKg ? '+' : ''}${(r.weightKg - weightKg).toFixed(1)} kg`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: 2-Point Progress Comparator */}
          {activeTab === 'comparator' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  Two-Point Anthropometric Comparator (Before vs After)
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Evaluate how changes in weight and waist circumference alter lean body mass vs adipose tissue.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Month A */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${cardSubtleBg}`}>
                  <div className="font-bold text-xs font-mono text-neutral-500">Point A (Baseline)</div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Weight (kg)</label>
                      <input
                        type="number"
                        value={compMonthA.weight}
                        onChange={(e) => setCompMonthA({ ...compMonthA, weight: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Waist (cm)</label>
                      <input
                        type="number"
                        value={compMonthA.waist}
                        onChange={(e) => setCompMonthA({ ...compMonthA, waist: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Body Fat %</label>
                      <input
                        type="number"
                        value={compMonthA.bf}
                        onChange={(e) => setCompMonthA({ ...compMonthA, bf: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-black/5">
                    Lean: {(compMonthA.weight * (1 - compMonthA.bf / 100)).toFixed(1)} kg | Fat: {((compMonthA.weight * compMonthA.bf) / 100).toFixed(1)} kg
                  </div>
                </div>

                {/* Month B */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${cardSubtleBg}`}>
                  <div className="font-bold text-xs font-mono text-[#00875A]">Point B (Follow-Up)</div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Weight (kg)</label>
                      <input
                        type="number"
                        value={compMonthB.weight}
                        onChange={(e) => setCompMonthB({ ...compMonthB, weight: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Waist (cm)</label>
                      <input
                        type="number"
                        value={compMonthB.waist}
                        onChange={(e) => setCompMonthB({ ...compMonthB, waist: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block">Body Fat %</label>
                      <input
                        type="number"
                        value={compMonthB.bf}
                        onChange={(e) => setCompMonthB({ ...compMonthB, bf: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[#00875A] pt-1 border-t border-black/5">
                    Lean: {(compMonthB.weight * (1 - compMonthB.bf / 100)).toFixed(1)} kg | Fat: {((compMonthB.weight * compMonthB.bf) / 100).toFixed(1)} kg
                  </div>
                </div>
              </div>

              {/* Delta Summary */}
              <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                isLight ? 'bg-[#00875A]/5 border-[#00875A]/20' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'
              }`}>
                <span>Net Shift: <strong>{(compMonthB.weight - compMonthA.weight).toFixed(1)} kg Weight</strong></span>
                <span className="text-[#00875A] font-bold">
                  Δ Lean Mass: {((compMonthB.weight * (1 - compMonthB.bf / 100)) - (compMonthA.weight * (1 - compMonthA.bf / 100))).toFixed(1)} kg
                </span>
                <span className="text-[#FF5D73] font-bold">
                  Δ Fat Mass: {(((compMonthB.weight * compMonthB.bf) / 100) - ((compMonthA.weight * compMonthA.bf) / 100)).toFixed(1)} kg
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: What This Number Does NOT Tell You (Limitations) */}
          {activeTab === 'methodology' && (
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div>
                <h4 className={`text-sm font-bold font-mono ${headingColor}`}>
                  What Each Metric Can — and Cannot — Tell You
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  Clinical and physical boundaries to prevent over-interpretation.
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                  <span className="font-bold font-mono text-[#6948FF] block mb-1">Body Mass Index (BMI)</span>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {analysis.limitations.bmi}
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                  <span className="font-bold font-mono text-[#00875A] dark:text-[#35E6A0] block mb-1">Estimated Body Fat Percentage</span>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {analysis.limitations.bodyFat}
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${cardSubtleBg}`}>
                  <span className="font-bold font-mono text-[#FFB84D] block mb-1">Waist-to-Height Ratio (WHtR)</span>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {analysis.limitations.waist}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
