const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkResident() {
  try {
    console.log('Checking resident with ID 37...');
    const resident = await prisma.resident.findFirst({
      where: { id: 37 },
      include: { family: true }
    });
    
    if (resident) {
      console.log('Found resident:');
      console.log(JSON.stringify(resident, null, 2));
    } else {
      console.log('Resident not found');
    }
    
    // Also check if there are any residents with ID 37
    const allResidents = await prisma.resident.findMany({
      select: { id: true, nik: true, noKK: true, fullName: true },
      take: 10
    });
    
    console.log('\nFirst 10 residents in database:');
    console.log(JSON.stringify(allResidents, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkResident();
