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
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl

# Install production dependencies and Prisma CLI
COPY package*.json ./
RUN npm ci --only=production && npm install prisma

# Copy built application and Prisma files
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client for production
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads/residents uploads/complaints uploads/documents uploads/events

EXPOSE 4000
CMD ["node", "dist/index.js"]
