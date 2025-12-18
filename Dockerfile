# =========================
# Builder stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json ./

# Force dev deps for build even if NODE_ENV is set
RUN npm install --include=dev

COPY . .

# Build NestJS
RUN npm run build


# =========================
# Production stage
# =========================
FROM node:22-alpine AS production

WORKDIR /app
RUN apk add --no-cache libc6-compat openssl dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER nestjs

CMD ["dumb-init", "sh", "-c", "if [ -d prisma ]; then npx prisma generate; fi && node dist/main.js"]
