
This document provides practical examples of how to interact with the Ntumai Auth API endpoints.

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.ntumai.com/api/v1`

## Standard Response Format

All API responses follow this standard envelope:

```json
{
  "success": true,
  "data": {},
  "error": {
    "code": "string",
    "message": "string"
  },
  "meta": {
    "timestamp": "2025-01-18T10:30:00Z",
    "requestId": "abc123"
  }
}
```

## Authentication Flow Examples

### 1. OTP-First Registration (Email)

#### Step 1: Request OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "register",
    "email": "amina@example.com"
  }'
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "challengeId": "a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e",
    "expiresAt": "2025-01-18T10:40:00Z",
    "resendAvailableAt": "2025-01-18T10:31:00Z",
    "attemptsAllowed": 5
  },
  "meta": {
    "timestamp": "2025-01-18T10:30:00Z",
    "requestId": "req_123"
  }
}
```

## Notifications API

### 1. Fetch Notification History

```bash
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "a340c3c6-5de3-4d08-8a64-0e3520a0c5d4",
        "title": "Welcome to Ntumai",
        "message": "Welcome Amina!",
        "type": "SYSTEM",
        "isRead": false,
        "createdAt": "2025-01-18T10:30:00Z",
        "updatedAt": "2025-01-18T10:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "hasMore": false
    },
    "unreadCount": 1
  }
}
```

### 2. Mark a Notification as Read

```bash
curl -X PATCH http://localhost:3000/api/v1/notifications/a340c3c6-5de3-4d08-8a64-0e3520a0c5d4/read \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "a340c3c6-5de3-4d08-8a64-0e3520a0c5d4",
      "title": "Welcome to Ntumai",
      "message": "Welcome Amina!",
      "type": "SYSTEM",
      "isRead": true,
      "createdAt": "2025-01-18T10:30:00Z",
      "updatedAt": "2025-01-18T10:35:12Z"
    }
  }
}
```

### 3. Mark All Notifications as Read

```bash
curl -X PATCH http://localhost:3000/api/v1/notifications/read-all \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```json
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

#### Step 2: Verify OTP (New User)

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e",
    "otp": "123456"
  }'
```

**Response (200 OK - New User):**

```json
{
  "success": true,
  "data": {
    "registrationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 600
  },
  "meta": {
    "timestamp": "2025-01-18T10:31:00Z",
    "requestId": "req_124"
  }
}
```

#### Step 3: Complete Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "registrationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "firstName": "Amina",
    "lastName": "Tembo",
    "password": "SecurePass123!",
    "role": "CUSTOMER"
  }'
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh7x9k2l0000qh8v4g2m1n3p",
      "email": "amina@example.com",
      "firstName": "Amina",
      "lastName": "Tembo",
      "role": "CUSTOMER",
      "phone": null,
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "profileComplete": true,
      "createdAt": "2025-01-18T10:32:00Z",
      "updatedAt": "2025-01-18T10:32:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  },
  "meta": {
    "timestamp": "2025-01-18T10:32:00Z",
    "requestId": "req_125"
  }
}
```

### 2. OTP-First Login (Phone)

#### Step 1: Request OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "login",
    "phone": "972827372",
    "countryCode": "+260"
  }'
```

#### Step 2: Verify OTP (Existing User)

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "b6d2e20f-1g5c-5d37-a2e6-3g36c2e94d3f",
    "otp": "654321"
  }'
```

**Response (200 OK - Existing User):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh7x9k2l0000qh8v4g2m1n3p",
      "email": null,
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "phone": "+260972827372",
      "isEmailVerified": false,
      "isPhoneVerified": true,
      "profileComplete": true,
      "createdAt": "2025-01-10T10:30:00Z",
      "updatedAt": "2025-01-18T10:35:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  },
  "meta": {
    "timestamp": "2025-01-18T10:35:00Z",
    "requestId": "req_126"
  }
}
```

### 3. Access Protected Endpoints

```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "clh7x9k2l0000qh8v4g2m1n3p",
    "email": "amina@example.com",
    "firstName": "Amina",
    "lastName": "Tembo",
    "phone": null,
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "isPhoneVerified": false,
    "profileComplete": true,
    "createdAt": "2025-01-18T10:32:00Z",
    "updatedAt": "2025-01-18T10:32:00Z"
  },
  "meta": {
    "timestamp": "2025-01-18T10:36:00Z",
    "requestId": "req_127"
  }
}
```

### 4. Refresh Access Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  },
  "meta": {
    "timestamp": "2025-01-18T11:36:00Z",
    "requestId": "req_128"
  }
}
```

### 5. Logout from Current Device

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clh7x9k2l0000qh8v4g2m1n3p",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceId": "device_android_123456"
  }'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "2025-01-18T11:40:00Z",
    "requestId": "req_129"
  }
}
```

### 6. Logout from All Devices

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out from all devices successfully"
  },
  "meta": {
    "timestamp": "2025-01-18T11:45:00Z",
    "requestId": "req_130"
  }
}
```

### 7. Forgot Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amina@example.com"
  }'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "If the email/phone exists, a reset OTP has been sent",
    "requestId": "pwd_reset_clh7x9k2l0000qh8v4g2m1n3p",
    "expiresAt": "2025-01-18T11:55:00Z"
  },
  "meta": {
    "timestamp": "2025-01-18T11:45:00Z",
    "requestId": "req_131"
  }
}
```

### 8. Reset Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "789012",
    "requestId": "pwd_reset_clh7x9k2l0000qh8v4g2m1n3p",
    "newPassword": "NewSecure123!",
    "email": "amina@example.com"
  }'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  },
  "meta": {
    "timestamp": "2025-01-18T11:46:00Z",
    "requestId": "req_132"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "AUTH/OTP_INVALID",
    "message": "Invalid OTP"
  },
  "meta": {
    "timestamp": "2025-01-18T10:35:00Z",
    "requestId": "req_133",
    "path": "/api/v1/auth/otp/verify"
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "AUTH/UNAUTHORIZED",
    "message": "Unauthorized"
  },
  "meta": {
    "timestamp": "2025-01-18T10:36:00Z",
    "requestId": "req_134",
    "path": "/api/v1/auth/profile"
  }
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "AUTH/TOO_MANY_ATTEMPTS",
    "message": "Maximum OTP attempts exceeded"
  },
  "meta": {
    "timestamp": "2025-01-18T10:37:00Z",
    "requestId": "req_135",
    "path": "/api/v1/auth/otp/verify"
  }
}
```

## JavaScript/TypeScript SDK Example

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class NtumaiAuthClient {
  private accessToken: string | null = null;

  async requestOtp(email: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/otp/request`, {
      purpose: 'register',
      email,
    });
    return response.data.data;
  }

  async verifyOtp(challengeId: string, otp: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/otp/verify`, {
      challengeId,
      otp,
    });
    return response.data.data;
  }

  async register(registrationToken: string, userData: any) {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      registrationToken,
      ...userData,
    });
    this.accessToken = response.data.data.tokens.accessToken;
    return response.data.data;
  }

  async getProfile() {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.data.data;
  }
}

// Usage
const client = new NtumaiAuthClient();
const { challengeId } = await client.requestOtp('user@example.com');
const { registrationToken } = await client.verifyOtp(challengeId, '123456');
const { user, tokens } = await client.register(registrationToken, {
  firstName: 'John',
  lastName: 'Doe',
  password: 'Password123!',
  role: 'CUSTOMER',
});
const profile = await client.getProfile();
```
