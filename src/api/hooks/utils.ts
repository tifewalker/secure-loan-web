import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { ApiError } from '../client';

/** Extra options a query hook accepts (everything except key and fn). */
export type QueryOptions<T> = Omit<UseQueryOptions<T, ApiError, T, QueryKey>, 'queryKey' | 'queryFn'>;

/** Extra options a mutation hook accepts (everything except the fn). */
export type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, ApiError, TVars>, 'mutationFn'>;

/**
 * useMutation that invalidates the given query keys on success, then calls the
 * caller's own onSuccess.
 */
export function useInvalidatingMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  invalidate: (vars: TVars, data: TData) => QueryKey[],
  options?: MutationOptions<TData, TVars>,
) {
  const queryClient = useQueryClient();
  return useMutation<TData, ApiError, TVars>({
    ...options,
    mutationFn,
    onSuccess: async (data, vars, ...rest) => {
      await Promise.all(invalidate(vars, data).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      return options?.onSuccess?.(data, vars, ...rest);
    },
  });
}
