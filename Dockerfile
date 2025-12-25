# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# Build stage
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Copy only package.json and package-lock.json first for layer caching
COPY --link package.json package-lock.json ./

# Install dependencies (use npm ci for deterministic builds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application source code
COPY --link . .

# Create a temporary .env file for Prisma generation during build
RUN echo "DATABASE_URL=\"postgresql://temp:temp@temp:5432/temp\"" > .env && \
    echo "DATABASE_URL_DIRECT=\"postgresql://temp:temp@temp:5432/temp\"" >> .env

# Generate Prisma client
RUN --mount=type=cache,target=/root/.npm \
    npx prisma generate

# Remove the temporary .env file
RUN rm .env

# Build the TypeScript app
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# Production stage
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create a non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

# Create a temporary .env file for Prisma generation during build
RUN echo "DATABASE_URL=\"postgresql://temp:temp@temp:5432/temp\"" > .env && \
    echo "DATABASE_URL_DIRECT=\"postgresql://temp:temp@temp:5432/temp\"" >> .env

# Generate Prisma client in the final image to ensure it's properly installed
RUN --mount=type=cache,target=/root/.npm \
    npx prisma generate

# Remove the temporary .env file
RUN rm .env

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
USER appuser

# Expose port (default 3000, override if needed)
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
