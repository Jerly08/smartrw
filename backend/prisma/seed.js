// --- PRODUCTION SEED FILE (JAVASCRIPT) ---
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');
  
  // Delete existing data to avoid duplicates
  await prisma.resident.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();
  await prisma.rT.deleteMany();

  // Create RT entries first
  const rt1 = await prisma.rT.create({
    data: {
      number: '001',
      chairperson: 'Ketua RT 001',
      email: 'rt001@smartrw.com',
      isActive: true,
    }
  });

  const rt2 = await prisma.rT.create({
    data: {
      number: '002',
      chairperson: 'Ketua RT 002',
      email: 'rt002@smartrw.com',
      isActive: true,
    }
  });

  // Create test families
  const family1 = await prisma.family.create({
    data: {
      noKK: '3201012501230001',
      address: 'Jl. Merdeka No. 123, RT 001/RW 002',
      rtNumber: '001',
      rwNumber: '002',
      rtId: rt1.id,
    }
  });

  const family2 = await prisma.family.create({
    data: {
      noKK: '3201012501230002',
      address: 'Jl. Merdeka No. 456, RT 001/RW 002',
      rtNumber: '001',
      rwNumber: '002',
      rtId: rt1.id,
    }
  });

  const family3 = await prisma.family.create({
    data: {
      noKK: '3201012501230003',
      address: 'Jl. Pahlawan No. 789, RT 002/RW 002',
      rtNumber: '002',
      rwNumber: '002',
      rtId: rt2.id,
    }
  });

  // Hash password function
  const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };

  // Create Admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Smart RW',
      email: 'admin@smartrw.com',
      password: await hashPassword('admin123456'),
      role: 'ADMIN',
    }
  });
  console.log('Created Admin user:', adminUser.email);

  // Create RW user
  const rwUser = await prisma.user.create({
    data: {
      name: 'Ketua RW',
      email: 'rw@smartrw.com',
      password: await hashPassword('rw123456'),
      role: 'RW',
      resident: {
        create: {
          nik: '3201015005780001',
          noKK: family1.noKK,
          fullName: 'Budi Santoso',
          gender: 'LAKI_LAKI',
          birthPlace: 'Jakarta',
          birthDate: new Date('1978-05-10'),
          address: family1.address,
          rtNumber: family1.rtNumber,
          rwNumber: family1.rwNumber,
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Pengusaha',
          education: 'S1',
          phoneNumber: '081234567890',
          email: 'rw@smartrw.com',
          isVerified: true,
          verifiedBy: 'System',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family1.id,
          familyRole: 'KEPALA_KELUARGA',
        }
      }
    }
  });
  console.log('Created RW user:', rwUser.email);

  // Create RT 001 user
  const rt1User = await prisma.user.create({
    data: {
      name: 'Ketua RT 001',
      email: 'rt001@smartrw.com',
      password: await hashPassword('rt123456'),
      role: 'RT',
      resident: {
        create: {
          nik: '3201011505800002',
          noKK: family2.noKK,
          fullName: 'Ahmad Hidayat',
          gender: 'LAKI_LAKI',
          birthPlace: 'Bandung',
          birthDate: new Date('1980-05-15'),
          address: family2.address,
          rtNumber: '001',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Guru',
          education: 'S1',
          phoneNumber: '081234567891',
          email: 'rt001@smartrw.com',
          isVerified: true,
          verifiedBy: 'System',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family2.id,
          familyRole: 'KEPALA_KELUARGA',
        }
      },
      rt: {
        connect: { id: rt1.id }
      }
    }
  });
  await prisma.rT.update({
    where: { id: rt1.id },
    data: { userId: rt1User.id }
  });
  console.log('Created RT 001 user:', rt1User.email);

  // Create RT 002 user
  const rt2User = await prisma.user.create({
    data: {
      name: 'Ketua RT 002',
      email: 'rt002@smartrw.com',
      password: await hashPassword('rt123456'),
      role: 'RT',
      resident: {
        create: {
          nik: '3201012006820003',
          noKK: family3.noKK,
          fullName: 'Dedi Supriyadi',
          gender: 'LAKI_LAKI',
          birthPlace: 'Surabaya',
          birthDate: new Date('1982-06-20'),
          address: family3.address,
          rtNumber: '002',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Wiraswasta',
          education: 'SMA',
          phoneNumber: '081234567892',
          email: 'rt002@smartrw.com',
          isVerified: true,
          verifiedBy: 'System',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family3.id,
          familyRole: 'KEPALA_KELUARGA',
        }
      },
      rt: {
        connect: { id: rt2.id }
      }
    }
  });
  await prisma.rT.update({
    where: { id: rt2.id },
    data: { userId: rt2User.id }
  });
  console.log('Created RT 002 user:', rt2User.email);

  // Create Warga users (one for each RT)
  // Warga RT 001
  const warga1User = await prisma.user.create({
    data: {
      name: 'Warga RT 001',
      email: 'warga001@smartrw.com',
      password: await hashPassword('warga123456'),
      role: 'WARGA',
      resident: {
        create: {
          nik: '3201017107850004',
          noKK: family2.noKK,
          fullName: 'Siti Aminah',
          gender: 'PEREMPUAN',
          birthPlace: 'Jakarta',
          birthDate: new Date('1985-07-31'),
          address: family2.address,
          rtNumber: '001',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Ibu Rumah Tangga',
          education: 'SMA',
          phoneNumber: '081234567893',
          email: 'warga001@smartrw.com',
          isVerified: true,
          verifiedBy: 'RT 001',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family2.id,
          familyRole: 'ISTRI',
        }
      }
    }
  });
  console.log('Created Warga RT 001 user:', warga1User.email);

  // Warga RT 002
  const warga2User = await prisma.user.create({
    data: {
      name: 'Warga RT 002',
      email: 'warga002@smartrw.com',
      password: await hashPassword('warga123456'),
      role: 'WARGA',
      resident: {
        create: {
          nik: '3201015208830005',
          noKK: family3.noKK,
          fullName: 'Rina Wati',
          gender: 'PEREMPUAN',
          birthPlace: 'Bandung',
          birthDate: new Date('1983-08-12'),
          address: family3.address,
          rtNumber: '002',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'KAWIN',
          occupation: 'Pegawai Swasta',
          education: 'D3',
          phoneNumber: '081234567894',
          email: 'warga002@smartrw.com',
          isVerified: true,
          verifiedBy: 'RT 002',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family3.id,
          familyRole: 'ISTRI',
        }
      }
    }
  });
  console.log('Created Warga RT 002 user:', warga2User.email);

  console.log('Seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@smartrw.com / admin123456');
  console.log('RW: rw@smartrw.com / rw123456');
  console.log('RT 001: rt001@smartrw.com / rt123456');
  console.log('RT 002: rt002@smartrw.com / rt123456');
  console.log('Warga RT 001: warga001@smartrw.com / warga123456');
  console.log('Warga RT 002: warga002@smartrw.com / warga123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
