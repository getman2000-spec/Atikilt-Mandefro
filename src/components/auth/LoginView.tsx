/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Sign-In Screen for SEAM Hospitality Operations Platform
 * Enforces mandatory login with Super Admin or Property Admin privilege verification.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, Globe, LockKeyhole } from 'lucide-react';
import { SeamCipherLogo } from '../common/SeamCipherLogo';

export const LoginView: React.FC = () => {
  const {
    signInWithGoogle,
    loginWithCredentials,
    authError,
    clearAuthError,
    language,
    setLanguage,
    isLoading,
  } = useAuth();
  const isAm = language === 'am';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const visibleError = error || authError;

  const handleGoogleSignIn = async () => {
    setError('');
    clearAuthError();
    const res = await signInWithGoogle();
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearAuthError();
    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setShowForgot(false);
      setResetSent(false);
      setForgotEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F6F8F6] dark:bg-[#0D1412] text-[#202B27] dark:text-[#ECF1EE]">
      <div className="max-w-md w-full p-7 sm:p-8 rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-sm space-y-6">
        <div className="flex justify-end" data-no-translate="true">
          <div className="inline-flex items-center rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                !isAm
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs'
                  : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                isAm
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] shadow-xs'
                  : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              አማርኛ
            </button>
          </div>
        </div>

        <div className="text-center flex flex-col items-center space-y-2.5 -mt-2">
          <SeamCipherLogo variant="compact" size="md" showTagline={false} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#202B27] dark:text-[#ECF1EE]">
              Sign in to SEAM
            </h1>
            <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
              Enterprise Hospitality Operations &amp; Financial Control
            </p>
          </div>
        </div>

        {visibleError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{visibleError}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] hover:border-[#173F35] dark:hover:border-[#C6A15B] text-[#202B27] dark:text-[#ECF1EE] font-semibold transition-colors disabled:opacity-60"
          >
            <Shield className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E6EBE7] dark:border-[#22322C] w-full" />
            <span className="bg-white dark:bg-[#131D1A] px-2.5 text-[11px] text-[#78837D] dark:text-[#92A199] whitespace-nowrap">
              Or sign in with property credentials
            </span>
            <div className="border-t border-[#E6EBE7] dark:border-[#22322C] w-full" />
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="name@property.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE]">Password</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[#173F35] dark:text-[#C6A15B] hover:underline text-[11px] font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white font-semibold transition-colors disabled:opacity-60"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#E6EBE7] dark:border-[#22322C]">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px] text-[#78837D] dark:text-[#92A199] leading-relaxed">
            <LockKeyhole className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
            <span>
              {isAm
                ? 'ይህ ሥርዓት የተዘጋ ነው። መግባት የሚችሉት በዋና አስተዳዳሪ (Super Admin) ወይም በሆቴል አስተዳዳሪ (Property Admin) ፈቃድ የተሰጣቸው ተጠቃሚዎች ብቻ ናቸው።'
                : 'Restricted access. Only accounts privileged by a Super Admin or Property Admin can access workspace operations.'}
            </span>
          </div>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1412]/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] rounded-[12px] max-w-sm w-full p-6 text-xs space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              Reset Account Password
            </h2>
            {resetSent ? (
              <p className="text-emerald-700 dark:text-emerald-400">
                {isAm
                  ? `የይለፍ ቃል ዳግም ማስጀመሪያ ጥያቄ ለ${forgotEmail} በሆቴል ወይም በመድረክ አስተዳዳሪዎ እንዲጸድቅ ተመዝግቧል።`
                  : `Password reset request logged. Contact your Property Admin or Super Admin for ${forgotEmail} credential renewal.`}
              </p>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-[#78837D] dark:text-[#92A199]">
                  {isAm
                    ? 'የዳግም ማስጀመሪያ ጥያቄ ለመላክ የተመዘገበ የሆቴል ወይም የመድረክ ኢሜይልዎን ያስገቡ።'
                    : 'Enter your registered hotel or platform email. Your Super Admin or Property Admin issues replacement credentials.'}
                </p>
                <input
                  type="email"
                  required
                  placeholder="name@property.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 seam-input"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
