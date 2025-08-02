#!/bin/bash

# SmartRW Production Setup for Ubuntu Server
echo "🚀 SmartRW Production Setup for Ubuntu"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   echo "Please run as a regular user with sudo privileges."
   exit 1
fi

# Detect Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    echo "Please install Docker and Docker Compose first:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker \$USER"
    echo "  # Then logout and login again"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose found: $DOCKER_COMPOSE${NC}"

# Check if containers are running
echo -e "${YELLOW}📦 Checking container status...${NC}"
if ! $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Containers not running. Starting them...${NC}"
    $DOCKER_COMPOSE up -d
    
    # Wait for containers to be ready
    echo -e "${YELLOW}⏳ Waiting for containers to be ready (30s)...${NC}"
    sleep 30
fi

# Check backend health
echo -e "${YELLOW}🔍 Checking backend health...${NC}"
if $DOCKER_COMPOSE ps backend | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend container is running${NC}"
else
    echo -e "${RED}❌ Backend container is not healthy${NC}"
    echo "Container status:"
    $DOCKER_COMPOSE ps
    echo ""
    echo "Backend logs:"
    $DOCKER_COMPOSE logs --tail=20 backend
    exit 1
fi

# Check MySQL health
echo -e "${YELLOW}🗄️  Checking MySQL health...${NC}"
if $DOCKER_COMPOSE ps mysql | grep -q "healthy"; then
    echo -e "${GREEN}✅ MySQL container is healthy${NC}"
else
    echo -e "${YELLOW}⏳ Waiting for MySQL to be healthy...${NC}"
    for i in {1..30}; do
        if $DOCKER_COMPOSE ps mysql | grep -q "healthy"; then
            echo -e "${GREEN}✅ MySQL is now healthy${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    if ! $DOCKER_COMPOSE ps mysql | grep -q "healthy"; then
        echo -e "${RED}❌ MySQL container is not healthy after waiting${NC}"
        echo "MySQL logs:"
        $DOCKER_COMPOSE logs --tail=20 mysql
        exit 1
    fi
fi

# Run production seed
echo ""
echo -e "${BLUE}🌱 Creating Admin User...${NC}"
$DOCKER_COMPOSE exec backend npm run seed:prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Application Access:${NC}"
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "• Frontend: http://$SERVER_IP:3000"
    echo "• Backend API: http://$SERVER_IP:4000"
    echo "• Full App (via Nginx): http://$SERVER_IP"
    echo ""
    
    echo -e "${BLUE}🔐 Admin Credentials:${NC}"
    echo "• Email: admin@smartrw.com"
    echo "• Password: SmartRW2024!Admin"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANT SECURITY STEPS:${NC}"
    echo "1. Change the default admin password immediately"
    echo "2. Configure firewall (ufw) to restrict access"
    echo "3. Set up SSL/HTTPS for production"
    echo "4. Configure domain name and DNS"
    echo "5. Set up regular database backups"
    echo ""
    
    echo -e "${BLUE}🛠️  Useful Commands:${NC}"
    echo "• View logs: $DOCKER_COMPOSE logs -f [service]"
    echo "• Restart: $DOCKER_COMPOSE restart"
    echo "• Stop: $DOCKER_COMPOSE down"
    echo "• Update: git pull && $DOCKER_COMPOSE up -d --build"
    
else
    echo ""
    echo -e "${RED}❌ Setup failed!${NC}"
    echo "Check the error messages above and try again."
    exit 1
fi
