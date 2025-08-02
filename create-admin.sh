#!/bin/bash

# Quick Admin Creation Script for Ubuntu
echo "🔐 Creating Admin User for SmartRW..."

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose not found!"
        echo "Please install Docker and Docker Compose first."
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if backend container is running
echo "📦 Checking backend container status..."
if ! $DOCKER_COMPOSE ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running!"
    echo "Please start the containers first:"
    echo "  $DOCKER_COMPOSE up -d"
    exit 1
fi

echo "✅ Backend container is running"

# Run the production seed
echo "🌱 Running production seed (Admin user only)..."
$DOCKER_COMPOSE exec backend npm run seed:prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Admin user created successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Access your application at: http://your-server-ip or your domain"
    echo "2. Login with the credentials shown above"
    echo "3. Change the default password immediately"
    echo "4. Create other users (RW, RT, Warga) through the admin panel"
    echo ""
    echo "⚠️  Security reminder: Always use strong passwords in production!"
else
    echo ""
    echo "❌ Failed to create admin user!"
    echo "Check the error messages above and try again."
    exit 1
fi
