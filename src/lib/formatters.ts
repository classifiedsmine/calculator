import { CurrencyConfig } from '../types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', useIndianUnits: true },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', useIndianUnits: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', useIndianUnits: false },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', useIndianUnits: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', useIndianUnits: false },
};

/**
 * Formats a number according to currency rules.
 * Supports Indian numbering (Lakh, Crore) and International (K, M, B).
 */
export function formatCurrency(
  value: number,
  currency: CurrencyConfig,
  compact: boolean = false,
  showDecimals: boolean = false
): string {
  if (isNaN(value) || !isFinite(value)) return `${currency.symbol}${showDecimals ? '0.00' : '0'}`;

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (compact) {
    if (currency.useIndianUnits) {
      if (abs >= 10000000) {
        // Crores
        const cr = abs / 10000000;
        return `${sign}${currency.symbol}${cr >= 100 ? cr.toFixed(0) : cr.toFixed(2)}Cr`;
      } else if (abs >= 100000) {
        // Lakhs
        const lk = abs / 100000;
        return `${sign}${currency.symbol}${lk >= 100 ? lk.toFixed(0) : lk.toFixed(2)}L`;
      } else if (abs >= 1000) {
        return `${sign}${currency.symbol}${(abs / 1000).toFixed(1)}K`;
      }
    } else {
      if (abs >= 1000000000) {
        return `${sign}${currency.symbol}${(abs / 1000000000).toFixed(2)}B`;
      } else if (abs >= 1000000) {
        return `${sign}${currency.symbol}${(abs / 1000000).toFixed(2)}M`;
      } else if (abs >= 1000) {
        return `${sign}${currency.symbol}${(abs / 1000).toFixed(1)}K`;
      }
    }
  }

  // Standard full formatting
  const fracDigits = showDecimals ? 2 : 0;
  if (currency.useIndianUnits) {
    // Format Indian comma style: 1,00,00,000 or 46,609.57
    const fixedStr = abs.toFixed(showDecimals ? 2 : 0);
    const [intPart, decPart] = fixedStr.split('.');
    let lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${sign}${currency.symbol}${res}${decPart ? '.' + decPart : ''}`;
  } else {
    return `${sign}${currency.symbol}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: fracDigits,
      maximumFractionDigits: fracDigits,
    }).format(abs)}`;
  }
}

export function formatNumber(value: number, decimals: number = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}
