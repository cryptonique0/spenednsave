# i18n Quick Reference Card

## Installation & Setup

✅ **Already installed!** No additional packages needed.

## Basic Usage

```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t } = useI18n();
  return <button>{t('common.save')}</button>;
}
```

## Hook APIs

### `useI18n()`
```typescript
const { t, language } = useI18n();
// t: (key: string, fallback?: string) => string
// language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'ru'
```

### `useLanguage()`
```typescript
const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();
// language: current language code
// setLanguage: (lang) => void
// languages: { en: {...}, es: {...}, ... }
// currentLanguageInfo: { name, nativeName, flag, direction }
```

## Common Translation Keys

| Use | Key | Example |
|-----|-----|---------|
| Save | `common.save` | "Save" |
| Cancel | `common.cancel` | "Cancel" |
| Delete | `common.delete` | "Delete" |
| Edit | `common.edit` | "Edit" |
| Add | `common.add` | "Add" |
| Loading | `common.loading` | "Loading..." |
| Settings | `settings.title` | "Settings" |
| Email | `settings.email` | "Email" |
| Language | `settings.language` | "Language" |
| Dashboard | `nav.dashboard` | "Dashboard" |
| Vaults | `nav.vaults` | "Vaults" |
| Guardians | `nav.guardians` | "Guardians" |

## Components

### Language Switcher
```typescript
import { LanguageSwitcher } from '@/components/layout/language-switcher';

// Dropdown variant (default)
<LanguageSwitcher />

// Grid variant (for settings)
<LanguageSwitcher variant="grid" />

// Inline variant (for footers)
<LanguageSwitcher variant="inline" />

// Compact variant (flag only)
import { LanguageSwitcherCompact } from '@/components/layout/language-switcher';
<LanguageSwitcherCompact />

// Navigation variant
import { LanguageSwitcherNav } from '@/components/layout/language-switcher';
<LanguageSwitcherNav />
```

## Supported Languages

| Language | Code | Native | Flag |
|----------|------|--------|------|
| English | en | English | 🇺🇸 |
| Spanish | es | Español | 🇪🇸 |
| French | fr | Français | 🇫🇷 |
| German | de | Deutsch | 🇩🇪 |
| Chinese | zh | 中文 | 🇨🇳 |
| Japanese | ja | 日本語 | 🇯🇵 |
| Portuguese | pt | Português | 🇵🇹 |
| Russian | ru | Русский | 🇷🇺 |

## File Structure

```
lib/i18n/
├── en.ts              # English translations
├── es.ts              # Spanish translations
├── fr.ts              # French translations
├── de.ts              # German translations
├── zh.ts              # Chinese translations
├── ja.ts              # Japanese translations
├── pt.ts              # Portuguese translations
├── ru.ts              # Russian translations
├── languages.ts       # Configuration & types
├── i18n-context.tsx   # Context provider & hooks
├── use-i18n.ts        # Hook exports
└── index.ts           # Module exports

components/
└── layout/
    └── language-switcher.tsx  # UI components
```

## Translation Categories

```
common        → Save, Cancel, Delete, Edit, Add, etc.
nav           → Dashboard, Vaults, Guardians, Settings, etc.
auth          → Login, Logout, Password, 2FA, etc.
dashboard     → Welcome, Balance, Recent Activity, etc.
vaults        → Create, Edit, Delete, Withdraw, etc.
guardians     → Add, Remove, Roles, Invite, etc.
activity      → History, Filter, Export, Timestamp, etc.
settings      → Account, Security, Notifications, etc.
twoFactor     → 2FA Setup, Authenticator, Backup Codes, etc.
webauthn      → Security Keys, YubiKey, Face ID, etc.
errors        → Invalid Email, Network Error, etc.
success       → Saved, Deleted, Created, etc.
modal         → Confirm, Delete, Cancel, etc.
forms         → Required, Optional, Submit, etc.
breadcrumbs   → Home, Dashboard, Settings, etc.
faq           → Questions, Answers, Contact, etc.
help          → Getting Started, Guides, Support, etc.
footer        → Copyright, Privacy, Terms, etc.
```

## Tips & Tricks

### Default Fallback
```typescript
// If key not found, use fallback text
t('missing.key', 'Fallback text')
```

### Check Current Language
```typescript
const { language } = useI18n();
if (language === 'es') {
  // Spanish-specific logic
}
```

### Get Language Metadata
```typescript
const { currentLanguageInfo } = useLanguage();
// { name, nativeName, flag, direction }
console.log(currentLanguageInfo.nativeName) // "Español"
console.log(currentLanguageInfo.flag)       // "🇪🇸"
```

### Switch Language Programmatically
```typescript
const { setLanguage } = useLanguage();
setLanguage('fr'); // Switch to French
```

## Common Patterns

### Button with Translation
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function SaveButton() {
  const { t } = useI18n();
  return <button>{t('common.save')}</button>;
}
```

### Form with Labels
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function EmailForm() {
  const { t } = useI18n();
  return (
    <form>
      <label>{t('settings.email')}</label>
      <input type="email" />
      <button type="submit">{t('forms.submit')}</button>
    </form>
  );
}
```

### Error Display
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function ValidationError({ field }) {
  const { t } = useI18n();
  const errorKey = `errors.invalid${field}`;
  return <p className="error">{t(errorKey, 'Invalid input')}</p>;
}
```

### Settings Tab
```typescript
'use client';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function LanguageSettings() {
  const { t } = useI18n();
  return (
    <div>
      <h2>{t('settings.language')}</h2>
      <LanguageSwitcher variant="dropdown" />
    </div>
  );
}
```

## Debugging

### Enable Logging
Add to your `.env.local`:
```env
DEBUG_I18N=true
```

### Check Loaded Translations
```typescript
const { t } = useI18n();
console.log(t('common.save')); // Should output translated text
```

### Verify Key Exists
```typescript
const text = t('my.key', 'KEY_NOT_FOUND');
if (text === 'KEY_NOT_FOUND') {
  console.warn('Translation key not found');
}
```

## Performance

- Bundle size: ~50KB (all 8 languages)
- Per language: ~6-7KB minified
- No external dependencies
- Client-side only (no server overhead)
- Instant language switching (no page reload)

## Next Steps

1. Add `'use client'` to components needing translations
2. Replace hardcoded English with `t()` calls
3. Test all languages via language switcher
4. Deploy when ready

## Documentation

- **Complete Guide**: [I18N_DOCUMENTATION.md](I18N_DOCUMENTATION.md)
- **Implementation Details**: [I18N_IMPLEMENTATION_SUMMARY.md](I18N_IMPLEMENTATION_SUMMARY.md)
- **Integration Examples**: [I18N_INTEGRATION_GUIDE.md](I18N_INTEGRATION_GUIDE.md)

## Support

- Check existing component examples in codebase
- Review translation files for available keys
- See Integration Guide for detailed examples
- Create GitHub issue for questions
