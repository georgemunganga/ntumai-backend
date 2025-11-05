# Testing Guide

This document provides a comprehensive guide to testing the Ntumai Auth API. The project employs a multi-layered testing strategy to ensure code quality, correctness, and reliability.

## Testing Strategy

The testing strategy is divided into three main categories:

1.  **Unit Tests**: These tests focus on individual components (units) in isolation. They are used to verify the correctness of the core business logic within the **Domain Layer**, such as entities and value objects, and individual functions within services.

2.  **Integration Tests**: These tests verify the interactions between different parts of the application, particularly between the application/infrastructure layers and external systems like the database. A key focus is testing the Prisma repository implementations to ensure they correctly interact with the PostgreSQL database.

3.  **End-to-End (E2E) Tests**: These tests simulate real-world user scenarios by making HTTP requests to the running application's API endpoints. They validate the entire application stack, from the controller down to the database, ensuring all layers work together as expected.

## Test Environment Setup

Before running the tests, ensure your testing environment is properly configured.

### Test Database

The E2E tests run against a separate test database to avoid polluting the development database. You must configure the `DATABASE_URL` in a `.env.test` file.

1.  Create a `.env.test` file in the project root:

    ```bash
    cp .env .env.test
    ```

2.  Modify the `DATABASE_URL` in `.env.test` to point to a different database schema or a completely separate database instance. For example:

    ```
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ntumai_auth_test?schema=public"
    ```

3.  Before running the E2E tests for the first time, apply the migrations to the test database:

    ```bash
    pnpm prisma migrate deploy --schema=./prisma/schema.prisma
    ```

## Running Tests

The project uses [Jest](https://jestjs.io/) as the testing framework. The following `pnpm` scripts are available to run the tests:

-   **Run all tests (unit and e2e):**

    ```bash
    pnpm run test
    ```

-   **Run only unit tests:**

    ```bash
    pnpm run test:unit
    ```

-   **Run only e2e tests:**

    ```bash
    pnpm run test:e2e
    ```

-   **Generate a test coverage report:**

    This command runs all tests and generates a coverage report in the `coverage/` directory.

    ```bash
    pnpm run test:cov
    ```

## End-to-End Testing Example: Auth Flow

The primary E2E test file (`test/auth.e2e-spec.ts`) covers the main OTP-first authentication flow.

**The test performs the following steps:**

1.  **Clean Database**: Before each test run, the database is cleaned to ensure a consistent state.
2.  **Request OTP**: It sends a `POST` request to `/auth/otp/request` with a new email address.
3.  **Verify OTP (New User)**: It simulates retrieving the OTP (from mocks) and sends a `POST` request to `/auth/otp/verify`. Since the user is new, it expects a `registrationToken` in the response.
4.  **Complete Registration**: It uses the `registrationToken` to send a `POST` request to `/auth/register` with user details (name, password, role).
5.  **Receive Tokens**: It verifies that the registration response includes an `accessToken` and `refreshToken`.
6.  **Access Protected Route**: It uses the `accessToken` to make a `GET` request to the protected `/auth/profile` endpoint and verifies that the correct user profile is returned.

This flow ensures that the entire registration and login process works seamlessly from end to end.

## Manual Testing with Swagger UI

For manual testing and exploration, the Swagger UI is an invaluable tool.

1.  **Start the application:**

    ```bash
    pnpm run start:dev
    ```

2.  **Open the Swagger UI:**

    Navigate to [http://localhost:3000/api/docs](http://localhost:3000/api/docs) in your browser.

### Manual Test Flow

You can follow the same logic as the E2E test to manually verify the auth flow:

1.  **Expand `POST /auth/otp/request`**: Click "Try it out", enter a test email or phone number, and execute. Copy the `challengeId` from the response.
2.  **Expand `POST /auth/otp/verify`**: Click "Try it out", paste the `challengeId`, and enter the OTP (since email/SMS is mocked, check the application console logs for the simulated OTP). Execute the request. Copy the `registrationToken` from the response.
3.  **Expand `POST /auth/register`**: Click "Try it out", paste the `registrationToken`, and fill in the `firstName`, `lastName`, `password`, and `role`. Execute the request. Copy the `accessToken` from the response.
4.  **Authorize**: At the top of the Swagger UI, click the "Authorize" button. In the popup, enter `Bearer <your_access_token>` and click "Authorize".
5.  **Expand `GET /auth/profile`**: Click "Try it out" and execute. You should now see the profile of the user you just created, demonstrating that you have successfully authenticated.

