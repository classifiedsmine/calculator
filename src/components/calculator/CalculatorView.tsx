import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Maximize2, 
  Minimize2, 
  Share2, 
  Save, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Sliders, 
  Activity, 
  Info, 
  Check, 
  ArrowRight,
  RefreshCw,
  Copy,
  Code,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { CalculatorDefinition, CurrencyConfig, CalculationHistoryItem } from '../../types';
import { PrecisionInput, InteractiveFormula } from '../common/Inputs';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface CalculatorViewProps {
  calculator: CalculatorDefinition;
  currency: CurrencyConfig;
  onSaveHistory: (item: CalculationHistoryItem) => void;
  onSelectRelated: (calcId: string) => void;
  theme?: 'dark' | 'light';
  externalInputs?: Record<string, any>;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  calculator,
  currency,
  onSaveHistory,
  onSelectRelated,
  theme = 'light',
  externalInputs,
}) => {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-black/10 text-[#11131A] shadow-xs' : 'bg-[#0C101A] border-white/[0.07] text-[#F7F8FC] shadow-xl';
  const titleColor = isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]';
  const textMuted = isLight ? 'text-[#667085]' : 'text-[#9AA3B5]';
  const textSubtle = isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]';
  // Input State
  const [inputs, setInputs] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    calculator.inputs.forEach((i) => {
      init[i.id] = i.defaultValue;
    });
    return { ...init, ...(externalInputs || {}) };
  });

  // Reinitialize inputs when calculator changes or external inputs applied
  useEffect(() => {
    const init: Record<string, any> = {};
    calculator.inputs.forEach((i) => {
      init[i.id] = i.defaultValue;
    });
    setInputs(init);
    setHighlightedInputId(null);
    setHighlightedToken(null);
    setShowWhatIf(false);
  }, [calculator.id]);

  useEffect(() => {
    if (externalInputs && Object.keys(externalInputs).length > 0) {
      setInputs((prev) => ({ ...prev, ...externalInputs }));
    }
  }, [externalInputs]);

  // Mode toggles
  const [focusMode, setFocusMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'scenarios' | 'breakdown' | 'simulation'>('chart');
  const [highlightedInputId, setHighlightedInputId] = useState<string | null>(null);
  const [highlightedToken, setHighlightedToken] = useState<string | null>(null);

  // What-If comparison state
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfInputDelta, setWhatIfInputDelta] = useState(5000); // delta addition

  // Share / Copy notification
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // Chart range filter
  const [chartRange, setChartRange] = useState<'all' | '5y' | '10y' | '20y'>('all');

  const handleInputChange = (id: string, value: any) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  // Compute live output
  const output = useMemo(() => {
    return calculator.calculate(inputs, currency);
  }, [calculator, inputs, currency]);

  // Filter chart data by range
  const filteredChartData = useMemo(() => {
    if (!output.chartData || output.chartData.length <= 1) return output.chartData;
    if (chartRange === '5y') return output.chartData.slice(0, Math.min(6, output.chartData.length));
    if (chartRange === '10y') return output.chartData.slice(0, Math.min(11, output.chartData.length));
    if (chartRange === '20y') return output.chartData.slice(0, Math.min(21, output.chartData.length));
    return output.chartData;
  }, [output.chartData, chartRange]);

  // What-If output computation
  const whatIfOutput = useMemo(() => {
    if (!showWhatIf) return null;
    const targetInput = calculator.inputs.find((i) => i.id === 'periodicContribution' || i.id === 'monthlyInvestment' || i.id === 'prepaymentMonthly');
    if (!targetInput) return null;

    const modifiedInputs = {
      ...inputs,
      [targetInput.id]: (Number(inputs[targetInput.id]) || 0) + whatIfInputDelta,
    };
    return {
      name: targetInput.name,
      baseVal: Number(inputs[targetInput.id]) || 0,
      newVal: (Number(inputs[targetInput.id]) || 0) + whatIfInputDelta,
      result: calculator.calculate(modifiedInputs, currency),
    };
  }, [showWhatIf, whatIfInputDelta, inputs, calculator, currency]);

  // Scenarios computation
  const scenarios = useMemo(() => {
    if (!calculator.generateScenarios) return [];
    return calculator.generateScenarios(inputs);
  }, [calculator, inputs]);

  // Handle Token Click
  const handleTokenClick = (inputId?: string, token?: string) => {
    if (inputId) {
      setHighlightedInputId(inputId);
      setHighlightedToken(token || null);
      // scroll to input
      const el = document.getElementById(`input-container-${inputId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Save calculation to history
  const handleSaveCalculation = () => {
    const item: CalculationHistoryItem = {
      id: `calc-${Date.now()}`,
      calculatorId: calculator.id,
      calculatorTitle: calculator.title,
      category: calculator.category,
      timestamp: Date.now(),
      primaryFormatted: output.primaryFormatted,
      primaryLabel: output.primaryLabel,
      inputs: { ...inputs },
    };
    onSaveHistory(item);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  // Copy share summary
  const handleShare = () => {
    const summary = `${calculator.title} on CALCULA X\n${output.primaryLabel}: ${output.primaryFormatted}\nGenerated on ${new Date().toLocaleDateString()}`;
    navigator.clipboard.writeText(summary);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const handleExportCSV = () => {
    if (!output.chartData || output.chartData.length === 0) return;
    const headers = ['Period,Label,Balance,Principal,Interest\n'];
    const rows = output.chartData.map((d: any) => `${d.period},"${d.label}",${d.balance || d.value || 0},${d.principal || 0},${d.interest || 0}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${calculator.slug}-projection.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!output.chartData || output.chartData.length === 0) return;
    let html = `<table><tr><th>Period</th><th>Label</th><th>Balance</th><th>Principal</th><th>Interest</th></tr>`;
    output.chartData.forEach((d: any) => {
      html += `<tr><td>${d.period}</td><td>${d.label}</td><td>${d.balance || d.value || 0}</td><td>${d.principal || 0}</td><td>${d.interest || 0}</td></tr>`;
    });
    html += `</table>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${calculator.slug}-report.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div id="calculator-view-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Context Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isLight ? 'border-black/10' : 'border-white/[0.07]'}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-[#6948FF]/10 text-[#6948FF] border-[#6948FF]/25' : 'bg-[#8B6CFF]/10 text-[#8B6CFF] border-[#8B6CFF]/20'
            }`}>
              {calculator.category}
            </span>
            <span className={`text-xs ${textSubtle}`}>◈ MODEL ARCHITECTURE</span>
          </div>
          <h1
            id="calculator-main-h1"
            data-calculator-id={calculator.id}
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${titleColor}`}
          >
            {calculator.title}
          </h1>
          <p className={`text-xs sm:text-sm ${textMuted} mt-0.5 max-w-2xl`}>
            {calculator.tagline}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="what-if-toggle-btn"
            onClick={() => setShowWhatIf(!showWhatIf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showWhatIf
                ? isLight ? 'bg-[#009DD9] text-white shadow-sm font-semibold' : 'bg-[#29D8FF] text-black shadow-md'
                : isLight
                  ? 'bg-white hover:bg-[#F4F6FB] text-[#009DD9] border border-[#009DD9]/30'
                  : 'bg-[#0C101A] hover:bg-[#111725] text-[#29D8FF] border border-[#29D8FF]/30'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            ⌁ What-If Mode
          </button>

          <button
            id="focus-mode-toggle-btn"
            onClick={() => setFocusMode(!focusMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Toggle Focus Mode"
          >
            {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>

          <button
            id="save-model-btn"
            onClick={handleSaveCalculation}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Save to History"
          >
            {savedNotification ? <Check className="w-3.5 h-3.5 text-[#00875A]" /> : <Save className="w-3.5 h-3.5" />}
            {savedNotification ? 'Saved' : 'Save'}
          </button>

          <button
            id="share-model-btn"
            onClick={handleShare}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-[#6948FF]/10 hover:bg-[#6948FF]/20 text-[#6948FF] border-[#6948FF]/30'
                : 'bg-[#8B6CFF]/10 hover:bg-[#8B6CFF]/20 text-[#8B6CFF] border-[#8B6CFF]/30'
            }`}
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedNotification ? 'Copied' : 'Share'}
          </button>

          <button
            onClick={() => setShowEmbedModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Embed Widget on Your Website"
          >
            <Code className="w-3.5 h-3.5" />
            Embed Widget
          </button>

          <button
            onClick={handleExportCSV}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Export CSV Amortization"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleExportExcel}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Export Excel XLS Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>

          <button
            onClick={handleExportPDF}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-[#F4F6FB] text-[#475467] hover:text-[#11131A] border-black/10'
                : 'bg-[#0C101A] hover:bg-[#111725] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.07]'
            }`}
            title="Print / Export PDF Audit Report"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF Report
          </button>
        </div>
      </div>

      {/* What-If Banner if active */}
      {showWhatIf && whatIfOutput && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight
            ? 'bg-[#EBF7FC] border-[#009DD9]/30 text-[#11131A]'
            : 'bg-gradient-to-r from-[#29D8FF]/10 via-[#0C101A] to-[#0C101A] border-[#29D8FF]/30'
        }`}>
          <div>
            <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isLight ? 'text-[#007EA7]' : 'text-[#29D8FF]'}`}>
              <Sliders className="w-4 h-4" />
              <span>WHAT-IF SCENARIO EXPERIMENT</span>
            </div>
            <p className={`text-xs ${textMuted} mt-1`}>
              What if <span className={`${titleColor} font-semibold`}>{whatIfOutput.name}</span> increases by{' '}
              <span className={`font-mono font-bold ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>+{formatCurrency(whatIfInputDelta, currency, true)}</span>?
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isLight ? 'bg-white border-black/10' : 'bg-[#111725] border-white/[0.08]'}`}>
              <span className={`text-xs ${textSubtle}`}>Delta:</span>
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={whatIfInputDelta}
                onChange={(e) => setWhatIfInputDelta(Number(e.target.value))}
                className={`w-24 ${isLight ? 'accent-[#009DD9]' : 'accent-[#29D8FF]'}`}
              />
              <span className={`text-xs font-mono font-semibold ${isLight ? 'text-[#007EA7]' : 'text-[#29D8FF]'}`}>
                +{formatCurrency(whatIfInputDelta, currency, true)}
              </span>
            </div>

            <div className="text-right">
              <span className={`text-[10px] uppercase font-mono ${textSubtle}`}>New Future Valuation</span>
              <div className={`text-base font-bold font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                {whatIfOutput.result.primaryFormatted}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary 3-Column Workstation Layout */}
      <div className={`grid grid-cols-1 ${focusMode ? 'lg:grid-cols-1 max-w-3xl mx-auto' : 'lg:grid-cols-12'} gap-6 items-start`}>
        
        {/* Column 1: Inputs & Assumptions (Left, 4 cols) */}
        {!focusMode && (
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-semibold uppercase tracking-wider font-mono ${textMuted}`}>
                Assumptions & Parameters
              </h2>
              <span className={`text-[11px] font-mono ${textSubtle}`}>
                {calculator.inputs.length} variables
              </span>
            </div>

            <div className="space-y-3">
              {calculator.inputs.map((inp) => {
                if (inp.id === 'contributionTiming') {
                  const currentTiming = (inputs['contributionTiming'] as string) || 'end';
                  const currentFreq = (inputs['contributionFrequency'] as string) || 'month';

                  const selectOption = (timing: string, freq: string) => {
                    handleInputChange('contributionTiming', timing);
                    handleInputChange('contributionFrequency', freq);
                  };

                  const options = [
                    { id: 'beginning_month', label: 'beginning of each month', timing: 'beginning', freq: 'month' },
                    { id: 'end_month', label: 'end of each month', timing: 'end', freq: 'month' },
                    { id: 'beginning_year', label: 'beginning of each year', timing: 'beginning', freq: 'year' },
                    { id: 'end_year', label: 'end of each year', timing: 'end', freq: 'year' },
                  ];

                  return (
                    <div
                      key={inp.id}
                      className={`p-4 rounded-xl border-2 border-[#6948FF]/30 space-y-3 ${
                        isLight ? 'bg-[#6948FF]/5 text-[#11131A]' : 'bg-[#6948FF]/10 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6948FF]">
                          Contributions made at the:
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6948FF]/10 text-[#6948FF] font-semibold">
                          Calculator.net Style
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {options.map((opt) => {
                          const isSelected = currentTiming === opt.timing && currentFreq === opt.freq;
                          return (
                            <label
                              key={opt.id}
                              onClick={() => selectOption(opt.timing, opt.freq)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                                isSelected
                                  ? 'bg-[#6948FF] text-white border-[#6948FF] font-bold shadow-sm'
                                  : isLight
                                    ? 'bg-white text-neutral-800 border-neutral-200 hover:border-[#6948FF]/40'
                                    : 'bg-[#111725] text-neutral-200 border-white/10 hover:border-[#6948FF]/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => selectOption(opt.timing, opt.freq)}
                                className="w-4 h-4 rounded border-neutral-300 text-[#6948FF] focus:ring-[#6948FF] accent-[#6948FF] cursor-pointer"
                              />
                              <span className="text-xs">
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <p className={`text-[10px] ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {currentTiming === 'beginning'
                          ? `✓ Annuity Due: Contributions deposited at the beginning of each ${currentFreq} earn compounding interest for that full period.`
                          : `✓ Ordinary Annuity: Contributions deposited at the end of each ${currentFreq} (standard default).`}
                      </p>
                    </div>
                  );
                }

                if (inp.type === 'select' || (inp.options && inp.options.length > 0)) {
                  const selectedVal = inputs[inp.id] !== undefined ? inputs[inp.id] : inp.defaultValue;
                  return (
                    <div key={inp.id} id={`input-container-${inp.id}`} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-semibold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
                          {inp.name}
                        </label>
                        {inp.token && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6948FF]/10 text-[#6948FF] font-bold">
                            {inp.token}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedVal}
                          onChange={(e) => handleInputChange(inp.id, e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium appearance-none cursor-pointer pr-8 transition-all focus:outline-none focus:ring-2 focus:ring-[#6948FF]/40 ${
                            isLight
                              ? 'bg-[#F8FAFC] border-black/10 text-[#11131A] hover:border-black/20'
                              : 'bg-[#111725] border-white/10 text-[#F7F8FC] hover:border-white/20'
                          }`}
                        >
                          {inp.options?.map((opt) => (
                            <option key={opt.value} value={opt.value} className={isLight ? 'bg-white text-[#11131A]' : 'bg-[#111725] text-[#F7F8FC]'}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                          ▼
                        </div>
                      </div>
                      {inp.description && (
                        <p className={`text-[10px] ${textMuted}`}>{inp.description}</p>
                      )}
                    </div>
                  );
                }

                return (
                  <PrecisionInput
                    key={inp.id}
                    id={inp.id}
                    name={inp.name}
                    token={inp.token}
                    value={inputs[inp.id] !== undefined ? Number(inputs[inp.id]) : Number(inp.defaultValue)}
                    onChange={(val) => handleInputChange(inp.id, val)}
                    min={inp.min}
                    max={inp.max}
                    step={inp.step}
                    unit={inp.unit}
                    isCurrency={inp.type === 'currency'}
                    currency={currency}
                    description={inp.description}
                    isHighlighted={highlightedInputId === inp.id}
                    onFocusToken={() => {
                      setHighlightedInputId(inp.id);
                      setHighlightedToken(inp.token || null);
                    }}
                    theme={theme}
                  />
                );
              })}
            </div>

            {/* Interactive Formula Variable Linkage */}
            <InteractiveFormula
              formula={calculator.formulaDisplay}
              tokens={calculator.formulaTokens}
              highlightedToken={highlightedToken}
              onTokenClick={handleTokenClick}
              theme={theme}
            />
          </div>
        )}

        {/* Column 2: Visual Chart & Model (Center, 5 cols) */}
        <div className={`${focusMode ? 'lg:col-span-1' : 'lg:col-span-5'} space-y-4`}>
          
          {/* Chart Header & Controls */}
          <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-[#6948FF]' : 'bg-[#8B6CFF]'} animate-pulse`} />
                <span className={`text-xs font-bold font-mono tracking-wider ${titleColor}`}>
                  INTERACTIVE MODEL VISUALIZATION
                </span>
              </div>

              {/* Time Range Filter */}
              <div className={`flex items-center p-0.5 rounded-lg border ${isLight ? 'bg-[#F4F6FB] border-black/10' : 'bg-[#111725] border-white/[0.07]'}`}>
                {(['all', '5y', '10y', '20y'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all cursor-pointer ${
                      chartRange === r
                        ? isLight ? 'bg-[#6948FF] text-white font-bold' : 'bg-[#8B6CFF] text-white font-bold'
                        : isLight ? 'text-[#667085] hover:text-[#11131A]' : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Recharts Area / Line Visualizer */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {output.chartSeries[0]?.type === 'bar' ? (
                  <BarChart data={filteredChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'} />
                    <XAxis dataKey="label" stroke={isLight ? '#8C95A6' : '#5F6878'} fontSize={10} tickLine={false} />
                    <YAxis stroke={isLight ? '#8C95A6' : '#5F6878'} fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0C101A',
                        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: isLight ? '#11131A' : '#F7F8FC',
                      }}
                    />
                    <Bar dataKey="value" fill={isLight ? '#00875A' : '#35E6A0'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isLight ? '#009DD9' : '#29D8FF'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isLight ? '#009DD9' : '#29D8FF'} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isLight ? '#6948FF' : '#8B6CFF'} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={isLight ? '#6948FF' : '#8B6CFF'} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isLight ? '#00875A' : '#35E6A0'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isLight ? '#00875A' : '#35E6A0'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'} vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke={isLight ? '#8C95A6' : '#5F6878'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)' }}
                    />
                    <YAxis 
                      stroke={isLight ? '#8C95A6' : '#5F6878'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)' }}
                      tickFormatter={(v) => formatCurrency(v, currency, true)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0C101A',
                        borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        color: isLight ? '#11131A' : '#F7F8FC',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 10px 25px rgba(0,0,0,0.5)',
                      }}
                      formatter={(val: any, name: any) => [
                        formatCurrency(Number(val) || 0, currency),
                        name,
                      ]}
                    />
                    {output.chartSeries.map((s) => (
                      <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        fill={s.key === 'interest' ? 'url(#gradInterest)' : s.key === 'principal' ? 'url(#gradPrincipal)' : 'url(#gradBalance)'}
                      />
                    ))}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Legend Toggles */}
            <div className={`flex items-center justify-center gap-6 pt-2 border-t ${isLight ? 'border-black/5' : 'border-white/[0.05]'} flex-wrap`}>
              {output.chartSeries.map((s) => (
                <div key={s.key} className={`flex items-center gap-2 text-xs font-mono ${textMuted}`}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Tabs: Scenarios / Breakdown / Simulation */}
          <div className={`flex items-center gap-2 border-b ${isLight ? 'border-black/10' : 'border-white/[0.07]'} pb-2`}>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'chart'
                  ? isLight
                    ? 'bg-[#F4F6FB] text-[#11131A] border border-black/10 font-semibold'
                    : 'bg-[#111725] text-[#F7F8FC] border border-white/[0.1]'
                  : isLight
                    ? 'text-[#667085] hover:text-[#11131A]'
                    : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              Overview
            </button>

            {scenarios.length > 0 && (
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'scenarios'
                    ? isLight
                      ? 'bg-[#F4F6FB] text-[#11131A] border border-black/10 font-semibold'
                      : 'bg-[#111725] text-[#F7F8FC] border border-white/[0.1]'
                    : isLight
                      ? 'text-[#667085] hover:text-[#11131A]'
                      : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
                }`}
              >
                Scenarios ({scenarios.length})
              </button>
            )}

            {output.simulationData && (
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'simulation'
                    ? isLight
                      ? 'bg-[#F4F6FB] text-[#11131A] border border-black/10 font-semibold'
                      : 'bg-[#111725] text-[#F7F8FC] border border-white/[0.1]'
                    : isLight
                      ? 'text-[#667085] hover:text-[#11131A]'
                      : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`} />
                Monte Carlo Simulation
              </button>
            )}

            {output.breakdownTable && (
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'breakdown'
                    ? isLight
                      ? 'bg-[#F4F6FB] text-[#11131A] border border-black/10 font-semibold'
                      : 'bg-[#111725] text-[#F7F8FC] border border-white/[0.1]'
                    : isLight
                      ? 'text-[#667085] hover:text-[#11131A]'
                      : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
                }`}
              >
                Amortization Schedule
              </button>
            )}
          </div>

          {/* Sub-Tab Content */}
          {activeTab === 'scenarios' && scenarios.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase font-mono ${textMuted}`}>
                  Comparative Multi-Scenario Modeling
                </span>
                <span className={`text-[11px] ${textSubtle}`}>Simultaneous Evaluation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {scenarios.map((sc) => {
                  const scResult = calculator.calculate(sc.inputs, currency);
                  return (
                    <div
                      key={sc.id}
                      className={`p-3 rounded-lg border space-y-1 ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#111725] border-white/[0.07]'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                        <span className={`text-xs font-bold ${titleColor}`}>{sc.name}</span>
                      </div>
                      <div className={`text-base font-mono font-bold pt-1 ${titleColor}`}>
                        {scResult.primaryFormatted}
                      </div>
                      <span className={`text-[10px] ${textSubtle} block`}>
                        Annual Yield: {sc.inputs.interestRate || sc.inputs.expectedReturnRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'simulation' && output.simulationData && (
            <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-semibold uppercase font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                    Probabilistic Monte Carlo Distribution (1,000 Iterations)
                  </span>
                  <p className={`text-[11px] ${textSubtle}`}>
                    14% historical market volatility simulation
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 py-2">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#111725] border-white/[0.06]'}`}>
                  <span className={`text-[10px] ${textSubtle} block uppercase font-mono`}>10th Percentile</span>
                  <span className={`text-sm font-bold font-mono ${isLight ? 'text-[#D97706]' : 'text-[#FFB84D]'}`}>
                    {formatCurrency(output.simulationData.percentile10, currency, true)}
                  </span>
                  <span className={`text-[10px] ${textSubtle} block`}>Conservative market</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-[#F4F6FB] border-[#00875A]/25' : 'bg-[#111725] border-[#35E6A0]/20'}`}>
                  <span className={`text-[10px] block uppercase font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>Median (50th)</span>
                  <span className={`text-sm font-bold font-mono ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                    {formatCurrency(output.simulationData.median, currency, true)}
                  </span>
                  <span className={`text-[10px] ${textSubtle} block`}>Most likely</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#111725] border-white/[0.06]'}`}>
                  <span className={`text-[10px] ${textSubtle} block uppercase font-mono`}>90th Percentile</span>
                  <span className={`text-sm font-bold font-mono ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                    {formatCurrency(output.simulationData.percentile90, currency, true)}
                  </span>
                  <span className={`text-[10px] ${textSubtle} block`}>Bull market</span>
                </div>
              </div>

              {/* Histogram Distribution */}
              <div className="h-32 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={output.simulationData.distribution}>
                    <XAxis dataKey="bucket" stroke={isLight ? '#8C95A6' : '#5F6878'} fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#0C101A',
                        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: isLight ? '#11131A' : '#F7F8FC',
                      }}
                    />
                    <Bar dataKey="count" fill={isLight ? '#6948FF' : '#8B6CFF'} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && output.breakdownTable && (
            <div className={`p-4 rounded-xl border overflow-x-auto ${cardBg}`}>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isLight ? 'border-black/10 text-[#475467]' : 'border-white/[0.08] text-[#5F6878]'}`}>
                    {output.breakdownTable.headers.map((h, i) => (
                      <th key={i} className="pb-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-black/5' : 'divide-white/[0.04]'}`}>
                  {output.breakdownTable.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-white/[0.02]'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={`py-2 ${titleColor}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column 3: Primary Result & Insight Panel (Right, 3 cols) */}
        <div className={`${focusMode ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
          
          {/* Dominant Result Card */}
          <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-white to-[#F8FAFC] border-black/10'
              : 'bg-gradient-to-b from-[#111725] to-[#0C101A] border-white/[0.12]'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
              isLight ? 'bg-[#6948FF]/10' : 'bg-[#8B6CFF]/10'
            }`} />
            
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] uppercase tracking-widest font-mono ${textMuted}`}>
                {output.primaryLabel}
              </span>
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-[#00875A]' : 'bg-[#35E6A0]'}`} />
            </div>

            {/* Dominant Huge Tabular Number */}
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums my-1 ${titleColor}`}>
              {output.primaryFormatted}
            </div>

            {/* Secondary Metrics */}
            <div className={`mt-5 pt-4 border-t ${isLight ? 'border-black/10' : 'border-white/[0.07]'} space-y-3.5`}>
              {output.secondaryMetrics.map((m, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs ${textMuted} block`}>{m.label}</span>
                    {m.sublabel && (
                      <span className={`text-[10px] ${textSubtle} font-mono`}>{m.sublabel}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono tabular-nums ${titleColor}`}>
                      {m.value}
                    </span>
                    {m.delta && (
                      <span className={`text-[10px] font-mono block font-semibold ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Factual Mathematical Insights Panel */}
          {output.insights && output.insights.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-3 ${cardBg}`}>
              <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider font-mono ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Algorithmic Insights</span>
              </div>

              <div className="space-y-2.5">
                {output.insights.map((ins, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${isLight ? 'bg-[#F4F6FB] border-black/5' : 'bg-[#111725] border-white/[0.06]'}`}
                  >
                    <div className={`flex items-center gap-1.5 font-semibold ${titleColor}`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ins.type === 'success'
                            ? isLight ? 'bg-[#00875A]' : 'bg-[#35E6A0]'
                            : ins.type === 'warning'
                            ? isLight ? 'bg-[#D97706]' : 'bg-[#FFB84D]'
                            : isLight ? 'bg-[#6948FF]' : 'bg-[#8B6CFF]'
                        }`}
                      />
                      <span>{ins.title}</span>
                    </div>
                    <p className={`text-[11px] ${textMuted} leading-relaxed`}>
                      {ins.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Calculators */}
          {calculator.relatedCalculators && calculator.relatedCalculators.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-2 ${cardBg}`}>
              <span className={`text-xs font-semibold uppercase font-mono ${textSubtle}`}>
                Linked Calculators
              </span>
              <div className="space-y-1.5">
                {calculator.relatedCalculators.map((rId) => (
                  <button
                    key={rId}
                    onClick={() => onSelectRelated(rId)}
                    className={`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-[#F4F6FB] hover:bg-[#E5E7EB] border-black/5 text-[#475467] hover:text-[#11131A]'
                        : 'bg-[#111725] hover:bg-[#1a2337] border-white/[0.05] text-[#9AA3B5] hover:text-[#F7F8FC]'
                    }`}
                  >
                    <span>{rId.replace('-', ' ').toUpperCase()}</span>
                    <ArrowRight className={`w-3 h-3 ${textSubtle}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-black/15 text-[#11131A]' : 'bg-[#0C101A] border-white/20 text-[#F7F8FC]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#6948FF]/10 text-[#6948FF]">
                  <Code className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold">Embed {calculator.title} Widget</h3>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className={`text-xs px-2.5 py-1 rounded-lg border ${isLight ? 'border-black/10 hover:bg-black/5' : 'border-white/10 hover:bg-white/5'}`}
              >
                Close
              </button>
            </div>
            
            <p className={`text-xs ${textMuted}`}>
              Paste this HTML snippet into your blog, financial portal, or website to embed this interactive calculator and earn natural backlinks.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={`<iframe src="${window.location.origin}/calculator/${calculator.slug}" width="100%" height="600" frameborder="0" style="border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`}
                className={`w-full p-3 rounded-xl font-mono text-xs border ${
                  isLight ? 'bg-[#F4F6FB] border-black/10 text-[#11131A]' : 'bg-[#111725] border-white/10 text-[#29D8FF]'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const iframeCode = `<iframe src="${window.location.origin}/calculator/${calculator.slug}" width="100%" height="600" frameborder="0" style="border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`;
                  navigator.clipboard.writeText(iframeCode);
                  setEmbedCopied(true);
                  setTimeout(() => setEmbedCopied(false), 2000);
                }}
                className={`px-4 py-2 rounded-xl font-semibold text-xs text-white bg-[#6948FF] hover:bg-[#5835ea] flex items-center gap-2 cursor-pointer shadow-md`}
              >
                {embedCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {embedCopied ? 'Copied HTML Code!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
