import type { ListDocumentsParams, ListHolidaysParams, ListLoansParams, LoanReportKind, ObjectId } from '../types';

/**
 * Query-key factory. Every key starts with its domain so a whole domain can be
 * invalidated with e.g. `queryClient.invalidateQueries({ queryKey: queryKeys.loans.all })`.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    meWithoutRoles: () => [...queryKeys.auth.all, 'me2'] as const,
    currentRole: () => [...queryKeys.auth.all, 'role'] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: () => [...queryKeys.roles.all, 'list'] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    list: () => [...queryKeys.permissions.all, 'list'] as const,
  },
  glAccounts: {
    all: ['glAccounts'] as const,
    list: () => [...queryKeys.glAccounts.all, 'list'] as const,
    detail: (id: ObjectId) => [...queryKeys.glAccounts.all, 'detail', id] as const,
  },
  fees: {
    all: ['fees'] as const,
    list: () => [...queryKeys.fees.all, 'list'] as const,
    detail: (id: ObjectId) => [...queryKeys.fees.all, 'detail', id] as const,
  },
  interests: {
    all: ['interests'] as const,
    list: () => [...queryKeys.interests.all, 'list'] as const,
  },
  loanProducts: {
    all: ['loanProducts'] as const,
    list: () => [...queryKeys.loanProducts.all, 'list'] as const,
    detail: (id: ObjectId) => [...queryKeys.loanProducts.all, 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: () => [...queryKeys.customers.all, 'list'] as const,
    detail: (id: ObjectId) => [...queryKeys.customers.all, 'detail', id] as const,
    wallets: () => [...queryKeys.customers.all, 'wallets'] as const,
  },
  documents: {
    all: ['documents'] as const,
    types: () => [...queryKeys.documents.all, 'types'] as const,
    list: (customerId: ObjectId, params?: ListDocumentsParams) =>
      [...queryKeys.documents.all, 'list', customerId, params ?? {}] as const,
    byCustomer: (customerId: ObjectId) => [...queryKeys.documents.all, 'list', customerId] as const,
  },
  loans: {
    all: ['loans'] as const,
    list: (params?: ListLoansParams) => [...queryKeys.loans.all, 'list', params ?? {}] as const,
    detail: (id: ObjectId) => [...queryKeys.loans.all, 'detail', id] as const,
    schedule: (id: ObjectId) => [...queryKeys.loans.all, 'schedule', id] as const,
    repayments: (id: ObjectId) => [...queryKeys.loans.all, 'repayments', id] as const,
    payoffQuote: (id: ObjectId) => [...queryKeys.loans.all, 'payoffQuote', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    loans: (kind: LoanReportKind) => [...queryKeys.reports.all, 'loans', kind] as const,
    overdue: () => [...queryKeys.reports.all, 'overdue'] as const,
  },
  holidays: {
    all: ['holidays'] as const,
    list: (params?: ListHolidaysParams) => [...queryKeys.holidays.all, 'list', params ?? {}] as const,
  },
};
