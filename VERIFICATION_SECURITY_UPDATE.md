# Email Verification Security Update

## Overview
Enhanced the 2-step email verification system to prevent unverified accounts from accessing protected resources. Users MUST verify their email before any account activity.

## Key Changes

### 1. **Backend Protection**

#### Updated `authMiddleware.js`
- **`protect` middleware**: Now checks `isVerified` status before allowing access to protected routes
- **`optionalAuth` middleware**: New middleware for routes that can work with or without auth (doesn't require verification)
- Returns 403 Forbidden if user is not verified

#### Verification Flow
```
User Registration (POST /api/auth/register)
    ↓ Creates unverified account in DB
    ↓ Sends verification code via email
    ↓
User enters code (POST /api/auth/verify-code) ← NO AUTH REQUIRED
    ↓ Validates code & expiry
    ↓ Sets isVerified = true
    ↓ Returns JWT token
    ↓
NOW user can access protected routes with `protect` middleware
```

### 2. **Account Security**

**Unverified users CANNOT:**
- ✗ Access profile endpoint (`PUT /api/auth/profile`)
- ✗ View properties (`GET /api/properties/*`)
- ✗ Make bookings
- ✗ View appointments
- ✗ Access chat
- ✗ Access any route using `protect` middleware

**Unverified users CAN:**
- ✓ Register (`POST /api/auth/register`)
- ✓ Verify email (`POST /api/auth/verify-code`)
- ✓ Resend code (`POST /api/auth/resend-code`)
- ✓ Login (but won't get token until verified)

### 3. **Login Behavior**

When an unverified user tries to login:
```json
{
  "message": "Please verify your email first",
  "email": "user@example.com",
  "requiresVerification": true
}
```

### 4. **Protected Routes Behavior**

When an unverified user tries to access a protected route:
```json
{
  "message": "Please verify your email before accessing this resource",
  "requiresVerification": true
}
```

## Database Schema

User model now includes:
```javascript
{
  isVerified: Boolean,              // default: false
  verificationCode: String,         // 6-digit code
  verificationCodeExpiry: Date      // 10 minutes expiry
}
```

## Updated Middleware Usage

### Routes using `protect` (requires verified user):
```javascript
router.put('/profile', protect, updateProfile);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:propertyId', protect, addToWishlist);
// ... all other protected routes
```

### Routes NOT using middleware (public):
```javascript
router.post('/register', registerValidation, registerUser);
router.post('/verify-code', verifyEmailCode);
router.post('/resend-code', resendVerificationCode);
router.post('/login', loginValidation, loginUser);
```

## Frontend Handling

The Register page already handles this correctly:
1. User submits form → receives verification screen
2. User verifies email → gets JWT token and is logged in
3. User is redirected to home page
4. All subsequent requests use the token with verified status

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Verified user | 200 | Access granted |
| Unverified user | 403 | requiresVerification: true |
| No token | 401 | Not authorized |
| Invalid token | 401 | Token failed |

## Testing

### Scenario 1: Verify full flow
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123","phone":"01234","role":"tenant"}'

# Response: User created, code sent

# 2. Try to access protected route WITHOUT verification
curl -X GET http://localhost:5000/api/tenant/wishlist \
  -H "Authorization: Bearer TOKEN_HERE"

# Response: 403 "Please verify your email..."

# 3. Verify email with code
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# Response: Token + verified user data

# 4. Now access protected routes with verified token
curl -X GET http://localhost:5000/api/tenant/wishlist \
  -H "Authorization: Bearer NEW_TOKEN_HERE"

# Response: 200 Success (access granted)
```

## Migration Notes

If you have existing users in the database:
1. They need to be marked as verified or undergo verification again
2. Run this MongoDB command to mark all as verified:
   ```javascript
   db.users.updateMany({}, { $set: { isVerified: true } })
   ```

## Security Benefits

✅ Prevents spam/bot registrations
✅ Confirms email ownership
✅ Protects user data (unverified = no access)
✅ Forces email validation before any activity
✅ Reduces fake accounts in system

## Future Enhancements

- [ ] Rate limit verification attempts
- [ ] Temporary account cleanup (delete unverified after 24 hours)
- [ ] Email verification reminders
- [ ] Account suspension after failed attempts
- [ ] Admin panel to manually verify accounts

---

**Implementation Date**: April 26, 2026
**Status**: ✅ Complete and tested
