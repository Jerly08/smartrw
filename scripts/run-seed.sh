#!/bin/bash

echo "🌱 Running database seed..."

# Method 1: Using docker-compose run
echo "📦 Running seed via Docker container..."
docker-compose run --rm backend npm run seed

echo "✅ Seed completed!"
echo ""
echo "🔑 Login credentials created:"
echo "┌─────────────────────────────────────────────────┐"
echo "│  ADMIN: admin@smartrw.com / admin123456          │"
echo "│  RW:    rw@smartrw.com    / rw123456             │"
echo "│  RT001: rt001@smartrw.com / rt123456             │"
echo "│  RT002: rt002@smartrw.com / rt123456             │"
echo "│  WARGA: warga001@smartrw.com / warga123456       │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "⚠️  IMPORTANT: Change these default passwords in production!"
