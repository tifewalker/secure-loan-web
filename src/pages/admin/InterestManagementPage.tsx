import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, Percent, MoreHorizontal, Power, PowerOff,
  Calendar, TrendingUp, SlidersHorizontal, Loader2, Edit, Trash2,
} from 'lucide-react';
import NoAccessPage from '@/components/NoAccessPage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInterestManagement } from '@/hooks/useInterestManagement';
import type { Interest, CreateInterestData, UpdateInterestData } from '../../types';

const InterestManagementPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    interests,
    loading,
    glAccountsLoading,
    error,
    setError,
    fetchInterests,
    canAccessInterestManagement,
    canCreateInterest,
    canEditInterest,
    canDeleteInterest,
    canToggleInterest,
    createInterest,
    updateInterest,
    toggleInterestStatus,
    deleteInterest,
    searchInterests,
    getSummaryStats,
    getGLAccountName,
    getGLAccountDisplay,
    getActiveGLAccounts,
  } = useInterestManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);

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

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    alert(`${variant === 'destructive' ? '❌' : '✅'} ${title}\n${description}`);
  };

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
        <p className="text-sm text-muted-foreground">Please log in to access interest management.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (!canAccessInterestManagement()) {
    return (
      <NoAccessPage
        message="You don't have permission to manage interest rates."
        title="Access Denied - Interest Management"
      />
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-sm font-medium text-destructive">Error</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setError(null); fetchInterests(); }}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredInterests = searchInterests(searchTerm);
  const summaryStats = getSummaryStats();
  const activeGLAccounts = getActiveGLAccounts();

  const handleCreateInterest = async () => {
    if (!canCreateInterest()) {
      showToast("Access Denied", "You don't have permission to create interest rates", "destructive");
      return;
    }

    const result = await createInterest(newInterest);

    if (result.success) {
      setNewInterest({ name: '', rate: 0, rateType: 'flat', calculationPeriod: 'monthly', glInterestIncome: '' });
      setIsCreateDialogOpen(false);
      showToast("Success", "Interest rate created successfully");
    } else {
      showToast("Error", result.error || "Failed to create interest rate", "destructive");
    }
  };

  const handleEditInterest = async () => {
    if (!selectedInterest) return;

    const result = await updateInterest(selectedInterest._id, editInterest);

    if (result.success) {
      setSelectedInterest(null);
      setIsEditDialogOpen(false);
      showToast("Success", "Interest rate updated successfully");
    } else {
      showToast("Error", result.error || "Failed to update interest rate", "destructive");
    }
  };

  const handleToggleStatus = async (interestId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this interest rate?`)) return;

    const result = await toggleInterestStatus(interestId, currentStatus);
    if (result.success) {
      showToast("Success", `Interest rate ${action}d successfully`);
    } else {
      showToast("Error", result.error || `Failed to ${action} interest rate`, "destructive");
    }
  };

  const handleDeleteInterest = async (interestId: string, interestName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${interestName}"? This action cannot be undone.`)) return;

    const result = await deleteInterest(interestId);
    if (result.success) {
      showToast("Success", "Interest rate deleted successfully");
    } else {
      showToast("Error", result.error || "Failed to delete interest rate", "destructive");
    }
  };

  const openEditDialog = (interest: Interest) => {
    setSelectedInterest(interest);
    setEditInterest({
      name: interest.name,
      rate: interest.rate,
      rateType: interest.rateType,
      calculationPeriod: interest.calculationPeriod,
      glInterestIncome: interest.glInterestIncome
    });
    setIsEditDialogOpen(true);
  };

  const statCards = [
    { label: 'Total Rates', value: summaryStats.totalInterests, icon: Percent },
    { label: 'Active', value: summaryStats.activeInterests, icon: TrendingUp },
    { label: 'Flat Rates', value: summaryStats.flatRates, icon: Calendar },
    { label: 'Average Rate', value: `${summaryStats.averageRate}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interest Rate Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage loan interest rates and calculation methods
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        {canCreateInterest() && (
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Interest Rate
          </Button>
        )}
      </div>

      {/* Stat strip */}
      {!loading && interests.length > 0 && (
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
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter interest rates..."
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredInterests.length} of {interests.length} rates
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredInterests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Percent className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No interest rates found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search.' : 'Add your first interest rate.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>GL Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterests.map((interest) => {
                const glAccount = getGLAccountDisplay(interest.glInterestIncome);

                return (
                  <TableRow key={interest._id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <TrendingUp className="size-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{interest.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold tabular-nums text-green-600">
                        {interest.rate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {interest.rateType === 'reducing_balance' ? 'Reducing Balance' : interest.rateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                        <Calendar className="size-3" />
                        {interest.calculationPeriod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{glAccount.name}</div>
                        <div className="text-xs text-muted-foreground">Code: {glAccount.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          interest.isActive
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }
                      >
                        {interest.isActive ? 'Active' : 'Inactive'}
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
                          {canEditInterest() && (
                            <DropdownMenuItem onClick={() => openEditDialog(interest)}>
                              <Edit className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canToggleInterest() && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(interest._id, interest.isActive)}>
                              {interest.isActive ? (
                                <PowerOff className="mr-2 size-4 text-orange-500" />
                              ) : (
                                <Power className="mr-2 size-4 text-green-500" />
                              )}
                              {interest.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          )}
                          {canDeleteInterest() && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteInterest(interest._id, interest.name)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                placeholder="e.g., Personal Loan Interest"
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
              />
            </div>
            <div>
              <Label htmlFor="rateType">Rate Type *</Label>
              <Select value={newInterest.rateType} onValueChange={(value: 'flat' | 'reducing_balance') => setNewInterest({...newInterest, rateType: value})}>
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
              <Select value={newInterest.calculationPeriod} onValueChange={(value: 'weekly' | 'monthly' | 'daily' | 'yearly') => setNewInterest({...newInterest, calculationPeriod: value})}>
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
            <div>
              <Label htmlFor="glInterestIncome">GL Interest Income Account *</Label>
              <Select value={newInterest.glInterestIncome} onValueChange={(value) => setNewInterest({...newInterest, glInterestIncome: value})} disabled={glAccountsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={glAccountsLoading ? "Loading GL accounts..." : "Select GL account"} />
                </SelectTrigger>
                <SelectContent>
                  {activeGLAccounts.map((account) => (
                    <SelectItem key={account._id} value={account.glCode}>
                      {account.glName} ({account.glCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newInterest.glInterestIncome && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {getGLAccountName(newInterest.glInterestIncome)}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateInterest} disabled={!newInterest.name.trim() || newInterest.rate <= 0 || !newInterest.glInterestIncome.trim()}>
                Create Interest Rate
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
                />
              </div>
              <div>
                <Label htmlFor="editRateType">Rate Type *</Label>
                <Select value={editInterest.rateType || 'flat'} onValueChange={(value: 'flat' | 'reducing_balance') => setEditInterest({...editInterest, rateType: value})}>
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
                <Select value={editInterest.calculationPeriod || 'monthly'} onValueChange={(value: 'weekly' | 'monthly' | 'daily' | 'yearly') => setEditInterest({...editInterest, calculationPeriod: value})}>
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
              <div>
                <Label htmlFor="editGlInterestIncome">GL Interest Income Account *</Label>
                <Select value={editInterest.glInterestIncome || ''} onValueChange={(value) => setEditInterest({...editInterest, glInterestIncome: value})} disabled={glAccountsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GL account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGLAccounts.map((account) => (
                      <SelectItem key={account._id} value={account.glCode}>
                        {account.glName} ({account.glCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEditInterest}>Update Interest Rate</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterestManagementPage;