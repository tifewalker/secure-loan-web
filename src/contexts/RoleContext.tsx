import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { getApiUrl } from '@/contexts/AuthContext';
import { Role, Permission, UserRole, RoleContextType } from '@/types'; 

export const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRoles = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelTokenSource, setCancelTokenSource] = useState<CancelTokenSource | null>(null);

  // Helper function to extract ID from string or object
  const extractId = (item: string | { _id: string } | undefined): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item._id) return item._id;
    return '';
  };

  // Helper function to extract role from string or object
  const extractRole = (roleId: string | { _id: string; name: string; description: string; permissions: Permission[] }): Role | null => {
    if (!roleId) return null;
    
    if (typeof roleId === 'object' && roleId._id) {
      // It's already a role object from the API
      return {
        _id: roleId._id,
        name: roleId.name,
        description: roleId.description,
        permissions: roleId.permissions || []
      };
    }
    
    // It's a string ID, find the role in the roles array
    return roles.find(role => role._id === roleId) || null;
  };

  // FIXED: getUserRoles
  const getUserRoles = useCallback((userId: string): Role[] => {
    if (!userId || !Array.isArray(userRoles)) {
      return [];
    }

    const userRolesArray = userRoles.filter(ur => {
      if (!ur) return false;
      
      const urUserId = extractId(ur.userId);
      return urUserId === userId;
    });

    const foundRoles: Role[] = [];
    
    userRolesArray.forEach(ur => {
      const role = extractRole(ur.roleId);
      if (role) {
        foundRoles.push(role);
      }
    });

    return foundRoles;
  }, [userRoles, roles]);

  // FIXED: hasPermission
  const hasPermission = useCallback((userId: string, permissionName: string): boolean => {
    if (!userId || !permissionName) return false;

    const assignedRoles = getUserRoles(userId);
    
    for (const role of assignedRoles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        const hasPerm = role.permissions.some(p => p.name === permissionName);
        if (hasPerm) return true;
      }
    }

    return false;
  }, [getUserRoles]);

  // FIXED: canAccess
  const canAccess = useCallback((userId: string, resource: string, action: string): boolean => {
    if (!userId || !resource || !action) return false;

    // Generate possible permission names
    const permissionVariations = [
      `${action}_${resource}`,           // e.g., "view_accounts"
      `${action}_${resource}s`,          // e.g., "view_accounts"
      `${action}_${resource.toLowerCase()}`,
      `${action}_${resource.toLowerCase()}s`,
      `${resource}_${action}`,           // Alternative format
    ];

    // Remove duplicates
    const uniqueVariations = [...new Set(permissionVariations)];

    for (const permission of uniqueVariations) {
      if (hasPermission(userId, permission)) {
        return true;
      }
    }

    return false;
  }, [hasPermission]);

  const clearError = useCallback(() => setError(null), []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const handleApiError = useCallback((error: unknown): string => {
    if (axios.isCancel(error)) {
      return 'Request was cancelled';
    }
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      return message || 'An unexpected error occurred';
    }
    
    return 'An unexpected error occurred';
  }, []);

  // Cleanup effect for cancel tokens
  useEffect(() => {
    return () => {
      if (cancelTokenSource) {
        cancelTokenSource.cancel('Component unmounted');
      }
    };
  }, [cancelTokenSource]);

  // FIXED: refreshUserRoles - Normalize data structure
  const refreshUserRoles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl('api/roles/v1/userrole'), {
        headers: getAuthHeaders()
      });
      
      let userRolesData;
      
      if (response.data?.userRoles) {
        userRolesData = response.data.userRoles;
      } else if (Array.isArray(response.data)) {
        userRolesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        userRolesData = [response.data];
      } else {
        userRolesData = [];
      }
      
      // Normalize data to match our UserRole interface
      const normalizedUserRoles = (Array.isArray(userRolesData) ? userRolesData : [])
        .map((item: Record<string, unknown>) => ({
          _id: item._id,
          userId: item.userId, // Can be string or object
          roleId: item.roleId, // Can be string or object
          assignedBy: item.assignedBy, // Can be string or object
          assignedAt: item.assignedAt,
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
          __v: item.__v
        }))
        .filter(Boolean) as UserRole[];
      
      setUserRoles(normalizedUserRoles);
    } catch (err) {
      console.error('Failed to refresh user roles:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  const refreshRoles = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl('api/roles/v1/all'), {
        headers: getAuthHeaders()
      });
      
      const rolesData = response.data?.roles || [];
      
      const normalizedRoles = rolesData.map((role: Record<string, unknown>) => ({
        _id: role._id,
        name: role.name,
        description: role.description,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        __v: role.__v
      }));
      
      setRoles(normalizedRoles);
      return normalizedRoles;
    } catch (err) {
      console.error('Failed to refresh roles:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  const refreshPermissions = useCallback(async () => {
    try {
      const response = await axios.get(getApiUrl('api/permissions/v1/all'), {
        headers: getAuthHeaders()
      });
      setPermissions(response.data?.permission || []);
    } catch (err) {
      console.error('Failed to refresh permissions:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshRoles(), refreshPermissions(), refreshUserRoles()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshRoles, refreshPermissions, refreshUserRoles]);

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      if (cancelTokenSource) {
        cancelTokenSource.cancel('New request started');
      }
      
      const source = axios.CancelToken.source();
      setCancelTokenSource(source);
      
      setIsLoading(true);
      try {
        const headers = getAuthHeaders();
        
        const [permRes, roleRes, userRoleRes] = await Promise.all([
          axios.get(getApiUrl('api/permissions/v1/all'), { headers, cancelToken: source.token }),
          axios.get(getApiUrl('api/roles/v1/all'), { headers, cancelToken: source.token }),
          axios.get(getApiUrl('api/roles/v1/userrole'), { headers, cancelToken: source.token })
        ]);
        
        // Set permissions
        setPermissions(permRes.data?.permission || []);
        
        // Set roles (normalized)
        const rolesData = roleRes.data?.roles || [];
        const normalizedRoles = rolesData.map((role: Record<string, unknown>) => ({
          _id: role._id,
          name: role.name,
          description: role.description,
          permissions: Array.isArray(role.permissions) ? role.permissions : [],
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          __v: role.__v
        }));
        setRoles(normalizedRoles);
        
        // Set user roles (normalized)
        let userRolesData;
        if (userRoleRes.data?.userRoles) {
          userRolesData = userRoleRes.data.userRoles;
        } else if (Array.isArray(userRoleRes.data)) {
          userRolesData = userRoleRes.data;
        } else if (userRoleRes.data && typeof userRoleRes.data === 'object') {
          userRolesData = [userRoleRes.data];
        } else {
          userRolesData = [];
        }
        
        const normalizedUserRoles = (Array.isArray(userRolesData) ? userRolesData : [])
          .map((item: Record<string, unknown>) => ({
            _id: item._id as string | undefined,
            userId: item.userId as string | { _id: string },
            roleId: item.roleId as string | { _id: string; name: string; description: string; permissions: Permission[] },
            assignedBy: item.assignedBy as string | { _id: string } | undefined,
            assignedAt: item.assignedAt as string | undefined,
            updatedAt: item.updatedAt as string | undefined,
            createdAt: item.createdAt as string | undefined,
            __v: item.__v as number | undefined
          })) as UserRole[];
        
        setUserRoles(normalizedUserRoles);
        setError(null);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Failed to load initial role data:', err);
          setError('Failed to load role data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Rest of the functions (createRole, updateRole, deleteRole, assignRole, removeRole)
  // ... keep them as they were, but update assignRole and removeRole to use extractId

  const assignRole = useCallback(async (userId: string, roleId: string, assignedBy: string): Promise<UserRole> => {
    setIsAssigning(true);
    
    const previousUserRoles = userRoles;
    const tempUserRole: UserRole = {
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date().toISOString()
    };
    
    setUserRoles(prev => [
      ...prev.filter(ur => {
        const urUserId = extractId(ur.userId);
        const urRoleId = extractId(ur.roleId);
        return !(urUserId === userId && urRoleId === roleId);
      }),
      tempUserRole
    ]);
    
    try {
      const response = await axios.post(
        getApiUrl('/api/roles/v1/assign'),
        { userId, roleId, assignedBy },
        { headers: getAuthHeaders() }
      );

      const newUserRole: UserRole = {
        ...response.data,
        assignedAt: response.data.assignedAt || new Date().toISOString()
      };
      
      setUserRoles(prev => [
        ...prev.filter(ur => {
          const urUserId = extractId(ur.userId);
          const urRoleId = extractId(ur.roleId);
          return !(urUserId === userId && urRoleId === roleId);
        }),
        newUserRole
      ]);
      setError(null);
      return newUserRole;
    } catch (err) {
      setUserRoles(previousUserRoles);
      const errorMessage = handleApiError(err);
      console.error('Failed to assign role:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  }, [getAuthHeaders, handleApiError, userRoles]);

  const removeRole = useCallback(async (userId: string, roleId: string): Promise<void> => {
    setIsLoading(true);
    
    const previousUserRoles = userRoles;
    setUserRoles(prev => prev.filter(ur => {
      const urUserId = extractId(ur.userId);
      const urRoleId = extractId(ur.roleId);
      return !(urUserId === userId && urRoleId === roleId);
    }));
    
    try {
      await axios.delete(
        getApiUrl('/api/roles/v1/remove'),
        {
          data: { userId, roleId },
          headers: getAuthHeaders()
        }
      );
      setError(null);
    } catch (err) {
      setUserRoles(previousUserRoles);
      const errorMessage = handleApiError(err);
      console.error('Failed to remove role:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, handleApiError, userRoles]);

  // Keep other functions (createRole, updateRole, deleteRole) as they were
  const createRole = useCallback(async (roleData: Omit<Role, '_id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        getApiUrl('api/roles/v1/create'), 
        roleData,
        { headers: getAuthHeaders() }
      );
      
      const newRole = response.data;
      setRoles(prev => [...prev, newRole]);
      setError(null);
      return newRole;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('Failed to create role:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [getAuthHeaders, handleApiError]);

  const updateRole = useCallback(async (roleId: string, updates: Partial<Role>): Promise<Role> => {
    setIsUpdating(true);
    
    const previousRoles = roles;
    setRoles(prev => prev.map(role => 
      role._id === roleId ? { ...role, ...updates } : role
    ));
    
    try {
      const response = await axios.put(
        getApiUrl(`api/roles/v1/update/${roleId}`),
        updates,
        { headers: getAuthHeaders() }
      );
      
      const updatedRole = response.data;
      setRoles(prev => prev.map(role =>
        role._id === roleId ? { ...role, ...updatedRole } : role
      ));
      setError(null);
      return updatedRole;
    } catch (err) {
      setRoles(previousRoles);
      const errorMessage = handleApiError(err);
      console.error('Failed to update role:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [getAuthHeaders, handleApiError, roles]);

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    setIsDeleting(true);
    
    const previousRoles = roles;
    const previousUserRoles = userRoles;
    
    setRoles(prev => prev.filter(role => role._id !== roleId));
    setUserRoles(prev => prev.filter(ur => extractId(ur.roleId) !== roleId));
    
    try {
      await axios.delete(
        getApiUrl(`api/roles/v1/delete/${roleId}`),
        { headers: getAuthHeaders() }
      );
      setError(null);
    } catch (err) {
      setRoles(previousRoles);
      setUserRoles(previousUserRoles);
      const errorMessage = handleApiError(err);
      console.error('Failed to delete role:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [getAuthHeaders, handleApiError, roles, userRoles]);

  const validateRoleName = useCallback((name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Role name is required';
    }
    if (name.length > 50) {
      return 'Role name must be less than 50 characters';
    }
    if (roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
      return 'Role name already exists';
    }
    return null;
  }, [roles]);

  const contextValue: RoleContextType = {
    roles,
    permissions,
    userRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
    getUserRoles,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isAssigning,
    error,
    clearError,
    refreshData,
    refreshRoles,
    refreshPermissions,
    refreshUserRoles,
    validateRoleName,
    hasPermission,
    canAccess
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};