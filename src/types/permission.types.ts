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
  userId: string | { _id: string; email: string };
  roleId: string | { _id: string; name: string; description: string; permissions: Permission[] };
  assignedBy: string | { _id: string; email: string };
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

export interface RoleUser {
  _id: string;
  fullName: string;
  email: string;
  staffId?: string;
}