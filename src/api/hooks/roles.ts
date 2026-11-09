import { useQuery } from '@tanstack/react-query';
import { permissionsApi, rolesApi } from '../endpoints';
import type {
  AssignRoleResponse,
  CreatePermissionRequest,
  CreateRoleRequest,
  MessageResponse,
  ObjectId,
  Permission,
  PermissionResponse,
  Role,
  RoleAssignmentRequest,
  RoleResponse,
  UpdateAdminPermissionResponse,
  UpdateRoleRequest,
} from '../types';
import { queryKeys } from './keys';
import { useInvalidatingMutation, type MutationOptions, type QueryOptions } from './utils';

// ---------- Roles ----------

export const useRoles = (options?: QueryOptions<Role[]>) =>
  useQuery({
    queryKey: queryKeys.roles.list(),
    queryFn: () => rolesApi.list().then((r) => r.roles ?? []),
    ...options,
  });

export const useCreateRole = (options?: MutationOptions<RoleResponse, CreateRoleRequest>) =>
  useInvalidatingMutation(rolesApi.create, () => [queryKeys.roles.all], options);

type UpdateRoleVars = { id: ObjectId; data: UpdateRoleRequest };
export const useUpdateRole = (options?: MutationOptions<RoleResponse, UpdateRoleVars>) =>
  useInvalidatingMutation(
    ({ id, data }: UpdateRoleVars) => rolesApi.update(id, data),
    // Permissions of the signed-in user may have changed too.
    () => [queryKeys.roles.all, queryKeys.users.all, queryKeys.auth.all],
    options,
  );

export const useDeleteRole = (options?: MutationOptions<MessageResponse, ObjectId>) =>
  useInvalidatingMutation(rolesApi.remove, () => [queryKeys.roles.all, queryKeys.users.all], options);

export const useAssignRole = (options?: MutationOptions<AssignRoleResponse, RoleAssignmentRequest>) =>
  useInvalidatingMutation(rolesApi.assign, () => [queryKeys.users.all, queryKeys.auth.all], options);

export const useUnassignRole = (options?: MutationOptions<MessageResponse, RoleAssignmentRequest>) =>
  useInvalidatingMutation(rolesApi.unassign, () => [queryKeys.users.all, queryKeys.auth.all], options);

export const useSyncAdminPermissions = (options?: MutationOptions<UpdateAdminPermissionResponse, void>) =>
  useInvalidatingMutation(() => rolesApi.syncAdminPermissions(), () => [queryKeys.roles.all, queryKeys.auth.all], options);

// ---------- Permissions ----------

export const usePermissions = (options?: QueryOptions<Permission[]>) =>
  useQuery({
    queryKey: queryKeys.permissions.list(),
    queryFn: () => permissionsApi.list().then((r) => r.permission ?? []),
    ...options,
  });

export const useCreatePermission = (options?: MutationOptions<PermissionResponse, CreatePermissionRequest>) =>
  useInvalidatingMutation(permissionsApi.create, () => [queryKeys.permissions.all, queryKeys.roles.all], options);
