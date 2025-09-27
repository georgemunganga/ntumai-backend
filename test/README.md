# NTU MAI Backend API Testing Suite

This directory contains end-to-end (E2E) tests for the NTU MAI Backend API. The tests are organized by module and use Jest as the testing framework along with Supertest for making HTTP requests.

## Test Structure

The test suite is organized as follows:

```
test/
├── setup/                  # Test setup utilities
│   ├── test-setup.ts       # Core test setup class
│   ├── test-helpers.ts     # Helper methods for API requests
│   └── test-database-seeder.ts # Database seeding for tests
├── auth/                   # Auth module tests
├── users/                  # Users module tests
├── marketplace/            # Marketplace module tests
├── drivers/                # Drivers module tests
├── errands/                # Errands module tests
├── integration/            # Cross-module integration tests
├── jest-e2e.json          # Jest configuration for E2E tests
├── run-all-tests.js        # Script to run all tests
└── README.md               # This file
```

## Setup

Before running the tests, make sure you have:

1. Set up a test database (recommended to use a separate database from development)
2. Updated your `.env.test` file with the test database connection string
3. Installed all dependencies with `npm install`

## Running Tests

### Run All Tests

To run all tests in sequence:

```bash
node test/run-all-tests.js
```

### Run Tests for a Specific Module

To run tests for a specific module:

```bash
npm run test:e2e -- auth/auth.e2e-spec.ts
```

Or using Jest directly:

```bash
npx jest --config ./test/jest-e2e.json users/users.e2e-spec.ts
```

## Test Utilities

### TestSetup

The `TestSetup` class handles:
- Creating a NestJS testing module
- Setting up the HTTP server
- Providing authentication tokens for different user roles
- Cleaning up resources after tests

### TestHelpers

The `TestHelpers` class provides methods for:
- Making authenticated API requests (GET, POST, PUT, DELETE, etc.)
- Making unauthenticated API requests
- Validating standard API response format

### TestDatabaseSeeder

The `TestDatabaseSeeder` class handles:
- Cleaning the database before tests
- Seeding test data (users, roles, etc.)

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Clean Up**: Always clean up any data created during tests
3. **Use Helpers**: Leverage the helper classes for common operations
4. **Standard Assertions**: Use the `expectStandardResponse` helper to validate API response format
5. **Meaningful Descriptions**: Write clear test descriptions that explain what is being tested

## Adding New Tests

To add tests for a new module:

1. Create a new directory under `test/` for your module
2. Create a new file named `[module-name].e2e-spec.ts`
3. Follow the pattern used in existing tests
4. Import the necessary helper classes
5. Add your test cases

## Integration Tests

Integration tests verify that different modules work together correctly. These tests typically involve:

1. Creating resources in one module
2. Using those resources in another module
3. Verifying the expected behavior across module boundaries

See the `integration/module-integration.e2e-spec.ts` file for examples.