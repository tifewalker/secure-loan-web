import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Search, Plus, RefreshCw, MoreHorizontal, SlidersHorizontal,
  Percent, Clock, FileText, TrendingUp, DollarSign, Check, X,
  Loader2, Edit, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLoanProducts, type LoanProductRow } from '@/hooks/useLoanProducts';
import type { CreateLoanProductRequest } from '@/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoanProductFormDialog } from '@/components/loan-products/LoanProductFormDialog';

const LoanProductsPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    loanProducts,
    interests,
    fees,
    glAccounts,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
    canDelete,
    fetchData,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getInterestName,
    getFeeName,
    getAccountName,
    formatAmount,
    getSummaryStats,
  } = useLoanProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<LoanProductRow | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

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
        <p className="text-sm text-muted-foreground">Please log in to access loan products.</p>
      </div>
    );
  }

  const filteredProducts = loanProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getInterestName(product.interestId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);

    return matchesSearch && matchesStatus;
  });

  const summaryStats = getSummaryStats();

  const handleCreate = (data: CreateLoanProductRequest) => createProduct(data);

  const handleUpdate = async (data: CreateLoanProductRequest) => {
    if (!selectedProduct) return { success: false };
    return updateProduct(selectedProduct._id, data);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    const result = await deleteProduct(selectedProduct._id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;
    const result = await toggleProductStatus(selectedProduct._id, selectedProduct.isActive);
    if (result.success) {
      setStatusDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const statCards = [
    { label: 'Total Products', value: summaryStats.totalProducts, icon: FileText },
    { label: 'Active', value: summaryStats.activeProducts, icon: TrendingUp },
    { label: 'Total Capacity', value: formatAmount(summaryStats.totalAmountRange), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Load error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => fetchData()}>
            Retry
          </Button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage loan products</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.roleName || user?.role})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setSelectedProduct(null); setCreateDialogOpen(true); }}>
            <Plus className="mr-2 size-4" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 truncate text-xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter products..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[150px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredProducts.length} of {loanProducts.length} products
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No loan products found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first loan product.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product Name</TableHead>
                <TableHead>Loan Range</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id} className="group">
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium tabular-nums">{formatAmount(product.minAmount)}</div>
                    <div className="text-xs text-muted-foreground">to {formatAmount(product.maxAmount)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>{product.tenure} {product.tenureUnit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                      <Percent className="size-3" />
                      {getInterestName(product.interestId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        product.isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
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
                        <DropdownMenuItem onClick={() => { setSelectedProduct(product); setViewDialogOpen(true); }}>
                          <FileText className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedProduct(product); setEditDialogOpen(true); }}>
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedProduct(product); setStatusDialogOpen(true); }}>
                          {product.isActive ? (
                            <X className="mr-2 size-4 text-orange-500" />
                          ) : (
                            <Check className="mr-2 size-4 text-green-500" />
                          )}
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}
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

      {/* Create / Edit */}
      <LoanProductFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        interests={interests}
        fees={fees}
        glAccounts={glAccounts}
        isSubmitting={isCreating}
        onSubmit={handleCreate}
      />
      <LoanProductFormDialog
        open={editDialogOpen}
        onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedProduct(null); }}
        product={selectedProduct}
        interests={interests}
        fees={fees}
        glAccounts={glAccounts}
        isSubmitting={isUpdating}
        onSubmit={handleUpdate}
      />

      {/* View */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 text-sm">
              {selectedProduct.description && <p className="text-muted-foreground">{selectedProduct.description}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Loan Range</p>
                  <p className="font-medium">{formatAmount(selectedProduct.minAmount)} – {formatAmount(selectedProduct.maxAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenure</p>
                  <p className="font-medium">{selectedProduct.tenure} {selectedProduct.tenureUnit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Repayment</p>
                  <p className="font-medium">
                    Every {selectedProduct.repaymentPattern?.frequencyValue ?? 1} {selectedProduct.repaymentPattern?.frequencyUnit ?? 'months'}
                  </p>
                  {selectedProduct.repaymentPattern?.description && (
                    <p className="text-xs text-muted-foreground">{selectedProduct.repaymentPattern.description}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-default</p>
                  <p className="font-medium">
                    {selectedProduct.defaultAfterDays ? `After ${selectedProduct.defaultAfterDays} days overdue` : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest</p>
                  <p className="font-medium">{getInterestName(selectedProduct.interestId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-medium">{getFeeName(selectedProduct.feeId)}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 font-semibold">GL Mapping</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    ['Principal Receivable', 'principalReceivable'],
                    ['Interest Receivable', 'interestReceivable'],
                    ['Interest Income', 'interestIncome'],
                    ['Fee Income', 'feeIncome'],
                    ['Disbursement', 'disbursementAccount'],
                    ['Cash / Collection', 'cashAccount'],
                    ['Penalty Income', 'penaltyIncome'],
                    ['Wallet Liability', 'walletLiability'],
                  ] as const).map(([label, key]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{getAccountName(selectedProduct.glMapping?.[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete loan product?"
        description={selectedProduct && <>"{selectedProduct.name}" will be permanently deleted. This cannot be undone.</>}
        confirmLabel="Delete product"
        destructive
        isPending={isDeleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={selectedProduct?.isActive ? 'Deactivate loan product?' : 'Activate loan product?'}
        description={
          selectedProduct?.isActive
            ? 'Inactive products cannot be used for new bookings. Existing loans are not affected.'
            : 'The product will be available for new bookings.'
        }
        confirmLabel={selectedProduct?.isActive ? 'Deactivate' : 'Activate'}
        isPending={isToggling}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
};

export default LoanProductsPage;