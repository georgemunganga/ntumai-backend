# Docker Deployment Guide

**Date:** December 18, 2025  
**Status:** Production Ready

## Overview

This guide provides comprehensive instructions for building, running, and deploying the Ntumai NestJS backend using Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Image Features](#docker-image-features)
3. [Building the Docker Image](#building-the-docker-image)
4. [Running with Docker](#running-with-docker)
5. [Running with Docker Compose](#running-with-docker-compose)
6. [Environment Variables](#environment-variables)
7. [Health Checks](#health-checks)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher (optional, for compose setup)
- Environment variables configured (see `.env.example`)

---

## Docker Image Features

### Multi-Stage Build
- **Builder Stage:** Compiles TypeScript and generates Prisma Client
- **Production Stage:** Minimal runtime image with only production dependencies

### Security Features
- ✅ Non-root user (`nestjs:nodejs`)
- ✅ Minimal Alpine Linux base image
- ✅ No sensitive files in image (via `.dockerignore`)
- ✅ Health check endpoint monitoring
- ✅ Proper signal handling with `dumb-init`

### Optimizations
- ✅ Layer caching for faster builds
- ✅ Production-only dependencies
- ✅ Prisma Client pre-generated
- ✅ Clean npm cache
- ✅ Small image size (~200MB)

---

## Building the Docker Image

### Basic Build

```bash
docker build -t ntumai-backend:latest .
```

### Build with Custom Tag

```bash
docker build -t ntumai-backend:v1.0.0 .
```

### Build for Specific Platform

```bash
# For ARM64 (Apple Silicon, AWS Graviton)
docker build --platform linux/arm64 -t ntumai-backend:latest .

# For AMD64 (Intel/AMD)
docker build --platform linux/amd64 -t ntumai-backend:latest .
```

### Multi-Platform Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t ntumai-backend:latest .
```

---

## Running with Docker

### Quick Start

```bash
docker run -d \
  --name ntumai-backend \
  -p 3000:3000 \
  --env-file .env \
  ntumai-backend:latest
```

### With Environment Variables

```bash
docker run -d \
  --name ntumai-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-database-url" \
  -e DATABASE_URL_DIRECT="your-direct-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  ntumai-backend:latest
```

### View Logs

```bash
# Follow logs
docker logs -f ntumai-backend

# Last 100 lines
docker logs --tail 100 ntumai-backend
```

### Stop and Remove

```bash
docker stop ntumai-backend
docker rm ntumai-backend
```

---

## Running with Docker Compose

### Production Setup

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop all services
docker-compose -f docker-compose.production.yml down

# Stop and remove volumes
docker-compose -f docker-compose.production.yml down -v
```

### Scale the Application

```bash
docker-compose -f docker-compose.production.yml up -d --scale app=3
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma Accelerate connection URL | `prisma+postgres://...` |
| `DATABASE_URL_DIRECT` | Direct database connection URL | `prisma+postgres://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-refresh-secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `KAFKA_BROKERS` | Kafka broker addresses | - |
| `ENABLE_KAFKA` | Enable Kafka microservice | `false` |

### Environment File

Create a `.env` file:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=prisma+postgres://...
DATABASE_URL_DIRECT=prisma+postgres://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_HOST=redis
REDIS_PORT=6379
ENABLE_KAFKA=false
```

---

## Health Checks

### Docker Health Check

The Dockerfile includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

### Check Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' ntumai-backend
```

### Manual Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T03:00:00.000Z"
}
```

---

## Production Deployment

### AWS ECS/Fargate

1. **Build and push to ECR:**

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t ntumai-backend:latest .
docker tag ntumai-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ntumai-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ntumai-backend:latest
```

2. **Create ECS Task Definition** with environment variables from Secrets Manager

3. **Deploy to ECS Service**

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/ntumai-backend

# Deploy to Cloud Run
gcloud run deploy ntumai-backend \
  --image gcr.io/<project-id>/ntumai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry <registry-name> --image ntumai-backend:latest .

# Deploy to ACI
az container create \
  --resource-group <resource-group> \
  --name ntumai-backend \
  --image <registry-name>.azurecr.io/ntumai-backend:latest \
  --dns-name-label ntumai-backend \
  --ports 3000
```

### Kubernetes

Create deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ntumai-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ntumai-backend
  template:
    metadata:
      labels:
        app: ntumai-backend
    spec:
      containers:
      - name: ntumai-backend
        image: ntumai-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ntumai-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 40
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs ntumai-backend
```

**Common issues:**
- Missing environment variables
- Database connection failure
- Prisma Client not generated

**Solution:**
```bash
# Rebuild with no cache
docker build --no-cache -t ntumai-backend:latest .
```

### Database Connection Errors

**Issue:** `Can't reach database server`

**Solution:**
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from container
- Check network connectivity

### Prisma Client Errors

**Issue:** `@prisma/client did not initialize yet`

**Solution:**
- Ensure Prisma Client is generated during build
- Check that `npx prisma generate` runs successfully

### Permission Errors

**Issue:** `EACCES: permission denied`

**Solution:**
- Verify file ownership in Dockerfile
- Ensure non-root user has proper permissions

### Health Check Failing

**Issue:** Container marked as unhealthy

**Solution:**
```bash
# Check if app is responding
docker exec ntumai-backend curl http://localhost:3000/health

# Check app logs
docker logs ntumai-backend
```

---

## Best Practices

### Security

1. ✅ Never commit `.env` files
2. ✅ Use secrets management (AWS Secrets Manager, Azure Key Vault)
3. ✅ Scan images for vulnerabilities: `docker scan ntumai-backend:latest`
4. ✅ Keep base images updated
5. ✅ Use specific image tags (not `latest` in production)

### Performance

1. ✅ Use multi-stage builds to reduce image size
2. ✅ Leverage Docker layer caching
3. ✅ Run as non-root user
4. ✅ Use `.dockerignore` to exclude unnecessary files
5. ✅ Set resource limits in production

### Monitoring

1. ✅ Implement proper logging
2. ✅ Use health checks
3. ✅ Monitor container metrics
4. ✅ Set up alerts for failures
5. ✅ Use APM tools (New Relic, DataDog)

---

## CI/CD Integration

### GitHub Actions

The project includes a CI/CD workflow at `.github/workflows/ci.yml` that:
- Builds the Docker image
- Runs tests
- Pushes to Docker registry
- Deploys to production

### Manual Registry Push

```bash
# Docker Hub
docker tag ntumai-backend:latest username/ntumai-backend:latest
docker push username/ntumai-backend:latest

# GitHub Container Registry
docker tag ntumai-backend:latest ghcr.io/username/ntumai-backend:latest
docker push ghcr.io/username/ntumai-backend:latest
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Consult the main README.md
4. Open an issue on GitHub

---

**Created by:** Manus AI  
**Date:** December 18, 2025  
**Version:** 1.0
