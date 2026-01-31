import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Shield, Users, Edit, Trash2, User, X, Save } from 'lucide-react';
import { useRoles } from '../../contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import NoAccessPage from '@/components/NoAccessPage';
import { apiService } from '@/services/apiService';
import { Role, Permission, RoleUser, CreateRoleData, UpdateRoleData } from '@/types';

const RolesPage = () => {
  console.log('🔄 RolesPage rendering...');
  
  const { 
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
    error,
    clearError 
  } = useRoles();
  
  console.log('📊 Roles data:', { 
    rolesCount: roles.length, 
    permissionsCount: permissions.length, 
    userRolesCount: userRoles.length,
    isLoading,
    roles,
    permissions,
    userRoles
  });
  
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
 const { hasPermission, isAdmin } = useUserPermissions();
  
  console.log('👤 Auth data:', { isAuthenticated, authInitialized, isAdmin, userName: user?.fullName });
    
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  type EditableRole = Omit<Role, 'permissions'> & { permissions: (Permission | string)[] };
  const [selectedRole, setSelectedRole] = useState<EditableRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<RoleUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Simple toast replacement - use alert for now
  const showToast = useCallback((title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    if (variant === 'destructive') {
      alert(`❌ ${title}\n${description}`);
    } else {
      alert(`✅ ${title}\n${description}`);
    }
  }, []);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [roleAssignment, setRoleAssignment] = useState({
    userId: '',
    roleId: ''
  });

  // Check if user can access role management - Updated permission names
  const canAccessRoleManagement = useCallback(() => {
    return isAdmin || hasPermission('view_roles') || hasPermission('manage_roles');
  }, [isAdmin, hasPermission]);

  // Check specific permissions for role operations - Updated to match your API permissions
  const canCreateRole = useCallback(() => isAdmin || hasPermission('create_roles'), [isAdmin, hasPermission]);
  const canEditRole = useCallback(() => isAdmin || hasPermission('update_roles'), [isAdmin, hasPermission]);
  const canDeleteRole = useCallback(() => isAdmin || hasPermission('delete_roles'), [isAdmin, hasPermission]);
  const canAssignRole = useCallback(() => isAdmin || hasPermission('assign_roles'), [isAdmin, hasPermission]);
  const canRemoveRole = useCallback(() => isAdmin || hasPermission('update_roles'), [isAdmin, hasPermission]); // Use update_roles for removing

  // Fetch all users from the API using the service
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !canAccessRoleManagement()) {
      return;
    }

    setIsLoadingUsers(true);
    try {
      const usersData = await apiService.roles.getUsers();
      setAllUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setPageError(errorMessage);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, canAccessRoleManagement]);

  // Effect for fetching users
  useEffect(() => {
    if (authInitialized && isAuthenticated && canAccessRoleManagement()) {
      fetchUsers();
    }
  }, [authInitialized, isAuthenticated, canAccessRoleManagement, fetchUsers]);

  // Effect for clearing errors
  useEffect(() => {
    if ((!isCreateDialogOpen && !isEditDialogOpen && !isAssignDialogOpen) && error) {
      clearError();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, isAssignDialogOpen, error, clearError]);

  // Effect for showing errors
  useEffect(() => {
    if (error) {
      showToast("Error", error, "destructive");
    }
  }, [error, showToast]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔄 RolesPage state updated:', {
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      userRolesCount: userRoles.length,
      allUsersCount: allUsers.length,
      isLoading
    });
  }, [roles, permissions, userRoles, allUsers, isLoading]);

  // Auth initialization check - FIRST GUARD
  if (!authInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Authentication guard - SECOND GUARD
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Please log in to access role management.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // Permission guard - THIRD GUARD - Updated to view_roles
 if (!hasPermission('view_roles') && !isAdmin) {
  return <NoAccessPage 
    message="You don't have permission to manage roles."
    title="Access Denied - Role Management"
  />;
}

  // Show loading state while data is being fetched
  if (isLoading && roles.length === 0 && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4">Loading role data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load roles and permissions.</p>
        </div>
      </div>
    );
  }

  // Page error state
  if (pageError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error Loading Data</p>
          <p className="text-sm text-gray-500">{pageError}</p>
          <Button 
            onClick={() => {setPageError(null); fetchUsers();}} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async () => {
    if (!canCreateRole()) {
      showToast("Access Denied", "You don't have permission to create roles", "destructive");
      return;
    }

    // Validation
    if (!newRole.name.trim()) {
      showToast("Validation Error", "Role name is required", "destructive");
      return;
    }

    try {
      // Convert permission IDs to Permission objects as expected by the context
      const permissionsToSend = newRole.permissions.map(permId => {
        const perm = permissions.find(p => p._id === permId);
        if (!perm) {
          throw new Error(`Permission with ID ${permId} not found`);
        }
        return {
          _id: perm._id,
          name: perm.name,
          description: perm.description
        };
      });

      const roleData: CreateRoleData = {
        name: newRole.name,
        description: newRole.description,
        permissions: permissionsToSend
      };

      await createRole(roleData);
      
      showToast("Success", "Role created successfully");
      
      setNewRole({ name: '', description: '', permissions: [] });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Create role error:', err);
      // Error is handled in the context
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    if (!canEditRole()) {
      showToast("Access Denied", "You don't have permission to edit roles", "destructive");
      return;
    }

    // Validation
    if (!selectedRole.name.trim()) {
      showToast("Validation Error", "Role name is required", "destructive");
      return;
    }
    
    try {
      // Convert permission IDs to Permission objects
      const permissionsToSend = selectedRole.permissions.map(perm => {
        if (typeof perm === 'string') {
          const foundPerm = permissions.find(p => p._id === perm);
          if (!foundPerm) {
            throw new Error(`Permission with ID ${perm} not found`);
          }
          return foundPerm;
        }
        return perm;
      });

      const roleData: UpdateRoleData = {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: permissionsToSend
      };

      await updateRole(selectedRole._id, roleData);
      
      showToast("Success", "Role updated successfully");
      
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    } catch (err) {
      console.error('Update role error:', err);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!canDeleteRole()) {
      showToast("Access Denied", "You don't have permission to delete roles", "destructive");
      return;
    }

    // Prevent deleting admin role
    if (roleName.toLowerCase() === 'admin') {
      showToast("Cannot Delete", "The Admin role cannot be deleted", "destructive");
      return;
    }

    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await deleteRole(roleId);
        showToast("Success", "Role deleted successfully");
      } catch (err) {
        console.error('Delete role error:', err);
      }
    }
  };

  const handleAssignRole = async () => {
    if (!roleAssignment.userId || !roleAssignment.roleId) {
      showToast("Validation Error", "Please select both user and role", "destructive");
      return;
    }

    if (!canAssignRole()) {
      showToast("Access Denied", "You don't have permission to assign roles", "destructive");
      return;
    }

    try {
      await assignRole(roleAssignment.userId, roleAssignment.roleId, user?._id || 'admin');
      
      showToast("Success", "Role assigned successfully");
      
      setRoleAssignment({ userId: '', roleId: '' });
      setIsAssignDialogOpen(false);
    } catch (err) {
      console.error('Assign role error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!canRemoveRole()) {
      showToast("Access Denied", "You don't have permission to remove role assignments", "destructive");
      return;
    }

    if (window.confirm('Are you sure you want to remove this role assignment?')) {
      try {
        await removeRole(userId, roleId);
        showToast("Success", "Role assignment removed successfully");
      } catch (err) {
        console.error('Remove role error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
        showToast("Error", errorMessage, "destructive");
      }
    }
  };

  const handlePermissionToggle = (permissionId: string, isEditing = false) => {
    if (isEditing && selectedRole) {
      setSelectedRole(prev => {
        if (!prev) return prev;
        
        // Get permission IDs as strings
        const currentPermIds = prev.permissions.map(p => 
          typeof p === 'string' ? p : p._id
        );
        
        const updatedPermIds = currentPermIds.includes(permissionId)
          ? currentPermIds.filter(id => id !== permissionId)
          : [...currentPermIds, permissionId];
        
        return {
          ...prev,
          permissions: updatedPermIds
        };
      });
    } else {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(id => id !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    }
  };

  const openEditDialog = (role: Role) => {
    if (!canEditRole()) {
      showToast("Access Denied", "You don't have permission to edit roles", "destructive");
      return;
    }
    
    // Convert permissions to string IDs for editing
    const permissionIds = role.permissions.map(p => p._id);
    
    setSelectedRole({ 
      ...role,
      permissions: permissionIds as (string | Permission)[]
    });
    setIsEditDialogOpen(true);
  };

  // Get users with their assigned roles
  const getUserWithRoles = (userId: string) => {
    const userRolesForUser = getUserRoles(userId);
    const userObj = allUsers.find(u => u._id === userId);
    return {
      user: userObj,
      roles: userRolesForUser
    };
  };

  // Unique users with roles
 const userRolesArray = Array.isArray(userRoles) ? userRoles : [];
const uniqueUserIds = [...new Set(userRolesArray.filter(ur => ur && ur.userId).map(ur => ur.userId))];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-2">Create and manage user roles and permissions.</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Data: {roles.length} roles, {permissions.length} permissions, {userRoles.length} assignments
          </p>
        </div>
        <div className="flex gap-2">
          {canAssignRole() && (
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role to User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user">Select User</Label>
                    <select
                      id="user"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={roleAssignment.userId}
                      onChange={(e) => setRoleAssignment(prev => ({ ...prev, userId: e.target.value }))}
                      disabled={isLoadingUsers}
                    >
                      <option value="">Select a user</option>
                      {allUsers.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.fullName} ({user.email}) {user.staffId ? `- ${user.staffId}` : ''}
                        </option>
                      ))}
                    </select>
                    {isLoadingUsers && <p className="text-xs text-gray-500 mt-1">Loading users...</p>}
                  </div>
                  <div>
                    <Label htmlFor="role">Select Role</Label>
                    <select
                      id="role"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={roleAssignment.roleId}
                      onChange={(e) => setRoleAssignment(prev => ({ ...prev, roleId: e.target.value }))}
                      disabled={roles.length === 0}
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {roles.length === 0 && <p className="text-xs text-gray-500 mt-1">No roles available</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignRole} 
                    disabled={isLoading || !roleAssignment.userId || !roleAssignment.roleId}
                  >
                    {isLoading ? "Assigning..." : "Assign Role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canCreateRole() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roleName">Role Name *</Label>
                    <Input
                      id="roleName"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      placeholder="Enter role name (e.g., Manager, Accountant)"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Textarea
                      id="roleDescription"
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      placeholder="Enter role description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Permissions ({newRole.permissions.length} selected)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto p-2 border rounded-md">
                      {permissions.length === 0 ? (
                        <p className="text-sm text-gray-500 col-span-2">No permissions available</p>
                      ) : (
                        permissions.map(permission => (
                          <div key={permission._id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`perm-${permission._id}`}
                              checked={newRole.permissions.includes(permission._id)}
                              onCheckedChange={() => handlePermissionToggle(permission._id)}
                            />
                            <Label htmlFor={`perm-${permission._id}`} className="text-sm cursor-pointer flex-1">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                {permission.description && (
                                  <div className="text-gray-500 text-xs">{permission.description}</div>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateRole} 
                      disabled={!newRole.name.trim() || isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Role"}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search roles by name or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid gap-6">
        {filteredRoles.map((role) => (
          <Card key={role._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{role.name}</h3>
                      <Badge variant={role.name === 'Admin' ? 'default' : 'secondary'}>
                        {role.permissions.length} permissions
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{role.description || 'No description provided'}</p>
                    <p className="text-sm text-gray-500">
                      Created {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                    
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {canEditRole() && (
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(role)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {canDeleteRole() && role.name.toLowerCase() !== 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteRole(role._id, role.name)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRoles.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No roles found' : 'No roles available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first role'}
              </p>
              {canCreateRole() && !searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRoleName">Role Name *</Label>
                <Input
                  id="editRoleName"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={selectedRole.description || ''}
                  onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissions ({selectedRole.permissions.length} selected)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto p-2 border rounded-md">
                  {permissions.map(permission => (
                    <div key={permission._id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-perm-${permission._id}`}
                        checked={selectedRole.permissions.includes(permission._id)}
                        onCheckedChange={() => handlePermissionToggle(permission._id, true)}
                      />
                      <Label htmlFor={`edit-perm-${permission._id}`} className="text-sm cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-gray-500 text-xs">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateRole} 
                  disabled={!selectedRole.name.trim() || isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPage;