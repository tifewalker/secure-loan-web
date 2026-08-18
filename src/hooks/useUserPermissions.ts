import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/contexts/RoleContext';
import { useMemo } from 'react';

export const useUserPermissions = () => {
  const { user } = useAuth();
  const { 
    hasPermission: checkPermission, 
    canAccess: checkAccess,
    getUserRoles,
    isLoading: rolesLoading
  } = useRoles();

 const hasPermission = useMemo(() => {
  return (permissionName: string): boolean => {
    if (!user?._id) {
      console.log('❌ hasPermission: No user ID');
      return false;
    }
    
    // Admin always has all permissions
    if (user.role === 'admin') {
      console.log(`✅ hasPermission: Admin has all permissions (${permissionName})`);
      return true;
    }
    
    // Check if permissions are in user object first
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('*')) return true;
      if (user.permissions.includes(permissionName)) {
        console.log(`✅ hasPermission: Found in user.permissions (${permissionName})`);
        return true;
      }
    }
    
    // Fallback to RoleContext check
    console.log(`🔍 hasPermission: Checking ${permissionName} for user ${user._id}`);
    const result = checkPermission(user._id, permissionName);
    console.log(`🔍 hasPermission Result: ${result} for ${permissionName}`);
    return result;
  };
}, [user, checkPermission]);

  // Check if user can perform action on resource
  const canAccess = useMemo(() => {
    return (resource: string, action: string): boolean => {
      if (!user?._id) {
        console.log('❌ canAccess: No user ID');
        return false;
      }
      
      // Admin always has access
      if (user.role === 'admin') {
        console.log(`✅ canAccess: Admin has all access (${action} ${resource})`);
        return true;
      }
      
      console.log(`🔍 canAccess: Checking ${action} on ${resource} for user ${user._id}`);
      const result = checkAccess(user._id, resource, action);
      console.log(`🔍 canAccess Result: ${result} for ${action} ${resource}`);
      return result;
    };
  }, [user, checkAccess]);

  // Check if user has ANY of the given permissions
  const hasAnyPermission = useMemo(() => {
    return (permissionNames: string[]): boolean => {
      if (!user?._id) {
        console.log('❌ hasAnyPermission: No user ID');
        return false;
      }
      if (user.role === 'admin') {
        console.log(`✅ hasAnyPermission: Admin has all permissions`);
        return true;
      }
      
      console.log(`🔍 hasAnyPermission: Checking any of ${permissionNames.join(', ')}`);
      const result = permissionNames.some(permissionName => 
        hasPermission(permissionName)
      );
      console.log(`🔍 hasAnyPermission Result: ${result}`);
      return result;
    };
  }, [user, hasPermission]);

  // Check if user has ALL of the given permissions
  const hasAllPermissions = useMemo(() => {
    return (permissionNames: string[]): boolean => {
      if (!user?._id) {
        console.log('❌ hasAllPermissions: No user ID');
        return false;
      }
      if (user.role === 'admin') {
        console.log(`✅ hasAllPermissions: Admin has all permissions`);
        return true;
      }
      
      console.log(`🔍 hasAllPermissions: Checking all of ${permissionNames.join(', ')}`);
      const result = permissionNames.every(permissionName => 
        hasPermission(permissionName)
      );
      console.log(`🔍 hasAllPermissions Result: ${result}`);
      return result;
    };
  }, [user, hasPermission]);

  // Get user's assigned roles
  const getUserAssignedRoles = useMemo(() => {
    return () => {
      if (!user?._id) {
        console.log('❌ getUserAssignedRoles: No user ID');
        return [];
      }
      
      console.log(`🔍 getUserAssignedRoles: Getting roles for user ${user._id}`);
      const roles = getUserRoles(user._id);
      console.log(`🔍 getUserAssignedRoles Result: Found ${roles.length} roles`);
      return roles;
    };
  }, [user, getUserRoles]);

  // Get all permission names for the current user
  const getAllPermissions = useMemo(() => {
    return (): string[] => {
      if (!user?._id) return [];
      if (user.role === 'admin') return ['*']; // Wildcard for admin
      
      const roles = getUserAssignedRoles();
      const permissions: string[] = [];
      
      roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            if (permission.name && !permissions.includes(permission.name)) {
              permissions.push(permission.name);
            }
          });
        }
      });
      
      console.log(`🔍 getAllPermissions: User has ${permissions.length} permissions:`, permissions);
      return permissions;
    };
  }, [user, getUserAssignedRoles]);

  return {
    // Permission checks
    hasPermission,
    canAccess,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    
    // User info
    userId: user?._id,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    userRole: user?.role,
    accessLevel: user?.accessLevel,
    
    // Data
    getUserAssignedRoles,
    
    // Loading state
    isLoading: rolesLoading,
    
    // Debug info (optional, can be removed in production)
    _debug: {
      user: user?._id,
      role: user?.role,
      permissions: getAllPermissions()
    }
  };
};