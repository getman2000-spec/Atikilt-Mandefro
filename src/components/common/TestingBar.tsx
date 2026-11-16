/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive Persona & Tenant Switcher Bar (Restrained Enterprise Styling)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  CheckCircle2,
  RotateCcw,
  Lock,
  ChevronDown,
  X,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const TestingBar: React.FC = () => {
  const { user, hotels, loginAsSuperAdmin, loginAsHotelAdmin, refreshHotels, lockScreen } = useAuth();
  const { confirmAction, toast } = useToast();
  const [showChecklist, setShowChecklist] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  if (!user?.isPlatformSuperAdmin) {
    return null;
  }

  const handleResetData = () => {
    confirmAction({
      title: 'Reset SEAM Workspace Data?',
      description: 'This clears local browser overrides and restores the default operational seed datasets.',
      confirmLabel: 'Reset Data',
      tone: 'warning',
      onConfirm: () => {
        saasStorage.resetToDefaults();
        refreshHotels();
        loginAsSuperAdmin();
        toast('Workspace restored to default datasets', { variant: 'info' });
      },
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#173F35] hover:bg-[#113028] rounded-lg shadow-lg border border-[#C6A15B]/40 transition-colors"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#C6A15B]" />
        <span>Workspace Switcher</span>
      </button>
    );
  }

  return (
    <>
      <div className="bg-[#173F35] text-white/90 px-4 py-1.5 text-xs border-b border-[#113028] relative z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[11px] font-medium text-[#C6A15B] shrink-0">Active Persona</span>

            <div className="relative">
              <select
                value={user?.role === 'super_admin' ? 'super_admin' : user?.hotelId || 'super_admin'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'super_admin') {
                    loginAsSuperAdmin();
                  } else {
                    loginAsHotelAdmin(val);
                  }
                }}
                aria-label="Switch active persona"
                className="appearance-none pl-2.5 pr-7 py-1 rounded-md bg-[#113028] border border-white/15 text-white text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#C6A15B] cursor-pointer max-w-[260px] sm:max-w-xs truncate"
              >
                <option value="super_admin">Super Admin (Platform Governance)</option>
                {hotels.length > 0 ? (
                  hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.operationalSettings.currency} · {h.subscriptionStatus.replace('_', ' ')})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No properties provisioned
                  </option>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2 top-1.5 pointer-events-none" />
            </div>

            <span className="hidden md:inline text-[11px] text-white/70 truncate">
              {user?.role === 'super_admin'
                ? 'Platform-level visibility'
                : `Tenant scoped · ${user?.fullName || 'Hotel Admin'}`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setShowChecklist(true)}
              className="text-white/80 hover:text-[#C6A15B] transition-colors flex items-center gap-1.5 font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Capabilities</span>
            </button>

            <span className="text-white/25" aria-hidden="true">
              ·
            </span>

            <button
              type="button"
              onClick={lockScreen}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-1 font-medium"
              title="Lock session"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <span className="text-white/25" aria-hidden="true">
              ·
            </span>

            <button
              type="button"
              onClick={handleResetData}
              className="text-white/80 hover:text-rose-300 transition-colors flex items-center gap-1 font-medium"
              title="Reset sample data"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/60 hover:text-white rounded transition-colors"
              title="Minimize bar"
              aria-label="Minimize bar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1412]/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] rounded-[12px] max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#173F35] dark:text-[#C6A15B]" />
                <h3 className="text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  SEAM Multi-Tenant Architecture Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChecklist(false)}
                className="p-1 rounded text-[#78837D] hover:text-[#202B27] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              {[
                { title: 'Super Admin Platform Governance', desc: 'Tenant registry, subscriptions, manual payment verification, and audit trail.' },
                { title: 'Strict Multi-Tenant Property Isolation', desc: 'All 27 operational modules filter and persist records scoped strictly by hotelId.' },
                { title: '8-Tier RBAC Permission Engine', desc: 'Enforces view, create, edit, delete, approve, and export rights per role.' },
                { title: 'Configurable Currency & Fiscal Rules', desc: 'Supports ETB, USD, EUR, KES with configurable VAT (15%) and Service Charge (10%).' },
                { title: '27 Full-Stack Hospitality Modules', desc: 'Front Office, Housekeeping, POS, Finance, Stores, Engineering, Events, CRM/Spa, HR, BI, and more.' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C] flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{item.title}</div>
                    <div className="text-[#78837D] dark:text-[#92A199] mt-0.5">{item.desc}</div>
                  </div>
                  <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChecklist(false)}
                className="px-4 py-2 bg-[#173F35] hover:bg-[#113028] text-white font-medium rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
