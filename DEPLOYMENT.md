# Deployment Guide

This guide provides instructions for deploying the Ntumai Auth API to production environments.

## Prerequisites

Before deploying, ensure you have:

- A PostgreSQL database instance (managed service recommended)
- Environment variables configured for production
- SSL/TLS certificates for HTTPS
- SMTP service for email OTP delivery
- SMS service provider for phone OTP delivery

## Environment Configuration

Create a production `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Configuration
JWT_ACCESS_SECRET="<strong-random-secret>"
JWT_REFRESH_SECRET="<strong-random-secret>"
JWT_ACCESS_TTL=3600
JWT_REFRESH_TTL=604800
JWT_REGISTRATION_SECRET="<strong-random-secret>"
JWT_REGISTRATION_TTL=600

# OTP Configuration
OTP_TTL_SEC=600
OTP_RESEND_DELAY_SEC=60
OTP_MAX_ATTEMPTS=5

# SMTP Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="<your-sendgrid-api-key>"
SMTP_FROM="noreply@ntumai.com"

# SMS Configuration
SMS_PROVIDER_API_KEY="<your-sms-provider-api-key>"
SMS_PROVIDER_URL="https://api.twilio.com/..."

# Application
PORT=3000
NODE_ENV=production
```

## Database Migration

Run Prisma migrations on your production database:

```bash
npx prisma migrate deploy
```

## Build for Production

Build the application:

```bash
pnpm run build
```

## Deployment Options

### Option 1: Traditional Server (PM2)

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the application:

```bash
pm2 start dist/main.js --name ntumai-auth-api
```

3. Save PM2 configuration:

```bash
pm2 save
pm2 startup
```

### Option 2: Docker

1. Build the Docker image:

```bash
docker build -t ntumai-auth-api .
```

2. Run the container:

```bash
docker run -d \
  --name ntumai-auth-api \
  -p 3000:3000 \
  --env-file .env \
  ntumai-auth-api
```

### Option 3: Cloud Platforms

#### Heroku

```bash
heroku create ntumai-auth-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

#### AWS (Elastic Beanstalk)

```bash
eb init -p node.js ntumai-auth-api
eb create ntumai-auth-api-env
eb deploy
```

#### DigitalOcean App Platform

1. Connect your repository
2. Configure build command: `pnpm run build`
3. Configure run command: `node dist/main.js`
4. Add environment variables
5. Deploy

## Security Checklist

- [ ] Use strong, randomly generated JWT secrets
- [ ] Enable HTTPS/TLS in production
- [ ] Configure CORS with specific allowed origins
- [ ] Set up rate limiting at the infrastructure level (e.g., nginx, CloudFlare)
- [ ] Enable database connection pooling
- [ ] Use managed database services with backups
- [ ] Implement logging and monitoring (e.g., Sentry, DataDog)
- [ ] Set up health check endpoints
- [ ] Use environment-specific configuration
- [ ] Rotate secrets regularly
- [ ] Enable database encryption at rest

## Monitoring

### Health Check Endpoint

Add a health check endpoint for monitoring:

```typescript
@Get('health')
@Public()
async health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### Logging

The application logs important events. Configure log aggregation services like:

- **Sentry** for error tracking
- **DataDog** or **New Relic** for APM
- **CloudWatch** (AWS) or **Stackdriver** (GCP) for cloud-native logging

## Backup Strategy

1. **Database Backups**: Configure automated daily backups
2. **Point-in-Time Recovery**: Enable PITR on your database
3. **Backup Testing**: Regularly test backup restoration

## Scaling Considerations

- Use horizontal scaling with load balancers
- Implement Redis for session management (if needed)
- Use database read replicas for read-heavy operations
- Consider caching strategies for frequently accessed data
- Monitor database connection pool usage

