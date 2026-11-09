// Tags: Customers, Customer documents — /api/customers
import { api } from '../client';
import type {
  CreateCustomerRequest,
  CustomerResponse,
  DeleteDocumentRequest,
  DocumentDownloadParams,
  DocumentDownloadResponse,
  DocumentTypesResponse,
  GetCustomerResponse,
  ListCustomersResponse,
  ListDocumentsParams,
  ListDocumentsResponse,
  MessageResponse,
  ObjectId,
  ToggleCustomerResponse,
  UpdateCustomerRequest,
  UploadDocumentRequest,
  UploadDocumentResponse,
  Wallet,
} from '../types';

const BASE = 'api/customers';

export const customersApi = {
  /** Generates a customerId, creates a wallet and emails the customer. */
  create: (body: CreateCustomerRequest) => api.post<CustomerResponse>(`${BASE}/create`, body),
  list: () => api.get<ListCustomersResponse>(`${BASE}/getall`),
  /** Customer is returned under `user`. */
  get: (id: ObjectId) => api.get<GetCustomerResponse>(`${BASE}/${id}`),
  /** Only the fields sent are changed. */
  update: (id: ObjectId, body: UpdateCustomerRequest) => api.put<CustomerResponse>(`${BASE}/update/${id}`, body),
  toggleActivation: (id: ObjectId) => api.post<ToggleCustomerResponse>(`${BASE}/activation/${id}`),
  /** Returns a bare array. */
  listWallets: () => api.get<Wallet[]>(`${BASE}/wallets`),
  /** requires delete_customers. Also deletes the wallet. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${BASE}/delete/${id}`),
  /** Admin only. Deletes every customer and wallet. */
  removeAll: () => api.delete<MessageResponse>(`${BASE}/deleteAll`),
};

export const documentsApi = {
  /** Accepted types, max size and formats — for building the upload form. */
  types: () => api.get<DocumentTypesResponse>(`${BASE}/documents/types`),
  /** multipart/form-data, one file per request, ≤ 10 MB (PDF/JPEG/PNG/WebP). */
  upload: (customerId: ObjectId, { file, documentType, loanId, description }: UploadDocumentRequest) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    if (loanId) form.append('loanId', loanId);
    if (description) form.append('description', description);
    return api.post<UploadDocumentResponse>(`${BASE}/${customerId}/documents`, form);
  },
  list: (customerId: ObjectId, params?: ListDocumentsParams) =>
    api.get<ListDocumentsResponse>(`${BASE}/${customerId}/documents`, { params }),
  /** Signed link valid for 5 minutes. */
  getDownloadUrl: (customerId: ObjectId, documentId: ObjectId, params?: DocumentDownloadParams) =>
    api.get<DocumentDownloadResponse>(`${BASE}/${customerId}/documents/${documentId}/download`, { params }),
  /** requires delete_documents. Soft-delete; DELETE with a JSON body. */
  remove: (customerId: ObjectId, documentId: ObjectId, body: DeleteDocumentRequest) =>
    api.delete<MessageResponse>(`${BASE}/${customerId}/documents/${documentId}`, { data: body }),
};
