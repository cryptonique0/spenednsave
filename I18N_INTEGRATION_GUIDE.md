# i18n Integration Guide

Quick reference for integrating multi-language support into existing SpendVault components.

## Basic Setup

### 1. Ensure Provider is Wrapped

In your app layout (usually `app/layout.tsx`):

```typescript
import { I18nProvider } from '@/lib/i18n';

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

### 2. Use in Components

Make component a client component and use the hook:

```typescript
'use client';

import { useI18n } from '@/lib/i18n';

export function MyButton() {
  const { t } = useI18n();
  
  return <button>{t('common.save')}</button>;
}
```

## Common Use Cases

### 1. Button Labels

**Before:**
```typescript
<button>Save</button>
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function SaveButton() {
  const { t } = useI18n();
  return <button>{t('common.save')}</button>;
}
```

### 2. Form Labels

**Before:**
```typescript
<label>Email Address</label>
<input type="email" />
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function EmailInput() {
  const { t } = useI18n();
  return (
    <>
      <label>{t('settings.email')}</label>
      <input type="email" />
    </>
  );
}
```

### 3. Page Titles

**Before:**
```typescript
export function SettingsPage() {
  return <h1>Settings</h1>;
}
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function SettingsPage() {
  const { t } = useI18n();
  return <h1>{t('settings.title')}</h1>;
}
```

### 4. Error Messages

**Before:**
```typescript
if (error) {
  return <p className="text-red-500">Invalid email address</p>;
}
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function EmailField() {
  const { t } = useI18n();
  const [error, setError] = useState(false);
  
  if (error) {
    return <p className="text-red-500">{t('errors.invalidEmail')}</p>;
  }
}
```

### 5. Placeholder Text

**Before:**
```typescript
<input placeholder="Enter your name" />
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export function NameInput() {
  const { t } = useI18n();
  return <input placeholder={t('common.loading')} />;
}
```

### 6. Conditional Text

**Before:**
```typescript
function DeleteConfirm() {
  return (
    <div>
      <p>Are you sure you want to delete this item?</p>
      <button>Delete</button>
      <button>Cancel</button>
    </div>
  );
}
```

**After:**
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

function DeleteConfirm() {
  const { t } = useI18n();
  return (
    <div>
      <p>{t('modal.confirmDelete')}</p>
      <button>{t('common.delete')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

## Adding Language Switcher

### Option 1: Settings Page (Recommended)

```typescript
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function SettingsPage() {
  return (
    <div>
      <h2>Language Preference</h2>
      <LanguageSwitcher variant="dropdown" />
    </div>
  );
}
```

### Option 2: Navigation Header

```typescript
import { LanguageSwitcherNav } from '@/components/layout/language-switcher';

export function Header() {
  return (
    <header>
      <nav>
        <LanguageSwitcherNav />
      </nav>
    </header>
  );
}
```

### Option 3: Grid Selection (Settings)

```typescript
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function LanguageSettings() {
  return (
    <div>
      <h2>Select Your Language</h2>
      <LanguageSwitcher variant="grid" />
    </div>
  );
}
```

### Option 4: Compact Flags (Header)

```typescript
import { LanguageSwitcherCompact } from '@/components/layout/language-switcher';

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <logo />
      <LanguageSwitcherCompact />
    </div>
  );
}
```

## Translation Key Reference

### Navigation Keys
- `nav.dashboard` → "Dashboard"
- `nav.vaults` → "Vaults"
- `nav.guardians` → "Guardians"
- `nav.activity` → "Activity"
- `nav.settings` → "Settings"
- `nav.support` → "Support"

### Common Keys
- `common.save` → "Save"
- `common.cancel` → "Cancel"
- `common.delete` → "Delete"
- `common.edit` → "Edit"
- `common.add` → "Add"
- `common.loading` → "Loading..."

### Settings Keys
- `settings.title` → "Settings"
- `settings.language` → "Language"
- `settings.theme` → "Theme"
- `settings.email` → "Email"
- `settings.phone` → "Phone"

### Error Keys
- `errors.invalidEmail` → "Invalid email address"
- `errors.invalidPassword` → "Password must be at least 8 characters"
- `errors.networkError` → "Network error. Please check your connection."

### Success Keys
- `success.saved` → "Saved successfully"
- `success.deleted` → "Deleted successfully"
- `success.created` → "Created successfully"

## Full Translation Key List

See the translation files in `lib/i18n/` for complete lists:
- `en.ts` - English translation keys
- `es.ts` - Spanish translation keys
- `fr.ts` - French translation keys
- `de.ts` - German translation keys
- `zh.ts` - Chinese translation keys
- `ja.ts` - Japanese translation keys
- `pt.ts` - Portuguese translation keys
- `ru.ts` - Russian translation keys

## Best Practices

1. **Always use client components** - Add `'use client'` at the top
2. **Extract to separate files** - Keep i18n in dedicated components when possible
3. **Use consistent keys** - Group related translations
4. **Test all languages** - Switch to each language and verify display
5. **Handle long text** - Use CSS to handle text overflow in different languages
6. **No hardcoded English** - Remove all hardcoded strings and translate them

## Example: Full Component Conversion

**Before:**
```typescript
export function VaultCard({ vault }) {
  return (
    <div className="border rounded p-4">
      <h2>{vault.name}</h2>
      <p>Balance: {vault.balance} ETH</p>
      <p>Guardians: {vault.guardianCount}</p>
      <button>View Details</button>
      <button>Edit</button>
      <button>Delete</button>
    </div>
  );
}
```

**After:**
```typescript
'use client';

import { useI18n } from '@/lib/i18n';

export function VaultCard({ vault }) {
  const { t } = useI18n();
  
  return (
    <div className="border rounded p-4">
      <h2>{vault.name}</h2>
      <p>{t('vaults.vaultBalance')}: {vault.balance} ETH</p>
      <p>{t('vaults.guardians')}: {vault.guardianCount}</p>
      <button>{t('common.edit')}</button>
      <button>{t('common.delete')}</button>
    </div>
  );
}
```

## Troubleshooting

### "useI18n must be used within I18nProvider"
- Ensure component has `'use client'` directive
- Ensure app is wrapped with `I18nProvider`

### Text not updating when language changes
- Ensure using `useI18n()` hook in client component
- Check that component re-renders when language changes

### Translation key not found
- Verify key exists in `en.ts` file
- Use fallback: `t('key', 'Fallback text')`
- Check for typos in key

### Styling issues with long translations
- Use `className="whitespace-normal"`
- Set max-width on text containers
- Test with German and Russian (longer text)

## Next Steps

1. Identify all hardcoded English strings in components
2. Extract strings to i18n keys
3. Update components to use `useI18n()` hook
4. Test language switching
5. Get translations reviewed for accuracy

## Resources

- **Full Documentation**: [I18N_DOCUMENTATION.md](I18N_DOCUMENTATION.md)
- **Implementation Summary**: [I18N_IMPLEMENTATION_SUMMARY.md](I18N_IMPLEMENTATION_SUMMARY.md)
- **Translation Files**: `lib/i18n/`
- **Components**: `components/layout/language-switcher.tsx`
