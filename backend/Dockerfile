# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create a script to handle migrations
RUN echo '#!/bin/sh' > /app/migrate.sh && \
    echo 'set -e' >> /app/migrate.sh && \
    echo 'echo "Checking migration status..."' >> /app/migrate.sh && \
    echo 'npx prisma migrate resolve --applied 20250802044019_make_event_enddate_optional || true' >> /app/migrate.sh && \
    echo 'echo "Running migrations..."' >> /app/migrate.sh && \
    echo 'npx prisma migrate deploy' >> /app/migrate.sh && \
    echo 'echo "Migrations completed successfully"' >> /app/migrate.sh && \
    chmod +x /app/migrate.sh

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Starting migration process..."' >> /app/start.sh && \
    echo '/app/migrate.sh' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
