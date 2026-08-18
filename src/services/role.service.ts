import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { Role, Permission, UserRole, CreateRoleData, UpdateRoleData, RoleUser } from '@/types';

export const roleService = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    try {
      const response = await fetchWithRetry('api/roles/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch roles');
      }

      const result = await response.json();
      
     let rolesData: Role[] = [];
      if (result.roles && Array.isArray(result.roles)) {
        rolesData = result.roles;
      } else if (Array.isArray(result)) {
        rolesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        rolesData = result.data;
      } else {
        console.warn('Unexpected roles response format:', result);
        rolesData = [];
      }

      return rolesData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all permissions
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await fetchWithRetry('api/permissions/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch permissions');
      }

      const result = await response.json();
      
     let permissionsData: Permission[] = [];
      if (result.permission && Array.isArray(result.permission)) {
        permissionsData = result.permission;
      } else if (Array.isArray(result)) {
        permissionsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        permissionsData = result.data;
      } else {
        console.warn('Unexpected permissions response format:', result);
        permissionsData = [];
      }

      return permissionsData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all user role assignments
  getUserRoles: async (): Promise<UserRole[]> => {
    try {
      const response = await fetchWithRetry('api/roles/v1/userrole', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch user roles');
      }

      const result = await response.json();
      
     let userRolesData: UserRole[] = [];
      if (result.userRoles && Array.isArray(result.userRoles)) {
        userRolesData = result.userRoles;
      } else if (Array.isArray(result)) {
        userRolesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        userRolesData = result.data;
      } else {
        console.warn('Unexpected user roles response format:', result);
        userRolesData = [];
      }

      return userRolesData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all users for role assignments
  getUsers: async (): Promise<RoleUser[]> => {
    try {
      const response = await fetchWithRetry('api/users/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch users');
      }

      const result = await response.json();
      
     let usersData: RoleUser[] = [];
      if (Array.isArray(result)) {
        usersData = result;
      } else if (result.users && Array.isArray(result.users)) {
        usersData = result.users;
      } else if (result.data && Array.isArray(result.data)) {
        usersData = result.data;
      } else {
        console.warn('Unexpected users response format:', result);
        usersData = [];
      }

      return usersData.map((user: RoleUser) => {
        const u = user as Record<string, unknown> & {
          _id?: string;
          fullName?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          staffId?: string;
        };
        return {
          _id: u._id,
          fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          staffId: u.staffId
        } as RoleUser;
      });
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new role
  create: async (roleData: CreateRoleData): Promise<Role> => {
    try {
      const response = await authFetch('api/roles/v1/create', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to create role');
    }
  },

  // Update role
  update: async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    try {
      const response = await authFetch(`api/roles/v1/update/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to update role');
    }
  },

  // Delete role
  delete: async (roleId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/roles/v1/delete/${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete role');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete role');
    }
  },

  // Assign role to user
  assign: async (userId: string, roleId: string, assignedBy: string): Promise<UserRole> => {
    try {
      const response = await authFetch('api/roles/v1/assign', {
        method: 'POST',
        body: JSON.stringify({ userId, roleId, assignedBy })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to assign role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to assign role');
    }
  },

  // Remove role from user
  remove: async (userId: string, roleId: string): Promise<void> => {
    try {
      const response = await authFetch('api/roles/v1/remove', {
        method: 'DELETE',
        body: JSON.stringify({ userId, roleId })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to remove role');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to remove role');
    }
  }
};