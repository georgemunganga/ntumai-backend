# ---------- Builder ----------
FROM oven/bun:1.1.43-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY bun.lockb package.json ./
RUN bun install

COPY . .

# Prisma generate (matches your local)
RUN bunx prisma generate

# Build Nest (bun will run scripts from package.json)
RUN bun run build


# ---------- Production ----------
FROM oven/bun:1.1.43-alpine AS production
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl dumb-init

# Copy only what we need
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb ./bun.lockb

# Install production deps
RUN bun install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start compiled Nest app
CMD ["dumb-init", "bun", "run", "start:prod"]
