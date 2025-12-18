# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json ./
RUN npm install

COPY . .

# Prisma generate only if prisma folder exists
RUN if [ -d "prisma" ]; then npx prisma generate; fi

RUN npm run build


# ---------- Production ----------
FROM node:22-alpine
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

CMD ["dumb-init", "node", "dist/main.js"]
ENV PORT=3000

EXPOSE 3000

# Start compiled Nest app
CMD ["dumb-init", "bun", "run", "start:prod"]
