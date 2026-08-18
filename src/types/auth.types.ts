import type { Permission } from './permission.types';
// ==================== AUTH & USER TYPES ====================
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage?: string;
  department: string;
  designation: string;
  accessLevel: string;
  twoFactorAuth?: boolean;
  twofactorMethod?: string;
  email: string;
  phoneNumber: string;
  staffId: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  status?: string;
  isFirstLogin?: boolean;
  createdAt?: string;
  __v?: number;
  lastLogin?: string;
  refreshToken?: string;
  permissions?: string[];
  roleName?: string;
  permissionsData?: Permission[];
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  staffId: string;
  designation: string;
  department: string;
  accessLevel: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'staff';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  getAuthHeaders: () => { Authorization: string } | Record<string, never>;
  getRefreshHeaders: () => { Authorization: string } | Record<string, never>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  authInitialized: boolean;
}