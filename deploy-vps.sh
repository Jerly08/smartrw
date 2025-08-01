#!/bin/bash

# SmartRW Deployment Script for VPS Hostinger
# Author: Smart RW Team
# Version: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="smart_rw"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_status "Run: sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        print_status "Then: sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
}

# Check if environment file exists
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error "Environment file $ENV_FILE not found!"
        print_status "Please copy .env.production.example to $ENV_FILE and configure it."
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p logs
    chmod 755 logs
    
    # Create SSL directory for nginx
    mkdir -p nginx/ssl
    chmod 755 nginx/ssl
    
    # Create uploads backup directory
    mkdir -p backup/uploads
    chmod 755 backup/uploads
    
    print_success "Directories created successfully"
}

# Setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        # Allow SSH (assuming default port 22)
        sudo ufw allow 22/tcp
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Enable firewall if not already enabled
        sudo ufw --force enable
        
        print_success "Firewall configured successfully"
    else
        print_warning "UFW firewall not found. Please configure firewall manually."
        print_status "Required ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)"
    fi
}

# Build and start containers
deploy_containers() {
    print_status "Building and starting Docker containers..."
    
    # Stop existing containers
    docker-compose -f $COMPOSE_FILE down || true
    
    # Remove old images to free space
    docker system prune -f
    
    # Build and start containers
    docker-compose -f $COMPOSE_FILE up --build -d
    
    print_success "Containers deployed successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MySQL
    print_status "Waiting for MySQL..."
    timeout=60
    while ! docker-compose exec mysql mysqladmin ping -h localhost --silent && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MySQL failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout=120
    while ! curl -f http://localhost:4000/api/health &>/dev/null && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Backend failed to start within 120 seconds"
        exit 1
    fi
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout=60
    while ! curl -f http://localhost:3000 &>/dev/null && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Frontend failed to start within 60 seconds"
        exit 1
    fi
    
    print_success "All services are ready"
}

# Check container health
check_health() {
    print_status "Checking container health..."
    
    # Check if all containers are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Some containers are not running properly"
        docker-compose ps
        exit 1
    fi
    
    # Test API endpoint
    if curl -f http://localhost/api/health &>/dev/null; then
        print_success "API is accessible through Nginx"
    else
        print_error "API is not accessible through Nginx"
        exit 1
    fi
    
    # Test frontend
    if curl -f http://localhost &>/dev/null; then
        print_success "Frontend is accessible through Nginx"
    else
        print_error "Frontend is not accessible through Nginx"
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Backup function
backup_data() {
    print_status "Creating backup..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="backup/backup_$timestamp"
    
    mkdir -p "$backup_dir"
    
    # Backup uploads
    if docker volume inspect "${PROJECT_NAME}_backend_uploads" &>/dev/null; then
        docker run --rm -v "${PROJECT_NAME}_backend_uploads":/source -v "$(pwd)/$backup_dir":/backup alpine tar czf /backup/uploads.tar.gz -C /source .
        print_success "Uploads backed up to $backup_dir/uploads.tar.gz"
    fi
    
    # Backup database
    docker-compose exec mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" smart_rw > "$backup_dir/database.sql"
    print_success "Database backed up to $backup_dir/database.sql"
}

# Show deployment info
show_deployment_info() {
    print_success "=== DEPLOYMENT COMPLETE ==="
    echo ""
    print_status "Application URLs:"
    echo "  - Application: http://$(hostname -I | awk '{print $1}')"
    echo "  - API Health: http://$(hostname -I | awk '{print $1}')/api/health"
    echo "  - Uploads: http://$(hostname -I | awk '{print $1}')/uploads/"
    echo ""
    print_status "Container Status:"
    docker-compose ps
    echo ""
    print_status "Useful Commands:"
    echo "  - View logs: docker-compose logs -f [service_name]"
    echo "  - Restart: docker-compose restart [service_name]"
    echo "  - Stop all: docker-compose down"
    echo "  - Backup: $0 backup"
    echo ""
    print_warning "Next Steps:"
    echo "  1. Point your domain to this server's IP: $(hostname -I | awk '{print $1}')"
    echo "  2. Update nginx config with your domain name"
    echo "  3. Install SSL certificate"
    echo "  4. Update .env.production with your domain"
}

# Main deployment function
main_deploy() {
    print_status "Starting SmartRW deployment to VPS..."
    
    check_root
    check_docker
    check_env_file
    create_directories
    setup_firewall
    deploy_containers
    wait_for_services
    check_health
    show_deployment_info
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main_deploy
        ;;
    "backup")
        backup_data
        ;;
    "restart")
        print_status "Restarting containers..."
        docker-compose restart
        wait_for_services
        check_health
        print_success "Restart completed"
        ;;
    "stop")
        print_status "Stopping containers..."
        docker-compose down
        print_success "Containers stopped"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {deploy|backup|restart|stop|logs [service]|status}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  backup  - Backup uploads and database"
        echo "  restart - Restart all containers"
        echo "  stop    - Stop all containers"
        echo "  logs    - Show logs (optionally for specific service)"
        echo "  status  - Show container status"
        exit 1
        ;;
esac
