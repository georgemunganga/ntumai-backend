# ---------- Builder ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Prisma engines may need openssl
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install deps first (cache-friendly)
COPY package*.json ./
# If you use package-lock.json, npm ci is best
RUN npm ci

# Copy prisma schema early so generate can run reliably
COPY prisma ./prisma

# Generate Prisma client BEFORE TypeScript build
RUN npx prisma generate

# Copy the rest of the source
COPY . .

# Build NestJS
RUN npm run build

# Prune dev deps for smaller runtime
RUN npm prune --omit=dev


# ---------- Runtime ----------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# keep prisma folder if you run migrations/seed from the container
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENTRYPOINT ["dumb-init","--"]
CMD ["npm","run","start:prod"]
