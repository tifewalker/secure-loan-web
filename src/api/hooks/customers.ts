import { useQuery } from '@tanstack/react-query';
import { customersApi, documentsApi } from '../endpoints';
import type {
  CreateCustomerRequest,
  Customer,
  CustomerDocument,
  CustomerResponse,
  DeleteDocumentRequest,
  DocumentDownloadParams,
  DocumentDownloadResponse,
  DocumentTypesResponse,
  ListDocumentsParams,
  MessageResponse,
  ObjectId,
  ToggleCustomerResponse,
  UpdateCustomerRequest,
  UploadDocumentRequest,
  UploadDocumentResponse,
  Wallet,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

// ---------- Customers ----------

export const useCustomers = (options?: QueryOptions<Customer[]>) =>
  useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: () => customersApi.list().then((r) => r.customers ?? []),
    ...options,
  });

export const useCustomer = (id: ObjectId | undefined, options?: QueryOptions<Customer | undefined>) =>
  useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () => customersApi.get(id as ObjectId).then((r) => r.user),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useWallets = (options?: QueryOptions<Wallet[]>) =>
  useQuery({ queryKey: queryKeys.customers.wallets(), queryFn: customersApi.listWallets, ...options });

export const useCreateCustomer = (options?: MutationOptions<CustomerResponse, CreateCustomerRequest>) =>
  useInvalidatingMutation(customersApi.create, () => [queryKeys.customers.all], options);

type UpdateCustomerVars = { id: ObjectId; data: UpdateCustomerRequest };
export const useUpdateCustomer = (options?: MutationOptions<CustomerResponse, UpdateCustomerVars>) =>
  useInvalidatingMutation(
    ({ id, data }: UpdateCustomerVars) => customersApi.update(id, data),
    () => [queryKeys.customers.all],
    options,
  );

export const useToggleCustomerActivation = (options?: MutationOptions<ToggleCustomerResponse, ObjectId>) =>
  useInvalidatingMutation(customersApi.toggleActivation, () => [queryKeys.customers.all], options);

export const useDeleteCustomer = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(customersApi.remove, () => [queryKeys.customers.all], options);

export const useDeleteAllCustomers = (options?: MutationOptions<MessageResponse, void>) =>
  useInvalidatingMutation(() => customersApi.removeAll(), () => [queryKeys.customers.all], options);

// ---------- Documents ----------

export const useDocumentTypes = (options?: QueryOptions<DocumentTypesResponse>) =>
  useQuery({
    queryKey: queryKeys.documents.types(),
    queryFn: documentsApi.types,
    staleTime: Infinity,
    ...options,
  });

export const useCustomerDocuments = (
  customerId: ObjectId | undefined,
  params?: ListDocumentsParams,
  options?: QueryOptions<CustomerDocument[]>,
) =>
  useQuery({
    queryKey: queryKeys.documents.list(customerId ?? '', params),
    queryFn: () => documentsApi.list(customerId as ObjectId, params).then((r) => r.documents ?? []),
    ...options,
    enabled: !!customerId && (options?.enabled ?? true),
  });

type UploadDocumentVars = { customerId: ObjectId } & UploadDocumentRequest;
export const useUploadDocument = (options?: MutationOptions<UploadDocumentResponse, UploadDocumentVars>) =>
  useInvalidatingMutation(
    ({ customerId, ...data }: UploadDocumentVars) => documentsApi.upload(customerId, data),
    ({ customerId }) => [queryKeys.documents.byCustomer(customerId)],
    options,
  );

type DownloadVars = { customerId: ObjectId; documentId: ObjectId } & DocumentDownloadParams;
/**
 * Fetches a fresh 5-minute signed link on demand (a mutation, so it is never
 * served stale from the cache). Typical use: `.mutateAsync(...).then(r => window.open(r.url))`.
 */
export const useDocumentDownloadUrl = (options?: MutationOptions<DocumentDownloadResponse, DownloadVars>) =>
  useInvalidatingMutation(
    ({ customerId, documentId, ...params }: DownloadVars) => documentsApi.getDownloadUrl(customerId, documentId, params),
    () => [],
    options,
  );

type DeleteDocumentVars = { customerId: ObjectId; documentId: ObjectId } & DeleteDocumentRequest;
export const useDeleteDocument = (options?: MutationOptions<MessageResponse, DeleteDocumentVars>) =>
  useInvalidatingMutation(
    ({ customerId, documentId, reason }: DeleteDocumentVars) => documentsApi.remove(customerId, documentId, { reason }),
    ({ customerId }) => [queryKeys.documents.byCustomer(customerId)],
    options,
  );
