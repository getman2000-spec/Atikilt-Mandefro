/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Page Header with breadcrumb trail, property/date context, and actions
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-[#E6EBE7] dark:border-[#22322C]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#78837D] dark:text-[#92A199]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'font-medium text-[#202B27] dark:text-[#ECF1EE]'
                    : 'hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#173F35] dark:text-[#ECF1EE] leading-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-[13px] text-[#78837D] dark:text-[#92A199] mt-1.5 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {meta && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#78837D] dark:text-[#92A199] mt-2.5">
              {meta}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
};
