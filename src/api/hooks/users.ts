import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenStorage, type ApiError } from '../client';
import { authApi, rolesApi, usersApi } from '../endpoints';
import type {
  CreateUserRequest,
  DeleteAllUsersResponse,
  MessageResponse,
  UserResponse,
  CurrentUserRoleResponse,
  MeResponse,
  ObjectId,
  SignInRequest,
  SignInResponse,
  UpdateUserRequest,
  User,
  UserWithRoles,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

// ---------- Auth ----------

/** Signs in and stores the token. Does not touch AuthContext state. */
export const useSignIn = (options?: MutationOptions<SignInResponse, SignInRequest>) => {
  const queryClient = useQueryClient();
  return useMutation<SignInResponse, ApiError, SignInRequest>({
    ...options,
    mutationFn: authApi.signIn,
    onSuccess: async (data, ...rest) => {
      if (data.token) tokenStorage.set(data.token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      return options?.onSuccess?.(data, ...rest);
    },
  });
};

/** Clears the token and every cached query. */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  return () => {
    tokenStorage.clear();
    queryClient.clear();
  };
};

/** Current user plus role assignment (with permissions). */
export const useMe = (options?: QueryOptions<MeResponse>) =>
  useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.me, ...options });

export const useMeWithoutRoles = (options?: QueryOptions<User | undefined>) =>
  useQuery({
    queryKey: queryKeys.auth.meWithoutRoles(),
    queryFn: () => authApi.meWithoutRoles().then((r) => r.user),
    ...options,
  });

export const useCurrentUserRole = (options?: QueryOptions<CurrentUserRoleResponse>) =>
  useQuery({ queryKey: queryKeys.auth.currentRole(), queryFn: rolesApi.currentUserRole, ...options });

// ---------- Staff users ----------

export const useUsers = (options?: QueryOptions<UserWithRoles[]>) =>
  useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => usersApi.list().then((r) => r.users ?? []),
    ...options,
  });

export const useCreateUser = (options?: MutationOptions<UserResponse, CreateUserRequest>) =>
  useInvalidatingMutation(usersApi.create, () => [queryKeys.users.all], options);

type UpdateUserVars = { id: ObjectId; data: UpdateUserRequest };
export const useUpdateUser = (options?: MutationOptions<UserResponse, UpdateUserVars>) =>
  useInvalidatingMutation(({ id, data }: UpdateUserVars) => usersApi.update(id, data), () => [queryKeys.users.all], options);

export const useToggleUserActivation = (
  options?: MutationOptions<UserResponse, ObjectId>,
) => useInvalidatingMutation(usersApi.toggleActivation, () => [queryKeys.users.all], options);

export const useDeleteUser = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(usersApi.remove, () => [queryKeys.users.all, queryKeys.roles.all], options);

export const useDeleteAllUsers = (options?: MutationOptions<DeleteAllUsersResponse, void>) =>
  useInvalidatingMutation(() => usersApi.removeAll(), () => [queryKeys.users.all, queryKeys.roles.all], options);
