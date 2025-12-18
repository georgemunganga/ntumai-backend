# =========================
# Builder stage
# =========================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# tools that Prisma sometimes needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./

# Force dev deps for build
RUN npm install --include=dev

COPY . .

# Prisma generate (with debug so logs show if it fails)
ENV DEBUG=prisma:*
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Build NestJS
RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev


# =========================
# Production stage
# =========================
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# non-root user
RUN useradd -m -u 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER nestjs

CMD ["dumb-init", "node", "dist/main.js"]
