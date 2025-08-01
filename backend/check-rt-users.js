const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const rtUsers = await prisma.user.findMany({
      where: { role: 'RT' },
      include: { rt: true }
    });
    console.log('RT Users:', JSON.stringify(rtUsers, null, 2));
    
    const documents = await prisma.document.findMany({
      take: 5,
      include: {
        requester: {
          include: {
            resident: true
          }
        }
      }
    });
    console.log('Sample Documents:', JSON.stringify(documents, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
