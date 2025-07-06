
import { useAuth } from '../contexts/AuthContext';
import { useRoles } from '../contexts/RoleContext';

interface PermissionGuardProps {
  permission?: string;
  resource?: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  resource, 
  action, 
  children, 
  fallback = null 
}) => {
  const { user, canAccess, hasPermission } = useAuth();
  const { getUserRoles } = useRoles();

  if (!user) {
    return <>{fallback}</>;
  }

  // Admin users have access to everything
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // Check specific permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check resource and action
  if (resource && action && !canAccess(resource, action)) {
    return <>{fallback}</>;
  }

  // Check user roles and permissions
  const userRoles = getUserRoles(user.id);
  if (userRoles.length === 0) {
    return <>{fallback}</>;
  }

  // If we have roles, check if any role has the required permission
  if (permission || (resource && action)) {
    const requiredPermission = permission || `${action}_${resource}`;
    const hasRequiredPermission = userRoles.some(role => 
      role.permissions.some(p => p.name === requiredPermission)
    );
    
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;
