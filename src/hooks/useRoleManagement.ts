import { useState, useEffect, useCallback } from 'react';
import { useRoles } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { roleService } from '@/services/role.service';
import { useToast } from '@/hooks/use-toast';
import type { Role, Permission, RoleUser, CreateRoleData, UpdateRoleData } from '../types';

export const useRoleManagement = () => {
  const { toast } = useToast();
  
  const { 
    roles, 
    permissions, 
    userRoles, 
    createRole, 
    updateRole, 
    deleteRole, 
    assignRole, 
    removeRole,
    isLoading,
    error,
    clearError 
  } = useRoles();
  
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  
  const [allUsers, setAllUsers] = useState<RoleUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  const canAccessRoleManagement = useCallback(() => {
    return isAdmin || hasPermission('view_roles') || hasPermission('manage_roles');
  }, [isAdmin, hasPermission]);

  const canCreateRole = useCallback(() => isAdmin || hasPermission('create_roles'), [isAdmin, hasPermission]);
  const canEditRole = useCallback(() => isAdmin || hasPermission('update_roles'), [isAdmin, hasPermission]);
  const canDeleteRole = useCallback(() => isAdmin || hasPermission('delete_roles'), [isAdmin, hasPermission]);
  const canAssignRole = useCallback(() => isAdmin || hasPermission('assign_roles'), [isAdmin, hasPermission]);
  const canRemoveRole = useCallback(() => isAdmin || hasPermission('remove_roles') || hasPermission('delete_roles'), [isAdmin, hasPermission]);

  const getUserRolesByUserId = useCallback((userId: string) => {
    if (!Array.isArray(userRoles)) return [];
    return userRoles.filter(ur => ur.userId === userId);
  }, [userRoles]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !canAccessRoleManagement()) return;

    setIsLoadingUsers(true);
    try {
      const usersData = await roleService.getUsers();
      setAllUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setPageError(errorMessage);
      toast({
        title: "Error Loading Users",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, canAccessRoleManagement, toast]);

  useEffect(() => {
    if (authInitialized && isAuthenticated && canAccessRoleManagement()) {
      fetchUsers();
    }
  }, [authInitialized, isAuthenticated, canAccessRoleManagement, fetchUsers]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleCreateRole = async (roleData: { name: string; description: string; permissionIds: string[] }) => {
    if (!canCreateRole()) return { success: false, error: "You don't have permission to create roles" };

    if (!roleData.name.trim()) {
      return { success: false, error: "Role name is required" };
    }

    setOperationLoading('create');
    try {
      const permissionsToSend = roleData.permissionIds.map(permId => {
        const perm = permissions.find(p => p._id === permId);
        if (!perm) throw new Error(`Permission with ID ${permId} not found`);
        return { _id: perm._id, name: perm.name, description: perm.description };
      });

      const data: CreateRoleData = {
        name: roleData.name,
        description: roleData.description,
        permissions: permissionsToSend
      };

      await createRole(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(null);
    }
  };

  const handleUpdateRole = async (roleId: string, roleData: { name: string; description: string; permissionIds: string[] }) => {
    if (!canEditRole()) return { success: false, error: "You don't have permission to edit roles" };

    if (!roleData.name.trim()) {
      return { success: false, error: "Role name is required" };
    }

    setOperationLoading('update');
    try {
      const permissionsToSend = roleData.permissionIds.map(permId => {
        const perm = permissions.find(p => p._id === permId);
        if (!perm) throw new Error(`Permission with ID ${permId} not found`);
        return perm;
      });

      const data: UpdateRoleData = {
        name: roleData.name,
        description: roleData.description,
        permissions: permissionsToSend
      };

      await updateRole(roleId, data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!canDeleteRole()) return { success: false, error: "You don't have permission to delete roles" };

    if (roleName.toLowerCase() === 'admin') {
      return { success: false, error: "The Admin role cannot be deleted" };
    }

    setOperationLoading(`delete-${roleId}`);
    try {
      await deleteRole(roleId);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(null);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!userId || !roleId) {
      return { success: false, error: "Please select both user and role" };
    }

    if (!canAssignRole()) return { success: false, error: "You don't have permission to assign roles" };

    setOperationLoading('assign');
    try {
      await assignRole(userId, roleId, user?._id || 'admin');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(null);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!canRemoveRole()) return { success: false, error: "You don't have permission to remove role assignments" };

    setOperationLoading(`remove-${userId}-${roleId}`);
    try {
      await removeRole(userId, roleId);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(null);
    }
  };

  const getUserById = (userId: string | { _id: string; email: string }) => {
    const id = typeof userId === 'string' ? userId : userId._id;
    return allUsers.find(u => u._id === id);
  };

  const getRoleById = (roleId: string | { _id: string; name: string; description?: string; permissions?: Permission[] }) => {
    const id = typeof roleId === 'string' ? roleId : roleId._id;
    return roles.find(r => r._id === id);
  };

  return {
    toast,
    roles,
    permissions,
    userRoles,
    isLoading,
    error,
    clearError,
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    allUsers,
    isLoadingUsers,
    pageError,
    setPageError,
    operationLoading,
    canAccessRoleManagement,
    canCreateRole,
    canEditRole,
    canDeleteRole,
    canAssignRole,
    canRemoveRole,
    getUserRolesByUserId,
    fetchUsers,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
    handleAssignRole,
    handleRemoveRole,
    getUserById,
    getRoleById,
  };
};