# SmartRW Database Connection Troubleshooting Guide

## Problem Summary
The backend container is failing to authenticate with the MySQL database, showing error P1000.

## Root Causes Identified
1. **Password Special Characters**: Complex passwords with `!@#` characters were causing URL encoding issues
2. **Volume Persistence**: Old database volumes were persisting previous configurations
3. **Environment Variable Issues**: Inconsistent password configuration between Docker Compose and DATABASE_URL

## Solutions Implemented

### 1. Simplified Configuration
Created `.env.production.simple` with:
- Simple passwords without special characters
- Consistent MySQL configuration
- Proper URL format for Prisma

### 2. Complete Reset Script
Created `fix-database.ps1` that:
- Stops all containers
- Removes all volumes (fresh database)
- Switches to simple configuration
- Forces clean MySQL image download
- Rebuilds everything from scratch

### 3. Simplified MySQL Init Script
Updated `mysql-init/01-create-user.sql` with simple passwords

## Quick Fix Steps

### Option 1: Run the Automated Fix Script
```powershell
.\fix-database.ps1
```

### Option 2: Manual Steps
```powershell
# 1. Stop everything
docker-compose down -v

# 2. Switch to simple config
copy .env.production.simple .env.production

# 3. Clean start
docker-compose up --build -d
```

## Verification Steps

1. **Check container status:**
   ```powershell
   docker-compose ps
   ```

2. **Check MySQL logs:**
   ```powershell
   docker-compose logs mysql
   ```

3. **Check backend logs:**
   ```powershell
   docker-compose logs backend
   ```

4. **Test database connection:**
   ```powershell
   docker-compose exec mysql mysql -u root -p
   # Password: rootpassword123
   ```

## Configuration Details

### Simple Configuration (`.env.production.simple`)
```
MYSQL_ROOT_PASSWORD=rootpassword123
MYSQL_DATABASE=smart_rw
MYSQL_USER=smart_rw_user
MYSQL_PASSWORD=userpassword123
DATABASE_URL="mysql://root:rootpassword123@mysql:3306/smart_rw"
```

### Key Changes Made:
- ✅ Replaced complex passwords with simple alphanumeric ones
- ✅ Using root user in DATABASE_URL for simplicity
- ✅ Removed special characters that need URL encoding
- ✅ Added MySQL initialization script
- ✅ Enhanced docker-compose with explicit environment variables

## If Problems Persist

1. **Check Docker Desktop is running**
2. **Verify no other MySQL instances are running on port 3306**
3. **Try connecting directly to MySQL container:**
   ```powershell
   docker-compose exec mysql mysql -u root -prootpassword123 smart_rw
   ```

## Next Steps After Fix

Once the database connection is working:
1. Run Prisma migrations: `docker-compose exec backend npx prisma migrate deploy`
2. Generate Prisma client: `docker-compose exec backend npx prisma generate`
3. Test the API endpoints
4. Consider changing to more secure passwords for production use

## Security Note
The simplified passwords are intended for troubleshooting. For production deployment, consider:
- Using Docker secrets
- Environment-specific password management
- Proper URL encoding for complex passwords
