import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, DollarSign, Edit, Trash2, Power, PowerOff, Percent, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';
import { Fee, CreateFeeData, UpdateFeeData } from '@/types';
import NoAccessPage from '@/components/NoAccessPage';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';

const FeeManagementPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
 const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);

  const [newFee, setNewFee] = useState<CreateFeeData>({
    name: '',
    type: 'flat',
    value: 0,
    glAccount: ''
  });

  const [editFee, setEditFee] = useState<UpdateFeeData>({
    name: '',
    type: 'flat',
    value: 0,
    glAccount: ''
  });

  // Check permissions
 const canAccessFeeManagement = useCallback(() => {
  return isAdmin || hasPermission('view_fees'); // ← Use 'view_fees' instead of 'manage_fees'
}, [isAdmin, hasPermission]);

const canCreateFee = useCallback(() => isAdmin || hasPermission('create_fee'), [isAdmin, hasPermission]);
const canEditFee = useCallback(() => isAdmin || hasPermission('update_fees'), [isAdmin, hasPermission]); 
const canDeleteFee = useCallback(() => isAdmin || hasPermission('delete_fees'), [isAdmin, hasPermission]); 
const canToggleFee = useCallback(() => isAdmin || hasPermission('deactivate_fees'), [isAdmin, hasPermission]);
  // Fetch fees data
  useEffect(() => {
    const fetchFees = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const feesData = await apiService.fees.getAll();
        setFees(feesData);
      } catch (error) {
        console.error('Error fetching fees:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch fees';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [isAuthenticated]);

  // Simple toast replacement
  const showToast = useCallback((title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    if (variant === 'destructive') {
      alert(`❌ ${title}\n${description}`);
    } else {
      alert(`✅ ${title}\n${description}`);
    }
  }, []);

  
  // 1. Auth loading state (FIRST)
  if (!authInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // 2. Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Please log in to access fee management.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // 3. Permission guard
  if (!canAccessFeeManagement()) {
    return <NoAccessPage 
      message="You don't have permission to manage fees."
      title="Access Denied - Fee Management"
    />;
  }

  // 4. Error state
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

  // 5. Loading state for fees data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading fees data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch fee information.</p>
        </div>
      </div>
    );
  }

  const filteredFees = fees.filter(fee =>
    fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.glAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateFee = async () => {
    try {
      // Validation
      if (!newFee.name.trim()) {
        showToast("Validation Error", "Fee name is required", "destructive");
        return;
      }
      if (newFee.value <= 0) {
        showToast("Validation Error", "Fee value must be greater than 0", "destructive");
        return;
      }
      if (!newFee.glAccount.trim()) {
        showToast("Validation Error", "GL Account is required", "destructive");
        return;
      }

      // Match StaffPage pattern for user ID
      const userId = user?._id;
      if (!userId) {
        showToast("Authentication Error", "User ID is missing. Please log in again.", "destructive");
        return;
      }

      // Include createdBy in the request
      const feeData = {
        ...newFee,
        createdBy: userId
      };

      console.log('Creating fee with data:', feeData);

      const createdFee = await apiService.fees.create(feeData);
      
      setFees(prev => [...prev, createdFee]);
      setNewFee({
        name: '',
        type: 'flat',
        value: 0,
        glAccount: ''
      });
      setIsCreateDialogOpen(false);
      showToast("Success", "Fee created successfully");
    } catch (error) {
      console.error('Error creating fee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create fee';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleEditFee = async () => {
    if (!selectedFee) return;

    try {
      // Validation
      if (!editFee.name?.trim()) {
        showToast("Validation Error", "Fee name is required", "destructive");
        return;
      }
      if (editFee.value !== undefined && editFee.value <= 0) {
        showToast("Validation Error", "Fee value must be greater than 0", "destructive");
        return;
      }
      if (!editFee.glAccount?.trim()) {
        showToast("Validation Error", "GL Account is required", "destructive");
        return;
      }

      // Match StaffPage pattern for user ID
      const userId = user?._id;
      if (!userId) {
        showToast("Authentication Error", "User ID is missing. Please log in again.", "destructive");
        return;
      }

      // Include updatedBy in the request
      const feeData = {
        ...editFee,
        updatedBy: userId
      };

      console.log('Updating fee with data:', feeData);

      const updatedFee = await apiService.fees.update(selectedFee._id, feeData);
      
      setFees(prev => prev.map(fee => 
        fee._id === selectedFee._id ? updatedFee : fee
      ));

      setSelectedFee(null);
      setIsEditDialogOpen(false);
      showToast("Success", "Fee updated successfully");
    } catch (error) {
      console.error('Error updating fee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fee';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleToggleStatus = async (feeId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${action} this fee?`)) {
      return;
    }

    try {
      await apiService.fees.toggleStatus(feeId, currentStatus);
      
      setFees(prev => prev.map(fee => 
        fee._id === feeId ? { ...fee, isActive: !currentStatus } : fee
      ));
      showToast("Success", `Fee ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing fee:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} fee`;
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleDeleteFee = async (feeId: string, feeName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${feeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.fees.delete(feeId);
      
      setFees(prev => prev.filter(fee => fee._id !== feeId));
      showToast("Success", "Fee deleted successfully");
    } catch (error) {
      console.error('Error deleting fee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fee';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const openEditDialog = (fee: Fee) => {
    if (!canEditFee()) {
      showToast("Access Denied", "You don't have permission to edit fees", "destructive");
      return;
    }
    
    setSelectedFee(fee);
    setEditFee({
      name: fee.name,
      type: fee.type,
      value: fee.value,
      glAccount: fee.glAccount
    });
    setIsEditDialogOpen(true);
  };

  // Calculate summary stats
  const summaryStats = {
    totalFees: fees.length,
    activeFees: fees.filter(f => f.isActive).length,
    flatFees: fees.filter(f => f.type === 'flat').length,
    percentageFees: fees.filter(f => f.type === 'percentage').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-2">Create and manage application fees and charges.</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        {canCreateFee() && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Fee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feeName">Fee Name *</Label>
                  <Input
                    id="feeName"
                    value={newFee.name}
                    onChange={(e) => setNewFee({...newFee, name: e.target.value})}
                    placeholder="e.g., Application Fee, Processing Fee"
                  />
                </div>
                
                <div>
                  <Label htmlFor="feeType">Fee Type *</Label>
                  <Select 
                    value={newFee.type} 
                    onValueChange={(value: 'flat' | 'percentage') => setNewFee({...newFee, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="feeValue">
                    Fee Value * {newFee.type === 'percentage' ? '(%)' : '(₦)'}
                  </Label>
                  <Input
                    id="feeValue"
                    type="number"
                    min="0"
                    step={newFee.type === 'percentage' ? "0.1" : "1"}
                    value={newFee.value}
                    onChange={(e) => setNewFee({...newFee, value: parseFloat(e.target.value) || 0})}
                    placeholder={newFee.type === 'percentage' ? "Enter percentage" : "Enter amount"}
                  />
                </div>

                <div>
                  <Label htmlFor="glAccount">GL Account *</Label>
                  <Input
                    id="glAccount"
                    value={newFee.glAccount}
                    onChange={(e) => setNewFee({...newFee, glAccount: e.target.value})}
                    placeholder="Enter GL account code"
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFee}>
                    Create Fee
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>


      {/* Summary Stats */}
      {fees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalFees}</p>
                <p className="text-sm text-gray-600">Total Fees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.activeFees}
                </p>
                <p className="text-sm text-gray-600">Active Fees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summaryStats.flatFees}
                </p>
                <p className="text-sm text-gray-600">Flat Fees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.percentageFees}
                </p>
                <p className="text-sm text-gray-600">Percentage Fees</p>
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
              placeholder="Search fees by name, type, or GL account..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fees ({fees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFees.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No fees found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first fee'}
              </p>
              {canCreateFee() && !searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Fee
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>GL Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => (
                  <TableRow key={fee._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <span className="font-medium block">{fee.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.type === 'flat' ? 'default' : 'secondary'} className="flex items-center w-20 justify-center">
                        {fee.type === 'flat' ? <Hash className="w-3 h-3 mr-1" /> : <Percent className="w-3 h-3 mr-1" />}
                        {fee.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {fee.type === 'percentage' ? `${fee.value}%` : `₦${fee.value.toLocaleString()}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{fee.glAccount}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                        {fee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {fee.createdAt ? new Date(fee.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {canEditFee() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(fee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canToggleFee() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(fee._id, fee.isActive ?? false)}
                            title={(fee.isActive ?? false) ? 'Deactivate' : 'Activate'}
                          >
                            {(fee.isActive ?? false) ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        )}
                        {canDeleteFee() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteFee(fee._id, fee.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Fee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Fee</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFeeName">Fee Name *</Label>
                <Input
                  id="editFeeName"
                  value={editFee.name || ''}
                  onChange={(e) => setEditFee({...editFee, name: e.target.value})}
                  placeholder="e.g., Application Fee, Processing Fee"
                />
              </div>
              
              <div>
                <Label htmlFor="editFeeType">Fee Type *</Label>
                <Select 
                  value={editFee.type || 'flat'} 
                  onValueChange={(value: 'flat' | 'percentage') => setEditFee({...editFee, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editFeeValue">
                  Fee Value * {editFee.type === 'percentage' ? '(%)' : '(₦)'}
                </Label>
                <Input
                  id="editFeeValue"
                  type="number"
                  min="0"
                  step={editFee.type === 'percentage' ? "0.1" : "1"}
                  value={editFee.value || 0}
                  onChange={(e) => setEditFee({...editFee, value: parseFloat(e.target.value) || 0})}
                  placeholder={editFee.type === 'percentage' ? "Enter percentage" : "Enter amount"}
                />
              </div>

              <div>
                <Label htmlFor="editGlAccount">GL Account *</Label>
                <Input
                  id="editGlAccount"
                  value={editFee.glAccount || ''}
                  onChange={(e) => setEditFee({...editFee, glAccount: e.target.value})}
                  placeholder="Enter GL account code"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditFee}>
                  Update Fee
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeManagementPage;