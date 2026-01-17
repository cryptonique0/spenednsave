# Phase 8 Quick Reference Guide

## 🚀 Quick Start

### Accessing the Blog
```
Navigate to: /blog
- View all blog posts
- Search by keywords
- Filter by category
- Read individual posts
```

### Changing Language
```
1. Click Settings in navbar
2. Go to Language tab
3. Click your preferred language
4. UI updates instantly
5. Preference saved automatically
```

### Using i18n in Components
```typescript
import { useI18n } from '@/lib/hooks/useI18n';

export function MyComponent() {
  const { t } = useI18n();
  
  return <h1>{t('common.save')}</h1>;
}
```

---

## 📁 File Locations

### Blog Pages
- Blog Hub: `/app/blog/page.tsx`
- Single Post: `/app/blog/[id]/page.tsx`

### Blog Components
- Post Card: `/components/blog/blog-post-card.tsx`
- Newsletter: `/components/blog/newsletter-subscription.tsx`
- Related Posts: `/components/blog/related-posts.tsx`

### i18n Files
- English: `/lib/i18n/en.ts`
- Spanish: `/lib/i18n/es.ts`
- French: `/lib/i18n/fr.ts`
- German: `/lib/i18n/de.ts`
- Chinese: `/lib/i18n/zh.ts`
- Japanese: `/lib/i18n/ja.ts`
- Portuguese: `/lib/i18n/pt.ts`
- Russian: `/lib/i18n/ru.ts`
- **Arabic (NEW):** `/lib/i18n/ar.ts`
- **Hebrew (NEW):** `/lib/i18n/he.ts`

---

## 🌍 Supported Languages

| Code | Language | Direction | Flag |
|------|----------|-----------|------|
| en | English | LTR | 🇬🇧 |
| es | Spanish | LTR | 🇪🇸 |
| fr | French | LTR | 🇫🇷 |
| de | German | LTR | 🇩🇪 |
| zh | Chinese | LTR | 🇨🇳 |
| ja | Japanese | LTR | 🇯🇵 |
| pt | Portuguese | LTR | 🇵🇹 |
| ru | Russian | LTR | 🇷🇺 |
| ar | Arabic | **RTL** | 🇸🇦 |
| he | Hebrew | **RTL** | 🇮🇱 |

---

## 🔑 Translation Categories

| Category | Keys | Usage |
|----------|------|-------|
| `common` | 25+ | General UI (Save, Cancel, etc.) |
| `nav` | 8+ | Navigation labels |
| `auth` | 15+ | Login, signup, 2FA |
| `dashboard` | 12+ | Dashboard UI |
| `vaults` | 20+ | Vault management |
| `guardians` | 12+ | Guardian management |
| `activity` | 15+ | Activity tracking |
| `settings` | 18+ | Settings page |
| `twoFactor` | 15+ | 2FA configuration |
| `webauthn` | 12+ | Security keys |
| `errors` | 15+ | Error messages |
| `success` | 10+ | Success messages |
| `modal` | 5+ | Modal dialogs |
| `forms` | 8+ | Form labels |
| `breadcrumbs` | 6+ | Breadcrumb navigation |
| `faq` | 3+ | FAQ section |
| `help` | 8+ | Help center |
| **`blog`** | **20+** | **Blog section (NEW)** |
| `footer` | 6+ | Footer content |

---

## 📝 Blog Features

### Search
```
User enters text → Real-time filtering across:
- Post titles
- Post excerpts
- Post tags
- Author names
```

### Filtering
- By Category (6 options)
- By Tag (auto-generated)
- Combined filters work together

### Post Interactions
- ❤️ Like posts
- 🔗 Share with others
- 🔖 Bookmark for later
- 💬 Comment (structure ready)

### Newsletter
- Email subscription form
- Validation included
- Success/error states
- Ready for backend integration

---

## 🎯 Translation Example

### Adding a New Translation Key

**1. Add to English file** (`lib/i18n/en.ts`):
```typescript
blog: {
  myNewKey: 'My new translation',
}
```

**2. Add to other language files** (ar.ts, he.ts, etc.):
```typescript
blog: {
  myNewKey: 'ترجمتي الجديدة',  // Arabic example
}
```

**3. Use in component**:
```typescript
const { t } = useI18n();
<h1>{t('blog.myNewKey')}</h1>
```

---

## 🔄 RTL Support

### Automatic
- When user selects Arabic or Hebrew
- `document.documentElement.dir` automatically set to "rtl"
- Components adjust layout automatically

### Manual (if needed)
```typescript
const { currentLanguageInfo } = useLanguage();
const isRTL = currentLanguageInfo.direction === 'rtl';
```

---

## 📊 Blog Post Structure

```typescript
{
  id: 'post-id',
  title: 'Post Title',
  excerpt: 'Short summary...',
  category: 'announcement',      // One of 6 categories
  tags: ['tag1', 'tag2'],
  author: 'Author Name',
  publishedDate: Date,
  readTime: 5,                   // Minutes
  featured: true,                // Show in featured section
  image: '📰',                   // Emoji or image URL
  content: '<html content>',
}
```

---

## 🚢 Deployment

### Before Going Live
- [ ] Test all 10 languages
- [ ] Verify RTL rendering
- [ ] Test blog search/filter
- [ ] Mobile responsive check
- [ ] Dark mode testing
- [ ] Newsletter form validation

### Environment Variables (if needed)
- None required for Phase 8
- Future: CMS API keys, email service keys

---

## 🐛 Troubleshooting

### Language not changing?
- Check if localStorage is enabled
- Clear browser cache
- Verify i18n context is wrapped around app

### Blog not loading?
- Check `/blog` route exists
- Verify blog components imported
- Check for console errors

### RTL not applied?
- Verify language has `direction: 'rtl'` in languages.ts
- Check i18n-context sets `document.documentElement.dir`
- Clear browser cache

### Translations missing?
- Check key spelling matches exactly
- Verify all language files have the key
- Check for typos in `t()` function call

---

## 📈 Performance Tips

### Optimize Language Switching
- Language preference stored in localStorage (instant)
- No page reload required
- React state update only

### Optimize Blog Search
- Search runs in React state (client-side)
- No API calls for filtering
- Real-time results

### Optimize Translation Lookup
- Direct object property access
- No regex or complex lookups
- Fallback to English if missing

---

## 🔐 Security Notes

- ✅ No sensitive data in translations
- ✅ No user input in translations
- ✅ Blog content sanitized
- ✅ No authentication required for blog
- ✅ No database access from blog (currently)

---

## 📚 Related Documentation

- **Full Guide:** `PHASE_8_COMPLETION_FINAL.md`
- **Implementation:** `PHASE_8_IMPLEMENTATION_SUMMARY.md`
- **i18n Docs:** `I18N_DOCUMENTATION.md`
- **Integration:** `I18N_INTEGRATION_GUIDE.md`
- **API Ref:** `I18N_QUICK_REFERENCE.md`

---

## ✨ Quick Commands

### View current language
```typescript
const { language } = useLanguage();
console.log(language); // 'en', 'ar', etc.
```

### Get language info
```typescript
const { currentLanguageInfo } = useLanguage();
console.log(currentLanguageInfo.nativeName); // 'العربية', etc.
```

### Change language programmatically
```typescript
const { setLanguage } = useLanguage();
setLanguage('ar');
```

### Get translation
```typescript
const { t } = useI18n();
const translated = t('blog.title');
```

---

## 🎓 Learning Resources

### For Blog Integration
1. Check sample posts in `/app/blog/page.tsx`
2. View component structure in `/components/blog/*`
3. See post data format in `/app/blog/[id]/page.tsx`

### For i18n Integration
1. Check existing usage in components
2. See languages.ts for configuration
3. Review en.ts for key structure
4. Check i18n-context.tsx for hooks

---

## 🆘 Getting Help

### For i18n Issues
→ See `I18N_DOCUMENTATION.md`

### For Blog Issues
→ Check component TSDoc comments

### For Integration Help
→ Review existing components using i18n

### For RTL Issues
→ Check SUPPORTED_LANGUAGES in `languages.ts`

---

## ✅ Checklist for Using Phase 8

- [ ] Accessed blog at `/blog`
- [ ] Changed language in Settings
- [ ] Verified RTL language (Arabic/Hebrew) works
- [ ] Searched blog posts
- [ ] Filtered by category
- [ ] Read individual post
- [ ] Tested like/share buttons
- [ ] Tested newsletter subscription
- [ ] Verified mobile responsive
- [ ] Tested dark mode

---

**Status:** ✅ Phase 8 Complete - Ready to Use!
