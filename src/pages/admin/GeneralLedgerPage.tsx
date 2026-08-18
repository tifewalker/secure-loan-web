import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, BookOpen, PlusCircle, Edit, Trash2, Eye, Download, RefreshCw,
  Check, X, Lock, LockOpen, MoreHorizontal, SlidersHorizontal, Loader2,
} from 'lucide-react';
import { useGLAccounts } from '@/hooks/useGLAccounts';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GLAccount, CreateGLAccountData, UpdateGLAccountData } from '../../types';

// Constants
const level1Categories = ['Asset', 'Liability', 'Equity', 'Income', 'Expense', 'Gain', 'Loss'];
const ifrsCategories = ['Financial Assets', 'Property, Plant & Equipment', 'Intangible Assets', 'Trade Payables', 'Borrowings', 'Equity', 'Revenue', 'Expenses', 'Taxation'];
const currencies = ['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Form schemas
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

const GeneralLedgerPage = () => {
  const {
    user,
    hasPermission,
    isAdmin,
    glAccounts,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    fetchGlAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    searchAccounts,
    getSummaryStats,
  } = useGLAccounts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null);

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

  const filteredAccounts = searchAccounts(glAccounts, searchTerm).filter(account => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && account.isActive) ||
      (statusFilter === 'inactive' && !account.isActive);
    const matchesPermission = permissionFilter === 'all' || account.transactionPermission === permissionFilter;
    const matchesCategory = categoryFilter === 'all' || account.level1Category === categoryFilter;
    return matchesStatus && matchesPermission && matchesCategory;
  });

  const summaryStats = getSummaryStats();
  const uniqueCategories = Array.from(new Set(glAccounts.map(acc => acc.level1Category)));

  const canView = hasPermission('view_gl_accounts') || isAdmin;
  const canCreate = hasPermission('create_gl_accounts') || isAdmin;
  const canUpdate = hasPermission('update_gl_accounts') || isAdmin;
  const canDelete = hasPermission('delete_gl_accounts') || isAdmin;

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Card className="w-full max-w-md shadow-none">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="size-8 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
            <p className="mb-4 text-sm text-muted-foreground">You don't have permission to view General Ledger accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateAccount = async (data: z.infer<typeof createGLAccountSchema>) => {
    const createData: CreateGLAccountData & { createdBy?: string } = {
      ...data,
      glCode: `GL${Math.floor(1000 + Math.random() * 9000)}`,
      accountNumber: `ACC${Math.floor(10000000 + Math.random() * 90000000)}`,
      transactionPermission: 'open',
      currency: 'NGN',
      createdBy: user?._id
    };

    const result = await createAccount(createData);
    if (result.success) {
      setCreateDialogOpen(false);
      createForm.reset();
    }
  };

  const handleEditAccount = async (data: z.infer<typeof updateGLAccountSchema>) => {
    if (!selectedAccount) return;

    const updateData: UpdateGLAccountData & { updatedBy?: string } = {
      ...data,
      updatedBy: user?._id
    };

    const result = await updateAccount(selectedAccount._id, updateData);
    if (result.success) {
      setEditDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    const result = await deleteAccount(selectedAccount._id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAccount) return;
    const result = await toggleAccountStatus(selectedAccount._id, selectedAccount.isActive);
    if (result.success) {
      setStatusDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['GL Code', 'Account Name', 'Account Number', 'Level 1 Category', 'Status', 'Permission', 'Currency'];
    const csvContent = [
      headers.join(','),
      ...filteredAccounts.map(acc => [
        `"${acc.glCode}"`,
        `"${acc.glName}"`,
        `"${acc.accountNumber}"`,
        `"${acc.level1Category}"`,
        `"${acc.isActive ? 'Active' : 'Inactive'}"`,
        `"${acc.transactionPermission}"`,
        `"${acc.currency}"`
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

  const openCreateDialog = () => {
    createForm.reset();
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

  if (isLoading && glAccounts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Accounts', value: summaryStats.total, icon: BookOpen },
    { label: 'Active', value: summaryStats.active, icon: Check },
    { label: 'Open Permissions', value: summaryStats.openPermissions, icon: LockOpen },
    { label: 'Closed Permissions', value: summaryStats.closedPermissions, icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center">
            <Check className="mr-2 size-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <X className="mr-2 size-4" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setError(null)} className="h-6 px-2 text-xs">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">General Ledger Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your chart of accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchGlAccounts}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreateDialog}>
              <PlusCircle className="mr-2 size-4" />
              Create Account
            </Button>
          )}
        </div>
      </div>

      {/* Stat strip */}
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

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter accounts..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[140px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={permissionFilter} onValueChange={setPermissionFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[140px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All permissions</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[140px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredAccounts.length} of {glAccounts.length} accounts
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No accounts found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono">GL Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account._id} className="group">
                  <TableCell className="font-mono font-medium">{account.glCode}</TableCell>
                  <TableCell>
                    <div className="font-medium">{account.glName}</div>
                    {account.description && (
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{account.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{account.level1Category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                      {account.transactionPermission === 'open' ? (
                        <LockOpen className="size-3" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      {account.transactionPermission}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        account.isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    >
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{account.currency}</TableCell>
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
                        <DropdownMenuItem onClick={() => { setSelectedAccount(account); setViewDialogOpen(true); }}>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        {canUpdate && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(account)}>
                              <Edit className="mr-2 size-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedAccount(account); setStatusDialogOpen(true); }}>
                              {account.isActive ? (
                                <Lock className="mr-2 size-4 text-orange-500" />
                              ) : (
                                <LockOpen className="mr-2 size-4 text-green-500" />
                              )}
                              {account.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setSelectedAccount(account); setDeleteDialogOpen(true); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete Account
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create GL Account</DialogTitle>
            <DialogDescription>Add a new GL account to the chart of accounts</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateAccount)} className="space-y-4">
              <FormField control={createForm.control} name="glName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name *</FormLabel>
                  <FormControl><Input placeholder="e.g., Cash Account" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="level1Category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level 1 Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {level1Categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="level2Category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level 2 (Optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="level3Category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level 3 (Optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={createForm.control} name="ifrsCategory" render={({ field }) => (
                <FormItem>
                  <FormLabel>IFRS Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select IFRS category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ifrsCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit GL Account</DialogTitle>
            <DialogDescription>Update GL account details</DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(handleEditAccount)} className="space-y-4">
                <FormField control={updateForm.control} name="glName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={updateForm.control} name="level1Category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level 1 Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {level1Categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={updateForm.control} name="transactionPermission" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={updateForm.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={updateForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Account'}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">GL Code</p>
                  <p className="font-mono font-medium">{selectedAccount.glCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{selectedAccount.glName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-mono">{selectedAccount.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p>{selectedAccount.currency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Permission</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedAccount.transactionPermission}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedAccount.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GL Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAccount?.glName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
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
                <><Lock className="size-5 text-orange-500" /> Deactivate Account</>
              ) : (
                <><LockOpen className="size-5 text-green-500" /> Activate Account</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {selectedAccount?.isActive ? 'deactivate' : 'activate'} "{selectedAccount?.glName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} className={selectedAccount?.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}>
              {selectedAccount?.isActive ? 'Deactivate Account' : 'Activate Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneralLedgerPage;