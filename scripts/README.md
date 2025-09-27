# NTU MAI Backend Testing Scripts

This directory contains PowerShell scripts for running the NestJS server and executing end-to-end tests in batches.

## Available Scripts

### `start-server.ps1`

Starts the NestJS server in development mode.

**Usage:**
```powershell
.\scripts\start-server.ps1
```

**Features:**
- Checks if port 3000 is already in use and offers to kill the process
- Waits for server initialization with timeout
- Displays server output in real-time
- Gracefully handles server shutdown

### `run-tests-batch.ps1`

Runs end-to-end tests in batches.

**Usage:**
```powershell
# Run all test modules
.\scripts\run-tests-batch.ps1

# Run tests for a specific module
.\scripts\run-tests-batch.ps1 -specificModule "auth"

# Run tests in interactive mode (prompts before each module)
.\scripts\run-tests-batch.ps1 -interactive
```

**Features:**
- Runs tests for all modules or a specific module
- Interactive mode for selective test execution
- Detailed test reporting with pass/fail statistics
- Color-coded output for better readability

### `run-server-and-tests.ps1`

Starts the server and runs tests in sequence.

**Usage:**
```powershell
# Start server and run all tests
.\scripts\run-server-and-tests.ps1

# Skip server start (if already running) and run tests
.\scripts\run-server-and-tests.ps1 -skipServer

# Run tests for a specific module only
.\scripts\run-server-and-tests.ps1 -testModule "auth"

# Run in interactive mode
.\scripts\run-server-and-tests.ps1 -interactive
```

**Features:**
- Combines server startup and test execution
- Option to skip server start if already running
- Selective module testing
- Interactive mode for guided testing
- Automatically stops the server after tests complete

## Test Modules

The scripts are configured to run tests for the following modules:

- `auth` - Authentication and authorization tests
- `users` - User management tests
- `marketplace` - Marketplace functionality tests
- `drivers` - Driver management tests
- `errands` - Errands functionality tests
- `integration` - Cross-module integration tests

## Requirements

- PowerShell 5.1 or higher
- Node.js and npm installed
- NestJS project dependencies installed

## Troubleshooting

### Server won't start

If the server fails to start:

1. Check if port 3000 is already in use
2. Verify that all dependencies are installed (`npm install`)
3. Check for environment configuration issues

### Tests failing

If tests are failing:

1. Make sure the server is running
2. Check database connection and configuration
3. Verify that test database is properly seeded
4. Look for specific error messages in the test output