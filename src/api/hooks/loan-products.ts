import { useQuery } from '@tanstack/react-query';
import { loanProductsApi } from '../endpoints';
import type {
  CreateLoanProductRequest,
  LoanProduct,
  LoanProductResponse,
  MessageResponse,
  ObjectId,
  UpdateLoanProductRequest,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

export const useLoanProducts = (options?: QueryOptions<LoanProduct[]>) =>
  useQuery({
    queryKey: queryKeys.loanProducts.list(),
    queryFn: () => loanProductsApi.list().then((r) => r.loanProducts ?? []),
    ...options,
  });

export const useLoanProduct = (id: ObjectId | undefined, options?: QueryOptions<LoanProduct | undefined>) =>
  useQuery({
    queryKey: queryKeys.loanProducts.detail(id ?? ''),
    queryFn: () => loanProductsApi.get(id as ObjectId).then((r) => r.loanProduct),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useCreateLoanProduct = (options?: MutationOptions<LoanProductResponse, CreateLoanProductRequest>) =>
  useInvalidatingMutation(loanProductsApi.create, () => [queryKeys.loanProducts.all], options);

type UpdateLoanProductVars = { id: ObjectId; data: UpdateLoanProductRequest };
export const useUpdateLoanProduct = (options?: MutationOptions<LoanProductResponse, UpdateLoanProductVars>) =>
  useInvalidatingMutation(
    ({ id, data }: UpdateLoanProductVars) => loanProductsApi.update(id, data),
    () => [queryKeys.loanProducts.all],
    options,
  );

export const useToggleLoanProductActivation = (options?: MutationOptions<LoanProductResponse, ObjectId>) =>
  useInvalidatingMutation(loanProductsApi.toggleActivation, () => [queryKeys.loanProducts.all], options);

export const useDeleteLoanProduct = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(loanProductsApi.remove, () => [queryKeys.loanProducts.all], options);
