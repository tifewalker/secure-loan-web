import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, RegisterData, AuthContextType } from '../types';
import { ERROR_MESSAGES, STORAGE_KEYS, API_ENDPOINTS, getApiUrl } from './auth-constants';
import { authFetch } from './auth-fetch';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEYS.TOKEN)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const refreshInProgress = useRef(false);

  // Helper function to extract error message from backend response
  const extractBackendErrorMessage = useCallback((error: unknown): string => {
    if (typeof error === 'string') {
      return error.trim();
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      if (
        err.name === 'TypeError' &&
        (
          (typeof err.message === 'string' && (err.message.includes('fetch') || err.message.includes('network')))
        )
      ) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }

      if (err.message) {
        return String(err.message).trim();
      }

      if (err.error) {
        return String(err.error).trim();
      }

      if (err.msg) {
        return String(err.msg).trim();
      }
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  // Helper function to translate backend messages to user-friendly messages
  const translateErrorMessage = useCallback((backendMessage: string): string => {
    const msg = backendMessage.toLowerCase().trim();

    if (msg.includes('invalid email or password') ||
        msg.includes('invalid credentials') || 
        msg.includes('wrong password') ||
        msg.includes('incorrect password') ||
        msg.includes('authentication failed')) {
      return ERROR_MESSAGES.INVALID_CREDENTIALS;
    }

    if (msg.includes('user not found') || 
        msg.includes('no user found') ||
        msg.includes('user does not exist') ||
        msg.includes('email not found')) {
      return ERROR_MESSAGES.USER_NOT_FOUND;
    }

    if (msg.includes('account locked') || 
        msg.includes('account disabled') ||
        msg.includes('too many attempts') ||
        msg.includes('temporarily locked')) {
      return ERROR_MESSAGES.ACCOUNT_LOCKED;
    }

    if (msg.includes('access denied') || 
        msg.includes('permission denied') ||
        msg.includes('not authorized') ||
        msg.includes('unauthorized') ||
        msg.includes('forbidden') ||
        msg.includes('you do not have permission')) {
      return ERROR_MESSAGES.ACCESS_DENIED;
    }

    if (msg.includes('email already exists') || 
        msg.includes('email is already registered') ||
        msg.includes('email already in use') ||
        msg.includes('duplicate email')) {
      return ERROR_MESSAGES.EMAIL_EXISTS;
    }

    if (msg.includes('staff id already exists') || 
        msg.includes('staff id is already in use') ||
        msg.includes('staff id already registered') ||
        msg.includes('duplicate staff')) {
      return ERROR_MESSAGES.STAFF_ID_EXISTS;
    }

    if (msg.includes('password too weak') || 
        msg.includes('weak password') ||
        msg.includes('password strength') ||
        msg.includes('password requirements') ||
        msg.includes('password must be')) {
      return ERROR_MESSAGES.WEAK_PASSWORD;
    }

    if (msg.includes('passwords do not match') ||
        msg.includes('password mismatch') ||
        (msg.includes('password') && msg.includes('match'))) {
      return ERROR_MESSAGES.PASSWORD_MISMATCH;
    }

    if (msg.includes('invalid email') || 
        msg.includes('email format') ||
        msg.includes('invalid email address') ||
        msg.includes('email is not valid')) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (msg.includes('session expired') || 
        msg.includes('token expired') ||
        msg.includes('token invalid') ||
        msg.includes('invalid token') ||
        msg.includes('jwt expired') ||
        msg.includes('session timeout')) {
      return ERROR_MESSAGES.SESSION_EXPIRED;
    }

    if (msg.includes('invalid role') ||
        msg.includes('role not found') ||
        msg.includes('invalid user role')) {
      return ERROR_MESSAGES.INVALID_ROLE;
    }

    if (msg.includes('internal server error') ||
        msg.includes('server error') ||
        msg.includes('500') ||
        msg.includes('service unavailable')) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }

    if (msg.includes('network error') ||
        msg.includes('failed to fetch') ||
        msg.includes('network request failed') ||
        msg.includes('connection refused')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (backendMessage && backendMessage !== ERROR_MESSAGES.UNKNOWN_ERROR) {
      return backendMessage.charAt(0).toUpperCase() + backendMessage.slice(1);
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  // Main error handler
  const handleError = useCallback((error: unknown): string => {
    const backendMessage = extractBackendErrorMessage(error);
    const userFriendlyMessage = translateErrorMessage(backendMessage);
    
    console.error('Error Handling:', { 
      original: error, 
      extracted: backendMessage, 
      translated: userFriendlyMessage 
    });

    return userFriendlyMessage;
  }, [extractBackendErrorMessage, translateErrorMessage]);

  const clearError = () => setError(null);

  const clearAuthStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const parseUserData = useCallback((userData: unknown): User | null => {
    try {
      if (!userData) return null;
      
      const parsed = typeof userData === 'string' ? JSON.parse(userData) : userData;
      
      if (!parsed._id || !parsed.email || !parsed.role) {
        console.warn('Invalid user data structure:', parsed);
        return null;
      }
      
      const userWithPermissions = { ...parsed };
      
      if (parsed.userRoles?.roleId?.permissions) {
        userWithPermissions.permissions = parsed.userRoles.roleId.permissions.map(
          (perm: { name: string }) => perm.name
        );
        
        userWithPermissions.roleName = parsed.userRoles.roleId.name;
        
        console.log('✅ Permissions loaded:', {
          roleName: userWithPermissions.roleName,
          permissions: userWithPermissions.permissions
        });
      } else {
        userWithPermissions.permissions = [];
        userWithPermissions.roleName = parsed.department || parsed.role;
        
        console.warn('⚠️ No permissions found for user');
      }
      
      return userWithPermissions as User;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  }, []);

  const getCurrentUser = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CURRENT_USER), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
        }
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.user) {
        throw new Error('Invalid user data structure');
      }

      const fullUserData = {
        ...result.user,
        userRoles: result.userRoles
      };

      return parseUserData(fullUserData);
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }, [parseUserData]);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (refreshInProgress.current) {
      console.log('Refresh already in progress, skipping...');
      return;
    }

    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!storedToken) {
      console.log('No token available for refresh');
      clearAuthStorage();
      return;
    }

    refreshInProgress.current = true;

    try {
      const userData = await getCurrentUser(storedToken);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        setError(null);
        console.log('User refreshed successfully');
      } else {
        throw new Error('Failed to get valid user data');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      const userError = handleError(error);
      setError(userError);
      
      if (userError === ERROR_MESSAGES.SESSION_EXPIRED) {
        clearAuthStorage();
      }
    } finally {
      refreshInProgress.current = false;
    }
  }, [clearAuthStorage, getCurrentUser, handleError]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      
      if (storedToken && storedUser) {
        try {
          const userData = parseUserData(storedUser);
          
          if (userData) {
            setUser(userData);
            setToken(storedToken);

            try {
              await refreshUser();
            } catch (refreshError) {
              console.log('Background refresh failed, but keeping stored data:', refreshError);
            }
          } else {
            clearAuthStorage();
          }
        } catch (parseError) {
          console.log('Error parsing stored user data:', parseError);
          clearAuthStorage();
        }
      } else {
        clearAuthStorage();
      }

      setIsLoading(false);
      setAuthInitialized(true);
    };

    initializeAuth();
  }, [clearAuthStorage, parseUserData, refreshUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    if (!email || !password) {
      const errorMsg = 'Please enter both email and password';
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg); 
    }

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      if (result.user && result.token) {
        const userRole = result.user.role;

        if (userRole !== 'admin' && userRole !== 'staff') {
          throw new Error(ERROR_MESSAGES.ACCESS_DENIED);
        }

        const currentUser = await getCurrentUser(result.token);
        
        if (!currentUser) {
          throw new Error('Failed to fetch user details');
        }

        setUser(currentUser);
        setToken(result.token);
        
        localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        
        if (result.refreshToken || currentUser.refreshToken) {
          const refreshToken = result.refreshToken || currentUser.refreshToken;
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken!);
        }
        
        setError(null);
        return true;
      }
      
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    } catch (error) {
      const userError = handleError(error);
      setError(userError);
      throw new Error(userError);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error(ERROR_MESSAGES.PASSWORD_MISMATCH);
      }

      if (userData.password.length < 8) {
        throw new Error(ERROR_MESSAGES.WEAK_PASSWORD);
      }

      if (userData.role !== 'admin' && userData.role !== 'staff') {
        throw new Error(ERROR_MESSAGES.INVALID_ROLE);
      }

      const formData = {
        ...userData,
        confirmEmail: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        twoFaEnabled: false,
        twoFactorMethod: "",
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.REGISTER), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      if (result.user && result.token) {
        const currentUser = await getCurrentUser(result.token);
        
        if (!currentUser) {
          throw new Error('Failed to fetch user details after registration');
        }

        setUser(currentUser);
        setToken(result.token);
        localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        
        if (result.refreshToken || currentUser.refreshToken) {
          const refreshToken = result.refreshToken || currentUser.refreshToken;
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken!);
        }
        
        setError(null);
        return true;
      }
      
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    } catch (error) {
      const userError = handleError(error);
      setError(userError);
      throw new Error(userError);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuthStorage();
  }, [clearAuthStorage]);

  const getAuthHeaders = useCallback((): { Authorization: string } | Record<string, never> => {
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (currentToken !== token) {
      setToken(currentToken);
    }
    
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
  }, [token]);

  const getRefreshHeaders = useCallback((): { Authorization: string } | Record<string, never> => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {};
  }, []);

  const isAuthenticated = !!(user && token);

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
    getAuthHeaders,
    getRefreshHeaders,
    refreshUser,
    error,
    clearError,
    authInitialized,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};