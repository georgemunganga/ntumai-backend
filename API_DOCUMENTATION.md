# NTUMAI Backend API Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Current Modules](#current-modules)
- [Planned Modules](#planned-modules)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)

## 🚀 Overview

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.ntumai.com/api/v1
```

### API Versioning
All API endpoints are versioned using URL path versioning:
- Current version: `v1`
- Format: `/api/v1/{endpoint}`

### Content Type
All requests and responses use JSON format:
```
Content-Type: application/json
```

### Standard Response Format
```json
{
  "success": boolean,
  "data": any,
  "error": {
    "code": "string",
    "message": "string"
  },
  "meta": {
    "timestamp": "ISO 8601 string",
    "requestId": "string"
  }
}
```

## 🔐 Authentication

### JWT Token Authentication
Most endpoints require authentication via JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### User Roles
- **ADMIN** - Full system access
- **VENDOR** - Store and product management
- **DRIVER** - Delivery and task management  
- **CUSTOMER** - Shopping and ordering

### Authentication Endpoints

All authentication endpoints return data inside the standard response envelope described in the [Overview](#overview).

#### POST /auth/register
Create a new account using email/password credentials or finalize an OTP-based registration by providing the `registrationToken` returned from `/auth/otp/verify`.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+260972827372",
  "role": "CUSTOMER"
}
```

**Request Body (OTP completion)**
```json
{
  "registrationToken": "<short-lived-jwt>",
  "firstName": "Amina",
  "lastName": "Tembo",
  "password": "SecurePass123!",
  "role": "CUSTOMER"
}
```

**201 Created**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh7x9k2l0000qh8v4g2m1n3p",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "phone": "+260972827372",
      "isEmailVerified": false,
      "isPhoneVerified": false
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/login
Authenticate a user with either email or phone + password.

**Request Body (email login)**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Body (phone login)**
```json
{
  "phoneNumber": "+260972827372",
  "password": "SecurePass123!"
}
```

**200 OK**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh7x9k2l0000qh8v4g2m1n3p",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "phone": "+260972827372",
      "isEmailVerified": true,
      "isPhoneVerified": true
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/refresh
Exchange a refresh token for a new access token pair.

**Request Body**
```json
{
  "refreshToken": "<jwt>"
}
```

**200 OK**
```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

#### POST /auth/forgot-password
Request a password reset OTP via email or SMS. Always returns 200 to avoid account enumeration.

**Request Body (email)**
```json
{
  "email": "user@example.com"
}
```

**Request Body (phone)**
```json
{
  "phoneNumber": "+260972827372",
  "countryCode": "ZM"
}
```

**200 OK**
```json
{
  "success": true,
  "message": "If the email/phone exists, a reset OTP has been sent",
  "requestId": "pwd_reset_clh7x9k2l0000qh8v4g2m1n3p",
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

#### POST /auth/reset-password
Complete a password reset by supplying the OTP and new password.

**Request Body**
```json
{
  "otp": "123456",
  "requestId": "pwd_reset_clh7x9k2l0000qh8v4g2m1n3p",
  "newPassword": "NewSecure123!",
  "email": "user@example.com"
}
```

**200 OK**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

#### POST /auth/logout-all
Invalidate every refresh token issued to the authenticated user.

**Headers**
```http
Authorization: Bearer <access_token>
```

**200 OK**
```json
{
  "success": true,
  "data": {
    "message": "Logged out from all devices successfully"
  }
}
```

#### GET /auth/profile
Return the currently authenticated user profile.

**Headers**
```http
Authorization: Bearer <access_token>
```

**200 OK**
```json
{
  "success": true,
  "data": {
    "id": "clh7x9k2l0000qh8v4g2m1n3p",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+260972827372",
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "profileComplete": true,
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /auth/otp/request
Request a neutral OTP challenge for login or registration. The response is identical regardless of whether the identifier exists.

**Request Body**
```json
{
  "phone": "972827372",
  "countryCode": "+260",
  "purpose": "login"
}
```

**202 Accepted**
```json
{
  "success": true,
  "message": "If the identifier is registered you will receive an OTP shortly.",
  "data": {
    "challengeId": "a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e",
    "expiresAt": "2024-01-15T10:35:00Z",
    "resendAvailableAt": "2024-01-15T10:31:00Z",
    "attemptsAllowed": 5
  }
}
```

#### POST /auth/otp/verify
Validate the OTP code. Existing users receive access credentials, while unknown identifiers return a short-lived registration token.

**Request Body**
```json
{
  "challengeId": "a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e",
  "otp": "123456"
}
```

**200 OK (existing user)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clh7x9k2l0000qh8v4g2m1n3p",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "phone": "+260972827372",
      "isEmailVerified": true,
      "isPhoneVerified": true
    },
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    }
  }
}
```

**200 OK (new user)**
```json
{
  "success": true,
  "data": {
    "registrationToken": "<short-lived-jwt>",
    "expiresIn": 600
  }
}
```

Use the returned `registrationToken` with `POST /auth/register` to create the account.

#### POST /auth/logout
Invalidate a specific refresh token (or all tokens tied to a device) for the provided user ID.

**Request Body**
```json
{
  "userId": "clh7x9k2l0000qh8v4g2m1n3p",
  "refreshToken": "<jwt>",
  "deviceId": "device_android_123456"
}
```

**200 OK**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📦 Current Modules

### 👥 Users Module

#### GET /users/profile
Get current user profile.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "addresses": []
  }
}
```

#### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### POST /users/addresses
Add new address.

**Request Body:**
```json
{
  "type": "HOME",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "isDefault": true
}
```

### 🏪 Products Module

#### GET /products
Get paginated list of products.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `search` (string): Search in product name/description
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (name, price, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "description": "Product description",
        "price": 29.99,
        "category": "Electronics",
        "images": ["url1", "url2"],
        "stock": 100,
        "isActive": true,
        "store": {
          "id": "uuid",
          "name": "Store Name"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /products/:id
Get product details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 29.99,
    "category": "Electronics",
    "images": ["url1", "url2"],
    "stock": 100,
    "isActive": true,
    "specifications": {},
    "variants": [],
    "reviews": [],
    "store": {
      "id": "uuid",
      "name": "Store Name",
      "rating": 4.5
    }
  }
}
```

#### POST /products (Vendor only)
Create new product.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "category": "Electronics",
  "images": ["url1", "url2"],
  "stock": 100,
  "specifications": {}
}
```

### 🛒 Orders Module

#### GET /orders
Get user's orders.

**Query Parameters:**
- `status` (string): Filter by order status
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-2024-001",
        "status": "PENDING",
        "totalAmount": 59.98,
        "items": [
          {
            "productId": "uuid",
            "productName": "Product Name",
            "quantity": 2,
            "price": 29.99
          }
        ],
        "deliveryAddress": {},
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /orders
Create new order.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "deliveryAddressId": "uuid",
  "paymentMethodId": "uuid",
  "discountCode": "SAVE10"
}
```

#### GET /orders/:id
Get order details.

#### PUT /orders/:id/status (Admin/Vendor only)
Update order status.

### 🚚 Delivery Module

#### GET /delivery/assignments (Driver only)
Get delivery assignments for driver.

#### POST /delivery/assignments/:id/accept (Driver only)
Accept delivery assignment.

#### PUT /delivery/assignments/:id/status (Driver only)
Update delivery status.

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "notes": "On the way"
}
```

### 💬 Chat Module (WebSocket)

#### WebSocket Connection
```javascript
const socket = io('/chat', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

#### Events
- `join_room` - Join chat room
- `leave_room` - Leave chat room
- `send_message` - Send message
- `message_received` - Receive message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### 📱 Notifications Module

#### GET /notifications
Get user notifications.

#### PUT /notifications/:id/read
Mark notification as read.

#### POST /notifications/preferences
Update notification preferences.

### 💳 Payments Module

#### GET /payments/methods
Get user's payment methods.

#### POST /payments/methods
Add new payment method.

#### POST /payments/process
Process payment for order.

### ⭐ Reviews Module

#### GET /reviews/product/:productId
Get product reviews.

#### POST /reviews
Create new review.

**Request Body:**
```json
{
  "entityType": "PRODUCT",
  "entityId": "uuid",
  "rating": 5,
  "comment": "Great product!",
  "images": ["url1"]
}
```

## 🔄 Planned Modules

### 🎯 Onboarding Module (Coming Soon)

#### GET /onboarding/flow
Get onboarding flow for user role.

#### POST /onboarding/step/complete
Complete onboarding step.

#### GET /onboarding/progress
Get user's onboarding progress.

### 📋 KYC Module (Coming Soon)

#### POST /kyc/documents/upload
Upload KYC document.

#### GET /kyc/status
Get KYC verification status.

#### PUT /kyc/documents/:id/verify (Admin only)
Verify uploaded document.

### 📦 Inventory Management (Coming Soon)

#### GET /inventory/products
Get inventory for vendor's products.

#### PUT /inventory/products/:id/stock
Update product stock.

#### GET /inventory/alerts
Get low stock alerts.

#### POST /inventory/restock
Schedule product restock.

### 🗺️ Geolocation & Mapping (Coming Soon)

#### POST /geolocation/track
Update location tracking.

#### GET /geolocation/route/optimize
Get optimized delivery route.

#### POST /geolocation/geofence
Create geofence zone.

### 📊 Reports & Audit Logs (Coming Soon)

#### GET /reports/sales
Get sales reports.

#### GET /reports/delivery
Get delivery performance reports.

#### GET /audit/logs
Get audit logs (Admin only).

## ❌ Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - JWT token required
- `INVALID_TOKEN` - JWT token is invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests

## 🚦 Rate Limiting

### Default Limits
- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute
- **WebSocket connections**: 50 connections per IP

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔗 Webhooks

### Supported Events
- `order.created`
- `order.updated`
- `payment.completed`
- `delivery.status_changed`
- `user.verified`

### Webhook Payload Format
```json
{
  "event": "order.created",
  "data": {
    "orderId": "uuid",
    "userId": "uuid",
    "totalAmount": 59.98
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "signature": "webhook_signature"
}
```

## 📝 Notes

### Pagination
All list endpoints support pagination with the following parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

### Filtering and Sorting
Most list endpoints support:
- Filtering via query parameters
- Sorting via `sortBy` and `sortOrder` parameters
- Search via `search` parameter

### File Uploads
File uploads use multipart/form-data:
```http
Content-Type: multipart/form-data
```

### Date Formats
All dates use ISO 8601 format:
```
2024-01-01T00:00:00Z
```

---

**For more information, see:**
- [Module Analysis](./module_analysis.md)
- [Schema Gap Analysis](./schema_gap_analysis.md)
- [Implementation Roadmap](./implementation_roadmap.md)
- [README](./README.md)