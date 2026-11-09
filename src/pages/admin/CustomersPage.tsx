import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getErrorMessage,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useLoanReport,
  useToggleCustomerActivation,
  useUploadDocument,
  type CreateCustomerRequest,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerForm, type CustomerFormDocuments } from '@/components/customers/CustomerForm';
import { CustomerDetails } from '@/components/customers/CustomerDetails';
import { CREATE_FORM_DOCUMENTS, loanCountsByCustomer } from '@/components/customers/customer-utils';
import NoAccessPage from '@/components/NoAccessPage';

const CustomersPage = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission('view_customers');

  const customersQuery = useCustomers({ enabled: isAuthenticated && canView });
  // Loan counts per customer; the page still works if the report is unavailable.
  const loansQuery = useLoanReport('all', { enabled: isAuthenticated && canView });
  const loanCounts = useMemo(() => loanCountsByCustomer(loansQuery.data), [loansQuery.data]);

  const createCustomer = useCreateCustomer();
  const uploadDocument = useUploadDocument();
  const toggleActivation = useToggleCustomerActivation();
  const deleteCustomer = useDeleteCustomer();

  if (authLoading || !authInitialized) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please log in to access customers.</div>;
  }

  if (!canView) {
    return <NoAccessPage message="You don't have permission to view customers." title="Access Denied - Customers" />;
  }

  /** Creates the customer, then uploads each attached document against them. */
  const handleCreate = async (data: CreateCustomerRequest, documents: CustomerFormDocuments) => {
    try {
      const { customer, message } = await createCustomer.mutateAsync(data);

      const failed: string[] = [];
      if (customer?._id) {
        for (const { field, type, label } of CREATE_FORM_DOCUMENTS) {
          const file = documents[field];
          if (!file) continue;
          try {
            await uploadDocument.mutateAsync({ customerId: customer._id, file, documentType: type });
          } catch (err) {
            failed.push(`${label} (${getErrorMessage(err)})`);
          }
        }
      }

      toast({ title: 'Customer created', description: message || 'The customer account was created.' });
      if (failed.length) {
        toast({
          title: 'Some documents were not uploaded',
          description: `${failed.join(', ')}. You can upload them from the customer's details page.`,
          variant: 'destructive',
        });
      }
      setCurrentView('list');
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Failed to create customer') };
    }
  };

  const handleToggleStatus = async (customerId: string) => {
    try {
      const result = await toggleActivation.mutateAsync(customerId);
      return { success: true, status: result.status };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Failed to update customer status') };
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Failed to delete customer') };
    }
  };

  if (currentView === 'create') {
    if (!hasPermission('create_customers')) {
      return <NoAccessPage message="You don't have permission to create customers." title="Access Denied - Create Customer" />;
    }
    return (
      <CustomerForm
        onSubmit={handleCreate}
        onCancel={() => setCurrentView('list')}
        userFullName={user?.fullName}
        userRole={user?.role}
      />
    );
  }

  if (currentView === 'details' && selectedCustomerId) {
    return <CustomerDetails customerId={selectedCustomerId} onBack={() => setCurrentView('list')} />;
  }

  return (
    <CustomerList
      customers={customersQuery.data ?? []}
      loanCounts={loanCounts}
      isLoading={customersQuery.isLoading}
      error={customersQuery.error ? getErrorMessage(customersQuery.error, 'Failed to fetch customers') : null}
      onRetry={() => customersQuery.refetch()}
      onViewCustomer={(customer) => {
        if (!customer._id) return;
        setSelectedCustomerId(customer._id);
        setCurrentView('details');
      }}
      onAddCustomer={() => setCurrentView('create')}
      hasPermission={hasPermission}
      onToggleStatus={handleToggleStatus}
      onDeleteCustomer={handleDelete}
      isDeleting={deleteCustomer.isPending}
      user={user}
    />
  );
};

export default CustomersPage;
