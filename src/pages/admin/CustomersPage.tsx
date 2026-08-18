import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { CustomerDetails } from '@/components/customers/CustomerDetails';
import NoAccessPage from '@/components/NoAccessPage';
import type { Customer } from '../../types';

const CustomersPage = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const {
    user,
    isAuthenticated,
    authLoading,
    authInitialized,
    hasPermission,
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    toggleCustomerStatus,
    searchCustomers,
    getSummaryStats,
  } = useCustomers();

  if (authLoading || !authInitialized) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access customers.</div>;
  }

  if (!hasPermission('view_customers')) {
    return <NoAccessPage message="You don't have permission to view customers." title="Access Denied - Customers" />;
  }

  if (currentView === 'create') {
    if (!hasPermission('create_customers')) {
      return <NoAccessPage message="You don't have permission to create customers." title="Access Denied - Create Customer" />;
    }
    return (
      <CustomerForm
        onSubmit={createCustomer}
        onCancel={() => setCurrentView('list')}
        userFullName={user?.fullName}
        userRole={user?.role}
      />
    );
  }

  if (currentView === 'details' && selectedCustomer) {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        onBack={() => setCurrentView('list')}
      />
    );
  }

  return (
    <CustomerList
      customers={customers}
      isLoading={isLoading}
      error={error}
      onRetry={fetchCustomers}
      onViewCustomer={(customer) => {
        setSelectedCustomer(customer);
        setCurrentView('details');
      }}
      onAddCustomer={() => setCurrentView('create')}
      searchCustomers={searchCustomers}
      summaryStats={getSummaryStats()}
      hasPermission={hasPermission}
      onToggleStatus={toggleCustomerStatus}
      user={user}
    />
  );
};

export default CustomersPage;