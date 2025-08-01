#!/bin/bash

# SSL Setup Script for SmartRW using Let's Encrypt
# Author: Smart RW Team
# Version: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Please provide your domain name"
    echo "Usage: $0 yourdomain.com [email@example.com]"
    echo "Example: $0 smartrw.yourdomain.com admin@yourdomain.com"
    exit 1
fi

DOMAIN="$1"
EMAIL="${2:-admin@$DOMAIN}"

print_status "Setting up SSL for domain: $DOMAIN"
print_status "Using email: $EMAIL"

# Check if domain resolves to this server
check_domain_dns() {
    print_status "Checking DNS resolution for $DOMAIN..."
    
    # Get server's public IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || curl -s icanhazip.com)
    
    # Get domain's IP
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    
    if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
        print_warning "Domain $DOMAIN does not resolve to this server ($SERVER_IP)"
        print_warning "Domain resolves to: $DOMAIN_IP"
        print_status "Please update your DNS records before continuing."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "DNS check passed"
    fi
}

# Install Certbot
install_certbot() {
    print_status "Installing Certbot..."
    
    # Update package list
    sudo apt update
    
    # Install Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    print_success "Certbot installed successfully"
}

# Stop Nginx temporarily
stop_nginx() {
    print_status "Stopping Nginx temporarily..."
    docker-compose stop nginx
}

# Start Nginx
start_nginx() {
    print_status "Starting Nginx..."
    docker-compose start nginx
}

# Obtain SSL certificate
obtain_certificate() {
    print_status "Obtaining SSL certificate for $DOMAIN..."
    
    # Use standalone mode since we'll configure nginx manually
    sudo certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Copy certificates to nginx directory
copy_certificates() {
    print_status "Copying certificates to nginx directory..."
    
    # Create nginx ssl directory if it doesn't exist
    mkdir -p nginx/ssl
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
    
    # Set proper permissions
    sudo chown $(whoami):$(whoami) nginx/ssl/cert.pem nginx/ssl/key.pem
    sudo chmod 644 nginx/ssl/cert.pem
    sudo chmod 600 nginx/ssl/key.pem
    
    print_success "Certificates copied successfully"
}

# Update nginx configuration
update_nginx_config() {
    print_status "Updating nginx configuration for SSL..."
    
    # Backup current config
    cp nginx/nginx.conf nginx/nginx.conf.backup
    
    # Replace localhost with actual domain in SSL config
    sed "s/YOUR_DOMAIN.com/$DOMAIN/g" nginx/nginx-ssl.conf > nginx/nginx.conf
    
    print_success "Nginx configuration updated"
}

# Update environment file
update_env_file() {
    print_status "Updating environment file..."
    
    # Backup current env file
    cp .env.production .env.production.backup
    
    # Update API URL to use HTTPS
    sed -i "s|http://YOUR_VPS_IP|https://$DOMAIN|g" .env.production
    
    print_success "Environment file updated"
}

# Setup auto-renewal
setup_auto_renewal() {
    print_status "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /tmp/renew-ssl.sh << EOF
#!/bin/bash

# Stop nginx
docker-compose -f $(pwd)/docker-compose.yml stop nginx

# Renew certificate
certbot renew --standalone

# Copy renewed certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $(pwd)/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $(pwd)/nginx/ssl/key.pem

# Set permissions
chown $(whoami):$(whoami) $(pwd)/nginx/ssl/cert.pem $(pwd)/nginx/ssl/key.pem
chmod 644 $(pwd)/nginx/ssl/cert.pem
chmod 600 $(pwd)/nginx/ssl/key.pem

# Start nginx
docker-compose -f $(pwd)/docker-compose.yml start nginx

echo "SSL certificates renewed successfully"
EOF

    # Move script to appropriate location
    sudo mv /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for automatic renewal (runs twice a day)
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
    
    print_success "Auto-renewal configured"
}

# Test SSL configuration
test_ssl() {
    print_status "Testing SSL configuration..."
    
    # Wait a moment for nginx to start
    sleep 5
    
    # Test HTTPS connection
    if curl -f https://$DOMAIN/health &>/dev/null; then
        print_success "HTTPS connection successful"
    else
        print_warning "HTTPS test failed, but SSL certificates are installed"
        print_status "Please check nginx logs: docker-compose logs nginx"
    fi
}

# Main SSL setup function
main_ssl_setup() {
    print_status "Starting SSL setup for $DOMAIN..."
    
    check_domain_dns
    install_certbot
    stop_nginx
    obtain_certificate
    copy_certificates
    update_nginx_config
    update_env_file
    start_nginx
    setup_auto_renewal
    
    # Rebuild containers with new environment
    print_status "Rebuilding containers with SSL configuration..."
    docker-compose up --build -d
    
    test_ssl
    
    print_success "=== SSL SETUP COMPLETE ==="
    echo ""
    print_status "Your application is now available at:"
    echo "  - HTTPS: https://$DOMAIN"
    echo "  - HTTP: http://$DOMAIN (redirected to HTTPS)"
    echo ""
    print_status "Certificate details:"
    echo "  - Domain: $DOMAIN, www.$DOMAIN"
    echo "  - Issuer: Let's Encrypt"
    echo "  - Auto-renewal: Configured"
    echo ""
    print_warning "Important Notes:"
    echo "  - Certificates will auto-renew every 60 days"
    echo "  - Check renewal logs at: /var/log/ssl-renewal.log"
    echo "  - Manual renewal: sudo /usr/local/bin/renew-ssl.sh"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root for security reasons."
    print_status "Please run as a regular user with sudo privileges."
    exit 1
fi

# Check if docker-compose.yml exists
if [[ ! -f "docker-compose.yml" ]]; then
    print_error "docker-compose.yml not found in current directory"
    print_status "Please run this script from your project root directory"
    exit 1
fi

# Run main setup
main_ssl_setup
