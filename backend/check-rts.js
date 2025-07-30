const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRTs() {
  try {
    console.log('🔍 Checking RTs in database...\n');
    
    const rts = await prisma.rT.findMany({
      include: {
        _count: {
          select: {
            residents: true,
            families: true
          }
        }
      }
    });

    console.log(`📊 Found ${rts.length} RTs in database:`);
    
    if (rts.length === 0) {
      console.log('⚠️ No RTs found! You need to create RTs first for testing.');
      console.log('\nCreate test RT with:');
      console.log('node create-test-rt.js');
    } else {
      rts.forEach((rt, index) => {
        console.log(`\n${index + 1}. RT ${rt.number}`);
        console.log(`   - ID: ${rt.id}`);
        console.log(`   - Name: ${rt.name || 'No name'}`);
        console.log(`   - Chairperson: ${rt.chairperson || 'Not set'}`);
        console.log(`   - Address: ${rt.address || 'Not set'}`);
        console.log(`   - Active: ${rt.isActive ? 'Yes' : 'No'}`);
        console.log(`   - Residents: ${rt._count.residents}`);
        console.log(`   - Families: ${rt._count.families}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking RTs:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRTs();
