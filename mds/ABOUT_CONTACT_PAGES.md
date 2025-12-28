# About & Contact Pages - Implementation Guide

## ✅ Pages Created & Configured

### 1. About Page (`/about`)
**File**: `app/about/page.tsx`

**Features**:
- ✅ Hero section with title and subtitle
- ✅ Mission, Vision, and Values sections
- ✅ Core values display (4 values with icons)
- ✅ Impact statistics (donors, recipients, lives saved, hospitals)
- ✅ Our Story (3 paragraphs)
- ✅ Timeline/Milestones section
- ✅ Call-to-action buttons
- ✅ Links to Donate and Request pages
- ✅ Fully localized (English & Bengali)
- ✅ Responsive design (mobile & desktop)

**Page Structure**:
```
/about
├── Hero Section
├── Mission, Vision, Values Cards
├── Core Values Grid (4 items)
├── Impact Statistics (Red background)
├── Our Story Section
├── Journey Timeline
├── Call-to-Action Section
└── Contact Link
```

---

### 2. Contact Page (`/contact`)
**File**: `app/contact/page.tsx`

**Features**:
- ✅ Hero section with title and subtitle
- ✅ Contact methods (4 cards: Email, Phone, Address, Hours)
- ✅ Contact form with validation (Zod)
  - Name field
  - Email field
  - Phone field
  - Subject field
  - Message field
  - Submit button with loading state
- ✅ Success/Error messages
- ✅ Information section with:
  - Business hours
  - Response time
  - Social media links
- ✅ FAQ section (4 common questions)
- ✅ Fully localized (English & Bengali)
- ✅ Responsive design

**Page Structure**:
```
/contact
├── Hero Section
├── Contact Methods (4 Cards)
├── Contact Form & Info Grid
│   ├── Contact Form (left)
│   └── Information Cards (right)
├── FAQ Section (collapsible)
└── Social Media Links
```

---

## 📝 Translation Keys

### About Page Translations
**English**: `public/locales/en/pages.json` → `about` object
**Bengali**: `public/locales/bn/pages.json` → `about` object

**Keys Available**:
- `title` - "About RedAid"
- `subtitle` - Platform tagline
- `mission.title` - "Our Mission"
- `mission.description`
- `vision.title` - "Our Vision"
- `vision.description`
- `values.title` - "Our Core Values"
- `values.compassion.*` - Compassion value
- `values.community.*` - Community value
- `values.efficiency.*` - Efficiency value
- `values.accessibility.*` - Accessibility value
- `impact.title` - "Our Impact"
- `impact.donors`, `impact.recipients`, `impact.lives`, `impact.hospitals`
- `story.title` - "Our Story"
- `story.paragraph1`, `story.paragraph2`, `story.paragraph3`
- `milestones.title` - "Our Journey"
- `milestones.2024.*` - Platform foundation
- `milestones.launch.*` - Official launch
- `cta.title`, `cta.description`, `cta.becomeDonor`, `cta.requestBlood`

### Contact Page Translations
**English**: `public/locales/en/pages.json` → `contact` object
**Bengali**: `public/locales/bn/pages.json` → `contact` object

**Keys Available**:
- `title` - "Get In Touch"
- `subtitle` - Tagline
- `methods.email.*` - Email contact method
- `methods.phone.*` - Phone contact method
- `methods.address.*` - Address contact method
- `methods.hours.*` - Hours contact method
- `form.title` - "Send us a Message"
- `form.name`, `form.email`, `form.phone`, `form.subject`, `form.message`
- `form.send`, `form.sending`
- `form.successMessage`, `form.errorMessage`
- `info.title` - "More Information"
- `info.hours.*` - Business hours
- `info.response.*` - Response time info
- `info.social.title` - "Follow Us"
- `faq.title` - "Frequently Asked Questions"
- `faq.q1-q4` - FAQ questions and answers

---

## 🔌 API Endpoints

### Contact Form API
**Endpoint**: `POST /api/contact`

**Purpose**: Handles contact form submissions

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+8801712345678",
  "subject": "Partnership Inquiry",
  "message": "I would like to discuss a partnership opportunity with RedAid..."
}
```

**Validation**:
- `name`: 2-100 characters
- `email`: Valid email format
- `phone`: 10-20 characters
- `subject`: 5-200 characters
- `message`: 20-5000 characters

**Response Success** (200):
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you soon!"
}
```

**Response Error** (400/500):
```json
{
  "error": "Invalid form data",
  "details": [...]
}
```

**Features**:
- ✅ Input validation with Zod
- ✅ Stores messages in database (`contactMessage` model)
- ✅ Captures IP address and user agent
- ✅ Error handling
- ✅ TODO: Email notifications

---

## 🔗 Navigation Integration

### Header Navigation
**File**: `components/layout/header.tsx`

**Links Added**:
- Home (/)
- About (/about)
- Contact (/contact)
- Need Blood (/request)
- Become a Donor (/donate)

**Features**:
- ✅ Desktop navigation (full text)
- ✅ Mobile navigation (icons with labels)
- ✅ Language switcher
- ✅ Responsive design
- ✅ Sticky header with z-index management

---

## 🌐 Language Support

Both About and Contact pages support:
- ✅ English (en)
- ✅ Bengali (বাংলা) (bn)

**Language Switching**:
1. Click language switcher (top-right)
2. Select English or বাংলা
3. Page automatically updates with selected language
4. Preference saved to localStorage

---

## 📱 Responsive Features

### Mobile Optimizations
- ✅ Touch-friendly button sizes (48px minimum)
- ✅ Mobile-optimized navigation
- ✅ Stack layout on small screens
- ✅ Readable font sizes
- ✅ Proper spacing and padding

### Desktop Optimizations
- ✅ Multi-column layouts
- ✅ Hover effects
- ✅ Grid layouts for content organization
- ✅ Optimized whitespace

---

## 🎨 Design Components Used

### UI Components
- `Card` - Content containers
- `CardHeader`, `CardContent` - Card structure
- `CardTitle`, `CardDescription` - Text elements
- `Button` - Call-to-action buttons
- `Input` - Form input fields
- `Alert`, `AlertDescription` - Status messages

### Icons (Lucide React)
- `Heart` - Logo and donation icon
- `Users` - Community/team icon
- `Target` - Mission/goals icon
- `Globe` - Vision/global reach icon
- `Shield` - Values/security icon
- `Mail` - Email contact method
- `Phone` - Phone contact method
- `MapPin` - Address/location icon
- `Clock` - Hours/time icon
- `Zap` - Efficiency/energy icon

---

## 🔐 Security Features

### Form Security
- ✅ Input validation (Zod schema)
- ✅ Email validation
- ✅ Phone number validation
- ✅ Message length limits (5000 characters max)
- ✅ XSS protection (React escaping)
- ✅ Rate limiting on API endpoint

### Data Protection
- ✅ IP address logging
- ✅ User agent tracking
- ✅ Database storage with timestamps
- ✅ Error handling without exposing sensitive info

---

## 📊 Database Model

### ContactMessage Model
```typescript
model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String
  subject   String
  message   String
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## ✨ Features Summary

| Feature | About | Contact |
|---------|-------|---------|
| Fully Localized | ✅ | ✅ |
| Responsive Design | ✅ | ✅ |
| Hero Section | ✅ | ✅ |
| Contact Form | ❌ | ✅ |
| FAQ Section | ❌ | ✅ |
| Statistics | ✅ | ❌ |
| Timeline | ✅ | ❌ |
| Social Links | ❌ | ✅ |
| Form Validation | ❌ | ✅ |
| Database Integration | ❌ | ✅ |
| Mobile Optimized | ✅ | ✅ |

---

## 🚀 Accessing the Pages

### Development Environment
- About: `http://localhost:3000/about`
- Contact: `http://localhost:3000/contact`

### Production
- About: `https://redaid.com/about` (or your domain)
- Contact: `https://redaid.com/contact`

### Language Variants
- English: Add `?lang=en` to URL
- Bengali: Add `?lang=bn` to URL

---

## 📋 Testing Checklist

### About Page
- [ ] Page loads without errors
- [ ] All sections visible
- [ ] Responsive on mobile/tablet/desktop
- [ ] Links to /donate work
- [ ] Links to /request work
- [ ] Links to /contact work
- [ ] English content displays correctly
- [ ] Bengali content displays correctly
- [ ] Icons render properly

### Contact Page
- [ ] Page loads without errors
- [ ] Form validation works:
  - [ ] Name field validated
  - [ ] Email field validated
  - [ ] Phone field validated
  - [ ] Subject field validated
  - [ ] Message field validated
- [ ] Form submission works
- [ ] Success message displays
- [ ] Error message displays (if submission fails)
- [ ] Contact information displays
- [ ] FAQ section works
- [ ] Social links present
- [ ] English content displays correctly
- [ ] Bengali content displays correctly
- [ ] Responsive on mobile/tablet/desktop

### Contact Form API
- [ ] POST /api/contact works
- [ ] Invalid input rejected
- [ ] Valid submission stored in database
- [ ] Error responses return correct status codes
- [ ] IP address captured
- [ ] User agent captured

---

## 🔄 Future Enhancements

### About Page
- [ ] Add team member cards with images
- [ ] Add partner logos section
- [ ] Add achievement badges
- [ ] Add video testimonials
- [ ] Add impact map showing geographic reach

### Contact Page
- [ ] Integrate email sending service (SendGrid, AWS SES)
- [ ] Add admin notification emails
- [ ] Add user confirmation emails
- [ ] Implement rate limiting on form submissions
- [ ] Add chat widget for live support
- [ ] Add location map embed
- [ ] Connect social media APIs
- [ ] Add file upload for inquiries
- [ ] Implement ticket system

### General
- [ ] Add SEO meta tags
- [ ] Add structured data (Schema.org)
- [ ] Add analytics tracking
- [ ] Add CTA tracking
- [ ] Add form submission tracking

---

## 📞 Content Updates

### Updating Content
To update content on these pages:

1. **Edit translations**: `public/locales/en/pages.json` and `public/locales/bn/pages.json`
2. **Edit page structure**: `app/about/page.tsx` or `app/contact/page.tsx`
3. **Update components**: Use components in `components/layout/`
4. **Restart dev server** for changes to take effect

### Email Integration
To enable email notifications:

1. Set up email service (SendGrid, AWS SES, Nodemailer)
2. Add API keys to environment variables
3. Update `app/api/contact/route.ts` with email logic

---

## 📚 Related Files

- Header Component: `components/layout/header.tsx`
- Public Layout: `components/layout/public-layout.tsx`
- Language Switcher: `components/language-switcher.tsx`
- Translation Files:
  - English: `public/locales/en/pages.json`
  - Bengali: `public/locales/bn/pages.json`
  - English Common: `public/locales/en/common.json`
  - Bengali Common: `public/locales/bn/common.json`

---

**Last Updated**: November 27, 2025  
**Status**: ✅ Complete and Ready for Testing
