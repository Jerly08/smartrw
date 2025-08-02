// Production Seed - Only Admin User
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seeding...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@smartrw.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists: admin@smartrw.com');
      console.log('If you want to reset the password, please delete the user first.');
      return;
    }

    // Hash password function
    const hashPassword = async (password) => {
      const saltRounds = 12; // More secure for production
      return await bcrypt.hash(password, saltRounds);
    };

    // Create Admin user only
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@smartrw.com',
        password: await hashPassword('SmartRW2024!Admin'),
        role: 'ADMIN',
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  Email:    admin@smartrw.com                    │');
    console.log('│  Password: SmartRW2024!Admin                    │');
    console.log('│  Role:     ADMIN                                │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Change this password immediately after first login');
    console.log('2. Use a strong, unique password');
    console.log('3. Enable 2FA if available');
    console.log('4. Keep login credentials secure');
    console.log('');
    console.log('🎉 Production seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  });
