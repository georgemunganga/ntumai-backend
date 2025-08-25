# Deployment Guide for Ntumai Backend

## Render Deployment

### Prerequisites
1. GitHub repository with your code
2. Render account
3. PostgreSQL database (can be created on Render)

### Step-by-Step Deployment

#### 1. Database Setup
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `ntumai-db`
   - Database Name: `ntumai`
   - User: `ntumai_user`
   - Plan: Choose appropriate plan
4. Note down the connection string

#### 2. Web Service Setup
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `ntumai-backend`
   - Environment: `Node`
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Plan: Choose appropriate plan

#### 3. Environment Variables
Set the following environment variables in Render:

```
NODE_ENV=production
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=10000
FRONTEND_URL=<your-frontend-url>
API_BASE_URL=<your-backend-url>
```

#### 4. Database Migration
After first deployment, run database migrations:
1. Go to your web service in Render
2. Open the Shell tab
3. Run: `npx prisma migrate deploy`
4. Run: `npx prisma db seed` (if you have seed data)

### Using render.yaml (Recommended)

The project includes a `render.yaml` file for Infrastructure as Code deployment:

1. Push your code to GitHub
2. In Render Dashboard, click "New" → "Blueprint"
3. Connect your repository
4. Render will automatically create services based on `render.yaml`

### Troubleshooting Common Issues

#### 1. Module Not Found Errors
**Problem**: Dependencies like `@nestjs/swagger`, `class-validator` not found

**Solution**:
- Ensure `npm ci` is used in build command (not `npm install`)
- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Clear build cache and redeploy

#### 2. Prisma Client Issues
**Problem**: `@prisma/client` not found or generated

**Solution**:
- Ensure `npx prisma generate` runs in build command
- Check that `DATABASE_URL` is properly set
- Verify Prisma schema is valid

#### 3. Build Timeouts
**Problem**: Build takes too long and times out

**Solution**:
- Use `npm ci` instead of `npm install`
- Consider upgrading to a higher plan
- Optimize dependencies

#### 4. Database Connection Issues
**Problem**: Cannot connect to database

**Solution**:
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database is in the same region
- Check database is running and accessible

#### 5. Environment Variables
**Problem**: App crashes due to missing environment variables

**Solution**:
- Copy all variables from `.env.example`
- Generate strong secrets for JWT tokens
- Set `NODE_ENV=production`

### Health Check

The application includes a health check endpoint at `/api/health` that Render uses to monitor service health.

### Monitoring and Logs

1. **Logs**: Available in Render Dashboard → Your Service → Logs
2. **Metrics**: Available in Render Dashboard → Your Service → Metrics
3. **Health**: Monitored automatically via `/api/health` endpoint

### Production Checklist

- [ ] Database created and accessible
- [ ] All environment variables set
- [ ] Build command includes Prisma generation
- [ ] Database migrations deployed
- [ ] Health check endpoint working
- [ ] CORS configured for frontend domain
- [ ] JWT secrets are strong and unique
- [ ] Logs are being generated properly

### Scaling Considerations

1. **Database**: Consider connection pooling for high traffic
2. **Caching**: Implement Redis for session management
3. **File Storage**: Use cloud storage (AWS S3, Cloudinary) instead of local storage
4. **CDN**: Use CDN for static assets
5. **Load Balancing**: Render handles this automatically

### Security Best Practices

1. Use strong, unique JWT secrets
2. Enable HTTPS (automatic on Render)
3. Configure CORS properly
4. Keep dependencies updated
5. Use environment variables for all secrets
6. Enable rate limiting for API endpoints

### Support

For deployment issues:
1. Check Render documentation: https://render.com/docs
2. Review build logs in Render Dashboard
3. Use Render community forum for help
4. Contact Render support for platform issues