/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Semantic Status Indicator (accessible icon + text pairing, restrained styling)
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, MinusCircle } from 'lucide-react';

export type StatusTone = 'success' | 'warning' | 'critical' | 'neutral' | 'forest';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
  showIcon = true,
  className = '',
}) => {
  const styles: Record<StatusTone, string> = {
    success:
      'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60',
    warning:
      'text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60',
    critical:
      'text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60',
    forest:
      'text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] border-[#E6EBE7] dark:border-[#22322C]',
    neutral:
      'text-[#78837D] dark:text-[#92A199] bg-[#F6F8F6] dark:bg-[#192622] border-[#E6EBE7] dark:border-[#22322C]',
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'warning'
      ? AlertTriangle
      : tone === 'critical'
      ? XCircle
      : tone === 'forest'
      ? Clock
      : MinusCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap shrink-0 ${styles[tone]} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
