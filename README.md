# NTUMAI Backend API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 🚀 Project Overview

NTUMAI is a comprehensive multi-service platform built with NestJS, featuring marketplace functionality, delivery services, task management, and real-time communication. The platform supports multiple user roles including customers, vendors, drivers, and administrators.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Current Modules](#current-modules)
- [Planned Modules](#planned-modules)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **Real-time**: WebSocket Gateways
- **Language**: TypeScript

### Module Structure
Each module follows NestJS best practices with:
- **DTOs** (Data Transfer Objects)
- **Entities** (Database models)
- **Services** (Business logic)
- **Controllers** (API endpoints)
- **Guards** (Authentication & authorization)

## 📦 Current Modules

### Core Modules
- **🔐 Auth Module** - JWT authentication, role management
- **👥 Users Module** - User profiles, role management
- **🏪 Marketplace Module** - Product catalog, store management
- **🛒 Orders Module** - Order processing, payment integration
- **🚚 Delivery Module** - Delivery assignments, tracking
- **📱 Notifications Module** - Push notifications, alerts
- **💬 Chat Module** - Real-time messaging (WebSocket)
- **🎯 Loyalty Module** - Points, rewards, promotions
- **⭐ Reviews Module** - Product/service ratings
- **🔍 Search Module** - Advanced search functionality
- **📅 Scheduling Module** - Task scheduling, appointments
- **💳 Payments Module** - Payment processing, transactions
- **🏃 Errands Module** - Task management, assignments
- **🚗 Drivers Module** - Driver management, tracking
- **⚙️ Admin Module** - Administrative functions

## 🔄 Planned Modules (In Development)

### Phase 1: Critical MVP
- **🎯 Onboarding Module** - Step-by-step user onboarding
- **📋 KYC Module** - Document verification, compliance
- **📦 Inventory Management** - Stock tracking, alerts

### Phase 2: Enhanced Features
- **🗺️ Geolocation & Mapping** - Route optimization, tracking
- **📊 Reports & Audit Logs** - Analytics, compliance reporting

> **Note**: Coupon & Discount functionality is already implemented via the DiscountCode model in the current schema.

## 🗄️ Database Schema

### Current Models (25+)
- User management (User, Address, DeviceSession)
- E-commerce (Product, Store, Order, Cart, Payment)
- Communication (Chat, Notification)
- Delivery (DeliveryAssignment, Task)
- Loyalty (LoyaltyPoint, Reward, Promotion)
- Reviews and ratings

### Planned Schema Enhancements
- **15 new models** for upcoming modules
- **9 new enums** for enhanced functionality
- Performance optimizations and indexes

For detailed schema analysis, see:
- [Module Analysis](./module_analysis.md)
- [Schema Gap Analysis](./schema_gap_analysis.md)
- [Implementation Roadmap](./implementation_roadmap.md)

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ntumai/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and configuration

# Setup database
npx prisma generate
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ntumai"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# External Services
# Add your API keys and service configurations
```

## 🚀 Development

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

### Database Operations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db reset
```

## 📚 API Documentation

### API Endpoints Structure

```
/api/v1/
├── auth/          # Authentication endpoints
├── users/         # User management
├── products/      # Product catalog
├── orders/        # Order processing
├── delivery/      # Delivery management
├── chat/          # Real-time messaging
├── notifications/ # Push notifications
├── admin/         # Administrative functions
└── ...
```

### Authentication

All protected endpoints require JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **ADMIN** - Full system access
- **VENDOR** - Store and product management
- **DRIVER** - Delivery and task management
- **CUSTOMER** - Shopping and ordering

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ntumai-backend .

# Run container
docker run -p 3000:3000 ntumai-backend
```

### Environment-Specific Configurations

- **Development**: Hot reload, detailed logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized performance, error tracking

## 📖 Documentation

### Project Documentation
- [Module Analysis](./module_analysis.md) - Detailed module breakdown
- [Schema Gap Analysis](./schema_gap_analysis.md) - Database enhancement plans
- [Implementation Roadmap](./implementation_roadmap.md) - Development strategy

### API Documentation
- Swagger/OpenAPI documentation available at `/api/docs` (when running)
- Postman collection available in `/docs` folder

## 🤝 Contributing

1. Follow the existing module structure
2. Use TypeScript strict mode
3. Write comprehensive tests
4. Follow NestJS best practices
5. Update documentation for new features

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation files for detailed information

---

**Built with ❤️ using NestJS**
