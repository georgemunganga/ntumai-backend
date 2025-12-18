# =========================
# Builder stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

# Native deps needed by Prisma / bcrypt / etc
RUN apk add --no-cache libc6-compat openssl

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Prisma (only if prisma folder exists)
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build NestJS
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER nestjs

CMD ["dumb-init", "node", "dist/main.js"]
