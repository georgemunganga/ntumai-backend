# Ntumai Backend API

The official NestJS backend for the Ntumai on-demand delivery and tasking platform.

## Architecture

The backend follows a **Domain-Driven Design (DDD)** approach with the following structure:

- **Domain Layer:** Core business entities and value objects
- **Application Layer:** Use cases and business logic
- **Infrastructure Layer:** Data persistence and external service integrations
- **Interface Layer:** REST API controllers and DTOs

## Modules

The backend is organized into the following bounded contexts (modules):

- **Auth:** Authentication and authorization
- **Users:** User management
- **Customers:** Customer profiles and preferences
- **Taskers:** Tasker profiles and availability
- **Vendors:** Vendor management
- **Tasks:** Task creation and management
- **Orders:** Order management
- **Products:** Product catalog
- **Wallets:** Digital wallet management
- **Transactions:** Financial transactions
- **Ratings:** Review and rating system
- **Notifications:** Push and in-app notifications
- **KYC:** Know Your Customer verification
- **Location:** Location tracking and management
- **Kafka:** Event-driven messaging

## Technology Stack

- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Passport
- **Message Queue:** Apache Kafka
- **API Documentation:** Swagger/OpenAPI
- **Containerization:** Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Apache Kafka 7.5+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ntumai-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ntumai_db"
KAFKA_BROKERS="localhost:9092"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="24h"
PORT=3000
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the application:
```bash
npm run start
```

The API will be available at `http://localhost:3000`.

## Docker Setup

### Using Docker Compose

Start all services (PostgreSQL, Kafka, Redis, and the backend):

```bash
docker-compose up -d
```

The backend will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api/docs`.

### Building Docker Image

```bash
docker build -t ntumai-backend:latest .
```

## API Documentation

Swagger API documentation is available at:
```
http://localhost:3000/api/docs
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `KAFKA_BROKERS` | Kafka broker addresses (comma-separated) | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |

## API Endpoints

### Authentication
- `POST /api/v1/auth/request-otp` - Request OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP and get JWT token
- `POST /api/v1/auth/switch-role` - Switch user role

### Customers
- `GET /api/v1/customers/:id` - Get customer details
- `POST /api/v1/customers` - Create customer profile
- `PUT /api/v1/customers/:id` - Update customer profile

### Taskers
- `GET /api/v1/taskers/:id` - Get tasker details
- `POST /api/v1/taskers` - Create tasker profile
- `PUT /api/v1/taskers/:id` - Update tasker profile

### Tasks
- `GET /api/v1/tasks/:id` - Get task details
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task status

### Orders
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders` - Create order
- `PUT /api/v1/orders/:id` - Update order status

### Wallets
- `GET /api/v1/wallets/:id` - Get wallet details
- `GET /api/v1/wallets/user/:userId` - Get wallet by user ID
- `POST /api/v1/wallets` - Create wallet
- `PUT /api/v1/wallets/:id` - Update wallet balance

### Ratings
- `POST /api/v1/ratings` - Create rating

### Notifications
- `GET /api/v1/notifications/user/:userId` - Get user notifications
- `POST /api/v1/notifications` - Create notification
- `PUT /api/v1/notifications/:id/read` - Mark notification as read

## Kafka Topics

The backend produces and consumes the following Kafka topics:

| Topic | Description | Producer |
|-------|-------------|----------|
| `task.created` | New task created | Tasks Module |
| `task.assignment.proposed` | Task assignment proposed | Matching Engine |
| `order.created` | New order created | Orders Module |
| `payment.completed` | Payment completed | Payments Module |

## Deployment

### Production Deployment

1. Build the Docker image:
```bash
docker build -t ntumai-backend:latest .
```

2. Push to Docker Registry:
```bash
docker push <registry>/ntumai-backend:latest
```

3. Deploy using Docker Compose or Kubernetes:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

Proprietary - Ntumai Platform

## Support

For support, please contact the development team or open an issue in the repository.
