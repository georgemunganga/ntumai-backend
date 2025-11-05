# Ntumai User Module

## 🎯 Overview

The User module provides comprehensive functionality for managing user profiles, roles, addresses, devices, and preferences. It is fully integrated with the shared database and leverages the existing Auth module for authentication.

This module follows the same Domain-Driven Design (DDD) principles as the Auth module, with a clean, layered architecture.

## ✅ Core Features Implemented

1.  **User Profile Management**
    -   Get authenticated user profile
    -   Update user profile (first name, last name, avatar URL)
    -   Change password with current password verification
    -   Upload profile image (via URL or multipart form)

2.  **Multi-Role System**
    -   Register new roles for a user (CUSTOMER, VENDOR, DRIVER)
    -   Switch between active roles
    -   OTP verification for sensitive role registration (VENDOR, DRIVER)
    -   View all active and inactive roles for a user

3.  **Address Management (CRUD)**
    -   Create, read, update, and delete user addresses
    -   Set and get a default address for deliveries
    -   Transactional updates to ensure only one default address

4.  **Device and Session Management**
    -   Register push tokens for notifications (FCM, APN)
    -   List all active devices for a user
    -   Revoke device access and push token

5.  **User Preferences**
    -   Get and update user preferences (e.g., notification settings)

## 📂 Module Structure

-   `presentation/controllers`: API endpoints with Swagger documentation
-   `application/services`: Business logic and use cases
-   `application/dtos`: Request and response data transfer objects
-   `domain/entities`: Core domain models (Address, UserRoleAssignment, PushToken)
-   `domain/repositories`: Interfaces for data access

## 🔗 Integration

-   **Shared Database**: Uses the same Prisma Accelerate database connection as the Auth module.
-   **Auth Module**: Leverages `JwtAuthGuard` for secure endpoint access.
-   **Modular Design**: Can be easily imported and used by other modules.

## 🚀 API Endpoints

All endpoints are prefixed with `/api/v1/users` and require a valid JWT access token.

| Endpoint | Method | Description |
| --- | --- | --- |
| `/profile` | GET | Get authenticated user profile |
| `/profile` | PATCH | Update user profile |
| `/roles` | GET | Get user roles |
| `/switch-role` | POST | Switch to a different role |
| `/register-role` | POST | Register a new role |
| `/change-password` | POST | Change user password |
| `/upload-profile-image` | POST | Upload profile image |
| `/addresses` | POST | Create a new address |
| `/addresses` | GET | Get all user addresses |
| `/addresses/{id}` | PUT | Update an address |
| `/addresses/{id}` | DELETE | Delete an address |
| `/addresses/default` | GET | Get default address |
| `/addresses/{id}/default` | POST | Set address as default |
| `/push-tokens` | POST | Register push token |
| `/devices` | GET | Get user devices |
| `/devices/{id}` | DELETE | Delete a device |
| `/preferences` | GET | Get user preferences |
| `/preferences` | PATCH | Update user preferences |

