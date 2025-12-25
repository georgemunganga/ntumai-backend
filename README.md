## Running the Project with Docker

This project provides a Docker-based setup for local development and deployment. The main application runs on Node.js (version specified in the Dockerfile: `22.13.1-slim`) and depends on PostgreSQL and Redis services.

### Requirements
- Docker and Docker Compose installed
- (Optional) `.env` file for environment variables (see below)

### Services and Ports
- **ts-app** (Node.js application): Exposes port `3000`
- **postgres**: Exposes port `5432`
- **redis**: Exposes port `6379`

### Environment Variables
- The application can be configured via a `.env` file placed at the project root. Uncomment the `env_file` line in `docker-compose.yml` to enable this.
- Default database credentials (as set in `docker-compose.yml`):
  - `POSTGRES_USER=postgres`
  - `POSTGRES_PASSWORD=postgres`
  - `POSTGRES_DB=appdb`

### Build and Run Instructions
1. Ensure Docker and Docker Compose are installed.
2. (Optional) Create a `.env` file in the project root with any required environment variables.
3. Build and start all services:
   ```sh
   docker compose up --build
   ```
   This will build the Node.js app and start the `ts-app`, `postgres`, and `redis` containers.

### Special Configuration
- The Node.js app runs as a non-root user for security.
- To persist PostgreSQL data, uncomment the `volumes` section for `pgdata` in `docker-compose.yml`.
- The application uses healthchecks for both PostgreSQL and Redis to ensure service readiness.

### Notes
- The default exposed application port is `3000`. You can change this in `docker-compose.yml` if needed.
- The Dockerfile uses multi-stage builds for optimized image size and security.

Refer to the provided Dockerfile and `docker-compose.yml` for further customization as needed for your environment.