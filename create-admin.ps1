# Quick Admin Creation Script
Write-Host "🔐 Creating Admin User..." -ForegroundColor Green

# Simple one-liner to create admin
docker-compose exec backend npm run seed:prod

Write-Host "`n✅ Done! Check output above for login credentials." -ForegroundColor Green
