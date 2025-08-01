const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotification() {
  try {
    console.log('🔍 Testing RT notification system...');
    
    // Get RT user (rt001@smartrw.com)
    const rtUser = await prisma.user.findUnique({
      where: { email: 'rt001@smartrw.com' },
      include: { resident: true }
    });
    
    if (rtUser) {
      console.log(`✅ Found RT user: ${rtUser.name} (${rtUser.email})`);
      console.log(`   RT Number: ${rtUser.resident?.rtNumber}`);
      console.log(`   RW Number: ${rtUser.resident?.rwNumber}`);
    } else {
      console.log('❌ RT user not found');
      return;
    }
    
    // Check notifications for RT user
    const notifications = await prisma.notification.findMany({
      where: { userId: rtUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📬 Found ${notifications.length} notifications for RT::`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.isRead ? 'Yes' : 'No'}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('');
    });
    
    // Check recent residents who need verification
    const recentResidents = await prisma.resident.findMany({
      where: {
        rtNumber: rtUser.resident?.rtNumber,
        rwNumber: rtUser.resident?.rwNumber,
        isVerified: false
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    console.log(`\n👥 Found ${recentResidents.length} unverified residents in RT ${rtUser.resident?.rtNumber}:`);
    recentResidents.forEach((resident, index) => {
      console.log(`${index + 1}. ${resident.fullName} (${resident.nik})`);
      console.log(`   Email: ${resident.user?.email}`);
      console.log(`   Created: ${resident.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotification();
