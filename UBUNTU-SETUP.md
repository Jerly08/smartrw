# SmartRW Setup untuk Ubuntu Server

## Prerequisites

1. **Ubuntu Server 20.04+ atau 22.04+**
2. **User dengan sudo privileges** (jangan gunakan root)
3. **Docker dan Docker Compose terinstall**

### Install Docker (jika belum ada)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Logout dan login kembali agar group changes berlaku
# Atau gunakan: newgrp docker

# Verify Docker installation
docker --version
docker-compose --version
```

## Quick Setup

### Option 1: Automatic Setup (Recommended)

```bash
# Download dan jalankan script setup
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh
```

### Option 2: Manual Steps

```bash
# 1. Start containers
docker-compose up -d

# 2. Wait for containers to be ready
sleep 30

# 3. Create admin user
chmod +x create-admin.sh
./create-admin.sh
```

### Option 3: Direct Command

```bash
# Pastikan containers berjalan
docker-compose up -d

# Buat admin langsung
docker-compose exec backend npm run seed:prod
```

## Login Credentials

Setelah setup berhasil:

```
Email:    admin@smartrw.com
Password: SmartRW2024!Admin
Role:     ADMIN
```

## Access Application

Setelah setup, akses aplikasi melalui:

- **Frontend**: `http://YOUR_SERVER_IP:3000`
- **Backend API**: `http://YOUR_SERVER_IP:4000`
- **Full App (Nginx)**: `http://YOUR_SERVER_IP`

## Security Configuration

### 1. Firewall Setup (UFW)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (jangan lupa!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow specific ports (optional)
sudo ufw allow 3000  # Frontend
sudo ufw allow 4000  # Backend

# Check status
sudo ufw status
```

### 2. SSL/HTTPS Setup dengan Let's Encrypt

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (ganti yourdomain.com)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Environment Configuration

Update `.env.production` dengan domain Anda:

```bash
# Edit environment file
nano .env.production

# Update API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Management Commands

### Container Management

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Update application
git pull
docker-compose up -d --build
```

### Database Management

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -prootpassword123 smart_rw > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T mysql mysql -u root -prootpassword123 smart_rw < backup_file.sql

# Access MySQL shell
docker-compose exec mysql mysql -u root -prootpassword123 smart_rw
```

### System Monitoring

```bash
# Check system resources
htop
df -h
free -h

# Check Docker resources
docker system df
docker stats

# Monitor logs in real-time
docker-compose logs -f
```

## Domain Setup

### 1. DNS Configuration

Arahkan domain Anda ke IP server:

```
A     @              YOUR_SERVER_IP
A     www            YOUR_SERVER_IP
```

### 2. Nginx Configuration

Update `nginx/nginx.conf` dengan domain Anda:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # ... rest of configuration
}
```

### 3. Environment Update

```bash
# Update .env.production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Restart containers
docker-compose up -d --build
```

## Backup Strategy

### 1. Database Backup Script

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec mysql mysqldump -u root -prootpassword123 smart_rw > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql"
EOF

chmod +x backup.sh
```

### 2. Automated Backup

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/your/project/backup.sh
```

## Troubleshooting

### Container Issues

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs backend
docker-compose logs mysql

# Restart problematic container
docker-compose restart backend
```

### Database Connection Issues

```bash
# Check MySQL health
docker-compose exec mysql mysqladmin ping -u root -prootpassword123

# Reset database (DANGER!)
docker-compose down -v
docker-compose up -d
./create-admin.sh
```

### Permission Issues

```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

### Port Conflicts

```bash
# Check what's using a port
sudo netstat -tulpn | grep :80
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 PID
```

## Performance Optimization

### 1. System Limits

```bash
# Edit limits
sudo nano /etc/security/limits.conf

# Add:
* soft nofile 65536
* hard nofile 65536
```

### 2. Docker Optimization

```bash
# Clean up Docker
docker system prune -a

# Limit container resources in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 3. Database Optimization

Adjust MySQL configuration in `docker-compose.yml`:

```yaml
mysql:
  command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=128M
```

## Production Checklist

- [ ] ✅ Database connection working
- [ ] ✅ Admin user created
- [ ] ✅ Default password changed
- [ ] ✅ Firewall configured
- [ ] ✅ SSL certificate installed
- [ ] ✅ Domain configured
- [ ] ✅ Backup system setup
- [ ] ✅ Monitoring in place
- [ ] ✅ Log rotation configured
- [ ] ✅ Security updates scheduled

---

## 🎉 Production Ready!

Aplikasi SmartRW siap digunakan untuk production di Ubuntu server!
