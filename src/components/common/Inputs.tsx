import React from 'react';
import { CurrencyConfig } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface NumberInputProps {
  id: string;
  name: string;
  token?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  isCurrency?: boolean;
  currency?: CurrencyConfig;
  description?: string;
  isHighlighted?: boolean;
  onFocusToken?: () => void;
  theme?: 'dark' | 'light';
}

export const PrecisionInput: React.FC<NumberInputProps> = ({
  id,
  name,
  token,
  value,
  onChange,
  min = 0,
  max = 100000000,
  step = 1,
  unit,
  isCurrency = false,
  currency,
  description,
  isHighlighted = false,
  onFocusToken,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(Math.min(max, Math.max(min, num)));
    } else if (raw === '') {
      onChange(min);
    }
  };

  return (
    <div
      id={`input-container-${id}`}
      className={`p-3.5 rounded-xl transition-all duration-300 ${
        isHighlighted
          ? isLight
            ? 'bg-[#6948FF]/10 border-2 border-[#6948FF] shadow-[0_0_20px_rgba(105,72,255,0.15)]'
            : 'bg-[#8B6CFF]/10 border-2 border-[#8B6CFF] shadow-[0_0_20px_rgba(139,108,255,0.2)]'
          : isLight
            ? 'bg-white border border-black/10 hover:border-black/20 shadow-xs'
            : 'bg-[#0C101A] border border-white/[0.07] hover:border-white/[0.14]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {token && (
            <button
              type="button"
              onClick={onFocusToken}
              title={`Formula Variable: ${token}`}
              className={`w-5 h-5 rounded font-mono text-[11px] font-bold border flex items-center justify-center cursor-pointer transition-colors ${
                isLight
                  ? 'bg-[#F4F6FB] border-black/10 text-[#6948FF] hover:bg-[#6948FF] hover:text-white'
                  : 'bg-[#111725] border-white/[0.1] text-[#8B6CFF] hover:bg-[#8B6CFF] hover:text-white'
              }`}
            >
              {token}
            </button>
          )}
          <label htmlFor={id} className={`text-xs font-semibold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>
            {name}
          </label>
        </div>
        {unit && !isCurrency && (
          <span className={`text-[11px] font-mono ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>{unit}</span>
        )}
      </div>

      {description && (
        <p className={`text-[11px] ${isLight ? 'text-[#667085]' : 'text-[#5F6878]'} mb-2 leading-tight`}>{description}</p>
      )}

      {/* Main Input Control */}
      <div className="relative flex items-center">
        {isCurrency && currency && (
          <span className={`absolute left-3 text-sm font-mono font-semibold pointer-events-none select-none ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>
            {currency.symbol}
          </span>
        )}
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          className={`w-full py-2 rounded-lg text-sm font-mono font-medium border transition-all tabular-nums ${
            isLight
              ? 'bg-[#F4F6FB] text-[#11131A] border-black/10 focus:border-[#6948FF] focus:bg-white'
              : 'bg-[#111725] text-[#F7F8FC] border-white/[0.08] focus:border-[#8B6CFF]'
          } focus:outline-none ${
            isCurrency ? 'pl-8 pr-3' : 'px-3'
          }`}
        />
      </div>

      {/* Slider Control for smooth adjustment */}
      <div className="mt-3 flex items-center gap-3">
        <span className={`text-[10px] font-mono select-none ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
          {isCurrency && currency ? formatCurrency(min, currency, true) : min}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer ${isLight ? 'bg-[#E5E7EB] accent-[#6948FF]' : 'bg-[#111725] accent-[#8B6CFF]'}`}
        />
        <span className={`text-[10px] font-mono select-none ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
          {isCurrency && currency ? formatCurrency(max, currency, true) : max}
        </span>
      </div>

      {/* Quick Increment Shortcuts for Currency */}
      {isCurrency && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {[5000, 10000, 50000, 100000].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => onChange(Math.min(max, value + delta))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#F4F6FB] hover:bg-[#E5E7EB] text-[#475467] hover:text-[#11131A] border-black/5'
                  : 'bg-[#111725] hover:bg-[#1c2438] text-[#9AA3B5] hover:text-[#F7F8FC] border-white/[0.06]'
              }`}
            >
              +{delta >= 100000 ? `${delta / 100000}L` : `${delta / 1000}k`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(min)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono hover:text-[#FF5D73] ml-auto transition-colors cursor-pointer ${
              isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'
            }`}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

interface FormulaViewerProps {
  formula: string;
  tokens?: { token: string; label: string; inputId?: string; description: string }[];
  highlightedToken: string | null;
  onTokenClick: (inputId?: string, token?: string) => void;
  theme?: 'dark' | 'light';
}

export const InteractiveFormula: React.FC<FormulaViewerProps> = ({
  formula,
  tokens = [],
  highlightedToken,
  onTokenClick,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  return (
    <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-black/10 shadow-xs' : 'bg-[#0C101A] border-white/[0.07]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${isLight ? 'text-[#475467]' : 'text-[#9AA3B5]'}`}>
          Mathematical Formulation
        </span>
        <span className={`text-[11px] ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
          Click any variable to inspect input
        </span>
      </div>

      <div className={`py-2.5 px-3 rounded-lg border font-mono text-sm sm:text-base overflow-x-auto tracking-wide flex items-center gap-2 ${
        isLight ? 'bg-[#F4F6FB] border-black/5 text-[#11131A]' : 'bg-[#05060A] border-white/[0.05] text-[#F7F8FC]'
      }`}>
        <span className={`select-none font-bold ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>f(x) =</span>
        <span>{formula}</span>
      </div>

      {/* Interactive variable pill list */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {tokens.map((t) => {
          const isSelected = highlightedToken === t.token;
          return (
            <button
              key={t.token}
              type="button"
              onClick={() => onTokenClick(t.inputId, t.token)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? isLight ? 'bg-[#6948FF] text-white shadow-sm font-semibold' : 'bg-[#8B6CFF] text-white shadow-md'
                  : isLight
                    ? 'bg-[#F4F6FB] hover:bg-[#E5E7EB] text-[#475467] hover:text-[#11131A] border border-black/10'
                    : 'bg-[#111725] hover:bg-[#1a2337] text-[#9AA3B5] hover:text-[#F7F8FC] border border-white/[0.07]'
              }`}
            >
              <span className={`font-bold ${isLight ? 'text-[#00875A]' : 'text-[#29D8FF]'}`}>{t.token}</span>
              <span className="text-[11px] opacity-80">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
