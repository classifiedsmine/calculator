import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  HelpCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  Building2,
  Heart,
  BookOpen,
  PieChart as PieChartIcon,
  BarChart2,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  runIncomeTaxEngine,
  IncomeTaxInputs,
  AssessmentYear,
  AgeCategory,
  ResidentialStatus,
  parseTaxNaturalQuery,
} from '../../lib/taxEngine';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { CurrencyConfig } from '../../types';

interface IncomeTaxOSProps {
  currency: CurrencyConfig;
  theme: 'dark' | 'light';
  currentInputs?: Record<string, any>;
  onApplyInputs?: (inputs: Record<string, any>) => void;
}

export const IncomeTaxOS: React.FC<IncomeTaxOSProps> = ({
  currency,
  theme,
  currentInputs,
  onApplyInputs,
}) => {
  const isLight = theme === 'light';

  // 1. Inputs State
  const [assessmentYear, setAssessmentYear] = useState<AssessmentYear>('AY 2026-27');
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('below_60');
  const [residentialStatus, setResidentialStatus] = useState<ResidentialStatus>('resident');

  // Income Sources
  const [grossSalary, setGrossSalary] = useState<number>(1800000);
  const [basicSalary, setBasicSalary] = useState<number>(900000);
  const [isCustomBasic, setIsCustomBasic] = useState<boolean>(false);
  const [hraReceived, setHraReceived] = useState<number>(360000);
  const [rentPaidAnnual, setRentPaidAnnual] = useState<number>(240000);
  const [isMetroCity, setIsMetroCity] = useState<boolean>(true);
  const [employerNps, setEmployerNps] = useState<number>(90000);
  const [professionalTax, setProfessionalTax] = useState<number>(2500);

  // House Property
  const [propertyType, setPropertyType] = useState<'self_occupied' | 'let_out' | 'none'>('self_occupied');
  const [homeLoanInterestSelf, setHomeLoanInterestSelf] = useState<number>(150000);

  // Capital Gains & Other Sources
  const [stcgEquity, setStcgEquity] = useState<number>(0);
  const [ltcgEquity, setLtcgEquity] = useState<number>(0);
  const [businessIncome, setBusinessIncome] = useState<number>(0);
  const [savingsInterest, setSavingsInterest] = useState<number>(15000);
  const [fdInterest, setFdInterest] = useState<number>(0);

  // Deductions (Old Regime)
  const [deductions80C, setDeductions80C] = useState<number>(150000);
  const [npsEmployee80CCD1B, setNpsEmployee80CCD1B] = useState<number>(50000);
  const [healthInsuranceSelf, setHealthInsuranceSelf] = useState<number>(25000);
  const [healthInsuranceParents, setHealthInsuranceParents] = useState<number>(25000);
  const [educationLoanInterest80E, setEducationLoanInterest80E] = useState<number>(0);

  // UI Active Section Tab
  const [activeTab, setActiveTab] = useState<'salary' | 'house_property' | 'other_income' | 'deductions'>('salary');
  const [showSlabBreakdown, setShowSlabBreakdown] = useState<boolean>(false);

  // Natural Language Prompt State
  const [naturalQuery, setNaturalQuery] = useState<string>('');
  const [queryAppliedAlert, setQueryAppliedAlert] = useState<string | null>(null);

  // Auto-sync basic salary unless user customized it
  const handleGrossSalaryChange = (val: number) => {
    setGrossSalary(val);
    if (!isCustomBasic) {
      const autoBasic = Math.round(val * 0.5);
      setBasicSalary(autoBasic);
      setHraReceived(Math.round(autoBasic * 0.4));
    }
  };

  // Compile inputs object
  const taxInputs: IncomeTaxInputs = useMemo(
    () => ({
      assessmentYear,
      ageCategory,
      residentialStatus,
      taxpayerCategory: 'individual',
      grossSalary,
      basicSalary,
      hraReceived,
      rentPaidAnnual,
      isMetroCity,
      employerNpsContribution: employerNps,
      professionalTax,
      propertyType,
      homeLoanInterestSelf,
      stcgEquity,
      ltcgEquity,
      businessIncome,
      savingsInterest,
      fdInterest,
      deductions80C,
      npsEmployee80CCD1B,
      healthInsuranceSelf,
      healthInsuranceParents,
      educationLoanInterest80E,
    }),
    [
      assessmentYear,
      ageCategory,
      residentialStatus,
      grossSalary,
      basicSalary,
      hraReceived,
      rentPaidAnnual,
      isMetroCity,
      employerNps,
      professionalTax,
      propertyType,
      homeLoanInterestSelf,
      stcgEquity,
      ltcgEquity,
      businessIncome,
      savingsInterest,
      fdInterest,
      deductions80C,
      npsEmployee80CCD1B,
      healthInsuranceSelf,
      healthInsuranceParents,
      educationLoanInterest80E,
    ]
  );

  // Run Calculation Engine
  const results = useMemo(() => runIncomeTaxEngine(taxInputs), [taxInputs]);

  // Handle Natural Language Parse Query
  const handleApplyQuery = () => {
    if (!naturalQuery.trim()) return;
    const parsed = parseTaxNaturalQuery(naturalQuery, taxInputs);
    if (parsed.grossSalary !== undefined) handleGrossSalaryChange(parsed.grossSalary);
    if (parsed.deductions80C !== undefined) setDeductions80C(parsed.deductions80C);
    if (parsed.healthInsuranceSelf !== undefined) setHealthInsuranceSelf(parsed.healthInsuranceSelf);
    if (parsed.homeLoanInterestSelf !== undefined) {
      setPropertyType('self_occupied');
      setHomeLoanInterestSelf(parsed.homeLoanInterestSelf);
    }
    if (parsed.ageCategory) setAgeCategory(parsed.ageCategory);
    if (parsed.assessmentYear) setAssessmentYear(parsed.assessmentYear);

    setQueryAppliedAlert('Applied natural language query to tax model!');
    setTimeout(() => setQueryAppliedAlert(null), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['CALCULA X - Income Tax Old vs New Regime Comparison Report'],
      [`Assessment Year: ${assessmentYear}`],
      [`Gross Salary: ${formatCurrency(grossSalary, currency)}`],
      [''],
      ['Metric', 'Old Tax Regime', 'New Tax Regime'],
      ['Gross Total Income', oldRegime.grossTotalIncome, newRegime.grossTotalIncome],
      ['Exemptions & Adjustments', oldRegime.totalExemptionsAndAdjustments, newRegime.totalExemptionsAndAdjustments],
      ['Eligible Deductions', oldRegime.totalDeductionsAllowed, newRegime.totalDeductionsAllowed],
      ['Net Taxable Income', oldRegime.netTaxableIncome, newRegime.netTaxableIncome],
      ['Tax Before Rebate', oldRegime.taxBeforeRebate, newRegime.taxBeforeRebate],
      ['Section 87A Rebate', oldRegime.rebate87A, newRegime.rebate87A],
      ['Surcharge', oldRegime.surcharge, newRegime.surcharge],
      ['Health & Education Cess (4%)', oldRegime.healthAndEducationCess, newRegime.healthAndEducationCess],
      ['TOTAL ESTIMATED TAX', oldRegime.totalTaxLiability, newRegime.totalTaxLiability],
      ['Annual Post-Tax Income', oldRegime.takeHomeAnnual, newRegime.takeHomeAnnual],
      ['Monthly Post-Tax Pay', oldRegime.takeHomeMonthly, newRegime.takeHomeMonthly],
      ['Recommended Regime', results.recommendedRegime.toUpperCase()],
      [`Tax Savings: ${formatCurrency(results.taxSavings, currency)}`],
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Income_Tax_Report_${assessmentYear.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const oldRegime = results.oldRegime;
  const newRegime = results.newRegime;

  return (
    <div className="space-y-8 my-6" id="tax-calculator-os-root">
      {/* 1. Header & Quick Presets Control Bar */}
      <div
        className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFB84D]/10 text-[#FFB84D] border border-[#FFB84D]/20">
                FY 2025–26 / FY 2024–25 Tax Act Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Official Slabs Included
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Income Tax Calculator – Old vs New Regime
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
              Compare Old Tax Regime vs New Tax Regime side-by-side with Sec 87A rebates, 80C, 80D, HRA exemptions, and home loan deductions.
            </p>
          </div>

          {/* Assessment Year Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
              isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
            }`}>
              {(['AY 2026-27', 'AY 2025-26', 'AY 2024-25'] as AssessmentYear[]).map((year) => (
                <button
                  key={year}
                  onClick={() => setAssessmentYear(year)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    assessmentYear === year
                      ? 'bg-[#6948FF] text-white shadow-md'
                      : isLight
                      ? 'text-[#667085] hover:text-[#11131A]'
                      : 'text-[#9AA3B5] hover:text-white'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'bg-white hover:bg-black/5 text-[#11131A] border-black/10 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Natural Language Prompt Query Input */}
        <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6948FF]" />
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyQuery()}
              placeholder="e.g. Salary 20 Lakhs with 1.5L 80C and 50k health insurance in AY 2026-27..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
                isLight
                  ? 'bg-black/5 border-black/10 text-[#11131A] placeholder:text-[#667085] focus:bg-white focus:ring-2 focus:ring-[#6948FF]'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-[#9AA3B5] focus:bg-[#05060A] focus:ring-2 focus:ring-[#8B6CFF]'
              }`}
            />
          </div>
          <button
            onClick={handleApplyQuery}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#6948FF] hover:bg-[#5835ea] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Parse & Calculate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {queryAppliedAlert && (
          <div className="mt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{queryAppliedAlert}</span>
          </div>
        )}
      </div>

      {/* 2. Hero Side-By-Side Comparison Winner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Regime Banner & Summary */}
        <div className="lg:col-span-12">
          <div
            className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
              results.recommendedRegime === 'new'
                ? isLight
                  ? 'bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-300'
                  : 'bg-gradient-to-r from-emerald-950/40 via-[#0C101A] to-blue-950/40 border-emerald-500/30'
                : results.recommendedRegime === 'old'
                ? isLight
                  ? 'bg-gradient-to-r from-purple-50 via-white to-amber-50 border-purple-300'
                  : 'bg-gradient-to-r from-purple-950/40 via-[#0C101A] to-amber-950/40 border-purple-500/30'
                : isLight
                ? 'bg-white border-black/10'
                : 'bg-[#0C101A] border-white/10'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500">
                    Regime Recommendation
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                  <span>
                    {results.recommendedRegime === 'new'
                      ? 'New Tax Regime is Better'
                      : results.recommendedRegime === 'old'
                      ? 'Old Tax Regime is Better'
                      : 'Both Tax Regimes Yield Identical Tax'}
                  </span>
                  {results.recommendedRegime !== 'equal' && (
                    <span className="text-sm px-3 py-1 rounded-full bg-emerald-500 text-white font-bold font-mono">
                      Save {formatCurrency(results.taxSavings, currency)}
                    </span>
                  )}
                </h3>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                  {results.recommendedRegime === 'new'
                    ? `By opting for the New Tax Regime in ${assessmentYear}, you reduce your total tax liability by ${formatCurrency(
                        results.taxSavings,
                        currency
                      )} compared to the Old Regime.`
                    : results.recommendedRegime === 'old'
                    ? `Your total deductions (${formatCurrency(
                        oldRegime.totalDeductionsAllowed,
                        currency
                      )}) make the Old Tax Regime more beneficial, saving you ${formatCurrency(
                        results.taxSavings,
                        currency
                      )}.`
                    : 'Your deduction level matches the break-even threshold perfectly.'}
                </p>
              </div>

              {/* Key Highlights Quick Badges */}
              <div className="flex flex-wrap md:flex-nowrap gap-3 text-center">
                <div className={`p-4 rounded-2xl border flex-1 min-w-[130px] ${
                  isLight ? 'bg-white/80 border-black/10' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`block text-[11px] font-mono ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    New Regime Tax
                  </span>
                  <span className="text-lg font-black text-emerald-500">
                    {formatCurrency(newRegime.totalTaxLiability, currency)}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border flex-1 min-w-[130px] ${
                  isLight ? 'bg-white/80 border-black/10' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`block text-[11px] font-mono ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    Old Regime Tax
                  </span>
                  <span className="text-lg font-black text-[#6948FF]">
                    {formatCurrency(oldRegime.totalTaxLiability, currency)}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border flex-1 min-w-[130px] ${
                  isLight ? 'bg-white/80 border-black/10' : 'bg-white/5 border-white/10'
                }`}>
                  <span className={`block text-[11px] font-mono ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    Monthly Take-Home
                  </span>
                  <span className="text-lg font-black text-blue-500">
                    {formatCurrency(
                      results.recommendedRegime === 'new' ? newRegime.takeHomeMonthly : oldRegime.takeHomeMonthly,
                      currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Detailed Side-By-Side Comparison Matrix Table */}
        <div className="lg:col-span-12">
          <div className={`rounded-3xl border shadow-xl overflow-hidden ${
            isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'
          }`}>
            <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#6948FF]" />
                <h4 className="font-bold text-sm sm:text-base">Statutory Old vs New Tax Regime Breakdown Table</h4>
              </div>
              <span className="text-xs font-mono text-emerald-500 font-bold">
                {assessmentYear} Slabs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className={`border-b font-mono font-bold text-xs ${
                    isLight ? 'bg-black/5 border-black/10 text-[#667085]' : 'bg-white/5 border-white/10 text-[#9AA3B5]'
                  }`}>
                    <th className="p-3.5 pl-6">Calculation Metric</th>
                    <th className="p-3.5 text-right font-black text-[#6948FF]">Old Tax Regime</th>
                    <th className="p-3.5 text-right font-black text-emerald-500">New Tax Regime</th>
                    <th className="p-3.5 text-right pr-6">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  <tr>
                    <td className="p-3.5 pl-6 font-medium">Gross Annual Income (CTC)</td>
                    <td className="p-3.5 text-right font-mono font-semibold">{formatCurrency(oldRegime.grossTotalIncome, currency)}</td>
                    <td className="p-3.5 text-right font-mono font-semibold">{formatCurrency(newRegime.grossTotalIncome, currency)}</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 pl-6 font-medium text-amber-600 dark:text-amber-400">
                      Standard Deduction & Salary Exemptions
                    </td>
                    <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      -{formatCurrency(oldRegime.totalExemptionsAndAdjustments, currency)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      -{formatCurrency(newRegime.totalExemptionsAndAdjustments, currency)}
                    </td>
                    <td className="p-3.5 text-right pr-6 font-mono text-emerald-500 font-semibold">
                      +{formatCurrency(newRegime.totalExemptionsAndAdjustments - oldRegime.totalExemptionsAndAdjustments, currency)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3.5 pl-6 font-medium text-purple-600 dark:text-purple-400">
                      Eligible 80C/80D/80E/Home Loan Deductions
                    </td>
                    <td className="p-3.5 text-right font-mono text-purple-600 dark:text-purple-400">
                      -{formatCurrency(oldRegime.totalDeductionsAllowed, currency)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[#667085] dark:text-[#9AA3B5]">
                      -{formatCurrency(newRegime.totalDeductionsAllowed, currency)}
                    </td>
                    <td className="p-3.5 text-right pr-6 font-mono text-purple-500 font-semibold">
                      -{formatCurrency(oldRegime.totalDeductionsAllowed - newRegime.totalDeductionsAllowed, currency)}
                    </td>
                  </tr>

                  <tr className={`font-bold ${isLight ? 'bg-black/[0.02]' : 'bg-white/[0.02]'}`}>
                    <td className="p-3.5 pl-6 font-mono">Net Taxable Income</td>
                    <td className="p-3.5 text-right font-mono text-[#6948FF]">{formatCurrency(oldRegime.netTaxableIncome, currency)}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-500">{formatCurrency(newRegime.netTaxableIncome, currency)}</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">
                      {formatCurrency(newRegime.netTaxableIncome - oldRegime.netTaxableIncome, currency)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3.5 pl-6">Income Tax Before Rebate</td>
                    <td className="p-3.5 text-right font-mono">{formatCurrency(oldRegime.taxBeforeRebate, currency)}</td>
                    <td className="p-3.5 text-right font-mono">{formatCurrency(newRegime.taxBeforeRebate, currency)}</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">—</td>
                  </tr>

                  <tr>
                    <td className="p-3.5 pl-6 text-emerald-600 dark:text-emerald-400">
                      Section 87A Tax Rebate
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(oldRegime.rebate87A, currency)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(newRegime.rebate87A, currency)}
                    </td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">—</td>
                  </tr>

                  {(oldRegime.surcharge > 0 || newRegime.surcharge > 0) && (
                    <tr>
                      <td className="p-3.5 pl-6">Surcharge (High Income)</td>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(oldRegime.surcharge, currency)}</td>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(newRegime.surcharge, currency)}</td>
                      <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">—</td>
                    </tr>
                  )}

                  <tr>
                    <td className="p-3.5 pl-6">Health & Education Cess (4%)</td>
                    <td className="p-3.5 text-right font-mono">{formatCurrency(oldRegime.healthAndEducationCess, currency)}</td>
                    <td className="p-3.5 text-right font-mono">{formatCurrency(newRegime.healthAndEducationCess, currency)}</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">—</td>
                  </tr>

                  <tr className={`font-black text-base ${
                    isLight ? 'bg-[#6948FF]/5 border-t-2 border-black/10' : 'bg-[#8B6CFF]/10 border-t-2 border-white/10'
                  }`}>
                    <td className="p-4 pl-6">TOTAL ESTIMATED TAX LIABILITY</td>
                    <td className={`p-4 text-right font-mono ${results.recommendedRegime === 'old' ? 'text-emerald-500' : 'text-[#6948FF]'}`}>
                      {formatCurrency(oldRegime.totalTaxLiability, currency)}
                    </td>
                    <td className={`p-4 text-right font-mono ${results.recommendedRegime === 'new' ? 'text-emerald-500' : 'text-[#6948FF]'}`}>
                      {formatCurrency(newRegime.totalTaxLiability, currency)}
                    </td>
                    <td className="p-4 text-right pr-6 font-mono text-emerald-500 font-extrabold">
                      {formatCurrency(results.taxSavings, currency)} {results.recommendedRegime !== 'equal' ? 'Savings' : ''}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3.5 pl-6 font-semibold">Effective Tax Rate (% Gross Income)</td>
                    <td className="p-3.5 text-right font-mono font-bold">{oldRegime.effectiveTaxRate}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-500">{newRegime.effectiveTaxRate}%</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-[#667085] dark:text-[#9AA3B5]">
                      {(oldRegime.effectiveTaxRate - newRegime.effectiveTaxRate).toFixed(1)}%
                    </td>
                  </tr>

                  <tr className="font-semibold">
                    <td className="p-3.5 pl-6">Estimated Post-Tax Monthly Pay</td>
                    <td className="p-3.5 text-right font-mono text-[#6948FF]">{formatCurrency(oldRegime.takeHomeMonthly, currency)}/mo</td>
                    <td className="p-3.5 text-right font-mono text-emerald-500">{formatCurrency(newRegime.takeHomeMonthly, currency)}/mo</td>
                    <td className="p-3.5 text-right pr-6 font-mono text-emerald-500">
                      +{formatCurrency(Math.abs(newRegime.takeHomeMonthly - oldRegime.takeHomeMonthly), currency)}/mo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Toggle Slab Inspector Button */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                Want to see exact tax bracket slabs for each regime?
              </span>
              <button
                onClick={() => setShowSlabBreakdown((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#6948FF] hover:underline"
              >
                <span>{showSlabBreakdown ? 'Hide Slab Inspection' : 'Inspect Tax Slabs'}</span>
                {showSlabBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expanded Slab Inspection Panel */}
            {showSlabBreakdown && (
              <div className="p-6 border-t border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/[0.03] dark:bg-white/[0.03]">
                {/* Old Regime Slabs */}
                <div>
                  <h5 className="font-bold text-xs uppercase font-mono text-[#6948FF] mb-3">
                    Old Regime Bracket Breakdown
                  </h5>
                  <div className="space-y-2">
                    {oldRegime.slabBreakdown.map((s, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex justify-between text-xs font-mono ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#05060A] border-white/10'
                      }`}>
                        <div>
                          <span className="font-bold text-sm block">{s.label}</span>
                          <span className={`text-[11px] ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                            Taxable: {formatCurrency(s.taxableAmount, currency)} @ {s.rate}
                          </span>
                        </div>
                        <span className="font-black text-[#6948FF] self-center">
                          {formatCurrency(s.taxForSlab, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Regime Slabs */}
                <div>
                  <h5 className="font-bold text-xs uppercase font-mono text-emerald-500 mb-3">
                    New Regime Bracket Breakdown ({assessmentYear})
                  </h5>
                  <div className="space-y-2">
                    {newRegime.slabBreakdown.map((s, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex justify-between text-xs font-mono ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#05060A] border-white/10'
                      }`}>
                        <div>
                          <span className="font-bold text-sm block">{s.label}</span>
                          <span className={`text-[11px] ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                            Taxable: {formatCurrency(s.taxableAmount, currency)} @ {s.rate}
                          </span>
                        </div>
                        <span className="font-black text-emerald-500 self-center">
                          {formatCurrency(s.taxForSlab, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Break-Even Deduction Solver Component */}
        <div className="lg:col-span-12">
          <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
            isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-base">Tax Regime Break-Even Analysis Solver</h4>
            </div>

            <p className={`text-xs sm:text-sm mb-4 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
              To make the <strong>Old Tax Regime</strong> cheaper than or equal to the New Tax Regime for a salary of{' '}
              <strong>{formatCurrency(grossSalary, currency)}</strong>, you need total eligible deductions & exemptions of at least:
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-500 font-bold block">
                  Required Break-Even Deductions
                </span>
                <span className="text-2xl font-black text-amber-500 font-mono">
                  {formatCurrency(results.breakEvenDeductionOldRegime, currency)}
                </span>
              </div>

              <div className="text-right">
                <span className={`text-xs block font-mono ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                  Your Current Total Deductions
                </span>
                <span className="text-xl font-bold font-mono">
                  {formatCurrency(oldRegime.totalDeductionsAllowed, currency)}
                </span>
              </div>
            </div>

            {/* Deduction Progress Comparison Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono font-medium">
                <span>Deduction Gap Progress</span>
                <span className={results.additionalDeductionsNeededForOldRegime === 0 ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                  {results.additionalDeductionsNeededForOldRegime === 0
                    ? 'Break-even Reached! Old Regime Wins'
                    : `Need ${formatCurrency(results.additionalDeductionsNeededForOldRegime, currency)} more deductions`}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    results.additionalDeductionsNeededForOldRegime === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (oldRegime.totalDeductionsAllowed / (results.breakEvenDeductionOldRegime || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Interactive Tabbed Input Panel */}
        <div className="lg:col-span-12">
          <div className={`p-6 rounded-3xl border shadow-xl ${
            isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/10 dark:border-white/10 pb-4">
              <h4 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#6948FF]" />
                <span>Customize Income Sources & Eligible Deductions</span>
              </h4>

              {/* Category Tabs */}
              <div className={`p-1 rounded-2xl border flex flex-wrap gap-1 ${
                isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
              }`}>
                {[
                  { id: 'salary', label: 'Salary & CTC' },
                  { id: 'house_property', label: 'House Property' },
                  { id: 'other_income', label: 'Capital Gains & Other' },
                  { id: 'deductions', label: '80C / 80D Deductions' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#6948FF] text-white shadow-md'
                        : isLight
                        ? 'text-[#667085] hover:text-[#11131A]'
                        : 'text-[#9AA3B5] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Salary & CTC Inputs */}
            {activeTab === 'salary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Annual Gross Income / CTC
                  </label>
                  <input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => handleGrossSalaryChange(Number(e.target.value))}
                    step={25000}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                  <input
                    type="range"
                    min={300000}
                    max={10000000}
                    step={50000}
                    value={grossSalary}
                    onChange={(e) => handleGrossSalaryChange(Number(e.target.value))}
                    className="w-full mt-2 accent-[#6948FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 flex justify-between">
                    <span>Basic Salary + DA</span>
                    <button
                      onClick={() => setIsCustomBasic(!isCustomBasic)}
                      className="text-[11px] text-[#6948FF] underline"
                    >
                      {isCustomBasic ? 'Auto 50%' : 'Custom'}
                    </button>
                  </label>
                  <input
                    type="number"
                    value={basicSalary}
                    disabled={!isCustomBasic}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      !isCustomBasic ? 'opacity-60 cursor-not-allowed' : ''
                    } ${isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    HRA Received (Annual)
                  </label>
                  <input
                    type="number"
                    value={hraReceived}
                    onChange={(e) => setHraReceived(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Annual Rent Paid (for HRA)
                  </label>
                  <input
                    type="number"
                    value={rentPaidAnnual}
                    onChange={(e) => setRentPaidAnnual(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    City Type for HRA Exemption
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsMetroCity(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        isMetroCity
                          ? 'bg-[#6948FF] text-white border-[#6948FF]'
                          : isLight
                          ? 'bg-black/5 border-black/10'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      Metro (50%)
                    </button>
                    <button
                      onClick={() => setIsMetroCity(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        !isMetroCity
                          ? 'bg-[#6948FF] text-white border-[#6948FF]'
                          : isLight
                          ? 'bg-black/5 border-black/10'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      Non-Metro (40%)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Employer NPS 80CCD(2) Contribution
                  </label>
                  <input
                    type="number"
                    value={employerNps}
                    onChange={(e) => setEmployerNps(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                  <span className={`text-[11px] block mt-1 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    Allowed in BOTH regimes up to 10% of Basic
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: House Property Inputs */}
            {activeTab === 'house_property' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    House Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                      isLight ? 'bg-white border-black/10' : 'bg-[#05060A] border-white/10'
                    }`}
                  >
                    <option value="self_occupied">Self Occupied (Home Loan Interest)</option>
                    <option value="let_out">Let Out (Rental Income & Loan Interest)</option>
                    <option value="none">None / Rented</option>
                  </select>
                </div>

                {propertyType === 'self_occupied' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Home Loan Interest Paid (Sec 24b)
                    </label>
                    <input
                      type="number"
                      value={homeLoanInterestSelf}
                      onChange={(e) => setHomeLoanInterestSelf(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                        isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                      }`}
                    />
                    <span className={`text-[11px] block mt-1 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                      Max ₹2,00,000 deduction allowed in Old Regime
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Capital Gains & Other Sources Inputs */}
            {activeTab === 'other_income' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Short-Term Capital Gains Equity (STCG)
                  </label>
                  <input
                    type="number"
                    value={stcgEquity}
                    onChange={(e) => setStcgEquity(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Long-Term Capital Gains Equity (LTCG)
                  </label>
                  <input
                    type="number"
                    value={ltcgEquity}
                    onChange={(e) => setLtcgEquity(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Savings Account Interest (Sec 80TTA/TTB)
                  </label>
                  <input
                    type="number"
                    value={savingsInterest}
                    onChange={(e) => setSavingsInterest(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Deductions (Old Regime) */}
            {activeTab === 'deductions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Section 80C Investments (EPF, PPF, ELSS, LIC)
                  </label>
                  <input
                    type="number"
                    value={deductions80C}
                    onChange={(e) => setDeductions80C(Number(e.target.value))}
                    max={150000}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                  <span className={`text-[11px] block mt-1 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    Capped at ₹1,50,000 max
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Section 80CCD(1B) NPS Employee Additional
                  </label>
                  <input
                    type="number"
                    value={npsEmployee80CCD1B}
                    onChange={(e) => setNpsEmployee80CCD1B(Number(e.target.value))}
                    max={50000}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                  <span className={`text-[11px] block mt-1 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                    Capped at ₹50,000 max
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Section 80D Health Insurance (Self & Family)
                  </label>
                  <input
                    type="number"
                    value={healthInsuranceSelf}
                    onChange={(e) => setHealthInsuranceSelf(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Section 80D Health Insurance (Parents)
                  </label>
                  <input
                    type="number"
                    value={healthInsuranceParents}
                    onChange={(e) => setHealthInsuranceParents(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Section 80E Education Loan Interest
                  </label>
                  <input
                    type="number"
                    value={educationLoanInterest80E}
                    onChange={(e) => setEducationLoanInterest80E(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                      isLight ? 'bg-white border-black/10' : 'bg-black/20 border-white/10'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Scenario Analysis Matrix */}
        <div className="lg:col-span-12">
          <div className={`p-6 rounded-3xl border shadow-xl ${
            isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-[#6948FF]" />
              <h4 className="font-bold text-base">Tax Regime Scenario Matrix</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    sc.id === 'current_inputs'
                      ? 'border-[#6948FF] ring-2 ring-[#6948FF]/20 bg-[#6948FF]/5'
                      : isLight
                      ? 'bg-black/[0.02] border-black/10'
                      : 'bg-white/[0.02] border-white/10'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold font-mono block mb-1 text-[#6948FF]">
                      {sc.title}
                    </span>
                    <p className={`text-[11px] mb-3 ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>
                      {sc.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-black/10 dark:border-white/10 pt-3 text-xs font-mono">
                    <div className="flex justify-between">
                      <span>Old Tax:</span>
                      <span className="font-bold">{formatCurrency(sc.oldTax, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Tax:</span>
                      <span className="font-bold text-emerald-500">{formatCurrency(sc.newTax, currency)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-black/5 dark:border-white/5 font-bold">
                      <span>Best Choice:</span>
                      <span className={sc.recommended === 'new' ? 'text-emerald-500 uppercase' : 'text-[#6948FF] uppercase'}>
                        {sc.recommended} Regime
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
