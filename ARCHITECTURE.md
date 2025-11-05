# DDD Auth Module Architecture

## Overview

This document outlines the Domain-Driven Design (DDD) architecture for the authentication module implementing an OTP-first wizard flow with Prisma, PostgreSQL, and NestJS.

## DDD Layers

### 1. Domain Layer (Core Business Logic)
**Location**: `src/auth/domain/`

**Entities**:
- `User` - Core user aggregate root
- `OtpChallenge` - OTP challenge lifecycle
- `RefreshToken` - Refresh token management

**Value Objects**:
- `Email` - Email validation and formatting
- `Phone` - Phone number with country code (E.164)
- `Password` - Password hashing and validation
- `OtpCode` - OTP generation and validation
- `Role` - User role enumeration

**Domain Services**:
- `OtpDomainService` - OTP business rules
- `TokenDomainService` - Token generation/validation rules

**Repository Interfaces**:
- `IUserRepository`
- `IOtpChallengeRepository`
- `IRefreshTokenRepository`

### 2. Application Layer (Use Cases)
**Location**: `src/auth/application/`

**Use Cases**:
- `RequestOtpUseCase` - Handle OTP request
- `VerifyOtpUseCase` - Verify OTP and determine flow
- `RegisterUserUseCase` - Complete user registration
- `RefreshTokenUseCase` - Token refresh logic
- `LogoutUseCase` - Single device logout
- `LogoutAllUseCase` - All devices logout
- `GetProfileUseCase` - Retrieve user profile
- `ForgotPasswordUseCase` - Password reset request
- `ResetPasswordUseCase` - Complete password reset

**DTOs**:
- Request DTOs (input validation)
- Response DTOs (output formatting)

**Application Services**:
- `AuthApplicationService` - Orchestrates use cases

### 3. Infrastructure Layer (Technical Implementation)
**Location**: `src/auth/infrastructure/`

**Repository Implementations**:
- `PrismaUserRepository` - User persistence
- `PrismaOtpChallengeRepository` - OTP challenge persistence
- `PrismaRefreshTokenRepository` - Refresh token persistence

**External Services**:
- `JwtService` - JWT token operations
- `OtpService` - OTP generation and sending
- `EmailService` - Email notifications
- `SmsService` - SMS notifications
- `HashingService` - Password hashing (bcrypt)

**Guards & Strategies**:
- `JwtAuthGuard` - JWT authentication
- `RolesGuard` - Role-based authorization
- `JwtStrategy` - Passport JWT strategy

### 4. Presentation Layer (API Controllers)
**Location**: `src/auth/presentation/`

**Controllers**:
- `AuthController` - All auth endpoints with Swagger docs

**Interceptors**:
- `ResponseInterceptor` - Standard response envelope
- `LoggingInterceptor` - Request/response logging

**Exception Filters**:
- `HttpExceptionFilter` - Error formatting

## Shared Database Service Layer

**Location**: `src/shared/database/`

**Components**:
- `PrismaService` - Centralized Prisma client
- `DatabaseModule` - Shared database module
- Transaction management utilities

## Project Structure

```
src/
├── shared/
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── database.module.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── interfaces/
│   └── config/
│       └── configuration.ts
├── auth/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── otp-challenge.entity.ts
│   │   │   └── refresh-token.entity.ts
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   ├── phone.vo.ts
│   │   │   ├── password.vo.ts
│   │   │   ├── otp-code.vo.ts
│   │   │   └── role.vo.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.interface.ts
│   │   │   ├── otp-challenge.repository.interface.ts
│   │   │   └── refresh-token.repository.interface.ts
│   │   └── services/
│   │       ├── otp-domain.service.ts
│   │       └── token-domain.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── request-otp.use-case.ts
│   │   │   ├── verify-otp.use-case.ts
│   │   │   ├── register-user.use-case.ts
│   │   │   ├── refresh-token.use-case.ts
│   │   │   ├── logout.use-case.ts
│   │   │   ├── logout-all.use-case.ts
│   │   │   ├── get-profile.use-case.ts
│   │   │   ├── forgot-password.use-case.ts
│   │   │   └── reset-password.use-case.ts
│   │   ├── dtos/
│   │   │   ├── request/
│   │   │   └── response/
│   │   └── services/
│   │       └── auth-application.service.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── prisma-user.repository.ts
│   │   │   ├── prisma-otp-challenge.repository.ts
│   │   │   └── prisma-refresh-token.repository.ts
│   │   ├── services/
│   │   │   ├── jwt.service.ts
│   │   │   ├── otp.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── sms.service.ts
│   │   │   └── hashing.service.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   └── dtos/
│   │       └── (API-specific DTOs if needed)
│   └── auth.module.ts
└── main.ts
```

## Database Schema (Prisma)

### User Model
- id (UUID)
- email (unique, optional)
- phone (unique, optional)
- firstName
- lastName
- password (hashed)
- role (enum: CUSTOMER, VENDOR, RIDER, ADMIN)
- isEmailVerified
- isPhoneVerified
- profileComplete
- createdAt
- updatedAt

### OtpChallenge Model
- id (UUID)
- challengeId (UUID, unique)
- identifier (email or phone)
- identifierType (enum: EMAIL, PHONE)
- otpCode (hashed)
- purpose (enum: LOGIN, REGISTER, PASSWORD_RESET)
- attempts
- maxAttempts
- expiresAt
- resendAvailableAt
- isVerified
- verifiedAt
- ipAddress
- userAgent
- createdAt

### RefreshToken Model
- id (UUID)
- token (hashed, unique)
- userId (foreign key)
- deviceId
- ipAddress
- userAgent
- expiresAt
- isRevoked
- revokedAt
- createdAt

## Security Considerations

1. **OTP Security**:
   - 6-digit numeric codes
   - 5-10 minute TTL
   - Max 5 attempts per challenge
   - Rate limiting per identifier and IP
   - Hashed storage

2. **Token Security**:
   - Access tokens: 1 hour TTL
   - Refresh tokens: 7 days TTL
   - Refresh token rotation
   - Device tracking
   - Revocation support

3. **Password Security**:
   - bcrypt hashing (10 rounds)
   - Minimum 8 characters
   - Complexity requirements
   - Never logged or echoed

4. **Anti-Enumeration**:
   - Uniform responses for OTP requests
   - Consistent timing
   - Generic error messages

5. **Rate Limiting**:
   - OTP requests: 3 per identifier per 15 minutes
   - OTP verification: 5 attempts per challenge
   - Token refresh: 10 per hour per user

## Configuration

Environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `JWT_ACCESS_TTL` - Access token TTL (default: 3600s)
- `JWT_REFRESH_TTL` - Refresh token TTL (default: 604800s)
- `OTP_TTL_SEC` - OTP expiration (default: 600s)
- `OTP_RESEND_DELAY_SEC` - Resend delay (default: 60s)
- `OTP_MAX_ATTEMPTS` - Max verification attempts (default: 5)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email config
- `SMS_PROVIDER_API_KEY` - SMS provider credentials

## API Response Envelope

All endpoints return a standard envelope:

```typescript
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

## Error Codes

- `AUTH/OTP_INVALID` - Invalid or expired OTP
- `AUTH/CHALLENGE_NOT_FOUND` - Challenge ID not found
- `AUTH/TOO_MANY_ATTEMPTS` - Max attempts exceeded
- `AUTH/REG_TOKEN_EXPIRED` - Registration token expired
- `AUTH/IDENTIFIER_CONFLICT` - Email/phone already exists
- `AUTH/REFRESH_INVALID` - Invalid refresh token
- `AUTH/UNAUTHORIZED` - Authentication required
- `AUTH/FORBIDDEN` - Insufficient permissions

## Testing Strategy

1. **Unit Tests**: Domain entities, value objects, use cases
2. **Integration Tests**: Repository implementations, infrastructure services
3. **E2E Tests**: Complete auth flows via API
4. **Security Tests**: Rate limiting, token validation, enumeration protection

