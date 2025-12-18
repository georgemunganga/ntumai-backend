# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Needed by some native deps / Prisma + openssl
RUN apk add --no-cache libc6-compat openssl

# Copy only dependency files first (better cache)
COPY package.json ./
# If you have any lockfiles, copy them too (optional)
# COPY package-lock.json ./
# COPY yarn.lock ./
# COPY pnpm-lock.yaml ./

# Install ALL deps (including dev) to build NestJS
RUN npm install && npm cache clean --force

# Copy source
COPY . .

# If Prisma exists, generate client (won’t fail if prisma not present)
# (If prisma is always present, keep it as is)
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build NestJS (expects "build" script)
RUN npm run build


# ---------- Production ----------
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy package.json and install only prod deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# If you need Prisma runtime files, copy prisma folder too
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER nestjs

# Start (expects dist/main.js for Nest)
CMD ["dumb-init", "node", "dist/main.js"]
