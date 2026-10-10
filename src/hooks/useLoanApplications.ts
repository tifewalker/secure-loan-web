import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { loanService } from '@/services/loan.service';
import { customerService } from '@/services/customer.service';
import type { LoanApplication, Customer, LoanProduct } from '../types';

export const useLoanApplications = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingLoanProducts, setLoadingLoanProducts] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [loanProductsError, setLoanProductsError] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchApplications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const applicationsData = await loanService.getApplications();
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching loan applications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch loan applications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const fetchDropdownData = useCallback(async () => {
    if (customers.length === 0 && !loadingCustomers) {
      setLoadingCustomers(true);
      setCustomersError(null);
      try {
        const customersData = await customerService.getAll();
        const activeCustomers = customersData.filter(customer => customer.status === 'active');
        setCustomers(activeCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
        setCustomersError(errorMessage);
      } finally {
        setLoadingCustomers(false);
      }
    }

    if (loanProducts.length === 0 && !loadingLoanProducts) {
      setLoadingLoanProducts(true);
      setLoanProductsError(null);
      try {
        const loanProductsData = await loanService.getLoanProducts();
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
  }, [customers.length, loanProducts.length, loadingCustomers, loadingLoanProducts]);

  const createApplication = async (data: {
    loanProductId: string;
    customerId: string;
    principalAmount: number;
    tenure: number;
    purpose?: string;
  }): Promise<{ success: boolean; error?: string; data?: LoanApplication }> => {
    setIsCreating(true);
    try {
      const application = await loanService.createApplication(data);
      setApplications(prev => [application, ...prev]);
      return { success: true, data: application };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApplication = async (applicationId: string): Promise<{ success: boolean; error?: string }> => {
    setIsDeleting(true);
    try {
      // TODO: Implement delete API call if available
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete application';
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Status display mapping
   * Backend statuses: pending, booked, approve, disburse, closed, defaulted
   * Frontend normalizes: booked → pending, approve → approved, disburse → disbursed
   */
  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'disbursed':
        return 'Disbursed';
      case 'closed':
        return 'Closed';
      case 'defaulted':
        return 'Defaulted';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'disbursed':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'closed':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'defaulted':
        return 'text-red-700 bg-red-50 border-red-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSummaryStats = () => {
    return {
      total: applications.length,
      underReview: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      disbursed: applications.filter(app => app.status === 'disbursed').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      closed: applications.filter(app => app.status === 'closed').length,
      defaulted: applications.filter(app => app.status === 'defaulted').length,
      totalAmount: applications.reduce((sum, app) => sum + app.amount, 0),
    };
  };

  const searchApplications = (searchTerm: string, statusFilter: string) => {
    return applications.filter(app => {
      const customerName = app.customer || '';
      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.purpose && app.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.customerId && app.customerId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

 const approveApplication = async (
  applicationId: string
): Promise<{ success: boolean; error?: string; data?: LoanApplication }> => {
  setIsUpdating(true);
  try {
    const updated = await loanService.approveApplication(applicationId);
    setApplications(prev => prev.map(app => app._id === applicationId ? updated : app));
    return { success: true, data: updated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve application';
    return { success: false, error: errorMessage };
  } finally {
    setIsUpdating(false);
  }
};

const rejectApplication = async (
  applicationId: string
): Promise<{ success: boolean; error?: string; data?: LoanApplication }> => {
  setIsUpdating(true);
  try {
    const updated = await loanService.rejectApplication(applicationId);
    setApplications(prev => prev.map(app => app._id === applicationId ? updated : app));
    return { success: true, data: updated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject application';
    return { success: false, error: errorMessage };
  } finally {
    setIsUpdating(false);
  }
};

const disburseApplication = async (
  applicationId: string
): Promise<{ success: boolean; error?: string; data?: LoanApplication }> => {
  setIsUpdating(true);
  try {
    const updated = await loanService.disburseApplication(applicationId);
    setApplications(prev => prev.map(app => app._id === applicationId ? updated : app));
    return { success: true, data: updated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to disburse loan';
    return { success: false, error: errorMessage };
  } finally {
    setIsUpdating(false);
  }
};
  // Filter applications by status for specific pages
  const getPendingApplications = () => {
    return applications.filter(app => app.status === 'pending');
  };

  const getApprovedApplications = () => {
    return applications.filter(app => app.status === 'approved');
  };

  const getDisbursedApplications = () => {
    return applications.filter(app => app.status === 'disbursed');
  };

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
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
    isUpdating,
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
    approveApplication,
  rejectApplication,
  disburseApplication,
    getPendingApplications,
    getApprovedApplications,
    getDisbursedApplications,
  };
};