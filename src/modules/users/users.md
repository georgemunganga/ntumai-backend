# User Profile APIs Documentation

## Overview

This document outlines the comprehensive User Profile API endpoints for a multi-role platform supporting customers, drivers, vendors, and admins. The APIs are designed to handle role-specific data, verification workflows, and user preferences.

## Table of Contents

1. [Data Model Extensions](#data-model-extensions)
2. [Profile Management APIs](#profile-management-apis)
3. [Address Management APIs](#address-management-apis)
4. [Account Control APIs](#account-control-apis)
5. [Verification APIs](#verification-apis)
6. [Role-Aware Statistics](#role-aware-statistics)
7. [Additional Features](#additional-features)

## Data Model Extensions

### Enhanced User Profile Fields

The user profile includes standard fields plus role-specific extensions:

#### Core Fields
- `status` → `active`, `suspended`, `pending_verification`
- `isVerified` → boolean (KYC or email/phone verification flag)
- `dateOfBirth` → string (useful for KYC or age-restricted services)
- `gender` → string (optional)
- `preferredLanguage` → string
- `preferredCurrency` → string
- `lastLogin` → timestamp
- `referralCode` → string
- `referredBy` → string

#### Role-Specific Data Structure

```json
"userTypeDetails": {
  "driver": {
    "licenseNumber": "string",
    "vehicleType": "string",
    "vehiclePlate": "string",
    "rating": "number"
  },
  "vendor": {
    "businessName": "string",
    "businessRegNumber": "string",
    "rating": "number"
  },
  "customer": {
    "loyaltyPoints": "number"
  }
}
```

### Enhanced Address Fields

Extended address schema includes:
- `landmark` → string (e.g. "Near Mall, Gate 3")
- `instructions` → string (delivery note: "Leave at reception")
- `contactPersonName` → string (if different from account holder)
- `contactPhone` → string (alternative contact for deliveries)

## Profile Management APIs

### 1. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Description:** Get current user's complete profile information including role-specific data and statistics

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "phoneNumber": "string",
  "email": "string",
  "profileImage": "string",
  "userType": "string", // customer, driver, vendor, admin
  "status": "string", // active, suspended, pending_verification
  "isVerified": "boolean",
  "dateOfBirth": "string",
  "gender": "string",
  "preferredLanguage": "string",
  "preferredCurrency": "string",
  "lastLogin": "string",
  "referralCode": "string",
  "referredBy": "string",
  "userTypeDetails": {
    "driver": {
      "licenseNumber": "string",
      "vehicleType": "string",
      "vehiclePlate": "string",
      "rating": "number"
    },
    "vendor": {
      "businessName": "string",
      "businessRegNumber": "string",
      "rating": "number"
    },
    "customer": {
      "loyaltyPoints": "number"
    }
  },
  "stats": {
    "customerStats": {
      "totalOrders": 42,
      "activeOrders": 2,
      "cancelledOrders": 5,
      "loyaltyPoints": 1500,
      "averageRatingGiven": 4.8
    },
    "driverStats": {
      "totalRides": 320,
      "completedRides": 310,
      "cancelledRides": 10,
      "acceptanceRate": 95.5,
      "completionRate": 97.0,
      "averageRating": 4.9,
      "earningsThisMonth": 1200.50,
      "totalEarnings": 15400.75,
      "onlineHours": 240
    },
    "vendorStats": {
      "totalOrders": 550,
      "completedOrders": 530,
      "cancelledOrders": 20,
      "averageRating": 4.7,
      "earningsThisMonth": 3500.00,
      "totalEarnings": 48200.00,
      "listedProducts": 120,
      "activeProducts": 115
    }
  },
  "addresses": [
    {
      "id": "string",
      "type": "string", // home, work, other
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "landmark": "string",
      "instructions": "string",
      "contactPersonName": "string",
      "contactPhone": "string",
      "isDefault": "boolean"
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 2. Update User Profile

**Endpoint:** `PUT /api/users/profile`

**Description:** Update user profile information

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "profileImage": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "preferredLanguage": "string",
  "preferredCurrency": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "profileImage": "string",
    "preferredLanguage": "string",
    "preferredCurrency": "string",
    "updatedAt": "string"
  }
}
```

### 3. Change Password

**Endpoint:** `PUT /api/users/change-password`

**Description:** Change user's password

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 4. Upload Profile Image

**Endpoint:** `POST /api/users/upload-profile-image`

**Description:** Upload user profile image (supports CDN integration)

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Request:** Multipart form data with image file

**Response:**
```json
{
  "success": true,
  "imageUrl": "string"
}
```

## Address Management APIs

### 5. Add Address

**Endpoint:** `POST /api/users/addresses`

**Description:** Add a new address for the user (users can have multiple saved addresses)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "type": "string", // home, work, other
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "landmark": "string",
  "instructions": "string",
  "contactPersonName": "string",
  "contactPhone": "string",
  "isDefault": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "address": {
    "id": "string",
    "type": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "landmark": "string",
    "instructions": "string",
    "contactPersonName": "string",
    "contactPhone": "string",
    "isDefault": "boolean",
    "createdAt": "string"
  }
}
```

### 6. Update Address

**Endpoint:** `PUT /api/users/addresses/{addressId}`

**Description:** Update an existing address

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "type": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "landmark": "string",
  "instructions": "string",
  "contactPersonName": "string",
  "contactPhone": "string",
  "isDefault": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "address": {
    "id": "string",
    "type": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "landmark": "string",
    "instructions": "string",
    "contactPersonName": "string",
    "contactPhone": "string",
    "isDefault": "boolean",
    "updatedAt": "string"
  }
}
```

### 7. Delete Address

**Endpoint:** `DELETE /api/users/addresses/{addressId}`

**Description:** Delete an address

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### 8. Get All Addresses

**Endpoint:** `GET /api/users/addresses`

**Description:** Get all addresses for the current user

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**
```json
{
  "addresses": [
    {
      "id": "string",
      "type": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "landmark": "string",
      "instructions": "string",
      "contactPersonName": "string",
      "contactPhone": "string",
      "isDefault": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

## Account Control APIs

### 9. Deactivate Account

**Endpoint:** `PUT /api/users/deactivate`

**Description:** Deactivate (soft-delete) user account

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

### 10. Get User Settings

**Endpoint:** `GET /api/users/settings`

**Description:** Fetch user's app preferences/settings

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**
```json
{
  "notificationsEnabled": true,
  "darkMode": false,
  "preferredLanguage": "en",
  "preferredCurrency": "USD"
}
```

### 11. Update User Settings

**Endpoint:** `PUT /api/users/settings`

**Description:** Update app preferences/settings

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "notificationsEnabled": false,
  "darkMode": true,
  "preferredLanguage": "fr",
  "preferredCurrency": "ZMW"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

## Verification APIs

### 12. Verify Phone/Email

**Endpoint:** `POST /api/users/verify`

**Description:** Verify phone number or email address using OTP

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "type": "phone|email",
  "code": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification successful",
  "isVerified": true
}
```

### 13. Resend Verification Code

**Endpoint:** `POST /api/users/resend-code`

**Description:** Resend verification code for phone or email

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "type": "phone|email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

## Role-Aware Statistics

### Customer Statistics
```json
"customerStats": {
  "totalOrders": 42,
  "activeOrders": 2,
  "cancelledOrders": 5,
  "loyaltyPoints": 1500,
  "averageRatingGiven": 4.8
}
```

### Driver/Courier Statistics
```json
"driverStats": {
  "totalRides": 320,
  "completedRides": 310,
  "cancelledRides": 10,
  "acceptanceRate": 95.5,
  "completionRate": 97.0,
  "averageRating": 4.9,
  "earningsThisMonth": 1200.50,
  "totalEarnings": 15400.75,
  "onlineHours": 240
}
```

### Vendor Statistics
```json
"vendorStats": {
  "totalOrders": 550,
  "completedOrders": 530,
  "cancelledOrders": 20,
  "averageRating": 4.7,
  "earningsThisMonth": 3500.00,
  "totalEarnings": 48200.00,
  "listedProducts": 120,
  "activeProducts": 115
}
```

## Additional Features

### Authentication & Security
- Login / Signup / OTP Verify (handled by auth module)
- Refresh Token / Logout
- Social login support (Google, Facebook, Apple)

### User Role & Verification
- Switch Role (Customer ↔ Driver/Vendor, if supported)
- KYC Verification API (drivers/vendors upload ID, licenses, certifications)
- Bank / Payout Details (vendors & drivers need payout accounts)

### Orders & Bookings Integration
- Create Order/Booking
- Get My Orders (active, past, canceled)
- Order Tracking API
- Cancel Order / Request Refund
- Rate & Review Order

### Driver/Courier Specific APIs
- Driver Onboarding API
- Driver Availability / Go Online/Offline
- Accept / Reject Order
- Driver Live Location Updates (WebSocket or polling)
- Driver Earnings / Wallet Balance
- Payout Request API

## Benefits of This Architecture

✅ **Role-Aware Design**: Single profile API that adapts to user roles

✅ **Extensible**: Easy to add new roles (agent, partner) by adding new stats blocks

✅ **Unified Dashboard**: Clients don't need separate endpoints for user statistics

✅ **Comprehensive**: Covers all aspects of user profile management

✅ **Modern Standards**: Follows REST API best practices with proper HTTP methods and status codes

✅ **Security**: Consistent token-based authentication across all endpoints

✅ **Flexibility**: Supports multiple addresses, preferences, and role-specific data