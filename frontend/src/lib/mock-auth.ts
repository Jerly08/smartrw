import { Role, User } from './types';
import { Gender, Religion, MaritalStatus, DomicileStatus } from './types/resident';

// Mock user dengan role RT
const mockUser: User = {
  id: 2,
  email: 'rt@example.com',
  name: 'Ketua RT',
  role: Role.RT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  resident: {
    id: 2,
    nik: '1234567890123456',
    noKK: '1234567890123456',
    fullName: 'Ketua RT',
    gender: Gender.LAKI_LAKI,
    birthPlace: 'Jakarta',
    birthDate: '1980-01-01',
    address: 'Jl. RT No. 123',
    rtNumber: '001',
    rwNumber: '002',
    religion: Religion.ISLAM,
    maritalStatus: MaritalStatus.KAWIN,
    isVerified: true,
    domicileStatus: DomicileStatus.TETAP,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 2
  }
};

export const getMockUser = () => {
  return mockUser;
}; 