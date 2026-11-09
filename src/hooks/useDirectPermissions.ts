import { useAuth } from '@/contexts/AuthContext';

/**
 * Permission checks for the signed-in user. Permissions come from the role
 * returned by `GET /api/users/me`; admins have every permission.
 */
export const useDirectPermissions = () => {
  const { user, isAdmin, hasPermission, hasAnyPermission } = useAuth();

  const getPermissions = (): string[] => {
    if (!user) return [];
    return isAdmin ? ['*'] : user.permissions;
  };

  return {
    hasPermission,
    hasAnyPermission,
    getPermissions,

    userId: user?._id,
    isAdmin,
    isStaff: user?.role === 'staff',
    userRole: user?.role,
    /** Assigned role name, falling back to department / account role. */
    roleName: user?.roleName || user?.department || user?.role?.toUpperCase() || '',
    accessLevel: user?.accessLevel,
    department: user?.department,

    user,
  };
};
