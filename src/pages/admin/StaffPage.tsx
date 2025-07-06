
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, User, Edit, Trash2, UserCheck } from 'lucide-react';
import { useRoles } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { Staff } from '../../types/banking';
import axios from 'axios';

const StaffPage = () => {
  const { roles, assignRole, removeRole, getUserRoles } = useRoles();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  // const token = localStorage.getItem('token') || '';
  // console.log('Token:', token);
  const [loading, setLoading] = useState(true);

  
  const [staff, setStaff] = useState<Staff[]>([]);
   useEffect(() => {
  const fetchStaff = async () => {
    const token = localStorage.getItem('token'); // <-- move this inside
    if (!token) {
      console.warn('No token found. User might not be logged in.');
      return;
    }
console.log('Fetching staff with token:', token);
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/user/all', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setStaff(response.data as Staff[]);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchStaff();
}, []);



  const [newStaff, setNewStaff] = useState({
    email: '',
    name: '',
    department: '',
    position: '',
    password: ''
  });

  const [roleAssignment, setRoleAssignment] = useState({
    staffId: '',
    roleId: ''
  });

  const filteredStaff = staff.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStaff = () => {
    const staff: Staff = {
      id: Date.now().toString(),
      email: newStaff.email,
      name: newStaff.name,
      department: newStaff.department,
      position: newStaff.position,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.email || 'admin',
      fullName: undefined,
      isActive: undefined,
      designation: undefined
    };
    
    setStaff(prev => [...prev, staff]);
    setNewStaff({ email: '', name: '', department: '', position: '', password: '' });
    setIsCreateOpen(false);
  };

  const handleAssignRole = () => {
    if (roleAssignment.staffId && roleAssignment.roleId) {
      assignRole(roleAssignment.staffId, roleAssignment.roleId, user?._id || 'admin');
      setRoleAssignment({ staffId: '', roleId: '' });
      setIsAssignRoleOpen(false);
    }
  };

  const handleRemoveRole = (staffId: string, roleId: string) => {
    removeRole(staffId, roleId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">Create and manage staff accounts and role assignments.</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Role
              </Button>
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
                        <SelectItem key={s.id} value={s.id}>{s.name} - {s.email}</SelectItem>
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
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignRole} className="w-full">
                  Assign Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Staff Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staffEmail">Email</Label>
                  <Input
                    id="staffEmail"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="Enter staff email"
                  />
                </div>
                <div>
                  <Label htmlFor="staffName">Full Name</Label>
                  <Input
                    id="staffName"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="staffDepartment">Department</Label>
                  <Select value={newStaff.department} onValueChange={(value) => setNewStaff({...newStaff, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                      <SelectItem value="Loans">Loans</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="staffPosition">Position</Label>
                  <Input
                    id="staffPosition"
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({...newStaff, position: e.target.value})}
                    placeholder="Enter position"
                  />
                </div>
                <div>
                  <Label htmlFor="staffPassword">Temporary Password</Label>
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
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search staff by name, email, or department..."
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
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Assigned Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => {
                const userRoles = getUserRoles(member.id);
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{member.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userRoles.map(role => (
                          <Badge key={role.id} variant="secondary" className="text-xs">
                            {role.name}
                            <button
                              onClick={() => handleRemoveRole(member.id, role.id)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {userRoles.length === 0 && (
                          <span className="text-gray-500 text-sm">No roles assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPage;
