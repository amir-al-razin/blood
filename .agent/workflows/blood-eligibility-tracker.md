# Blood Donation Eligibility Tracker

## Overview

This feature allows verified donors to track when they're eligible to donate blood again. It displays a visual progress bar and countdown on the member dashboard.

## Business Rules

### Donation Intervals (Bangladesh Guidelines)

| Gender | Minimum Interval | Reason |
|--------|------------------|--------|
| Male | 90 days (3 months) | Faster iron recovery |
| Female | 120 days (4 months) | Additional recovery time needed |

## Components

### `DonorEligibilityStatus`

Location: `components/donor/donor-eligibility-status.tsx`

A visual component that shows:
- Eligibility status badge (Eligible / Recovering)
- Progress bar showing recovery percentage
- Days until eligible (or "Eligible now!")
- Total donation count
- Last donation date
- Gender-specific information

#### Props

```typescript
interface DonorEligibilityStatusProps {
  lastDonation: Date | string | null | undefined
  gender: 'MALE' | 'FEMALE' | string
  donationCount?: number
  isVerified?: boolean
}
```

## Integration

### Member Dashboard

The component is displayed on the member dashboard (`/member/dashboard`) for **verified donors only**.

```tsx
{isVerifiedDonor && member.donor && (
  <DonorEligibilityStatus
    lastDonation={member.donor.lastDonation}
    gender={member.donor.gender}
    donationCount={member.donor.donationCount}
    isVerified={member.donor.isVerified}
  />
)}
```

### API Support

The member profile API (`/api/member/profile`) already calculates and returns eligibility data:

```json
{
  "member": {
    "donor": {
      "gender": "MALE",
      "lastDonation": "2024-10-15T00:00:00.000Z",
      "donationCount": 5
    },
    "eligibility": {
      "canDonate": true,
      "daysSinceDonation": 74,
      "daysRemaining": 0,
      "requiredDays": 90,
      "nextEligibleDate": null
    }
  }
}
```

## States

### 1. Eligible to Donate
- Green color scheme
- Checkmark icon
- Message: "You're eligible to donate!"
- Progress bar at 100%

### 2. Recovering (Not Eligible)
- Blue color scheme
- Clock icon
- Shows countdown: "X days until eligible"
- Shows next eligible date
- Progress bar shows recovery percentage

### 3. Never Donated
- Treated as "Eligible" (100% progress)
- Shows "Never" for last donation

### 4. Verification Pending
- Yellow warning theme
- Message explaining verification is needed

## Future Enhancements

1. **Push Notifications**: Alert donors when they become eligible
2. **Calendar Integration**: Add next eligible date to user's calendar
3. **Admin View**: Show eligibility in admin donor list
4. **Filtering**: Filter donors by eligibility status for matching
