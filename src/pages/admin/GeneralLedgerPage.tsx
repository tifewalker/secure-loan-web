import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  BookOpen, 
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Check,
  X,
  Lock,
  LockOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import { GLAccount, CreateGLAccountData, UpdateGLAccountData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
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

// Form schemas - Updated based on your requirements
const createGLAccountSchema = z.object({
  glName: z.string().min(1, 'Account Name is required'),
  level1Category: z.string().min(1, 'Category is required'),
  level2Category: z.string().optional(),
  level3Category: z.string().optional(),
  ifrsCategory: z.string().optional(),
  description: z.string().optional(),
});

const updateGLAccountSchema = z.object({
  glName: z.string().min(1, 'Account Name is required'),
  level1Category: z.string().min(1, 'Category is required'),
  level2Category: z.string().optional(),
  level3Category: z.string().optional(),
  ifrsCategory: z.string().optional(),
  description: z.string().optional(),
  transactionPermission: z.enum(['open', 'closed']),
  status: z.enum(['active', 'inactive']),
  currency: z.string().min(1, 'Currency is required'),
});

// Categories for dropdowns
const level1Categories = [
  'Asset',
  'Liability',
  'Equity',
  'Income',
  'Expense',
  'Gain',
  'Loss'
];

// IFRS Categories
const ifrsCategories = [
  'Financial Assets',
  'Property, Plant & Equipment',
  'Intangible Assets',
  'Trade Payables',
  'Borrowings',
  'Equity',
  'Revenue',
  'Expenses',
  'Taxation'
];

const currencies = ['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Status filter options
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

// Permission filter options
const permissionOptions = [
  { value: 'all', label: 'All Permissions' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' }
];

const GeneralLedgerPage = () => {
  const { user } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions(); 
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Selected account for operations
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null);

  // Forms - Updated based on your requirements
  const createForm = useForm<z.infer<typeof createGLAccountSchema>>({
    resolver: zodResolver(createGLAccountSchema),
    defaultValues: {
      glName: '',
      level1Category: '',
      level2Category: '',
      level3Category: '',
      ifrsCategory: '',
      description: '',
    },
  });

  const updateForm = useForm<z.infer<typeof updateGLAccountSchema>>({
    resolver: zodResolver(updateGLAccountSchema),
  });

  // Fetch GL accounts on component mount
  useEffect(() => {
     if (!hasPermission('view_gl_accounts')) {
    setIsLoading(false);
    return;
  }
    fetchGlAccounts();
  }, []);

  // Filter accounts based on search term and filters
  const filteredAccounts = glAccounts.filter(account => {
    // Search filter
    const matchesSearch = 
      account.glName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.glCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm) ||
      (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && account.isActive) ||
      (statusFilter === 'inactive' && !account.isActive);
    
    // Permission filter
    const matchesPermission = permissionFilter === 'all' || 
      account.transactionPermission === permissionFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || 
      account.level1Category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPermission && matchesCategory;
  });

  const fetchGlAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await apiService.glAccounts.getAll();
      setGlAccounts(accounts);
    } catch (err) {
      console.error('Failed to fetch GL accounts:', err);
      setError('Failed to load GL accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- CREATE ---
  const handleCreateAccount = async (data: z.infer<typeof createGLAccountSchema>) => {
     if (!hasPermission('create_gl_accounts')) {
    setError('You do not have permission to create GL accounts');
    return;
  }
  
  setIsCreating(true);
  setError(null);
    try {
      const createData: CreateGLAccountData & { createdBy?: string } = {
        ...data,
        glCode: `GL${Math.floor(1000 + Math.random() * 9000)}`, // Auto-generate GL Code
        accountNumber: `ACC${Math.floor(10000000 + Math.random() * 90000000)}`, // Auto-generate Account Number
        transactionPermission: 'open', // Default value
        currency: 'NGN', // Default value
        createdBy: user?._id
      };

      const newAccount = await apiService.glAccounts.create(createData);
      
      // Add to list
      setGlAccounts(prev => [...prev, newAccount]);
      setSuccessMessage('GL Account created successfully!');
      setCreateDialogOpen(false);
      createForm.reset();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to create GL account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create GL account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // --- UPDATE ---
  const handleEditAccount = async (data: z.infer<typeof updateGLAccountSchema>) => {
    if (!selectedAccount) return;
    
    if (!hasPermission('update_gl_accounts')) {
    setError('You do not have permission to update GL accounts');
    return;
  }
  
  setIsUpdating(true);
  setError(null);
    try {
      const updateData: UpdateGLAccountData & { updatedBy?: string } = {
        ...data,
        updatedBy: user?._id
      };

      const updatedAccount = await apiService.glAccounts.update(selectedAccount._id, updateData);
      
      // Update in list
      setGlAccounts(prev => prev.map(acc => 
        acc._id === selectedAccount._id ? updatedAccount : acc
      ));
      setSuccessMessage('GL Account updated successfully!');
      setEditDialogOpen(false);
      setSelectedAccount(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to update GL account:', err);
      setError(err instanceof Error ? err.message : 'Failed to update GL account. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- DELETE ---
  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
     if (!hasPermission('delete_gl_accounts')) {
    setError('You do not have permission to delete GL accounts');
    return;
  }
  
  setIsDeleting(true);
  setError(null);
    try {
      await apiService.glAccounts.delete(selectedAccount._id);
      
      // Remove from list
      setGlAccounts(prev => prev.filter(acc => acc._id !== selectedAccount._id));
      setSuccessMessage('GL Account deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to delete GL account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete GL account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- TOGGLE STATUS ---
  const handleToggleStatus = async () => {
    if (!selectedAccount) return;
    
     if (!hasPermission('update_gl_accounts')) {
    setError('You do not have permission to update GL accounts');
    return;
  }

    try {
      await apiService.glAccounts.toggleStatus(selectedAccount._id, selectedAccount.isActive);
      
      // Update in list
      setGlAccounts(prev => prev.map(acc => {
        if (acc._id === selectedAccount._id) {
          return {
            ...acc,
            isActive: !acc.isActive,
            status: acc.isActive ? 'inactive' : 'active'
          };
        }
        return acc;
      }));
      
      setSuccessMessage(
        `GL Account ${selectedAccount.isActive ? 'deactivated' : 'activated'} successfully!`
      );
      setStatusDialogOpen(false);
      setSelectedAccount(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to toggle account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account status. Please try again.');
    }
  };

  // --- OPEN DIALOGS ---
  const openCreateDialog = () => {
    createForm.reset({
      glName: '',
      level1Category: '',
      level2Category: '',
      level3Category: '',
      ifrsCategory: '',
      description: '',
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (account: GLAccount) => {
    setSelectedAccount(account);
    updateForm.reset({
      glName: account.glName,
      level1Category: account.level1Category,
      level2Category: account.level2Category || '',
      level3Category: account.level3Category || '',
      ifrsCategory: account.ifrsCategory || '',
      description: account.description || '',
      transactionPermission: account.transactionPermission,
      status: account.status,
      currency: account.currency,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (account: GLAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const openStatusDialog = (account: GLAccount) => {
    setSelectedAccount(account);
    setStatusDialogOpen(true);
  };

  const openViewDialog = (account: GLAccount) => {
    setSelectedAccount(account);
    setViewDialogOpen(true);
  };

  // --- EXPORT ---
  const handleExportCSV = () => {
    const headers = [
      'GL Code',
      'Account Name',
      'Account Number',
      'Level 1 Category',
      'Level 2 Category',
      'Level 3 Category',
      'IFRS Category',
      'Status',
      'Permission',
      'Currency',
      'Description',
      'Created At'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredAccounts.map(acc => [
        `"${acc.glCode}"`,
        `"${acc.glName}"`,
        `"${acc.accountNumber}"`,
        `"${acc.level1Category}"`,
        `"${acc.level2Category || ''}"`,
        `"${acc.level3Category || ''}"`,
        `"${acc.ifrsCategory || ''}"`,
        `"${acc.isActive ? 'Active' : 'Inactive'}"`,
        `"${acc.transactionPermission}"`,
        `"${acc.currency}"`,
        `"${acc.description || ''}"`,
        `"${acc.createdAt ? format(new Date(acc.createdAt), 'yyyy-MM-dd') : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gl-accounts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setPermissionFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
  };

  // Calculate summary stats
  const activeAccounts = glAccounts.filter(acc => acc.isActive).length;
  const inactiveAccounts = glAccounts.filter(acc => !acc.isActive).length;
  const openAccounts = glAccounts.filter(acc => acc.transactionPermission === 'open').length;
  const closedAccounts = glAccounts.filter(acc => acc.transactionPermission === 'closed').length;

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(glAccounts.map(acc => acc.level1Category)));

  if (!hasPermission('view_gl_accounts')) {
  return (
    <div className="flex items-center justify-center h-64">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view General Ledger accounts.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

  if (isLoading && glAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading GL accounts...</p>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setError(null)}
              className="h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Ledger Accounts</h1>
          <p className="text-gray-600 mt-2">Manage your chart of accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchGlAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
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
         {hasPermission('create_gl_accounts') && (
  <Button onClick={openCreateDialog}>
    <PlusCircle className="h-4 w-4 mr-2" />
    Create Account
  </Button>
)}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission</label>
                <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{glAccounts.length}</div>
            <p className="text-xs text-gray-500">All GL accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAccounts}</div>
            <p className="text-xs text-gray-500">Available for transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Permissions</CardTitle>
            <LockOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openAccounts}</div>
            <p className="text-xs text-gray-500">Accounts open for transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Permissions</CardTitle>
            <Lock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{closedAccounts}</div>
            <p className="text-xs text-gray-500">Accounts closed for transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by account name, GL code, account number, or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* GL Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>GL Accounts ({filteredAccounts.length})</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {filteredAccounts.length} of {glAccounts.length} accounts
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GL Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== 'all' || permissionFilter !== 'all' || categoryFilter !== 'all'
                        ? 'No accounts found matching your filters.'
                        : 'No GL accounts found. Create your first GL account.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account._id} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-medium">
                        {account.glCode}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{account.glName}</div>
                        {account.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {account.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {account.accountNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {account.level1Category}
                        </Badge>
                        {(account.level2Category || account.level3Category) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {account.level2Category && <span>{account.level2Category}</span>}
                            {account.level3Category && <span> › {account.level3Category}</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={account.transactionPermission === 'open' ? 'default' : 'secondary'}
                          className="capitalize flex items-center gap-1"
                        >
                          {account.transactionPermission === 'open' ? (
                            <LockOpen className="h-3 w-3" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          {account.transactionPermission}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={account.isActive ? 'default' : 'secondary'}
                          className={`capitalize ${account.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{account.currency}</div>
                      </TableCell>
                     <TableCell className="text-right">
  <div className="flex justify-end gap-2">
    {/* View button - show if user has view permission */}
    <Button 
      size="sm" 
      variant="ghost"
      onClick={() => openViewDialog(account)}
      title="View Details"
      className="h-8 w-8 p-0"
    >
      <Eye className="h-4 w-4" />
    </Button>
    
    {/* Edit button - show if user has update permission */}
    {hasPermission('update_gl_accounts') && (
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => openEditDialog(account)}
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
        <DropdownMenuItem onClick={() => openViewDialog(account)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        
        {/* Edit option - show if user has update permission */}
        {hasPermission('update_gl_accounts') && (
          <DropdownMenuItem onClick={() => openEditDialog(account)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Account
          </DropdownMenuItem>
        )}
        
        {/* Status toggle option - show if user has update permission */}
        {hasPermission('update_gl_accounts') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openStatusDialog(account)}>
              {account.isActive ? (
                <>
                  <Lock className="h-4 w-4 mr-2 text-orange-500" />
                  Deactivate Account
                </>
              ) : (
                <>
                  <LockOpen className="h-4 w-4 mr-2 text-green-500" />
                  Activate Account
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        
        {/* Delete option - show if user has delete permission */}
        {hasPermission('delete_gl_accounts') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => openDeleteDialog(account)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </DropdownMenuItem>
          </>
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create GL Account</DialogTitle>
            <DialogDescription>
              Add a new GL account to the chart of accounts
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateAccount)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="glName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cash Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="level1Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level 1 Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {level1Categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="level2Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level 2 Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Current Assets" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="level3Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level 3 Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cash & Cash Equivalents" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="ifrsCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFRS Category (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select IFRS category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ifrsCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter account description..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCreateDialogOpen(false);
                    createForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit GL Account</DialogTitle>
            <DialogDescription>
              Update GL account details (GL Code and Account Number cannot be changed)
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(handleEditAccount)} className="space-y-4">
                {/* Display GL Code and Account Number as read-only */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GL Code</label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50 text-gray-500">
                      {selectedAccount.glCode}
                    </div>
                    <p className="text-xs text-gray-500">Cannot be changed</p>
                  </div>
                </div>
                
                <FormField
                  control={updateForm.control}
                  name="glName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={updateForm.control}
                  name="level1Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level 1 Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {level1Categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="level2Category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level 2 Category (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="level3Category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level 3 Category (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={updateForm.control}
                  name="ifrsCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFRS Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select IFRS category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ifrsCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="transactionPermission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permission</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
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
                    ) : 'Update Account'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>GL Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">GL Code</p>
                  <p className="font-mono font-medium">{selectedAccount.glCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Name</p>
                  <p className="font-medium">{selectedAccount.glName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-mono">{selectedAccount.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p>{selectedAccount.currency}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Category Hierarchy</p>
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{selectedAccount.level1Category}</p>
                    {selectedAccount.level2Category && (
                      <p className="text-sm text-gray-600 ml-2">→ {selectedAccount.level2Category}</p>
                    )}
                    {selectedAccount.level3Category && (
                      <p className="text-sm text-gray-600 ml-4">→ {selectedAccount.level3Category}</p>
                    )}
                  </div>
                </div>

                {selectedAccount.ifrsCategory && (
                  <div>
                    <p className="text-sm text-gray-500">IFRS Category</p>
                    <p>{selectedAccount.ifrsCategory}</p>
                  </div>
                )}
              </div>

              {selectedAccount.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{selectedAccount.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction Permission</p>
                  <Badge 
                    variant={selectedAccount.transactionPermission === 'open' ? 'default' : 'secondary'}
                    className="capitalize mt-1"
                  >
                    {selectedAccount.transactionPermission === 'open' ? (
                      <LockOpen className="h-3 w-3 mr-1" />
                    ) : (
                      <Lock className="h-3 w-3 mr-1" />
                    )}
                    {selectedAccount.transactionPermission}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge 
                    variant={selectedAccount.isActive ? 'default' : 'secondary'}
                    className={`capitalize mt-1 ${selectedAccount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {selectedAccount.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="text-sm">
                    {selectedAccount.createdAt ? format(new Date(selectedAccount.createdAt), 'PPP') : '—'}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm">
                    {selectedAccount.updatedAt ? format(new Date(selectedAccount.updatedAt), 'PPP') : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setViewDialogOpen(false);
                openEditDialog(selectedAccount!);
              }}
            >
              Edit Account
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setViewDialogOpen(false);
                openStatusDialog(selectedAccount!);
              }}
            >
              {selectedAccount?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GL Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">"{selectedAccount?.glName}"</span>?
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedAccount?.isActive ? (
                <>
                  <Lock className="h-5 w-5 text-orange-500" />
                  Deactivate Account
                </>
              ) : (
                <>
                  <LockOpen className="h-5 w-5 text-green-500" />
                  Activate Account
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {selectedAccount?.isActive ? (
                <>
                  <p>
                    You are about to deactivate <span className="font-semibold">"{selectedAccount.glName}"</span>.
                  </p>
                  <p className="text-orange-600">
                    This account will no longer be available for transactions until it is reactivated.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to activate <span className="font-semibold">"{selectedAccount?.glName}"</span>.
                  </p>
                  <p className="text-green-600">
                    This account will become available for transactions.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleStatus}
              className={selectedAccount?.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {selectedAccount?.isActive ? 'Deactivate Account' : 'Activate Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneralLedgerPage;