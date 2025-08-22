// Auth Module Exports - Shared components for other modules

// Main Auth Module
export { AuthModule } from './auth.module';
export { AuthController } from './auth.controller';

// Legacy exports (keeping for backward compatibility)
export * from './dto';
export * from './interfaces';
export * from './guards';
export * from './decorators';
export * from './strategies';

// New DDD Architecture Exports

// Application Services
export { AuthenticationService } from './application/services/authentication.service';
export { PasswordManagementService } from './application/services/password-management.service';

// Domain Value Objects
export { Email } from './domain/value-objects/email.value-object';
export { UserRole } from './domain/value-objects/user-role.value-object';
export { Phone } from './domain/value-objects/phone.value-object';

// Domain Entities
export { User } from './domain/entities/user.entity';

// Repository Interfaces
export { UserRepository } from './domain/repositories/user.repository';

// Infrastructure Module
export { AuthInfrastructureModule } from './infrastructure/infrastructure.module';