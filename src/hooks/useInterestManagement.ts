import { useMemo } from 'react';
import {
  getErrorMessage,
  useCreateInterest,
  useDeleteInterest,
  useGLAccounts,
  useInterests,
  useToggleInterestActivation,
  useUpdateInterest,
  type CreateInterestRequest,
  type UpdateInterestRequest,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { makeGLLookup, toGLRow, toInterestRow } from '@/components/accounting/accounting-utils';

type Result = { success: boolean; error?: string };

export const useInterestManagement = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();

  const canAccessInterestManagement = () => isAdmin || hasPermission('view_interests');
  const canCreateInterest = () => isAdmin || hasPermission('create_interests');
  const canEditInterest = () => isAdmin || hasPermission('update_interests');
  const canDeleteInterest = () => isAdmin || hasPermission('delete_interests');
  const canToggleInterest = () => isAdmin || hasPermission('update_interests');

  const enabled = isAuthenticated && canAccessInterestManagement();
  const interestsQuery = useInterests({ enabled });
  const glQuery = useGLAccounts({ enabled });

  const interests = useMemo(() => (interestsQuery.data ?? []).map(toInterestRow), [interestsQuery.data]);
  const glAccounts = useMemo(() => (glQuery.data ?? []).map(toGLRow), [glQuery.data]);
  const gl = useMemo(() => makeGLLookup(glAccounts), [glAccounts]);

  const create = useCreateInterest();
  const update = useUpdateInterest();
  const toggle = useToggleInterestActivation();
  const remove = useDeleteInterest();

  const run = async (fn: () => Promise<unknown>, failure: string): Promise<Result> => {
    try {
      await fn();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, failure) };
    }
  };

  const validate = (data: Partial<CreateInterestRequest>) => {
    if (!data.name?.trim()) return 'Interest rate name is required';
    if (!data.rate || data.rate <= 0) return 'Interest rate must be greater than 0';
    if (!data.glInterestIncome) return 'GL Interest Income account is required';
    return null;
  };

  const createInterest = async (data: CreateInterestRequest): Promise<Result> => {
    const error = validate(data);
    return error ? { success: false, error } : run(() => create.mutateAsync(data), 'Failed to create interest rate');
  };

  /** Affects new bookings only; booked loans keep their rate. */
  const updateInterest = async (id: string, data: UpdateInterestRequest): Promise<Result> => {
    const error = validate(data);
    return error ? { success: false, error } : run(() => update.mutateAsync({ id, data }), 'Failed to update interest rate');
  };

  const toggleInterestStatus = (id: string) => run(() => toggle.mutateAsync(id), 'Failed to update interest rate status');
  const deleteInterest = (id: string) => run(() => remove.mutateAsync(id), 'Failed to delete interest rate');

  /** Display info for a GL account id. */
  const getGLAccountDisplay = (id: string) => {
    const account = gl.get(id);
    return account
      ? { name: account.glName, code: account.glCode, status: account.isActive ? 'active' : 'inactive', category: account.level1Category }
      : { name: id ? 'Account not found' : 'Not set', code: '—', status: 'unknown', category: '' };
  };

  const searchInterests = (searchTerm: string) => {
    const search = searchTerm.toLowerCase();
    if (!search) return interests;
    return interests.filter((i) =>
      [i.name, i.rateType, i.calculationPeriod, gl.name(i.glInterestIncome)].some((v) => v.toLowerCase().includes(search)),
    );
  };

  const getSummaryStats = () => ({
    totalInterests: interests.length,
    activeInterests: interests.filter((i) => i.isActive).length,
    flatRates: interests.filter((i) => i.rateType === 'flat').length,
    reducingRates: interests.filter((i) => i.rateType === 'reducing_balance').length,
    averageRate: interests.length > 0 ? (interests.reduce((sum, i) => sum + i.rate, 0) / interests.length).toFixed(2) : '0.00',
  });

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    interests,
    glAccounts,
    loading: interestsQuery.isLoading,
    glAccountsLoading: glQuery.isLoading,
    error: interestsQuery.error ? getErrorMessage(interestsQuery.error, 'Failed to fetch interest rates') : null,
    fetchInterests: () => interestsQuery.refetch(),
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
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
    getGLAccountName: gl.name,
    getGLAccountDisplay,
    /** Interest income is posted to Income accounts. */
    getActiveGLAccounts: () => glAccounts.filter((a) => a.isActive && a.level1Category === 'Income'),
  };
};
