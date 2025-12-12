# Onboarding API Documentation

## Overview

This document describes the complete onboarding flow for Tasker and Vendor roles after OTP authentication. The onboarding process is tightly integrated with the authentication flow and is part of the Auth module.

---

## Authentication Flow (Pre-Onboarding)

Users must complete OTP authentication before accessing onboarding endpoints:

```
1. POST /api/v1/auth/otp/start → Get session ID
2. POST /api/v1/auth/otp/verify → Get onboarding token (for new users)
3. POST /api/v1/auth/select-role → Get JWT token with role
4. Role-specific onboarding flows
```

---

## Tasker Onboarding Flow

### Overview

Taskers go through an 11-step onboarding process:

```
APPLIED → PRE_SCREEN_PASSED → KYC_PENDING → KYC_APPROVED → 
TRAINING_PENDING → TRAINING_COMPLETED → PROBATION → ACTIVE
```

Failure states: REJECTED, SUSPENDED, DEACTIVATED

### Endpoints

#### 1. POST /api/v1/riders/apply

**Submit tasker application**

**Authentication:** Required (JWT with any role)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+260972827372",
  "email": "john@example.com",
  "vehicleType": "motorcycle",
  "vehicleModel": "Honda CB200",
  "licensePlate": "ABC 123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "tasker_123",
    "userId": "user_123",
    "status": "APPLIED",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+260972827372",
    "email": "john@example.com",
    "vehicleType": "motorcycle",
    "vehicleModel": "Honda CB200",
    "licensePlate": "ABC 123",
    "documents": [],
    "canAcceptJobs": false,
    "isOnboarding": true,
    "nextStep": "PRE_SCREEN_PASSED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: User already has a tasker application
- `401 Unauthorized`: Not authenticated

---

#### 2. POST /api/v1/riders/kyc

**Upload KYC documents**

**Authentication:** Required (JWT with tasker role)

**Request Body:**
```json
{
  "driverLicense": "base64_encoded_image",
  "vehicleRegistration": "base64_encoded_image",
  "insurance": "base64_encoded_image",
  "policeClearance": "base64_encoded_image",
  "bankAccountName": "John Doe",
  "bankName": "Zanaco",
  "bankAccountNumber": "1234567890"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tasker_123",
    "userId": "user_123",
    "status": "KYC_PENDING",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+260972827372",
    "email": "john@example.com",
    "vehicleType": "motorcycle",
    "vehicleModel": "Honda CB200",
    "licensePlate": "ABC 123",
    "documents": [
      {
        "type": "driver_license",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      },
      {
        "type": "vehicle_registration",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      },
      {
        "type": "insurance_certificate",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      }
    ],
    "canAcceptJobs": false,
    "isOnboarding": true,
    "nextStep": "KYC_APPROVED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:05:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status for document upload
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Tasker not found

---

#### 3. POST /api/v1/riders/training/complete

**Complete training**

**Authentication:** Required (JWT with tasker role)

**Request Body:**
```json
{
  "trainingCertificateUrl": "https://example.com/certificate.pdf",
  "trainingScore": 85
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tasker_123",
    "userId": "user_123",
    "status": "TRAINING_COMPLETED",
    "firstName": "John",
    "lastName": "Doe",
    "trainingScore": 85,
    "canAcceptJobs": false,
    "isOnboarding": true,
    "nextStep": "PROBATION",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:30:00Z"
  }
}
```

---

#### 4. GET /api/v1/riders/me/onboarding-status

**Get tasker onboarding status**

**Authentication:** Required (JWT with tasker role)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tasker_123",
    "userId": "user_123",
    "status": "KYC_PENDING",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+260972827372",
    "email": "john@example.com",
    "vehicleType": "motorcycle",
    "vehicleModel": "Honda CB200",
    "licensePlate": "ABC 123",
    "documents": [
      {
        "type": "driver_license",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      }
    ],
    "canAcceptJobs": false,
    "isOnboarding": true,
    "nextStep": "KYC_APPROVED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:05:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Tasker not found

---

## Vendor Onboarding Flow

### Overview

Vendors go through a 4-step onboarding process:

```
PENDING → VERIFIED → ACTIVE
```

Failure state: SUSPENDED

### Endpoints

#### 1. POST /api/v1/vendors

**Create vendor account**

**Authentication:** Required (JWT with any role)

**Request Body:**
```json
{
  "businessName": "John's Restaurant",
  "businessType": "restaurant",
  "description": "Serving authentic Zambian cuisine",
  "phone": "+260972827372",
  "email": "john@example.com",
  "location": {
    "address": "123 Main Street",
    "city": "Lusaka",
    "district": "Kabulonga",
    "latitude": "-17.8252",
    "longitude": "25.8655"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "userId": "user_123",
    "status": "PENDING",
    "businessName": "John's Restaurant",
    "businessType": "restaurant",
    "description": "Serving authentic Zambian cuisine",
    "phone": "+260972827372",
    "email": "john@example.com",
    "location": {
      "address": "123 Main Street",
      "city": "Lusaka",
      "district": "Kabulonga",
      "latitude": "-17.8252",
      "longitude": "25.8655"
    },
    "documents": [],
    "canAcceptOrders": false,
    "isOnboarding": true,
    "isVerified": false,
    "nextStep": "VERIFIED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: User already has a vendor account
- `401 Unauthorized`: Not authenticated

---

#### 2. POST /api/v1/vendors/:id/kyc

**Upload KYC documents**

**Authentication:** Required (JWT with vendor role)

**Request Body:**
```json
{
  "businessRegistration": "base64_encoded_image",
  "taxId": "base64_encoded_image",
  "bankProof": "base64_encoded_image",
  "governmentId": "base64_encoded_image",
  "accountName": "John's Restaurant",
  "bankName": "Zanaco",
  "accountNumber": "1234567890",
  "branchCode": "001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "userId": "user_123",
    "status": "PENDING",
    "businessName": "John's Restaurant",
    "businessType": "restaurant",
    "description": "Serving authentic Zambian cuisine",
    "phone": "+260972827372",
    "email": "john@example.com",
    "location": {
      "address": "123 Main Street",
      "city": "Lusaka",
      "district": "Kabulonga",
      "latitude": "-17.8252",
      "longitude": "25.8655"
    },
    "documents": [
      {
        "type": "business_registration",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      },
      {
        "type": "tax_id",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      },
      {
        "type": "bank_proof",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      },
      {
        "type": "government_id",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      }
    ],
    "canAcceptOrders": false,
    "isOnboarding": true,
    "isVerified": false,
    "nextStep": "VERIFIED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:05:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status for document upload
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Vendor not found

---

#### 3. GET /api/v1/vendors/me/status

**Get vendor onboarding status**

**Authentication:** Required (JWT with vendor role)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "userId": "user_123",
    "status": "PENDING",
    "businessName": "John's Restaurant",
    "businessType": "restaurant",
    "description": "Serving authentic Zambian cuisine",
    "phone": "+260972827372",
    "email": "john@example.com",
    "location": {
      "address": "123 Main Street",
      "city": "Lusaka",
      "district": "Kabulonga",
      "latitude": "-17.8252",
      "longitude": "25.8655"
    },
    "documents": [
      {
        "type": "business_registration",
        "status": "PENDING",
        "uploadedAt": "2025-12-12T10:05:00Z"
      }
    ],
    "canAcceptOrders": false,
    "isOnboarding": true,
    "isVerified": false,
    "nextStep": "VERIFIED",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:05:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Vendor not found

---

## Onboarding Status States

### Tasker States

| State | Meaning | Next Step |
|-------|---------|-----------|
| APPLIED | Application submitted | PRE_SCREEN_PASSED |
| PRE_SCREEN_PASSED | Pre-screen quiz completed | KYC_PENDING |
| KYC_PENDING | Documents under review | KYC_APPROVED |
| KYC_APPROVED | Documents approved | TRAINING_PENDING |
| TRAINING_PENDING | Training not started | TRAINING_COMPLETED |
| TRAINING_COMPLETED | Training done | PROBATION |
| PROBATION | Limited orders available | ACTIVE |
| ACTIVE | Full access | - |
| REJECTED | Application rejected | - |
| SUSPENDED | Account suspended | - |
| DEACTIVATED | Account deactivated | - |

### Vendor States

| State | Meaning | Next Step |
|-------|---------|-----------|
| PENDING | Application submitted | VERIFIED |
| VERIFIED | Documents verified | ACTIVE |
| ACTIVE | Live and accepting orders | - |
| SUSPENDED | Account suspended | - |

---

## Available APIs After Onboarding

### Tasker APIs (once ACTIVE)

- `GET /api/v1/jobs` - Available jobs
- `POST /api/v1/jobs/:id/accept` - Accept job
- `GET /api/v1/jobs/:id` - Job details
- `POST /api/v1/jobs/:id/complete` - Mark job complete
- `GET /api/v1/wallet` - Earnings
- `GET /api/v1/riders/me/probation-kpis` - Probation metrics
- `GET /auth/me` - Profile

### Vendor APIs (once ACTIVE)

- `GET /api/v1/vendors/me` - Store profile
- `GET /api/v1/vendors/me/products` - Products
- `POST /api/v1/vendors/me/products` - Add product
- `GET /api/v1/vendors/me/orders` - Orders
- `POST /api/v1/vendors/me/orders/:id/status` - Update order status
- `GET /api/v1/vendors/me/reports` - Analytics
- `GET /auth/me` - Profile

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `BAD_REQUEST` - Invalid input
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_SERVER_ERROR` - Server error

---

## Implementation Notes

1. **Role Management**: All onboarding is tied to user roles. Users must select a role before accessing onboarding endpoints.

2. **State Machine**: Both Tasker and Vendor follow strict state machines. Transitions are only allowed in the correct order.

3. **Document Validation**: Documents are validated for:
   - File size (max 10MB)
   - File type (PDF, JPG, PNG)
   - Image quality (minimum resolution)

4. **Status Polling**: Mobile apps should poll `/riders/me/onboarding-status` or `/vendors/me/status` every 5-10 seconds to check for status updates.

5. **Admin Transitions**: Status transitions to PROBATION, ACTIVE, VERIFIED, etc. are handled by admin via separate admin APIs (not documented here).

---

## Next Steps for Frontend

1. **Tasker Flow**:
   - Show Tasker Onboarding Intro screen
   - Collect application info → POST /riders/apply
   - Collect documents → POST /riders/kyc
   - Show training screen → POST /riders/training/complete
   - Poll status → GET /riders/me/onboarding-status
   - Once ACTIVE, show Tasker Dashboard

2. **Vendor Flow**:
   - Show Vendor Onboarding Intro screen
   - Collect business info → POST /vendors
   - Collect documents → POST /vendors/:id/kyc
   - Poll status → GET /vendors/me/status
   - Once ACTIVE, show Vendor Dashboard

3. **Role Switching**:
   - Users can switch between Customer and Tasker/Vendor roles
   - Use POST /auth/select-role to switch roles
   - Onboarding status persists across role switches
