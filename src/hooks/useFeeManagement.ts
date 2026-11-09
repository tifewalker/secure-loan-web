import { useMemo } from 'react';
import {
  getErrorMessage,
  useCreateFee,
  useDeleteFee,
  useFees,
  useGLAccounts,
  useToggleFeeActivation,
  useUpdateFee,
  type CreateFeeRequest,
  type UpdateFeeRequest,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { makeGLLookup, toFeeRow, toGLRow } from '@/components/accounting/accounting-utils';

type Result = { success: boolean; error?: string };

export const useFeeManagement = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();

  const canAccessFeeManagement = () => isAdmin || hasPermission('view_fees');
  const canCreateFee = () => isAdmin || hasPermission('create_fee');
  const canEditFee = () => isAdmin || hasPermission('update_fees');
  const canDeleteFee = () => isAdmin || hasPermission('delete_fees');
  const canToggleFee = () => isAdmin || hasPermission('deactivate_fees');

  const enabled = isAuthenticated && canAccessFeeManagement();
  const feesQuery = useFees({ enabled });
  const glQuery = useGLAccounts({ enabled });

  const fees = useMemo(() => (feesQuery.data ?? []).map(toFeeRow), [feesQuery.data]);
  const glAccounts = useMemo(() => (glQuery.data ?? []).map(toGLRow), [glQuery.data]);
  const gl = useMemo(() => makeGLLookup(glAccounts), [glAccounts]);

  const create = useCreateFee();
  const update = useUpdateFee();
  const toggle = useToggleFeeActivation();
  const remove = useDeleteFee();

  const run = async (fn: () => Promise<unknown>, failure: string): Promise<Result> => {
    try {
      await fn();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, failure) };
    }
  };

  const validate = (data: Partial<CreateFeeRequest>) => {
    if (!data.name?.trim()) return 'Fee name is required';
    if (!data.value || data.value <= 0) return 'Fee value must be greater than 0';
    if (data.type === 'percentage' && data.value > 100) return 'A percentage fee cannot exceed 100%';
    return null;
  };

  /** `glAccount` is optional: the product's fee-income GL is used when it is empty. */
  const createFee = async (data: CreateFeeRequest): Promise<Result> => {
    const error = validate(data);
    if (error) return { success: false, error };
    return run(() => create.mutateAsync({ ...data, glAccount: data.glAccount || undefined }), 'Failed to create fee');
  };

  const updateFee = async (id: string, data: UpdateFeeRequest): Promise<Result> => {
    const error = validate(data);
    if (error) return { success: false, error };
    return run(() => update.mutateAsync({ id, data: { ...data, glAccount: data.glAccount || undefined } }), 'Failed to update fee');
  };

  const toggleFeeStatus = (id: string) => run(() => toggle.mutateAsync(id), 'Failed to update fee status');
  const deleteFee = (id: string) => run(() => remove.mutateAsync(id), 'Failed to delete fee');

  const searchFees = (searchTerm: string) => {
    const search = searchTerm.toLowerCase();
    if (!search) return fees;
    return fees.filter((fee) =>
      [fee.name, fee.type, gl.name(fee.glAccount)].some((v) => v.toLowerCase().includes(search)),
    );
  };

  const getSummaryStats = () => ({
    totalFees: fees.length,
    activeFees: fees.filter((f) => f.isActive).length,
    flatFees: fees.filter((f) => f.type === 'flat').length,
    percentageFees: fees.filter((f) => f.type === 'percentage').length,
  });

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    fees,
    glAccounts,
    activeGLAccounts: glAccounts.filter((a) => a.isActive),
    getGLAccountName: gl.name,
    loading: feesQuery.isLoading,
    error: feesQuery.error ? getErrorMessage(feesQuery.error, 'Failed to fetch fees') : null,
    fetchFees: () => feesQuery.refetch(),
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
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
