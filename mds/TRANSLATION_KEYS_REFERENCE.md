# Translation Keys Reference

## Common Namespace (`common.json`)

### Basic Actions
- `save` - Save
- `cancel` - Cancel
- `delete` - Delete
- `edit` - Edit
- `add` - Add
- `view` - View
- `close` - Close
- `back` - Back
- `next` - Next
- `previous` - Previous
- `submit` - Submit

### Authentication
- `logout` - Logout
- `login` - Login
- `register` - Register

### Language
- `language` - Language
- `english` - English
- `bangla` - বাংলা

### Statuses
- `active` - Active
- `inactive` - Inactive
- `pending` - Pending
- `completed` - Completed
- `failed` - Failed

### Notifications
- `success` - Success
- `error` - Error
- `warning` - Warning
- `info` - Info
- `loading` - Loading...

### UI Elements
- `search` - Search
- `filter` - Filter
- `actions` - Actions
- `details` - Details
- `settings` - Settings

### Data
- `noData` - No data available
- `noResults` - No results found
- `available` - Available
- `private` - Secure & Private

### Form
- `email` - Email
- `password` - Password
- `name` - Name
- `phone` - Phone
- `bloodType` - Blood Type
- `location` - Location
- `optional` - Optional
- `required` - Required

### Blood Donation
- `donors` - Donors
- `requests` - Requests
- `matches` - Matches
- `home` - Home
- `dashboard` - Dashboard
- `profile` - Profile
- `notifications` - Notifications

### General
- `about` - About
- `privacy` - Privacy
- `terms` - Terms
- `contact` - Contact
- `help` - Help
- `confirm` - Confirm
- `confirmDelete` - Are you sure you want to delete this?
- `confirmLogout` - Are you sure you want to logout?
- `yes` - Yes
- `no` - No
- `date` - Date
- `time` - Time
- `status` - Status
- `all` - All

---

## Pages Namespace (`pages.json`)

### Home Page
```
home.title                   "Blood Donation Network"
home.subtitle                "Connect donors with recipients in need"
home.heroTitle              "Save Lives Through Blood Donation"
home.heroDescription        "Join our network..."
home.becomeDonor            "Become a Donor"
home.findDonor              "Find a Donor"
home.cta                    "Get Started Today"

home.stats.donors           "Active Donors"
home.stats.matches          "Successful Matches"
home.stats.requests         "Blood Requests"
home.stats.lives            "Lives Saved"

home.features.title         "Why Choose Our Platform"
home.features.feature1      "Quick Matching"
home.features.feature1Desc  "Find compatible donors instantly"
home.features.feature2      "Secure"
home.features.feature2Desc  "Your data is protected"
home.features.feature3      "Easy to Use"
home.features.feature3Desc  "Simple and intuitive interface"
```

### Dashboard Page
```
dashboard.title             "Dashboard"
dashboard.welcome           "স্বাগতম ফিরে"
dashboard.overview          "Overview"
dashboard.donorStats        "Donor Statistics"
dashboard.requestStats      "Request Statistics"
dashboard.recentMatches     "Recent Matches"
dashboard.recentRequests    "Recent Requests"

dashboard.donorsTable.title             "Donors"
dashboard.donorsTable.bloodType         "Blood Type"
dashboard.donorsTable.location          "Location"
dashboard.donorsTable.lastDonation      "Last Donation"
dashboard.donorsTable.status            "Status"
dashboard.donorsTable.actions           "Actions"

dashboard.requestsTable.title           "Blood Requests"
dashboard.requestsTable.bloodType       "Blood Type"
dashboard.requestsTable.requiredBy      "Required By"
dashboard.requestsTable.location        "Location"
dashboard.requestsTable.status          "Status"
dashboard.requestsTable.actions         "Actions"

dashboard.matchesTable.title            "Matches"
dashboard.matchesTable.donor            "Donor"
dashboard.matchesTable.recipient        "Recipient"
dashboard.matchesTable.bloodType        "Blood Type"
dashboard.matchesTable.date             "Date"
dashboard.matchesTable.status           "Status"
dashboard.matchesTable.actions          "Actions"
```

### Authentication
```
auth.login                  "Login"
auth.register               "Register"
auth.email                  "Email Address"
auth.password               "Password"
auth.confirmPassword        "Confirm Password"
auth.firstName              "First Name"
auth.lastName               "Last Name"
auth.phone                  "Phone Number"
auth.bloodType              "Blood Type"
auth.location               "Location"
auth.rememberMe             "Remember me"
auth.forgotPassword         "Forgot password?"
auth.signup                 "Create Account"
auth.signupDesc             "Join thousands of donors and recipients"
auth.alreadyHaveAccount     "Already have an account?"
auth.noAccount              "Don't have an account?"
auth.loginButton            "Sign In"
auth.registerButton         "Create Account"
auth.success                "Account created successfully"
auth.loginSuccess           "Logged in successfully"
auth.error                  "Login failed. Please check your credentials."
```

---

## Usage Pattern

### In Components
```typescript
const t = useTranslations('common')
const tPages = useTranslations('pages')

// Common labels
<button>{t('save')}</button>
<button>{t('cancel')}</button>

// Page-specific content
<h1>{tPages('home.title')}</h1>
<p>{tPages('home.subtitle')}</p>
```

### In Translation Files
```json
{
  "home": {
    "title": "Blood Donation Network",
    "subtitle": "Connect donors with recipients in need"
  }
}
```

---

## Adding New Keys

1. **Identify namespace**: Is it common UI or page-specific?
   - UI label → `common.json`
   - Page content → `pages.json`

2. **Create key path**: Use dot notation
   - `namespace.section.item`
   - Example: `pages.home.title`

3. **Add to English first**:
   ```json
   {
     "section": {
       "item": "English text"
     }
   }
   ```

4. **Add to Bangla**:
   ```json
   {
     "section": {
       "item": "বাংলা পাঠ"
     }
   }
   ```

5. **Use in component**:
   ```typescript
   const t = useTranslations('namespace')
   return <h1>{t('section.item')}</h1>
   ```

---

## Key Naming Conventions

- Use camelCase: `home.title` not `home.Title`
- Use dot notation for nesting: `pages.dashboard.donorsTable.title`
- Use descriptive names: `bloodType` not `bt`
- Group related keys: `dashboard.donorsTable.*`
- Use consistent naming across languages: exact same keys in both JSON files

---

## Translation File Structure

```
en/
├── common.json (50+ keys)
│   ├── Language keys
│   ├── Action keys
│   ├── Status keys
│   └── Form field keys
└── pages.json (300+ keys)
    ├── home.* (50+ keys)
    ├── dashboard.* (150+ keys)
    └── auth.* (100+ keys)

bn/
├── common.json (Bangla translations)
└── pages.json (Bangla translations)
```

---

## Verification Checklist

Before using new translations:

- [ ] Key exists in `en/common.json` or `en/pages.json`
- [ ] Same key exists in `bn/common.json` or `bn/pages.json`
- [ ] JSON syntax is valid (no trailing commas)
- [ ] Component imports correct namespace
- [ ] Using `useTranslations('namespace')`
- [ ] Key path matches exactly: `t('section.item')`
- [ ] Page works in both English and Bangla

---

## Testing Translation Keys

1. Switch to English - verify English text shows
2. Switch to Bangla - verify Bangla text shows
3. Check console - no errors about missing keys
4. Verify text alignment and spacing in both languages
