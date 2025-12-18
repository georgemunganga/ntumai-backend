# =========================
# Builder stage
# =========================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --include=dev

COPY . .

# Build NestJS
RUN npm run build

# prune dev deps
RUN npm prune --omit=dev


# =========================
# Production stage
# =========================
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER nestjs

# ✅ Generate Prisma client at runtime (only if prisma exists), then start
CMD ["dumb-init", "sh", "-c", "if [ -d prisma ]; then npx prisma generate; fi && node dist/main.js"]
