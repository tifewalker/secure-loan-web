// Tags: Roles — /api/roles/v1, Permissions — /api/permissions/v1
import { api } from '../client';
import type {
  AssignRoleResponse,
  CreatePermissionRequest,
  CreateRoleRequest,
  CurrentUserRoleResponse,
  ListPermissionsResponse,
  ListRolesResponse,
  MessageResponse,
  ObjectId,
  PermissionResponse,
  RoleAssignmentRequest,
  RoleResponse,
  UpdateAdminPermissionResponse,
  UpdateRoleRequest,
} from '../types';

const ROLES = 'api/roles/v1';
const PERMISSIONS = 'api/permissions/v1';

export const rolesApi = {
  /** requires create_roles. */
  create: (body: CreateRoleRequest) => api.post<RoleResponse>(`${ROLES}/create`, body),
  list: () => api.get<ListRolesResponse>(`${ROLES}/all`),
  /** requires update_roles. `permissions` replaces the whole list. */
  update: (id: ObjectId, body: UpdateRoleRequest) => api.put<RoleResponse>(`${ROLES}/update/${id}`, body),
  /** requires delete_roles. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${ROLES}/delete/${id}`),
  /** requires assign_roles. Replaces any previous assignment. */
  assign: (body: RoleAssignmentRequest) => api.post<AssignRoleResponse>(`${ROLES}/assign`, body),
  /** requires assign_roles. DELETE with a JSON body. */
  unassign: (body: RoleAssignmentRequest) => api.delete<MessageResponse>(`${ROLES}/remove`, { data: body }),
  /** Current user's role and permissions. */
  currentUserRole: () => api.get<CurrentUserRoleResponse>(`${ROLES}/userrole`),
  /** Admin only. Adds any permission the Admin role is missing. */
  syncAdminPermissions: () => api.post<UpdateAdminPermissionResponse>(`${ROLES}/updateAdminPermission`),
};

export const permissionsApi = {
  /** Admin only. Also added to the Admin role. */
  create: (body: CreatePermissionRequest) => api.post<PermissionResponse>(`${PERMISSIONS}/create`, body),
  list: () => api.get<ListPermissionsResponse>(`${PERMISSIONS}/all`),
};
