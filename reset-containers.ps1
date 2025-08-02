# PowerShell script to completely reset Docker containers and volumes
Write-Host "=== SmartRW Container Reset Script ===" -ForegroundColor Green

# Stop and remove all containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Remove all volumes (this will delete the database data)
Write-Host "Removing volumes..." -ForegroundColor Yellow
docker-compose down -v

# Remove any orphaned volumes
Write-Host "Pruning volumes..." -ForegroundColor Yellow
docker volume prune -f

# Remove containers and images to force rebuild
Write-Host "Removing containers..." -ForegroundColor Yellow
docker-compose rm -f

# Rebuild and start containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait a moment for containers to start
Write-Host "Waiting for containers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Show container status
Write-Host "Container status:" -ForegroundColor Green
docker-compose ps

# Show backend logs
Write-Host "Backend logs:" -ForegroundColor Green
docker-compose logs backend

Write-Host "=== Reset Complete ===" -ForegroundColor Green
Write-Host "If you see authentication errors, try running: docker-compose logs mysql" -ForegroundColor Cyan
