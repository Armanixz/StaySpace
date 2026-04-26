# 2-Step Email Verification Guide

## Overview
This document outlines the implementation of a 2-step email verification system for user registration in StaySpace. Users must verify their email with a 6-digit code before they can access their account.

## Features Implemented

### 1. **Verification Code Generation**
- 6-digit random code generated securely
- 10-minute expiry timer for each code
- Code stored in database with expiry timestamp

### 2. **Email Notification**
- Professional HTML email template
- Verification code sent automatically after registration
- Instructions and expiry time included in email
- Uses Gmail SMTP (configured via `.env`)

### 3. **Frontend UI Components**
- **Step 1 - Registration Form**: Collect user details (name, email, password, phone, role)
- **Step 2 - Verification Screen**: Enter 6-digit code with real-time countdown timer
- **Resend Button**: Allow users to request new code (available after 5 minutes or when expired)
- **Back Button**: Navigate back to registration form
- **Timer Display**: Shows remaining time in MM:SS format (red when < 1 minute)

### 4. **Backend Endpoints**

#### POST `/api/auth/register`
Initiates registration and sends verification code
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "phone": "01234567890",
    "role": "tenant"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "User registered. Verification code sent to email.",
    "email": "john@example.com",
    "userId": "user_id_here"
  }
  ```

#### POST `/api/auth/verify-code`
Verifies the code and completes registration
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "code": "123456"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Email verified successfully!",
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token_here",
    "role": "tenant"
  }
  ```

#### POST `/api/auth/resend-code`
Sends a new verification code
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "New verification code sent to email. It will expire in 10 minutes.",
    "email": "john@example.com"
  }
  ```

### 5. **Database Changes**

User schema now includes:
```javascript
{
  isVerified: Boolean,           // default: false
  verificationCode: String,      // 6-digit code
  verificationCodeExpiry: Date   // 10 minutes from generation
}
```

## Registration Flow

```
User Submits Form
    ↓
Backend Creates Unverified User
    ↓
Generates 6-digit Code
    ↓
Sends Email with Code
    ↓
Frontend Shows Verification Screen
    ↓
User Enters Code
    ↓
Backend Validates Code & Expiry
    ↓
Account Verified ✓
User Logged In & Redirected
```

## Key Configuration

### Environment Variables (.env)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

## Timer Logic

- **Initial**: 10 minutes (600 seconds)
- **Red Alert**: Last minute (≤ 60 seconds)
- **Expired**: 0 seconds
- **Resend Available**: 
  - Immediately when code expires (timeLeft = 0)
  - After 5 minutes have passed (on active timer)

## Error Handling

| Scenario | Message |
|----------|---------|
| Invalid code | "Invalid verification code" |
| Code expired | "Verification code has expired. Please request a new one." |
| Wrong email format | "Email is required" |
| User not found | "User not found" |
| Empty code | "Email and code are required" |

## Security Features

✅ 6-digit random code (1 million possibilities)
✅ Time-limited (10 minutes)
✅ Password hashing (bcryptjs)
✅ JWT token for authenticated sessions
✅ Server-side validation
✅ Verified user cannot be created without valid code

## Frontend Implementation

### State Management
```javascript
const [step, setStep] = useState('form')           // 'form' or 'verification'
const [timeLeft, setTimeLeft] = useState(600)      // Timer in seconds
const [timerActive, setTimerActive] = useState(false)
```

### Timer Hook
```javascript
useEffect(() => {
  if (!timerActive || timeLeft <= 0) return
  const timer = setInterval(() => {
    setTimeLeft(prev => prev - 1)
  }, 1000)
  return () => clearInterval(timer)
}, [timerActive, timeLeft])
```

## Testing the Feature

### Using cURL:

**Step 1: Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "01234567890",
    "role": "tenant"
  }'
```

**Step 2: Verify Code** (check email for code)
```bash
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

**Step 3: Login** (with verified email)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Future Enhancements

- [ ] OTP via SMS as alternative
- [ ] Resend button cooldown timer
- [ ] Maximum retry attempts before account lockdown
- [ ] Email change verification
- [ ] Re-verification on suspicious login
- [ ] TOTP (Time-based OTP) for added security

## Troubleshooting

**Issue**: Emails not sending
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" if needed

**Issue**: Code expires immediately
- Check server time sync
- Verify database connection

**Issue**: User can't proceed after entering code
- Confirm code hasn't expired (10 minutes)
- Check code matches exactly (case-sensitive)
- Verify email address spelling

---

**Implementation Date**: April 26, 2026
**Status**: ✅ Complete and tested
