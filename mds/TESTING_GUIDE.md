# Testing Guide - Bangla Translation MVP

## Quick Start Testing

### 1. Start Development Server
```bash
cd /home/amir/Documents/web-dev/redaid
npm run dev
```

Open browser to `http://localhost:3000`

---

## Test Scenarios

### Scenario 1: Language Switching on Home Page

**Steps**:
1. Navigate to home page
2. Look for language selector in top-right header
3. Click on flag (currently should show 🇬🇧 or text)
4. Select "বাংলা" from dropdown
5. Page reloads automatically

**Expected Results**:
- ✅ All text on home page switches to Bangla
- ✅ Hero title reads "জীবন রক্ত দান করে বাঁচান"
- ✅ CTA buttons show Bangla text
- ✅ Stats labels in Bangla
- ✅ Testimonials section headers in Bangla

**Bangla Text Samples to Look For**:
- Title: "জীবন রক্ত দান করে বাঁচান"
- Subtitle: "আমাদের দাতা এবং প্রাপকদের নেটওয়ার্কে যোগ দিন"
- Button: "দাতা হন"
- Stats: "সক্রিয় দাতা", "সফল ম্যাচ"

---

### Scenario 2: Language Persistence

**Steps**:
1. On home page, switch to বাংলা
2. Refresh the page (F5 or Cmd+R)
3. Wait for page to reload

**Expected Results**:
- ✅ Page still shows in Bangla after refresh
- ✅ Language preference persisted via localStorage
- ✅ No flickering (smooth load)

**Technical Check**:
- Open DevTools → Application → Cookies
- Look for: `NEXT_LOCALE=bn`

---

### Scenario 3: Language Switching Back to English

**Steps**:
1. On Bengali page, click language selector
2. Select "English"
3. Wait for page reload

**Expected Results**:
- ✅ All text switches back to English
- ✅ Hero title: "Save Lives Through Blood Donation"
- ✅ All buttons, labels in English
- ✅ No errors in console

---

### Scenario 4: Dashboard Language Switching

**Prerequisites**: Must be logged in to dashboard

**Steps**:
1. Login to dashboard
2. Click language selector in header
3. Select বাংলা
4. Page reloads

**Expected Results**:
- ✅ Dashboard cards show Bangla labels
- ✅ "Total Donors" → "দাতা পরিসংখ্যান"
- ✅ "Blood Requests" → "রক্তের অনুরোধ"
- ✅ All dashboard text in Bangla
- ✅ Tables, buttons, labels all translated

**Sample Bangla Dashboard Text**:
- "স্বাগতম ফিরে" (Welcome back)
- "ড্যাশবোর্ড সংক্ষিপ্ত বিবরণ" (Dashboard overview)
- "দাতা পরিসংখ্যান" (Donor statistics)
- "রক্তের অনুরোধ" (Blood requests)

---

### Scenario 5: Mobile Responsive

**Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test with iPhone 12 viewport
4. Click language selector
5. Switch to Bangla

**Expected Results**:
- ✅ Language selector visible on mobile
- ✅ Dropdown appears correctly
- ✅ Text readable (no overflow)
- ✅ Bangla text renders properly on mobile
- ✅ No layout breakage

---

## Detailed Test Cases

### Test Case 1: Home Page Hero Section
**File**: `components/home/hero-section.tsx`

```
English Text:
- Title: "Save Lives Through Blood Donation"
- Button: "Need Blood Now"
- Button: "Become a Donor"
- Subtitle: "Connect with verified blood donors..."

Bangla Text:
- Title: "জীবন রক্ত দান করে বাঁচান"
- Button: "দাতা খুঁজুন"
- Button: "দাতা হন"
- Subtitle: "আমাদের দাতা এবং প্রাপকদের নেটওয়ার্কে যোগ দিন..."
```

✅ After switching to Bangla, verify all text matches above

---

### Test Case 2: Stats Section
**File**: `components/home/stats-section.tsx`

```
English:
- "1,247" "Active Donors"
- "3,891" "Lives Saved"
- Blood type labels (A+, B-, O+, etc.)

Bangla:
- "1,247" "সক্রিয় দাতা"
- "3,891" "জীবন বাঁচানো হয়েছে"
- Same blood type labels
```

✅ Verify stat cards update correctly

---

### Test Case 3: CTA Section
**File**: `components/home/cta-section.tsx`

```
English:
- "Ready to Save Lives?"
- "Request Blood"
- "Become a Donor"
- "Emergency Help"

Bangla:
- "আজই শুরু করুন"
- "দাতা খুঁজুন"
- "দাতা হন"
- "জরুরি সাহায্য" (should say "সাহায্য")
```

✅ Verify CTA section translations

---

### Test Case 4: Dashboard Stats
**File**: `components/dashboard/dashboard-content.tsx`

```
English:
- "Welcome back, [Name]"
- "Dashboard overview"
- "Total Donors"
- "Pending Requests"

Bangla:
- "স্বাগতম ফিরে [Name]"
- "ড্যাশবোর্ড সংক্ষিপ্ত বিবরণ"
- "দাতা পরিসংখ্যান"
- "অপেক্ষমান" (Pending)
```

✅ Login and verify dashboard labels

---

## Browser Console Checks

### No Errors Should Appear

Run these commands in DevTools Console:

```javascript
// Check locale from context
window.__NEXT_DATA__.props.pageProps.locale

// Check if translations loaded
localStorage.getItem('NEXT_LOCALE')

// Check for console errors
// Should be empty (no red errors)
```

---

## Performance Testing

### Time Measurements

| Action | Expected | Actual |
|--------|----------|--------|
| Initial page load | < 3s | _____ |
| Language switch | < 2s | _____ |
| Translation load | < 1s | _____ |
| Page refresh | < 2s | _____ |

---

## Accessibility Testing

### Screen Reader
- [ ] Language selector announces as "Language dropdown"
- [ ] Options announce as "English" and "বাংলা"
- [ ] Current language indicated with checkmark
- [ ] ARIA labels present

### Keyboard Navigation
- [ ] Tab to language selector
- [ ] Arrow keys open/close dropdown
- [ ] Enter selects language
- [ ] Escape closes dropdown

### Color Contrast
- [ ] All text meets WCAG AA standards
- [ ] Bangla text readable at all sizes
- [ ] No color-only indicators

---

## Edge Cases to Test

### Edge Case 1: Direct URL Parameter
```
URL: http://localhost:3000/?lang=bn
Expected: Page loads in Bangla directly
```

### Edge Case 2: Invalid Language
```
URL: http://localhost:3000/?lang=fr
Expected: Falls back to English
```

### Edge Case 3: Rapid Clicking
```
Action: Click language switcher multiple times quickly
Expected: No crashes, single page reload
```

### Edge Case 4: LocalStorage Disabled
```
Condition: Disable localStorage in DevTools
Action: Switch language
Expected: Falls back to cookie/default
```

### Edge Case 5: Offline Mode
```
Condition: Go offline in DevTools
Action: Switch language and refresh
Expected: Use cached translations gracefully
```

---

## Bug Report Template

If you find issues:

```
**Title**: [Brief description]

**Reproduction Steps**:
1. 
2. 
3. 

**Expected**: 

**Actual**: 

**Screenshots**: 

**Browser**: Chrome / Firefox / Safari / Mobile

**URL**: 

**Console Errors**: (paste any errors)

**Device**: Desktop / Mobile / Tablet
```

---

## Success Criteria

All of these must be **GREEN** ✅

- [ ] Language switcher visible on all pages
- [ ] Click switcher opens dropdown with both languages
- [ ] Select English shows page in English
- [ ] Select বাংলা shows page in Bangla
- [ ] Bangla text displays correctly (no boxes/symbols)
- [ ] Language persists after page refresh
- [ ] Home page fully translated to Bangla
- [ ] Dashboard fully translated to Bangla
- [ ] No console errors
- [ ] Mobile responsive layout maintained
- [ ] All buttons/labels have translations
- [ ] Switching languages is quick (< 2s reload)

---

## Sign-Off Checklist

When all tests pass:

```
Date: ___________
Tester: ___________
Device: ___________
Browser: ___________

All tests passed: ___________
Ready for deployment: ___________
```

---

## Quick Reference - Bangla Translations

### Key Phrases to Look For

| English | Bangla | Location |
|---------|--------|----------|
| Save Lives | জীবন বাঁচান | Hero title |
| Blood Donation Network | রক্ত দান নেটওয়ার্ক | Home title |
| Become a Donor | দাতা হন | Home CTA |
| Find a Donor | দাতা খুঁজুন | Home CTA |
| Dashboard | ড্যাশবোর্ড | Dashboard title |
| Welcome back | স্বাগতম ফিরে | Dashboard greeting |
| Active Donors | সক্রিয় দাতা | Stats |
| Lives Saved | জীবন বাঁচানো হয়েছে | Stats |
| Save | সংরক্ষণ করুন | Buttons |
| Cancel | বাতিল করুন | Buttons |
| Delete | মুছে ফেলুন | Actions |

---

## Troubleshooting

### Problem: Language doesn't change
- **Solution**: Clear cookies and localStorage
  - DevTools → Application → Storage → Clear All
  - Refresh page

### Problem: Bangla text shows as boxes
- **Solution**: Font support missing
  - Browser typically handles this automatically
  - Try different browser

### Problem: Language changes but page doesn't reload
- **Solution**: Check middleware setup
  - Verify `middleware.ts` is in root directory
  - Restart dev server

### Problem: Text not translating
- **Solution**: Check JSON files
  - Verify JSON syntax: `npm run validate-json`
  - Check key spelling matches exactly

---

## Automated Testing (Future)

When ready to add tests:

```typescript
// Example E2E test with Playwright
test('language switching', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Switch to Bangla
  await page.click('[aria-label="Language dropdown"]');
  await page.click('text=বাংলা');
  await page.waitForNavigation();
  
  // Verify Bangla text
  expect(await page.textContent('h1')).toContain('জীবন রক্ত দান করে বাঁচান');
});
```

---

## Notes

- Tests should be performed on latest Chrome, Firefox, and Safari
- Mobile testing on iOS Safari and Android Chrome recommended
- Test on both desktop and mobile devices
- Clear cache between major version updates

---

**Testing Guide Version**: 1.0  
**Last Updated**: November 27, 2025  
**Status**: Ready for QA
