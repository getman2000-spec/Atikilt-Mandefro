/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reusable Sample Data Badge and Statutory Verification Notice Banners.
 * Uses the existing restrained SEAM enterprise surface tokens.
 */

import React from 'react';
import { AlertTriangle, FlaskConical } from 'lucide-react';

interface SampleDataBadgeProps {
  label?: string;
  className?: string;
}

export const SampleDataBadge: React.FC<SampleDataBadgeProps> = ({
  label = 'Sample data',
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[#C6A15B]/45 bg-[#C6A15B]/10 text-[#8F6D2C] dark:text-[#E5C582] text-[11px] font-semibold whitespace-nowrap shrink-0 ${className}`}
  >
    <FlaskConical className="w-3 h-3 shrink-0" />
    <span>{label}</span>
  </span>
);

interface VerificationNoticeProps {
  title?: string;
  message?: string;
  tone?: 'warning' | 'info';
  className?: string;
}

export const VerificationNotice: React.FC<VerificationNoticeProps> = ({
  title = 'Verification required before operational or statutory use',
  message = 'Tax, VAT, service charge, exchange rate, and payroll calculations are reference estimates only and must be verified by a qualified accountant before live accounting or disbursement.',
  tone = 'warning',
  className = '',
}) => {
  const containerStyles =
    tone === 'warning'
      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100'
      : 'bg-[#F6F8F6] dark:bg-[#192622] border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]';

  const iconColor =
    tone === 'warning'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-[#173F35] dark:text-[#C6A15B]';

  return (
    <div
      className={`rounded-[10px] border px-4 py-3 flex items-start gap-3 text-xs ${containerStyles} ${className}`}
      role="note"
    >
      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="min-w-0 leading-relaxed">
        <div className="font-semibold">{title}</div>
        <div className="text-[#5C6661] dark:text-[#B3C0B9] mt-0.5">{message}</div>
      </div>
    </div>
  );
};
