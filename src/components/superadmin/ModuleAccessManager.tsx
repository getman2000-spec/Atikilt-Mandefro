/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Module Access & Feature Flags Manager for Super Admin
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { SystemModuleId } from '../../types/saas';
import { SYSTEM_MODULES } from '../../constants/saasDefaults';
import { PageHeader, StatusBadge, EmptyState } from '../ui';
import { Layers, Save, Check } from 'lucide-react';

export const ModuleAccessManager: React.FC = () => {
  const { hotels, refreshHotels, user, language } = useAuth();
  const isAm = language === 'am';
  const { toast } = useToast();
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) || hotels[0];

  const [activeModules, setActiveModules] = useState<SystemModuleId[]>(
    () => selectedHotel?.enabledModules || []
  );

  useEffect(() => {
    if (selectedHotel) {
      setActiveModules(selectedHotel.enabledModules);
    }
  }, [selectedHotel?.id]);

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    const target = hotels.find((h) => h.id === hotelId);
    if (target) {
      setActiveModules(target.enabledModules);
    }
  };

  const handleToggleModule = (modId: SystemModuleId) => {
    setActiveModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const handleSaveModules = () => {
    if (!selectedHotel) return;
    const updatedHotel = {
      ...selectedHotel,
      enabledModules: activeModules,
    };

    saasStorage.saveHotel(updatedHotel, {
      email: user?.email || 'admin@seam.io',
      fullName: user?.fullName || 'Super Admin',
      role: 'super_admin',
    });

    refreshHotels();
    toast('Module entitlements updated', {
      description: `${selectedHotel.name} now has ${activeModules.length} enabled modules.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Module Feature Flags']}
        title="Module Feature Flags"
        subtitle="Configure individual operational and financial module entitlements per subscribing property."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedHotel?.id || ''}
              onChange={(e) => handleHotelChange(e.target.value)}
              aria-label="Target hotel"
              className="px-3 py-2 text-xs font-medium seam-input"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.code}) · {h.subscriptionPlan}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSaveModules}
              disabled={!selectedHotel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Save Configuration</span>
            </button>
          </div>
        }
      />

      {!selectedHotel ? (
        <EmptyState
          icon={Layers}
          title="No property available"
          description="Onboard a hotel tenant first to configure module entitlements."
        />
      ) : (
        <>
          <div className="p-4 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{selectedHotel.name}</span>
              <span className="text-[#78837D] dark:text-[#92A199] ml-2">
                Tier: <span className="capitalize font-medium">{selectedHotel.subscriptionPlan}</span> ·{' '}
                <span className="font-mono tabular-nums">{activeModules.length}</span> of{' '}
                <span className="font-mono tabular-nums">{SYSTEM_MODULES.length}</span> entitlements enabled
              </span>
            </div>
            <StatusBadge
              label={selectedHotel.subscriptionStatus.replace('_', ' ')}
              tone={selectedHotel.subscriptionStatus === 'active' ? 'success' : 'warning'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_MODULES.map((mod) => {
              const isEnabled = activeModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleToggleModule(mod.id)}
                  className={`p-4 rounded-[10px] border text-left transition-colors flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'bg-white dark:bg-[#131D1A] border-[#173F35] dark:border-[#C6A15B]'
                      : 'bg-[#F6F8F6]/70 dark:bg-[#192622]/40 border-[#E6EBE7] dark:border-[#22322C] opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">{mod.name}</span>
                    </div>
                    <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-1 leading-relaxed">
                      {isAm && mod.descriptionAm ? mod.descriptionAm : mod.description}
                    </p>
                    <div className="mt-2 text-[11px] text-[#78837D] dark:text-[#92A199]">
                      {isAm
                        ? `መሰረታዊ: ${mod.defaultInBasic ? 'ተካትቷል' : 'አልተካተተም'} · መደበኛ: ${mod.defaultInStandard ? 'ተካትቷል' : 'አልተካተተም'} · ፕሪሚየም: ተካትቷል`
                        : `Basic: ${mod.defaultInBasic ? 'Included' : 'Excluded'} · Standard: ${mod.defaultInStandard ? 'Included' : 'Excluded'} · Premium: Included`}
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isEnabled
                        ? 'bg-[#173F35] border-[#173F35] text-[#C6A15B]'
                        : 'bg-white dark:bg-[#131D1A] border-[#E6EBE7] dark:border-[#22322C] text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
