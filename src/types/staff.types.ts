// ==================== STAFF TYPES ====================
export interface Staff {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  staffId: string;
  accessLevel: string;
  phoneNumber: string;
  fullName: string;
  department: string;
  designation: string;
  isActive: boolean;
  createdAt?: string;
  position?: string;
  roles?: Array<{
    roleName: string;
    roleId: string;
  }>;
}

export interface CreateStaffData {
  email: string;
  firstName: string;
  lastName: string;
  staffId: string;
  accessLevel: string;
  phoneNumber: string;
  department: string;
  designation: string;
  password: string;
  createdBy?: string;
  role: 'staff';
  isActive: boolean;
  fullName: string;
}

export interface UpdateStaffData {
  email: string;
  firstName: string;
  lastName: string;
  staffId: string;
  accessLevel: string;
  phoneNumber: string;
  department: string;
  designation: string;
  fullName: string;
}