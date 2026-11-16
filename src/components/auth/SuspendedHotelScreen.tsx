/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Courteous Suspension Screen for Suspended Hotel Tenants
 * Enforces data preservation without loss
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ban, ShieldCheck, Phone, Mail, ArrowRight } from 'lucide-react';

export const SuspendedHotelScreen: React.FC = () => {
  const { user, activeHotel, hotels, loginAsSuperAdmin, loginAsHotelAdmin, logout, language } = useAuth();
  const isAm = language === 'am';
  const activeFallback = hotels.find((h) => h.status === 'active' && h.subscriptionStatus === 'active');

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full p-8 rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-sm text-center space-y-6">
        <div className="w-14 h-14 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto">
          <Ban className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
            {isAm ? 'የደንበኝነት ምዝገባ መዳረሻ ታግዷል' : 'Subscription Access Suspended'}
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-1">
            {activeHotel?.name || (isAm ? 'የሆቴል የሥራ ቦታ' : 'Property Workspace')}
          </h1>
          <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-2 max-w-md mx-auto leading-relaxed">
            {isAm
              ? 'የምዝገባ ጊዜው እና የተሰጠው የችሮታ ጊዜ ስላለፈ ይህ የሆቴል መለያ በጊዜያዊነት ታግዷል።'
              : 'This property account has been placed on hold because the subscription term and configured grace period have elapsed.'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            <ShieldCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0" />
            <span>{isAm ? 'ጥብቅ የውሂብ ጥበቃ ዋስትና' : 'Strict Data Preservation Guarantee'}</span>
          </div>
          <p className="text-[#78837D] dark:text-[#92A199] leading-relaxed text-[11px]">
            {isAm
              ? 'ምንም የሆቴል መዝገቦች አልተሰረዙም ወይም አልተቀየሩም። ሁሉም የእንግዳ ሂሳቦች፣ የክፍል መዝገቦች እና ሪፖርቶች በጥንቃቄ ተጠብቀው ይገኛሉ፤ እድሳት ሲፈጸም ወዲያውኑ ይመለሳሉ።'
              : 'Zero property records have been deleted or modified. All historic guest folios, room logs, departmental reports, and accounts remain securely preserved and will be restored immediately upon reactivation.'}
          </p>
        </div>

        <div className="text-xs text-[#78837D] dark:text-[#92A199] space-y-1">
          <p>
            {isAm
              ? 'እድሳት ለመፈጸም እና መለያውን ለማስጀመር፡'
              : 'To settle renewal and reactivate this property instance:'}
          </p>
          <div className="flex items-center justify-center gap-4 text-[#202B27] dark:text-[#ECF1EE] font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#647B52]" /> support@seam.io
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#647B52]" /> +251 11 550 4900
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E6EBE7] dark:border-[#22322C] flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          {user?.isPlatformSuperAdmin ? (
            <>
              {activeFallback && (
                <button
                  type="button"
                  onClick={() => loginAsHotelAdmin(activeFallback.id)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F6F8F6] hover:bg-[#E6EBE7] dark:bg-[#192622] dark:hover:bg-[#22322C] text-[#202B27] dark:text-[#ECF1EE] rounded-lg font-medium border border-[#E6EBE7] dark:border-[#22322C]"
                >
                  {isAm ? `ወደ ${activeFallback.name} ቀይር` : `Switch to ${activeFallback.name}`}
                </button>
              )}

              <button
                type="button"
                onClick={loginAsSuperAdmin}
                className="w-full sm:w-auto px-4 py-2 bg-[#173F35] hover:bg-[#113028] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
              >
                <span>{isAm ? 'ዋና አስተዳዳሪ (መለያውን እንደገና አስጀምር)' : 'Super Admin (Reactivate Account)'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A15B]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2 bg-[#173F35] hover:bg-[#113028] text-white rounded-lg font-semibold"
            >
              {isAm ? 'ውጣ' : 'Sign Out'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
