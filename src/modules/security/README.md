# SecurityModule & CommunicationModule Integration

This document outlines the architecture and integration between the `SecurityModule` and `CommunicationModule`, demonstrating how they work together to provide a comprehensive security and communication solution for the NtumaI platform.

## Architecture Overview

### SecurityModule (Core Security Hub)
The `SecurityModule` centralizes all security-related operations:
- **OtpService**: OTP generation, validation, and management
- **PasswordService**: Password hashing, validation, and policies
- **MfaService**: Multi-factor authentication (TOTP, backup codes)
- **TokenService**: JWT and session token management
- **SecurityLogger**: Comprehensive security event logging
- **SecurityCommunicationService**: Integration bridge with CommunicationModule

### CommunicationModule (Message Delivery)
The `CommunicationModule` handles all message delivery:
- **EmailService**: SMTP-based email delivery with templates
- **SmsService**: Twilio SMS integration with templates
- **WhatsAppService**: WhatsApp Business API integration
- **MessageService**: Central orchestrator for multi-channel messaging
- **CommunicationLogger**: Message delivery logging and analytics

## Key Benefits

### 1. **Separation of Concerns**
- SecurityModule focuses purely on security logic
- CommunicationModule focuses purely on message delivery
- Clean interfaces between modules

### 2. **Reusability**
- OTP functionality used across Auth, KYC, and Transaction modules
- Communication templates shared across different use cases
- Consistent security policies across the platform

### 3. **Scalability**
- Independent scaling of security and communication services
- Easy addition of new communication channels
- Extensible security features (biometrics, new MFA methods)

### 4. **Maintainability**
- Single source of truth for security policies
- Centralized logging and monitoring
- Consistent error handling and retry mechanisms

## Integration Patterns

### 1. OTP Delivery Flow
```typescript
// 1. Generate OTP (SecurityModule)
const otpResult = await otpService.generateOtp({
  identifier: phoneNumber,
  userId: 'user123',
  purpose: 'LOGIN',
  expiryMinutes: 5
});

// 2. Send OTP (SecurityCommunicationService)
const deliveryResult = await securityCommunication.sendLoginOtp(
  userId,
  phoneNumber,
  otpResult.otpCode
);

// 3. Verify OTP (SecurityModule)
const verificationResult = await otpService.validateOtp({
  otpId: otpResult.otpId,
  code: userInputCode,
  userId
});
```

### 2. Security Alert Flow
```typescript
// Detect suspicious activity
const suspiciousActivity = detectSuspiciousLogin(loginAttempt);

// Send security alert
if (suspiciousActivity.riskScore > threshold) {
  await securityCommunication.sendSuspiciousActivityAlert(
    userId,
    userEmail,
    'login attempt',
    suspiciousActivity.metadata
  );
}
```

### 3. Multi-Channel Fallback
```typescript
// Primary channel (SMS)
let result = await messageService.sendMessage({
  channel: CommunicationChannel.SMS,
  recipient: phoneNumber,
  content: otpMessage
});

// Fallback channel (Email)
if (!result.success) {
  result = await messageService.sendMessage({
    channel: CommunicationChannel.EMAIL,
    recipient: email,
    content: otpMessage
  });
}
```

## Usage Examples

### AuthModule Integration
See `examples/auth-integration.example.ts` for:
- Login with OTP
- Password reset flow
- Suspicious activity detection
- Token generation and validation

### KycModule Integration
See `examples/kyc-integration.example.ts` for:
- Multi-step KYC verification
- Phone number verification
- Address verification
- Final KYC completion

### TransactionModule Integration
See `examples/transaction-integration.example.ts` for:
- High-value transaction OTPs
- Suspicious transaction handling
- Daily limit monitoring
- Bulk transaction processing

## Configuration

### Environment Variables
```env
# OTP Configuration
OTP_LOGIN_EXPIRY_MINUTES=5
OTP_TRANSACTION_EXPIRY_MINUTES=3
OTP_KYC_EXPIRY_MINUTES=10
OTP_PASSWORD_RESET_EXPIRY_MINUTES=15

# Communication Channels
DEFAULT_OTP_CHANNEL=SMS
DEFAULT_ALERT_CHANNEL=EMAIL

# Security Thresholds
TRANSACTION_OTP_THRESHOLD=1000
TRANSACTION_MFA_THRESHOLD=10000
SUSPICIOUS_ACTIVITY_THRESHOLD=50

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Security Features

### OTP Security
- Configurable expiry times per use case
- Rate limiting on generation and validation
- Secure hashing of OTP codes
- Automatic cleanup of expired OTPs
- Attempt tracking and lockout

### Password Security
- bcrypt hashing with configurable rounds
- Password strength validation
- Forbidden password checking
- Password history tracking
- Secure random password generation

### Token Security
- JWT with configurable expiry
- Refresh token rotation
- Token revocation support
- Session management
- Device tracking

### MFA Security
- TOTP (Time-based One-Time Password)
- QR code generation for authenticator apps
- Backup codes for recovery
- Multiple device support
- MFA enforcement policies

## Logging and Monitoring

### Security Events Logged
- OTP generation and validation
- Password changes and validation attempts
- MFA setup and validation
- Token generation and validation
- Login attempts (successful and failed)
- Suspicious activity detection
- Transaction security events

### Communication Events Logged
- Message delivery attempts
- Channel fallback usage
- Template usage statistics
- Delivery failure analysis
- Bulk communication metrics

## Error Handling

### Graceful Degradation
- Fallback communication channels
- Retry mechanisms with exponential backoff
- Circuit breaker patterns for external services
- Comprehensive error logging

### User-Friendly Messages
- Generic error messages to prevent information leakage
- Detailed logging for debugging
- Consistent error response format
- Localization support for error messages

## Testing

### Unit Tests
- Individual service testing
- Mock external dependencies
- Edge case coverage
- Security vulnerability testing

### Integration Tests
- End-to-end OTP flows
- Multi-channel communication testing
- Fallback mechanism validation
- Performance testing under load

## Deployment Considerations

### Scalability
- Horizontal scaling of services
- Database connection pooling
- Redis for session and OTP storage
- Load balancing for high availability

### Security
- Environment variable encryption
- Secure communication between services
- Regular security audits
- Compliance with security standards

### Monitoring
- Health checks for all services
- Performance metrics collection
- Alert thresholds for critical events
- Dashboard for operational visibility

## Future Enhancements

### Planned Features
- Biometric authentication support
- Push notification integration
- Advanced fraud detection
- Machine learning for risk scoring
- Blockchain-based verification

### Communication Channels
- Telegram integration
- Slack notifications
- Voice call OTP delivery
- In-app notifications

## Contributing

When extending the SecurityModule or CommunicationModule:

1. Follow the established interface patterns
2. Add comprehensive logging
3. Include error handling and fallbacks
4. Write unit and integration tests
5. Update documentation
6. Consider security implications
7. Test with multiple communication channels

## Support

For questions or issues:
- Check the example files for usage patterns
- Review the interface definitions
- Consult the logging output for debugging
- Follow the established architectural patterns