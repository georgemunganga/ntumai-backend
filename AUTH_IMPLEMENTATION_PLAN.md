# Authentication Module Implementation Plan

## Overview

The authentication module provides comprehensive user authentication and authorization functionality for the NTU MAI backend application. It implements JWT-based authentication with role-based access control, password reset functionality, and secure token management.

## Architecture

### Module Structure
```
src/modules/auth/
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── index.ts
├── interfaces/
│   ├── auth.interface.ts
│   └── index.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── index.ts
├── decorators/
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   └── index.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── local.strategy.ts
│   └── index.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
└── index.ts
```

## API Endpoints

### Authentication Endpoints

#### 1. Register User
- **Endpoint**: `POST /auth/register`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "CUSTOMER" // Optional, defaults to CUSTOMER
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "CUSTOMER",
        "phone": "+1234567890",
        "isEmailVerified": false,
        "isPhoneVerified": false
      },
      "tokens": {
        "accessToken": "jwt_access_token",
        "refreshToken": "jwt_refresh_token"
      }
    }
  }
  ```
- **Status Codes**:
  - `201`: User successfully registered
  - `409`: User with email or phone already exists
  - `400`: Validation error

#### 2. Login User
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticate user and return tokens
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Same as register response
- **Status Codes**:
  - `200`: Login successful
  - `401`: Invalid credentials
  - `400`: Validation error

#### 3. Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Description**: Get new access token using refresh token
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
  ```
- **Status Codes**:
  - `200`: Token refreshed successfully
  - `401`: Invalid refresh token

#### 4. Forgot Password
- **Endpoint**: `POST /auth/forgot-password`
- **Description**: Request password reset email
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "If the email exists, a reset link has been sent"
    }
  }
  ```
- **Status Codes**:
  - `200`: Request processed (always returns 200 for security)

#### 5. Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Description**: Reset password using reset token
- **Request Body**:
  ```json
  {
    "token": "reset_token",
    "password": "newpassword123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Password has been reset successfully"
    }
  }
  ```
- **Status Codes**:
  - `200`: Password reset successful
  - `400`: Invalid or expired token

#### 6. Logout
- **Endpoint**: `POST /auth/logout`
- **Description**: Logout from current device
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    }
  }
  ```
- **Status Codes**:
  - `200`: Logout successful
  - `401`: Unauthorized

#### 7. Logout All Devices
- **Endpoint**: `POST /auth/logout-all`
- **Description**: Logout from all devices
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out from all devices successfully"
    }
  }
  ```
- **Status Codes**:
  - `200`: Logout successful
  - `401`: Unauthorized

#### 8. Get Profile
- **Endpoint**: `GET /auth/profile`
- **Description**: Get current user profile
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "phone": "+1234567890",
      "isEmailVerified": false,
      "isPhoneVerified": false
    }
  }
  ```
- **Status Codes**:
  - `200`: Profile retrieved successfully
  - `401`: Unauthorized

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length: 6 characters
- Password validation on both client and server side

### JWT Token Management
- **Access Token**: Short-lived (15 minutes default)
- **Refresh Token**: Long-lived (7 days default)
- Tokens are signed with separate secrets
- Refresh tokens are stored in database for revocation

### Role-Based Access Control
- Supported roles: `ADMIN`, `DRIVER`, `CUSTOMER`, `VENDOR`
- Role-based guards for endpoint protection
- Decorators for easy role assignment

### Security Measures
- Rate limiting on authentication endpoints
- Password reset tokens expire after 1 hour
- Secure token generation using crypto.randomBytes
- All refresh tokens invalidated on password reset

## Database Schema Requirements

The auth module requires the following database models:

### User Model
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String
  name              String
  phone             String   @unique
  role              String   @default("CUSTOMER")
  isEmailVerified   Boolean  @default(false)
  isPhoneVerified   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  refreshTokens     RefreshToken[]
  passwordResetToken PasswordResetToken?
  
  @@map("users")
}
```

### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
}
```

### PasswordResetToken Model
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_reset_tokens")
}
```

## Environment Variables

Required environment variables:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Usage Examples

### Protecting Routes with Guards

```typescript
// Protect route with JWT authentication
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedResource() {
  return { message: 'This is protected' };
}

// Protect route with role-based access
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'VENDOR')
@Get('admin-only')
getAdminResource() {
  return { message: 'Admin only resource' };
}

// Public route (bypass authentication)
@Public()
@Get('public')
getPublicResource() {
  return { message: 'This is public' };
}
```

### Using Decorators

```typescript
import { Public, Roles } from '@auth';
import { JwtAuthGuard, RolesGuard } from '@auth';

@Controller('example')
@UseGuards(JwtAuthGuard) // Apply to all routes in controller
export class ExampleController {
  
  @Public() // Override controller guard
  @Get('public')
  getPublic() {
    return { message: 'Public endpoint' };
  }
  
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  getAdminOnly() {
    return { message: 'Admin only' };
  }
}
```

## Integration Steps

### 1. Update App Module
```typescript
import { AuthModule } from './modules/auth';
import { PrismaModule } from './modules/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

### 2. Apply Global Guards (Optional)
```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### 3. Database Migration
Run Prisma migrations to create the required tables:
```bash
npx prisma migrate dev --name add-auth-tables
```

## Testing

### Unit Tests
- AuthService methods
- AuthController endpoints
- Guards and strategies
- DTOs validation

### Integration Tests
- End-to-end authentication flow
- Token refresh mechanism
- Password reset flow
- Role-based access control

### Test Data
```typescript
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '+1234567890',
  role: 'CUSTOMER'
};
```

## Future Enhancements

1. **Email Verification**: Implement email verification flow
2. **Phone Verification**: Add SMS-based phone verification
3. **OAuth Integration**: Support for Google, Facebook login
4. **Two-Factor Authentication**: Add 2FA support
5. **Session Management**: Advanced session handling
6. **Audit Logging**: Track authentication events
7. **Rate Limiting**: Implement advanced rate limiting
8. **Device Management**: Track and manage user devices

## Error Handling

The auth module implements comprehensive error handling:

- **ValidationException**: Invalid input data
- **UnauthorizedException**: Invalid credentials or tokens
- **ConflictException**: User already exists
- **NotFoundException**: User not found
- **BadRequestException**: Invalid reset tokens

All errors follow the standard response format:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

## Monitoring and Logging

- Authentication attempts (success/failure)
- Token generation and refresh events
- Password reset requests
- Role-based access violations
- Security-related events

## Conclusion

The authentication module provides a robust, secure, and scalable foundation for user authentication and authorization in the NTU MAI application. It follows NestJS best practices and implements industry-standard security measures.