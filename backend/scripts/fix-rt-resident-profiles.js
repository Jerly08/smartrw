const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRTResidentProfiles() {
  console.log('Starting RT resident profile fix...');

  try {
    // Find all RT users who don't have corresponding resident profiles
    const rtUsersWithoutResident = await prisma.user.findMany({
      where: {
        role: 'RT',
        resident: null, // No associated resident profile
      },
      include: {
        rt: true, // Include RT data if available
      },
    });

    console.log(`Found ${rtUsersWithoutResident.length} RT users without resident profiles`);

    if (rtUsersWithoutResident.length === 0) {
      console.log('All RT users already have resident profiles. Nothing to fix.');
      return;
    }

    // Create resident profiles for each RT user
    for (const rtUser of rtUsersWithoutResident) {
      console.log(`Creating resident profile for RT user: ${rtUser.email}`);

      // Get RT data for this user
      let rtData = rtUser.rt;
      
      // If no RT data found directly, try to find by userId
      if (!rtData) {
        rtData = await prisma.rt.findFirst({
          where: { userId: rtUser.id },
        });
      }

      // Default values if RT data is not available
      const rtNumber = rtData?.number || '999'; // Fallback RT number
      const chairpersonName = rtData?.chairperson || rtUser.name || `Ketua RT ${rtNumber}`;
      const address = rtData?.address || `RT ${rtNumber}`;
      const phoneNumber = rtData?.phoneNumber || null;

      // Create resident profile
      await prisma.resident.create({
        data: {
          userId: rtUser.id,
          fullName: chairpersonName,
          nik: `RT${rtNumber.padStart(3, '0')}000000000000`, // Dummy NIK for RT user
          noKK: `RT${rtNumber.padStart(3, '0')}000000000000`, // Dummy KK for RT user
          birthDate: new Date('1980-01-01'), // Dummy birth date
          birthPlace: 'Jakarta',
          gender: 'LAKI_LAKI',
          address: address,
          rtNumber: rtNumber,
          rwNumber: '001', // Default RW
          phoneNumber: phoneNumber,
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Ketua RT',
          education: 'S1',
          isVerified: true, // RT users are automatically verified
          verifiedBy: 'Migration Script',
          verifiedAt: new Date(),
        },
      });

      console.log(`✓ Created resident profile for RT user: ${rtUser.email} (RT ${rtNumber})`);
    }

    console.log(`Successfully created ${rtUsersWithoutResident.length} resident profiles for RT users`);

  } catch (error) {
    console.error('Error fixing RT resident profiles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRTResidentProfiles()
  .then(() => {
    console.log('RT resident profile fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('RT resident profile fix failed:', error);
    process.exit(1);
  });
