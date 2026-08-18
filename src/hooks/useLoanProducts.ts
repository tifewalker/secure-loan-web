import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { loanService } from '@/services/loan.service';
import { interestService } from '@/services/interest.service';
import { glAccountService } from '@/services/gl-account.service';
import type { LoanProduct, CreateLoanProductData, Interest, GLAccount } from '../types';

export const useLoanProducts = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [productsData, interestsData, accountsData] = await Promise.all([
        loanService.getLoanProducts(),
        interestService.getAll(),
        glAccountService.getAll()
      ]);
      
      setLoanProducts(productsData);
      setInterests(interestsData);
      setGlAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createProduct = async (data: CreateLoanProductData): Promise<{ success: boolean; error?: string; data?: LoanProduct }> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const newProduct = await loanService.createLoanProduct(data);
      setLoanProducts(prev => [...prev, newProduct]);
      return { success: true, data: newProduct };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create loan product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  const updateProduct = async (productId: string, data: CreateLoanProductData): Promise<{ success: boolean; error?: string; data?: LoanProduct }> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const updatedProduct = await loanService.updateLoanProduct(productId, data);
      setLoanProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p));
      return { success: true, data: updatedProduct };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update loan product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await loanService.deleteLoanProduct(productId);
      if (result.success) {
        setLoanProducts(prev => prev.filter(p => p._id !== productId));
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete loan product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string; data?: LoanProduct }> => {
    try {
      const updatedProduct = await loanService.toggleLoanProductActivation(productId, currentStatus);
      setLoanProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p));
      return { success: true, data: updatedProduct };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getInterestName = (interestId: string): string => {
    const interest = interests.find(i => i._id === interestId);
    return interest ? `${interest.name} (${interest.rate}% ${interest.rateType})` : 'N/A';
  };

  const getAccountName = (accountId: string): string => {
    const account = glAccounts.find(a => a._id === accountId);
    return account ? `${account.glCode} - ${account.glName}` : 'N/A';
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSummaryStats = () => ({
    totalProducts: loanProducts.length,
    activeProducts: loanProducts.filter(p => p.isActive).length,
    totalAmountRange: loanProducts.reduce((sum, p) => sum + p.maxAmount, 0),
  });

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    loanProducts,
    interests,
    glAccounts,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    fetchData,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getInterestName,
    getAccountName,
    formatAmount,
    getSummaryStats,
  };
};