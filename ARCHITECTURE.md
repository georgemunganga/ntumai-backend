# User and Auth Modules Architecture

## Overview

This document describes the clean architecture implementation of the User and Auth modules in the Ntumai backend. The architecture follows domain-driven design principles with clear separation of concerns across domain, application, and infrastructure layers.

## Directory Structure

```
src/modules/
├── users/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   └── user.service.spec.ts
│   │   └── dtos/
│   │       └── (user DTOs)
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── user.repository.ts
│   └── users.module.ts
│
└── auth/
    ├── domain/
    │   └── value-objects/
    │       └── jwt-token.vo.ts
    ├── application/
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── auth.service.spec.ts
    │   │   ├── otp.service.ts
    │   │   └── otp.service.spec.ts
    │   └── dtos/
    │       └── auth.dto.ts
    ├── infrastructure/
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts
    │   └── decorators/
    │       └── public.decorator.ts
    ├── interfaces/
    │   └── controllers/
    │       └── auth.controller.ts
    └── auth.module.ts
```

## Layer Responsibilities

### Domain Layer

The domain layer contains the core business logic and entities:

- **User Entity** (`user.entity.ts`): Represents a user with methods for status management
  - Properties: id, phoneNumber, email, status, createdAt, updatedAt
  - Methods: isActive(), activate(), deactivate()
  - Status values: PENDING_VERIFICATION, ACTIVE, INACTIVE

- **User Repository Interface** (`user.repository.interface.ts`): Defines the contract for user persistence
  - Methods: findById, findByPhoneNumber, findByEmail, save, update, delete

- **JWT Token Value Object** (`jwt-token.vo.ts`): Represents authentication tokens
  - Properties: accessToken, refreshToken, expiresAt
  - Methods: isExpired()

### Application Layer

The application layer contains business logic and orchestration:

- **User Service** (`user.service.ts`): Manages user operations
  - getUserById(id): Retrieves a user by ID
  - getUserByPhoneNumber(phoneNumber): Retrieves a user by phone
  - getUserByEmail(email): Retrieves a user by email
  - createOrUpdateUser(phoneNumber, email): Creates or updates a user
  - activateUser(user): Activates a pending user

- **Auth Service** (`auth.service.ts`): Handles authentication flow
  - requestOtp(phoneNumber, email): Initiates OTP request
  - verifyOtp(otp, phoneNumber, email): Verifies OTP and returns tokens
  - generateTokens(user, activeRole): Generates JWT tokens

- **OTP Service** (`otp.service.ts`): Manages one-time passwords
  - requestOtp(identifier): Generates and stores OTP
  - verifyOtp(identifier, otp): Verifies OTP validity

- **DTOs** (`auth.dto.ts`): Data transfer objects for API contracts
  - RequestOtpDto: Input for OTP request
  - VerifyOtpDto: Input for OTP verification
  - AuthResponseDto: Output for authentication response

### Infrastructure Layer

The infrastructure layer handles external dependencies:

- **User Repository** (`user.repository.ts`): Prisma-based implementation of IUserRepository
  - Handles database operations using Prisma ORM
  - Maps database records to UserEntity instances

- **JWT Auth Guard** (`jwt-auth.guard.ts`): Protects routes with JWT authentication
  - Extracts token from Authorization header
  - Verifies token signature and expiration
  - Attaches user payload to request

- **Public Decorator** (`public.decorator.ts`): Marks routes as publicly accessible
  - Bypasses JWT authentication for specific endpoints

- **Auth Controller** (`auth.controller.ts`): HTTP endpoints for authentication
  - POST /api/v1/auth/request-otp: Request OTP
  - POST /api/v1/auth/verify-otp: Verify OTP and get tokens

## Authentication Flow

### OTP Request Flow

1. User calls `POST /api/v1/auth/request-otp` with phone or email
2. AuthService creates/updates user with PENDING_VERIFICATION status
3. OtpService generates 6-digit OTP and stores in Redis (5-minute TTL)
4. CommunicationService sends OTP via SMS or email
5. Response: `{ message: "OTP sent" }`

### OTP Verification Flow

1. User calls `POST /api/v1/auth/verify-otp` with OTP and phone/email
2. OtpService verifies OTP against Redis
3. If valid: OTP is deleted from Redis
4. UserService activates the user (status → ACTIVE)
5. AuthService generates JWT tokens (access + refresh)
6. Response: `{ accessToken, refreshToken, expiresAt }`

### Protected Route Access

1. Client includes `Authorization: Bearer <accessToken>` header
2. JwtAuthGuard intercepts request
3. Guard extracts and verifies token
4. If valid: request proceeds with user payload
5. If invalid: returns 401 Unauthorized

## Testing

### Unit Tests

Located in `*.spec.ts` files within each service:

- **UserService Tests**: CRUD operations, user activation
- **OtpService Tests**: OTP generation, verification, expiration
- **AuthService Tests**: OTP request/verification, token generation

Run unit tests:
```bash
npm run test
```

### E2E Tests

Located in `test/auth.e2e-spec.ts`:

- Request OTP for phone number
- Request OTP for email
- Verify OTP and receive tokens
- Handle invalid/expired OTP
- Validate input requirements

Run E2E tests:
```bash
npm run test:e2e
```

## Key Design Decisions

1. **Clean Architecture**: Separation of concerns across domain, application, and infrastructure layers
2. **Dependency Injection**: NestJS DI container manages service dependencies
3. **Repository Pattern**: Abstraction for data access with interface-based design
4. **Value Objects**: JWT tokens as immutable value objects
5. **DTOs**: Type-safe API contracts with validation
6. **Decorators**: Metadata-driven route protection (Public decorator)
7. **Guards**: Middleware-style authentication enforcement
8. **Redis**: Temporary OTP storage with automatic expiration

## Configuration

Required environment variables:

```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
JWT_REFRESH_SECRET=refresh-secret
```

## Future Enhancements

1. **Rate Limiting**: Prevent OTP brute-force attacks
2. **Multi-factor Authentication**: Support for TOTP/SMS
3. **Social Login**: OAuth integration
4. **User Profiles**: Extended user information
5. **Role-Based Access Control**: Fine-grained permissions
6. **Audit Logging**: Track authentication events
7. **Session Management**: Token refresh and revocation

## Dependencies

- `@nestjs/core`: NestJS framework
- `@nestjs/jwt`: JWT token handling
- `@nestjs/config`: Environment configuration
- `@prisma/client`: Database ORM
- `redis`: In-memory cache for OTP storage
- `class-validator`: DTO validation
- `@nestjs-modules/mailer`: Email service

## Troubleshooting

### OTP Not Received
- Check CommunicationService configuration
- Verify Redis connection
- Check email/SMS provider credentials

### Token Verification Fails
- Ensure JWT_SECRET is consistent
- Check token expiration time
- Verify Authorization header format

### User Not Found During Verification
- Ensure user was created during OTP request
- Check database connection
- Verify repository implementation
