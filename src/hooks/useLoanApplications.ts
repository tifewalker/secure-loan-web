import { useMemo, useState } from 'react';
import {
  getErrorMessage,
  loansApi,
  useApproveLoan,
  useBookLoan,
  useCustomers,
  useDisburseLoan,
  useLoanProducts,
  useLoanReport,
  useRejectLoan,
  type BookLoanRequest,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatCurrency,
  getStatusColor,
  getStatusDisplay,
  isDisbursed,
  isUnderReview,
  toLoanRow,
  type LoanRow,
} from '@/components/loans/loan-utils';

type Result<T = undefined> = { success: boolean; error?: string; data?: T };

interface UseLoanApplicationsOptions {
  /** Also load the API's pending report (loans booked and awaiting approval). */
  withPendingQueue?: boolean;
}

/**
 * Loan applications for the Applications, Review and Disbursement pages.
 * Reads the all-loans report (customer and product populated).
 */
export const useLoanApplications = ({ withPendingQueue = false }: UseLoanApplicationsOptions = {}) => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();

  const canViewApplications = () => isAdmin || hasPermission('view_loan_applications');
  const canCreateApplications = () => isAdmin || hasPermission('create_loan_applications');
  const canUpdateApplications = () => isAdmin || hasPermission('update_loan_applications');
  const canApproveLoans = () => isAdmin || hasPermission('approve_loans');
  const canRejectLoans = () => isAdmin || hasPermission('reject_loans');
  const canDefaultLoans = () => isAdmin || hasPermission('default_loans');
  /** Reviewers only need to be able to approve or reject. */
  const canReviewApplications = () => canViewApplications() || canApproveLoans() || canRejectLoans();

  const enabled = isAuthenticated && canReviewApplications();
  const report = useLoanReport('all', { enabled });
  const applications = useMemo(() => (report.data ?? []).map(toLoanRow), [report.data]);

  /**
   * Review queue: every loan shown as "Under Review" on the Applications page,
   * plus anything extra the backend's pending report returns. Deduplicated,
   * newest first, and anything already decided drops out.
   */
  const pendingReport = useLoanReport('pending', { enabled: enabled && withPendingQueue });
  const pendingQueue = useMemo(() => {
    const byId = new Map<string, LoanRow>();
    for (const row of [...applications, ...(pendingReport.data ?? []).map(toLoanRow)]) {
      if (row._id && isUnderReview(row.status) && !byId.has(row._id)) byId.set(row._id, row);
    }
    return [...byId.values()].sort(
      (a, b) => new Date(b.appliedDate || 0).getTime() - new Date(a.appliedDate || 0).getTime(),
    );
  }, [pendingReport.data, applications]);

  // Dropdown data for the "New Application" dialog is only loaded on demand.
  const [dropdownsRequested, setDropdownsRequested] = useState(false);
  const customersQuery = useCustomers({ enabled: isAuthenticated && dropdownsRequested });
  const productsQuery = useLoanProducts({ enabled: isAuthenticated && dropdownsRequested });
  const customers = useMemo(() => (customersQuery.data ?? []).filter((c) => c.status === 'active'), [customersQuery.data]);
  const loanProducts = useMemo(() => (productsQuery.data ?? []).filter((p) => p.status === 'active'), [productsQuery.data]);

  const bookLoan = useBookLoan();
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();
  const disburseLoan = useDisburseLoan();

  const run = async <T,>(fn: () => Promise<T>, fallback: string): Promise<Result<T>> => {
    try {
      return { success: true, data: await fn() };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, fallback) };
    }
  };

  /** Books a pending loan; the purpose is saved as the loan's remarks. */
  const createApplication = (data: BookLoanRequest & { purpose?: string }) =>
    run(async () => {
      const { purpose, ...booking } = data;
      const { loan } = await bookLoan.mutateAsync(booking);
      if (purpose && loan?._id) await loansApi.update(loan._id, { remarks: purpose });
      return loan;
    }, 'Failed to create application');

  const approveApplication = (id: string, remarks?: string) =>
    run(() => approveLoan.mutateAsync({ id, remarks: remarks || undefined }), 'Failed to approve application');

  /** The API requires a reason, recorded in the loan's status history. */
  const rejectApplication = (id: string, reason: string) =>
    run(() => rejectLoan.mutateAsync({ id, reason }), 'Failed to reject application');

  const disburseApplication = (id: string, disbursementDate?: string) =>
    run(() => disburseLoan.mutateAsync({ id, disbursementDate }), 'Failed to disburse loan');

  const getSummaryStats = () => {
    const count = (status: string) => applications.filter((app) => app.status === status).length;
    return {
      total: applications.length,
      underReview: applications.filter((app) => isUnderReview(app.status)).length,
      approved: count('approved'),
      disbursed: applications.filter((app) => isDisbursed(app.status)).length,
      rejected: count('rejected'),
      closed: count('closed'),
      defaulted: count('defaulted'),
      totalAmount: applications.reduce((sum, app) => sum + app.amount, 0),
    };
  };

  const searchApplications = (searchTerm: string, statusFilter: string) => {
    const search = searchTerm.toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !search ||
        [app.customer, app.purpose, app.customerId, app.productName].some((v) => v?.toLowerCase().includes(search));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' ? isUnderReview(app.status) : app.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  };

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    applications,
    loading: report.isLoading || (withPendingQueue && pendingReport.isLoading),
    error: report.error ? getErrorMessage(report.error, 'Failed to fetch loan applications') : null,
    customers,
    loanProducts,
    loadingCustomers: customersQuery.isLoading,
    loadingLoanProducts: productsQuery.isLoading,
    customersError: customersQuery.error ? getErrorMessage(customersQuery.error) : null,
    loanProductsError: productsQuery.error ? getErrorMessage(productsQuery.error) : null,
    isCreating: bookLoan.isPending,
    isUpdating: approveLoan.isPending || rejectLoan.isPending || disburseLoan.isPending,
    canCreateApplications,
    canViewApplications,
    canReviewApplications,
    canUpdateApplications,
    canApproveLoans,
    canRejectLoans,
    canDefaultLoans,
    fetchApplications: () => Promise.all([report.refetch(), withPendingQueue ? pendingReport.refetch() : null]),
    fetchDropdownData: () => setDropdownsRequested(true),
    createApplication,
    getStatusDisplay,
    getStatusColor,
    formatCurrency,
    getSummaryStats,
    searchApplications,
    approveApplication,
    rejectApplication,
    disburseApplication,
    pendingQueue,
    getPendingApplications: () => pendingQueue,
    getApprovedApplications: () => applications.filter((app) => app.status === 'approved'),
    getDisbursedApplications: () => applications.filter((app) => isDisbursed(app.status)),
  };
};
