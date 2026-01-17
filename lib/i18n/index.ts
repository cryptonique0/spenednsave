/**
 * i18n Module Exports
 * Centralized exports for all i18n functionality
 */

// Context and Provider
export { I18nProvider, I18nContext } from './i18n-context';

// Hooks
export { useI18n, useLanguage, useTranslation } from './i18n-context';

// Language Configuration
export { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  type Language,
  loadLanguagePreference,
  saveLanguagePreference,
} from './languages';

// Translation Objects (for direct access if needed)
export { en } from './en';
export { es } from './es';
export { fr } from './fr';
export { de } from './de';
export { zh } from './zh';
export { ja } from './ja';
export { pt } from './pt';
export { ru } from './ru';
export { ar } from './ar';
export { he } from './he';
