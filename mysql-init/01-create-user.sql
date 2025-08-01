-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS smart_rw;

-- Create user and grant privileges
CREATE USER IF NOT EXISTS 'smart_rw_user'@'%' IDENTIFIED BY 'SecureDbPassword2024!@#';
GRANT ALL PRIVILEGES ON smart_rw.* TO 'smart_rw_user'@'%';
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'smart_rw_user';
