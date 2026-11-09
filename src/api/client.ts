import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from './types';

/** localStorage key for the access token (shared with AuthContext). */
export const TOKEN_STORAGE_KEY = 'token';

/** Fired on window when the API answers 401, so the auth layer can log out. */
export const UNAUTHORIZED_EVENT = 'api:unauthorized';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Normalised error thrown by every API call. */
export class ApiError extends Error {
  readonly status: number;
  readonly data?: ApiErrorBody;

  constructor(message: string, status: number, data?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isNetworkError() {
    return this.status === 0;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'Unable to reach the server. Check your connection and try again.',
  400: 'The request was invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This record already exists.',
  500: 'Something went wrong on the server. Please try again.',
};

const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorBody>;
    const status = err.response?.status ?? 0;
    const data = err.response?.data;
    const message =
      (typeof data === 'object' && (data?.message || data?.error)) ||
      FALLBACK_MESSAGES[status] ||
      FALLBACK_MESSAGES[500];
    return new ApiError(message, status, typeof data === 'object' ? data : undefined);
  }
  return new ApiError(error instanceof Error ? error.message : FALLBACK_MESSAGES[500], 0);
};

/** Ensures the base URL ends with a single slash. */
const baseURL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '') + '/';

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let the browser set the multipart boundary.
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    // Sign-in failures are 400/403, so any 401 means the token is missing/expired.
    if (apiError.isUnauthorized && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: apiError }));
    }
    return Promise.reject(apiError);
  },
);

/** Thin typed wrappers that return the response body. Paths have no leading slash. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => http.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.put<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => http.delete<T>(url, config).then((r) => r.data),
};

/** Extracts a user-facing message from anything thrown by the API layer. */
export const getErrorMessage = (error: unknown, fallback = FALLBACK_MESSAGES[500]): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
