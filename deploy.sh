#!/bin/bash

# SmartRW Deployment Script
# This script helps deploy the SmartRW application using Docker

echo "🚀 Starting SmartRW deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "You can copy from .env.example and modify the values."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional - uncomment if you want to rebuild from scratch)
# echo "🧹 Removing old images..."
# docker-compose down --rmi all

# Pull latest images and build
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Check if containers are running
echo "🔍 Checking container status..."
sleep 10
docker-compose ps

# Show logs for troubleshooting
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your application should be available at:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost/api"
echo "   Direct Backend: http://localhost:4000"
echo ""
echo "📊 To monitor logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
