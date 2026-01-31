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
permissionsData?: Permission[];}

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
  authInitialized: boolean;}

// ==================== PERMISSION & ROLE TYPES ====================
export interface Permission {
  _id: string;
  name: string;
  description?: string;
  resource?: string;       
  action?: string;         
  isApprovable?: boolean;  
  hasApprovalConfigured?: boolean;  
  isPostingPermission?: boolean;   
  lastModified?: string;   
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRole {
  _id?: string;
  userId: string | { _id: string; email: string }; // ← FIXED: Can be string OR object
  roleId: string | { _id: string; name: string; description: string; permissions: Permission[] }; // ← FIXED: Can be string OR object
  assignedBy: string | { _id: string; email: string }; // ← FIXED: Can be string OR object
  assignedAt: string;
  __v?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface RoleContextType {
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  createRole: (role: Omit<Role, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string, assignedBy: string) => Promise<UserRole>;
  removeRole: (userId: string, roleId: string) => Promise<void>;
  getUserRoles: (userId: string) => Role[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isAssigning: boolean;
  error: string | null;
  clearError: () => void;
  refreshData: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  refreshUserRoles: () => Promise<void>;
  validateRoleName: (name: string) => string | null;
   hasPermission: (userId: string, permission: string) => boolean;
  canAccess: (userId: string, resource: string, action: string) => boolean;
}
export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

// User type for role assignments
export interface RoleUser {
  _id: string;
  fullName: string;
  email: string;
  staffId?: string;
}

// ==================== CUSTOMER TYPES ====================
export interface Customer {
  _id: string;
  id?: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  joinDate?: string;
  createdAt?: string;
  totalLoans?: number;
  activeLoans?: number;
  creditScore?: number;
  title: string;
  identificationNumber: string;
  identificationType: string;
  issueDate: string;
  expiryDate: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  employerName: string;
  jobTitle: string;
  employmentType: string;
  monthlyIncome: number;
  employmentStartDate: string;
  Occupation: string;
  employmentStreet: string;
  employmentCity: string;
  employmentState: string;
  employmentCountry: string;
  employmentZipCode: string;
  kinName: string;
  relationship: string;
  kinPhone: string;
  kinEmail: string;
  kinStreet: string;
  kinCity: string;
  kinState: string;
  kinCountry: string;
  kinZipCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  bankBranch?: string;
  employmentStatus?: string;
  income?: number;
  loanAmount?: number;
  loanId?: string;
  guarantor?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
    identification: {
      identificationNumber: string;
      identificationType: string;
      issueDate: string;
      expiryDate: string;
    };
  };
}

export interface CreateCustomerData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  identificationNumber: string;
  identificationType: string;
  issueDate: string;
  expiryDate: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  employerName: string;
  jobTitle: string;
  employmentType: string;
  monthlyIncome: string;
  employmentStartDate: string;
  Occupation: string;
  employmentStreet: string;
  employmentCity: string;
  employmentState: string;
  employmentCountry: string;
  employmentZipCode: string;
  kinName: string;
  relationship: string;
  kinPhone: string;
  kinEmail: string;
  kinStreet: string;
  kinCity: string;
  kinState: string;
  kinCountry: string;
  kinZipCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  bankBranch?: string;
  createdBy?: string;
}

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
// ==================== FEE TYPES ====================
export interface Fee {
  _id: string;
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  glAccount: string;
  status: 'active' | 'inactive';  // ← Add this field
  isActive?: boolean;             // ← Make this optional or derive from status
  createdAt?: string;
  updatedAt?: string;
  __v?: number;                   // ← Optional: for MongoDB version key
}

export interface CreateFeeData {
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  glAccount: string;
  // You might need to add status here too if required by API
}

export interface UpdateFeeData {
  name?: string;
  type?: 'flat' | 'percentage';
  value?: number;
  glAccount?: string;
  status?: 'active' | 'inactive';  // ← Add this
}
// ==================== INTEREST TYPES ====================
export interface Interest {
  _id: string;
  name: string;
  rate: number;
  rateType: 'flat' | 'reducing_balance';  
  calculationPeriod: 'weekly' | 'monthly' | 'daily' | 'yearly';  
  glInterestIncome: string;
  status?: string;  
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateInterestData {
  name: string;
  rate: number;
  rateType: 'flat' | 'reducing_balance';  
  calculationPeriod: 'weekly' | 'monthly' | 'daily' | 'yearly';  
  glInterestIncome: string;
}

export interface UpdateInterestData {
  name?: string;
  rate?: number;
  rateType?: 'flat' | 'reducing_balance';  
  calculationPeriod?: 'weekly' | 'monthly' | 'daily' | 'yearly';  
  glInterestIncome?: string;
  status?: string;  
}
// ==================== LOAN TYPES ====================
export interface LoanApplication {
  _id: string;
  id: string;
  customer: string; 
  customerId: string;
  amount: number; 
  purpose: string; 
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'disbursed';
  appliedDate: string; 
  creditScore: number; 
  monthlyIncome: number; 
  requestedTerm: number; 
  loanProductId?: string;
  interestRate?: number;
  createdAt?: string;
  updatedAt?: string;
  totalRepayable?: number;
  outstandingPrincipal?: number;
  outstandingInterest?: number;
  tenureUnit?: string;
  startDate?: string;
  bookedBy?: string;
}
export interface LoanProduct {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: string;
  frequencyValue: number;
  frequencyUnit: string;
  periodValue: number;
  periodUnit: string;
  repaymentDescription: string;
  interestId: string;
  principalReceivable: string;
  interestReceivable: string;
  interestIncome: string;
  feeIncome: string;
  disbursementAccount: string;
  cashAccount: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  repaymentPattern: { 
    frequencyValue: number;
    frequencyUnit: string;
    periodValue: number;
    periodUnit: string;
    description: string;
};
 glMapping: {
    principalReceivable: string;
    interestReceivable: string;
    interestIncome: string;
    feeIncome: string;
    disbursementAccount: string;
    cashAccount: string;
  };
}

export interface CreateLoanProductData {
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: string;
  frequencyValue: number;
  frequencyUnit: string;
  periodValue: number;
  periodUnit: string;
  repaymentDescription: string;
  interestId: string;
  principalReceivable: string;
  interestReceivable: string;
  interestIncome: string;
  feeIncome: string;
  disbursementAccount: string;
  cashAccount: string;
}

// ==================== GL ACCOUNT TYPES ====================
export interface GLAccount {
  _id: string;
  glCode: string;
  glName: string;
  level1Category: string;
  accountNumber: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission: 'open' | 'closed';
  status: 'active' | 'inactive';
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateGLAccountData {
  glCode: string;
  glName: string;
  level1Category: string;
  accountNumber: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission: 'open' | 'closed';
  currency: string;
  createdBy?: string;
}

export interface UpdateGLAccountData {
  glCode?: string;
  glName?: string;
  level1Category?: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission?: 'open' | 'closed';
  status?: 'active' | 'inactive';
  currency?: string;
  updatedBy?: string;
}

// ==================== COMMON/UTILITY TYPES ====================
export interface ApiError {
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== NAVIGATION TYPES ====================
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

export interface LayoutProps {
  children: React.ReactNode;
}

// ==================== PERMISSION GUARD TYPES ====================
export interface PermissionGuardProps {
  permission?: string;
  resource?: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}