// Tags: GL Accounts — /api/gl/v1, Fees — /api/fee/v1, Interest — /api/interest/v1
import { api } from '../client';
import type {
  CreateFeeRequest,
  CreateGLAccountRequest,
  CreateInterestRequest,
  FeeResponse,
  GLAccount,
  GLAccountResponse,
  InterestResponse,
  ListFeesResponse,
  ListInterestsResponse,
  MessageResponse,
  ObjectId,
  UpdateFeeRequest,
  UpdateGLAccountRequest,
  UpdateInterestRequest,
} from '../types';

const GL = 'api/gl/v1';
const FEE = 'api/fee/v1';
const INTEREST = 'api/interest/v1';

export const glAccountsApi = {
  /** glCode and accountNumber are generated. */
  create: (body: CreateGLAccountRequest) => api.post<GLAccountResponse>(`${GL}/create`, body),
  /** Returns a bare array. */
  list: () => api.get<GLAccount[]>(`${GL}/all`),
  /** Returns the bare account. */
  get: (id: ObjectId) => api.get<GLAccount>(`${GL}/${id}`),
  update: (id: ObjectId, body: UpdateGLAccountRequest) => api.put<GLAccountResponse>(`${GL}/update/${id}`, body),
  /** PUT (not POST) on this resource. */
  toggleStatus: (id: ObjectId) => api.put<GLAccountResponse>(`${GL}/toggle-status/${id}`),
  /** requires delete_gl_accounts. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${GL}/delete/${id}`),
};

export const feesApi = {
  create: (body: CreateFeeRequest) => api.post<FeeResponse>(`${FEE}/create`, body),
  list: () => api.get<ListFeesResponse>(`${FEE}/all`),
  get: (id: ObjectId) => api.get<FeeResponse>(`${FEE}/${id}`),
  update: (id: ObjectId, body: UpdateFeeRequest) => api.put<FeeResponse>(`${FEE}/update/${id}`, body),
  /** Inactive fees are not charged on new bookings. */
  toggleActivation: (id: ObjectId) => api.post<FeeResponse>(`${FEE}/activation/${id}`),
  /** requires delete_fees. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${FEE}/delete/${id}`),
};

export const interestsApi = {
  create: (body: CreateInterestRequest) => api.post<InterestResponse>(`${INTEREST}/create`, body),
  list: () => api.get<ListInterestsResponse>(`${INTEREST}/all`),
  /** Affects new bookings only. */
  update: (id: ObjectId, body: UpdateInterestRequest) =>
    api.put<InterestResponse>(`${INTEREST}/update/${id}`, body),
  toggleActivation: (id: ObjectId) => api.post<InterestResponse>(`${INTEREST}/activation/${id}`),
  /** requires delete_interests. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${INTEREST}/delete/${id}`),
};
