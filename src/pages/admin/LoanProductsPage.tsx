import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  TrendingUp, 
  DollarSign,
  Clock,
  Percent,
  FileText,
  Check,
  X,
  RefreshCw,
  MoreVertical,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { apiService } from '@/services/apiService';
import { 
  LoanProduct, 
  CreateLoanProductData,
  Interest,
  GLAccount 
} from '@/types';
import NoAccessPage from '@/components/NoAccessPage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form validation schemas
const createLoanProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  minAmount: z.number().min(0, 'Minimum amount must be positive'),
  maxAmount: z.number().min(0, 'Maximum amount must be positive'),
  tenure: z.number().min(1, 'Tenure must be at least 1'),
  tenureUnit: z.enum(['days', 'months', 'years']),
  frequencyValue: z.number().min(1, 'Frequency must be at least 1'),
  frequencyUnit: z.enum(['days', 'weeks', 'months', 'years']),
  periodValue: z.number().min(1, 'Period must be at least 1'),
  periodUnit: z.enum(['days', 'weeks', 'months', 'years']),
  repaymentDescription: z.string().min(1, 'Repayment description is required'),
  interestId: z.string().min(1, 'Interest rate is required'),
  principalReceivable: z.string().min(1, 'Principal receivable account is required'),
  interestReceivable: z.string().min(1, 'Interest receivable account is required'),
  interestIncome: z.string().min(1, 'Interest income account is required'),
  feeIncome: z.string().min(1, 'Fee income account is required'),
  disbursementAccount: z.string().min(1, 'Disbursement account is required'),
  cashAccount: z.string().min(1, 'Cash account is required'),
});

const updateLoanProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  minAmount: z.number().min(0, 'Minimum amount must be positive'),
  maxAmount: z.number().min(0, 'Maximum amount must be positive'),
  tenure: z.number().min(1, 'Tenure must be at least 1'),
  tenureUnit: z.enum(['days', 'months', 'years']),
  frequencyValue: z.number().min(1, 'Frequency must be at least 1'),
  frequencyUnit: z.enum(['days', 'weeks', 'months', 'years']),
  periodValue: z.number().min(1, 'Period must be at least 1'),
  periodUnit: z.enum(['days', 'weeks', 'months', 'years']),
  repaymentDescription: z.string().min(1, 'Repayment description is required'),
  interestId: z.string().min(1, 'Interest rate is required'),
  principalReceivable: z.string().min(1, 'Principal receivable account is required'),
  interestReceivable: z.string().min(1, 'Interest receivable account is required'),
  interestIncome: z.string().min(1, 'Interest income account is required'),
  feeIncome: z.string().min(1, 'Fee income account is required'),
  disbursementAccount: z.string().min(1, 'Disbursement account is required'),
  cashAccount: z.string().min(1, 'Cash account is required'),
  isActive: z.boolean(),
});

// Filter options
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const tenureUnitOptions = ['days', 'months', 'years'];
const frequencyUnitOptions = ['days', 'weeks', 'months', 'years'];
const periodUnitOptions = ['days', 'weeks', 'months', 'years'];

interface ApiLoanProduct {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: string;
  interestId: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  repaymentPattern: {
    frequencyValue: number;
    frequencyUnit: string;
    periodValue: number;
    periodUnit: string;
    description: string;
  };
  glMapping: {
    principalReceivable: string;
    interestReceivable: string;
    interestIncome: string;
    feeIncome: string;
    disbursementAccount: string;
    cashAccount: string;
  };
  feeId: string | null;
  createdBy: string;
  __v: number;
}

const LoanProductsPage = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions();
  
  // State variables
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected product
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const createForm = useForm<z.infer<typeof createLoanProductSchema>>({
    resolver: zodResolver(createLoanProductSchema),
    defaultValues: {
      name: '',
      description: '',
      minAmount: 10000,
      maxAmount: 1000000,
      tenure: 1,
      tenureUnit: 'months',
      frequencyValue: 1,
      frequencyUnit: 'months',
      periodValue: 1,
      periodUnit: 'months',
      repaymentDescription: '',
      interestId: '',
      principalReceivable: '',
      interestReceivable: '',
      interestIncome: '',
      feeIncome: '',
      disbursementAccount: '',
      cashAccount: '',
    },
  });

  const updateForm = useForm<z.infer<typeof updateLoanProductSchema>>({
    resolver: zodResolver(updateLoanProductSchema),
  });

  // Permission check functions (will be updated when permissions are added)
  const canAccessLoanProducts = useCallback(() => {
    // TODO: Replace with actual permission when available
    return isAdmin || hasPermission('*') || true; // Temporary: allow all authenticated users
  }, [isAdmin, hasPermission]);

  const canCreateLoanProduct = useCallback(() => {
    // TODO: Replace with actual permission when available
    return isAdmin || hasPermission('*') || true; // Temporary: allow all authenticated users
  }, [isAdmin, hasPermission]);

  const canUpdateLoanProduct = useCallback(() => {
    // TODO: Replace with actual permission when available
    return isAdmin || hasPermission('*') || true; // Temporary: allow all authenticated users
  }, [isAdmin, hasPermission]);

  const canDeleteLoanProduct = useCallback(() => {
    // TODO: Replace with actual permission when available
    return isAdmin || hasPermission('*') || true; // Temporary: allow all authenticated users
  }, [isAdmin, hasPermission]);

// Transform API loan product to app loan product
const transformApiLoanProduct = (apiProduct: ApiLoanProduct): LoanProduct => {
  const repaymentPattern = apiProduct.repaymentPattern || {};
  const glMapping = apiProduct.glMapping || {};

  return {
    _id: apiProduct._id || '',
    name: apiProduct.name || '',
    description: apiProduct.description || '',
    minAmount: apiProduct.minAmount || 0,
    maxAmount: apiProduct.maxAmount || 0,
    tenure: apiProduct.tenure || 0,
    tenureUnit: apiProduct.tenureUnit || 'months',
    
    frequencyValue: repaymentPattern.frequencyValue || 1,
    frequencyUnit: repaymentPattern.frequencyUnit || 'months',
    periodValue: repaymentPattern.periodValue || 1,
    periodUnit: repaymentPattern.periodUnit || 'months',
    repaymentDescription: repaymentPattern.description || '',
    
    interestId: apiProduct.interestId || '',
    
    principalReceivable: glMapping.principalReceivable || '',
    interestReceivable: glMapping.interestReceivable || '',
    interestIncome: glMapping.interestIncome || '',
    feeIncome: glMapping.feeIncome || '',
    disbursementAccount: glMapping.disbursementAccount || '',
    cashAccount: glMapping.cashAccount || '',
    
    repaymentPattern: {
      frequencyValue: repaymentPattern.frequencyValue || 1,
      frequencyUnit: repaymentPattern.frequencyUnit || 'months',
      periodValue: repaymentPattern.periodValue || 1,
      periodUnit: repaymentPattern.periodUnit || 'months',
      description: repaymentPattern.description || '',
    },
    
    glMapping: {
      principalReceivable: glMapping.principalReceivable || '',
      interestReceivable: glMapping.interestReceivable || '',
      interestIncome: glMapping.interestIncome || '',
      feeIncome: glMapping.feeIncome || '',
      disbursementAccount: glMapping.disbursementAccount || '',
      cashAccount: glMapping.cashAccount || '',
    },
    
    isActive: apiProduct.isActive !== undefined ? apiProduct.isActive : true,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  };
};

  // Fetch all data on component mount
 useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch loan products - get raw response
        let productsResponse;
        try {
          productsResponse = await apiService.loans.getLoanProducts();
          console.log('Raw products response:', productsResponse);
        } catch (err) {
          console.error('Error fetching loan products:', err);
          throw err;
        }
        
        // Handle the response structure
        let apiProducts: ApiLoanProduct[] = [];
        if (productsResponse) {
          if (Array.isArray(productsResponse)) {
            apiProducts = productsResponse as unknown as ApiLoanProduct[];
          } else if (typeof productsResponse === 'object') {
            // Try different possible property names
            const responseObj = productsResponse as Record<string, unknown>;
            apiProducts = (responseObj.loanProducts || responseObj.products || responseObj.data || []) as ApiLoanProduct[];
          }
        }
        
        console.log('Extracted API products:', apiProducts);
        
        if (apiProducts.length > 0) {
          const transformedProducts = apiProducts.map(transformApiLoanProduct);
          console.log('Transformed products:', transformedProducts);
          setLoanProducts(transformedProducts);
        } else {
          console.warn('No loan products found in response');
          setLoanProducts([]);
        }
        
        // Fetch interests
        let interestsResponse;
        try {
          interestsResponse = await apiService.interests.getAll();
          console.log('Raw interests response:', interestsResponse);
        } catch (err) {
          console.error('Error fetching interests:', err);
          throw err;
        }
        
        // Handle interests response - API returns { interest: [...] }
        let interestsData: Interest[] = [];
        if (interestsResponse) {
          if (Array.isArray(interestsResponse)) {
            interestsData = interestsResponse;
          } else if (typeof interestsResponse === 'object') {
            const responseObj = interestsResponse as Record<string, unknown>;
            interestsData = (responseObj.interest || responseObj.interests || responseObj.data || []) as Interest[];
          }
        }
        
        console.log('Extracted interests:', interestsData);
        setInterests(interestsData);
        
        // Fetch GL accounts
        let accountsData;
        try {
          accountsData = await apiService.glAccounts.getAll();
          console.log('Raw GL accounts response:', accountsData);
        } catch (err) {
          console.error('Error fetching GL accounts:', err);
          throw err;
        }
        
        const glAccountsArray = Array.isArray(accountsData) ? accountsData : [];
        console.log('Extracted GL accounts:', glAccountsArray);
        setGlAccounts(glAccountsArray);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Filter products
  const filteredProducts = loanProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);

    return matchesSearch && matchesStatus;
  });

  // Permission guard
  if (!canAccessLoanProducts()) {
    return <NoAccessPage 
      message="You don't have permission to manage loan products."
      title="Access Denied - Loan Products"
    />;
  }

  // Auth loading state
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

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Please log in to access loan products.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
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

  // Loading state for data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4">Loading loan products...</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const getInterestName = (interestId: string) => {
    const interest = interests.find(i => i._id === interestId);
    return interest ? `${interest.name} (${interest.rate}% ${interest.rateType})` : 'N/A';
  };

  const getAccountName = (accountId: string) => {
    const account = glAccounts.find(a => a._id === accountId);
    return account ? `${account.glCode} - ${account.glName}` : 'N/A';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate summary stats
  const summaryStats = {
    totalProducts: loanProducts.length,
    activeProducts: loanProducts.filter(p => p.isActive).length,
    totalAmountRange: loanProducts.reduce((sum, p) => sum + p.maxAmount, 0),
  };

  // --- API HANDLERS ---

  const handleCreateProduct = async (data: z.infer<typeof createLoanProductSchema>) => {
    setIsCreating(true);
    setError(null);
    try {
      // Prepare data for API with flat structure
      const apiData: CreateLoanProductData = {
        name: data.name,
        description: data.description,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        tenure: data.tenure,
        tenureUnit: data.tenureUnit,
        interestId: data.interestId,
        frequencyValue: data.frequencyValue,
        frequencyUnit: data.frequencyUnit,
        periodValue: data.periodValue,
        periodUnit: data.periodUnit,
        repaymentDescription: data.repaymentDescription,
        principalReceivable: data.principalReceivable,
        interestReceivable: data.interestReceivable,
        interestIncome: data.interestIncome,
        feeIncome: data.feeIncome,
        disbursementAccount: data.disbursementAccount,
        cashAccount: data.cashAccount,
      };

      const apiProduct = await apiService.loans.createLoanProduct(apiData) as unknown as ApiLoanProduct;
      
      if (apiProduct) {
        const newProduct = transformApiLoanProduct(apiProduct);
        setLoanProducts(prev => [...prev, newProduct]);
        setSuccessMessage('Loan product created successfully!');
        setCreateDialogOpen(false);
        createForm.reset();
      } else {
        throw new Error('Failed to create loan product: Invalid response');
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to create loan product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create loan product. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProduct = async (data: z.infer<typeof updateLoanProductSchema>) => {
    if (!selectedProduct) return;
    
    setIsUpdating(true);
    setError(null);
    try {
      // Prepare update data with correct nested structure
      const updateData = {
        name: data.name,
        description: data.description,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        tenure: data.tenure,
        tenureUnit: data.tenureUnit,
        interestId: data.interestId,
        isActive: data.isActive,
        repaymentPattern: {
          frequencyValue: data.frequencyValue,
          frequencyUnit: data.frequencyUnit,
          periodValue: data.periodValue,
          periodUnit: data.periodUnit,
          description: data.repaymentDescription,
        },
        glMapping: {
          principalReceivable: data.principalReceivable,
          interestReceivable: data.interestReceivable,
          interestIncome: data.interestIncome,
          feeIncome: data.feeIncome,
          disbursementAccount: data.disbursementAccount,
          cashAccount: data.cashAccount,
        }
      };

      // TODO: Implement update API when available
      // For now, simulate update
      const updatedProduct: LoanProduct = {
        ...selectedProduct,
        ...data,
      };
      
      setLoanProducts(prev => prev.map(p => 
        p._id === selectedProduct._id ? updatedProduct : p
      ));
      setSuccessMessage('Loan product updated successfully!');
      setEditDialogOpen(false);
      setSelectedProduct(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to update loan product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update loan product. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      // TODO: Implement delete API when available
      // For now, simulate delete
      setLoanProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
      setSuccessMessage('Loan product deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to delete loan product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete loan product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;
    
    try {
      // TODO: Implement status toggle API when available
      // For now, simulate toggle
      setLoanProducts(prev => prev.map(p => {
        if (p._id === selectedProduct._id) {
          const updated = { 
            ...p, 
            isActive: !p.isActive,
          };
          return updated;
        }
        return p;
      }));
      
      setSuccessMessage(
        `Loan product ${selectedProduct.isActive ? 'deactivated' : 'activated'} successfully!`
      );
      setStatusDialogOpen(false);
      setSelectedProduct(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to toggle product status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product status. Please try again.');
    }
  };

  // Dialog openers
  const openCreateDialog = () => {
    createForm.reset();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (product: LoanProduct) => {
    setSelectedProduct(product);
    updateForm.reset({
      name: product.name,
      description: product.description,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      tenure: product.tenure,
      tenureUnit: product.tenureUnit as 'days' | 'months' | 'years',
      frequencyValue: product.frequencyValue,
      frequencyUnit: product.frequencyUnit as 'days' | 'weeks' | 'months' | 'years',
      periodValue: product.periodValue,
      periodUnit: product.periodUnit as 'days' | 'weeks' | 'months' | 'years',
      repaymentDescription: product.repaymentDescription,
      interestId: product.interestId,
      principalReceivable: product.principalReceivable,
      interestReceivable: product.interestReceivable,
      interestIncome: product.interestIncome,
      feeIncome: product.feeIncome,
      disbursementAccount: product.disbursementAccount,
      cashAccount: product.cashAccount,
      isActive: product.isActive,
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (product: LoanProduct) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (product: LoanProduct) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const openStatusDialog = (product: LoanProduct) => {
    setSelectedProduct(product);
    setStatusDialogOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Products</h1>
          <p className="text-gray-600 mt-2">Create and manage loan products</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          {canCreateLoanProduct() && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by product name or description..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalProducts}</div>
            <p className="text-xs text-gray-500">All loan products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.activeProducts}</div>
            <p className="text-xs text-gray-500">Available for lending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(summaryStats.totalAmountRange)}</div>
            <p className="text-xs text-gray-500">Maximum loan amount across all products</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Loan Products ({filteredProducts.length})</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {filteredProducts.length} of {loanProducts.length} products
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Loan Range</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No products found matching your filters.'
                        : 'No loan products found. Create your first loan product.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatAmount(product.minAmount)}</div>
                        <div className="text-xs text-gray-500">to {formatAmount(product.maxAmount)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{product.tenure} {product.tenureUnit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {getInterestName(product.interestId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.isActive ? 'default' : 'secondary'}
                          className={`capitalize ${product.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => openViewDialog(product)}
                            title="View Details"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdateLoanProduct() && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => openEditDialog(product)}
                              title="Edit"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openViewDialog(product)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdateLoanProduct() && (
                                <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canUpdateLoanProduct() && (
                                <DropdownMenuItem onClick={() => openStatusDialog(product)}>
                                  {product.isActive ? (
                                    <>
                                      <X className="h-4 w-4 mr-2 text-orange-500" />
                                      Deactivate Product
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-2 text-green-500" />
                                      Activate Product
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDeleteLoanProduct() && (
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(product)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Product
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- DIALOGS --- */}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Loan Product</DialogTitle>
            <DialogDescription>
              Add a new loan product to the system
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Salary Advance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="interestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interest rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interests.map((interest) => (
                            <SelectItem key={interest._id} value={interest._id}>
                              {interest.name} ({interest.rate}% {interest.rateType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="minAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount (₦) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="10000" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="maxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Amount (₦) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="300000" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="tenure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenure Value *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="1" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="tenureUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenure Unit *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenureUnitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="repaymentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repayment Description *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., One-time repayment" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Accounting Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="principalReceivable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal Receivable *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="interestReceivable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Receivable *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="interestIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Income *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="feeIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Income *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="disbursementAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disbursement Account *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="cashAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cash Account *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GL account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {glAccounts.map((account) => (
                              <SelectItem key={account._id} value={account._id}>
                                {account.glCode} - {account.glName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loan Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>
                  <Badge 
                    variant={selectedProduct.isActive ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {selectedProduct.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Loan Amount Range</p>
                  <p className="font-medium">
                    {formatAmount(selectedProduct.minAmount)} - {formatAmount(selectedProduct.maxAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tenure</p>
                  <p className="font-medium">
                    {selectedProduct.tenure} {selectedProduct.tenureUnit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Interest Rate</p>
                  <p className="font-medium">{getInterestName(selectedProduct.interestId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Repayment</p>
                  <p className="font-medium">{selectedProduct.repaymentDescription}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Accounting Configuration</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Principal Receivable</p>
                      <p>{getAccountName(selectedProduct.principalReceivable)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Interest Receivable</p>
                      <p>{getAccountName(selectedProduct.interestReceivable)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Interest Income</p>
                      <p>{getAccountName(selectedProduct.interestIncome)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fee Income</p>
                      <p>{getAccountName(selectedProduct.feeIncome)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Disbursement Account</p>
                      <p>{getAccountName(selectedProduct.disbursementAccount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cash Account</p>
                      <p>{getAccountName(selectedProduct.cashAccount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="text-sm">
                    {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm">
                    {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {canUpdateLoanProduct() && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                openEditDialog(selectedProduct!);
              }}>
                Edit Product
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure to Create Dialog but with update logic */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Loan Product</DialogTitle>
            <DialogDescription>
              Update loan product details
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(handleUpdateProduct)} className="space-y-4">
                {/* Form structure same as Create Dialog */}
                {/* For brevity, including just the critical parts */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Salary Advance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="interestId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interest rate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {interests.map((interest) => (
                              <SelectItem key={interest._id} value={interest._id}>
                                {interest.name} ({interest.rate}% {interest.rateType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={updateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount (₦) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount (₦) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="tenure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenure Value *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="tenureUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenure Unit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenureUnitOptions.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="repaymentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repayment Description *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., One-time repayment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Accounting Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={updateForm.control}
                      name="principalReceivable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principal Receivable *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="interestReceivable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Receivable *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="interestIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Income *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="feeIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Income *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="disbursementAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disbursement Account *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="cashAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cash Account *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select GL account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {glAccounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.glCode} - {account.glName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={updateForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Product Status</FormLabel>
                        <div className="text-sm text-gray-500">
                          {field.value ? 'Active - Available for new loans' : 'Inactive - Not available for new loans'}
                        </div>
                      </div>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Inactive</span>
                          <div
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              field.value ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                            onClick={() => field.onChange(!field.value)}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                field.value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </div>
                          <span className="text-sm text-gray-500">Active</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : 'Update Product'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">"{selectedProduct?.name}"</span>?
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedProduct?.isActive ? (
                <>
                  <X className="h-5 w-5 text-orange-500" />
                  Deactivate Product
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Activate Product
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {selectedProduct?.isActive ? (
                <>
                  <p>
                    You are about to deactivate <span className="font-semibold">"{selectedProduct.name}"</span>.
                  </p>
                  <p className="text-orange-600">
                    This product will no longer be available for new loans until it is reactivated.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to activate <span className="font-semibold">"{selectedProduct?.name}"</span>.
                  </p>
                  <p className="text-green-600">
                    This product will become available for new loans.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleStatus}
              className={selectedProduct?.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {selectedProduct?.isActive ? 'Deactivate Product' : 'Activate Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoanProductsPage;