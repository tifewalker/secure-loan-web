import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { holidaysApi, loansApi, reportsApi } from '../endpoints';
import type {
  ApproveLoanRequest,
  BookLoanRequest,
  CreateHolidayRequest,
  DisburseLoanRequest,
  DisburseLoanResponse,
  Holiday,
  HolidayResponse,
  Instalment,
  ListHolidaysParams,
  ListLoansParams,
  ListLoansResponse,
  Loan,
  LoanReportKind,
  LoanResponse,
  LoanScheduleResponse,
  MessageResponse,
  ObjectId,
  PaymentRequest,
  PayoffLoanResponse,
  PayoffQuote,
  ReasonRequest,
  RepayLoanResponse,
  Repayment,
  RunLoanJobsResponse,
  UpdateLoanRequest,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

/** Anything that moves money or status touches loans, reports and wallets. */
const LOAN_SIDE_EFFECTS = [queryKeys.loans.all, queryKeys.reports.all, queryKeys.customers.wallets()];

// ---------- Loans ----------

/** Keeps the previous page visible while the next one loads. */
export const useLoans = (params?: ListLoansParams, options?: QueryOptions<ListLoansResponse>) =>
  useQuery({
    queryKey: queryKeys.loans.list(params),
    queryFn: () => loansApi.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useLoan = (id: ObjectId | undefined, options?: QueryOptions<Loan | undefined>) =>
  useQuery({
    queryKey: queryKeys.loans.detail(id ?? ''),
    queryFn: () => loansApi.get(id as ObjectId).then((r) => r.loan),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useBookLoan = (options?: MutationOptions<LoanResponse, BookLoanRequest>) =>
  useInvalidatingMutation(loansApi.book, () => [queryKeys.loans.all, queryKeys.reports.all], options);

type UpdateLoanVars = { id: ObjectId; data: UpdateLoanRequest };
export const useUpdateLoan = (options?: MutationOptions<LoanResponse, UpdateLoanVars>) =>
  useInvalidatingMutation(({ id, data }: UpdateLoanVars) => loansApi.update(id, data), () => LOAN_SIDE_EFFECTS, options);

type ApproveVars = { id: ObjectId } & ApproveLoanRequest;
export const useApproveLoan = (options?: MutationOptions<LoanResponse, ApproveVars>) =>
  useInvalidatingMutation(({ id, ...body }: ApproveVars) => loansApi.approve(id, body), () => LOAN_SIDE_EFFECTS, options);

type ReasonVars = { id: ObjectId } & ReasonRequest;
export const useRejectLoan = (options?: MutationOptions<LoanResponse, ReasonVars>) =>
  useInvalidatingMutation(({ id, reason }: ReasonVars) => loansApi.reject(id, { reason }), () => LOAN_SIDE_EFFECTS, options);

export const useDefaultLoan = (options?: MutationOptions<LoanResponse, ReasonVars>) =>
  useInvalidatingMutation(
    ({ id, reason }: ReasonVars) => loansApi.markDefault(id, { reason }),
    () => LOAN_SIDE_EFFECTS,
    options,
  );

export const useReinstateLoan = (options?: MutationOptions<LoanResponse, ReasonVars>) =>
  useInvalidatingMutation(
    ({ id, reason }: ReasonVars) => loansApi.reinstate(id, { reason }),
    () => LOAN_SIDE_EFFECTS,
    options,
  );

type DisburseVars = { id: ObjectId } & DisburseLoanRequest;
export const useDisburseLoan = (options?: MutationOptions<DisburseLoanResponse, DisburseVars>) =>
  useInvalidatingMutation(({ id, ...body }: DisburseVars) => loansApi.disburse(id, body), () => LOAN_SIDE_EFFECTS, options);

// ---------- Repayments ----------

export const useLoanSchedule = (id: ObjectId | undefined, options?: QueryOptions<LoanScheduleResponse>) =>
  useQuery({
    queryKey: queryKeys.loans.schedule(id ?? ''),
    queryFn: () => loansApi.schedule(id as ObjectId),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useLoanRepayments = (id: ObjectId | undefined, options?: QueryOptions<Repayment[]>) =>
  useQuery({
    queryKey: queryKeys.loans.repayments(id ?? ''),
    queryFn: () => loansApi.repayments(id as ObjectId).then((r) => r.repayments ?? []),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

/** Quote changes daily, so it is always refetched on mount. */
export const usePayoffQuote = (id: ObjectId | undefined, options?: QueryOptions<PayoffQuote | undefined>) =>
  useQuery({
    queryKey: queryKeys.loans.payoffQuote(id ?? ''),
    queryFn: () => loansApi.payoffQuote(id as ObjectId).then((r) => r.quote),
    staleTime: 0,
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

type PaymentVars = { id: ObjectId } & PaymentRequest;
export const useRepayLoan = (options?: MutationOptions<RepayLoanResponse, PaymentVars>) =>
  useInvalidatingMutation(({ id, ...body }: PaymentVars) => loansApi.repay(id, body), () => LOAN_SIDE_EFFECTS, options);

export const usePayoffLoan = (options?: MutationOptions<PayoffLoanResponse, PaymentVars>) =>
  useInvalidatingMutation(({ id, ...body }: PaymentVars) => loansApi.payoff(id, body), () => LOAN_SIDE_EFFECTS, options);

export const useRunLoanServicing = (options?: MutationOptions<RunLoanJobsResponse, void>) =>
  useInvalidatingMutation(() => loansApi.runServicingJobs(), () => LOAN_SIDE_EFFECTS, options);

// ---------- Reports ----------

export const useLoanReport = (kind: LoanReportKind = 'all', options?: QueryOptions<Loan[]>) =>
  useQuery({ queryKey: queryKeys.reports.loans(kind), queryFn: () => reportsApi.loans(kind), ...options });

export const useOverdueReport = (options?: QueryOptions<Instalment[]>) =>
  useQuery({
    queryKey: queryKeys.reports.overdue(),
    queryFn: () => reportsApi.overdue().then((r) => r.overdue ?? []),
    ...options,
  });

// ---------- Holidays ----------

export const useHolidays = (params?: ListHolidaysParams, options?: QueryOptions<Holiday[]>) =>
  useQuery({
    queryKey: queryKeys.holidays.list(params),
    queryFn: () => holidaysApi.list(params).then((r) => r.holidays ?? []),
    ...options,
  });

export const useCreateHoliday = (options?: MutationOptions<HolidayResponse, CreateHolidayRequest>) =>
  useInvalidatingMutation(holidaysApi.create, () => [queryKeys.holidays.all], options);

export const useDeleteHoliday = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(holidaysApi.remove, () => [queryKeys.holidays.all], options);
