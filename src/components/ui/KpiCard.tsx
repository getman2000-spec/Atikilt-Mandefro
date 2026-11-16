/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise KPI Card with tabular numerals and semantic tone support
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  helper?: string;
  delta?: string;
  deltaTone?: 'positive' | 'warning' | 'critical' | 'neutral' | 'forest';
  icon?: LucideIcon;
  onClick?: () => void;
  actionLabel?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  helper,
  delta,
  deltaTone = 'neutral',
  icon: Icon,
  onClick,
  actionLabel,
}) => {
  const deltaClass =
    deltaTone === 'positive'
      ? 'text-emerald-700 dark:text-emerald-400'
      : deltaTone === 'warning'
      ? 'text-amber-700 dark:text-amber-400'
      : deltaTone === 'critical'
      ? 'text-rose-700 dark:text-rose-400'
      : deltaTone === 'forest'
      ? 'text-[#173F35] dark:text-[#C6A15B]'
      : 'text-[#78837D] dark:text-[#92A199]';

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between transition-colors ${
        onClick ? 'cursor-pointer hover:border-[#647B52] dark:hover:border-[#7B9666]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#78837D] dark:text-[#92A199] truncate">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#202B27] dark:text-[#ECF1EE] tabular-nums font-mono">
          {value}
        </span>
        {delta && (
          <span className={`text-xs font-medium tabular-nums shrink-0 ${deltaClass}`}>
            {delta}
          </span>
        )}
      </div>

      {(helper || actionLabel) && (
        <div className="mt-2 pt-2 border-t border-[#E6EBE7]/70 dark:border-[#22322C]/70 flex items-center justify-between gap-2 text-[11px] text-[#78837D] dark:text-[#92A199]">
          <span className="truncate">{helper}</span>
          {actionLabel && (
            <span className="font-medium text-[#173F35] dark:text-[#C6A15B] whitespace-nowrap shrink-0">
              {actionLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
