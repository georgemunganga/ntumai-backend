# User Roles and API Access Control

**Date:** December 18, 2025  
**Version:** 1.0

---

## Overview

The Ntumai platform supports a **multi-role user system** where a single user account can have multiple roles. Users can switch between roles, and each role has specific permissions and access to different API endpoints.

---

## User Roles

### 1. **CUSTOMER** 👤

**Description:** End-users who initiate tasks, make purchases, and request deliveries.

**Capabilities:**
- Browse and purchase from marketplace
- Request P2P deliveries
- Book errands and tasks
- Track orders and deliveries
- Manage addresses and payment methods
- View order history
- Rate and review taskers and vendors
- Switch to TASKER role (after KYC approval)

**Onboarding:**
- Phone/Email verification via OTP
- Basic profile setup (name, email)
- Optional: Add addresses and payment methods

**KYC Required:** No

---

### 2. **TASKER** (also called RIDER) 🏍️

**Description:** Service providers who deliver packages, complete errands, and fulfill marketplace orders.

**Capabilities:**
- Receive system-assigned job offers
- Accept/reject job assignments
- Navigate to pickup and delivery locations
- Update task status and progress
- Track earnings and performance metrics
- Manage shift status (online/offline)
- View payout history
- Switch back to CUSTOMER role

**Onboarding:**
- Must first be a CUSTOMER
- Apply to become a TASKER
- Complete KYC process:
  - Upload ID document
  - Upload driver's license (if using vehicle)
  - Upload vehicle registration (if applicable)
  - Provide vehicle type (WALK, BICYCLE, MOTORBIKE, CAR)
- Wait for admin approval
- Complete probation period (first 10-20 deliveries)

**KYC Required:** Yes (PENDING → APPROVED → ACTIVE)

**Important Notes:**
- Taskers **CANNOT** browse or select jobs
- Jobs are **system-assigned** based on proximity and rating
- Job offers appear as time-sensitive notifications
- Must maintain minimum rating and performance metrics

---

### 3. **VENDOR** (also called MERCHANT) 🏪

**Description:** Business owners who sell products through the marketplace.

**Capabilities:**
- Manage product catalog (add, edit, delete products)
- Set product prices and availability
- Receive and manage marketplace orders
- Track sales and earnings
- Manage business hours and settings
- View analytics and reports
- Process refunds and cancellations

**Onboarding:**
- Must first be a CUSTOMER
- Apply to become a VENDOR
- Complete KYC process:
  - Upload business registration documents
  - Provide business name and type
  - Upload business license
  - Provide tax information
- Wait for admin approval
- Set up product catalog

**KYC Required:** Yes (PENDING → APPROVED → ACTIVE)

---

## Role Switching

### Multi-Role System

A single user can have multiple roles:
- **CUSTOMER only** (default for all users)
- **CUSTOMER + TASKER** (after TASKER KYC approval)
- **CUSTOMER + VENDOR** (after VENDOR KYC approval)
- **CUSTOMER + TASKER + VENDOR** (all roles active)

### Role Switching Flow

1. User selects desired role from role switcher in app
2. App sends `POST /api/v1/auth/role-switch` with `roleType`
3. Backend validates user has that role and it's active
4. Backend issues new JWT token scoped to the selected role
5. App updates session and navigates to role-specific home screen

### Security

- Each role has its own JWT token with role-specific permissions
- API endpoints enforce role-based access control (RBAC)
- Users cannot access endpoints for roles they don't have
- Role switching requires re-authentication with new token

---

## API Access by Role

### Public Endpoints (No Authentication)

```
GET    /                           # Health check
GET    /health                     # Health status
```

### Authentication Endpoints (No Role Required)

```
POST   /api/v1/auth/request-otp    # Request OTP (v1)
POST   /api/v1/auth/verify-otp     # Verify OTP (v1)
POST   /api/v1/auth/otp/start      # Start OTP flow (v2)
POST   /api/v1/auth/otp/verify     # Verify OTP (v2)
POST   /api/v1/auth/otp/resend     # Resend OTP (v2)
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # Logout
```

### CUSTOMER-Only Endpoints

```
# Marketplace - Browsing
GET    /api/v1/marketplace/catalog/products
GET    /api/v1/marketplace/catalog/products/:id
GET    /api/v1/marketplace/catalog/categories
GET    /api/v1/marketplace/catalog/brands
GET    /api/v1/marketplace/catalog/search

# Marketplace - Cart
POST   /api/v1/marketplace/cart/items
GET    /api/v1/marketplace/cart
PUT    /api/v1/marketplace/cart/items/:id
DELETE /api/v1/marketplace/cart/items/:id
DELETE /api/v1/marketplace/cart

# Marketplace - Orders
POST   /api/v1/marketplace/orders
GET    /api/v1/marketplace/orders
GET    /api/v1/marketplace/orders/:id
POST   /api/v1/marketplace/orders/:id/cancel

# Deliveries (P2P)
POST   /api/v1/deliveries
GET    /api/v1/deliveries
GET    /api/v1/deliveries/:id
PUT    /api/v1/deliveries/:id
DELETE /api/v1/deliveries/:id

# Tracking (as customer)
GET    /api/v1/tracking/delivery/:id
GET    /api/v1/tracking/booking/:id

# Reviews
POST   /api/v1/marketplace/reviews
GET    /api/v1/marketplace/reviews/tasker/:id
GET    /api/v1/marketplace/reviews/vendor/:id
```

### TASKER-Only Endpoints

```
# Onboarding
POST   /api/v1/auth/onboarding/rider/initiate
POST   /api/v1/auth/onboarding/rider/complete

# Matching (Job Assignment)
POST   /api/v1/matching/bookings/:id/respond    # Accept/reject job
POST   /api/v1/matching/bookings/:id/progress   # Update progress
POST   /api/v1/matching/bookings/:id/complete   # Complete job
GET    /api/v1/matching/bookings/:id            # Get job details
GET    /api/v1/matching/bookings/:id/timers     # Get acceptance timer

# Shifts
POST   /api/v1/shifts/start
POST   /api/v1/shifts/:id/end
POST   /api/v1/shifts/:id/pause
POST   /api/v1/shifts/:id/resume
GET    /api/v1/shifts/current
GET    /api/v1/shifts
GET    /api/v1/shifts/:id
PUT    /api/v1/shifts/:id/location

# Shift Analytics
GET    /api/v1/shifts/summary/daily
GET    /api/v1/shifts/summary/weekly
GET    /api/v1/shifts/summary/monthly
GET    /api/v1/shifts/analytics/performance

# Tracking (location updates)
POST   /api/v1/tracking/events
```

### VENDOR-Only Endpoints

```
# Onboarding
POST   /api/v1/auth/onboarding/vendor/initiate
POST   /api/v1/auth/onboarding/vendor/complete

# Product Management
POST   /api/v1/marketplace/vendor/products
GET    /api/v1/marketplace/vendor/products
GET    /api/v1/marketplace/vendor/products/:id
PUT    /api/v1/marketplace/vendor/products/:id
DELETE /api/v1/marketplace/vendor/products/:id
PUT    /api/v1/marketplace/vendor/products/:id/availability

# Order Management
GET    /api/v1/marketplace/vendor/orders
GET    /api/v1/marketplace/vendor/orders/:id
PUT    /api/v1/marketplace/vendor/orders/:id/status
POST   /api/v1/marketplace/vendor/orders/:id/refund

# Analytics
GET    /api/v1/marketplace/vendor/analytics/sales
GET    /api/v1/marketplace/vendor/analytics/products
GET    /api/v1/marketplace/vendor/analytics/revenue
```

### Shared Endpoints (All Authenticated Users)

```
# Profile Management
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
POST   /api/v1/users/avatar

# Address Management
GET    /api/v1/users/addresses
POST   /api/v1/users/addresses
PUT    /api/v1/users/addresses/:id
DELETE /api/v1/users/addresses/:id

# Preferences
GET    /api/v1/users/preferences
PUT    /api/v1/users/preferences

# Notifications
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id

# Wallet
GET    /api/v1/wallet
GET    /api/v1/wallet/transactions
POST   /api/v1/wallet/topup
POST   /api/v1/wallet/withdraw

# Role Switching
POST   /api/v1/auth/role-switch
```

---

## Role-Based Access Control (RBAC) Implementation

### JWT Token Structure

```typescript
{
  sub: "user-id-uuid",
  phoneNumber: "+254712345678",
  activeRole: "CUSTOMER" | "TASKER" | "VENDOR",
  roles: ["CUSTOMER", "TASKER"],
  iat: 1234567890,
  exp: 1234567890
}
```

### Guards and Decorators

#### 1. JwtAuthGuard
Ensures user is authenticated (has valid JWT token).

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

#### 2. RolesGuard
Ensures user has required role(s).

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TASKER')
@Post('shifts/start')
startShift(@Request() req) {
  // Only TASKER can access
}
```

#### 3. Public Decorator
Marks endpoints as public (no authentication required).

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### Implementation Example

```typescript
// Endpoint accessible only by CUSTOMER
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
@Post('marketplace/cart/items')
addToCart(@Request() req, @Body() dto: AddToCartDto) {
  return this.cartService.addItem(req.user.id, dto);
}

// Endpoint accessible by CUSTOMER or TASKER
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER', 'TASKER')
@Get('deliveries/:id')
getDelivery(@Param('id') id: string, @Request() req) {
  return this.deliveryService.findOne(id, req.user.id);
}

// Endpoint accessible by any authenticated user
@UseGuards(JwtAuthGuard)
@Get('users/profile')
getProfile(@Request() req) {
  return this.userService.getProfile(req.user.id);
}
```

---

## API Endpoint Categorization Summary

| Category | CUSTOMER | TASKER | VENDOR | Notes |
|----------|----------|--------|--------|-------|
| **Authentication** | ✅ | ✅ | ✅ | All roles |
| **Profile & Settings** | ✅ | ✅ | ✅ | All roles |
| **Marketplace Browsing** | ✅ | ❌ | ❌ | Customer only |
| **Shopping Cart** | ✅ | ❌ | ❌ | Customer only |
| **Place Orders** | ✅ | ❌ | ❌ | Customer only |
| **P2P Deliveries** | ✅ | ❌ | ❌ | Customer creates |
| **Job Assignment** | ❌ | ✅ | ❌ | Tasker only |
| **Shift Management** | ❌ | ✅ | ❌ | Tasker only |
| **Location Tracking** | ❌ | ✅ | ❌ | Tasker sends updates |
| **Product Management** | ❌ | ❌ | ✅ | Vendor only |
| **Vendor Orders** | ❌ | ❌ | ✅ | Vendor only |
| **Reviews & Ratings** | ✅ | ❌ | ❌ | Customer rates others |
| **Notifications** | ✅ | ✅ | ✅ | All roles |
| **Wallet** | ✅ | ✅ | ✅ | All roles |

---

## Business Rules

### 1. Role Activation

- **CUSTOMER:** Activated immediately upon registration
- **TASKER:** Activated after KYC approval + probation period
- **VENDOR:** Activated after KYC approval + catalog setup

### 2. Role Switching

- Users can switch roles only if they have multiple active roles
- Role switch requires new JWT token
- Previous token is invalidated
- App must navigate to role-specific home screen

### 3. KYC Status Flow

```
PENDING → UNDER_REVIEW → APPROVED → ACTIVE
                      ↓
                  REJECTED
```

### 4. Tasker Job Assignment

- Jobs are **system-assigned** based on:
  - Proximity to pickup location
  - Tasker rating and performance
  - Tasker availability (online/in-shift)
- Taskers receive job offer notification
- 30-60 second acceptance window
- Auto-reject if not responded

### 5. Access Control

- Endpoints enforce role-based permissions at API level
- Mobile app UI adapts based on active role
- Unauthorized access returns `403 Forbidden`
- Missing authentication returns `401 Unauthorized`

---

## Summary

The Ntumai platform implements a sophisticated multi-role system with:

- ✅ **3 distinct user roles** (CUSTOMER, TASKER, VENDOR)
- ✅ **Multi-role support** (users can have multiple roles)
- ✅ **Secure role switching** with new JWT tokens
- ✅ **Role-based API access control** (RBAC)
- ✅ **KYC workflows** for TASKER and VENDOR
- ✅ **System-assigned jobs** for TASKER (no job browsing)
- ✅ **Separate UI/UX** for each role

This design ensures security, scalability, and a clear separation of concerns across different user types.
