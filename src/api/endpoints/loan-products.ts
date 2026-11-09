// Tag: Loan Products — /api/Loanproduct/v1 (capital L is part of the path)
import { api } from '../client';
import type {
  CreateLoanProductRequest,
  ListLoanProductsResponse,
  LoanProductResponse,
  MessageResponse,
  ObjectId,
  UpdateLoanProductRequest,
} from '../types';

const BASE = 'api/Loanproduct/v1';

export const loanProductsApi = {
  create: (body: CreateLoanProductRequest) => api.post<LoanProductResponse>(`${BASE}/create`, body),
  list: () => api.get<ListLoanProductsResponse>(`${BASE}/all`),
  get: (id: ObjectId) => api.get<LoanProductResponse>(`${BASE}/get/${id}`),
  /** Only the fields sent are changed. */
  update: (id: ObjectId, body: UpdateLoanProductRequest) =>
    api.put<LoanProductResponse>(`${BASE}/update/${id}`, body),
  /** Inactive products cannot be used for new bookings. */
  toggleActivation: (id: ObjectId) => api.post<LoanProductResponse>(`${BASE}/activation/${id}`),
  /** requires delete_loan_products. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${BASE}/delete/${id}`),
};
