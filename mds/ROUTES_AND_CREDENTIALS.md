# RedAid Routes and Admin Access Credentials

## 🔐 Admin Access Credentials

### Default Admin Users (Created via seed/create-admin script)

| Email | Password | Role | Phone | Status |
|-------|----------|------|-------|--------|
| `admin@redaid.com` | `admin123` | SUPER_ADMIN | +8801712345678 | Active |
| `staff@redaid.com` | `admin123` | STAFF | +8801712345679 | Active |
| `viewer@redaid.com` | `admin123` | VIEWER | +8801712345680 | Active |

⚠️ **IMPORTANT**: These are default credentials for development/testing. Change them immediately in production!

---

## 📍 Application Routes

### Authentication Routes
- `/login` - Admin login page
- `/dashboard` - Admin dashboard (requires auth)
- `/dashboard/donors` - Donor management
- `/dashboard/requests` - Blood request management
- `/dashboard/matches` - Match management
- `/dashboard/analytics` - Analytics & reporting
- `/dashboard/settings` - Settings
- `/dashboard/privacy` - Privacy controls
- `/privacy` - Public privacy policy

### Public Pages
- `/` - Home page
- `/donate` - Donor registration (public)
- `/request` - Blood request form (public)
- `/privacy` - Privacy policy (public)

---

## 🔌 API Endpoints

### Authentication API Routes

#### NextAuth.js Authentication
```
GET/POST /api/auth/[...nextauth]
```
- NextAuth.js credential provider
- Session management
- JWT callbacks
- Role-based access control

#### Two-Factor Authentication (2FA)

##### Setup 2FA
```
POST /api/auth/2fa/setup
```
- **Auth Required**: Yes (Authenticated users only)
- **Rate Limit**: api
- **CSRF Protection**: Yes
- **Input**: None (uses authenticated user context)
- **Output**: 
  ```json
  {
    "secret": "JBSWY3DPEBLW64TMMQ6D",
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["code1", "code2", ...]
  }
  ```

##### Verify & Enable 2FA
```
POST /api/auth/2fa/verify
```
- **Auth Required**: Yes
- **Rate Limit**: auth
- **CSRF Protection**: Yes
- **Input**:
  ```json
  {
    "token": "123456"
  }
  ```

##### Disable 2FA
```
POST /api/auth/2fa/disable
```
- **Auth Required**: Yes
- **Rate Limit**: sensitive
- **CSRF Protection**: Yes
- **Input**:
  ```json
  {
    "password": "user_password"
  }
  ```

---

### Donor Management API

#### Register Donor
```
POST /api/donors
```
- **Auth Required**: No (Public)
- **Rate Limit**: forms
- **Accepts**: JSON or FormData (with file upload)
- **Input**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "bloodType": "O+",
    "location": "Dhaka",
    "isAvailable": true
  }
  ```

#### List Donors (Admin)
```
GET /api/donors?page=1&limit=10&status=active&bloodType=O+&search=query
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Rate Limit**: api
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status (active/inactive/all)
  - `bloodType`: Filter by blood type
  - `search`: Search by name/email/phone

#### Get Donor Details
```
GET /api/donors/{id}
```
- **Auth Required**: Yes (Staff/Viewers can see their data)
- **Rate Limit**: api

#### Update Donor
```
PUT /api/donors/{id}
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Rate Limit**: api

#### Update Donor Availability Status
```
PATCH /api/donors/{id}/status
```
- **Auth Required**: Yes
- **Input**:
  ```json
  {
    "isAvailable": true
  }
  ```

#### Delete/Soft Delete Donor
```
DELETE /api/donors/{id}
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF

---

### Blood Request API

#### Create Blood Request
```
POST /api/requests
```
- **Auth Required**: No (Public)
- **Rate Limit**: forms
- **Accepts**: JSON or FormData (with prescription file)
- **Input**:
  ```json
  {
    "requesterName": "Patient Name",
    "requesterPhone": "+8801712345678",
    "requesterEmail": "patient@example.com",
    "bloodType": "B+",
    "unitsRequired": 2,
    "urgencyLevel": "CRITICAL|URGENT|NORMAL",
    "hospital": "Hospital Name",
    "location": "Dhaka",
    "reason": "Surgery",
    "prescriptionFile": "base64 or file"
  }
  ```

#### List Blood Requests
```
GET /api/requests?page=1&limit=10&status=pending&bloodType=B+
```
- **Auth Required**: Yes
- **Rate Limit**: api
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status
  - `bloodType`: Filter by blood type

#### Get Request Details
```
GET /api/requests/{id}
```
- **Auth Required**: Yes
- **Rate Limit**: api

#### Update Request
```
PUT /api/requests/{id}
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Rate Limit**: api

#### Update Request Status
```
PATCH /api/requests/{id}/status
```
- **Auth Required**: Yes
- **Input**:
  ```json
  {
    "status": "PENDING|FULFILLED|PARTIAL|CANCELLED"
  }
  ```

---

### Matching System API

#### Create Donor-Request Match
```
POST /api/matches
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Rate Limit**: api
- **CSRF Protection**: Yes
- **Input**:
  ```json
  {
    "donorId": "donor_id",
    "requestId": "request_id",
    "notes": "Optional notes"
  }
  ```

#### Find Compatible Donors
```
GET /api/matches/find-donors?requestId=id&distance=5
```
- **Auth Required**: Yes
- **Rate Limit**: api
- **Query Parameters**:
  - `requestId`: Request ID to find donors for
  - `distance`: Search radius in km (optional)

#### List Matches
```
GET /api/matches?page=1&limit=10&status=PENDING&bloodType=O+&search=query
```
- **Auth Required**: Yes
- **Rate Limit**: api
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status (PENDING, CONTACTED, ACCEPTED, REJECTED, COMPLETED, CANCELLED)
  - `bloodType`: Filter by blood type
  - `search`: Search query

#### Get Match Details
```
GET /api/matches/{id}
```
- **Auth Required**: Yes
- **Rate Limit**: api

#### Update Match Status
```
PATCH /api/matches/{id}
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Input**:
  ```json
  {
    "status": "PENDING|CONTACTED|ACCEPTED|REJECTED|COMPLETED|CANCELLED",
    "notes": "Optional notes"
  }
  ```

#### Record Contact Attempt
```
POST /api/matches/{id}/contact
```
- **Auth Required**: Yes
- **Input**:
  ```json
  {
    "method": "PHONE|EMAIL|SMS",
    "result": "SUCCESS|FAILED|INVALID_CONTACT",
    "notes": "Details of contact attempt"
  }
  ```

#### Delete Match
```
DELETE /api/matches/{id}
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN

---

### Analytics API

#### Get Analytics Data
```
GET /api/analytics?period=30d&startDate=2024-01-01&endDate=2024-12-31
```
- **Auth Required**: Yes
- **Rate Limit**: api
- **Query Parameters**:
  - `period`: 7d|30d|90d|1y (default: 30d)
  - `startDate`: Custom start date (ISO format)
  - `endDate`: Custom end date (ISO format)

**Response includes**:
- Summary statistics (total donors, requests, matches, success rate)
- Period statistics (new entries in selected period)
- Daily trends
- Monthly trends
- Success rate by blood type
- Average response time

#### Export Analytics Data
```
POST /api/analytics/export
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Rate Limit**: api
- **Input**:
  ```json
  {
    "type": "donors|requests|matches|analytics",
    "format": "xlsx|pdf",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "filters": {
      "bloodType": "O+",
      "status": "active"
    }
  }
  ```
- **Output**: Excel file (.xlsx) or PDF report

---

### Privacy & Data Protection API

#### Get Privacy Settings
```
GET /api/privacy/settings
```
- **Auth Required**: Yes
- **Rate Limit**: api

#### Update Privacy Settings
```
PUT /api/privacy/settings
```
- **Auth Required**: Yes
- **Input**:
  ```json
  {
    "allowCommunications": true,
    "allowDataSharing": false,
    "communicationPreferences": ["EMAIL", "SMS"]
  }
  ```

#### Request Data Access
```
POST /api/privacy/contact-access
```
- **Auth Required**: Yes
- **Rate Limit**: forms
- **Input**:
  ```json
  {
    "donorId": "donor_id",
    "reason": "GDPR_REQUEST|ACCOUNT_REVIEW"
  }
  ```

#### Get Audit Trail
```
GET /api/privacy/audit?page=1&limit=50&userId=user_id&eventType=ACCESS
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN, STAFF
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `userId`: Filter by user
  - `eventType`: Filter by event type (ACCESS, MODIFICATION, DELETION)
  - `startDate`: Start date (ISO format)
  - `endDate`: End date (ISO format)

#### Request Data Deletion
```
POST /api/privacy/data-deletion
```
- **Auth Required**: Yes (Donor can request own deletion)
- **Rate Limit**: forms
- **Input**:
  ```json
  {
    "donorId": "donor_id",
    "reason": "Account closure / Privacy concern",
    "confirmDeletion": true
  }
  ```

#### Execute Data Deletion
```
DELETE /api/privacy/data-deletion
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN (Admin deletion)
- **Rate Limit**: sensitive
- **Input**:
  ```json
  {
    "donorId": "donor_id",
    "reason": "Admin deletion reason",
    "confirmDeletion": true
  }
  ```

---

### Security API

#### Get Security Stats
```
GET /api/security/stats
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN
- **Rate Limit**: api

**Returns**:
- Total security events (24h)
- Critical unresolved alerts
- Failed login attempts (24h)
- Blocked requests
- Active users

#### Get Security Events
```
GET /api/security/events?page=1&limit=50&severity=CRITICAL&type=LOGIN_FAILURE
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `severity`: CRITICAL|HIGH|MEDIUM|LOW|INFO
  - `type`: Event type filter
  - `startDate`: Start date
  - `endDate`: End date
  - `userId`: Filter by user ID
  - `ipAddress`: Filter by IP address

#### Get Security Alerts
```
GET /api/security/alerts?page=1&limit=50&isResolved=false
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `isResolved`: Filter by resolution status
  - `severity`: Filter by severity

#### Resolve Security Alert
```
PATCH /api/security/alerts/{id}/resolve
```
- **Auth Required**: Yes
- **Role Required**: SUPER_ADMIN
- **Input**:
  ```json
  {
    "resolution": "RESOLVED|FALSE_ALARM|INVESTIGATING",
    "notes": "Resolution notes"
  }
  ```

---

### Health & Test API

#### Health Check
```
GET /api/health
```
- **Auth Required**: No (Public)
- **Rate Limit**: forms
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-11-27T00:00:00.000Z"
  }
  ```

#### Test API
```
GET /api/test
```
- **Auth Required**: No (Public)
- **Response**:
  ```json
  {
    "message": "API is working!",
    "timestamp": "2024-11-27T00:00:00.000Z"
  }
  ```

---

## 🔐 Role-Based Access Control (RBAC)

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full system access | All endpoints, All operations, User management, System settings |
| **STAFF** | Staff member access | Donor/request/match management, Analytics viewing, Limited admin features |
| **VIEWER** | Read-only access | View-only (GET requests only), No POST/PUT/DELETE |

### Access Control Matrix

| Endpoint | SUPER_ADMIN | STAFF | VIEWER | Public |
|----------|:-----------:|:-----:|:------:|:------:|
| `/api/donors` (GET) | ✅ | ✅ | ✅ | ❌ |
| `/api/donors` (POST) | ✅ | ✅ | ❌ | ✅ |
| `/api/requests` (GET) | ✅ | ✅ | ✅ | ❌ |
| `/api/requests` (POST) | ✅ | ✅ | ❌ | ✅ |
| `/api/matches` | ✅ | ✅ | ✅ | ❌ |
| `/api/analytics` | ✅ | ✅ | ✅ | ❌ |
| `/api/privacy` | ✅ | ✅ | ✅ | ❌ |
| `/api/security` | ✅ | ❌ | ❌ | ❌ |

---

## 🛡️ Security Features

### Rate Limiting Configuration

| Type | Limit | Window | Routes |
|------|-------|--------|--------|
| **forms** | 20 requests | 15 minutes | Form submissions, public endpoints |
| **auth** | 5 requests | 15 minutes | Authentication endpoints |
| **api** | 100 requests | 15 minutes | General API endpoints |
| **uploads** | 10 requests | 1 hour | File upload endpoints |
| **sensitive** | 3 requests | 15 minutes | Sensitive operations, 2FA, security |
| **passwordReset** | 3 requests | 1 hour | Password reset endpoints |

### Authentication Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Duration**: 24 hours
- **JWT Token**: 24 hours validity
- **CSRF Protection**: Enabled on all state-changing operations
- **2FA Support**: TOTP-based two-factor authentication
- **Account Lockout**: After 5 failed login attempts (30 minutes)
- **Password Policy**:
  - Minimum length: 8 characters
  - Maximum length: 128 characters
  - Required: Uppercase, lowercase, numbers, special characters
  - Password history: Last 5 passwords cannot be reused
  - Password age: 90 days max

### API Security Headers

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Time to wait before retrying (for 429 responses)

### Data Protection

- **Input Sanitization**: XSS protection, SQL injection prevention
- **Data Validation**: Zod schema validation
- **Encryption**: Passwords hashed with bcrypt
- **Access Logging**: All API access logged with IP, user agent, timestamp
- **Audit Trail**: Complete audit log for privacy-sensitive operations

---

## 🌍 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/redaid"
DATABASE_URL_UNPOOLED="postgresql://user:password@host:5432/redaid"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# External Services
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="your-phone-number"

SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@redaid.com"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📋 Default Database Users (Post-Seed)

After running `pnpm run seed` or `npm run create-admin`:

```sql
SELECT email, role, phone, isActive FROM "User" WHERE role IN ('SUPER_ADMIN', 'STAFF', 'VIEWER');
```

| Email | Role | Phone | Active |
|-------|------|-------|--------|
| admin@redaid.com | SUPER_ADMIN | +8801712345678 | true |
| staff@redaid.com | STAFF | +8801712345679 | true |
| viewer@redaid.com | VIEWER | +8801712345680 | true |

---

## 🔄 Session/JWT Details

### JWT Payload Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "SUPER_ADMIN",
  "iat": 1234567890,
  "exp": 1234654290,
  "jti": "unique_token_id"
}
```

### Session Structure
```json
{
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "image": null,
    "role": "SUPER_ADMIN"
  },
  "expires": "2024-11-28T00:00:00.000Z"
}
```

---

## ⚠️ Important Security Notes

1. **Never commit credentials** to version control
2. **Change default passwords** immediately in production
3. **Use environment variables** for all sensitive data
4. **Enable HTTPS** in production
5. **Set strong `NEXTAUTH_SECRET`** in production
6. **Implement rate limiting** at reverse proxy level for production
7. **Monitor security logs** regularly
8. **Rotate API keys** periodically
9. **Use secure cookies** (httpOnly, secure, sameSite flags)
10. **Keep dependencies updated**

---

## 🚀 Setup Instructions

### 1. Create Admin User
```bash
npm run create-admin
# or
pnpm create-admin
```

### 2. Seed Database
```bash
npm run seed
# or
pnpm seed
```

### 3. Update Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

### 5. Access Admin Dashboard
- URL: `http://localhost:3000/login`
- Email: `admin@redaid.com`
- Password: `admin123`

---

## 📞 API Testing

### Using cURL

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@redaid.com",
    "password": "admin123"
  }'
```

#### Get Analytics
```bash
curl -X GET http://localhost:3000/api/analytics?period=30d \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Export Data
```bash
curl -X POST http://localhost:3000/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "donors",
    "format": "xlsx"
  }'
```

---

## 📝 Notes

- All timestamps are in UTC (ISO 8601 format)
- Phone numbers should include country code (e.g., +880...)
- Blood types follow standard nomenclature (O+, O-, A+, A-, B+, B-, AB+, AB-)
- Distances are measured in kilometers
- All monetary values are in local currency (default: BDT)

---

**Last Updated**: November 27, 2025  
**Version**: 1.0  
**Project**: RedAid Blood Donation Platform
