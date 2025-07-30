#!/bin/bash

# Generate secure secrets for SmartRW application
echo "🔐 Generating secure secrets for SmartRW..."

# Generate secure database passwords
ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

echo ""
echo "Generated secrets:"
echo "=================="
echo "MySQL Root Password: $ROOT_PASSWORD"
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "⚠️  IMPORTANT: Save these secrets securely!"
echo "   Copy them to your .env file and never share them publicly."
echo ""
echo "📝 Example .env configuration:"
echo "MYSQL_ROOT_PASSWORD=$ROOT_PASSWORD"
echo "MYSQL_PASSWORD=$DB_PASSWORD"
echo "DATABASE_URL=\"mysql://smart_rw_user:$DB_PASSWORD@mysql:3306/smart_rw\""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "🔒 These secrets are only shown once. Make sure to copy them now!"
