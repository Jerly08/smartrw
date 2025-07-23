import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');
  
  // Delete existing data to avoid duplicates
  await prisma.resident.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  // Create test families
  const family1 = await prisma.family.create({
    data: {
      noKK: '3201012501230001',
      address: 'Jl. Merdeka No. 123, RT 001/RW 002',
      rtNumber: '001',
      rwNumber: '002',
    }
  });

  const family2 = await prisma.family.create({
    data: {
      noKK: '3201012501230002',
      address: 'Jl. Merdeka No. 456, RT 001/RW 002',
      rtNumber: '001',
      rwNumber: '002',
    }
  });

  const family3 = await prisma.family.create({
    data: {
      noKK: '3201012501230003',
      address: 'Jl. Pahlawan No. 789, RT 002/RW 002',
      rtNumber: '002',
      rwNumber: '002',
    }
  });

  // Hash password function
  const hashPassword = async (password: string) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };

  // Create Admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Smart RW',
      email: 'admin@smartrw.com',
      password: await hashPassword('admin123456'),
      role: Role.ADMIN,
    }
  });
  console.log('Created Admin user:', adminUser.email);

  // Create RW user
  const rwUser = await prisma.user.create({
    data: {
      name: 'Ketua RW',
      email: 'rw@smartrw.com',
      password: await hashPassword('rw123456'),
      role: Role.RW,
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
      role: Role.RT,
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
      }
    }
  });
  console.log('Created RT 001 user:', rt1User.email);

  // Create RT 002 user
  const rt2User = await prisma.user.create({
    data: {
      name: 'Ketua RT 002',
      email: 'rt002@smartrw.com',
      password: await hashPassword('rt123456'),
      role: Role.RT,
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
      }
    }
  });
  console.log('Created RT 002 user:', rt2User.email);

  // Create Warga users (one for each RT)
  // Warga RT 001
  const warga1User = await prisma.user.create({
    data: {
      name: 'Warga RT 001',
      email: 'warga001@smartrw.com',
      password: await hashPassword('warga123456'),
      role: Role.WARGA,
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
      role: Role.WARGA,
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

  // Create additional family members for testing family view
  // Child in family 2 (RT 001)
  const child1User = await prisma.user.create({
    data: {
      name: 'Rizki Hidayat',
      email: 'rizki@example.com',
      password: await hashPassword('warga123456'),
      role: Role.WARGA,
      resident: {
        create: {
          nik: '3201011005100006',
          noKK: family2.noKK,
          fullName: 'Rizki Hidayat',
          gender: 'LAKI_LAKI',
          birthPlace: 'Jakarta',
          birthDate: new Date('2010-05-10'),
          address: family2.address,
          rtNumber: '001',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'BELUM_KAWIN',
          education: 'SMP',
          isVerified: true,
          verifiedBy: 'RT 001',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family2.id,
          familyRole: 'ANAK',
        }
      }
    }
  });
  console.log('Created child in family 2:', child1User.email);

  // Child in family 3 (RT 002)
  const child2User = await prisma.user.create({
    data: {
      name: 'Putri Supriyadi',
      email: 'putri@example.com',
      password: await hashPassword('warga123456'),
      role: Role.WARGA,
      resident: {
        create: {
          nik: '3201012512120007',
          noKK: family3.noKK,
          fullName: 'Putri Supriyadi',
          gender: 'PEREMPUAN',
          birthPlace: 'Jakarta',
          birthDate: new Date('2012-12-25'),
          address: family3.address,
          rtNumber: '002',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'BELUM_KAWIN',
          education: 'SD',
          isVerified: true,
          verifiedBy: 'RT 002',
          verifiedAt: new Date(),
          domicileStatus: 'TETAP',
          familyId: family3.id,
          familyRole: 'ANAK',
        }
      }
    }
  });
  console.log('Created child in family 3:', child2User.email);

  // Create additional users for unverified residents
  // User for unverified resident in RT 001
  const unverified1User = await prisma.user.create({
    data: {
      name: 'Joko Susilo',
      email: 'joko@example.com',
      password: await hashPassword('warga123456'),
      role: Role.WARGA,
      resident: {
        create: {
          nik: '3201010102950008',
          noKK: family2.noKK,
          fullName: 'Joko Susilo',
          gender: 'LAKI_LAKI',
          birthPlace: 'Semarang',
          birthDate: new Date('1995-02-01'),
          address: 'Jl. Merdeka No. 458, RT 001/RW 002',
          rtNumber: '001',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'BELUM_KAWIN',
          occupation: 'Mahasiswa',
          education: 'SMA',
          phoneNumber: '081234567895',
          email: 'joko@example.com',
          isVerified: false,
          domicileStatus: 'KOST',
          // Not assigning to a family since this is a kost resident
        }
      }
    }
  });
  console.log('Created unverified resident in RT 001:', unverified1User.email);

  // User for unverified resident in RT 002
  const unverified2User = await prisma.user.create({
    data: {
      name: 'Dewi Lestari',
      email: 'dewi@example.com',
      password: await hashPassword('warga123456'),
      role: Role.WARGA,
      resident: {
        create: {
          nik: '3201010304960009',
          noKK: family3.noKK,
          fullName: 'Dewi Lestari',
          gender: 'PEREMPUAN',
          birthPlace: 'Yogyakarta',
          birthDate: new Date('1996-04-03'),
          address: 'Jl. Pahlawan No. 791, RT 002/RW 002',
          rtNumber: '002',
          rwNumber: '002',
          religion: 'ISLAM',
          maritalStatus: 'BELUM_KAWIN',
          occupation: 'Pegawai Swasta',
          education: 'D3',
          phoneNumber: '081234567896',
          email: 'dewi@example.com',
          isVerified: false,
          domicileStatus: 'KONTRAK',
          // Not assigning to a family since this is a kontrak resident
        }
      }
    }
  });
  console.log('Created unverified resident in RT 002:', unverified2User.email);

  console.log('Seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@smartrw.com / admin123456');
  console.log('RW: rw@smartrw.com / rw123456');
  console.log('RT 001: rt001@smartrw.com / rt123456');
  console.log('RT 002: rt002@smartrw.com / rt123456');
  console.log('Warga RT 001: warga001@smartrw.com / warga123456');
  console.log('Warga RT 002: warga002@smartrw.com / warga123456');
  console.log('Child RT 001: rizki@example.com / warga123456');
  console.log('Child RT 002: putri@example.com / warga123456');
  console.log('Unverified Warga RT 001: joko@example.com / warga123456');
  console.log('Unverified Warga RT 002: dewi@example.com / warga123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 