// GL accounts, fees and interest configurations.
import type { ActiveStatus, ObjectId } from './common';

// ---------- GL accounts ----------

export type GLCategory = 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';

export interface GLAccount {
  _id?: ObjectId;
  /** Generated: 8 digits starting with 1. */
  glCode?: string;
  /** Generated: 8 digits starting with 1. */
  accountNumber?: string;
  glName?: string;
  level1Category?: GLCategory;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  status?: ActiveStatus;
  isActive?: boolean;
  currency?: string;
}

export interface CreateGLAccountRequest {
  glName: string;
  level1Category: GLCategory;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
}

export type UpdateGLAccountRequest = Partial<CreateGLAccountRequest>;

export interface GLAccountResponse {
  message?: string;
  glAccount?: GLAccount;
}

// ---------- Fees ----------

export type FeeType = 'flat' | 'percentage';

export interface Fee {
  _id?: ObjectId;
  name?: string;
  type?: FeeType;
  /** Amount (flat) or % of principal (percentage). */
  value?: number;
  glAccount?: ObjectId;
  /** Inactive fees are not charged at booking. */
  status?: ActiveStatus;
}

export interface CreateFeeRequest {
  name: string;
  type: FeeType;
  value: number;
  /** Fee income GL; falls back to the product's feeIncome. */
  glAccount?: ObjectId;
}

export type UpdateFeeRequest = Partial<CreateFeeRequest>;

export interface FeeResponse {
  message?: string;
  fee?: Fee;
}

export interface ListFeesResponse {
  message?: string;
  fees?: Fee[];
}

// ---------- Interest ----------

export type InterestRateType = 'flat' | 'reducing_balance';
export type InterestCalculationPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';

export interface Interest {
  _id?: ObjectId;
  name?: string;
  /** % per calculationPeriod (5 + monthly = 5% per month). */
  rate?: number;
  rateType?: InterestRateType;
  calculationPeriod?: InterestCalculationPeriod;
  glInterestIncome?: ObjectId;
  description?: string;
  status?: ActiveStatus;
  isActive?: boolean;
}

export interface CreateInterestRequest {
  name: string;
  rate: number;
  /** @default "flat" */
  rateType?: InterestRateType;
  /** @default "monthly" */
  calculationPeriod?: InterestCalculationPeriod;
  glInterestIncome: ObjectId;
  description?: string;
}

/** Affects new bookings only. */
export type UpdateInterestRequest = Partial<CreateInterestRequest>;

export interface InterestResponse {
  message?: string;
  interest?: Interest;
}

export interface ListInterestsResponse {
  message?: string;
  /** Singular key — as returned by the API. */
  interest?: Interest[];
}
