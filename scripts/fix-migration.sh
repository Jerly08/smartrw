#!/bin/bash

echo "🔧 Fixing Prisma migration state..."

# Stop all containers
echo "⏹️ Stopping containers..."
docker-compose down

# Remove MySQL volume to completely reset database
echo "🗑️ Removing MySQL volume..."
docker volume rm smartrw_mysql_data || echo "Volume doesn't exist or already removed"

# Start MySQL first
echo "🚀 Starting MySQL container..."
docker-compose up -d mysql

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# Apply clean migration
echo "📄 Applying clean migration..."
docker-compose run --rm backend npx prisma migrate deploy

# Start all services
echo "🎯 Starting all services..."
docker-compose up -d

echo "✅ Migration fix completed!"
echo "🔍 Checking container status..."
docker-compose ps
