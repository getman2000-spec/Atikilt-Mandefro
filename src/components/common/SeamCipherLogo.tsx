/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Official SEAM Master Brand Logo Component
 * Asset: /assets/aistudio/image_38c070ec.png
 * 3D Golden needle and thread sculpting the letter 'S' with metallic 'SEAM' wordmark
 * Tagline: "DETACHED TO ATTACHED OPERATIONS"
 */

import React, { useState } from 'react';

export const SEAM_LOGO_URL = '/assets/aistudio/image_38c070ec.png';

interface SeamLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const SeamIcon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#091524] border border-amber-500/30 shadow-md shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {!hasError ? (
        <img
          src={SEAM_LOGO_URL}
          alt="SEAM"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center scale-150 transform transition-transform hover:scale-160"
        />
      ) : (
        <span className="font-bold font-mono text-amber-400 text-xs tracking-tighter">
          SEAM
        </span>
      )}
    </div>
  );
};

export const SeamLogo: React.FC<SeamLogoProps> = ({
  variant = 'compact',
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  const [hasError, setHasError] = useState(false);

  // Icon only
  if (variant === 'icon') {
    const pxSize = size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'xl' ? 64 : 40;
    return <SeamIcon size={pxSize} className={className} />;
  }

  // Full Hero Emblem (for Login, Lock Screen, and Hero Portals)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="relative group overflow-hidden rounded-2xl border border-amber-500/30 shadow-2xl bg-[#071322] transition-transform duration-300 hover:scale-[1.01]">
          <img
            src={SEAM_LOGO_URL}
            alt="SEAM - Detached to Attached Operations"
            onError={() => setHasError(true)}
            className="w-full max-w-[440px] h-auto object-contain rounded-2xl block"
          />
          {hasError && (
            <div className="p-8 text-center bg-[#0B1020] rounded-2xl">
              <div className="text-3xl font-bold font-mono text-[#F5C451] tracking-widest">SEAM</div>
              <div className="text-xs font-semibold text-[#7DD3C0] mt-2 tracking-wider">
                DETACHED TO ATTACHED OPERATIONS
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Badge variant (pill badge)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091524]/90 border border-amber-500/30 shadow-md ${className}`}>
        <img
          src={SEAM_LOGO_URL}
          alt="SEAM"
          className="w-7 h-7 object-cover rounded-md scale-140 shrink-0"
        />
        <div className="flex flex-col leading-none">
          <span className="font-bold tracking-wider text-amber-300 text-xs font-mono">SEAM</span>
          <span className="text-[9px] text-[#7DD3C0] font-semibold tracking-wide">OPERATIONS</span>
        </div>
      </div>
    );
  }

  // Compact variant (standard navigation header & drawers)
  const imgHeight = size === 'xs' ? 'h-7' : size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : size === 'xl' ? 'h-16' : 'h-11';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#091524] shadow-md shrink-0 flex items-center justify-center p-0.5">
        <img
          src={SEAM_LOGO_URL}
          alt="SEAM"
          onError={() => setHasError(true)}
          className={`${imgHeight} w-auto object-cover rounded-lg`}
        />
      </div>
      {showTagline && (
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-extrabold tracking-wider text-amber-300 text-sm font-sans drop-shadow-xs">
            SEAM
          </span>
          <span className="text-[9px] text-[#7DD3C0] font-bold tracking-widest uppercase">
            Detached to Attached Operations
          </span>
        </div>
      )}
    </div>
  );
};

// Aliases for seamless backward compatibility
export const SeamCipherIcon = SeamIcon;
export const SeamCipherLogo = SeamLogo;
