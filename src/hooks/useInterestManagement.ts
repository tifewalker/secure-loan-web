import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { interestService } from '@/services/interest.service';
import { glAccountService } from '@/services/gl-account.service';
import type { Interest, CreateInterestData, UpdateInterestData, GLAccount } from '../types';

export const useInterestManagement = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  
  const [interests, setInterests] = useState<Interest[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [glAccountsLoading, setGlAccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccessInterestManagement = useCallback(() => {
    return isAdmin || hasPermission('view_interests');
  }, [isAdmin, hasPermission]);

  const canCreateInterest = useCallback(() => isAdmin || hasPermission('create_interests'), [isAdmin, hasPermission]);
  const canEditInterest = useCallback(() => isAdmin || hasPermission('update_interests'), [isAdmin, hasPermission]);
  const canDeleteInterest = useCallback(() => isAdmin || hasPermission('delete_interests'), [isAdmin, hasPermission]);
  const canToggleInterest = useCallback(() => isAdmin || hasPermission('update_interests'), [isAdmin, hasPermission]);

  const fetchInterests = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const interestsData = await interestService.getAll();
      setInterests(interestsData);
    } catch (error) {
      console.error('Error fetching interest rates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interest rates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchGLAccounts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setGlAccountsLoading(true);
    try {
      const accounts = await glAccountService.getAll();
      setGlAccounts(accounts);
    } catch (error) {
      console.error('Error fetching GL accounts:', error);
    } finally {
      setGlAccountsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchInterests();
    fetchGLAccounts();
  }, [fetchInterests, fetchGLAccounts]);

  const getGLAccountByCode = (glCode: string): GLAccount | undefined => {
    return glAccounts.find(acc => acc.glCode === glCode);
  };

  const getGLAccountName = (glCode: string): string => {
    if (!glCode) return 'Not set';
    const account = getGLAccountByCode(glCode);
    return account ? account.glName : `GL Code: ${glCode}`;
  };

  const getGLAccountDisplay = (glCode: string): { name: string; code: string; status: string; category: string } => {
    const account = getGLAccountByCode(glCode);
    if (!account) {
      return { name: 'Account not found', code: glCode, status: 'unknown', category: '' };
    }
    return {
      name: account.glName,
      code: account.glCode,
      status: account.status,
      category: account.level1Category
    };
  };

  const createInterest = async (data: CreateInterestData): Promise<{ success: boolean; error?: string; data?: Interest }> => {
    try {
      if (!data.name.trim()) return { success: false, error: "Interest rate name is required" };
      if (data.rate <= 0) return { success: false, error: "Interest rate must be greater than 0" };
      if (!data.glInterestIncome.trim()) return { success: false, error: "GL Interest Income account is required" };

      const createdInterest = await interestService.create(data);
      setInterests(prev => [...prev, createdInterest]);
      return { success: true, data: createdInterest };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create interest rate';
      return { success: false, error: errorMessage };
    }
  };

  const updateInterest = async (interestId: string, data: UpdateInterestData): Promise<{ success: boolean; error?: string; data?: Interest }> => {
    try {
      if (!data.name?.trim()) return { success: false, error: "Interest rate name is required" };
      if (data.rate !== undefined && data.rate <= 0) return { success: false, error: "Interest rate must be greater than 0" };
      if (!data.glInterestIncome?.trim()) return { success: false, error: "GL Interest Income account is required" };

      const updatedInterest = await interestService.update(interestId, data);
      setInterests(prev => prev.map(interest => interest._id === interestId ? updatedInterest : interest));
      return { success: true, data: updatedInterest };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update interest rate';
      return { success: false, error: errorMessage };
    }
  };

  const toggleInterestStatus = async (interestId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      await interestService.toggleStatus(interestId, currentStatus);
      setInterests(prev => prev.map(interest => interest._id === interestId ? { ...interest, isActive: !currentStatus } : interest));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update interest rate status';
      return { success: false, error: errorMessage };
    }
  };

  const deleteInterest = async (interestId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await interestService.delete(interestId);
      setInterests(prev => prev.filter(interest => interest._id !== interestId));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete interest rate';
      return { success: false, error: errorMessage };
    }
  };

  const searchInterests = (searchTerm: string) => {
    if (!searchTerm) return interests;
    
    return interests.filter(interest =>
      interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interest.glInterestIncome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interest.rateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interest.calculationPeriod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSummaryStats = () => ({
    totalInterests: interests.length,
    activeInterests: interests.filter(i => i.isActive).length,
    flatRates: interests.filter(i => i.rateType === 'flat').length,
    reducingRates: interests.filter(i => i.rateType === 'reducing_balance').length,
    averageRate: interests.length > 0 
      ? (interests.reduce((sum, i) => sum + i.rate, 0) / interests.length).toFixed(2)
      : '0.00'
  });

  const getActiveGLAccounts = () => {
    return glAccounts.filter(account => account.status === 'active' && account.isActive);
  };

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    interests,
    glAccounts,
    loading,
    glAccountsLoading,
    error,
    setError,
    fetchInterests,
    canAccessInterestManagement,
    canCreateInterest,
    canEditInterest,
    canDeleteInterest,
    canToggleInterest,
    createInterest,
    updateInterest,
    toggleInterestStatus,
    deleteInterest,
    searchInterests,
    getSummaryStats,
    getGLAccountName,
    getGLAccountDisplay,
    getActiveGLAccounts,
  };
};