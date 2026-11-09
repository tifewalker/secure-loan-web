import type { DateTimeString, ObjectId, UserRef } from './common';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'view'
  | 'delete'
  | 'edit'
  | 'approve'
  | 'reject'
  | 'freeze'
  | 'verify'
  | 'blacklist';

export interface Permission {
  _id?: ObjectId;
  /** e.g. `view_customers`, `approve_loans`. */
  name?: string;
  description?: string;
  resource?: string;
  action?: PermissionAction;
  isApprovable?: boolean;
  createdAt?: DateTimeString;
}

export interface Role {
  _id?: ObjectId;
  name?: string;
  description?: string;
  permissions?: Permission[];
  createdAt?: DateTimeString;
}

/** A user has at most one role at a time. */
export interface UserRole {
  _id?: ObjectId;
  /** Populated user (name, email). */
  userId?: UserRef | ObjectId;
  roleId?: Role;
  /** Populated user (name, email). */
  assignedBy?: UserRef | ObjectId;
  assignedAt?: DateTimeString;
}

// ---------- Roles ----------

export interface CreateRoleRequest {
  name: string;
  description?: string;
  /** Permission IDs; every ID must exist. */
  permissions?: ObjectId[];
}

/** `permissions` replaces the whole list. */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: ObjectId[];
}

export interface RoleResponse {
  message?: string;
  role?: Role;
}

export interface ListRolesResponse {
  message?: string;
  count?: number;
  roles?: Role[];
}

export interface RoleAssignmentRequest {
  userId: ObjectId;
  roleId: ObjectId;
}

export interface AssignRoleResponse {
  message?: string;
  /** Capital `U` — as returned by the API. */
  UserRole?: UserRole;
}

export interface CurrentUserRoleResponse {
  message?: string;
  count?: 0 | 1;
  /** null when no role is assigned. */
  userRoles?: UserRole | null;
}

export interface UpdateAdminPermissionResponse {
  message?: string;
  addedPermissions?: string[];
  totalPermissions?: number;
}

// ---------- Permissions ----------

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  resource: string;
  action: PermissionAction;
}

export interface PermissionResponse {
  message?: string;
  permission?: Permission;
}

export interface ListPermissionsResponse {
  message?: string;
  /** Singular key — as returned by the API. */
  permission?: Permission[];
}

/** Permission names the spec calls out explicitly on endpoints. */
export const PERMISSIONS = {
  VIEW_CUSTOMERS: 'view_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  DELETE_DOCUMENTS: 'delete_documents',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  CREATE_ROLES: 'create_roles',
  UPDATE_ROLES: 'update_roles',
  DELETE_ROLES: 'delete_roles',
  ASSIGN_ROLES: 'assign_roles',
  DELETE_GL_ACCOUNTS: 'delete_gl_accounts',
  DELETE_FEES: 'delete_fees',
  DELETE_INTERESTS: 'delete_interests',
  DELETE_LOAN_PRODUCTS: 'delete_loan_products',
  APPROVE_LOANS: 'approve_loans',
  REJECT_LOANS: 'reject_loans',
  DEFAULT_LOANS: 'default_loans',
  CREATE_HOLIDAYS: 'create_holidays',
  DELETE_HOLIDAYS: 'delete_holidays',
} as const;

export type KnownPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
