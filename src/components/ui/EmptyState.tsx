/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean Empty State & Loading Skeleton components
 */

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="py-12 px-6 text-center rounded-[10px] border border-dashed border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A]">
      <div className="w-10 h-10 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] flex items-center justify-center mx-auto mb-3 border border-[#E6EBE7] dark:border-[#22322C]">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">{title}</h3>
      <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] flex gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="h-3 bg-[#E6EBE7] dark:bg-[#22322C] rounded w-24 animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-4 py-3.5 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 bg-[#F1F4F1] dark:bg-[#192622] rounded flex-1 animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
