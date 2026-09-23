import React, { useState } from 'react';
import { Network, Plus, RotateCcw, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { CurrencyConfig } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface WorkspaceNodeData {
  id: string;
  title: string;
  type: 'input' | 'formula' | 'result';
  x: number;
  y: number;
  value: number;
  unit?: string;
  isCurrency?: boolean;
  formulaLabel?: string;
  connectedTo?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface SpatialWorkspaceProps {
  currency: CurrencyConfig;
}

export const SpatialWorkspace: React.FC<SpatialWorkspaceProps> = ({ currency }) => {
  // Reactive Node Graph State
  const [grossIncome, setGrossIncome] = useState<number>(2400000); // 24 Lakh / $240k
  const [taxRate, setTaxRate] = useState<number>(25); // 25%
  const [annualExpenses, setAnnualExpenses] = useState<number>(900000); // 9 Lakh
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12%
  const [horizonYears, setHorizonYears] = useState<number>(20);

  // Derived Downstream Nodes
  const taxAmount = Math.round((grossIncome * taxRate) / 100);
  const netIncome = Math.max(0, grossIncome - taxAmount);
  const annualSavings = Math.max(0, netIncome - annualExpenses);
  const monthlySavings = Math.round(annualSavings / 12);

  // Future Value of monthly savings at expected return over horizon
  const rMonth = expectedReturn / 100 / 12;
  const nMonths = horizonYears * 12;
  const futureWealth = rMonth > 0 
    ? Math.round(monthlySavings * ((Math.pow(1 + rMonth, nMonths) - 1) / rMonth) * (1 + rMonth))
    : monthlySavings * nMonths;

  return (
    <div id="spatial-workspace-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#29D8FF] px-2 py-0.5 rounded bg-[#29D8FF]/10 border border-[#29D8FF]/20">
              REACTIVE GRAPH ENGINE
            </span>
            <span className="text-xs text-[#5F6878]">◈ SPATIAL WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F7F8FC] flex items-center gap-2">
            <Network className="w-6 h-6 text-[#29D8FF]" />
            Spatial Dependency Canvas
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3B5] mt-0.5">
            Calculation nodes linked by reactive computational wires. Modifying upstream assumptions cascades instantly downstream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#0C101A] border border-white/[0.08] text-xs font-mono text-[#35E6A0] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Reactive Engine Live</span>
          </div>
        </div>
      </div>

      {/* Visual Spatial Pipeline */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-[#080B12] border border-white/[0.08] math-grid-pattern overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#29D8FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          
          {/* Node 1: Gross Income (Input) */}
          <div className="p-5 rounded-xl bg-[#0C101A] border-2 border-[#29D8FF]/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#29D8FF] font-bold">
                [INPUT NODE 01]
              </span>
              <span className="w-2 h-2 rounded-full bg-[#29D8FF]" />
            </div>
            <h3 className="text-sm font-bold text-[#F7F8FC]">Gross Annual Salary</h3>
            <div className="text-2xl font-bold font-mono text-[#F7F8FC] tabular-nums">
              {formatCurrency(grossIncome, currency, true)}
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#5F6878] mb-1">
                <span>Adjustment</span>
                <span>{formatCurrency(grossIncome, currency)}</span>
              </div>
              <input
                type="range"
                min={500000}
                max={15000000}
                step={100000}
                value={grossIncome}
                onChange={(e) => setGrossIncome(Number(e.target.value))}
                className="w-full accent-[#29D8FF]"
              />
            </div>
          </div>

          {/* Node 2: Tax Rate & Net Income (Formula Node) */}
          <div className="p-5 rounded-xl bg-[#0C101A] border border-white/[0.1] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFB84D] font-bold">
                [TRANSFORMATION NODE 02]
              </span>
              <span className="text-[11px] font-mono text-[#5F6878]">Tax Deductions</span>
            </div>
            <h3 className="text-sm font-bold text-[#F7F8FC]">Effective Tax & Net Pay</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#5F6878] block">Tax Outflow ({taxRate}%)</span>
                <span className="text-sm font-mono font-semibold text-[#FF5D73]">
                  -{formatCurrency(taxAmount, currency, true)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#5F6878] block">Net Take-Home</span>
                <span className="text-base font-mono font-bold text-[#35E6A0]">
                  {formatCurrency(netIncome, currency, true)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#5F6878] mb-1">
                <span>Tax Rate</span>
                <span>{taxRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={45}
                step={1}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full accent-[#FFB84D]"
              />
            </div>
          </div>

          {/* Node 3: Living Expenses (Input) */}
          <div className="p-5 rounded-xl bg-[#0C101A] border border-white/[0.1] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF5D73] font-bold">
                [INPUT NODE 03]
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FF5D73]" />
            </div>
            <h3 className="text-sm font-bold text-[#F7F8FC]">Annual Living Expenses</h3>
            <div className="text-2xl font-bold font-mono text-[#F7F8FC] tabular-nums">
              {formatCurrency(annualExpenses, currency, true)}
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono text-[#5F6878] mb-1">
                <span>Burn Rate</span>
                <span>{formatCurrency(Math.round(annualExpenses / 12), currency)}/mo</span>
              </div>
              <input
                type="range"
                min={200000}
                max={5000000}
                step={50000}
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                className="w-full accent-[#FF5D73]"
              />
            </div>
          </div>

        </div>

        {/* Directed Reactive Arrow Wire */}
        <div className="flex items-center justify-center my-6 text-[#8B6CFF]/60 gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#8B6CFF]/40 to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111725] border border-[#8B6CFF]/30 text-xs font-mono text-[#8B6CFF]">
            <span>CASCADE FLOW</span>
            <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#8B6CFF]/40 to-transparent" />
        </div>

        {/* Downstream Synthesis Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          
          {/* Node 4: Investable Surplus */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-[#0C101A] to-[#111725] border border-[#35E6A0]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#35E6A0] font-bold">
                [SYNTHESIS NODE 04]
              </span>
              <span className="text-xs font-mono text-[#35E6A0]">Net - Expenses</span>
            </div>
            <h3 className="text-sm font-semibold text-[#9AA3B5]">Monthly Investable Surplus</h3>
            <div className="text-3xl font-extrabold font-mono text-[#35E6A0] tabular-nums">
              {formatCurrency(monthlySavings, currency)}/mo
            </div>
            <p className="text-xs text-[#9AA3B5]">
              Represents <span className="text-[#F7F8FC] font-semibold">{netIncome > 0 ? ((annualSavings / netIncome) * 100).toFixed(0) : 0}%</span> of your post-tax take-home pay directed to capital investments.
            </p>
          </div>

          {/* Node 5: Terminal 20-Year Wealth Projection */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-[#111725] to-[#0C101A] border-2 border-[#8B6CFF] shadow-2xl relative overflow-hidden space-y-3">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B6CFF]/15 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B6CFF] font-bold">
                [TERMINAL ACCUMULATION NODE 05]
              </span>
              <span className="text-xs font-mono text-[#8B6CFF]">{horizonYears} Years @ {expectedReturn}%</span>
            </div>
            <h3 className="text-sm font-semibold text-[#9AA3B5]">Projected Terminal Wealth</h3>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F7F8FC] tabular-nums">
              {formatCurrency(futureWealth, currency, true)}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex-1">
                <span className="text-[10px] text-[#5F6878] font-mono">Growth Rate ({expectedReturn}%)</span>
                <input
                  type="range"
                  min={6}
                  max={20}
                  step={1}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full accent-[#8B6CFF]"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#5F6878] font-mono">Horizon ({horizonYears}y)</span>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={1}
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(Number(e.target.value))}
                  className="w-full accent-[#8B6CFF]"
                />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
