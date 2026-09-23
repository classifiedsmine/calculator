import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Sliders,
  Split,
  BarChart3,
  HelpCircle,
  Share2,
  Check,
  ArrowRight,
  Info,
  CheckCircle2,
  Layers,
  RotateCcw,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CalculatorDefinition,
  CalculatorInput,
  CurrencyConfig,
} from '../../types';
import {
  compileUniversalCalculatorQuery,
  solveUniversalInverse,
  generateUniversalConstraintMatrix,
  generateUniversalSensitivityMatrix,
  generateUniversalDeltaExplanation,
  generateUniversalQuestionLadder,
  generateUniversalFingerprint,
  UniversalDeltaExplanation,
} from '../../lib/universalQueryEngine';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface UniversalCalculatorOSProps {
  calculator: CalculatorDefinition;
  currency: CurrencyConfig;
  theme?: 'dark' | 'light';
  currentInputs: Record<string, any>;
  onApplyInputs: (inputs: Record<string, any>) => void;
}

export const UniversalCalculatorOS: React.FC<UniversalCalculatorOSProps> = ({
  calculator,
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

  // 1. Natural Language Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [queryFeedback, setQueryFeedback] = useState<string | null>(null);

  // 2. Inverse Solver State
  const numericInputs = useMemo(() => {
    return calculator.inputs.filter(
      (i) => i.type === 'number' || i.type === 'currency' || i.type === 'percentage' || i.type === 'slider'
    );
  }, [calculator.inputs]);

  const [selectedTargetInputId, setSelectedTargetInputId] = useState<string>(
    numericInputs[0]?.id || ''
  );

  const defaultOutput = useMemo(() => {
    return calculator.calculate(currentInputs, currency);
  }, [calculator, currentInputs, currency]);

  const [desiredTargetOutput, setDesiredTargetOutput] = useState<number>(
    Math.round(defaultOutput.primaryValue * 1.2 * 100) / 100 || 1000
  );

  // 3. Constraint Matrix State
  const [constraintVar1Id, setConstraintVar1Id] = useState<string>(
    numericInputs[0]?.id || ''
  );
  const [constraintVar2Id, setConstraintVar2Id] = useState<string>(
    numericInputs[1]?.id || numericInputs[0]?.id || ''
  );

  // 4. Delta Attribution State
  const [previousInputsState, setPreviousInputsState] = useState<Record<string, any>>({ ...currentInputs });
  const [deltaExplanation, setDeltaExplanation] = useState<UniversalDeltaExplanation | null>(null);

  // 5. Scenarios A, B, C State
  const [scenarioA, setScenarioA] = useState<Record<string, any>>({ ...currentInputs });
  const [scenarioB, setScenarioB] = useState<Record<string, any>>({ ...currentInputs });
  const [scenarioC, setScenarioC] = useState<Record<string, any>>({ ...currentInputs });
  const [scenarioLabels, setScenarioLabels] = useState({
    a: 'Scenario A (Baseline)',
    b: 'Scenario B (+20% Scale)',
    c: 'Scenario C (Stress Test)',
  });

  // Share/Fingerprint State
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Sync default scenario values
  useEffect(() => {
    const sA = { ...currentInputs };
    const sB = { ...currentInputs };
    const sC = { ...currentInputs };

    if (numericInputs.length > 0) {
      const topId = numericInputs[0].id;
      const baseVal = Number(currentInputs[topId]) || 100;
      sB[topId] = Math.round(baseVal * 1.25);
      sC[topId] = Math.round(baseVal * 0.75);
    }
    setScenarioA(sA);
    setScenarioB(sB);
    setScenarioC(sC);
  }, [calculator.id]);

  // Track Delta explanations on input modifications
  useEffect(() => {
    const delta = generateUniversalDeltaExplanation(calculator, previousInputsState, currentInputs, currency);
    if (delta) {
      setDeltaExplanation(delta);
    }
    setPreviousInputsState({ ...currentInputs });
  }, [currentInputs]);

  // Compute Current Inverse Solved Value
  const inverseSolveResult = useMemo(() => {
    if (!selectedTargetInputId) return null;
    return solveUniversalInverse(
      calculator,
      currentInputs,
      selectedTargetInputId,
      desiredTargetOutput,
      currency
    );
  }, [calculator, currentInputs, selectedTargetInputId, desiredTargetOutput, currency]);

  // Compute Constraint Matrix Rows
  const constraintRows = useMemo(() => {
    if (!constraintVar1Id || !constraintVar2Id) return [];
    return generateUniversalConstraintMatrix(
      calculator,
      currentInputs,
      constraintVar1Id,
      constraintVar2Id,
      desiredTargetOutput,
      currency
    );
  }, [calculator, currentInputs, constraintVar1Id, constraintVar2Id, desiredTargetOutput, currency]);

  // Compute 2D Sensitivity Heatmap Matrix
  const sensitivity = useMemo(() => {
    return generateUniversalSensitivityMatrix(calculator, currentInputs, currency);
  }, [calculator, currentInputs, currency]);

  // Question Ladder
  const questionLadder = useMemo(() => {
    return generateUniversalQuestionLadder(calculator, currentInputs);
  }, [calculator, currentInputs]);

  // Fingerprint Object
  const fingerprint = useMemo(() => {
    return generateUniversalFingerprint(calculator.id, currentInputs);
  }, [calculator.id, currentInputs]);

  // Evaluate Scenarios
  const scenarioResults = useMemo(() => {
    const resA = calculator.calculate(scenarioA, currency);
    const resB = calculator.calculate(scenarioB, currency);
    const resC = calculator.calculate(scenarioC, currency);

    const chartData = [
      {
        name: 'Evaluation',
        [scenarioLabels.a]: resA.primaryValue,
        [scenarioLabels.b]: resB.primaryValue,
        [scenarioLabels.c]: resC.primaryValue,
      },
    ];

    return { resA, resB, resC, chartData };
  }, [calculator, scenarioA, scenarioB, scenarioC, scenarioLabels, currency]);

  // Query Submit Handler
  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = compileUniversalCalculatorQuery(calculator, searchQuery);
    if (!parsed) return;

    setQueryFeedback(parsed.explanation);
    onApplyInputs(parsed.matchedInputs);
  };

  const handleCopyFingerprint = () => {
    const url = `${window.location.origin}${window.location.pathname}#state=${fingerprint.hash}`;
    navigator.clipboard.writeText(url);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  // Generate domain-relevant query example chips
  const samplePrompts = useMemo(() => {
    const topInputs = numericInputs.slice(0, 3);
    const parts = topInputs.map((i) => {
      const val = currentInputs[i.id] ?? i.defaultValue;
      if (i.type === 'currency') return `${currency.symbol}${val}`;
      if (i.type === 'percentage') return `${val}%`;
      return `${val} ${i.unit || ''}`.trim();
    });

    return [
      `Compute ${calculator.title} with ${parts.join(', ')}`,
      `What happens if ${topInputs[0]?.name || 'input'} increases by 25%?`,
      `Target goal: solve for ${topInputs[0]?.name || 'first variable'}`,
    ];
  }, [calculator, numericInputs, currentInputs, currency]);

  return (
    <div className="space-y-10 my-8">

      {/* ============================================================== */}
      {/* 1. UNIVERSAL QUERY OS (Natural Language Intent Compiler) */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#6948FF]/10 text-[#6948FF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingColor}`}>
                  {calculator.title} Query OS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6948FF]/15 text-[#6948FF] font-semibold">
                  NLP Compiler
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Ask any question or state your numbers in plain English. Deconstructs variables directly into the computation model.
              </p>
            </div>
          </div>

          {/* Shareable Fingerprint Token */}
          <button
            onClick={handleCopyFingerprint}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
              isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-[#11131A]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#F7F8FC]'
            }`}
          >
            {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-[#00875A] dark:text-[#35E6A0]" /> : <Share2 className="w-3.5 h-3.5 text-neutral-400" />}
            <span>Fingerprint: <span className="text-[#6948FF] dark:text-[#8B6CFF] font-bold">{fingerprint.hash}</span></span>
          </button>
        </div>

        {/* Natural Language Query Bar */}
        <form onSubmit={handleQuerySubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Ask or type inputs for ${calculator.title}...`}
              className={`w-full pl-12 pr-28 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#6948FF]/40 ${
                isLight ? 'bg-[#F8FAFC] border-black/10 text-[#11131A]' : 'bg-[#111725] border-white/10 text-[#F7F8FC]'
              }`}
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Compile</span>
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Sample Prompts */}
        <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
          <span className={`text-[11px] font-mono ${textMuted}`}>Examples:</span>
          {samplePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchQuery(promptText);
                const parsed = compileUniversalCalculatorQuery(calculator, promptText);
                if (parsed) {
                  setQueryFeedback(parsed.explanation);
                  onApplyInputs(parsed.matchedInputs);
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                isLight
                  ? 'bg-black/[0.02] hover:bg-black/5 border-black/5 text-[#475467]'
                  : 'bg-white/[0.02] hover:bg-white/5 border-white/5 text-[#9AA3B5]'
              }`}
            >
              "{promptText}"
            </button>
          ))}
        </div>

        {/* NLP Deconstruction Feedback */}
        {queryFeedback && (
          <div className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20 text-[#6948FF]' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20 text-[#8B6CFF]'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span><strong>Compiled:</strong> {queryFeedback}</span>
            </div>
            <button
              onClick={() => setQueryFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 2. UNIVERSAL INVERSE EQUATION & GOAL SOLVER SUITE */}
      {/* ============================================================== */}
      {numericInputs.length > 0 && (
        <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00875A] dark:text-[#35E6A0]" />
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  Inverse Goal Solver & Unknown Isolator
                </h2>
              </div>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Work backwards from your target outcome. Choose which variable to isolate and solve using high-precision numerical root-finding.
              </p>
            </div>
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] dark:text-[#35E6A0] font-semibold self-start sm:self-auto">
              Root-Finding Engine
            </span>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 ${cardSubtleBg}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Target Desired Output */}
              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${headingColor}`}>
                  Desired Target {defaultOutput.primaryLabel || 'Output'}
                </label>
                <input
                  type="number"
                  value={desiredTargetOutput}
                  onChange={(e) => setDesiredTargetOutput(Number(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold ${
                    isLight ? 'bg-white border-black/10 text-[#11131A]' : 'bg-[#111725] border-white/10 text-[#F7F8FC]'
                  }`}
                />
              </div>

              {/* Variable to Solve For */}
              <div>
                <label className={`text-xs font-semibold block mb-1.5 ${headingColor}`}>
                  Solve For Unknown Variable
                </label>
                <select
                  value={selectedTargetInputId}
                  onChange={(e) => setSelectedTargetInputId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-semibold ${
                    isLight ? 'bg-white border-black/10 text-[#11131A]' : 'bg-[#111725] border-white/10 text-[#F7F8FC]'
                  }`}
                >
                  {numericInputs.map((input) => (
                    <option key={input.id} value={input.id}>
                      {input.name} {input.unit ? `(${input.unit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Solved Result Card */}
            {inverseSolveResult && (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                inverseSolveResult.isSolvable
                  ? isLight ? 'bg-[#00875A]/5 border-[#00875A]/25' : 'bg-[#35E6A0]/10 border-[#35E6A0]/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">
                    Required {inverseSolveResult.targetInputName}
                  </span>
                  <span className={`text-2xl font-extrabold font-mono ${
                    inverseSolveResult.isSolvable
                      ? isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'
                      : 'text-red-500'
                  }`}>
                    {inverseSolveResult.formattedSolvedValue}
                  </span>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Yields target of <strong className="font-mono">{inverseSolveResult.formattedAchievedOutput}</strong> in {inverseSolveResult.iterations} iterations.
                  </div>
                </div>

                {inverseSolveResult.isSolvable && (
                  <button
                    onClick={() => onApplyInputs({ [inverseSolveResult.targetInputId]: inverseSolveResult.solvedValue })}
                    className="px-4 py-2 rounded-xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
                  >
                    <span>Apply to Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. UNIVERSAL CONSTRAINT MATRIX EXPLORER */}
      {/* ============================================================== */}
      {numericInputs.length >= 2 && (
        <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#6948FF] dark:text-[#8B6CFF]" />
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  Multi-Variable Constraint Matrix
                </h2>
              </div>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Observe what value of Variable B is required across varying steps of Variable A to achieve your target outcome.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <select
                value={constraintVar1Id}
                onChange={(e) => setConstraintVar1Id(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border font-mono ${
                  isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                }`}
              >
                {numericInputs.map((i) => (
                  <option key={i.id} value={i.id}>Vary: {i.name}</option>
                ))}
              </select>

              <select
                value={constraintVar2Id}
                onChange={(e) => setConstraintVar2Id(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border font-mono ${
                  isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/10'
                }`}
              >
                {numericInputs.map((i) => (
                  <option key={i.id} value={i.id}>Solve: {i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {constraintRows.map((row, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  row.isFeasible
                    ? isLight
                      ? 'bg-[#F8FAFC] border-black/5 hover:border-[#6948FF]/40'
                      : 'bg-[#111725] border-white/5 hover:border-[#8B6CFF]/40'
                    : 'bg-red-500/5 border-red-500/15 opacity-70'
                }`}
              >
                <span className="text-[11px] font-mono text-neutral-500 block mb-1">{row.var1Label}</span>
                <span className={`text-sm font-extrabold font-mono block ${
                  row.isFeasible ? isLight ? 'text-[#00875A]' : 'text-[#35E6A0]' : 'text-red-500'
                }`}>
                  {row.formattedSolvedVar2}
                </span>
                <span className="text-[9px] text-neutral-400 mt-1 block">
                  {row.isFeasible ? 'Feasible' : 'Out of Bounds'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 4. "WHY DID MY RESULT CHANGE?" DIFFERENTIAL DELTA ENGINE */}
      {/* ============================================================== */}
      {deltaExplanation && (
        <section className={`p-6 rounded-2xl border transition-all ${
          isLight ? 'bg-[#6948FF]/5 border-[#6948FF]/20 text-[#11131A]' : 'bg-[#8B6CFF]/10 border-[#8B6CFF]/20 text-[#F7F8FC]'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#6948FF] dark:text-[#8B6CFF] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#6948FF] dark:text-[#8B6CFF]">
                  Mathematical Attribution Engine
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#6948FF]/15 text-[#6948FF] dark:text-[#8B6CFF]">
                  {deltaExplanation.primaryCause}
                </span>
              </div>
              <p className="text-sm font-semibold leading-relaxed">
                {deltaExplanation.summary}
              </p>
              <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300 list-disc list-inside pt-1">
                {deltaExplanation.bulletPoints.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setDeltaExplanation(null)}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. 3-WAY PARALLEL SCENARIO COMPARATIVE ENGINE */}
      {/* ============================================================== */}
      <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#29D8FF]/10 text-[#29D8FF]">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                Multi-Scenario Comparative Engine
              </h2>
              <p className={`text-xs sm:text-sm ${textBody}`}>
                Model and benchmark 3 distinct input scenarios side-by-side in real-time.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 font-semibold text-neutral-500">
            3-Way Parallel Simulation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Scenario A */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#29D8FF]">Scenario A</span>
              <input
                type="text"
                value={scenarioLabels.a}
                onChange={(e) => setScenarioLabels({ ...scenarioLabels, a: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {numericInputs.slice(0, 4).map((i) => (
                <div key={i.id}>
                  <label className="text-[10px] text-neutral-500 truncate block">{i.name}</label>
                  <input
                    type="number"
                    value={scenarioA[i.id] ?? i.defaultValue}
                    onChange={(e) => setScenarioA({ ...scenarioA, [i.id]: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">{scenarioResults.resA.primaryLabel}</span>
              <span className="text-lg font-bold font-mono text-[#29D8FF]">
                {scenarioResults.resA.primaryFormatted || scenarioResults.resA.primaryValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Scenario B */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#8B6CFF]">Scenario B</span>
              <input
                type="text"
                value={scenarioLabels.b}
                onChange={(e) => setScenarioLabels({ ...scenarioLabels, b: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {numericInputs.slice(0, 4).map((i) => (
                <div key={i.id}>
                  <label className="text-[10px] text-neutral-500 truncate block">{i.name}</label>
                  <input
                    type="number"
                    value={scenarioB[i.id] ?? i.defaultValue}
                    onChange={(e) => setScenarioB({ ...scenarioB, [i.id]: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">{scenarioResults.resB.primaryLabel}</span>
              <span className="text-lg font-bold font-mono text-[#8B6CFF]">
                {scenarioResults.resB.primaryFormatted || scenarioResults.resB.primaryValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Scenario C */}
          <div className={`p-5 rounded-2xl border space-y-3 ${cardSubtleBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-[#35E6A0]">Scenario C</span>
              <input
                type="text"
                value={scenarioLabels.c}
                onChange={(e) => setScenarioLabels({ ...scenarioLabels, c: e.target.value })}
                className="text-xs font-semibold bg-transparent border-b border-black/10 dark:border-white/10 text-right w-40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {numericInputs.slice(0, 4).map((i) => (
                <div key={i.id}>
                  <label className="text-[10px] text-neutral-500 truncate block">{i.name}</label>
                  <input
                    type="number"
                    value={scenarioC[i.id] ?? i.defaultValue}
                    onChange={(e) => setScenarioC({ ...scenarioC, [i.id]: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border bg-white dark:bg-black/30 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[11px] text-neutral-500">{scenarioResults.resC.primaryLabel}</span>
              <span className="text-lg font-bold font-mono text-[#35E6A0]">
                {scenarioResults.resC.primaryFormatted || scenarioResults.resC.primaryValue.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. 2D SENSITIVITY HEATMAP MATRIX */}
      {/* ============================================================== */}
      {sensitivity && (
        <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#35E6A0]" />
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingColor}`}>
                  {sensitivity.var1Def.name} vs {sensitivity.var2Def.name} Sensitivity Heatmap
                </h2>
                <p className={`text-xs sm:text-sm ${textBody}`}>
                  Understand outcome sensitivity and variance when key variables drift by ±10% and ±20%.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Base Output: {defaultOutput.primaryFormatted || defaultOutput.primaryValue.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className={`border-b ${isLight ? 'border-black/10 text-neutral-500' : 'border-white/10 text-neutral-400'}`}>
                  <th className="py-2.5 text-left font-semibold">{sensitivity.var2Def.name} \ {sensitivity.var1Def.name}</th>
                  {sensitivity.var1Offsets.map((o1) => (
                    <th key={o1} className="py-2.5 font-semibold">
                      {o1 >= 0 ? `+${o1}%` : `${o1}%`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-black/5' : 'divide-white/5'}`}>
                {sensitivity.matrix.map((row, rIdx) => {
                  const o2 = sensitivity.var2Offsets[rIdx];
                  return (
                    <tr key={rIdx} className={isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-white/[0.02]'}>
                      <td className="py-3 text-left font-bold text-neutral-800 dark:text-neutral-200">
                        {o2 >= 0 ? `+${o2}%` : `${o2}%`} ({row[0].var2Val})
                      </td>
                      {row.map((cell, cIdx) => {
                        const isBase = cell.var1Offset === 0 && cell.var2Offset === 0;
                        const isPositive = cell.diffFromBase >= 0;
                        return (
                          <td
                            key={cIdx}
                            className={`py-3 px-2 rounded-lg transition-colors ${
                              isBase
                                ? 'bg-[#6948FF]/15 font-bold text-[#6948FF] dark:text-[#8B6CFF]'
                                : isPositive
                                ? isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'
                                : 'text-neutral-500'
                            }`}
                          >
                            <div className="font-bold">{cell.formattedOutput}</div>
                            {!isBase && (
                              <div className="text-[10px] opacity-80">
                                {isPositive ? '+' : ''}{cell.diffPercent}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 7. QUESTION LADDER: DYNAMIC INQUIRY BRANCHES */}
      {/* ============================================================== */}
      {questionLadder.length > 0 && (
        <section className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#6948FF] dark:text-[#8B6CFF]" />
            <div>
              <h3 className={`text-lg font-bold ${headingColor}`}>
                Question Ladder: Next Logical Inquiries
              </h3>
              <p className={`text-xs ${textBody}`}>
                Explore the next logical branches of your calculation:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {questionLadder.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onApplyInputs(item.applyInputs)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  isLight
                    ? 'bg-[#F8FAFC] hover:bg-[#6948FF] hover:text-white border-black/5'
                    : 'bg-[#111725] hover:bg-[#8B6CFF] hover:text-white border-white/5'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono opacity-70 uppercase tracking-wider block mb-1">
                    {item.tag}
                  </span>
                  <span className="text-xs font-semibold block leading-tight">{item.question}</span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 8. MACHINE-READABLE PROVENANCE & CALCULATION METADATA */}
      {/* ============================================================== */}
      <section className={`p-4 sm:p-5 rounded-2xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-black/[0.02] border-black/5 text-neutral-500' : 'bg-white/[0.02] border-white/5 text-neutral-400'
      }`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span><strong>Engine:</strong> {calculator.slug || calculator.id}-os-v3.0</span>
          <span><strong>Methodology:</strong> Deterministic Functional Computation</span>
          <span><strong>Precision:</strong> IEEE 754 Double Precision Floating Point</span>
        </div>
        <div className="text-[10px] opacity-70">
          Provenance Verified · Machine-Readable Entity State
        </div>
      </section>

    </div>
  );
};
