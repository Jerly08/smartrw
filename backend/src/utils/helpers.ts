import { Role } from '@prisma/client';

// Check if a user has permission based on role hierarchy
export const hasPermission = (userRole: Role, requiredRole: Role): boolean => {
  const roleHierarchy: Record<Role, number> = {
    ADMIN: 3,
    RW: 2,
    RT: 1,
    WARGA: 0,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Format date to Indonesian format
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

// Parse JSON safely
export const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return fallback;
  }
};

// Generate random string
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}; 