import { useAuth } from '@/contexts/AuthContext';

export const useDirectPermissions = () => {
  const { user } = useAuth();

  // Get permissions directly from user object
  const getPermissions = (): string[] => {
    if (!user) return [];
    
    // Admin has all permissions
    if (user.role === 'admin') return ['*'];
    
    // Check if permissions are on user object
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    
    return [];
  };

  // Check if user has a specific permission
  const hasPermission = (permissionName: string): boolean => {
    const permissions = getPermissions();
    
    // Admin has all permissions
    if (permissions.includes('*')) return true;
    
    return permissions.includes(permissionName);
  };

  // Check if user has any of the given permissions
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    const permissions = getPermissions();
    
    if (permissions.includes('*')) return true;
    
    return permissionNames.some(name => permissions.includes(name));
  };

  // Get user's role name from API (not just department)
  const getRoleName = (): string => {
    if (!user) return '';
    
    // Try to get role name from user object
    if ('roleName' in user && typeof user.roleName === 'string') {
      return user.roleName;
    }
    
    // Fallback to department or role
    return user.department || user.role.toUpperCase();
  };

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    getPermissions,
    
    // User info
    userId: user?._id,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    userRole: user?.role,
    roleName: getRoleName(), // Use this in UI instead of department
    accessLevel: user?.accessLevel,
    department: user?.department,
    
    // Full user data
    user,
  };
};