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
  Search, Plus, DollarSign, MoreHorizontal, Power, PowerOff,
  Percent, Hash, SlidersHorizontal, Loader2, Edit, Trash2,
} from 'lucide-react';
import NoAccessPage from '@/components/NoAccessPage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFeeManagement } from '@/hooks/useFeeManagement';
import type { CreateFeeRequest, UpdateFeeRequest } from '@/api';
import type { FeeRow } from '@/components/accounting/accounting-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from '@/hooks/use-toast';

/** Sentinel for "no GL account" in the select (Radix needs a non-empty value). */
const NO_GL = '__none__';

const FeeManagementPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    fees,
    loading,
    error,
    fetchFees,
    isSaving,
    isDeleting,
    activeGLAccounts,
    getGLAccountName,
    canAccessFeeManagement,
    canCreateFee,
    canEditFee,
    canDeleteFee,
    canToggleFee,
    createFee,
    updateFee,
    toggleFeeStatus,
    deleteFee,
    searchFees,
    getSummaryStats,
  } = useFeeManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRow | null>(null);
  const [feeToDelete, setFeeToDelete] = useState<FeeRow | null>(null);

  const [newFee, setNewFee] = useState<CreateFeeRequest>({
    name: '',
    type: 'flat',
    value: 0,
    glAccount: ''
  });

  const [editFee, setEditFee] = useState<UpdateFeeRequest>({
    name: '',
    type: 'flat',
    value: 0,
    glAccount: ''
  });

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    toast({ title, description, variant });
  };

  if (!authInitialized || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Please log in to access fee management.</p>
      </div>
    );
  }

  if (!canAccessFeeManagement()) {
    return <NoAccessPage message="You don't have permission to manage fees." title="Access Denied - Fee Management" />;
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-sm font-medium text-destructive">Error</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchFees()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const filteredFees = searchFees(searchTerm);
  const summaryStats = getSummaryStats();

  const handleCreateFee = async () => {
    const result = await createFee(newFee);

    if (result.success) {
      setNewFee({ name: '', type: 'flat', value: 0, glAccount: '' });
      setIsCreateDialogOpen(false);
      showToast("Success", "Fee created successfully");
    } else {
      showToast("Error", result.error || "Failed to create fee", "destructive");
    }
  };

  const handleEditFee = async () => {
    if (!selectedFee) return;

    const result = await updateFee(selectedFee._id, editFee);

    if (result.success) {
      setSelectedFee(null);
      setIsEditDialogOpen(false);
      showToast("Success", "Fee updated successfully");
    } else {
      showToast("Error", result.error || "Failed to update fee", "destructive");
    }
  };

  const handleToggleStatus = async (feeId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this fee?${currentStatus ? ' Inactive fees are not charged on new bookings.' : ''}`)) return;

    const result = await toggleFeeStatus(feeId);
    if (result.success) {
      showToast("Success", `Fee ${action}d successfully`);
    } else {
      showToast("Error", result.error || `Failed to ${action} fee`, "destructive");
    }
  };

  const handleDeleteFee = async () => {
    if (!feeToDelete) return;
    const result = await deleteFee(feeToDelete._id);
    if (result.success) {
      setFeeToDelete(null);
      showToast("Success", "Fee deleted successfully");
    } else {
      showToast("Error", result.error || "Failed to delete fee", "destructive");
    }
  };

  const openEditDialog = (fee: FeeRow) => {
    setSelectedFee(fee);
    setEditFee({
      name: fee.name,
      type: fee.type,
      value: fee.value,
      glAccount: fee.glAccount
    });
    setIsEditDialogOpen(true);
  };

  const statCards = [
    { label: 'Total Fees', value: summaryStats.totalFees, icon: DollarSign },
    { label: 'Active', value: summaryStats.activeFees, icon: Hash },
    { label: 'Flat Fees', value: summaryStats.flatFees, icon: Hash },
    { label: 'Percentage Fees', value: summaryStats.percentageFees, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fee Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage application fees and charges
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.roleName || user?.role}){user?.department ? ` - ${user.department}` : ''}
          </p>
        </div>
        {canCreateFee() && (
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Fee
          </Button>
        )}
      </div>

      {/* Stat strip */}
      {fees.length > 0 && (
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
            placeholder="Filter fees..."
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredFees.length} of {fees.length} fees
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <DollarSign className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No fees found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search.' : 'Add your first fee.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fee Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>GL Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => (
                <TableRow key={fee._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50">
                        <DollarSign className="size-3.5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">{fee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                      {fee.type === 'flat' ? <Hash className="size-3" /> : <Percent className="size-3" />}
                      {fee.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">
                      {fee.type === 'percentage' ? `${fee.value}%` : `₦${fee.value.toLocaleString()}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {fee.glAccount ? (
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">{getGLAccountName(fee.glAccount)}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">Product fee-income GL</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        fee.isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    >
                      {fee.isActive ? 'Active' : 'Inactive'}
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
                        {canEditFee() && (
                          <DropdownMenuItem onClick={() => openEditDialog(fee)}>
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canToggleFee() && (
                          <DropdownMenuItem onClick={() => handleToggleStatus(fee._id, fee.isActive ?? false)}>
                            {fee.isActive ? (
                              <PowerOff className="mr-2 size-4 text-orange-500" />
                            ) : (
                              <Power className="mr-2 size-4 text-green-500" />
                            )}
                            {fee.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        )}
                        {canDeleteFee() && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setFeeToDelete(fee)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                placeholder="e.g., Application Fee"
              />
            </div>
            <div>
              <Label htmlFor="feeType">Fee Type *</Label>
              <Select value={newFee.type} onValueChange={(value: 'flat' | 'percentage') => setNewFee({...newFee, type: value})}>
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
              <Label htmlFor="feeValue">Fee Value * {newFee.type === 'percentage' ? '(%)' : '(₦)'}</Label>
              <Input
                id="feeValue"
                type="number"
                min="0"
                step={newFee.type === 'percentage' ? "0.1" : "1"}
                value={newFee.value}
                onChange={(e) => setNewFee({...newFee, value: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="glAccount">Fee Income GL Account</Label>
              <Select
                value={newFee.glAccount || NO_GL}
                onValueChange={(value) => setNewFee({...newFee, glAccount: value === NO_GL ? '' : value})}
              >
                <SelectTrigger id="glAccount">
                  <SelectValue placeholder="Select GL account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GL}>Use the loan product's fee-income GL</SelectItem>
                  {activeGLAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.glCode} - {account.glName} ({account.level1Category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFee} disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Fee'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
                />
              </div>
              <div>
                <Label htmlFor="editFeeType">Fee Type *</Label>
                <Select value={editFee.type || 'flat'} onValueChange={(value: 'flat' | 'percentage') => setEditFee({...editFee, type: value})}>
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
                <Label htmlFor="editFeeValue">Fee Value *</Label>
                <Input
                  id="editFeeValue"
                  type="number"
                  min="0"
                  value={editFee.value || 0}
                  onChange={(e) => setEditFee({...editFee, value: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="editGlAccount">Fee Income GL Account</Label>
                <Select
                value={editFee.glAccount || NO_GL}
                onValueChange={(value) => setEditFee({...editFee, glAccount: value === NO_GL ? '' : value})}
              >
                <SelectTrigger id="editGlAccount">
                  <SelectValue placeholder="Select GL account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GL}>Use the loan product's fee-income GL</SelectItem>
                  {activeGLAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.glCode} - {account.glName} ({account.level1Category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEditFee} disabled={isSaving}>{isSaving ? 'Updating...' : 'Update Fee'}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!feeToDelete}
        onOpenChange={(open) => !open && setFeeToDelete(null)}
        title="Delete fee?"
        description={feeToDelete && <>"{feeToDelete.name}" will be permanently deleted. Loans already booked keep their fees.</>}
        confirmLabel="Delete fee"
        destructive
        isPending={isDeleting}
        onConfirm={handleDeleteFee}
      />
    </div>
  );
};

export default FeeManagementPage;