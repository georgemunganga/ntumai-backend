# Auth API V2 - Comprehensive Documentation

## Overview

The Auth API V2 is a production-ready authentication system that implements OTP-based authentication with automatic login/signup detection, session-based OTP management, and role selection flow. It addresses all requirements from the backend auth API checklist.

## Key Features

### ✅ Implemented Features

1. **Session-Based OTP Management**
   - OTP sessions stored in Redis with TTL
   - Email/Phone indexing for quick lookups
   - Session tracking with status management
   - Automatic cleanup on expiration

2. **Login vs Signup Detection**
   - Backend automatically detects if user exists
   - Returns `flowType: 'login'` or `flowType: 'signup'`
   - No client-side guessing required
   - Prevents user enumeration with generic responses

3. **Phone Number Standardization**
   - E.164 format (+260972827372)
   - Supports local formats (0972827372)
   - Automatic normalization
   - Validation on input

4. **Backend-Driven Channel Selection**
   - Backend decides SMS/Email/Both
   - Client cannot override channel selection
   - Respects backend configuration
   - Flexible channel management

5. **Security Mitigations**
   - Max 5 OTP attempts per session
   - Rate limiting (1 minute cooldown)
   - Single-use OTP enforcement
   - Session locking after max attempts
   - Device tracking for risk control
   - Generic error messages (prevents user enumeration)

6. **Role Selection Flow**
   - OnboardingToken for new users
   - Secure token-based role assignment
   - Prevents token spoofing
   - Supports multiple roles: customer, tasker, vendor

7. **Token Management**
   - JWT access tokens (1 hour default)
   - Refresh tokens (7 days default)
   - Configurable expiration
   - Secure token generation

## API Endpoints

### 1. Start OTP Flow
**POST** `/api/v1/auth/otp/start`

Initiates OTP flow for login or signup.

**Request:**
```json
{
  "phone": "+260972827372",
  "email": "user@example.com",
  "deviceId": "device-123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "expiresIn": 300,
    "flowType": "signup",
    "channelsSent": ["sms", "email"]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Email or phone must be provided"
  }
}
```

**Parameters:**
- `phone` (optional): Phone number in any format (will be normalized to E.164)
- `email` (optional): Email address
- `deviceId` (optional): Device identifier for tracking

**Returns:**
- `sessionId`: Session identifier for OTP verification
- `expiresIn`: Session expiration time in seconds
- `flowType`: "login" for existing users, "signup" for new users
- `channelsSent`: Array of channels where OTP was sent

---

### 2. Verify OTP
**POST** `/api/v1/auth/otp/verify`

Verifies OTP and returns tokens or onboarding token.

**Request:**
```json
{
  "sessionId": "session_abc123",
  "otp": "123456",
  "deviceId": "device-123"
}
```

**Response (New User - Requires Role Selection):**
```json
{
  "success": true,
  "data": {
    "flowType": "signup",
    "requiresRoleSelection": true,
    "onboardingToken": "onboard_user-456_1702000000_abc123",
    "user": {
      "id": "user-456",
      "email": "user@example.com",
      "phone": "+260972827372"
    }
  }
}
```

**Response (Existing User - May Require Role Selection):**
```json
{
  "success": true,
  "data": {
    "flowType": "login",
    "requiresRoleSelection": true,
    "onboardingToken": "onboard_user-789_1702000000_xyz789",
    "user": {
      "id": "user-789",
      "email": "user@example.com",
      "phone": "+260972827372"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired OTP"
  }
}
```

**Parameters:**
- `sessionId` (required): Session ID from /otp/start
- `otp` (required): 6-digit OTP code
- `deviceId` (optional): Device identifier

**Returns:**
- `flowType`: "login" or "signup"
- `requiresRoleSelection`: Whether role selection is needed
- `onboardingToken`: Token for role selection (if needed)
- `accessToken`: JWT access token (if no role selection needed)
- `refreshToken`: JWT refresh token (if no role selection needed)
- `user`: User information

---

### 3. Select Role
**POST** `/api/v1/auth/select-role`

Completes onboarding by selecting a role and issuing full tokens.

**Request:**
```json
{
  "onboardingToken": "onboard_user-456_1702000000_abc123",
  "role": "customer"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-456",
      "email": "user@example.com",
      "phone": "+260972827372",
      "role": "customer"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired onboarding token"
  }
}
```

**Parameters:**
- `onboardingToken` (required): Token from /otp/verify
- `role` (required): One of "customer", "tasker", "vendor"

**Returns:**
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token
- `expiresIn`: Token expiration time in seconds
- `user`: User information with assigned role

---

### 4. Get Current User
**GET** `/api/v1/auth/me`

Returns the current authenticated user's information.

**Request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-456",
      "email": "user@example.com",
      "phone": "+260972827372",
      "role": "customer",
      "status": "ACTIVE"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

**Headers:**
- `Authorization` (required): Bearer token from /otp/verify or /select-role

**Returns:**
- `user`: Current user information

---

## Authentication Flows

### Signup Flow (New User)

```
1. POST /api/v1/auth/otp/start
   ├─ Input: phone or email
   └─ Output: sessionId, flowType="signup"

2. POST /api/v1/auth/otp/verify
   ├─ Input: sessionId, otp
   ├─ Output: onboardingToken, requiresRoleSelection=true
   └─ Create new user in database

3. POST /api/v1/auth/select-role
   ├─ Input: onboardingToken, role
   └─ Output: accessToken, refreshToken
```

### Login Flow (Existing User)

```
1. POST /api/v1/auth/otp/start
   ├─ Input: phone or email
   └─ Output: sessionId, flowType="login"

2. POST /api/v1/auth/otp/verify
   ├─ Input: sessionId, otp
   ├─ Output: onboardingToken (may still require role selection)
   └─ Retrieve existing user from database

3. POST /api/v1/auth/select-role (if needed)
   ├─ Input: onboardingToken, role
   └─ Output: accessToken, refreshToken
```

---

## Security Features

### OTP Security

1. **Rate Limiting**
   - 1 minute cooldown between OTP requests
   - Prevents brute force attacks

2. **Max Attempts**
   - Maximum 5 failed OTP verification attempts
   - Session locked after max attempts
   - Returns 429 Too Many Requests

3. **Single-Use Enforcement**
   - OTP deleted after successful verification
   - Cannot be reused
   - Expires after 5 minutes

4. **Device Tracking**
   - Optional device ID for tracking
   - Helps detect suspicious activity
   - Can be used for risk-based authentication

### User Enumeration Prevention

1. **Generic Error Messages**
   - Same error message for invalid OTP and expired session
   - Prevents attackers from determining if user exists

2. **Consistent Response Times**
   - Responses take similar time regardless of user existence
   - Prevents timing attacks

3. **No User Information Leakage**
   - User details only returned after successful authentication
   - Onboarding token doesn't contain user information

### Token Security

1. **JWT Tokens**
   - Signed with secret key
   - Configurable expiration
   - Includes user ID and email in payload

2. **Refresh Tokens**
   - Separate from access tokens
   - Longer expiration (7 days)
   - Can be revoked

3. **Onboarding Tokens**
   - Time-limited (15 minutes)
   - Cannot be used for authentication
   - Only for role selection

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
JWT_REFRESH_SECRET=your-refresh-secret

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRATION=300  # 5 minutes
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT=60   # 1 minute

# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=true
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@example.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid input parameters |
| UNAUTHORIZED | 401 | Invalid or expired credentials |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Server error |

---

## Testing

### Unit Tests
Run unit tests for services:
```bash
npm run test
```

### E2E Tests
Run end-to-end tests:
```bash
npm run test:e2e -- test/auth-v2.e2e-spec.ts
```

### Test Coverage
- 23 E2E tests covering all flows
- Tests for success and error scenarios
- Complete signup and login flows
- Role selection and token validation

---

## Architecture

### Clean Architecture Layers

1. **Domain Layer**
   - `UserEntity`: User domain model
   - `OtpSessionEntity`: OTP session model
   - `JwtToken`: JWT token value object
   - `OnboardingToken`: Onboarding token value object
   - Repository interfaces

2. **Application Layer**
   - `AuthServiceV2`: Main authentication service
   - `OtpServiceV2`: OTP management service
   - `UserService`: User management service
   - DTOs for request/response validation

3. **Infrastructure Layer**
   - `UserRepository`: Prisma-based user persistence
   - `OtpSessionRepository`: Redis-based session storage
   - `JwtAuthGuard`: JWT authentication guard
   - `Public` decorator: Mark public endpoints

4. **Interface Layer**
   - `AuthV2Controller`: HTTP endpoints
   - Request/response handling
   - Error handling

### Dependency Injection

All services use NestJS dependency injection for loose coupling and testability.

---

## Best Practices

1. **Always validate input** using DTOs with class-validator
2. **Use generic error messages** to prevent user enumeration
3. **Implement rate limiting** on OTP endpoints
4. **Store sensitive data** securely (hashed passwords, encrypted tokens)
5. **Log authentication events** for security auditing
6. **Test all flows** including error scenarios
7. **Monitor failed attempts** for suspicious activity
8. **Rotate secrets regularly** for security

---

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - Add TOTP support
   - Add biometric authentication

2. **Social Login**
   - Google OAuth
   - Facebook OAuth
   - Apple Sign In

3. **Password-Based Authentication**
   - Password reset flow
   - Password change flow
   - Passwordless login improvements

4. **Session Management**
   - Multiple active sessions
   - Session revocation
   - Device management

5. **Advanced Security**
   - IP whitelisting
   - Device fingerprinting
   - Anomaly detection

---

## Support

For issues or questions, please refer to:
- Architecture documentation: `ARCHITECTURE.md`
- Code comments in source files
- Test files for usage examples
