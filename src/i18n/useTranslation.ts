/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * React hook for bilingual English / Amharic (አማርኛ) translation across SEAM SaaS
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { translateToAmharic } from './amharicDictionary';

export function useTranslation() {
  const { language, toggleLanguage, setLanguage } = useAuth();
  const isAmharic = language === 'am';

  const t = useCallback(
    (english: string, amharicOverride?: string): string => {
      if (language !== 'am') return english;
      if (amharicOverride) return amharicOverride;
      return translateToAmharic(english);
    },
    [language]
  );

  return {
    language,
    isAmharic,
    toggleLanguage,
    setLanguage,
    t,
  };
}
