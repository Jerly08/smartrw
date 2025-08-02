-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS smart_rw;

-- Drop existing user if exists (to avoid conflicts)
DROP USER IF EXISTS 'smart_rw_user'@'%';

-- Create user with simple password
CREATE USER 'smart_rw_user'@'%' IDENTIFIED BY 'userpassword123';

-- Grant all privileges
GRANT ALL PRIVILEGES ON smart_rw.* TO 'smart_rw_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Use the database
USE smart_rw;

-- Verify setup
SELECT 'Database and user setup completed successfully' as Status;
