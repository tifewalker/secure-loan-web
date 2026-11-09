import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, User as UserIcon, MoreHorizontal, UserCheck, UserMinus,
  Power, PowerOff, Loader2, Edit, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getErrorMessage,
  useAssignRole,
  useCreateUser,
  useDeleteUser,
  useRoles,
  useToggleUserActivation,
  useUnassignRole,
  useUpdateUser,
  useUsers,
  type AccessLevel,
  type UserWithRoles,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import NoAccessPage from '@/components/NoAccessPage';

const DEPARTMENTS = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Risk Officer', label: 'Risk Officer' },
  { value: 'Internal Control', label: 'Internal Control' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'Loans', label: 'Credits' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'IT', label: 'IT' },
];

const ACCESS_LEVELS = ['1', '2', '3', '4', '5'];

const emptyNewStaff = {
  email: '', firstName: '', lastName: '', staffId: '', accessLevel: '',
  phoneNumber: '', department: '', designation: '', password: '',
};

const emptyEditStaff = {
  email: '', firstName: '', lastName: '', staffId: '', accessLevel: '',
  phoneNumber: '', department: '', designation: '',
};

const staffName = (s: UserWithRoles) => s.fullName || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.email || 'Staff';
/** `status` is the source of truth; older records may only have `isActive`. */
const isStaffActive = (s: UserWithRoles) => (s.status ? s.status === 'active' : !!s.isActive);
const toAccessLevel = (level: string) => `level ${level}` as AccessLevel;
const currentRole = (s: UserWithRoles) => s.roles?.[0];

const StaffPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();
  const canView = hasPermission('view_users');

  const staffQuery = useUsers({ enabled: isAuthenticated && canView });
  const rolesQuery = useRoles({ enabled: isAuthenticated && canView });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleUser = useToggleUserActivation();
  const deleteUser = useDeleteUser();
  const assignRole = useAssignRole();
  const unassignRole = useUnassignRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<UserWithRoles | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<UserWithRoles | null>(null);
  const [newStaff, setNewStaff] = useState(emptyNewStaff);
  const [editStaff, setEditStaff] = useState(emptyEditStaff);
  const [roleAssignment, setRoleAssignment] = useState({ staffId: '', roleId: '' });

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
        <p className="text-sm text-muted-foreground">Please log in to access staff management.</p>
      </div>
    );
  }

  if (!canView) {
    return <NoAccessPage message="You don't have permission to view staff." title="Access Denied - Staff Management" />;
  }

  const staff = staffQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const search = searchTerm.trim().toLowerCase();
  const filteredStaff = staff.filter(
    (s) =>
      !search ||
      [staffName(s), s.email, s.department, s.staffId, currentRole(s)?.roleName].some((v) =>
        v?.toLowerCase().includes(search),
      ),
  );

  const fail = (title: string, err: unknown) =>
    toast({ title, description: getErrorMessage(err), variant: 'destructive' });

  const handleCreateStaff = async () => {
    const required = ['email', 'firstName', 'lastName', 'staffId', 'accessLevel', 'phoneNumber', 'department', 'designation', 'password'] as const;
    if (required.some((key) => !newStaff[key])) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    try {
      const result = await createUser.mutateAsync({
        ...newStaff,
        accessLevel: toAccessLevel(newStaff.accessLevel),
        role: 'staff',
        status: 'active',
      });
      setNewStaff(emptyNewStaff);
      setIsCreateOpen(false);
      toast({ title: 'Staff created', description: result.message || `${newStaff.firstName} can now sign in.` });
    } catch (err) {
      fail('Failed to create staff', err);
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff?._id) return;
    try {
      // Email and staff ID cannot be changed through the API.
      const result = await updateUser.mutateAsync({
        id: selectedStaff._id,
        data: {
          firstName: editStaff.firstName,
          lastName: editStaff.lastName,
          phoneNumber: editStaff.phoneNumber,
          department: editStaff.department,
          designation: editStaff.designation,
          accessLevel: toAccessLevel(editStaff.accessLevel),
        },
      });
      setSelectedStaff(null);
      setIsEditOpen(false);
      toast({ title: 'Staff updated', description: result.message || 'Changes saved.' });
    } catch (err) {
      fail('Failed to update staff', err);
    }
  };

  const handleToggleStatus = async (member: UserWithRoles) => {
    if (!member._id) return;
    const action = isStaffActive(member) ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${staffName(member)}?`)) return;
    try {
      await toggleUser.mutateAsync(member._id);
      toast({ title: `Staff ${action}d`, description: `${staffName(member)} was ${action}d.` });
    } catch (err) {
      fail(`Failed to ${action} staff`, err);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete?._id) return;
    try {
      await deleteUser.mutateAsync(staffToDelete._id);
      toast({ title: 'Staff deleted', description: `${staffName(staffToDelete)} was removed.` });
      setStaffToDelete(null);
    } catch (err) {
      fail('Failed to delete staff', err);
    }
  };

  const openEditDialog = (member: UserWithRoles) => {
    setSelectedStaff(member);
    setEditStaff({
      email: member.email ?? '',
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      staffId: member.staffId ?? '',
      accessLevel: member.accessLevel?.match(/level (\d+)/i)?.[1] ?? '1',
      phoneNumber: member.phoneNumber ?? '',
      department: member.department ?? '',
      designation: member.designation ?? '',
    });
    setIsEditOpen(true);
  };

  const openAssignRole = (member?: UserWithRoles) => {
    setRoleAssignment({ staffId: member?._id ?? '', roleId: member ? currentRole(member)?.roleId ?? '' : '' });
    setIsAssignRoleOpen(true);
  };

  const handleAssignRoleClick = async () => {
    if (!roleAssignment.staffId || !roleAssignment.roleId) {
      toast({ title: 'Missing selection', description: 'Please select both a staff member and a role.', variant: 'destructive' });
      return;
    }
    try {
      await assignRole.mutateAsync({ userId: roleAssignment.staffId, roleId: roleAssignment.roleId });
      setRoleAssignment({ staffId: '', roleId: '' });
      setIsAssignRoleOpen(false);
      toast({ title: 'Role assigned', description: 'Any previous role was replaced.' });
    } catch (err) {
      fail('Failed to assign role', err);
    }
  };

  const handleRemoveRole = async (member: UserWithRoles) => {
    const role = currentRole(member);
    if (!member._id || !role?.roleId) return;
    if (!window.confirm(`Remove the ${role.roleName} role from ${staffName(member)}?`)) return;
    try {
      await unassignRole.mutateAsync({ userId: member._id, roleId: role.roleId });
      toast({ title: 'Role removed', description: `${staffName(member)} no longer has the ${role.roleName} role.` });
    } catch (err) {
      fail('Failed to remove role', err);
    }
  };

  const canUpdate = isAdmin || hasPermission('update_users');
  const canAssign = isAdmin || hasPermission('assign_roles');

  const statCards = [
    { label: 'Total Staff', value: staff.length, icon: UserIcon },
    { label: 'Active', value: staff.filter(isStaffActive).length, icon: UserCheck },
    { label: 'Departments', value: new Set(staff.map((s) => s.department).filter(Boolean)).size, icon: Search },
    { label: 'Role Assignments', value: staff.filter((s) => currentRole(s)).length, icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage staff accounts and role assignments
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.roleName || user?.role}){user?.department ? ` - ${user.department}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canAssign && (
            <Button variant="outline" size="sm" onClick={() => openAssignRole()}>
              <UserCheck className="mr-2 size-4" />
              Assign Role
            </Button>
          )}
          {hasPermission('create_users') && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* Stat strip */}
      {staff.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-muted-foreground/10 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter staff..."
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredStaff.length} of {staff.length} staff
        </div>
      </div>

      {/* Error state */}
      {staffQuery.error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-destructive">{getErrorMessage(staffQuery.error, 'Failed to fetch staff')}</p>
            <Button variant="outline" size="sm" onClick={() => staffQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {staffQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <UserIcon className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No staff found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search.' : 'Add your first staff member.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => {
                const active = isStaffActive(member);
                const role = currentRole(member);
                const isSelf = member._id === user?._id;
                return (
                  <TableRow key={member._id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <UserIcon className="size-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {staffName(member)}
                            {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.phoneNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{member.email}</TableCell>
                    <TableCell className="text-sm">{member.staffId}</TableCell>
                    <TableCell className="text-sm">{member.department}</TableCell>
                    <TableCell className="text-sm">{member.designation}</TableCell>
                    <TableCell className="text-sm">
                      {role?.roleName ? (
                        <Badge variant="secondary" className="font-normal">{role.roleName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{member.role === 'admin' ? 'Admin' : 'No role'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{member.accessLevel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          active
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }
                      >
                        {active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canUpdate && !isSelf && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                              {active ? (
                                <PowerOff className="mr-2 size-4 text-orange-500" />
                              ) : (
                                <Power className="mr-2 size-4 text-green-500" />
                              )}
                              {active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          )}
                          {canAssign && (
                            <DropdownMenuItem onClick={() => openAssignRole(member)}>
                              <UserCheck className="mr-2 size-4" />
                              {role ? 'Change Role' : 'Assign Role'}
                            </DropdownMenuItem>
                          )}
                          {canAssign && role && (
                            <DropdownMenuItem onClick={() => handleRemoveRole(member)}>
                              <UserMinus className="mr-2 size-4" />
                              Remove Role
                            </DropdownMenuItem>
                          )}
                          {(isAdmin || hasPermission('delete_users')) && !isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setStaffToDelete(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Staff Member</Label>
              <Select value={roleAssignment.staffId} onValueChange={(value) => setRoleAssignment({ ...roleAssignment, staffId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter((s) => s._id).map((s) => (
                    <SelectItem key={s._id} value={s._id!}>
                      {staffName(s)} - {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Role</Label>
              <Select value={roleAssignment.roleId} onValueChange={(value) => setRoleAssignment({ ...roleAssignment, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={rolesQuery.isLoading ? 'Loading roles...' : 'Choose role'} />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter((r) => r._id).map((role) => (
                    <SelectItem key={role._id} value={role._id!}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">A staff member has one role; assigning replaces any current role.</p>
            </div>
            <Button onClick={handleAssignRoleClick} className="w-full" disabled={assignRole.isPending}>
              {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Staff Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staffEmail">Email *</Label>
              <Input
                id="staffEmail"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="Enter staff email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staffFirstName">First Name *</Label>
                <Input
                  id="staffFirstName"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="staffLastName">Last Name *</Label>
                <Input
                  id="staffLastName"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="staffId">Staff ID *</Label>
              <Input
                id="staffId"
                value={newStaff.staffId}
                onChange={(e) => setNewStaff({ ...newStaff, staffId: e.target.value })}
                placeholder="Enter staff ID"
              />
            </div>

            <div>
              <Label htmlFor="accessLevel">Access Level *</Label>
              <Select value={newStaff.accessLevel} onValueChange={(value) => setNewStaff({ ...newStaff, accessLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>Level {level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={newStaff.phoneNumber}
                onChange={(e) => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="staffDepartment">Department *</Label>
              <Select value={newStaff.department} onValueChange={(value) => setNewStaff({ ...newStaff, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="staffPosition">Position/Designation *</Label>
              <Input
                id="staffPosition"
                value={newStaff.designation}
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                placeholder="Enter position/designation"
              />
            </div>

            <div>
              <Label htmlFor="staffPassword">Temporary Password *</Label>
              <Input
                id="staffPassword"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                placeholder="Enter temporary password"
              />
            </div>

            <Button onClick={handleCreateStaff} className="w-full" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create Staff Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input id="editEmail" type="email" value={editStaff.email} disabled />
              <p className="mt-1 text-xs text-muted-foreground">Email and staff ID cannot be changed.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editStaff.firstName}
                  onChange={(e) => setEditStaff({ ...editStaff, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editStaff.lastName}
                  onChange={(e) => setEditStaff({ ...editStaff, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editStaffId">Staff ID</Label>
              <Input id="editStaffId" value={editStaff.staffId} disabled />
            </div>

            <div>
              <Label htmlFor="editAccessLevel">Access Level *</Label>
              <Select value={editStaff.accessLevel} onValueChange={(value) => setEditStaff({ ...editStaff, accessLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>Level {level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editPhoneNumber">Phone Number *</Label>
              <Input
                id="editPhoneNumber"
                type="tel"
                value={editStaff.phoneNumber}
                onChange={(e) => setEditStaff({ ...editStaff, phoneNumber: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Select value={editStaff.department} onValueChange={(value) => setEditStaff({ ...editStaff, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editPosition">Position/Designation</Label>
              <Input
                id="editPosition"
                value={editStaff.designation}
                onChange={(e) => setEditStaff({ ...editStaff, designation: e.target.value })}
              />
            </div>

            <Button onClick={handleEditStaff} className="w-full" disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Updating...' : 'Update Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!staffToDelete}
        onOpenChange={(open) => !open && setStaffToDelete(null)}
        title="Delete staff member?"
        description={
          staffToDelete && (
            <>
              <strong>{staffName(staffToDelete)}</strong> and their role assignment will be permanently deleted. This
              cannot be undone.
            </>
          )
        }
        confirmLabel="Delete staff"
        destructive
        isPending={deleteUser.isPending}
        onConfirm={handleDeleteStaff}
      />
    </div>
  );
};

export default StaffPage;
