const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.document.update({
      where: { id: 1 },
      data: { status: 'DIAJUKAN' }
    });
    
    console.log('Document status reset to DIAJUKAN');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
