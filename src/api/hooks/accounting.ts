import { useQuery } from '@tanstack/react-query';
import { feesApi, glAccountsApi, interestsApi } from '../endpoints';
import type {
  CreateFeeRequest,
  CreateGLAccountRequest,
  CreateInterestRequest,
  Fee,
  FeeResponse,
  GLAccount,
  GLAccountResponse,
  Interest,
  InterestResponse,
  MessageResponse,
  ObjectId,
  UpdateFeeRequest,
  UpdateGLAccountRequest,
  UpdateInterestRequest,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

// ---------- GL accounts ----------

export const useGLAccounts = (options?: QueryOptions<GLAccount[]>) =>
  useQuery({ queryKey: queryKeys.glAccounts.list(), queryFn: glAccountsApi.list, ...options });

export const useGLAccount = (id: ObjectId | undefined, options?: QueryOptions<GLAccount>) =>
  useQuery({
    queryKey: queryKeys.glAccounts.detail(id ?? ''),
    queryFn: () => glAccountsApi.get(id as ObjectId),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useCreateGLAccount = (options?: MutationOptions<GLAccountResponse, CreateGLAccountRequest>) =>
  useInvalidatingMutation(glAccountsApi.create, () => [queryKeys.glAccounts.all], options);

type UpdateGLVars = { id: ObjectId; data: UpdateGLAccountRequest };
export const useUpdateGLAccount = (options?: MutationOptions<GLAccountResponse, UpdateGLVars>) =>
  useInvalidatingMutation(({ id, data }: UpdateGLVars) => glAccountsApi.update(id, data), () => [queryKeys.glAccounts.all], options);

export const useToggleGLAccountStatus = (options?: MutationOptions<GLAccountResponse, ObjectId>) =>
  useInvalidatingMutation(glAccountsApi.toggleStatus, () => [queryKeys.glAccounts.all], options);

export const useDeleteGLAccount = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(glAccountsApi.remove, () => [queryKeys.glAccounts.all], options);

// ---------- Fees ----------

export const useFees = (options?: QueryOptions<Fee[]>) =>
  useQuery({
    queryKey: queryKeys.fees.list(),
    queryFn: () => feesApi.list().then((r) => r.fees ?? []),
    ...options,
  });

export const useFee = (id: ObjectId | undefined, options?: QueryOptions<Fee | undefined>) =>
  useQuery({
    queryKey: queryKeys.fees.detail(id ?? ''),
    queryFn: () => feesApi.get(id as ObjectId).then((r) => r.fee),
    ...options,
    enabled: !!id && (options?.enabled ?? true),
  });

export const useCreateFee = (options?: MutationOptions<FeeResponse, CreateFeeRequest>) =>
  useInvalidatingMutation(feesApi.create, () => [queryKeys.fees.all], options);

type UpdateFeeVars = { id: ObjectId; data: UpdateFeeRequest };
export const useUpdateFee = (options?: MutationOptions<FeeResponse, UpdateFeeVars>) =>
  useInvalidatingMutation(({ id, data }: UpdateFeeVars) => feesApi.update(id, data), () => [queryKeys.fees.all], options);

export const useToggleFeeActivation = (options?: MutationOptions<FeeResponse, ObjectId>) =>
  useInvalidatingMutation(feesApi.toggleActivation, () => [queryKeys.fees.all], options);

export const useDeleteFee = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(feesApi.remove, () => [queryKeys.fees.all], options);

// ---------- Interest ----------

export const useInterests = (options?: QueryOptions<Interest[]>) =>
  useQuery({
    queryKey: queryKeys.interests.list(),
    queryFn: () => interestsApi.list().then((r) => r.interest ?? []),
    ...options,
  });

export const useCreateInterest = (options?: MutationOptions<InterestResponse, CreateInterestRequest>) =>
  useInvalidatingMutation(interestsApi.create, () => [queryKeys.interests.all], options);

type UpdateInterestVars = { id: ObjectId; data: UpdateInterestRequest };
export const useUpdateInterest = (options?: MutationOptions<InterestResponse, UpdateInterestVars>) =>
  useInvalidatingMutation(
    ({ id, data }: UpdateInterestVars) => interestsApi.update(id, data),
    () => [queryKeys.interests.all],
    options,
  );

export const useToggleInterestActivation = (options?: MutationOptions<InterestResponse, ObjectId>) =>
  useInvalidatingMutation(interestsApi.toggleActivation, () => [queryKeys.interests.all], options);

export const useDeleteInterest = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(interestsApi.remove, () => [queryKeys.interests.all], options);
