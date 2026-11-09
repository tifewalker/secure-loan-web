import type { DateTimeString, ObjectId, Pagination, TimeUnit, UserRef } from './common';
import type { FeeType, InterestCalculationPeriod, InterestRateType } from './accounting';
import type { Customer } from './customers';
import type { GLMapping, LoanProduct, RepaymentPattern } from './loan-products';

export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'defaulted'
  | 'closed'
  | 'written_off'
  | 'disbursed'
  | 'booked';

/** Statuses accepted by the `status` filter of `GET /api/loan/v1/all`. */
export type LoanStatusFilter = Exclude<LoanStatus, 'disbursed' | 'booked'>;

export type FeeTreatment = 'upfront' | 'spread' | 'first_instalment';

/** Populated customer on a loan (fullName, email, phoneNumber, status). */
export type LoanCustomerRef = Pick<Customer, '_id' | 'fullName' | 'email' | 'phoneNumber' | 'status' | 'customerId'>;

export interface LoanStatusHistoryEntry {
  status?: string;
  at?: DateTimeString;
  /** Empty for automatic changes. */
  by?: ObjectId;
  reason?: string;
}

export interface LoanFee {
  feeId?: ObjectId;
  feeType?: FeeType;
  feeValue?: number;
  feeAmount?: number;
}

export interface Loan {
  _id?: ObjectId;
  /** Customer id, or the populated customer. */
  customerId?: ObjectId | LoanCustomerRef;
  /** Product id, or the populated product (on report endpoints). */
  loanProduct?: ObjectId | LoanProduct;
  principalAmount?: number;
  interestRate?: number;
  interestType?: InterestRateType;
  interestCalculationPeriod?: InterestCalculationPeriod;
  interestAmount?: number;
  totalFees?: number;
  /** Sum of the schedule (excludes upfront fees). */
  totalRepayable?: number;
  outstandingPrincipal?: number;
  outstandingInterest?: number;
  outstandingFees?: number;
  outstandingPenalty?: number;
  totalPaid?: number;
  interestWaived?: number;
  tenure?: number;
  tenureUnit?: TimeUnit;
  feeTreatment?: FeeTreatment;
  penalty?: {
    /** % per day on overdue principal + interest. */
    dailyRate?: number;
    gracePeriodDays?: number;
  };
  fees?: LoanFee[];
  repaymentPattern?: RepaymentPattern;
  glSnapshot?: GLMapping;
  status?: LoanStatus;
  /** Every status change, oldest first. */
  statusHistory?: LoanStatusHistoryEntry[];
  defaultAfterDays?: number;
  rejectedBy?: ObjectId;
  rejectedAt?: DateTimeString;
  rejectionReason?: string;
  /** Empty when defaulted automatically. */
  defaultedBy?: ObjectId;
  defaultedAt?: DateTimeString;
  defaultReason?: string;
  startDate?: DateTimeString;
  maturityDate?: DateTimeString;
  disbursedAt?: DateTimeString;
  /** Principal minus upfront fees. */
  disbursedAmount?: number;
  feesPaidUpfront?: number;
  numberOfInstalments?: number;
  bookedBy?: ObjectId;
  approvedBy?: ObjectId;
  approvedAt?: DateTimeString;
  closedAt?: DateTimeString;
  remarks?: string;
  createdAt?: DateTimeString;
}

export interface LoanSummary {
  id?: ObjectId;
  status?: string;
  outstandingPrincipal?: number;
  outstandingInterest?: number;
  outstandingFees?: number;
  outstandingPenalty?: number;
  totalPaid?: number;
  closedAt?: DateTimeString;
}

export type InstalmentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Instalment {
  _id?: ObjectId;
  /** Id, or populated loan on the overdue report. */
  loanId?: ObjectId | Loan;
  /** Id, or populated customer on the overdue report. */
  customerId?: ObjectId | LoanCustomerRef;
  instalmentNumber?: number;
  dueDate?: DateTimeString;
  principalDue?: number;
  interestDue?: number;
  feeDue?: number;
  penaltyDue?: number;
  totalDue?: number;
  principalPaid?: number;
  interestPaid?: number;
  feePaid?: number;
  penaltyPaid?: number;
  totalPaid?: number;
  interestWaived?: number;
  openingBalance?: number;
  closingBalance?: number;
  status?: InstalmentStatus;
  daysOverdue?: number;
  paidAt?: DateTimeString;
}

export interface AllocationAmounts {
  penalty?: number;
  fee?: number;
  interest?: number;
  principal?: number;
}

export interface RepaymentAllocation extends AllocationAmounts {
  instalment?: ObjectId;
  instalmentNumber?: number;
}

export type RepaymentType = 'repayment' | 'payoff' | 'wallet_sweep';
export type PaymentSource = 'external' | 'wallet';

export interface Repayment {
  _id?: ObjectId;
  loanId?: ObjectId;
  customerId?: ObjectId;
  type?: RepaymentType;
  source?: PaymentSource;
  /** Money received, or taken from the wallet. */
  amount?: number;
  /** Applied to instalments. */
  appliedAmount?: number;
  /** Credited to the customer's wallet. */
  overpayment?: number;
  interestWaived?: number;
  totals?: AllocationAmounts;
  allocations?: RepaymentAllocation[];
  paymentDate?: DateTimeString;
  method?: string;
  reference?: string;
  narration?: string;
  /** Populated user; empty for wallet sweeps. */
  postedBy?: UserRef | null;
}

export interface PayoffQuote {
  asOf?: DateTimeString;
  principal?: number;
  /** Flat: all remaining interest. Reducing balance: interest up to today. */
  interest?: number;
  fees?: number;
  penalty?: number;
  /** Future interest waived (reducing balance only). */
  interestWaived?: number;
  /** Amount required to close the loan. */
  total?: number;
  /** Customer wallet balance available (source = wallet). */
  walletBalance?: number;
}

// ---------- Requests ----------

export interface BookLoanRequest {
  customerId: ObjectId;
  loanProductId: ObjectId;
  /** Must be within the product's min/max. */
  principalAmount: number;
  /** In the product's tenureUnit. */
  tenure: number;
  /** @default "upfront" */
  feeTreatment?: FeeTreatment;
  /** % per day; 0 = no penalty. @default 0 */
  penaltyDailyRate?: number;
  /** @default 0 */
  penaltyGracePeriodDays?: number;
}

/**
 * `PATCH /api/loan/v1/{id}`. `remarks` any time; the loan terms only while
 * the loan is `pending` (re-priced on change). Any other field → 400.
 */
export interface UpdateLoanRequest {
  remarks?: string;
  principalAmount?: number;
  tenure?: number;
  feeTreatment?: FeeTreatment;
  penaltyDailyRate?: number;
  penaltyGracePeriodDays?: number;
}

export interface ApproveLoanRequest {
  remarks?: string;
}

/** `ReasonRequest` — used by reject / default / reinstate. */
export interface ReasonRequest {
  /** Recorded in the loan's status history. */
  reason: string;
}

export interface DisburseLoanRequest {
  /** Defaults to now; cannot be in the future. */
  disbursementDate?: DateTimeString;
}

/** `PaymentRequest` — used by repay and payoff. */
export interface PaymentRequest {
  /** Required when source is external. Optional for wallet (defaults to everything due). */
  amount?: number;
  /** @default "external" */
  source?: PaymentSource;
  /** Must be unique — reposting the same reference returns 409. */
  reference?: string;
  /** e.g. cash, transfer, card */
  method?: string;
  narration?: string;
  /** Defaults to now; cannot be in the future. */
  paymentDate?: DateTimeString;
}

export interface ListLoansParams {
  status?: LoanStatusFilter;
  page?: number;
  limit?: number;
}

// ---------- Responses ----------

export interface LoanResponse {
  message?: string;
  loan?: Loan;
}

export interface ListLoansResponse {
  message?: string;
  pagination?: Pagination;
  filters?: { status?: string | null };
  loans?: Loan[];
}

export interface DisburseLoanResponse {
  message?: string;
  loan?: Loan;
  schedule?: Instalment[];
}

export interface LoanScheduleResponse {
  message?: string;
  loan?: LoanSummary;
  schedule?: Instalment[];
}

/** 201 when posted; 200 (no `repayment`) when nothing is due on a wallet payment. */
export interface RepayLoanResponse {
  message?: string;
  repayment?: Repayment;
  loan?: LoanSummary;
}

export interface ListRepaymentsResponse {
  message?: string;
  repayments?: Repayment[];
}

export interface PayoffQuoteResponse {
  message?: string;
  quote?: PayoffQuote;
}

export interface PayoffLoanResponse {
  message?: string;
  quote?: PayoffQuote;
  repayment?: Repayment;
  loan?: LoanSummary;
}

export interface RunLoanJobsResponse {
  message?: string;
  summary?: {
    loansChecked?: number;
    walletSweeps?: number;
    sweptAmount?: number;
    /** Loans defaulted automatically in this run. */
    defaulted?: number;
    errors?: number;
  };
}

// ---------- Reports ----------

/** Report endpoints return `Loan[]` directly (customer + product populated). */
export type LoanReportResponse = Loan[];

export type LoanReportKind =
  | 'all'
  | 'pending'
  | 'active'
  | 'disbursed'
  | 'closed'
  | 'defaulted'
  | 'rejected';

export interface OverdueReportResponse {
  message?: string;
  /** Oldest due date first, customer and loan populated. */
  overdue?: Instalment[];
}
