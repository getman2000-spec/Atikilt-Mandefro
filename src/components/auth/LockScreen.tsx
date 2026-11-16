/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Inactive Session Lock Screen with Password / Re-Authentication Verification
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, LogOut, AlertCircle } from 'lucide-react';
import { SeamCipherLogo } from '../common/SeamCipherLogo';

export const LockScreen: React.FC = () => {
  const { user, unlockWithSecret, signInWithGoogle, logout, language, toggleLanguage } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const isAm = language === 'am';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await unlockWithSecret(pin);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1412]/80 backdrop-blur-md">
      <div className="max-w-sm w-full p-6 rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-2xl text-center space-y-5">
        <div className="flex justify-end" data-no-translate="true">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C] text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B]"
          >
            {isAm ? 'EN' : 'አማርኛ'}
          </button>
        </div>
        <SeamCipherLogo variant="compact" size="sm" showTagline={false} className="justify-center" />
        <div className="w-12 h-12 rounded-xl bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] border border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">Session Locked</h2>
          <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1">
            {isAm ? 'የተጠበቀ ክፍለ ጊዜ ለ ' : 'Protected session for '}
            <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              {user?.fullName || (isAm ? 'ተጠቃሚ' : 'User')}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleUnlock(e)} className="space-y-3 text-xs">
          <input
            type="password"
            placeholder="Enter password to unlock..."
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-3 py-2 text-center seam-input"
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold transition-colors"
          >
            <Unlock className="w-4 h-4 text-[#C6A15B]" />
            <span>Unlock Session</span>
          </button>

          {user?.authMethod === 'google' && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="w-full py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              {isAm ? 'በGoogle አረጋግጠው ይክፈቱ' : 'Re-verify with Google'}
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
};
