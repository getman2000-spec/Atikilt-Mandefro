/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Toast Notification & Accessible Confirmation Dialog Context
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
}

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; variant?: ToastVariant; durationMs?: number }) => void;
  confirmAction: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options?: { description?: string; variant?: ToastVariant; durationMs?: number }) => {
      const id = 'toast_' + Math.random().toString(36).slice(2, 9);
      const variant = options?.variant ?? 'success';
      const durationMs = options?.durationMs ?? 3800;

      setToasts((prev) => [...prev.slice(-3), { id, title, description: options?.description, variant }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  const confirmAction = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const iconFor = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirmAction }}>
      {children}

      {/* Non-intrusive bottom-right Toast Stack */}
      <div
        className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-lg text-xs transition-all"
          >
            {iconFor(item.variant)}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{item.title}</p>
              {item.description && (
                <p className="text-[#78837D] dark:text-[#92A199] mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(item.id)}
              className="p-1 rounded-md text-[#78837D] hover:text-[#202B27] dark:hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0D1412]/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  confirmState.tone === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    : confirmState.tone === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : 'bg-[#F1F4F1] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 leading-relaxed">
                  {confirmState.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
              >
                {confirmState.cancelLabel || (document.documentElement.lang === 'am' ? 'ሰርዝ' : 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmState.onConfirm;
                  setConfirmState(null);
                  cb();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 ${
                  confirmState.tone === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmState.tone === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244]'
                }`}
              >
                {confirmState.confirmLabel || (document.documentElement.lang === 'am' ? 'አረጋግጥ' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
