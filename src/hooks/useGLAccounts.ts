import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { glAccountService } from '@/services/gl-account.service';
import type { GLAccount, CreateGLAccountData, UpdateGLAccountData } from '../types';

export const useGLAccounts = () => {
  const { user } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use a ref to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  const fetchGlAccounts = useCallback(async () => {
    // Prevent duplicate concurrent fetches
    if (fetchInProgressRef.current) return;
    
    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const accounts = await glAccountService.getAll();
      setGlAccounts(accounts);
    } catch (err) {
      console.error('Failed to fetch GL accounts:', err);
      setError('Failed to load GL accounts. Please try again.');
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount, never again
    if (hasFetchedRef.current) return;
    
    const canView = hasPermission('view_gl_accounts') || isAdmin;
    
    if (canView) {
      hasFetchedRef.current = true;
      fetchGlAccounts();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  const createAccount = async (data: CreateGLAccountData & { createdBy?: string }): Promise<{ success: boolean; error?: string; data?: GLAccount }> => {
    if (!hasPermission('create_gl_accounts') && !isAdmin) {
      return { success: false, error: 'You do not have permission to create GL accounts' };
    }

    setIsCreating(true);
    setError(null);
    try {
      const newAccount = await glAccountService.create(data);
      setGlAccounts(prev => [...prev, newAccount]);
      setSuccessMessage('GL Account created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      return { success: true, data: newAccount };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create GL account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  const updateAccount = async (accountId: string, data: UpdateGLAccountData & { updatedBy?: string }): Promise<{ success: boolean; error?: string; data?: GLAccount }> => {
    if (!hasPermission('update_gl_accounts') && !isAdmin) {
      return { success: false, error: 'You do not have permission to update GL accounts' };
    }

    setIsUpdating(true);
    setError(null);
    try {
      const updatedAccount = await glAccountService.update(accountId, data);
      setGlAccounts(prev => prev.map(acc => acc._id === accountId ? updatedAccount : acc));
      setSuccessMessage('GL Account updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      return { success: true, data: updatedAccount };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update GL account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAccount = async (accountId: string): Promise<{ success: boolean; error?: string }> => {
    if (!hasPermission('delete_gl_accounts') && !isAdmin) {
      return { success: false, error: 'You do not have permission to delete GL accounts' };
    }

    setIsDeleting(true);
    setError(null);
    try {
      await glAccountService.delete(accountId);
      setGlAccounts(prev => prev.filter(acc => acc._id !== accountId));
      setSuccessMessage('GL Account deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete GL account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!hasPermission('update_gl_accounts') && !isAdmin) {
      return { success: false, error: 'You do not have permission to update GL accounts' };
    }

    try {
      await glAccountService.toggleStatus(accountId, currentStatus);
      setGlAccounts(prev => prev.map(acc => {
        if (acc._id === accountId) {
          return { ...acc, isActive: !acc.isActive, status: acc.isActive ? 'inactive' : 'active' };
        }
        return acc;
      }));
      setSuccessMessage(`GL Account ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const searchAccounts = (accounts: GLAccount[], searchTerm: string) => {
    if (!searchTerm) return accounts;
    return accounts.filter(account =>
      account.glName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.glCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm) ||
      (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getSummaryStats = () => ({
    total: glAccounts.length,
    active: glAccounts.filter(acc => acc.isActive).length,
    openPermissions: glAccounts.filter(acc => acc.transactionPermission === 'open').length,
    closedPermissions: glAccounts.filter(acc => acc.transactionPermission === 'closed').length,
  });

  return {
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
  };
};