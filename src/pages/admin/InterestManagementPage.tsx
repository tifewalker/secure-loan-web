import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Percent, Edit, Trash2, Power, PowerOff, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import NoAccessPage from '@/components/NoAccessPage';
import { apiService } from '@/services/apiService';
import { GLAccount } from '@/types';
import { Interest, CreateInterestData, UpdateInterestData } from '@/types';

const InterestManagementPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [glAccountsLoading, setGlAccountsLoading] = useState(false);

  const [newInterest, setNewInterest] = useState<CreateInterestData>({
    name: '',
    rate: 0,
    rateType: 'flat',
    calculationPeriod: 'monthly',
    glInterestIncome: ''
  });

  const [editInterest, setEditInterest] = useState<UpdateInterestData>({
    name: '',
    rate: 0,
    rateType: 'flat',
    calculationPeriod: 'monthly',
    glInterestIncome: ''
  });

  // Check permissions - Updated to use correct permission names
  const canAccessInterestManagement = useCallback(() => {
    return isAdmin || hasPermission('view_interests');
  }, [isAdmin, hasPermission]);

  const canCreateInterest = useCallback(() => isAdmin || hasPermission('create_interests'), [isAdmin, hasPermission]);
  const canEditInterest = useCallback(() => isAdmin || hasPermission('update_interests'), [isAdmin, hasPermission]);
  const canDeleteInterest = useCallback(() => isAdmin || hasPermission('delete_interests'), [isAdmin, hasPermission]);
  const canToggleInterest = useCallback(() => isAdmin || hasPermission('update_interests'), [isAdmin, hasPermission]); // Use update for toggle

  // Helper function to get GL account by CODE (not ID)
  const getGLAccountByCode = (glCode: string): GLAccount | undefined => {
    return glAccounts.find(acc => acc.glCode === glCode);
  };

  // Helper function to get GL account name by CODE
  const getGLAccountName = (glCode: string): string => {
    if (!glCode) return 'Not set';
    
    const account = getGLAccountByCode(glCode);
    return account ? account.glName : `GL Code: ${glCode}`;
  };

  // Helper function to get GL account details for display
  const getGLAccountDisplay = (glCode: string): { name: string; code: string; status: string; category: string } => {
    const account = getGLAccountByCode(glCode);
    if (!account) {
      return {
        name: 'Account not found',
        code: glCode,
        status: 'unknown',
        category: ''
      };
    }
    
    return {
      name: account.glName,
      code: account.glCode,
      status: account.status,
      category: account.level1Category
    };
  };

  // Fetch interests data
  useEffect(() => {
    const fetchInterests = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const interestsData = await apiService.interests.getAll();
        setInterests(interestsData);
      } catch (error) {
        console.error('Error fetching interest rates:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interest rates';
        setError(errorMessage);
        
        // Handle session expiration
        if (errorMessage.includes('session expired') || errorMessage.includes('401') || errorMessage.includes('token')) {
          setError('Your session has expired. Please log in again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [isAuthenticated]);

  // Fetch GL accounts
  useEffect(() => {
    const fetchGLAccounts = async () => {
      if (!isAuthenticated) return;
      
      setGlAccountsLoading(true);
      try {
        const accounts = await apiService.glAccounts.getAll();
        setGlAccounts(accounts);
      } catch (error) {
        console.error('Error fetching GL accounts:', error);
      } finally {
        setGlAccountsLoading(false);
      }
    };

    fetchGLAccounts();
  }, [isAuthenticated]);

  // Simple toast replacement
  const showToast = useCallback((title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    if (variant === 'destructive') {
      alert(`❌ ${title}\n${description}`);
    } else {
      alert(`✅ ${title}\n${description}`);
    }
  }, []);

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
          <p className="text-lg text-gray-600 mb-2">Please log in to access interest management.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // User ID check
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading user data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load your user information.</p>
        </div>
      </div>
    );
  }

  // Permission guard - THIRD GUARD (Updated permission name)
  if (!hasPermission('view_interests') && !isAdmin) {
    return <NoAccessPage 
      message="You don't have permission to manage interest rates."
      title="Access Denied - Interest Management"
    />;
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="outline"
              onClick={() => {setError(null); window.location.reload();}} 
            >
              Retry
            </Button>
            {(error.includes('session') || error.includes('token')) && (
              <Button 
                variant="destructive"
                onClick={() => window.location.href = '/login'}
              >
                Login Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredInterests = interests.filter(interest =>
    interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.glInterestIncome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.rateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.calculationPeriod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter active GL accounts for dropdown
  const activeGLAccounts = glAccounts.filter(account => 
    account.status === 'active' && account.isActive
  );

  const handleCreateInterest = async () => {
    // Check permission
    if (!canCreateInterest()) {
      showToast("Access Denied", "You don't have permission to create interest rates", "destructive");
      return;
    }

    try {
      // Validation
      if (!newInterest.name.trim()) {
        showToast("Validation Error", "Interest rate name is required", "destructive");
        return;
      }
      if (newInterest.rate <= 0) {
        showToast("Validation Error", "Interest rate must be greater than 0", "destructive");
        return;
      }
      if (!newInterest.glInterestIncome.trim()) {
        showToast("Validation Error", "GL Interest Income account is required", "destructive");
        return;
      }

      const createdInterest = await apiService.interests.create(newInterest);
      
      setInterests(prev => [...prev, createdInterest]);
      setNewInterest({
        name: '',
        rate: 0,
        rateType: 'flat',
        calculationPeriod: 'monthly',
        glInterestIncome: ''
      });
      setIsCreateDialogOpen(false);
      showToast("Success", "Interest rate created successfully");
    } catch (error) {
      console.error('Error creating interest rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create interest rate';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleEditInterest = async () => {
    if (!selectedInterest) return;

    // Check permission
    if (!canEditInterest()) {
      showToast("Access Denied", "You don't have permission to edit interest rates", "destructive");
      return;
    }

    try {
      // Validation
      if (!editInterest.name?.trim()) {
        showToast("Validation Error", "Interest rate name is required", "destructive");
        return;
      }
      if (editInterest.rate !== undefined && editInterest.rate <= 0) {
        showToast("Validation Error", "Interest rate must be greater than 0", "destructive");
        return;
      }
      if (!editInterest.glInterestIncome?.trim()) {
        showToast("Validation Error", "GL Interest Income account is required", "destructive");
        return;
      }

      const updatedInterest = await apiService.interests.update(selectedInterest._id, editInterest);
      
      setInterests(prev => prev.map(interest => 
        interest._id === selectedInterest._id ? updatedInterest : interest
      ));

      setSelectedInterest(null);
      setIsEditDialogOpen(false);
      showToast("Success", "Interest rate updated successfully");
    } catch (error) {
      console.error('Error updating interest rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update interest rate';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleToggleStatus = async (interestId: string, currentStatus: boolean) => {
    // Check permission
    if (!canToggleInterest()) {
      showToast("Access Denied", "You don't have permission to update interest rates", "destructive");
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${action} this interest rate?`)) {
      return;
    }

    try {
      await apiService.interests.toggleStatus(interestId, currentStatus);
      
      setInterests(prev => prev.map(interest => 
        interest._id === interestId ? { ...interest, isActive: !currentStatus } : interest
      ));
      showToast("Success", `Interest rate ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing interest rate:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} interest rate`;
      showToast("Error", errorMessage, "destructive");
    }
  };

  const handleDeleteInterest = async (interestId: string, interestName: string) => {
    // Check permission
    if (!canDeleteInterest()) {
      showToast("Access Denied", "You don't have permission to delete interest rates", "destructive");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${interestName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.interests.delete(interestId);
      
      setInterests(prev => prev.filter(interest => interest._id !== interestId));
      showToast("Success", "Interest rate deleted successfully");
    } catch (error) {
      console.error('Error deleting interest rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete interest rate';
      showToast("Error", errorMessage, "destructive");
    }
  };

  const openEditDialog = (interest: Interest) => {
    if (!canEditInterest()) {
      showToast("Access Denied", "You don't have permission to edit interest rates", "destructive");
      return;
    }
    
    setSelectedInterest(interest);
    setEditInterest({
      name: interest.name,
      rate: interest.rate,
      rateType: interest.rateType,
      calculationPeriod: interest.calculationPeriod,
      glInterestIncome: interest.glInterestIncome // This is the GL CODE
    });
    setIsEditDialogOpen(true);
  };

  // Calculate summary stats
  const summaryStats = {
    totalInterests: interests.length,
    activeInterests: interests.filter(i => i.isActive).length,
    flatRates: interests.filter(i => i.rateType === 'flat').length,
    reducingRates: interests.filter(i => i.rateType === 'reducing_balance').length,
    averageRate: interests.length > 0 
      ? (interests.reduce((sum, i) => sum + i.rate, 0) / interests.length).toFixed(2)
      : '0.00'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interest Rate Management</h1>
          <p className="text-gray-600 mt-2">Create and manage loan interest rates and calculation methods.</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        {canCreateInterest() && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Interest Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Interest Rate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="interestName">Interest Rate Name *</Label>
                  <Input
                    id="interestName"
                    value={newInterest.name}
                    onChange={(e) => setNewInterest({...newInterest, name: e.target.value})}
                    placeholder="e.g., Personal Loan Interest, Mortgage Rate"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={newInterest.rate}
                    onChange={(e) => setNewInterest({...newInterest, rate: parseFloat(e.target.value) || 0})}
                    placeholder="Enter interest rate percentage"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rateType">Rate Type *</Label>
                  <Select 
                    value={newInterest.rateType} 
                    onValueChange={(value: 'flat' | 'reducing_balance') => setNewInterest({...newInterest, rateType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="calculationPeriod">Calculation Period *</Label>
                  <Select 
                    value={newInterest.calculationPeriod} 
                    onValueChange={(value: 'weekly' | 'monthly' | 'daily' | 'yearly') => setNewInterest({...newInterest, calculationPeriod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select calculation period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* FIXED: Create dialog GL Account dropdown */}
                <div>
                  <Label htmlFor="glInterestIncome">GL Interest Income Account *</Label>
                  <Select 
                    value={newInterest.glInterestIncome} 
                    onValueChange={(value) => setNewInterest({...newInterest, glInterestIncome: value})}
                    disabled={glAccountsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        glAccountsLoading ? "Loading GL accounts..." : "Select GL account"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGLAccounts.map((account) => (
                        <SelectItem key={account._id} value={account.glCode}>
                          {account.glName} ({account.glCode}) - {account.level1Category}
                        </SelectItem>
                      ))}
                      {activeGLAccounts.length === 0 && !glAccountsLoading && (
                        <SelectItem value="" disabled>
                          No active GL accounts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {newInterest.glInterestIncome && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {getGLAccountName(newInterest.glInterestIncome)}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateInterest} 
                    disabled={!newInterest.name.trim() || newInterest.rate <= 0 || !newInterest.glInterestIncome.trim()}
                  >
                    Create Interest Rate
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && interests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalInterests}</p>
                <p className="text-sm text-gray-600">Total Rates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.activeInterests}
                </p>
                <p className="text-sm text-gray-600">Active Rates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summaryStats.flatRates}
                </p>
                <p className="text-sm text-gray-600">Flat Rates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.averageRate}%
                </p>
                <p className="text-sm text-gray-600">Average Rate</p>
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
              placeholder="Search interest rates by name, type, or GL account..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 ml-4">Loading interest rates...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interests Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Interest Rates ({interests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInterests.length === 0 ? (
              <div className="text-center py-8">
                <Percent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No interest rates found</p>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first interest rate'}
                </p>
                {canCreateInterest() && !searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Interest Rate
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>GL Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterests.map((interest) => {
                    const glAccount = getGLAccountDisplay(interest.glInterestIncome);
                    
                    return (
                      <TableRow key={interest._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium block">{interest.name}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {interest.rate}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={interest.rateType === 'flat' ? 'default' : 'secondary'}>
                            {interest.rateType === 'reducing_balance' ? 'Reducing Balance' : interest.rateType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center w-20 justify-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {interest.calculationPeriod}
                          </Badge>
                        </TableCell>
                        {/* FIXED: GL Account display */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {glAccount.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Code: {glAccount.code}
                            </div>
                            {glAccount.status !== 'active' && (
                              <Badge variant="secondary" className="text-xs">
                                {glAccount.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={interest.isActive ? 'default' : 'secondary'}>
                            {interest.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {interest.createdAt ? new Date(interest.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {canEditInterest() && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(interest)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canToggleInterest() && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleToggleStatus(interest._id, interest.isActive)}
                                title={interest.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {interest.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </Button>
                            )}
                            {canDeleteInterest() && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteInterest(interest._id, interest.name)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
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
      )}

      {/* Edit Interest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Interest Rate</DialogTitle>
          </DialogHeader>
          {selectedInterest && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editInterestName">Interest Rate Name *</Label>
                <Input
                  id="editInterestName"
                  value={editInterest.name || ''}
                  onChange={(e) => setEditInterest({...editInterest, name: e.target.value})}
                  placeholder="e.g., Personal Loan Interest, Mortgage Rate"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="editInterestRate">Interest Rate (%) *</Label>
                <Input
                  id="editInterestRate"
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={editInterest.rate || 0}
                  onChange={(e) => setEditInterest({...editInterest, rate: parseFloat(e.target.value) || 0})}
                  placeholder="Enter interest rate percentage"
                  required
                />
              </div>

              <div>
                <Label htmlFor="editRateType">Rate Type *</Label>
                <Select 
                  value={editInterest.rateType || 'flat'} 
                  onValueChange={(value: 'flat' | 'reducing_balance') => setEditInterest({...editInterest, rateType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editCalculationPeriod">Calculation Period *</Label>
                <Select 
                  value={editInterest.calculationPeriod || 'monthly'} 
                  onValueChange={(value: 'weekly' | 'monthly' | 'daily' | 'yearly') => setEditInterest({...editInterest, calculationPeriod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calculation period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FIXED: Edit dialog GL Account dropdown */}
              <div>
                <Label htmlFor="editGlInterestIncome">GL Interest Income Account *</Label>
                <Select 
                  value={editInterest.glInterestIncome || ''} 
                  onValueChange={(value) => setEditInterest({...editInterest, glInterestIncome: value})}
                  disabled={glAccountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      glAccountsLoading ? "Loading GL accounts..." : "Select GL account"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGLAccounts.map((account) => (
                      <SelectItem key={account._id} value={account.glCode}>
                        {account.glName} ({account.glCode}) - {account.level1Category}
                      </SelectItem>
                    ))}
                    {activeGLAccounts.length === 0 && !glAccountsLoading && (
                      <SelectItem value="" disabled>
                        No active GL accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {editInterest.glInterestIncome && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {getGLAccountName(editInterest.glInterestIncome)}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditInterest} 
                  disabled={!editInterest.name?.trim() || (editInterest.rate || 0) <= 0 || !editInterest.glInterestIncome?.trim()}
                >
                  Update Interest Rate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterestManagementPage;