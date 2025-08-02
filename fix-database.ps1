# Complete Database Fix Script
Write-Host "=== SmartRW Database Fix Script ===" -ForegroundColor Green

# Step 1: Stop all containers
Write-Host "1. Stopping all containers..." -ForegroundColor Yellow
docker-compose down

# Step 2: Remove all volumes (this will delete ALL database data)
Write-Host "2. Removing volumes (database data will be lost)..." -ForegroundColor Red
docker-compose down -v
docker volume prune -f

# Step 3: Use simple configuration
Write-Host "3. Switching to simple configuration..." -ForegroundColor Yellow
if (Test-Path ".env.production.simple") {
    Copy-Item ".env.production.simple" ".env.production" -Force
    Write-Host "   ✓ Using simplified passwords without special characters" -ForegroundColor Green
} else {
    Write-Host "   ✗ .env.production.simple not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Remove old containers
Write-Host "4. Removing old containers..." -ForegroundColor Yellow
docker-compose rm -f

# Step 5: Remove MySQL image to force fresh download
Write-Host "5. Removing MySQL image to ensure fresh start..." -ForegroundColor Yellow
docker image rm mysql:8.0 -f 2>$null

# Step 6: Build and start with clean slate
Write-Host "6. Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Step 7: Wait for services
Write-Host "7. Waiting for services to initialize..." -ForegroundColor Yellow
Write-Host "   Waiting 30 seconds for MySQL to fully start..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Step 8: Check container status
Write-Host "8. Checking container status:" -ForegroundColor Green
docker-compose ps

# Step 9: Show logs
Write-Host "9. Backend logs (last 20 lines):" -ForegroundColor Green
docker-compose logs --tail=20 backend

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green
Write-Host "If you still see authentication errors:" -ForegroundColor Cyan
Write-Host "1. Run: docker-compose logs mysql" -ForegroundColor White
Write-Host "2. Run: docker-compose logs backend" -ForegroundColor White
Write-Host "3. Check if MySQL container is healthy: docker-compose ps" -ForegroundColor White
