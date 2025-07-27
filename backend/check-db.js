const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        resident: {
          select: {
            id: true,
            fullName: true,
            nik: true
          }
        }
      }
    });

    console.log('\n=== USERS IN DATABASE ===');
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        if (user.resident) {
          console.log(`   Resident: ${user.resident.fullName} (NIK: ${user.resident.nik})`);
        }
        console.log('---');
      });
    }

    // Check total counts
    const userCount = await prisma.user.count();
    const residentCount = await prisma.resident.count();
    
    console.log(`\n=== DATABASE SUMMARY ===`);
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Residents: ${residentCount}`);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
