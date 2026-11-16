/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared currency, date, and CSV export formatting utilities
 * Supports English (en) & Amharic (am) localization
 */

export function formatCurrency(
  amount: number,
  currencyCode = 'ETB',
  currencySymbol?: string,
  options?: { compact?: boolean; decimals?: number; language?: 'en' | 'am' }
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const decimals = options?.decimals ?? (currencyCode === 'USD' ? 2 : 0);
  const lang = options?.language || (typeof document !== 'undefined' && document.documentElement.lang === 'am' ? 'am' : 'en');
  const etbPrefix = currencySymbol || (lang === 'am' ? 'ብር' : 'Br');

  if (options?.compact && Math.abs(safeAmount) >= 1_000_000) {
    const millions = (safeAmount / 1_000_000).toFixed(2);
    return currencyCode === 'ETB'
      ? `${etbPrefix} ${millions}${lang === 'am' ? ' ሚ' : 'M'}`
      : `${currencySymbol || '$'}${millions}${lang === 'am' ? ' ሚ' : 'M'}`;
  }

  const formattedNumber = safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (currencyCode === 'ETB') {
    return `${etbPrefix} ${formattedNumber}`;
  }
  if (currencySymbol) {
    return `${currencySymbol}${formattedNumber}`;
  }
  return `${currencyCode} ${formattedNumber}`;
}

export function formatShortDate(isoDate?: string, language?: 'en' | 'am'): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const lang = language || (typeof document !== 'undefined' && document.documentElement.lang === 'am' ? 'am' : 'en');
  return d.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeAgo(isoTimestamp?: string, language?: 'en' | 'am'): string {
  if (!isoTimestamp) return '';
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return formatShortDate(isoTimestamp, language);
  const lang = language || (typeof document !== 'undefined' && document.documentElement.lang === 'am' ? 'am' : 'en');
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return lang === 'am' ? 'አሁን' : 'Just now';
  if (mins < 60) return lang === 'am' ? `ከ${mins} ደቂቃ በፊት` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'am' ? `ከ${hrs} ሰዓት በፊት` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return lang === 'am' ? `ከ${days} ቀን በፊት` : `${days}d ago`;
  return formatShortDate(isoTimestamp, lang);
}

export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | undefined | null>>
): void {
  const escape = (val: string | number | boolean | undefined | null) => {
    const s = val === null || val === undefined ? '' : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  // Prepend UTF-8 BOM so Excel displays Amharic Ethiopic characters cleanly
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Masks National ID or Passport numbers for display in list views,
 * revealing at most the final 4 characters (e.g. "••••4120").
 */
export function maskIdNumber(value?: string | null): string {
  if (!value) return '—';
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === 'PENDING-ID') return trimmed || '—';
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

