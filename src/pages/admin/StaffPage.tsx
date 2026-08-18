import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, User as UserIcon, MoreHorizontal, UserCheck,
  Power, PowerOff, SlidersHorizontal, Loader2, Edit, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStaff } from '@/hooks/useStaff';
import type { Staff, CreateStaffData, UpdateStaffData } from '../../types';
import NoAccessPage from '@/components/NoAccessPage';

const StaffPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    roles,
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    searchStaff,
    getSummaryStats,
    handleAssignRole,
    getUserRoles,
  } = useStaff();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    email: '', firstName: '', lastName: '', staffId: '', accessLevel: '',
    phoneNumber: '', department: '', designation: '', password: ''
  });
  
  const [editStaff, setEditStaff] = useState({
    email: '', firstName: '', lastName: '', staffId: '', accessLevel: '',
    phoneNumber: '', department: '', designation: ''
  });
  
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

  if (!hasPermission('view_users')) {
    return <NoAccessPage message="You don't have permission to view staff." title="Access Denied - Staff Management" />;
  }

  const filteredStaff = searchStaff(searchTerm);
  const summaryStats = getSummaryStats();

  const handleCreateStaff = async () => {
    if (!hasPermission('create_users') && !isAdmin) {
      alert('You do not have permission to create staff members');
      return;
    }

    if (!newStaff.email || !newStaff.firstName || !newStaff.lastName || 
        !newStaff.staffId || !newStaff.accessLevel || !newStaff.phoneNumber || !newStaff.password) {
      alert('Please fill in all required fields');
      return;
    }

    const staffData: CreateStaffData = {
      email: newStaff.email,
      firstName: newStaff.firstName,
      lastName: newStaff.lastName,
      staffId: newStaff.staffId,
      accessLevel: `level ${newStaff.accessLevel}`,
      phoneNumber: newStaff.phoneNumber,
      department: newStaff.department,
      designation: newStaff.designation,
      password: newStaff.password,
      createdBy: user?._id,
      role: 'staff',
      isActive: true,
      fullName: `${newStaff.firstName} ${newStaff.lastName}`
    };

    const result = await createStaff(staffData);
    if (result.success) {
      setNewStaff({ email: '', firstName: '', lastName: '', staffId: '', accessLevel: '', phoneNumber: '', department: '', designation: '', password: '' });
      setIsCreateOpen(false);
      alert('Staff created successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;

    const staffData: UpdateStaffData = {
      email: editStaff.email,
      firstName: editStaff.firstName,
      lastName: editStaff.lastName,
      staffId: editStaff.staffId,
      accessLevel: `level ${editStaff.accessLevel}`,
      phoneNumber: editStaff.phoneNumber,
      department: editStaff.department,
      designation: editStaff.designation,
      fullName: `${editStaff.firstName} ${editStaff.lastName}`
    };

    const result = await updateStaff(selectedStaff._id, staffData);
    if (result.success) {
      setSelectedStaff(null);
      setIsEditOpen(false);
      alert('Staff updated successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) return;

    const result = await toggleStaffStatus(staffId, currentStatus);
    if (result.success) {
      alert(`Staff ${action}d successfully!`);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) return;

    const result = await deleteStaff(staffId);
    if (result.success) {
      alert('Staff deleted successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const openEditDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    const accessLevelMatch = staffMember.accessLevel?.match(/level (\d+)/i);
    const accessLevelValue = accessLevelMatch ? accessLevelMatch[1] : '1';
    
    setEditStaff({
      email: staffMember.email,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      staffId: staffMember.staffId,
      accessLevel: accessLevelValue,
      phoneNumber: staffMember.phoneNumber,
      department: staffMember.department,
      designation: staffMember.designation
    });
    setIsEditOpen(true);
  };

  const handleAssignRoleClick = async () => {
    if (!roleAssignment.staffId || !roleAssignment.roleId) {
      alert('Please select both staff member and role');
      return;
    }

    const result = await handleAssignRole(roleAssignment.staffId, roleAssignment.roleId);
    if (result.success) {
      setRoleAssignment({ staffId: '', roleId: '' });
      setIsAssignRoleOpen(false);
      alert('Role assigned successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const statCards = [
    { label: 'Total Staff', value: summaryStats.totalStaff, icon: UserIcon },
    { label: 'Active', value: summaryStats.activeStaff, icon: UserCheck },
    { label: 'Departments', value: summaryStats.departments, icon: Search },
    { label: 'Role Assignments', value: summaryStats.totalRoleAssignments, icon: UserCheck },
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
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        <div className="flex gap-2">
          {(isAdmin || hasPermission('assign_roles')) && (
            <Button variant="outline" size="sm" onClick={() => setIsAssignRoleOpen(true)}>
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
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
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <UserIcon className="size-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.fullName}</div>
                        <div className="text-xs text-muted-foreground">{member.phoneNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{member.email}</TableCell>
                  <TableCell className="text-sm">{member.staffId}</TableCell>
                  <TableCell className="text-sm">{member.department}</TableCell>
                  <TableCell className="text-sm">{member.designation}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{member.accessLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        member.isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
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
                        {(isAdmin || hasPermission('update_users')) && (
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {(isAdmin || hasPermission('update_users')) && (
                          <DropdownMenuItem onClick={() => handleToggleStatus(member._id, member.isActive)}>
                            {member.isActive ? (
                              <PowerOff className="mr-2 size-4 text-orange-500" />
                            ) : (
                              <Power className="mr-2 size-4 text-green-500" />
                            )}
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        )}
                        {(isAdmin || hasPermission('delete_users')) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteStaff(member._id, member.fullName)}
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
              ))}
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
              <Select value={roleAssignment.staffId} onValueChange={(value) => setRoleAssignment({...roleAssignment, staffId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.fullName} - {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Role</Label>
              <Select value={roleAssignment.roleId} onValueChange={(value) => setRoleAssignment({...roleAssignment, roleId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose role" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roles) && roles.length > 0 ? (
                    roles.map(role => (
                      <SelectItem key={role._id} value={role._id}>{role.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>Loading roles...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignRoleClick} className="w-full">
              Assign Role
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
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                placeholder="Enter staff email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staffFirstName">First Name *</Label>
                <Input
                  id="staffFirstName"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff({...newStaff, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="staffLastName">Last Name *</Label>
                <Input
                  id="staffLastName"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff({...newStaff, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="staffId">Staff ID *</Label>
              <Input
                id="staffId"
                value={newStaff.staffId}
                onChange={(e) => setNewStaff({...newStaff, staffId: e.target.value})}
                placeholder="Enter staff ID"
              />
            </div>

            <div>
              <Label htmlFor="accessLevel">Access Level *</Label>
              <Select value={newStaff.accessLevel} onValueChange={(value) => setNewStaff({...newStaff, accessLevel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={newStaff.phoneNumber}
                onChange={(e) => setNewStaff({...newStaff, phoneNumber: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="staffDepartment">Department</Label>
              <Select value={newStaff.department} onValueChange={(value) => setNewStaff({...newStaff, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Risk Officer">Risk Officer</SelectItem>
                  <SelectItem value="Internal Control">Internal Control</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Customer Service">Customer Service</SelectItem>
                  <SelectItem value="Loans">Credits</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="staffPosition">Position/Designation</Label>
              <Input
                id="staffPosition"
                value={newStaff.designation}
                onChange={(e) => setNewStaff({...newStaff, designation: e.target.value})}
                placeholder="Enter position/designation"
              />
            </div>

            <div>
              <Label htmlFor="staffPassword">Temporary Password *</Label>
              <Input
                id="staffPassword"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                placeholder="Enter temporary password"
              />
            </div>

            <Button onClick={handleCreateStaff} className="w-full">
              Create Staff Account
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
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editStaff.email}
                onChange={(e) => setEditStaff({...editStaff, email: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editStaff.firstName}
                  onChange={(e) => setEditStaff({...editStaff, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editStaff.lastName}
                  onChange={(e) => setEditStaff({...editStaff, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editStaffId">Staff ID *</Label>
              <Input
                id="editStaffId"
                value={editStaff.staffId}
                onChange={(e) => setEditStaff({...editStaff, staffId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="editAccessLevel">Access Level *</Label>
              <Select value={editStaff.accessLevel} onValueChange={(value) => setEditStaff({...editStaff, accessLevel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editPhoneNumber">Phone Number *</Label>
              <Input
                id="editPhoneNumber"
                type="tel"
                value={editStaff.phoneNumber}
                onChange={(e) => setEditStaff({...editStaff, phoneNumber: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Select value={editStaff.department} onValueChange={(value) => setEditStaff({...editStaff, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Risk Officer">Risk Officer</SelectItem>
                  <SelectItem value="Internal Control">Internal Control</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Customer Service">Customer Service</SelectItem>
                  <SelectItem value="Loans">Credits</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editPosition">Position/Designation</Label>
              <Input
                id="editPosition"
                value={editStaff.designation}
                onChange={(e) => setEditStaff({...editStaff, designation: e.target.value})}
              />
            </div>

            <Button onClick={handleEditStaff} className="w-full">
              Update Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;