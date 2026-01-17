/**
 * Language Switcher Component
 * Allows users to change the application language
 */

'use client';

import React from 'react';
import { useLanguage, useI18n } from '@/lib/i18n/i18n-context';
import type { Language } from '@/lib/i18n/languages';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'grid' | 'inline';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className = '',
}: LanguageSwitcherProps) {
  const { language, setLanguage, languages } = useLanguage();
  const { t } = useI18n();

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <label htmlFor="language-select" className="sr-only">
          {t('settings.language')}
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     appearance-none cursor-pointer transition-colors"
          title={t('settings.language')}
        >
          {Object.entries(languages).map(([code, info]) => (
            <option key={code} value={code}>
              {showFlags ? `${info.flag} ` : ''}
              {showNativeNames ? info.nativeName : info.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {Object.entries(languages).map(([code, info]) => (
          <button
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all
              ${
                language === code
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white ' +
                    'hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            title={info.nativeName}
          >
            {showFlags && <span className="mr-1">{info.flag}</span>}
            {showNativeNames ? info.nativeName : info.name}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {Object.entries(languages).map(([code, info]) => (
          <button
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={`text-sm transition-all ${
              language === code
                ? 'text-blue-500 font-semibold underline'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={info.nativeName}
          >
            {showFlags && <span>{info.flag}</span>}
            {showNativeNames ? info.nativeName : info.name}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

/**
 * Compact language switcher with flag only
 */
export function LanguageSwitcherCompact({ className = '' }: { className?: string }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className={`flex gap-1 ${className}`}>
      {Object.entries(languages).map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLanguage(code as Language)}
          className={`text-xl p-1 rounded transition-all ${
            language === code
              ? 'bg-blue-100 dark:bg-blue-900 scale-110'
              : 'opacity-60 hover:opacity-100'
          }`}
          title={info.nativeName}
          aria-label={`Switch to ${info.nativeName}`}
        >
          {info.flag}
        </button>
      ))}
    </div>
  );
}

/**
 * Language switcher for navigation/header
 */
export function LanguageSwitcherNav({ className = '' }: { className?: string }) {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useI18n();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md 
                   hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={t('settings.language')}
      >
        <span className="text-lg">{currentLanguageInfo.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguageInfo.nativeName}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                     rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-2">
            {Object.entries(languages).map(([code, info]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as Language);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm 
                  transition-colors ${
                    language === code
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="text-lg mr-2">{info.flag}</span>
                {info.nativeName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
