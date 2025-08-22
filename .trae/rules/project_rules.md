# Trae Project Architecture Rules

## Module Structure
- Each module must be self-contained with its own:
  - DTOs (Data Transfer Objects)
  - Entities
  - Services
  - Controllers
- This modular approach ensures clean separation of concerns and maintainability

## Shared Resources
- Common/shared code resides in the `shared` directory
- Contains cross-cutting functionality used across multiple modules
- Examples: utilities, constants, common interfaces

## Communication Protocols
- Chat functionality must use WebSocket Gateways
  - Implement using `@WebSocketGateway` decorator
  - Do not use REST endpoints for real-time chat features

## Scalability Considerations
- Admin module is designed for potential extraction
- Can be separated into standalone microservice when needed
- Plan for independent scaling of admin functionality

## Global Configuration
### Environment Management
- Use `.env` file with all keys, URLs, ports, DB credentials
- Use NestJS `ConfigModule` globally

### Global Constants
- Roles: `ADMIN`, `DRIVER`, `CUSTOMER`, `VENDOR`
- Statuses: `PENDING`, `IN_PROGRESS`, `DELIVERED`, `CANCELLED`
- Payment gateways and their modes (`sandbox`, `live`)

## Database & ORM Standards
- Use PostgreSQL as primary database
- Use Prisma as ORM
- Table naming convention: snake_case
- Column naming: `created_at`, `updated_at`
- Timestamps for all tables
- Foreign key conventions: `user_id`, `order_id`
- Seed data conventions (roles, admin account)

## Authentication & Authorization
- Global auth strategy: JWT
- Password hashing: bcrypt
- Role-based guards for endpoints
- Use `Roles` decorator
- Token expiration & refresh rules
- Phone/email verification workflow

## Error Handling & Response Standards
- Global exception filter
- Standard response format:
  ```typescript
  {
    success: boolean;
    data?: any;
    error?: { code: string, message: string };
  }
  ```
- Standard HTTP status codes for all operations

## Logging & Monitoring
- Global logging strategy (winston or NestJS Logger)
- Error, info, and debug levels
- Request/response logging middleware
- Plan for monitoring tools (Prometheus, Sentry)

## Validation & DTOs
- Use `class-validator` & `class-transformer` globally
- Standard rules for DTOs:
  - Required fields
  - Length constraints
  - Custom validators (phone number format, email regex)

## Global Middleware
- CORS configuration
- Request body parsing limits
- Security headers: helmet
- Rate limiting for sensitive routes

## Event & Messaging System
- Standardize event names for notifications, delivery updates, chat
- Global EventEmitter or WebSocket gateways
- Use for async tasks (email, SMS, push)

## Payment & Transaction Standards
- Standardize transaction model:
  - `id`, `amount`, `currency`, `status`, `user_id`, `order_id`
- Retry logic for failed transactions
- Refund/rollback strategy

## File & Asset Management
- Standard storage path for uploaded files (images, invoices)
- Decide: local storage vs cloud (S3, etc.)
- File naming conventions to avoid conflicts

## Testing & QA Standards
- Global unit test structure (jest)
- Integration tests for controllers & services
- Standard test coverage thresholds
- Seed test DB data for predictable tests

## Versioning & API Standards
- Global API versioning: `/api/v1/...`
- Standardize REST endpoints:
  - `GET /orders`, `POST /orders`, etc.
- Consistent naming: plural nouns for resources

## Security Standards
- Input sanitization for all routes
- Rate limiting and brute-force protection on auth
- Sensitive data masking in logs
- CORS, CSRF, and JWT validation
