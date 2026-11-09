import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, Shield, MoreHorizontal,
  Save, Loader2, AlertCircle, Edit, Trash2, UserCheck, KeyRound, RefreshCw,
} from 'lucide-react';

const PERMISSION_ACTIONS: PermissionAction[] = [
  'view', 'read', 'create', 'update', 'edit', 'delete', 'approve', 'reject', 'freeze', 'verify', 'blacklist',
];
const emptyPermission = { name: '', description: '', resource: '', action: 'view' as PermissionAction };
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NoAccessPage from '@/components/NoAccessPage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  getErrorMessage,
  useAssignRole,
  useCreatePermission,
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useSyncAdminPermissions,
  useUnassignRole,
  useUpdateRole,
  useUsers,
  type Permission,
  type PermissionAction,
  type Role,
  type UserWithRoles,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const userName = (u: UserWithRoles) => u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Unknown User';

/** Editable copy of a role in the dialogs. */
interface RoleDraft {
  name: string;
  description: string;
  permissionIds: string[];
}

const emptyDraft: RoleDraft = { name: '', description: '', permissionIds: [] };

const RolesPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();
  const canAccess = isAdmin || hasPermission('view_roles') || hasPermission('manage_roles');
  const canCreateRole = isAdmin || hasPermission('create_roles');
  const canEditRole = isAdmin || hasPermission('update_roles');
  const canDeleteRole = isAdmin || hasPermission('delete_roles');
  const canAssignRole = isAdmin || hasPermission('assign_roles');

  const enabled = isAuthenticated && canAccess;
  const rolesQuery = useRoles({ enabled });
  const permissionsQuery = usePermissions({ enabled });
  const usersQuery = useUsers({ enabled });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignRole = useAssignRole();
  const unassignRole = useUnassignRole();
  const createPermission = useCreatePermission();
  const syncAdmin = useSyncAdminPermissions();
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState(emptyPermission);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<RoleDraft>(emptyDraft);
  const [editRole, setEditRole] = useState<RoleDraft>(emptyDraft);
  const [roleAssignment, setRoleAssignment] = useState({ userId: '', roleId: '' });

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

  if (!canAccess) {
    return <NoAccessPage message="You don't have permission to manage roles." title="Access Denied - Role Management" />;
  }

  const roles = rolesQuery.data ?? [];
  const permissions = (permissionsQuery.data ?? []).filter((p): p is Permission & { _id: string } => !!p._id);
  const users = usersQuery.data ?? [];

  if (rolesQuery.isLoading || permissionsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const loadError = rolesQuery.error || permissionsQuery.error;
  if (loadError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-destructive" />
          <p className="mb-1 text-sm font-medium text-destructive">Error Loading Data</p>
          <p className="mb-4 text-sm text-muted-foreground">{getErrorMessage(loadError)}</p>
          <Button size="sm" variant="outline" onClick={() => { rolesQuery.refetch(); permissionsQuery.refetch(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const search = searchTerm.toLowerCase();
  const filteredRoles = roles.filter(
    (role) => role.name?.toLowerCase().includes(search) || role.description?.toLowerCase().includes(search),
  );

  // A user has at most one role; `GET /users/all` includes it.
  const assignedUsers = users.filter((u) => u.roles?.length);
  const usersWithRole = (roleId?: string) => assignedUsers.filter((u) => u.roles?.some((r) => r.roleId === roleId));

  const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const fail = (title: string, err: unknown) => toast({ title, description: getErrorMessage(err), variant: 'destructive' });

  const openEditDialog = (role: Role) => {
    setEditingRoleId(role._id ?? null);
    setEditRole({
      name: role.name ?? '',
      description: role.description ?? '',
      permissionIds: (role.permissions ?? []).map((p) => p._id).filter((id): id is string => !!id),
    });
    setIsEditDialogOpen(true);
  };

  const onCreateRole = async () => {
    try {
      await createRole.mutateAsync({
        name: newRole.name.trim(),
        description: newRole.description,
        permissions: newRole.permissionIds,
      });
      toast({ title: 'Success', description: 'Role created successfully' });
      setNewRole(emptyDraft);
      setIsCreateDialogOpen(false);
    } catch (err) {
      fail('Error Creating Role', err);
    }
  };

  const onUpdateRole = async () => {
    if (!editingRoleId) return;
    try {
      await updateRole.mutateAsync({
        id: editingRoleId,
        data: { name: editRole.name.trim(), description: editRole.description, permissions: editRole.permissionIds },
      });
      toast({ title: 'Success', description: 'Role updated successfully' });
      setIsEditDialogOpen(false);
      setEditingRoleId(null);
    } catch (err) {
      fail('Error Updating Role', err);
    }
  };

  const onDeleteRole = async () => {
    if (!roleToDelete?._id) return;
    try {
      await deleteRole.mutateAsync(roleToDelete._id);
      toast({ title: 'Success', description: `Role "${roleToDelete.name}" deleted` });
      setRoleToDelete(null);
    } catch (err) {
      fail('Error Deleting Role', err);
    }
  };

  const onAssignRole = async () => {
    try {
      await assignRole.mutateAsync(roleAssignment);
      toast({ title: 'Success', description: 'Role assigned successfully' });
      setRoleAssignment({ userId: '', roleId: '' });
      setIsAssignDialogOpen(false);
    } catch (err) {
      fail('Error Assigning Role', err);
    }
  };

  /** Admin only. The new permission is also added to the Admin role. */
  const onCreatePermission = async () => {
    const name = newPermission.name.trim();
    const resource = newPermission.resource.trim();
    if (!name || !resource) {
      toast({ title: 'Missing fields', description: 'Name and resource are required.', variant: 'destructive' });
      return;
    }
    try {
      await createPermission.mutateAsync({ ...newPermission, name, resource, description: newPermission.description || undefined });
      toast({ title: 'Permission created', description: `"${name}" was added and granted to the Admin role.` });
      setNewPermission(emptyPermission);
      setIsPermissionDialogOpen(false);
    } catch (err) {
      fail('Error Creating Permission', err);
    }
  };

  /** Admin only. Gives the Admin role any permission it is missing. */
  const onSyncAdmin = async () => {
    try {
      const result = await syncAdmin.mutateAsync();
      const added = result.addedPermissions?.length ?? 0;
      toast({
        title: 'Admin role synced',
        description: added
          ? `Added ${added} permission(s): ${result.addedPermissions!.join(', ')}. Total: ${result.totalPermissions ?? '—'}.`
          : `The Admin role already has every permission (${result.totalPermissions ?? permissions.length}).`,
      });
    } catch (err) {
      fail('Error Syncing Admin Role', err);
    }
  };

  const onRemoveRole = async (u: UserWithRoles, roleId?: string, roleName?: string) => {
    if (!u._id || !roleId) return;
    if (!window.confirm(`Remove the ${roleName || 'role'} role from ${userName(u)}?`)) return;
    try {
      await unassignRole.mutateAsync({ userId: u._id, roleId });
      toast({ title: 'Success', description: 'Role assignment removed successfully' });
    } catch (err) {
      fail('Error Removing Role', err);
    }
  };

  const permissionChecklist = (draft: RoleDraft, setDraft: (d: RoleDraft) => void, idPrefix: string) => (
    <div className="mt-2 grid max-h-64 grid-cols-1 gap-4 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
      {permissions.length === 0 ? (
        <p className="col-span-2 text-sm text-muted-foreground">No permissions available</p>
      ) : (
        permissions.map((permission) => (
          <div key={permission._id} className="flex items-start space-x-2">
            <Checkbox
              id={`${idPrefix}-${permission._id}`}
              checked={draft.permissionIds.includes(permission._id)}
              onCheckedChange={() => setDraft({ ...draft, permissionIds: toggle(draft.permissionIds, permission._id) })}
            />
            <Label htmlFor={`${idPrefix}-${permission._id}`} className="flex-1 cursor-pointer text-sm">
              <div>
                <div className="font-medium">{permission.name}</div>
                {permission.description && <div className="text-xs text-muted-foreground">{permission.description}</div>}
              </div>
            </Label>
          </div>
        ))
      )}
    </div>
  );

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
            Logged in as: {user?.fullName} ({user?.roleName || user?.role}){user?.department ? ` - ${user.department}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={onSyncAdmin} disabled={syncAdmin.isPending}>
                <RefreshCw className={`mr-2 size-4 ${syncAdmin.isPending ? 'animate-spin' : ''}`} />
                Sync Admin Role
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsPermissionDialogOpen(true)}>
                <KeyRound className="mr-2 size-4" />
                New Permission
              </Button>
            </>
          )}
          {canAssignRole && (
            <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(true)}>
              <UserCheck className="mr-2 size-4" />
              Assign Role
            </Button>
          )}
          {canCreateRole && (
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
          {filteredRoles.map((role) => {
            const members = usersWithRole(role._id);
            const isAdminRole = role.name?.toLowerCase() === 'admin';
            return (
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
                            {role.permissions?.length ?? 0} permissions
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {role.description || 'No description provided'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Created {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {members.map((m) => (
                            <Badge key={m._id} variant="outline" className="text-xs font-normal">
                              {userName(m)}
                            </Badge>
                          ))}
                          {members.length === 0 && <span className="text-xs text-muted-foreground">No users assigned</span>}
                        </div>
                      </div>
                    </div>

                    {(canEditRole || (canDeleteRole && !isAdminRole)) && (
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
                          {canEditRole && (
                            <DropdownMenuItem onClick={() => openEditDialog(role)}>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteRole && !isAdminRole && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setRoleToDelete(role)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* User Role Assignments */}
      {assignedUsers.length > 0 && (
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
                {assignedUsers.map((u) => (
                  <TableRow key={u._id} className="group">
                    <TableCell className="text-sm font-medium">{userName(u)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.staffId || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <Badge key={r.roleId} variant="outline" className="text-xs font-normal">{r.roleName}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canAssignRole && (
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
                            {u.roles?.map((r) => (
                              <DropdownMenuItem
                                key={r.roleId}
                                onClick={() => onRemoveRole(u, r.roleId, r.roleName)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Remove {r.roleName || 'Role'}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
                onChange={(e) => setRoleAssignment((prev) => ({ ...prev, userId: e.target.value }))}
                disabled={usersQuery.isLoading}
              >
                <option value="">{usersQuery.isLoading ? 'Loading users...' : 'Select a user'}</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {userName(u)} ({u.email}){u.roles?.[0]?.roleName ? ` — currently ${u.roles[0].roleName}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Role</Label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={roleAssignment.roleId}
                onChange={(e) => setRoleAssignment((prev) => ({ ...prev, roleId: e.target.value }))}
                disabled={roles.length === 0}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">A user has one role; assigning replaces any current role.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={onAssignRole} disabled={assignRole.isPending || !roleAssignment.userId || !roleAssignment.roleId}>
              {assignRole.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Permission Dialog (Admin only) */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="permName">Name *</Label>
              <Input
                id="permName"
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                placeholder="e.g., view_reports"
              />
              <p className="mt-1 text-xs text-muted-foreground">Use the action_resource style, e.g. approve_loans.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="permResource">Resource *</Label>
                <Input
                  id="permResource"
                  value={newPermission.resource}
                  onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                  placeholder="e.g., reports"
                />
              </div>
              <div>
                <Label htmlFor="permAction">Action *</Label>
                <select
                  id="permAction"
                  className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value as PermissionAction })}
                >
                  {PERMISSION_ACTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="permDescription">Description</Label>
              <Textarea
                id="permDescription"
                rows={2}
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">The new permission is granted to the Admin role automatically.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancel</Button>
            <Button onClick={onCreatePermission} disabled={createPermission.isPending}>
              {createPermission.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create Permission
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
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            <div>
              <Label>Permissions ({newRole.permissionIds.length} selected)</Label>
              {permissionChecklist(newRole, setNewRole, 'perm')}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={onCreateRole} disabled={!newRole.name.trim() || createRole.isPending}>
                {createRole.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
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
          {editingRoleId && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRoleName">Role Name *</Label>
                <Input
                  id="editRoleName"
                  value={editRole.name}
                  onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={editRole.description}
                  onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissions ({editRole.permissionIds.length} selected)</Label>
                {permissionChecklist(editRole, setEditRole, 'edit-perm')}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={onUpdateRole} disabled={!editRole.name.trim() || updateRole.isPending}>
                  {updateRole.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Update Role
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        title="Delete role?"
        description={
          roleToDelete && (
            <>
              <strong>{roleToDelete.name}</strong> will be deleted
              {usersWithRole(roleToDelete._id).length > 0
                ? `, and ${usersWithRole(roleToDelete._id).length} user(s) currently assigned to it will lose its permissions`
                : ''}
              . This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete role"
        destructive
        isPending={deleteRole.isPending}
        onConfirm={onDeleteRole}
      />
    </div>
  );
};

export default RolesPage;
