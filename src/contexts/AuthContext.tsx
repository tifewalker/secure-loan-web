import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  authApi,
  getErrorMessage,
  queryKeys,
  tokenStorage,
  type MeResponse,
  type User,
} from '@/api';
import { toast } from '@/hooks/use-toast';
import { ERROR_MESSAGES } from './auth-constants';

/** Signed-in staff user, enriched with the permission names from their role. */
export interface AuthUser extends User {
  _id: string;
  /** Permission names from the assigned role, e.g. `view_customers`. */
  permissions: string[];
  /** Name of the assigned role, if any. */
  roleName?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while a sign-in or the initial session restore is running. */
  isLoading: boolean;
  /** False until the stored session has been checked on startup. */
  authInitialized: boolean;
  error: string | null;
  clearError: () => void;
  /** Signs in, loads the user's role and permissions, and returns the user. */
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Re-fetches the current user (e.g. after their role changes). */
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  /** Admins have every permission. */
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const STAFF_ROLES = ['admin', 'staff'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Builds the session user from `GET /api/users/me`. */
const toAuthUser = ({ user, userRoles }: MeResponse): AuthUser | null => {
  if (!user?._id) return null;
  const role = userRoles?.roleId;
  return {
    ...user,
    _id: user._id,
    fullName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' '),
    permissions: (role?.permissions ?? []).map((p) => p.name).filter((n): n is string => !!n),
    roleName: role?.name,
  };
};

const toFriendlyMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.isNetworkError) return ERROR_MESSAGES.NETWORK_ERROR;
  return getErrorMessage(error, ERROR_MESSAGES.UNKNOWN_ERROR);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!tokenStorage.get());
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentUser = useCallback(async (): Promise<AuthUser> => {
    const me = await queryClient.fetchQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.me, staleTime: 0 });
    const authUser = toAuthUser(me);
    if (!authUser) throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    if (!authUser.role || !STAFF_ROLES.includes(authUser.role)) throw new Error(ERROR_MESSAGES.ACCESS_DENIED);
    return authUser;
  }, [queryClient]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setError(null);
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the stored token on startup.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (!tokenStorage.get()) {
        setAuthInitialized(true);
        setIsLoading(false);
        return;
      }
      try {
        const authUser = await loadCurrentUser();
        if (!cancelled) setUser(authUser);
      } catch (err) {
        // Expired/invalid token or deactivated account: start signed out.
        if (!cancelled) logout();
        console.warn('Session restore failed:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser, logout]);

  // Any 401 from the API means the token is no longer valid.
  useEffect(() => {
    const onUnauthorized = () => {
      if (!tokenStorage.get()) return;
      logout();
      toast({ title: 'Session expired', description: ERROR_MESSAGES.SESSION_EXPIRED, variant: 'destructive' });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setError(null);
      if (!email || !password) {
        const message = 'Please enter both email and password';
        setError(message);
        throw new Error(message);
      }

      setIsLoading(true);
      try {
        const result = await authApi.signIn({ email, password });
        if (!result.token) throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
        if (result.user?.role && !STAFF_ROLES.includes(result.user.role)) {
          throw new Error(ERROR_MESSAGES.ACCESS_DENIED);
        }

        tokenStorage.set(result.token);
        const authUser = await loadCurrentUser();
        setToken(result.token);
        setUser(authUser);
        return authUser;
      } catch (err) {
        tokenStorage.clear();
        const message = toFriendlyMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCurrentUser],
  );

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.get()) return;
    try {
      setUser(await loadCurrentUser());
    } catch (err) {
      setError(toFriendlyMessage(err));
    }
  }, [loadCurrentUser]);

  const value = useMemo<AuthContextType>(() => {
    const isAdmin = user?.role === 'admin';
    const hasPermission = (permission: string) => isAdmin || !!user?.permissions.includes(permission);
    return {
      user,
      token,
      isAuthenticated: !!(user && token),
      isLoading,
      authInitialized,
      error,
      clearError: () => setError(null),
      login,
      logout,
      refreshUser,
      isAdmin,
      hasPermission,
      hasAnyPermission: (permissions) => permissions.some(hasPermission),
    };
  }, [user, token, isLoading, authInitialized, error, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
