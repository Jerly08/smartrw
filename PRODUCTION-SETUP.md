# SmartRW Production Setup Guide

## Database Setup & Admin User Creation

Setelah database berhasil terkoneksi, Anda perlu membuat user admin untuk pertama kali.

### Quick Setup (Recommended)

1. **Pastikan containers berjalan:**
   ```powershell
   docker-compose ps
   ```

2. **Buat admin user:**
   ```powershell
   .\create-admin.ps1
   ```

   Atau manual:
   ```powershell
   docker-compose exec backend npm run seed:prod
   ```

### Login Credentials

Setelah seeding berhasil, gunakan kredensial berikut:

```
Email:    admin@smartrw.com
Password: SmartRW2024!Admin
Role:     ADMIN
```

### ⚠️ Keamanan Production

**WAJIB DILAKUKAN SETELAH LOGIN PERTAMA:**

1. **Ganti password default** melalui profil admin
2. **Gunakan password yang kuat** (min 12 karakter, kombinasi huruf, angka, simbol)
3. **Aktifkan 2FA** jika tersedia
4. **Jangan share credentials** dalam format plain text

### Membuat User Lain

Setelah login sebagai admin, Anda dapat:

1. **Membuat user RW** - untuk mengelola seluruh RW
2. **Membuat user RT** - untuk mengelola RT tertentu
3. **Membuat user Warga** - untuk warga biasa
4. **Mengelola data resident** - data penduduk

### Troubleshooting

**Admin sudah ada:**
```
⚠️ Admin user already exists: admin@smartrw.com
```
- Admin sudah dibuat sebelumnya
- Gunakan kredensial yang ada atau reset melalui database

**Container tidak berjalan:**
```powershell
docker-compose up -d
```

**Error database connection:**
- Pastikan MySQL container healthy
- Check logs: `docker-compose logs backend`

### Alternative: Full Demo Data

Jika Anda ingin data demo lengkap untuk testing:

```powershell
docker-compose exec backend npm run seed
```

**Demo Credentials:**
- Admin: `admin@smartrw.com` / `admin123456`
- RW: `rw@smartrw.com` / `rw123456`
- RT001: `rt001@smartrw.com` / `rt123456`
- RT002: `rt002@smartrw.com` / `rt123456`
- Warga: `warga001@smartrw.com` / `warga123456`

### Database Management

**Reset database (DANGER - deletes all data):**
```powershell
docker-compose down -v
docker-compose up -d
.\create-admin.ps1
```

**Backup database:**
```powershell
docker-compose exec mysql mysqldump -u root -prootpassword123 smart_rw > backup.sql
```

**Restore database:**
```powershell
docker-compose exec -T mysql mysql -u root -prootpassword123 smart_rw < backup.sql
```

### Monitoring

**Check application health:**
- Backend: http://localhost:4000/api/health
- Frontend: http://localhost:3000
- Full app: http://localhost (via nginx)

**View logs:**
```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

---

## 🎉 Production Ready!

Setelah admin user dibuat, aplikasi SmartRW siap digunakan untuk production!
