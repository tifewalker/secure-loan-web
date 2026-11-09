import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Plus, User as UserIcon, MoreHorizontal,
  SlidersHorizontal, Ban, ShieldCheck, Loader2, Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Customer } from '@/api';
import type { AuthUser } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { customerName, type CustomerLoanCounts } from './customer-utils';

interface CustomerListProps {
  customers: Customer[];
  /** Loan counts keyed by customer _id. */
  loanCounts: Map<string, CustomerLoanCounts>;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewCustomer: (customer: Customer) => void;
  onAddCustomer: () => void;
  hasPermission: (permission: string) => boolean;
  onToggleStatus: (customerId: string) => Promise<{ success: boolean; status?: string; error?: string }>;
  onDeleteCustomer: (customerId: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting: boolean;
  user: AuthUser | null;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loanCounts,
  isLoading,
  error,
  onRetry,
  onViewCustomer,
  onAddCustomer,
  hasPermission,
  onToggleStatus,
  onDeleteCustomer,
  isDeleting,
  user,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleDelete = async () => {
    if (!customerToDelete?._id) return;
    const result = await onDeleteCustomer(customerToDelete._id);
    if (result.success) {
      toast({ title: 'Customer deleted', description: `${customerName(customerToDelete)} and their wallet were removed.` });
      setCustomerToDelete(null);
    } else {
      toast({ title: 'Failed to delete customer', description: result.error, variant: 'destructive' });
    }
  };

  const search = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (statusFilter !== 'all' && customer.status !== statusFilter) return false;
    if (!search) return true;
    return [
      customerName(customer),
      customer.email,
      customer.customerId,
      customer._id,
      customer.phoneNumber,
      customer.meansOfIdentification?.identificationNumber,
    ].some((value) => value?.toLowerCase().includes(search));
  });

  const countsFor = (customer: Customer) => (customer._id && loanCounts.get(customer._id)) || { total: 0, active: 0 };

  const handleToggleStatus = async (customer: Customer) => {
    if (!customer._id) return;
    const action = customer.status === 'active' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${customerName(customer)}?`)) return;

    const result = await onToggleStatus(customer._id);
    if (result.success) {
      toast({ title: `Customer ${action}d`, description: `${customerName(customer)} is now ${result.status ?? `${action}d`}.` });
    } else {
      toast({ title: `Failed to ${action} customer`, description: result.error, variant: 'destructive' });
    }
  };

  let totalLoans = 0;
  let activeLoans = 0;
  loanCounts.forEach(({ total, active }) => {
    totalLoans += total;
    activeLoans += active;
  });

  const statCards = [
    { label: 'Total', value: customers.length, sub: 'All customers', icon: UserIcon },
    { label: 'Active', value: customers.filter((c) => c.status === 'active').length, sub: 'Currently active', icon: ShieldCheck },
    { label: 'Total Loans', value: totalLoans, sub: 'All time', icon: Ban },
    { label: 'Active Loans', value: activeLoans, sub: 'Currently active', icon: Plus },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer accounts and information
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Logged in as: {user?.fullName} ({user?.roleName || user?.role}){user?.department ? ` - ${user.department}` : ''}
          </p>
        </div>
        {hasPermission('create_customers') && (
          <Button size="sm" onClick={onAddCustomer}>
            <Plus className="mr-2 size-4" />
            Add New Customer
          </Button>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by name, email, or ID..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
              {(error.includes('session') || error.includes('token')) && (
                <Button variant="destructive" size="sm" onClick={() => (window.location.href = '/login')}>
                  Login Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <UserIcon className="size-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {searchTerm || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by adding your first customer.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Total Loans</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Active Loans</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Customer ID</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer._id}
                  className="group border-b transition-colors last:border-b-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserIcon className="size-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {customerName(customer)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {customer.email} • {customer.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        customer.status === 'active'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }
                    >
                      {customer.status || 'inactive'}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums md:table-cell">
                    {countsFor(customer).total}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums md:table-cell">
                    {countsFor(customer).active}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums md:table-cell">
                    {customer.customerId || '—'}
                  </td>
                  <td className="px-2 py-3">
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
                        <DropdownMenuItem onClick={() => onViewCustomer(customer)}>
                          <UserIcon className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        {hasPermission('update_customers') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(customer)}>
                              {customer.status === 'active' ? (
                                <Ban className="mr-2 size-4 text-orange-500" />
                              ) : (
                                <ShieldCheck className="mr-2 size-4 text-green-500" />
                              )}
                              {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasPermission('delete_customers') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCustomerToDelete(customer)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        title="Delete customer?"
        description={
          customerToDelete && (
            <>
              This permanently deletes <strong>{customerName(customerToDelete)}</strong> and their wallet. This cannot
              be undone.
            </>
          )
        }
        confirmLabel="Delete customer"
        destructive
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};