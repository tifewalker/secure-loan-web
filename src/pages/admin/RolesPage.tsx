import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, Shield, MoreHorizontal, User as UserIcon,
  Save, Loader2, AlertCircle, Edit, Trash2, UserCheck,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NoAccessPage from '@/components/NoAccessPage';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import type { Role } from '../../types';

const RolesPage = () => {
  const {
    toast,
    roles,
    permissions,
    userRoles,
    isLoading,
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
  } = useRoleManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [roleAssignment, setRoleAssignment] = useState({
    userId: '',
    roleId: ''
  });

  if (!authInitialized || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="mb-1 text-base font-medium">Authentication Required</p>
          <p className="text-sm text-muted-foreground">Please log in to access role management.</p>
        </div>
      </div>
    );
  }

  if (!canAccessRoleManagement()) {
    return <NoAccessPage message="You don't have permission to manage roles." title="Access Denied - Role Management" />;
  }

  if (isLoading && roles.length === 0 && permissions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-destructive" />
          <p className="mb-1 text-sm font-medium text-destructive">Error Loading Data</p>
          <p className="mb-4 text-sm text-muted-foreground">{pageError}</p>
          <Button size="sm" variant="outline" onClick={() => { setPageError(null); fetchUsers(); }}>
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

  const userRolesArray = Array.isArray(userRoles) ? userRoles : [];
  const uniqueUserIds = [...new Set(userRolesArray
    .filter(ur => ur && ur.userId)
    .map(ur => typeof ur.userId === 'string' ? ur.userId : ur.userId._id)
  )];

  const handlePermissionToggle = (permissionId: string, isEditing = false) => {
    if (isEditing && selectedRole) {
      setSelectedPermissionIds(prev => 
        prev.includes(permissionId) 
          ? prev.filter(id => id !== permissionId) 
          : [...prev, permissionId]
      );
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
    setSelectedRole(role);
    setSelectedPermissionIds(role.permissions.map(p => p._id));
    setIsEditDialogOpen(true);
  };

  const onCreateRole = async () => {
    const result = await handleCreateRole({
      name: newRole.name,
      description: newRole.description,
      permissionIds: newRole.permissions
    });

    if (result.success) {
      toast({ title: "Success", description: "Role created successfully" });
      setNewRole({ name: '', description: '', permissions: [] });
      setIsCreateDialogOpen(false);
    } else {
      toast({ title: "Error Creating Role", description: result.error, variant: "destructive" });
    }
  };

  const onUpdateRole = async () => {
    if (!selectedRole) return;

    const result = await handleUpdateRole(selectedRole._id, {
      name: selectedRole.name,
      description: selectedRole.description || '',
      permissionIds: selectedPermissionIds
    });

    if (result.success) {
      toast({ title: "Success", description: "Role updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    } else {
      toast({ title: "Error Updating Role", description: result.error, variant: "destructive" });
    }
  };

  const onDeleteRole = async (roleId: string, roleName: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      const result = await handleDeleteRole(roleId, roleName);
      if (result.success) {
        toast({ title: "Success", description: "Role deleted successfully" });
      } else {
        toast({ title: "Error Deleting Role", description: result.error, variant: "destructive" });
      }
    }
  };

  const onAssignRole = async () => {
    const result = await handleAssignRole(roleAssignment.userId, roleAssignment.roleId);
    if (result.success) {
      toast({ title: "Success", description: "Role assigned successfully" });
      setRoleAssignment({ userId: '', roleId: '' });
      setIsAssignDialogOpen(false);
    } else {
      toast({ title: "Error Assigning Role", description: result.error, variant: "destructive" });
    }
  };

  const onRemoveRole = async (userId: string, roleId: string) => {
    if (window.confirm('Are you sure you want to remove this role assignment?')) {
      const result = await handleRemoveRole(userId, roleId);
      if (result.success) {
        toast({ title: "Success", description: "Role assignment removed successfully" });
      } else {
        toast({ title: "Error Removing Role", description: result.error, variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage user roles and permissions
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        <div className="flex gap-2">
          {canAssignRole() && (
            <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(true)}>
              <UserCheck className="mr-2 size-4" />
              Assign Role
            </Button>
          )}
          {canCreateRole() && (
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter roles..."
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredRoles.length} of {roles.length} roles
        </div>
      </div>

      {/* Roles list */}
      {filteredRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Shield className="size-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {searchTerm ? 'No roles found' : 'No roles available'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first role.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoles.map((role) => (
            <Card key={role._id} className="group border-muted-foreground/10 shadow-none transition-colors hover:bg-accent/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-50">
                      <Shield className="size-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{role.name}</h3>
                        <Badge variant="outline" className="font-normal">
                          {role.permissions.length} permissions
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {role.description || 'No description provided'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Created {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {userRolesArray
                          .filter(ur => ur.roleId === role._id)
                          .map(ur => {
                            const assignedUser = getUserById(ur.userId);
                            return assignedUser ? (
                              <Badge key={`${ur.userId}-${ur.roleId}`} variant="outline" className="text-xs font-normal">
                                {assignedUser.fullName}
                              </Badge>
                            ) : null;
                          })}
                        {userRolesArray.filter(ur => ur.roleId === role._id).length === 0 && (
                          <span className="text-xs text-muted-foreground">No users assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {canEditRole() && (
                        <DropdownMenuItem onClick={() => openEditDialog(role)}>
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDeleteRole() && role.name.toLowerCase() !== 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteRole(role._id, role.name)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Role Assignments */}
      {uniqueUserIds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">User Role Assignments</h2>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueUserIds.map(userId => {
                  const userData = getUserById(userId);
                  const userAssignedRoles = getUserRolesByUserId(userId);
                  
                  return (
                    <TableRow key={userId} className="group">
                      <TableCell className="text-sm font-medium">{userData?.fullName || 'Unknown User'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{userData?.email || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{userData?.staffId || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userAssignedRoles.map(ur => {
                            const roleData = getRoleById(ur.roleId);
                            return roleData ? (
                              <Badge key={ur._id} variant="outline" className="text-xs font-normal">{roleData.name}</Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {canRemoveRole() && userAssignedRoles.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Remove Role</DropdownMenuLabel>
                              {userAssignedRoles.map(ur => {
                                const normalizedUserId = typeof ur.userId === 'string' ? ur.userId : ur.userId._id;
                                const normalizedRoleId = typeof ur.roleId === 'string' ? ur.roleId : ur.roleId._id;
                                const roleData = getRoleById(ur.roleId);
                                return (
                                  <DropdownMenuItem
                                    key={ur._id}
                                    onClick={() => onRemoveRole(normalizedUserId, normalizedRoleId)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Remove {roleData?.name || 'Role'}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select User</Label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={roleAssignment.userId}
                onChange={(e) => setRoleAssignment(prev => ({ ...prev, userId: e.target.value }))}
                disabled={isLoadingUsers}
              >
                <option value="">Select a user</option>
                {allUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Role</Label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={roleAssignment.roleId}
                onChange={(e) => setRoleAssignment(prev => ({ ...prev, roleId: e.target.value }))}
                disabled={roles.length === 0}
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={onAssignRole} disabled={operationLoading === 'assign' || !roleAssignment.userId || !roleAssignment.roleId}>
              {operationLoading === 'assign' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
                placeholder="Enter role name"
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
              <div className="mt-2 grid max-h-64 grid-cols-1 gap-4 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
                {permissions.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted-foreground">No permissions available</p>
                ) : (
                  permissions.map(permission => (
                    <div key={permission._id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`perm-${permission._id}`}
                        checked={newRole.permissions.includes(permission._id)}
                        onCheckedChange={() => handlePermissionToggle(permission._id)}
                      />
                      <Label htmlFor={`perm-${permission._id}`} className="flex-1 cursor-pointer text-sm">
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={onCreateRole} disabled={!newRole.name.trim() || operationLoading === 'create'}>
                {operationLoading === 'create' ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Create Role
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
                />
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={selectedRole.description || ''}
                  onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissions ({selectedPermissionIds.length} selected)</Label>
                <div className="mt-2 grid max-h-64 grid-cols-1 gap-4 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
                  {permissions.map(permission => (
                    <div key={permission._id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-perm-${permission._id}`}
                        checked={selectedPermissionIds.includes(permission._id)}
                        onCheckedChange={() => handlePermissionToggle(permission._id, true)}
                      />
                      <Label htmlFor={`edit-perm-${permission._id}`} className="flex-1 cursor-pointer text-sm">
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={onUpdateRole} disabled={!selectedRole.name.trim() || operationLoading === 'update'}>
                  {operationLoading === 'update' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Update Role
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