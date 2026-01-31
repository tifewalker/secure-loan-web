import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, User, Edit, Trash2, UserCheck, Power, PowerOff } from 'lucide-react';
import { useRoles } from '../../contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { apiService } from '@/services/apiService';
import { Staff, CreateStaffData, UpdateStaffData } from '@/types';
import NoAccessPage from '@/components/NoAccessPage';

const StaffPage = () => {
  const { roles, assignRole, removeRole, getUserRoles } = useRoles();
  
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
 const { hasPermission, isAdmin } = useUserPermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaff, setNewStaff] = useState({
    email: '',
    firstName: '',
    lastName: '',
    staffId: '',
    accessLevel: '',
    phoneNumber: '',
    department: '',
    designation: '',
    password: ''
  });
  const [editStaff, setEditStaff] = useState({
    email: '',
    firstName: '',
    lastName: '',
    staffId: '',
    accessLevel: '',
    phoneNumber: '',
    department: '',
    designation: ''
  });
  const [roleAssignment, setRoleAssignment] = useState({
    staffId: '',
    roleId: ''
  });

  // Fetch staff data using API service
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const staffData = await apiService.staff.getAll();
        setStaff(staffData);
      } catch (error) {
        console.error('Error fetching staff:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch staff';
        setError(errorMessage);
        
        // Handle session expiration
        if (errorMessage.includes('session expired') || errorMessage.includes('401') || errorMessage.includes('token')) {
          setError('Your session has expired. Please log in again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [isAuthenticated]);

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

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Please log in to access staff management.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // Permission guard - Updated to view_users
 if (!hasPermission('view_users')) {
  return <NoAccessPage 
    message="You don't have permission to view staff."
    title="Access Denied - Staff Management"
  />;
}

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4">Loading staff data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch staff information.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button 
            onClick={() => {setError(null); window.location.reload();}} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Role context error handling
  if (!Array.isArray(roles)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error loading role data</p>
          <p className="text-sm text-gray-500">Please refresh the page</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(s =>
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStaff = async () => {
    // Check permission - Updated to create_users
    if (!hasPermission('create_users') && !isAdmin) {
      alert('You do not have permission to create staff members');
      return;
    }

    try {
      // Validate required fields
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

      const newStaffMember = await apiService.staff.create(staffData);
      
      setStaff(prev => [...prev, newStaffMember]);
      setNewStaff({ 
        email: '', 
        firstName: '', 
        lastName: '', 
        staffId: '', 
        accessLevel: '', 
        phoneNumber: '',
        department: '', 
        designation: '', 
        password: '' 
      });
      setIsCreateOpen(false);
      alert('Staff created successfully!');
    } catch (error) {
      console.error('Error creating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create staff';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;

    // Check permission - Updated to update_users
    if (!hasPermission('update_users') && !isAdmin) {
      alert('You do not have permission to update staff members');
      return;
    }

    try {
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

      const updatedStaff = await apiService.staff.update(selectedStaff._id, staffData);
      
      // Update the staff in the local state
      setStaff(prev => prev.map(s => 
        s._id === selectedStaff._id ? updatedStaff : s
      ));

      setSelectedStaff(null);
      setIsEditOpen(false);
      alert('Staff updated successfully!');
    } catch (error) {
      console.error('Error updating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update staff';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    // Check permission - Updated to update_users
    if (!hasPermission('update_users') && !isAdmin) {
      alert('You do not have permission to update staff status');
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) {
      return;
    }

    try {
      await apiService.staff.toggleStatus(staffId, currentStatus);
      
      // Update the staff status in local state
      setStaff(prev => prev.map(s => 
        s._id === staffId ? { ...s, isActive: !currentStatus } : s
      ));
      alert(`Staff ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing staff:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} staff`;
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    // Check permission - Updated to delete_users
    if (!hasPermission('delete_users') && !isAdmin) {
      alert('You do not have permission to delete staff members');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.staff.delete(staffId);
      
      // Remove the staff from local state
      setStaff(prev => prev.filter(s => s._id !== staffId));
      alert('Staff deleted successfully!');
    } catch (error) {
      console.error('Error deleting staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff';
      alert(`Error: ${errorMessage}`);
    }
  };

  const openEditDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    
    // Extract numeric value from "level X" format
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

  const handleAssignRole = async () => {
    // Check permission - Updated to assign_roles
    if (!hasPermission('assign_roles') && !isAdmin) {
      alert('You do not have permission to assign roles');
      return;
    }

    if (!roleAssignment.staffId || !roleAssignment.roleId) {
      alert('Please select both staff member and role');
      return;
    }

    try {
      await assignRole(roleAssignment.staffId, roleAssignment.roleId, user?._id || 'admin');
      setRoleAssignment({ staffId: '', roleId: '' });
      setIsAssignRoleOpen(false);
      alert('Role assigned successfully!');
    } catch (error) {
      console.error('Error assigning role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign role';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleRemoveRole = async (staffId: string, roleId: string) => {
    // Check permission - Updated to update_roles
    if (!hasPermission('update_roles') && !isAdmin) {
      alert('You do not have permission to remove roles');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this role?')) {
      return;
    }

    try {
      await removeRole(staffId, roleId);
      alert('Role removed successfully!');
    } catch (error) {
      console.error('Error removing role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">Create and manage staff accounts and role assignments.</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        <div className="flex space-x-2">
        <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
          <DialogTrigger asChild>
            {/* Updated to assign_roles */}
            {(isAdmin || hasPermission('assign_roles')) && (
              <Button variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Role
              </Button>
            )}
          </DialogTrigger>
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
                <Button onClick={handleAssignRole} className="w-full">
                  Assign Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Updated to create_users */}
          {hasPermission('create_users') && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Staff Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                    <Select 
                      value={newStaff.accessLevel} 
                      onValueChange={(value) => setNewStaff({...newStaff, accessLevel: value})}
                    >
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
          )}
        </div>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editStaff.email}
                onChange={(e) => setEditStaff({...editStaff, email: e.target.value})}
                placeholder="Enter staff email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editStaff.firstName}
                  onChange={(e) => setEditStaff({...editStaff, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editStaff.lastName}
                  onChange={(e) => setEditStaff({...editStaff, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editStaffId">Staff ID *</Label>
              <Input
                id="editStaffId"
                value={editStaff.staffId}
                onChange={(e) => setEditStaff({...editStaff, staffId: e.target.value})}
                placeholder="Enter staff ID"
              />
            </div>

            <div>
              <Label htmlFor="editAccessLevel">Access Level *</Label>
              <Select 
                value={editStaff.accessLevel} 
                onValueChange={(value) => setEditStaff({...editStaff, accessLevel: value})}
              >
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
                placeholder="Enter phone number"
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
                placeholder="Enter position/designation"
              />
            </div>

            <Button onClick={handleEditStaff} className="w-full">
              Update Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      {staff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{staff.length}</p>
                <p className="text-sm text-gray-600">Total Staff</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {staff.filter(s => s.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Active Staff</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(staff.map(s => s.department)).size}
                </p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {staff.reduce((total, s) => {
                    const userRoles = Array.isArray(getUserRoles(s._id)) ? getUserRoles(s._id) : [];
                    return total + userRoles.length;
                  }, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Role Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search staff by name, email, department, or staff ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No staff found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first staff member'}
              </p>
              {/* Updated to create_users */}
              {hasPermission('create_users') && !searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const userRoles = Array.isArray(getUserRoles(member._id)) ? getUserRoles(member._id) : [];
                  return (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium block">{member.fullName}</span>
                            <span className="text-sm text-gray-500">{member.phoneNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.staffId}</TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>{member.designation}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.accessLevel}</Badge>
                      </TableCell>
                   <TableCell>
  <div className="flex flex-wrap gap-1">
    {member.roles && member.roles.map((role, index) => (
      <Badge key={role.roleId || index} variant="secondary" className="text-xs">
        {role.roleName} 
      </Badge>
    ))}
    {(!member.roles || member.roles.length === 0) && (
      <span className="text-gray-500 text-sm">No roles</span>
    )}
  </div>
</TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? 'default' : 'secondary'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {/* Updated to update_users */}
                          {(isAdmin || hasPermission('update_users')) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Updated to update_users */}
                          {(isAdmin || hasPermission('update_users')) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleStatus(member._id, member.isActive)}
                              title={member.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {member.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </Button>
                          )}
                          {/* Updated to delete_users */}
                          {(isAdmin || hasPermission('delete_users')) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteStaff(member._id, member.fullName)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPage;