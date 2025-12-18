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
# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
# Copy the built application code
COPY --from=builder /app/dist ./dist
# Copy the prisma schema and generated client for runtime access
COPY --from=builder /app/prisma ./prisma
# Copy the prisma client files
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

EXPOSE 3000

ENTRYPOINT ["dumb-init","--"]
CMD ["npm","run","start:prod"]
