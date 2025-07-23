import { Role, User } from './types';

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
    fullName: 'Ketua RT',
    rtNumber: '001',
    rwNumber: '002'
  }
};

export const getMockUser = () => {
  return mockUser;
}; 