const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('rt123', 10);
    
    await prisma.user.update({
      where: { email: 'rt010@smartrw.com' },
      data: { password: hashedPassword }
    });
    
    console.log('Password reset successfully for rt010@smartrw.com to "rt123"');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
