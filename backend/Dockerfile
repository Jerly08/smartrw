# Backend Dockerfile

# ---- Base Stage ----
FROM node:18-alpine AS base
WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

# ---- Dependencies Stage ----
FROM base AS dependencies
RUN npm ci

# ---- Build Stage ----
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
RUN npx prisma generate
# Build TypeScript
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS production
WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

# Install production dependencies and Prisma CLI
COPY package*.json ./
RUN npm ci --only=production && npm install prisma

# Copy built application and Prisma files
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Generate Prisma client for production with explicit binary target
RUN npx prisma generate --schema=./prisma/schema.prisma

# Verify the engines are in place
RUN ls -la node_modules/@prisma/engines/ || echo "Engines directory not found"
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found"

# Create uploads directory with proper permissions
RUN mkdir -p uploads/residents uploads/complaints uploads/documents uploads/events uploads/general
RUN chown -R node:node uploads

# Create volume mount point
VOLUME ["/app/uploads"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

EXPOSE 4000
CMD ["node", "dist/index.js"]
