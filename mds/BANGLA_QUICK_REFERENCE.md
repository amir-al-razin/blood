# Quick Reference - Bangla Translation

## Files at a Glance

### Core I18n
- `lib/i18n.ts` - Hooks and config
- `components/i18n-provider.tsx` - Context provider
- `components/language-switcher.tsx` - Language selector UI

### Updated Files
- `middleware.ts` - Locale detection
- `components/providers.tsx` - I18nProvider wrapper
- `components/layout/header.tsx` - Added switcher
- `components/layout/dashboard-header.tsx` - Added switcher

### Localized Home Pages
- `components/home/hero-section.tsx`
- `components/home/cta-section.tsx`
- `components/home/stats-section.tsx`
- `components/home/testimonials-section.tsx`

### Localized Dashboard
- `components/dashboard/dashboard-content.tsx`
- `app/dashboard/page.tsx`

### Translation Files
- `public/locales/en/common.json`
- `public/locales/en/pages.json`
- `public/locales/bn/common.json`
- `public/locales/bn/pages.json`

---

## Using Translations in Code

### Client Components
```typescript
'use client'
import { useTranslations } from '@/lib/i18n'

export function MyComponent() {
  const t = useTranslations('pages')
  return <h1>{t('home.title')}</h1>
}
```

### Add New Translation
1. **English**: Add to `public/locales/en/{namespace}.json`
2. **Bangla**: Add to `public/locales/bn/{namespace}.json`
3. **Use**: `t('namespace.key')`

### Namespaces
- `common` - Shared UI labels, buttons
- `pages` - Page-specific content

---

## How Locale Detection Works

```
User clicks language switcher
    ↓
Updates localStorage + URL param (?lang=bn)
    ↓
Middleware detects param
    ↓
Sets NEXT_LOCALE cookie
    ↓
I18nProvider loads translations
    ↓
Components render with t() function
```

---

## Key Files Summary

| File | Purpose |
|------|---------|
| `lib/i18n.ts` | Hooks: useLocale(), useTranslations() |
| `components/i18n-provider.tsx` | Wraps app with I18nContext |
| `components/language-switcher.tsx` | Dropdown to change language |
| `middleware.ts` | Detects locale from URL/cookie |
| `components/providers.tsx` | I18nProvider initialization |
| `public/locales/*/` | JSON translation files |

---

## Testing Locally

1. `npm run dev`
2. Visit home page
3. Click language flag (top-right)
4. Select বাংলা
5. Page reloads with Bangla text
6. Refresh - language persists

---

## Translation Stats

- **Common namespace**: 50+ UI labels (same in both languages)
- **Pages namespace**: 300+ page content strings
- **Total**: ~350 strings per language
- **Coverage**: Home page, dashboard, common UI

---

## Supported Languages

| Code | Name | Flag |
|------|------|------|
| en | English | 🇬🇧 |
| bn | বাংলা | 🇧🇩 |

---

## Important Notes

✓ No database changes needed
✓ localStorage handles persistence
✓ Cookie as fallback
✓ Middleware passes locale through request
✓ All components use client-side hooks
✓ Server components wrapped in client wrapper
✓ Type-safe: Locale type = 'en' | 'bn'

---

## Common Gotchas

❌ **Don't**: Use translations in server components directly
✓ **Do**: Wrap server component content in client component

❌ **Don't**: Hardcode strings - always use t()
✓ **Do**: Add to JSON files first, then use t()

❌ **Don't**: Use useTranslations outside I18nProvider
✓ **Do**: Ensure component is wrapped by providers

---

## Adding Translations to Existing Component

```typescript
// Before
<h1>Welcome back</h1>
<p>Dashboard overview</p>

// After
const t = useTranslations('pages')
<h1>{t('dashboard.welcome')}</h1>
<p>{t('dashboard.overview')}</p>

// JSON
{
  "dashboard": {
    "welcome": "স্বাগতম ফিরে",
    "overview": "ড্যাশবোর্ড সংক্ষিপ্ত বিবরণ"
  }
}
```

---

## Performance

- Translations loaded once on app mount
- Cached in context
- Page reload required for language switch (simple approach)
- localStorage used for persistence (no server requests)

---

## Future Enhancements

- Soft language switching (no page reload)
- User preference in database
- More languages (Hindi, Urdu, etc.)
- RTL support for Bangla
- Date/time localization
- Number formatting with Bangla numerals
