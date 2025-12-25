# 🔐 Ntumai Authentication Workflow Guide

## Overview

Ntumai uses a **passwordless OTP-based authentication system** that supports both **email** and **phone number** login. The system is designed to be secure, user-friendly, and supports a **multi-role architecture** where users can have multiple roles (CUSTOMER, TASKER, VENDOR).

---

## 📋 Table of Contents

1. [Authentication Flow Overview](#authentication-flow-overview)
2. [User Roles](#user-roles)
3. [API Endpoints](#api-endpoints)
4. [Detailed Workflows](#detailed-workflows)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)

---

## Authentication Flow Overview

The authentication process consists of **3 main steps**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Step 1: Start OTP Flow
┌──────────────┐
│   User       │  Provides email OR phone
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/v1/auth/otp/start                                 │
│  • System checks if user exists (login) or new (signup)      │
│  • Generates 6-digit OTP code                                │
│  • Sends OTP via email/SMS                                   │
│  • Returns sessionId (valid for 5 minutes)                   │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
Step 2: Verify OTP
┌──────────────┐
│   User       │  Enters OTP code
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/v1/auth/otp/verify                                │
│  • Validates OTP code against sessionId                      │
│  • Checks if user is new or existing                         │
│                                                              │
│  IF EXISTING USER (login):                                   │
│    ✓ Returns accessToken & refreshToken                      │
│    ✓ User is authenticated                                   │
│                                                              │
│  IF NEW USER (signup):                                       │
│    ✓ Returns onboardingToken                                 │
│    ✓ Requires role selection (Step 3)                        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
Step 3: Select Role (New Users Only)
┌──────────────┐
│   User       │  Selects initial role
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/v1/auth/select-role                               │
│  • User selects: CUSTOMER, TASKER, or VENDOR                 │
│  • Returns accessToken & refreshToken                        │
│  • User is fully authenticated                               │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ✅ AUTHENTICATED - User can access protected endpoints      │
└──────────────────────────────────────────────────────────────┘
```

---

## User Roles

Ntumai supports a **multi-role system** where one user can have multiple roles:

| Role | Description | Access Level | KYC Required |
|------|-------------|--------------|--------------|
| **CUSTOMER** | Default role for all users | Can create orders, deliveries, and errands | ❌ No |
| **TASKER** (Rider) | Fulfills deliveries and tasks | Receives system-assigned jobs based on proximity | ✅ Yes |
| **VENDOR** (Merchant) | Manages products and marketplace orders | Can list products and process orders | ✅ Yes |

### Key Points:
- **All users start as CUSTOMER** by default
- Users can **add additional roles** later (e.g., CUSTOMER + TASKER)
- **Role switching** requires a new JWT token with the desired role
- **TASKER** and **VENDOR** roles require **KYC verification** before full access

---

## API Endpoints

### Base URL
```
https://your-domain.com/api/v1/auth
```

### Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/otp/start` | ❌ Public | Start OTP authentication flow |
| `POST` | `/otp/verify` | ❌ Public | Verify OTP code |
| `POST` | `/select-role` | ❌ Public (requires onboardingToken) | Select initial role for new users |
| `GET` | `/me` | ✅ Bearer Token | Get current authenticated user info |

---

## Detailed Workflows

### Workflow 1: Existing User Login (Email)

```
1. User enters email: user@example.com
   ↓
2. POST /api/v1/auth/otp/start
   Request:
   {
     "email": "user@example.com",
     "deviceId": "device-uuid-12345"  // Optional
   }
   ↓
3. System Response:
   {
     "success": true,
     "data": {
       "sessionId": "otp-session-uuid-12345",
       "expiresIn": 300,  // 5 minutes
       "flowType": "login",  // Existing user
       "channelsSent": ["email"]
     }
   }
   ↓
4. User receives OTP via email (e.g., 123456)
   ↓
5. User enters OTP: 123456
   ↓
6. POST /api/v1/auth/otp/verify
   Request:
   {
     "sessionId": "otp-session-uuid-12345",
     "otp": "123456",
     "deviceId": "device-uuid-12345"  // Optional
   }
   ↓
7. System Response (Login Success):
   {
     "success": true,
     "data": {
       "flowType": "login",
       "requiresRoleSelection": false,  // Existing user
       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "expiresIn": 900,  // 15 minutes
       "user": {
         "id": "uuid-user-123",
         "email": "user@example.com",
         "role": "customer"
       }
     }
   }
   ↓
8. ✅ User is authenticated - Store accessToken for API calls
```

---

### Workflow 2: New User Signup (Phone)

```
1. User enters phone: +254712345678
   ↓
2. POST /api/v1/auth/otp/start
   Request:
   {
     "phone": "+254712345678",
     "deviceId": "device-uuid-12345"  // Optional
   }
   ↓
3. System Response:
   {
     "success": true,
     "data": {
       "sessionId": "otp-session-uuid-67890",
       "expiresIn": 300,
       "flowType": "signup",  // New user
       "channelsSent": ["sms"]
     }
   }
   ↓
4. User receives OTP via SMS (e.g., 654321)
   ↓
5. User enters OTP: 654321
   ↓
6. POST /api/v1/auth/otp/verify
   Request:
   {
     "sessionId": "otp-session-uuid-67890",
     "otp": "654321",
     "deviceId": "device-uuid-12345"
   }
   ↓
7. System Response (Signup - Requires Role Selection):
   {
     "success": true,
     "data": {
       "flowType": "signup",
       "requiresRoleSelection": true,  // New user needs to select role
       "onboardingToken": "onboarding-token-uuid-11111",
       "user": {
         "id": "uuid-user-456",
         "phone": "+254712345678"
       }
     }
   }
   ↓
8. User selects role: "customer"
   ↓
9. POST /api/v1/auth/select-role
   Request:
   {
     "onboardingToken": "onboarding-token-uuid-11111",
     "role": "customer"
   }
   ↓
10. System Response (Role Selected):
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": 900,
        "user": {
          "id": "uuid-user-456",
          "phone": "+254712345678",
          "role": "customer"
        }
      }
    }
    ↓
11. ✅ User is authenticated - Store accessToken for API calls
```

---

### Workflow 3: Get Current User Info

```
1. User is authenticated with accessToken
   ↓
2. GET /api/v1/auth/me
   Headers:
   {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ↓
3. System Response:
   {
     "success": true,
     "data": {
       "user": {
         "id": "uuid-user-123",
         "email": "user@example.com",
         "phone": "+254712345678",
         "role": "customer",
         "status": "active"  // or "pending_kyc", "suspended"
       }
     }
   }
```

---

## Request/Response Examples

### 1. Start OTP Flow

**Endpoint:** `POST /api/v1/auth/otp/start`

**Request Body (Email):**
```json
{
  "email": "user@example.com",
  "deviceId": "device-uuid-12345"
}
```

**Request Body (Phone):**
```json
{
  "phone": "+254712345678",
  "deviceId": "device-uuid-12345"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "otp-session-uuid-12345",
    "expiresIn": 300,
    "flowType": "login",
    "channelsSent": ["email"]
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Email or phone number is required"
  }
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /api/v1/auth/otp/verify`

**Request Body:**
```json
{
  "sessionId": "otp-session-uuid-12345",
  "otp": "123456",
  "deviceId": "device-uuid-12345"
}
```

**Success Response - Existing User (200 OK):**
```json
{
  "success": true,
  "data": {
    "flowType": "login",
    "requiresRoleSelection": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "uuid-user-123",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

**Success Response - New User (200 OK):**
```json
{
  "success": true,
  "data": {
    "flowType": "signup",
    "requiresRoleSelection": true,
    "onboardingToken": "onboarding-token-uuid-67890",
    "user": {
      "id": "uuid-user-456",
      "phone": "+254712345678"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid or expired OTP"
  }
}
```

---

### 3. Select Role

**Endpoint:** `POST /api/v1/auth/select-role`

**Request Body:**
```json
{
  "onboardingToken": "onboarding-token-uuid-67890",
  "role": "customer"
}
```

**Available Roles:**
- `"customer"` - Default role, can create orders
- `"tasker"` - Rider role, requires KYC
- `"vendor"` - Merchant role, requires KYC

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "uuid-user-456",
      "phone": "+254712345678",
      "role": "customer"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid role. Must be one of: customer, tasker, vendor"
  }
}
```

---

### 4. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user-123",
      "email": "user@example.com",
      "phone": "+254712345678",
      "role": "customer",
      "status": "active"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

## Error Handling

### Common Error Codes

| HTTP Status | Error Code | Description | Common Causes |
|-------------|------------|-------------|---------------|
| `400` | `BAD_REQUEST` | Invalid request parameters | Missing email/phone, invalid format |
| `401` | `UNAUTHORIZED` | Authentication failed | Invalid token, expired session |
| `429` | `TOO_MANY_REQUESTS` | Rate limit exceeded | Too many OTP requests |
| `500` | `INTERNAL_SERVER_ERROR` | Server error | Unexpected server issue |

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional context
  }
}
```

---

## Security Considerations

### 1. **OTP Expiration**
- OTP codes are valid for **5 minutes** (300 seconds)
- After expiration, user must request a new OTP

### 2. **Rate Limiting**
- Maximum **3 OTP requests per phone/email per 15 minutes**
- Prevents brute-force attacks

### 3. **Device Tracking**
- Optional `deviceId` parameter for security logging
- Helps detect suspicious login attempts

### 4. **Token Expiration**
- **Access Token:** Valid for **15 minutes** (900 seconds)
- **Refresh Token:** Valid for **7 days**
- **Onboarding Token:** Valid for **30 minutes** (only for new users)

### 5. **JWT Security**
- Tokens are signed with HS256 algorithm
- Include user ID, role, and expiration claims
- Must be sent in `Authorization: Bearer <token>` header

### 6. **HTTPS Only**
- All authentication endpoints **must** use HTTPS in production
- Prevents token interception

---

## Testing the Authentication Flow

### Using Swagger UI

1. Navigate to: `http://localhost:3000/api/docs`
2. Expand the **Authentication** section
3. Try the following sequence:

#### Test 1: Email Login (Existing User)
```
1. POST /api/v1/auth/otp/start
   Body: { "email": "test@example.com" }
   
2. Check email for OTP code
   
3. POST /api/v1/auth/otp/verify
   Body: { "sessionId": "<from step 1>", "otp": "<from email>" }
   
4. Copy the accessToken from response
   
5. GET /api/v1/auth/me
   Header: Authorization: Bearer <accessToken>
```

#### Test 2: Phone Signup (New User)
```
1. POST /api/v1/auth/otp/start
   Body: { "phone": "+254712345678" }
   
2. Check SMS for OTP code
   
3. POST /api/v1/auth/otp/verify
   Body: { "sessionId": "<from step 1>", "otp": "<from SMS>" }
   
4. Note: requiresRoleSelection = true
   
5. POST /api/v1/auth/select-role
   Body: { "onboardingToken": "<from step 3>", "role": "customer" }
   
6. Copy the accessToken from response
   
7. GET /api/v1/auth/me
   Header: Authorization: Bearer <accessToken>
```

---

## Summary

The Ntumai authentication system provides a **secure, passwordless experience** with the following key features:

✅ **Passwordless OTP Authentication** - No passwords to remember  
✅ **Multi-Channel Support** - Email or phone number  
✅ **Multi-Role System** - CUSTOMER, TASKER, VENDOR  
✅ **Secure JWT Tokens** - Short-lived access tokens  
✅ **Rate Limiting** - Protection against abuse  
✅ **Device Tracking** - Enhanced security monitoring  

For any questions or issues, please refer to the Swagger documentation at `/api/docs` or contact the development team.

---

**Last Updated:** December 2025  
**API Version:** v1  
**Base URL:** `https://your-domain.com/api/v1/auth`
