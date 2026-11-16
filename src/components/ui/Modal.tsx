/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accessible Enterprise Modal Dialog
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1412]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6]/60 dark:bg-[#0D1412]/40 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
