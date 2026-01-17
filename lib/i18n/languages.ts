/**
 * Supported Languages and Localization Configuration
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'ru' | 'ar' | 'he';

export const SUPPORTED_LANGUAGES: Record<Language, {
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    direction: 'ltr',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    direction: 'ltr',
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    direction: 'ltr',
  },
  ru: {
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    direction: 'ltr',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl',
  },
  he: {
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    direction: 'rtl',
  },
};

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_NAMES = Object.entries(SUPPORTED_LANGUAGES).reduce(
  (acc, [key, value]) => {
    acc[key as Language] = value.nativeName;
    return acc;
  },
  {} as Record<Language, string>
);

/**
 * Get browser's preferred language
 */
export function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.split('-')[0];
  const lang = Object.keys(SUPPORTED_LANGUAGES).find(
    (key) => key === browserLang
  ) as Language | undefined;

  return lang || DEFAULT_LANGUAGE;
}

/**
 * Save language preference to localStorage
 */
export function saveLanguagePreference(language: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spendvault_language', language);
  }
}

/**
 * Load language preference from localStorage
 */
export function loadLanguagePreference(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const saved = localStorage.getItem('spendvault_language') as Language | null;
  return saved || DEFAULT_LANGUAGE;
}
