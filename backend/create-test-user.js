const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@smartrw.com' }
    });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: test@smartrw.com');
      console.log('Password: password123');
      return;
    }

    // Create password hash
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@smartrw.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'WARGA'
      }
    });

    console.log('Test user created successfully!');
    console.log('Login credentials:');
    console.log('Email: test@smartrw.com');
    console.log('Password: password123');
    console.log(`User ID: ${testUser.id}`);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
