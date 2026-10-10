import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Eye, Clock, CheckCircle, XCircle,
  Search, Plus, User, Calendar, DollarSign,
  TrendingUp, AlertCircle, RefreshCw, Loader2,
  Percent, Hash, BanknoteIcon, MoreHorizontal, SlidersHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoAccessPage from '@/components/NoAccessPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { useLoanApplications } from '@/hooks/useLoanApplications';
import type { LoanApplication } from '../../types';

const ApplicationsPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    applications,
    loading,
    error,
    customers,
    loanProducts,
    loadingCustomers,
    loadingLoanProducts,
    customersError,
    loanProductsError,
    isCreating,
    isDeleting,
    canCreateApplications,
    canViewApplications,
    canUpdateApplications,
    canDeleteApplications,
    fetchApplications,
    fetchDropdownData,
    createApplication,
    deleteApplication,
    getStatusDisplay,
    getStatusColor,
    formatCurrency,
    getSummaryStats,
    searchApplications,
  } = useLoanApplications();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);

  const [newApplication, setNewApplication] = useState({
    loanProductId: '',
    customerId: '',
    principalAmount: 0,
    tenure: 1,
    purpose: '',
    notes: '',
  });

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`${variant === 'destructive' ? '❌' : '✅'} ${title}: ${description}`);
    alert(`${variant === 'destructive' ? '❌' : '✅'} ${title}\n${description}`);
  };

  const filteredApplications = searchApplications(searchTerm, statusFilter);
  const summaryStats = getSummaryStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'booked':
      case 'under-review':
        return <Clock className="size-3.5" />;
      case 'approved':
        return <CheckCircle className="size-3.5" />;
      case 'rejected':
        return <XCircle className="size-3.5" />;
      case 'disbursed':
        return <TrendingUp className="size-3.5" />;
      default:
        return <Clock className="size-3.5" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getCustomerDisplayName = (customer: { firstName: string; lastName: string }) =>
    `${customer.firstName} ${customer.lastName}`;

  const getLoanProductDisplayName = (product: { name: string; minAmount: number; maxAmount: number }) =>
    `${product.name} - ${formatCurrency(product.minAmount)} to ${formatCurrency(product.maxAmount)}`;

  const handleCreateApplication = async () => {
    if (!newApplication.customerId || !newApplication.loanProductId || newApplication.principalAmount <= 0) {
      showToast('Error', 'Please fill in all required fields', 'destructive');
      return;
    }

    const selectedProduct = loanProducts.find((p) => p._id === newApplication.loanProductId);
    if (selectedProduct) {
      if (newApplication.principalAmount < selectedProduct.minAmount) {
        showToast('Error', `Minimum amount is ${formatCurrency(selectedProduct.minAmount)}`, 'destructive');
        return;
      }
      if (newApplication.principalAmount > selectedProduct.maxAmount) {
        showToast('Error', `Maximum amount is ${formatCurrency(selectedProduct.maxAmount)}`, 'destructive');
        return;
      }
    }

    const result = await createApplication({
      loanProductId: newApplication.loanProductId,
      customerId: newApplication.customerId,
      principalAmount: newApplication.principalAmount,
      tenure: newApplication.tenure,
      purpose: newApplication.purpose || undefined,
    });

    if (result.success) {
      setCreateDialogOpen(false);
      setNewApplication({ loanProductId: '', customerId: '', principalAmount: 0, tenure: 1, purpose: '', notes: '' });
      showToast('Success', 'Loan application created successfully');
    } else {
      showToast('Error', result.error || 'Failed to create application', 'destructive');
    }
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;

    const result = await deleteApplication(selectedApplication._id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setSelectedApplication(null);
      showToast('Success', 'Application deleted successfully');
    } else {
      showToast('Error', result.error || 'Failed to delete application', 'destructive');
    }
  };

  if (!authInitialized || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="mb-1 text-base font-medium">Authentication required</p>
          <p className="text-sm text-muted-foreground">Please log in to access loan applications.</p>
        </div>
      </div>
    );
  }

  if (!canViewApplications()) {
    return (
      <NoAccessPage
        message="You don't have permission to view loan applications."
        title="Access Denied - Loan Applications"
      />
    );
  }

  const statCards = [
    { label: 'Total', value: summaryStats.total, sub: 'Applications', icon: FileText },
    { label: 'Under review', value: summaryStats.underReview, sub: 'In progress', icon: Clock },
    { label: 'Approved', value: summaryStats.approved, sub: 'Ready for disbursement', icon: CheckCircle },
    { label: 'Disbursed', value: summaryStats.disbursed, sub: 'Active loans', icon: TrendingUp },
    { label: 'Total amount', value: formatCurrency(summaryStats.totalAmount), sub: 'All applications', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage all loan applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          {canCreateApplications() && (
            <Button
              size="sm"
              onClick={() => {
                setCreateDialogOpen(true);
                fetchDropdownData();
              }}
            >
              <Plus className="mr-2 size-4" />
              New Application
            </Button>
          )}
        </div>
      </div>

      {/* Compact stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
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
              placeholder="Filter by customer or purpose..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[170px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredApplications.length} of {applications.length} applications
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">
              {applications.length === 0 ? 'No loan applications found' : 'No matching applications'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {applications.length === 0
                ? 'There are no loan applications in the system.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[220px]">Customer</TableHead>
                <TableHead>Loan Details</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{app.customer || 'Unknown Customer'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium tabular-nums">{formatCurrency(app.amount)}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="size-3" />
                          {app.requestedTerm} {app.tenureUnit || 'months'}
                        </span>
                        {app.interestRate && (
                          <span className="flex items-center gap-1">
                            <Percent className="size-3" />
                            {app.interestRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[180px] truncate text-sm text-muted-foreground" title={app.purpose}>
                      {app.purpose || 'General Loan'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 font-normal ${getStatusColor(app.status)}`}
                    >
                      {getStatusIcon(app.status)}
                      {getStatusDisplay(app.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <div>
                        <div>{formatDate(app.appliedDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(app.appliedDate)}</div>
                      </div>
                    </div>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedApplication(app);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {canDeleteApplications() && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedApplication(app);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 size-4" />
                            Delete Application
                          </DropdownMenuItem>
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

      {/* Create Application Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Loan Application</DialogTitle>
            <DialogDescription>Submit a new loan application for a customer.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                value={newApplication.customerId}
                onValueChange={(value) => setNewApplication((prev) => ({ ...prev, customerId: value }))}
                disabled={loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingCustomers
                        ? 'Loading customers...'
                        : customersError
                          ? 'Error loading customers'
                          : 'Select a customer'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingCustomers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  ) : customersError ? (
                    <div className="p-2 text-sm text-destructive">Error: {customersError}</div>
                  ) : customers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No active customers found.</div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {getCustomerDisplayName(customer)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="loanProductId">Loan Product *</Label>
              <Select
                value={newApplication.loanProductId}
                onValueChange={(value) => {
                  const selectedProduct = loanProducts.find((p) => p._id === value);
                  setNewApplication((prev) => ({
                    ...prev,
                    loanProductId: value,
                    tenure: selectedProduct?.tenure || prev.tenure,
                  }));
                }}
                disabled={loadingLoanProducts}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingLoanProducts
                        ? 'Loading loan products...'
                        : loanProductsError
                          ? 'Error loading loan products'
                          : 'Select a loan product'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingLoanProducts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      <span>Loading loan products...</span>
                    </div>
                  ) : loanProductsError ? (
                    <div className="p-2 text-sm text-destructive">Error: {loanProductsError}</div>
                  ) : loanProducts.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No active loan products found.</div>
                  ) : (
                    loanProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {getLoanProductDisplayName(product)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="principalAmount">Loan Amount (₦) *</Label>
                <Input
                  id="principalAmount"
                  type="number"
                  min="0"
                  value={newApplication.principalAmount}
                  onChange={(e) =>
                    setNewApplication((prev) => ({ ...prev, principalAmount: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="tenure">Tenure (months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  min="1"
                  value={newApplication.tenure}
                  onChange={(e) => setNewApplication((prev) => ({ ...prev, tenure: parseInt(e.target.value) || 1 }))}
                  placeholder="Enter tenure"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={newApplication.purpose}
                onChange={(e) => setNewApplication((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="Describe the purpose of this loan"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApplication} disabled={isCreating || loadingCustomers || loadingLoanProducts}>
              {isCreating ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loan Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className={`rounded-lg p-4 ${getStatusColor(selectedApplication.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    <span className="font-semibold">{getStatusDisplay(selectedApplication.status)}</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedApplication.amount)}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold">
                  <User className="mr-2 size-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{selectedApplication.customer || 'Unknown Customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Application Date</p>
                    <p className="font-medium">{formatDate(selectedApplication.appliedDate)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold">
                  <BanknoteIcon className="mr-2 size-4" />
                  Loan Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Principal Amount</p>
                    <p className="font-medium">{formatCurrency(selectedApplication.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">
                      {selectedApplication.requestedTerm} {selectedApplication.tenureUnit || 'months'}
                    </p>
                  </div>
                  {selectedApplication.interestRate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="font-medium">{selectedApplication.interestRate}%</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedApplication.purpose || 'General Loan'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this loan application for {selectedApplication?.customer}?
              <br />
              <span className="font-medium text-destructive">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApplication} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsPage;