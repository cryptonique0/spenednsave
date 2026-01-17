/**
 * i18n Context and Hooks
 * Manages language state and translation access
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, DEFAULT_LANGUAGE, loadLanguagePreference, saveLanguagePreference, SUPPORTED_LANGUAGES } from './languages';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { zh } from './zh';
import { ja } from './ja';
import { pt } from './pt';
import { ru } from './ru';
import { ar } from './ar';
import { he } from './he';

/**
 * All translation files
 */
const translations = {
  en,
  es,
  fr,
  de,
  zh,
  ja,
  pt,
  ru,
  ar,
  he,
};

/**
 * Translation context type
 */
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
  languages: typeof SUPPORTED_LANGUAGES;
  currentLanguageInfo: (typeof SUPPORTED_LANGUAGES)[Language];
}

/**
 * Create context with undefined default
 */
export const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Get translation value from nested object
 * Example: t('common.save') → 'Save'
 */
function getNestedTranslation(obj: any, key: string, defaultValue?: string): string {
  try {
    const keys = key.split('.');
    let value = obj;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }
    
    return typeof value === 'string' ? value : (defaultValue || key);
  } catch {
    return defaultValue || key;
  }
}

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Load language preference on mount and update document attributes
  useEffect(() => {
    const savedLanguage = loadLanguagePreference();
    setLanguageState(savedLanguage);
    
    // Update document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = savedLanguage;
      document.documentElement.dir = SUPPORTED_LANGUAGES[savedLanguage].direction;
    }
    
    setMounted(true);
  }, []);

  // Update document attributes when language changes
  useEffect(() => {
    if (typeof document !== 'undefined' && mounted) {
      document.documentElement.lang = language;
      document.documentElement.dir = SUPPORTED_LANGUAGES[language].direction;
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveLanguagePreference(lang);
  };

  const t = (key: string, defaultValue?: string): string => {
    const currentTranslations = translations[language] as any;
    return getNestedTranslation(currentTranslations, key, defaultValue || key);
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageInfo: SUPPORTED_LANGUAGES[language],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n context
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  
  return context;
}

/**
 * Hook to get translation function only
 */
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}

/**
 * Hook to get current language
 */
export function useLanguage() {
  const { language, setLanguage, languages, currentLanguageInfo } = useI18n();
  return { language, setLanguage, languages, currentLanguageInfo };
}
