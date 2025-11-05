# Ntumai Auth API

This repository contains the implementation of a robust, DDD-based authentication module for the Ntumai platform. It features an OTP-first wizard flow, providing a seamless and secure user experience for both login and registration.

Built with **NestJS**, **Prisma**, and **PostgreSQL**, this project adheres to modern best practices, including a clean, layered architecture, comprehensive Swagger documentation, and a shared database service layer.

## Features

- **OTP-First Authentication**: Passwordless login and registration initiation via One-Time Passwords (OTP) sent to email or phone.
- **Domain-Driven Design (DDD)**: A clean, layered architecture separating domain logic, application use cases, and infrastructure.
- **JWT & Refresh Tokens**: Secure session management using short-lived access tokens and long-lived, revocable refresh tokens.
- **Role-Based Access Control (RBAC)**: Built-in support for user roles (`CUSTOMER`, `VENDOR`, `RIDER`, `ADMIN`) with protective guards.
- **Swagger API Documentation**: Interactive API documentation generated automatically from the code.
- **Shared Database Layer**: Centralized Prisma client and database management for consistency and reusability.
- **Comprehensive Security**: Includes rate limiting, anti-enumeration protection, password hashing (bcrypt), and secure token handling.
- **Configurable**: Easily configure the application via environment variables (`.env` file).

## Architecture

The project follows a Domain-Driven Design (DDD) approach, organized into four primary layers:

1.  **Domain Layer**: Contains the core business logic, including entities (`User`, `OtpChallenge`), value objects (`Email`, `Password`), and repository interfaces.
2.  **Application Layer**: Orchestrates the domain logic to implement application-specific use cases (e.g., `RequestOtpUseCase`, `RegisterUserUseCase`) and handles Data Transfer Objects (DTOs).
3.  **Infrastructure Layer**: Provides the technical implementation details, such as database access (Prisma repositories), external service integrations (JWT, OTP, email), and framework-specific components (guards, strategies).
4.  **Presentation Layer**: Exposes the application functionality via a RESTful API, primarily through NestJS controllers with integrated Swagger documentation.

A detailed breakdown of the architecture can be found in the `ARCHITECTURE.md` file.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd ntumai-auth-api
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up the environment:**

    Copy the example environment file and update it with your configuration.

    ```bash
    cp .env.example .env
    ```

    You will need to configure your `DATABASE_URL`, `JWT` secrets, and any external service credentials (e.g., for an SMTP server like Mailtrap).

4.  **Start the database:**

    A PostgreSQL database can be quickly spun up using the provided Docker Compose file.

    ```bash
    docker-compose up -d
    ```

5.  **Run database migrations:**

    Apply the Prisma schema to your database to create the necessary tables.

    ```bash
    npx prisma migrate dev --name init
    ```

### Running the Application

-   **Development mode (with hot-reloading):**

    ```bash
    pnpm run start:dev
    ```

-   **Production mode:**

    ```bash
    pnpm run build
    pnpm run start:prod
    ```

Once running, the application will be available at `http://localhost:3000`.

## API Documentation

Interactive Swagger API documentation is automatically generated and available when the application is running.

-   **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

This interface allows you to explore all available endpoints, view their request/response models, and test them directly from your browser.

## Testing

This project is set up with Jest for unit and end-to-end (e2e) testing.

-   **Run all tests:**

    ```bash
    pnpm run test
    ```

-   **Run unit tests:**

    ```bash
    pnpm run test:unit
    ```

-   **Run e2e tests:**

    ```bash
    pnpm run test:e2e
    ```

-   **View test coverage:**

    ```bash
    pnpm run test:cov
    ```

## License

This project is [MIT licensed](LICENSE).

