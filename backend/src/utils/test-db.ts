import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    console.log('Testing database connection...');
    
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@smartrw.com',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Ku', // "secret"
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    
    console.log('Created test user:');
    console.log(user);
    
    // Count models
    const userCount = await prisma.user.count();
    
    console.log(`Database has ${userCount} users`);
    
    console.log('Database connection and schema test successful!');
  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 