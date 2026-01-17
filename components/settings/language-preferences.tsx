/**
 * Language Preferences Component
 * Settings tab for language selection with i18n integration
 */

'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';

export function LanguagePreferences() {
  const { language, setLanguage, languages } = useLanguage();
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('settings.language')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('settings.displayName', 'Choose your preferred language')}
            </p>
          </div>
        </div>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(languages).map(([code, info]) => (
          <button
            key={code}
            onClick={() => setLanguage(code as any)}
            className={`relative p-4 rounded-lg border-2 transition-all text-left group ${
              language === code
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-border bg-card hover:border-border-hover dark:hover:border-border-hover'
            }`}
            title={info.nativeName}
          >
            {/* Checkmark for selected */}
            {language === code && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            {/* Flag and Name */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{info.flag}</span>
              <div>
                <p className="font-semibold text-foreground">{info.nativeName}</p>
                <p className="text-xs text-muted-foreground">{info.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Language Info Card */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-sm mb-2">💡 {t('help.title', 'Quick Tips')}</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>✓ {t('common.loading', 'Language changes apply instantly')}</li>
          <li>✓ {t('settings.displayName', 'Your preference is saved automatically')}</li>
          <li>✓ {t('common.add', 'All 8 languages fully translated')}</li>
        </ul>
      </div>

      {/* Supported Languages Summary */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
          {t('common.info', 'Supported Languages')}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(languages).map(([code, info]) => (
            <span
              key={code}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                language === code
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {info.flag} {code.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact language selector for inline use
 */
export function LanguagePreferencesCompact() {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();
  const { t } = useI18n();

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{t('settings.language')}</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   dark:bg-card dark:border-border transition-colors"
      >
        {Object.entries(languages).map(([code, info]) => (
          <option key={code} value={code}>
            {info.flag} {info.nativeName}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-2">
        {t('common.loading', 'Current')}: {currentLanguageInfo.nativeName}
      </p>
    </div>
  );
}
