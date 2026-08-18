import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { customerService } from '@/services/customer.service';
import type { Customer, CreateCustomerData } from '@/types';

export const useCustomers = () => {
  const { user, isAuthenticated, isLoading: authLoading, authInitialized } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customersData = await customerService.getAll();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
      setError(errorMessage);
      
      if (errorMessage.includes('session expired') || errorMessage.includes('401') || errorMessage.includes('token')) {
        setError('Your session has expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authInitialized || !isAuthenticated) return;
    
    const userCanView = user?.permissions?.includes('view_customers') || user?.role === 'admin';
    if (!userCanView) return;
    
    fetchCustomers();
  }, [authInitialized, isAuthenticated, user, fetchCustomers]);

  const createCustomer = async (customerData: CreateCustomerData) => {
    try {
      const result = await customerService.create(customerData);
      if (result.success) {
        await fetchCustomers();
        return { success: true };
      }
      return { success: false, error: 'Failed to create customer' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      return { success: false, error: errorMessage };
    }
  };

  const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
    try {
      await customerService.toggleStatus(customerId, currentStatus);
      await fetchCustomers();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer status';
      return { success: false, error: errorMessage };
    }
  };

  const searchCustomers = (searchTerm: string) => {
    if (!searchTerm) return customers;

    const searchLower = searchTerm.toLowerCase();
    return customers.filter(customer => {
      const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const id = (customer._id || '').toLowerCase();
      const phone = customer.phoneNumber || '';
      const idNumber = (customer.identificationNumber || '').toLowerCase();

      return (
        customerName.includes(searchLower) ||
        email.includes(searchLower) ||
        id.includes(searchLower) ||
        phone.includes(searchTerm) ||
        idNumber.includes(searchLower)
      );
    });
  };

  const getSummaryStats = () => {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      totalLoans: customers.reduce((sum, c) => sum + (c.totalLoans || 0), 0),
      activeLoans: customers.reduce((sum, c) => sum + (c.activeLoans || 0), 0),
    };
  };

  return {
    user,
    isAuthenticated,
    authLoading,
    authInitialized,
    hasPermission,
    isAdmin,
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    toggleCustomerStatus,
    searchCustomers,
    getSummaryStats,
  };
};