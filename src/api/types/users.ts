import type { DateTimeString, ObjectId } from './common';
import type { UserRole } from './roles';

export type AccessLevel = 'level 1' | 'level 2' | 'level 3' | 'level 4' | 'level 5';
export type UserRoleType = 'admin' | 'staff' | 'customer' | 'company' | 'developer';
export type TwoFactorMethod = 'email' | 'sms' | 'authenticator';

/** Staff user. Password and refresh token are never returned. */
export interface User {
  _id?: ObjectId;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  staffId?: string;
  department?: string;
  designation?: string;
  accessLevel?: AccessLevel;
  role?: UserRoleType;
  status?: string;
  isActive?: boolean;
  twoFactorAuth?: boolean;
  twofactorMethod?: TwoFactorMethod;
  isFirstLogin?: boolean;
  lastLogin?: DateTimeString;
  createdAt?: DateTimeString;
}

/** Item of `GET /api/users/all` — user plus their role summary. */
export interface UserWithRoles extends User {
  roles?: { roleName?: string; roleId?: string }[];
}

// ---------- Auth ----------

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  /** JWT access token (valid 1 day). Send as `Authorization: Bearer <token>`. */
  token?: string;
  user?: {
    /** Note: `id`, not `_id`, on this endpoint. */
    id?: ObjectId;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    status?: string;
  };
}

export interface MeResponse {
  user?: User;
  /** The single role assignment (populated role + permissions), or null. */
  userRoles?: UserRole | null;
}

export interface MeWithoutRolesResponse {
  user?: User;
}

// ---------- Staff management ----------

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  staffId: string;
  designation: string;
  department: string;
  accessLevel: AccessLevel;
  /** @default "staff" */
  role?: 'admin' | 'staff';
  /** @default "inactive" — an admin must activate the account before sign-in. */
  status?: 'active' | 'inactive';
  /** @default false */
  twofaEnabled?: boolean;
  /** @default "email" */
  twoFactorMethod?: TwoFactorMethod;
}

/** Only the fields sent are changed. Email, password and role cannot be changed. */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  designation?: string;
  department?: string;
  accessLevel?: AccessLevel;
}

export interface UserResponse {
  message?: string;
  user?: User;
}

export interface ListUsersResponse {
  users?: UserWithRoles[];
}

export interface DeleteAllUsersResponse {
  message?: string;
  deletedCount?: number;
}
