// Tag: Auth & Users — /api/users
import { api } from '../client';
import type {
  CreateUserRequest,
  DeleteAllUsersResponse,
  ListUsersResponse,
  MeResponse,
  MeWithoutRolesResponse,
  MessageResponse,
  ObjectId,
  SignInRequest,
  SignInResponse,
  UpdateUserRequest,
  UserResponse,
} from '../types';

const BASE = 'api/users';

export const authApi = {
  /** Returns a 1-day access token. Only `active` accounts can sign in. */
  signIn: (body: SignInRequest) => api.post<SignInResponse>(`${BASE}/signin`, body),
  /** Current user with role and permissions. */
  me: () => api.get<MeResponse>(`${BASE}/me`),
  /** Current user without roles. */
  meWithoutRoles: () => api.get<MeWithoutRolesResponse>(`${BASE}/me2`),
};

export const usersApi = {
  /** requires create_users. Created `inactive` by default. */
  create: (body: CreateUserRequest) => api.post<UserResponse>(`${BASE}/create`, body),
  list: () => api.get<ListUsersResponse>(`${BASE}/all`),
  /** requires update_users. */
  update: (id: ObjectId, body: UpdateUserRequest) => api.put<UserResponse>(`${BASE}/update/${id}`, body),
  /** requires update_users. Toggles active/inactive. */
  toggleActivation: (id: ObjectId) => api.post<UserResponse>(`${BASE}/activation/${id}`),
  /** requires delete_users. Cannot delete yourself. */
  remove: (id: ObjectId) => api.delete<MessageResponse>(`${BASE}/delete/${id}`),
  /** Admin only. Deletes every user except the caller. */
  removeAll: () => api.delete<DeleteAllUsersResponse>(`${BASE}/deleteAll`),
};
