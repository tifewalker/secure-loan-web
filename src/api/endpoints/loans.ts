// Tags: Loans, Repayments — /api/loan/v1 ; Reports — /api/report/v1 ; Holidays — /api/holidays/v1
import { api } from '../client';
import type {
  ApproveLoanRequest,
  BookLoanRequest,
  CreateHolidayRequest,
  DisburseLoanRequest,
  DisburseLoanResponse,
  HolidayResponse,
  ListHolidaysParams,
  ListHolidaysResponse,
  ListLoansParams,
  ListLoansResponse,
  ListRepaymentsResponse,
  LoanReportKind,
  LoanReportResponse,
  LoanResponse,
  LoanScheduleResponse,
  MessageResponse,
  ObjectId,
  OverdueReportResponse,
  PaymentRequest,
  PayoffLoanResponse,
  PayoffQuoteResponse,
  ReasonRequest,
  RepayLoanResponse,
  RunLoanJobsResponse,
  UpdateLoanRequest,
} from '../types';

const LOAN = 'api/loan/v1';
const REPORT = 'api/report/v1';
const HOLIDAYS = 'api/holidays/v1';

/** Lifecycle: book → approve → disburse → repay / payoff → closed. */
export const loansApi = {
  /** Creates a `pending` loan from a product. */
  book: (body: BookLoanRequest) => api.post<LoanResponse>(`${LOAN}/bookloan`, body),
  /** Paginated, newest first. */
  list: (params?: ListLoansParams) => api.get<ListLoansResponse>(`${LOAN}/all`, { params }),
  /** Customer populated. */
  get: (id: ObjectId) => api.get<LoanResponse>(`${LOAN}/${id}`),
  /** remarks any time; terms only while pending. */
  update: (id: ObjectId, body: UpdateLoanRequest) => api.patch<LoanResponse>(`${LOAN}/${id}`, body),
  /** requires approve_loans. pending → approved. */
  approve: (id: ObjectId, body: ApproveLoanRequest = {}) => api.post<LoanResponse>(`${LOAN}/${id}/approve`, body),
  /** requires reject_loans. pending/approved → rejected. */
  reject: (id: ObjectId, body: ReasonRequest) => api.post<LoanResponse>(`${LOAN}/${id}/reject`, body),
  /** requires default_loans. active → defaulted. */
  markDefault: (id: ObjectId, body: ReasonRequest) => api.post<LoanResponse>(`${LOAN}/${id}/default`, body),
  /** requires default_loans. defaulted → active. */
  reinstate: (id: ObjectId, body: ReasonRequest) => api.post<LoanResponse>(`${LOAN}/${id}/reinstate`, body),
  /** approved → active; generates the schedule and posts to the GL. */
  disburse: (id: ObjectId, body: DisburseLoanRequest = {}) =>
    api.post<DisburseLoanResponse>(`${LOAN}/${id}/disburse`, body),

  // ---- Repayments ----
  /** Instalments oldest first, overdue status and penalties up to today. */
  schedule: (id: ObjectId) => api.get<LoanScheduleResponse>(`${LOAN}/${id}/schedule`),
  /** Allocation order: penalty → fee → interest → principal. Duplicate reference → 409. */
  repay: (id: ObjectId, body: PaymentRequest) => api.post<RepayLoanResponse>(`${LOAN}/${id}/repay`, body),
  /** Newest first, includes payoffs and wallet sweeps. */
  repayments: (id: ObjectId) => api.get<ListRepaymentsResponse>(`${LOAN}/${id}/repayments`),
  payoffQuote: (id: ObjectId) => api.get<PayoffQuoteResponse>(`${LOAN}/${id}/payoff-quote`),
  /** amount must be ≥ quote total; excess goes to the wallet. */
  payoff: (id: ObjectId, body: PaymentRequest) => api.post<PayoffLoanResponse>(`${LOAN}/${id}/payoff`, body),
  /** Admin only. Runs overdue marking, penalties, wallet sweeps and auto-default now. */
  runServicingJobs: () => api.post<RunLoanJobsResponse>(`${LOAN}/jobs/run`),
};

const REPORT_PATHS: Record<LoanReportKind, string> = {
  all: `${REPORT}/all`,
  pending: `${REPORT}/pending/all`,
  active: `${REPORT}/active/all`,
  disbursed: `${REPORT}/disbursed/all`,
  closed: `${REPORT}/closed/all`,
  defaulted: `${REPORT}/defaulted/all`,
  rejected: `${REPORT}/rejected/all`,
};

export const reportsApi = {
  /** Bare `Loan[]`, newest first, customer and product populated. */
  loans: (kind: LoanReportKind = 'all') => api.get<LoanReportResponse>(REPORT_PATHS[kind]),
  /** Every overdue instalment, oldest due date first. */
  overdue: () => api.get<OverdueReportResponse>(`${REPORT}/overdue/all`),
};

export const holidaysApi = {
  /** requires create_holidays. Duplicate date → 409. */
  create: (body: CreateHolidayRequest) => api.post<HolidayResponse>(`${HOLIDAYS}/create`, body),
  list: (params?: ListHolidaysParams) => api.get<ListHolidaysResponse>(`${HOLIDAYS}/all`, { params }),
  /** requires delete_holidays. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${HOLIDAYS}/delete/${id}`),
};
