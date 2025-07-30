# SmartRW Deployment Guide

Panduan ini akan membantu Anda mendeploy aplikasi SmartRW ke Hostinger VPS menggunakan Docker.

## Prasyarat

- VPS dengan Docker dan Docker Compose terinstall
- Git
- Domain atau IP address yang dapat diakses

## Langkah Deployment

### 1. Persiapan di VPS

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone dan Setup Aplikasi

```bash
# Clone repository
git clone <repository-url> smartrw
cd smartrw

# Copy dan edit file environment
cp .env .env.production
nano .env.production
```

### 3. Konfigurasi Environment

Edit file `.env.production` dan sesuaikan nilai-nilai berikut:

```bash
# MySQL
MYSQL_ROOT_PASSWORD=YOUR_SECURE_ROOT_PASSWORD
MYSQL_DATABASE=smart_rw
MYSQL_USER=smart_rw_user
MYSQL_PASSWORD=YOUR_SECURE_DATABASE_PASSWORD

# Backend
JWT_SECRET=YOUR_VERY_LONG_AND_SECURE_JWT_SECRET
PORT=4000
UPLOAD_PATH=/app/uploads
NODE_ENV=production

# Frontend - Ganti dengan domain/IP VPS Anda
NEXT_PUBLIC_API_URL=http://YOUR_DOMAIN_OR_IP/api
```

**PENTING:** 
- Ganti `YOUR_SECURE_ROOT_PASSWORD` dan `YOUR_SECURE_DATABASE_PASSWORD` dengan password yang kuat
- Ganti `YOUR_VERY_LONG_AND_SECURE_JWT_SECRET` dengan string acak yang panjang
- Ganti `YOUR_DOMAIN_OR_IP` dengan domain atau IP address VPS Anda

### 4. Deploy Aplikasi

```bash
# Buat file environment aktif
cp .env.production .env

# Jalankan deployment
chmod +x deploy.sh
./deploy.sh
```

Atau manual:

```bash
# Build dan jalankan containers
docker-compose up --build -d

# Cek status containers
docker-compose ps

# Lihat logs
docker-compose logs -f
```

### 5. Konfigurasi Nginx untuk Production (Opsional)

Jika Anda ingin menggunakan domain dengan SSL, edit `nginx/nginx.conf` dan sesuaikan:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    # ... konfigurasi lainnya
}
```

### 6. Verifikasi Deployment

Buka browser dan akses:
- `http://YOUR_DOMAIN_OR_IP` - Frontend aplikasi
- `http://YOUR_DOMAIN_OR_IP/api` - Backend API

## Manajemen Aplikasi

### Melihat Status
```bash
docker-compose ps
```

### Melihat Logs
```bash
# Semua services
docker-compose logs -f

# Service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Restart Aplikasi
```bash
docker-compose restart
```

### Stop Aplikasi
```bash
docker-compose down
```

### Update Aplikasi
```bash
# Pull latest code
git pull origin main

# Rebuild dan restart
docker-compose up --build -d
```

### Backup Database
```bash
# Backup
docker-compose exec mysql mysqldump -u smart_rw_user -p smart_rw > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T mysql mysql -u smart_rw_user -p smart_rw < backup_file.sql
```

## Troubleshooting

### Container tidak mau start
```bash
# Cek logs error
docker-compose logs

# Cek resource usage
docker stats
```

### Database connection error
```bash
# Cek apakah mysql container running
docker-compose ps mysql

# Cek database logs
docker-compose logs mysql
```

### Frontend tidak bisa connect ke backend
- Pastikan `NEXT_PUBLIC_API_URL` di environment variable sudah benar
- Pastikan nginx configuration benar

## Security Checklist

- [ ] Password database sudah diganti dengan yang aman
- [ ] JWT_SECRET sudah diganti dengan string yang kuat
- [ ] Firewall dikonfigurasi hanya membuka port yang diperlukan (80, 443, 22)
- [ ] File `.env` tidak masuk ke Git
- [ ] Regular backup database
- [ ] Update sistem dan Docker secara berkala

## Port yang Digunakan

- 80: Nginx (HTTP)
- 443: Nginx (HTTPS) - jika SSL dikonfigurasi
- 3000: Frontend (internal)
- 4000: Backend (internal)
- 3306: MySQL (internal)

Port 3000, 4000, dan 3306 hanya dapat diakses dari dalam Docker network untuk keamanan.
