# =========================
# Builder stage
# =========================
FROM node:22-alpine AS builder

ENV NODE_ENV=development
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json ./
RUN npm install --include=dev

COPY . .

# Prisma before build (only if prisma exists)
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build Nest
RUN npm run build

# Remove dev deps after build (keeps runtime slim)
RUN npm prune --omit=dev


# =========================
# Production stage
# =========================
FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy pruned node_modules + build output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV PORT=3000
EXPOSE 3000

USER nestjs

CMD ["dumb-init", "node", "dist/main.js"]
