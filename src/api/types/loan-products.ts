import type { ActiveStatus, DateTimeString, ObjectId, TimeUnit } from './common';

export interface GLMapping {
  principalReceivable?: ObjectId;
  interestReceivable?: ObjectId;
  interestIncome?: ObjectId;
  feeIncome?: ObjectId;
  disbursementAccount?: ObjectId;
  /** Account repayments are received into. */
  cashAccount?: ObjectId;
  /** Optional; penalties go to interestIncome if empty. */
  penaltyIncome?: ObjectId;
  /** Liability account for customer wallets (needed for overpayments and wallet repayments). */
  walletLiability?: ObjectId;
}

export interface RepaymentPattern {
  frequencyValue?: number;
  frequencyUnit?: TimeUnit;
  periodValue?: number;
  periodUnit?: TimeUnit;
  description?: string;
}

/** Loan product as returned by the API (nested). */
export interface LoanProduct {
  _id?: ObjectId;
  name?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  tenure?: number;
  tenureUnit?: TimeUnit;
  repaymentPattern?: RepaymentPattern;
  feeId?: ObjectId;
  interestId?: ObjectId;
  glMapping?: GLMapping;
  /** Days an instalment can be overdue before auto-default (0 = never). */
  defaultAfterDays?: number;
  status?: ActiveStatus;
  createdAt?: DateTimeString;
}

/**
 * `LoanProductInput` — flat request body. The API nests repayment fields into
 * `repaymentPattern` and GL fields into `glMapping`.
 */
export interface LoanProductInput {
  name?: string;
  description?: string;
  minAmount?: number;
  /** Must be ≥ minAmount. */
  maxAmount?: number;
  tenure?: number;
  /** @default "months" */
  tenureUnit?: TimeUnit;
  /** Repay every N frequencyUnit. @default 1 */
  frequencyValue?: number;
  /** @default "months" */
  frequencyUnit?: TimeUnit;
  /** Defaults to tenure. */
  periodValue?: number;
  /** @default "months" */
  periodUnit?: TimeUnit;
  /** Lower-case `d` — as the API expects. @default "Standard repayment" */
  repaymentdescription?: string;
  interestId?: ObjectId;
  feeId?: ObjectId;
  principalReceivable?: ObjectId;
  interestReceivable?: ObjectId;
  interestIncome?: ObjectId;
  feeIncome?: ObjectId;
  disbursementAccount?: ObjectId;
  cashAccount?: ObjectId;
  penaltyIncome?: ObjectId;
  walletLiability?: ObjectId;
  /** @default 90; 0 = never. Copied to each loan at booking. */
  defaultAfterDays?: number;
}

type RequiredProductFields =
  | 'name'
  | 'minAmount'
  | 'maxAmount'
  | 'tenure'
  | 'interestId'
  | 'principalReceivable'
  | 'interestReceivable'
  | 'interestIncome'
  | 'feeIncome'
  | 'disbursementAccount'
  | 'cashAccount';

export type CreateLoanProductRequest = LoanProductInput &
  Required<Pick<LoanProductInput, RequiredProductFields>>;

/** Only the fields sent are changed. */
export type UpdateLoanProductRequest = LoanProductInput;

export interface LoanProductResponse {
  message?: string;
  loanProduct?: LoanProduct;
}

export interface ListLoanProductsResponse {
  message?: string;
  loanProducts?: LoanProduct[];
}
