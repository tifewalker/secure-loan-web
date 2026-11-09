import type { Loan, LoanProduct, LoanStatus } from '@/api';

/**
 * Flattened loan used by the list/table views. Built from the API `Loan`
 * (customer and product may be populated objects or bare ids).
 */
export interface LoanRow {
  _id: string;
  customer: string;
  customerId: string;
  amount: number;
  /** Stored in the loan's `remarks`. */
  purpose: string;
  status: LoanStatus;
  requestedTerm: number;
  tenureUnit: string;
  interestRate?: number;
  interestType?: string;
  totalRepayable?: number;
  outstanding: number;
  totalPaid: number;
  appliedDate: string;
  createdAt?: string;
  loanProductId: string;
  productName: string;
  /** The full loan from the API. */
  loan: Loan;
}

/**
 * The API uses several names for the same stage: a freshly booked loan may be
 * `booked` or `pending`, and a paid-out loan `disbursed` or `active`. Collapse
 * them (case-insensitively) so every page filters on one value per stage.
 */
export const normalizeLoanStatus = (status?: string): LoanStatus => {
  const s = (status ?? 'pending').toLowerCase().trim();
  if (s === 'booked') return 'pending';
  if (s === 'disbursed') return 'active';
  return s as LoanStatus;
};

const idOf = (value: unknown): string =>
  typeof value === 'string' ? value : ((value as { _id?: string } | undefined)?._id ?? '');

export const toLoanRow = (loan: Loan): LoanRow => {
  const customer = typeof loan.customerId === 'object' ? loan.customerId : undefined;
  const product = typeof loan.loanProduct === 'object' ? (loan.loanProduct as LoanProduct) : undefined;
  return {
    _id: loan._id ?? '',
    customer: customer?.fullName || '',
    customerId: idOf(loan.customerId),
    amount: loan.principalAmount ?? 0,
    purpose: loan.remarks ?? '',
    status: normalizeLoanStatus(loan.status),
    requestedTerm: loan.tenure ?? 0,
    tenureUnit: loan.tenureUnit || 'months',
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    totalRepayable: loan.totalRepayable,
    outstanding:
      (loan.outstandingPrincipal ?? 0) +
      (loan.outstandingInterest ?? 0) +
      (loan.outstandingFees ?? 0) +
      (loan.outstandingPenalty ?? 0),
    totalPaid: loan.totalPaid ?? 0,
    appliedDate: loan.createdAt ?? '',
    createdAt: loan.createdAt,
    loanProductId: idOf(loan.loanProduct),
    productName: product?.name ?? '',
    loan,
  };
};

/** Loans that have been paid out (`active` is the API's post-disbursement status). */
export const DISBURSED_STATUSES: LoanStatus[] = ['active', 'disbursed', 'defaulted', 'closed', 'written_off'];
export const isDisbursed = (status: LoanStatus) => DISBURSED_STATUSES.includes(status);
/** Loans that still accept repayments. */
export const isServiceable = (status: LoanStatus) => status === 'active' || status === 'defaulted';

export const getStatusDisplay = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'booked':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'active':
    case 'disbursed':
      return 'Active';
    case 'closed':
      return 'Closed';
    case 'defaulted':
      return 'Defaulted';
    case 'written_off':
      return 'Written Off';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
};

/**
 * A loan is awaiting review exactly when its badge says "Under Review"
 * (`pending` or `booked`). The Review page and the Applications filter both use this.
 */
export const isUnderReview = (status?: string) => getStatusDisplay(status ?? '') === 'Under Review';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'booked':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'approved':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'rejected':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'active':
    case 'disbursed':
      return 'text-purple-600 bg-purple-100 border-purple-200';
    case 'closed':
      return 'text-gray-600 bg-gray-100 border-gray-200';
    case 'defaulted':
    case 'written_off':
      return 'text-red-700 bg-red-50 border-red-300';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const formatCurrency = (amount: number = 0): string =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
