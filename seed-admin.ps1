# Create Admin User for Production
Write-Host "🔐 Creating Admin User for SmartRW Production" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if backend container is running
Write-Host "📦 Checking backend container status..." -ForegroundColor Yellow
$backendStatus = docker-compose ps backend --format json | ConvertFrom-Json
if (-not $backendStatus -or $backendStatus.State -ne "running") {
    Write-Host "❌ Backend container is not running!" -ForegroundColor Red
    Write-Host "Please start the containers first: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend container is running" -ForegroundColor Green

# Run the production seed
Write-Host "`n🌱 Running production seed (Admin user only)..." -ForegroundColor Yellow
docker-compose exec backend npm run seed:prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Admin user created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Access your application at: http://localhost or your server IP" -ForegroundColor White
    Write-Host "2. Login with the credentials shown above" -ForegroundColor White
    Write-Host "3. Change the default password immediately" -ForegroundColor White
    Write-Host "4. Create other users (RW, RT, Warga) through the admin panel" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Security reminder: Always use strong passwords in production!" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Failed to create admin user!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}
