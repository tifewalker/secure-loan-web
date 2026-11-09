import { useMemo, useState } from 'react';
import {
  getErrorMessage,
  useLoanReport,
  useOverdueReport,
  type Instalment,
  type Loan,
  type LoanCustomerRef,
  type LoanReportKind,
  type LoanStatus,
} from '@/api';
import { normalizeLoanStatus } from '@/components/loans/loan-utils';

export type ReportTab = LoanReportKind | 'overdue';

/** Report row: an API loan with the populated customer and numbers defaulted to 0. */
export interface LoanReport extends Omit<Loan, 'customerId' | 'status'> {
  _id: string;
  customerId?: LoanCustomerRef;
  principalAmount: number;
  interestAmount: number;
  totalRepayable: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingTotal: number;
  status: LoanStatus;
  tenure: number;
  tenureUnit: NonNullable<Loan['tenureUnit']>;
  /** Unmodified loan from the API. */
  loan: Loan;
}

/** Overdue instalment with its populated customer and loan. */
export interface OverdueRow extends Instalment {
  _id: string;
  customer?: LoanCustomerRef;
  loan?: Loan;
  amountOverdue: number;
}

const toReport = (loan: Loan): LoanReport => ({
  ...loan,
  _id: loan._id ?? '',
  customerId: typeof loan.customerId === 'object' ? loan.customerId : undefined,
  principalAmount: loan.principalAmount ?? 0,
  interestAmount: loan.interestAmount ?? 0,
  totalRepayable: loan.totalRepayable ?? 0,
  outstandingPrincipal: loan.outstandingPrincipal ?? 0,
  outstandingInterest: loan.outstandingInterest ?? 0,
  outstandingTotal:
    (loan.outstandingPrincipal ?? 0) + (loan.outstandingInterest ?? 0) + (loan.outstandingFees ?? 0) + (loan.outstandingPenalty ?? 0),
  status: normalizeLoanStatus(loan.status),
  tenure: loan.tenure ?? 0,
  tenureUnit: loan.tenureUnit ?? 'months',
  // Disbursed loans start on their disbursement date.
  startDate: loan.startDate ?? loan.disbursedAt,
  loan,
});

const toOverdue = (i: Instalment): OverdueRow => ({
  ...i,
  _id: i._id ?? '',
  customer: typeof i.customerId === 'object' ? i.customerId : undefined,
  loan: typeof i.loanId === 'object' ? i.loanId : undefined,
  amountOverdue: Math.max((i.totalDue ?? 0) - (i.totalPaid ?? 0), 0),
});

const LOAN_TABS: LoanReportKind[] = ['active', 'pending', 'disbursed', 'closed', 'defaulted', 'rejected', 'all'];

export const useReports = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('active');

  // Every report is loaded so the tab badges show counts; they share the React Query cache.
  const queries = {
    active: useLoanReport('active'),
    pending: useLoanReport('pending'),
    disbursed: useLoanReport('disbursed'),
    closed: useLoanReport('closed'),
    defaulted: useLoanReport('defaulted'),
    rejected: useLoanReport('rejected'),
    all: useLoanReport('all'),
  } satisfies Record<LoanReportKind, ReturnType<typeof useLoanReport>>;
  const overdueQuery = useOverdueReport();

  const { active, pending, disbursed, closed, defaulted, rejected, all } = queries;
  const reports = useMemo(
    () =>
      ({
        active: (active.data ?? []).map(toReport),
        pending: (pending.data ?? []).map(toReport),
        disbursed: (disbursed.data ?? []).map(toReport),
        closed: (closed.data ?? []).map(toReport),
        defaulted: (defaulted.data ?? []).map(toReport),
        rejected: (rejected.data ?? []).map(toReport),
        all: (all.data ?? []).map(toReport),
      }) satisfies Record<LoanReportKind, LoanReport[]>,
    [active.data, pending.data, disbursed.data, closed.data, defaulted.data, rejected.data, all.data],
  );
  const overdue = useMemo(() => (overdueQuery.data ?? []).map(toOverdue), [overdueQuery.data]);

  const currentQuery = activeTab === 'overdue' ? overdueQuery : queries[activeTab];

  const getCurrentLoans = (): LoanReport[] => (activeTab === 'overdue' ? [] : reports[activeTab]);

  const getSummaryStats = () => {
    const currentLoans = getCurrentLoans();
    return {
      totalLoans: currentLoans.length,
      totalPrincipal: currentLoans.reduce((sum, loan) => sum + loan.principalAmount, 0),
      totalInterest: currentLoans.reduce((sum, loan) => sum + loan.interestAmount, 0),
      totalRepayable: currentLoans.reduce((sum, loan) => sum + loan.totalRepayable, 0),
      totalOutstanding: currentLoans.reduce((sum, loan) => sum + loan.outstandingTotal, 0),
    };
  };

  const getOverdueStats = () => ({
    instalments: overdue.length,
    loans: new Set(overdue.map((o) => o.loan?._id ?? (typeof o.loanId === 'string' ? o.loanId : ''))).size,
    amountOverdue: overdue.reduce((sum, o) => sum + o.amountOverdue, 0),
    penalties: overdue.reduce((sum, o) => sum + Math.max((o.penaltyDue ?? 0) - (o.penaltyPaid ?? 0), 0), 0),
  });

  const counts: Record<ReportTab, number | undefined> = {
    ...(Object.fromEntries(LOAN_TABS.map((t) => [t, queries[t].data?.length])) as Record<LoanReportKind, number | undefined>),
    overdue: overdueQuery.data?.length,
  };

  return {
    reports,
    overdue,
    counts,
    isLoading: currentQuery.isLoading,
    error: currentQuery.error ? getErrorMessage(currentQuery.error, 'Failed to load this report. Please try again.') : null,
    activeTab,
    setActiveTab,
    getCurrentLoans,
    getSummaryStats,
    getOverdueStats,
    fetchAllReports: () => Promise.all([...LOAN_TABS.map((t) => queries[t].refetch()), overdueQuery.refetch()]),
  };
};
