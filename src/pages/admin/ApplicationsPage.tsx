import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Eye, Clock, CheckCircle, XCircle, 
  Search, Filter, Plus, User, Calendar, DollarSign, 
  TrendingUp, AlertCircle, RefreshCw, Loader2,
  Percent, Hash, CalendarDays, UserCheck, BanknoteIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { apiService } from '@/services/apiService';
import { LoanApplication, Customer, LoanProduct } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoAccessPage from '@/components/NoAccessPage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from 'date-fns';

const ApplicationsPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for customers and loan products (for create form)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingLoanProducts, setLoadingLoanProducts] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [loanProductsError, setLoanProductsError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected application
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New application form
  const [newApplication, setNewApplication] = useState({
    loanProductId: '',
    customerId: '',
    principalAmount: 0,
    tenure: 1,
    purpose: '',
    notes: ''
  });

  // Permission checks
  const canCreateApplications = useCallback(() => {
    return isAdmin || hasPermission('create_loan_applications');
  }, [isAdmin, hasPermission]);

  const canViewApplications = useCallback(() => {
    return isAdmin || hasPermission('view_loan_applications');
  }, [isAdmin, hasPermission]);

  const canUpdateApplications = useCallback(() => {
    return isAdmin || hasPermission('update_loan_applications');
  }, [isAdmin, hasPermission]);

  const canDeleteApplications = useCallback(() => {
    return isAdmin || hasPermission('delete_loan_applications');
  }, [isAdmin, hasPermission]);

  // Fetch loan applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const applicationsData = await apiService.loans.getApplications();
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching loan applications:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch loan applications';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [isAuthenticated]);

  // Fetch customers and loan products for create dialog
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (createDialogOpen) {
        // Fetch customers
        if (customers.length === 0 && !loadingCustomers) {
          setLoadingCustomers(true);
          setCustomersError(null);
          try {
            const customersData = await apiService.customers.getAll();
            // Filter only active customers
            const activeCustomers = customersData.filter(customer => 
              customer.status === 'active'
            );
            setCustomers(activeCustomers);
          } catch (error) {
            console.error('Error fetching customers:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
            setCustomersError(errorMessage);
          } finally {
            setLoadingCustomers(false);
          }
        }

        // Fetch loan products
        if (loanProducts.length === 0 && !loadingLoanProducts) {
          setLoadingLoanProducts(true);
          setLoanProductsError(null);
          try {
            const loanProductsData = await apiService.loans.getLoanProducts();
            // Filter only active loan products
            const activeProducts = loanProductsData.filter(product => product.isActive);
            setLoanProducts(activeProducts);
          } catch (error) {
            console.error('Error fetching loan products:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch loan products';
            setLoanProductsError(errorMessage);
          } finally {
            setLoadingLoanProducts(false);
          }
        }
      }
    };

    fetchDropdownData();
  }, [createDialogOpen, customers.length, loanProducts.length, loadingCustomers, loadingLoanProducts]);

  // Refresh applications
  const refreshApplications = async () => {
    setLoading(true);
    try {
      const applicationsData = await apiService.loans.getApplications();
      setApplications(applicationsData);
      showToast('Success', 'Applications refreshed successfully');
    } catch (error) {
      console.error('Error refreshing applications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh applications';
      showToast('Error', errorMessage, 'destructive');
    } finally {
      setLoading(false);
    }
  };

  // Simple toast function
  const showToast = useCallback((title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`${variant === 'destructive' ? '❌' : '✅'} ${title}: ${description}`);
    alert(`${variant === 'destructive' ? '❌' : '✅'} ${title}\n${description}`);
  }, []);



  // Handle create application
  const handleCreateApplication = async () => {
    // Validate required fields
    if (!newApplication.customerId || !newApplication.loanProductId || newApplication.principalAmount <= 0) {
      showToast('Error', 'Please fill in all required fields', 'destructive');
      return;
    }

    // Validate amount against loan product limits
    const selectedProduct = loanProducts.find(p => p._id === newApplication.loanProductId);
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

    try {
      setIsCreating(true);
      const application = await apiService.loans.createApplication({
        loanProductId: newApplication.loanProductId,
        customerId: newApplication.customerId,
        principalAmount: newApplication.principalAmount,
        tenure: newApplication.tenure,
        purpose: newApplication.purpose || undefined
      });
      
      // Add to local state
      setApplications(prev => [application, ...prev]);
      setCreateDialogOpen(false);
      
      // Reset form
      setNewApplication({
        loanProductId: '',
        customerId: '',
        principalAmount: 0,
        tenure: 1,
        purpose: '',
        notes: ''
      });
      
      showToast("Success", "Loan application created successfully");
    } catch (error) {
      console.error('Error creating application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle update application
  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;
    
    try {
      setIsUpdating(true);
      // TODO: Implement update API call if available
      showToast("Info", "Update functionality coming soon");
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update application';
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete application
  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    
    try {
      setIsDeleting(true);
      // TODO: Implement delete API call if available
      setApplications(prev => prev.filter(app => app._id !== selectedApplication._id));
      showToast("Info", "Delete functionality coming soon");
      setDeleteDialogOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete application';
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsDeleting(false);
    }
  };

  // View application handler
  const handleViewApplication = (application: LoanApplication) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  // Edit application handler
  const handleEditApplication = (application: LoanApplication) => {
    setSelectedApplication(application);
    setEditDialogOpen(true);
  };

  // Delete application handler
  const handleDeleteClick = (application: LoanApplication) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'booked':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'under-review':
        return <FileText className="w-4 h-4" />;
      case 'disbursed':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Pending';
      case 'under-review':
        return 'Under Review';
      case 'disbursed':
        return 'Disbursed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
      case 'booked':
        return 'outline';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'under-review':
        return 'default';
      case 'disbursed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'booked':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'under-review':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'disbursed':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Helper to get customer display name
  const getCustomerDisplayName = (customer: Customer) => {
    return `${customer.firstName} ${customer.lastName}`;
  };

  // Helper to get loan product display name
  const getLoanProductDisplayName = (product: LoanProduct) => {
    return `${product.name} - ${formatCurrency(product.minAmount)} to ${formatCurrency(product.maxAmount)}`;
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const customerName = app.customer || '';
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.purpose && app.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.customerId && app.customerId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const summaryStats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    underReview: applications.filter(app => app.status === 'under-review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    disbursed: applications.filter(app => app.status === 'disbursed').length,
    totalAmount: applications.reduce((sum, app) => sum + app.amount, 0),
    averageAmount: applications.length > 0 ? applications.reduce((sum, app) => sum + app.amount, 0) / applications.length : 0
  };

  // Auth states
  if (!authInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">Authentication Required</p>
          <p className="text-sm text-gray-500">Please log in to access loan applications.</p>
        </div>
      </div>
    );
  }

  // Permission guard
  if (!canViewApplications()) {
    return <NoAccessPage 
      message="You don't have permission to view loan applications."
      title="Access Denied - Loan Applications"
    />;
  }

  // Error state
  if (error && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={refreshApplications} 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
          <p className="text-gray-600 mt-2">Review and manage all loan applications</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              Logged in as: {user.fullName} ({user.role})
            </span>
            {user.department && (
              <span className="text-xs text-gray-500">• {user.department}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshApplications} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canCreateApplications() && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.total}</div>
            <p className="text-xs text-gray-500">Applications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</div>
            <p className="text-xs text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.underReview}</div>
            <p className="text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.approved}</div>
            <p className="text-xs text-gray-500">Ready for disbursement</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disbursed</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summaryStats.disbursed}</div>
            <p className="text-xs text-gray-500">Active loans</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summaryStats.totalAmount)}
            </div>
            <p className="text-xs text-gray-500">Across all applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer name, purpose..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Loan Applications ({filteredApplications.length})</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {applications.length === 0 ? 'No loan applications found' : 'No matching applications'}
              </h3>
              <p className="text-gray-600">
                {applications.length === 0 
                  ? 'There are no loan applications in the system.' 
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {canCreateApplications() && applications.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Application
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Customer</TableHead>
                    <TableHead>Loan Details</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{app.customer || 'Unknown Customer'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">{formatCurrency(app.amount)}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Hash className="h-3 w-3 mr-1" />
                            {app.requestedTerm} {app.tenureUnit || 'months'}
                          </div>
                          {app.interestRate && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Percent className="h-3 w-3 mr-1" />
                              {app.interestRate}% interest
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={app.purpose}>
                          {app.purpose || 'General Loan'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(app.status)}
                          className={`flex items-center gap-1 w-fit ${getStatusColor(app.status)}`}
                        >
                          {getStatusIcon(app.status)}
                          {getStatusDisplay(app.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div>{formatDate(app.appliedDate)}</div>
                            <div className="text-xs text-gray-500">
                              {formatRelativeTime(app.appliedDate)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewApplication(app)}
                            title="View Details"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <div className="h-4 w-4">⋮</div>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewApplication(app)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdateApplications() && (
                                <DropdownMenuItem onClick={() => handleEditApplication(app)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Edit Application
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDeleteApplications() && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(app)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Delete Application
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Application Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Loan Application</DialogTitle>
            <DialogDescription>
              Submit a new loan application for a customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Customer Dropdown */}
            <div>
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                value={newApplication.customerId}
                onValueChange={(value) => setNewApplication(prev => ({...prev, customerId: value}))}
                disabled={loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingCustomers ? "Loading customers..." : 
                    customersError ? "Error loading customers" : 
                    "Select a customer"
                  }>
                    {newApplication.customerId && customers.find(c => c._id === newApplication.customerId) ? 
                      getCustomerDisplayName(customers.find(c => c._id === newApplication.customerId)!) : 
                      "Select a customer"
                  }</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {loadingCustomers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading customers...</span>
                    </div>
                  ) : customersError ? (
                    <div className="text-red-500 p-2 text-sm">
                      Error: {customersError}
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-gray-500 p-2 text-sm">
                      No active customers found. Please create customers first.
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        <div className="flex flex-col">
                          <span>{getCustomerDisplayName(customer)}</span>
                          <span className="text-xs text-gray-500">
                            {customer.email} • {customer.phoneNumber}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Loan Product Dropdown */}
            <div>
              <Label htmlFor="loanProductId">Loan Product *</Label>
              <Select
                value={newApplication.loanProductId}
                onValueChange={(value) => {
                  const selectedProduct = loanProducts.find(p => p._id === value);
                  setNewApplication(prev => ({
                    ...prev, 
                    loanProductId: value,
                    tenure: selectedProduct?.tenure || prev.tenure
                  }));
                }}
                disabled={loadingLoanProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingLoanProducts ? "Loading loan products..." : 
                    loanProductsError ? "Error loading loan products" : 
                    "Select a loan product"
                  }>
                    {newApplication.loanProductId && loanProducts.find(p => p._id === newApplication.loanProductId) ? 
                      getLoanProductDisplayName(loanProducts.find(p => p._id === newApplication.loanProductId)!) : 
                      "Select a loan product"
                  }</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {loadingLoanProducts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading loan products...</span>
                    </div>
                  ) : loanProductsError ? (
                    <div className="text-red-500 p-2 text-sm">
                      Error: {loanProductsError}
                    </div>
                  ) : loanProducts.length === 0 ? (
                    <div className="text-gray-500 p-2 text-sm">
                      No active loan products found. Please create loan products first.
                    </div>
                  ) : (
                    loanProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)} • {product.tenure} {product.tenureUnit}
                          </span>
                        </div>
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
                  onChange={(e) => setNewApplication(prev => ({...prev, principalAmount: parseInt(e.target.value) || 0}))}
                  placeholder="Enter amount"
                />
                {newApplication.loanProductId && loanProducts.find(p => p._id === newApplication.loanProductId) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {formatCurrency(loanProducts.find(p => p._id === newApplication.loanProductId)!.minAmount)} - {formatCurrency(loanProducts.find(p => p._id === newApplication.loanProductId)!.maxAmount)}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="tenure">Tenure (months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  min="1"
                  value={newApplication.tenure}
                  onChange={(e) => setNewApplication(prev => ({...prev, tenure: parseInt(e.target.value) || 1}))}
                  placeholder="Enter tenure"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={newApplication.purpose}
                onChange={(e) => setNewApplication(prev => ({...prev, purpose: e.target.value}))}
                placeholder="Describe the purpose of this loan"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newApplication.notes}
                onChange={(e) => setNewApplication(prev => ({...prev, notes: e.target.value}))}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setLoadingCustomers(false);
              setLoadingLoanProducts(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateApplication} 
              disabled={isCreating || loadingCustomers || loadingLoanProducts}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Application Details</DialogTitle>
            <DialogDescription>
              Application reference: {selectedApplication?.customer?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${getStatusColor(selectedApplication.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    <span className="font-semibold">
                      {getStatusDisplay(selectedApplication.status)}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(selectedApplication.amount)}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium">
                      {selectedApplication.customer || 'Unknown Customer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Application Date</p>
                    <p className="font-medium">{formatDate(selectedApplication.appliedDate)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Loan Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <BanknoteIcon className="w-5 h-5 mr-2" />
                  Loan Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Principal Amount</p>
                    <p className="font-medium">{formatCurrency(selectedApplication.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tenure</p>
                    <p className="font-medium">
                      {selectedApplication.requestedTerm} {selectedApplication.tenureUnit || 'months'}
                    </p>
                  </div>
                  {selectedApplication.interestRate && (
                    <div>
                      <p className="text-sm text-gray-500">Interest Rate</p>
                      <p className="font-medium">{selectedApplication.interestRate}%</p>
                    </div>
                  )}
                  {selectedApplication.totalRepayable && (
                    <div>
                      <p className="text-sm text-gray-500">Total Repayable</p>
                      <p className="font-medium">{formatCurrency(selectedApplication.totalRepayable)}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p className="font-medium">{selectedApplication.purpose || 'General Loan'}</p>
                  </div>
                </div>
              </div>

              {/* Outstanding Amounts Section */}
              {(selectedApplication.outstandingPrincipal !== undefined || 
                selectedApplication.outstandingInterest !== undefined) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Outstanding Amounts
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApplication.outstandingPrincipal !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Outstanding Principal</p>
                          <p className="font-medium">
                            {formatCurrency(selectedApplication.outstandingPrincipal)}
                          </p>
                        </div>
                      )}
                      {selectedApplication.outstandingInterest !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Outstanding Interest</p>
                          <p className="font-medium">
                            {formatCurrency(selectedApplication.outstandingInterest)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Timeline
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Applied Date</p>
                    <p className="font-medium">{formatDate(selectedApplication.appliedDate)}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(selectedApplication.appliedDate)}
                    </p>
                  </div>
                  {selectedApplication.createdAt && (
                    <div>
                      <p className="text-sm text-gray-500">Created On</p>
                      <p className="font-medium">{formatDate(selectedApplication.createdAt)}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(selectedApplication.createdAt)}
                      </p>
                    </div>
                  )}
                  {selectedApplication.updatedAt && selectedApplication.updatedAt !== selectedApplication.createdAt && (
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(selectedApplication.updatedAt)}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(selectedApplication.updatedAt)}
                      </p>
                    </div>
                  )}
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
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteApplication}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsPage;