# Internationalization (i18n) Documentation

## Overview

SpendVault now includes full multi-language support using a lightweight, custom i18n implementation. The app supports 8 languages with easy language switching and persistent user preferences.

## Supported Languages

- **English** (en) 🇺🇸
- **Spanish** (es) 🇪🇸
- **French** (fr) 🇫🇷
- **German** (de) 🇩🇪
- **Chinese** (zh) 🇨🇳
- **Japanese** (ja) 🇯🇵
- **Portuguese** (pt) 🇵🇹
- **Russian** (ru) 🇷🇺

## Architecture

### File Structure

```
lib/i18n/
├── en.ts                 # English translations
├── es.ts                 # Spanish translations
├── fr.ts                 # French translations
├── de.ts                 # German translations
├── zh.ts                 # Chinese translations
├── ja.ts                 # Japanese translations
├── pt.ts                 # Portuguese translations
├── ru.ts                 # Russian translations
├── languages.ts          # Language configuration and types
└── i18n-context.tsx      # i18n context and provider
```

### Translation Structure

Each language file exports a default object with nested keys:

```typescript
export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    // ...
  },
  nav: {
    dashboard: 'Dashboard',
    // ...
  },
  // ... more sections
};
```

Translation keys use dot notation: `common.save`, `nav.dashboard`, etc.

## Usage

### In Components

#### Using the i18n Hook

```typescript
'use client';

import { useI18n } from '@/lib/i18n/use-i18n';

export function MyComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

#### Using the Language Context

```typescript
'use client';

import { useLanguage } from '@/lib/i18n/i18n-context';

export function LanguageSwitcher() {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();

  return (
    <div>
      <p>Current: {currentLanguageInfo.nativeName}</p>
      <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
        {Object.entries(languages).map(([code, info]) => (
          <option key={code} value={code}>
            {info.flag} {info.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Translation Keys Categories

The translation structure is organized into logical sections:

- **common**: Basic UI elements (Save, Cancel, Delete, etc.)
- **nav**: Navigation menu items
- **auth**: Authentication-related text
- **dashboard**: Dashboard page text
- **vaults**: Vault management text
- **guardians**: Guardian management text
- **activity**: Activity log text
- **settings**: Settings page text
- **twoFactor**: Two-factor authentication text
- **webauthn**: WebAuthn/Security key text
- **errors**: Error messages
- **success**: Success messages
- **modal**: Modal dialog text
- **forms**: Form-related text
- **breadcrumbs**: Breadcrumb navigation text
- **faq**: FAQ page text
- **help**: Help page text
- **footer**: Footer text

## Setup

### 1. Provider Setup

Wrap your application with the `I18nProvider`:

```typescript
// app/layout.tsx
import { I18nProvider } from '@/lib/i18n/i18n-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 2. Available Hooks

#### useI18n()

Returns translation function and current language:

```typescript
const { t, language } = useI18n();
```

#### useLanguage()

Returns language management functions:

```typescript
const { 
  language,           // Current language code
  setLanguage,        // Function to change language
  languages,          // All supported languages config
  currentLanguageInfo // Metadata for current language
} = useLanguage();
```

## Language Preferences

### Storage

Language preferences are automatically:
- **Saved** to localStorage when changed
- **Loaded** from localStorage on page load
- **Persisted** across browser sessions

### Default Language

The default language is English (`en`). This is used if no preference is found.

## Adding New Languages

To add a new language:

1. Create a new translation file (e.g., `lib/i18n/it.ts`)

2. Follow the same structure as existing languages:

```typescript
export const it = {
  common: {
    save: 'Salva',
    cancel: 'Annulla',
    // ... all keys from en.ts
  },
  // ... all sections
};
```

3. Update `lib/i18n/languages.ts`:

```typescript
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'ru' | 'it';

export const SUPPORTED_LANGUAGES: Record<Language, {
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}> = {
  // ... existing languages
  it: {
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
  },
};
```

4. Update `lib/i18n/i18n-context.tsx`:

```typescript
import { it } from './it';

const translations = {
  en,
  es,
  fr,
  de,
  zh,
  ja,
  pt,
  ru,
  it,
};
```

## Translation Management Best Practices

### 1. Key Naming
- Use dot notation for nested keys
- Use camelCase for key names
- Group related strings in logical sections

### 2. String Translation
- Keep strings concise and clear
- Maintain consistent terminology
- Use placeholder patterns when needed

### 3. Pluralization
For simple pluralization, consider using format strings:

```typescript
// Option 1: Multiple keys
inbox: {
  zeroMessages: 'No messages',
  oneMessage: '1 message',
  multipleMessages: '{count} messages',
}

// Option 2: Use in component
const count = messages.length;
const key = count === 0 ? 'inbox.zeroMessages' : 
            count === 1 ? 'inbox.oneMessage' : 
            'inbox.multipleMessages';
```

### 4. Date and Time Formatting
Use locale-aware formatting in components:

```typescript
const formatter = new Intl.DateTimeFormat(language);
const date = formatter.format(new Date());
```

### 5. Number Formatting
Use locale-aware number formatting:

```typescript
const formatter = new Intl.NumberFormat(language);
const number = formatter.format(1234.56);
```

## Components Using i18n

### Language Switcher Component

Located at `components/layout/language-switcher.tsx`:

```typescript
'use client';

import { useLanguage } from '@/lib/i18n/i18n-context';

export function LanguageSwitcher() {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="border rounded px-2 py-1"
      >
        {Object.entries(languages).map(([code, info]) => (
          <option key={code} value={code}>
            {info.flag} {info.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Settings Page Integration

The Settings page includes a language selection option that allows users to change their preferred language.

## Testing Translations

### Manual Testing Checklist

- [ ] Switch between all 8 languages
- [ ] Verify strings display correctly in each language
- [ ] Check that special characters render properly
- [ ] Test language switching persists on page reload
- [ ] Verify long text doesn't break UI layouts
- [ ] Test on mobile devices for text overflow

### Component Testing

```typescript
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { render } from '@testing-library/react';

describe('i18n', () => {
  it('should translate keys correctly', () => {
    const { getByText } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('should switch languages', () => {
    const { getByText } = render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestComponent />
      </I18nProvider>
    );
    
    // Switch to Spanish
    const select = getByText(/Español/);
    fireEvent.change(select, { target: { value: 'es' } });
    
    // Verify translation
    expect(getByText('Guardar')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Bundle Size
- Translation files add approximately ~50KB minified
- Each language adds ~6-7KB minified
- Lazy load non-default languages if needed

### Optimization Tips
- Don't load all translations upfront for large apps
- Consider code-splitting by language
- Use dynamic imports if supporting 50+ languages

## Common Issues and Solutions

### Issue: Translations not updating
**Solution:** Ensure component is wrapped with i18n provider and using the `useI18n()` hook.

### Issue: Key not found
**Solution:** Check key exists in all language files. Use fallback with `t('key', 'Fallback text')`.

### Issue: Layout breaks with long translations
**Solution:** Set `className="whitespace-normal break-words"` or adjust max-width constraints.

### Issue: Special characters not displaying
**Solution:** Ensure files are saved as UTF-8 encoding.

## Migration Guide

If you're migrating from hardcoded strings:

### Before
```typescript
export function MyComponent() {
  return <button>{t('save')}</button>;
}
```

### After
```typescript
'use client';

import { useI18n } from '@/lib/i18n/i18n-context';

export function MyComponent() {
  const { t } = useI18n();
  return <button>{t('common.save')}</button>;
}
```

## Future Enhancements

Potential improvements to consider:

1. **Backend Translation API**: Store translations in database
2. **Collaborative Translation**: Use translation management platform
3. **RTL Support**: Full support for Arabic, Hebrew, Urdu
4. **Pluralization Library**: Integrate with i18next or similar
5. **Translation Memory**: Reuse translations across projects
6. **Automated Translation**: Use AI for initial translations
7. **Translation Status Dashboard**: Track translation completion by language

## Resources

- [Next.js Internationalization](https://nextjs.org/learn-react/advanced/internationalization)
- [i18next Documentation](https://www.i18next.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [Web Content Accessibility Guidelines (WCAG) - Language](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)

## Support

For questions or issues with i18n:
1. Check this documentation
2. Review existing translation examples in components
3. Contact the development team
4. Submit a feature request for new languages
