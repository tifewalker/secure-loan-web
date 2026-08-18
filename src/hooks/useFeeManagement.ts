import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { feeService } from '@/services/fee.service';
import type { Fee, CreateFeeData, UpdateFeeData } from '../types';

export const useFeeManagement = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccessFeeManagement = useCallback(() => {
    return isAdmin || hasPermission('view_fees');
  }, [isAdmin, hasPermission]);

  const canCreateFee = useCallback(() => isAdmin || hasPermission('create_fee'), [isAdmin, hasPermission]);
  const canEditFee = useCallback(() => isAdmin || hasPermission('update_fees'), [isAdmin, hasPermission]);
  const canDeleteFee = useCallback(() => isAdmin || hasPermission('delete_fees'), [isAdmin, hasPermission]);
  const canToggleFee = useCallback(() => isAdmin || hasPermission('deactivate_fees'), [isAdmin, hasPermission]);

  const fetchFees = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const feesData = await feeService.getAll();
      setFees(feesData);
    } catch (error) {
      console.error('Error fetching fees:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch fees';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const createFee = async (feeData: CreateFeeData & { createdBy?: string }): Promise<{ success: boolean; error?: string; data?: Fee }> => {
    try {
      if (!feeData.name.trim()) return { success: false, error: "Fee name is required" };
      if (feeData.value <= 0) return { success: false, error: "Fee value must be greater than 0" };
      if (!feeData.glAccount.trim()) return { success: false, error: "GL Account is required" };

      const createdFee = await feeService.create(feeData);
      setFees(prev => [...prev, createdFee]);
      return { success: true, data: createdFee };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create fee';
      return { success: false, error: errorMessage };
    }
  };

  const updateFee = async (feeId: string, feeData: UpdateFeeData & { updatedBy?: string }): Promise<{ success: boolean; error?: string; data?: Fee }> => {
    try {
      if (!feeData.name?.trim()) return { success: false, error: "Fee name is required" };
      if (feeData.value !== undefined && feeData.value <= 0) return { success: false, error: "Fee value must be greater than 0" };
      if (!feeData.glAccount?.trim()) return { success: false, error: "GL Account is required" };

      const updatedFee = await feeService.update(feeId, feeData);
      setFees(prev => prev.map(fee => fee._id === feeId ? updatedFee : fee));
      return { success: true, data: updatedFee };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fee';
      return { success: false, error: errorMessage };
    }
  };

  const toggleFeeStatus = async (feeId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      await feeService.toggleStatus(feeId, currentStatus);
      setFees(prev => prev.map(fee => fee._id === feeId ? { ...fee, isActive: !currentStatus } : fee));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update fee status';
      return { success: false, error: errorMessage };
    }
  };

  const deleteFee = async (feeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await feeService.delete(feeId);
      setFees(prev => prev.filter(fee => fee._id !== feeId));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete fee';
      return { success: false, error: errorMessage };
    }
  };

  const searchFees = (searchTerm: string) => {
    if (!searchTerm) return fees;
    
    return fees.filter(fee =>
      fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.glAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSummaryStats = () => ({
    totalFees: fees.length,
    activeFees: fees.filter(f => f.isActive).length,
    flatFees: fees.filter(f => f.type === 'flat').length,
    percentageFees: fees.filter(f => f.type === 'percentage').length,
  });

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    fees,
    loading,
    error,
    setError,
    fetchFees,
    canAccessFeeManagement,
    canCreateFee,
    canEditFee,
    canDeleteFee,
    canToggleFee,
    createFee,
    updateFee,
    toggleFeeStatus,
    deleteFee,
    searchFees,
    getSummaryStats,
  };
};