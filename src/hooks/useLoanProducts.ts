import { useMemo } from 'react';
import {
  getErrorMessage,
  useCreateLoanProduct,
  useDeleteLoanProduct,
  useFees,
  useGLAccounts,
  useInterests,
  useLoanProducts as useLoanProductsQuery,
  useToggleLoanProductActivation,
  useUpdateLoanProduct,
  type CreateLoanProductRequest,
  type LoanProduct,
  type UpdateLoanProductRequest,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  isActiveRecord,
  makeGLLookup,
  toFeeRow,
  toGLRow,
  toInterestRow,
} from '@/components/accounting/accounting-utils';
import { formatCurrency } from '@/components/loans/loan-utils';

/** Loan product with the fields the table relies on filled in. */
export interface LoanProductRow extends LoanProduct {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: NonNullable<LoanProduct['tenureUnit']>;
  interestId: string;
  isActive: boolean;
}

const toProductRow = (p: LoanProduct): LoanProductRow => ({
  ...p,
  _id: p._id ?? '',
  name: p.name ?? '',
  description: p.description ?? '',
  minAmount: p.minAmount ?? 0,
  maxAmount: p.maxAmount ?? 0,
  tenure: p.tenure ?? 0,
  tenureUnit: p.tenureUnit ?? 'months',
  interestId: p.interestId ?? '',
  isActive: isActiveRecord(p),
});

type Result = { success: boolean; error?: string };

export const useLoanProducts = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();

  const productsQuery = useLoanProductsQuery({ enabled: isAuthenticated });
  const interestsQuery = useInterests({ enabled: isAuthenticated });
  const feesQuery = useFees({ enabled: isAuthenticated });
  const glQuery = useGLAccounts({ enabled: isAuthenticated });

  const loanProducts = useMemo(() => (productsQuery.data ?? []).map(toProductRow), [productsQuery.data]);
  const interests = useMemo(() => (interestsQuery.data ?? []).map(toInterestRow), [interestsQuery.data]);
  const fees = useMemo(() => (feesQuery.data ?? []).map(toFeeRow), [feesQuery.data]);
  const glAccounts = useMemo(() => (glQuery.data ?? []).map(toGLRow), [glQuery.data]);
  const gl = useMemo(() => makeGLLookup(glAccounts), [glAccounts]);

  const create = useCreateLoanProduct();
  const update = useUpdateLoanProduct();
  const toggle = useToggleLoanProductActivation();
  const remove = useDeleteLoanProduct();

  const run = async (fn: () => Promise<unknown>, success: string, failure: string): Promise<Result> => {
    try {
      await fn();
      toast({ title: success });
      return { success: true };
    } catch (err) {
      const error = getErrorMessage(err, failure);
      toast({ title: failure, description: error, variant: 'destructive' });
      return { success: false, error };
    }
  };

  const createProduct = (data: CreateLoanProductRequest) =>
    run(() => create.mutateAsync(data), 'Loan product created', 'Failed to create loan product');

  /** Booked loans keep the terms and GL mapping they were booked with. */
  const updateProduct = (id: string, data: UpdateLoanProductRequest) =>
    run(() => update.mutateAsync({ id, data }), 'Loan product updated', 'Failed to update loan product');

  const toggleProductStatus = (id: string, currentlyActive: boolean) =>
    run(
      () => toggle.mutateAsync(id),
      `Loan product ${currentlyActive ? 'deactivated' : 'activated'}`,
      'Failed to update product status',
    );

  const deleteProduct = (id: string) =>
    run(() => remove.mutateAsync(id), 'Loan product deleted', 'Failed to delete loan product');

  const getInterestName = (interestId?: string): string => {
    const interest = interests.find((i) => i._id === interestId);
    return interest
      ? `${interest.name} (${interest.rate}% ${interest.calculationPeriod}, ${interest.rateType.replace('_', ' ')})`
      : 'N/A';
  };

  const getFeeName = (feeId?: string): string => {
    if (!feeId) return 'No fee';
    const fee = fees.find((f) => f._id === feeId);
    return fee ? `${fee.name} (${fee.type === 'percentage' ? `${fee.value}%` : formatCurrency(fee.value)})` : 'N/A';
  };

  const firstError = productsQuery.error;

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    canDelete: isAdmin || hasPermission('delete_loan_products'),
    loanProducts,
    interests,
    fees,
    glAccounts,
    loading: productsQuery.isLoading,
    error: firstError ? getErrorMessage(firstError, 'Failed to fetch loan products') : null,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isToggling: toggle.isPending,
    fetchData: () => Promise.all([productsQuery.refetch(), interestsQuery.refetch(), feesQuery.refetch(), glQuery.refetch()]),
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getInterestName,
    getFeeName,
    getAccountName: gl.name,
    formatAmount: formatCurrency,
    getSummaryStats: () => ({
      totalProducts: loanProducts.length,
      activeProducts: loanProducts.filter((p) => p.isActive).length,
      totalAmountRange: loanProducts.reduce((sum, p) => sum + p.maxAmount, 0),
    }),
  };
};
