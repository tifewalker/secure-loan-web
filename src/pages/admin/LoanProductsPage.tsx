import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
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
import { useLoanProducts } from '@/hooks/useLoanProducts';
import type { CreateLoanProductData, LoanProduct } from '../../types';

const LoanProductsPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    loanProducts,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    fetchData,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getInterestName,
    formatAmount,
    getSummaryStats,
  } = useLoanProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  
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
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);

    return matchesSearch && matchesStatus;
  });

  const summaryStats = getSummaryStats();

  const handleCreate = async (data: CreateLoanProductData) => {
    const result = await createProduct(data);
    if (result.success) {
      setSuccessMessage('Loan product created successfully!');
      setCreateDialogOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUpdate = async (data: CreateLoanProductData) => {
    if (!selectedProduct) return;
    const result = await updateProduct(selectedProduct._id, data);
    if (result.success) {
      setSuccessMessage('Loan product updated successfully!');
      setEditDialogOpen(false);
      setSelectedProduct(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    const result = await deleteProduct(selectedProduct._id);
    if (result.success) {
      setSuccessMessage('Loan product deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;
    const result = await toggleProductStatus(selectedProduct._id, selectedProduct.isActive);
    if (result.success && result.data) {
      setSuccessMessage(`Loan product ${result.data.isActive ? 'activated' : 'deactivated'} successfully!`);
      setStatusDialogOpen(false);
      setSelectedProduct(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const statCards = [
    { label: 'Total Products', value: summaryStats.totalProducts, icon: FileText },
    { label: 'Active', value: summaryStats.activeProducts, icon: TrendingUp },
    { label: 'Total Capacity', value: formatAmount(summaryStats.totalAmountRange), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center">
            <Check className="mr-2 size-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage loan products</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.role})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit/View/Delete/Status dialogs remain the same but use the hook methods */}
      {/* They can be further extracted to components as needed */}
    </div>
  );
};

export default LoanProductsPage;