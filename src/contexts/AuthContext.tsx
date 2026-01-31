import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, RegisterData, AuthContextType } from '@/types'; 

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Error messages mapping
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again.',
  USER_NOT_FOUND: 'No account found with this email address. Please check your email or register for a new account.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked due to too many failed login attempts. Please try again later or contact support.',
  ACCESS_DENIED: 'Access denied. You do not have permission to access this system.',
  INVALID_ROLE: 'Invalid user role. Please contact system administrator.',
  REGISTRATION_FAILED: 'Registration failed. Please check your information and try again.',
  EMAIL_EXISTS: 'This email address is already registered. Please use a different email or try logging in.',
  STAFF_ID_EXISTS: 'This staff ID is already in use. Please use a different staff ID.',
  WEAK_PASSWORD: 'Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please make sure both passwords are identical.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again to continue.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again in a few moments.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Storage keys for consistency
const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

// API endpoints
const API_ENDPOINTS = {
  LOGIN: 'api/users/signin',
  REGISTER: 'api/users/create',
  CURRENT_USER: 'api/users/me',
} as const;

// Interface for /me endpoint response based on your JSON
interface CurrentUserResponse {
  user: User;
  userRoles?: {
    roleId: {
      permissions: Array<{
        _id: string;
        name: string;
        description: string;
      }>;
    };
  };
}

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

  const getApiUrl = useCallback((endpoint: string): string => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_URL}${cleanEndpoint}`;
  }, []);

  // Helper function to extract error message from backend response
  const extractBackendErrorMessage = useCallback((error: unknown): string => {
    // Handle string errors directly
    if (typeof error === 'string') {
      return error.trim();
    }

    // Handle error objects
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Check for fetch/network errors first
      if (
        err.name === 'TypeError' &&
        (
          (typeof err.message === 'string' && (err.message.includes('fetch') || err.message.includes('network')))
        )
      ) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }

      // Check direct properties first (for plain objects from backend)
      if (err.message) {
        return String(err.message).trim();
      }

      if (err.error) {
        return String(err.error).trim();
      }

      if (err.msg) {
        return String(err.msg).trim();
      }

      // Try to get message from response.data (for axios-like responses)
      if (
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
      ) {
        const data = (err.response as { data: unknown }).data;
        
        if (typeof data === 'string') {
          return data.trim();
        }
        
        if (typeof data === 'object' && data !== null) {
          if ('message' in data && data.message) {
            return String((data as { message: unknown }).message).trim();
          }
          if ('error' in data && data.error) {
            return String((data as { error: unknown }).error).trim();
          }
          if ('msg' in data && data.msg) {
            return String((data as Record<string, unknown>).msg).trim();
          }
        }
      }
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  // Helper function to translate backend messages to user-friendly messages
  const translateErrorMessage = useCallback((backendMessage: string): string => {
    const msg = backendMessage.toLowerCase().trim();

    // Authentication errors
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

    // If no pattern matched, return the backend message if it's meaningful
    if (backendMessage && backendMessage !== ERROR_MESSAGES.UNKNOWN_ERROR) {
      return backendMessage.charAt(0).toUpperCase() + backendMessage.slice(1);
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  // Main error handler that combines extraction and translation
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

  // Helper function to safely parse user data
 
const parseUserData = useCallback((userData: unknown): User | null => {
  try {
    if (!userData) return null;
    
    const parsed = typeof userData === 'string' ? JSON.parse(userData) : userData;
    
    // Validate required fields
    if (!parsed._id || !parsed.email || !parsed.role) {
      console.warn('Invalid user data structure:', parsed);
      return null;
    }
    
    // Create user object
    const userWithPermissions = { ...parsed };
    
    // Extract permissions from userRoles.roleId.permissions
    if (parsed.userRoles?.roleId?.permissions) {
      // Extract permission names as array of strings
      userWithPermissions.permissions = parsed.userRoles.roleId.permissions.map(
        (perm: { name: string }) => perm.name
      );
      
      // Store the role name
      userWithPermissions.roleName = parsed.userRoles.roleId.name;
      
      console.log('✅ Permissions loaded:', {
        roleName: userWithPermissions.roleName,
        permissions: userWithPermissions.permissions
      });
    } else {
      // No permissions found
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

  // Function to get current user data using /me endpoint
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

    // Combine user and userRoles for parsing
    const fullUserData = {
      ...result.user,
      userRoles: result.userRoles  // Add the userRoles to the user object
    };

    return parseUserData(fullUserData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
}, [getApiUrl, parseUserData]);

  // Function to refresh user data using /me endpoint
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
        // Update user data
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
      
      // Clear auth on session expired errors
      if (userError === ERROR_MESSAGES.SESSION_EXPIRED) {
        clearAuthStorage();
      }
    } finally {
      refreshInProgress.current = false;
    }
  }, [clearAuthStorage, getCurrentUser, handleError]);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      
      console.log('Initializing auth with:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser
      });

      // If we have all required data
      if (storedToken && storedUser) {
        try {
          const userData = parseUserData(storedUser);
          
          if (userData) {
            // Set initial state from localStorage (immediate UI)
            setUser(userData);
            setToken(storedToken);

            // Validate and refresh user data in background
            try {
              await refreshUser();
            } catch (refreshError) {
              console.log('Background refresh failed, but keeping stored data:', refreshError);
              // Don't logout if refresh fails on initialization
              // User can still use the app with potentially stale data
            }
          } else {
            console.log('Invalid user data, clearing storage');
            clearAuthStorage();
          }
        } catch (parseError) {
          console.log('Error parsing stored user data:', parseError);
          clearAuthStorage();
        }
      } else {
        // Missing required auth data
        console.log('Missing auth data, clearing storage');
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

        // Get full user details using /me endpoint
        const currentUser = await getCurrentUser(result.token);
        
        if (!currentUser) {
          throw new Error('Failed to fetch user details');
        }

        setUser(currentUser);
        setToken(result.token);
        
        // Store all auth data
        localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        
        // Store refresh token if provided
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
      // Validation
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
        // Get full user details
        const currentUser = await getCurrentUser(result.token);
        
        if (!currentUser) {
          throw new Error('Failed to fetch user details after registration');
        }

        // Store all auth data
        setUser(currentUser);
        setToken(result.token);
        localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        
        // Store refresh token if provided
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
    // Always use the access token for regular API calls
    const currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    // Sync the token state if it's different
    if (currentToken !== token) {
      setToken(currentToken);
    }
    
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
  }, [token]);

  // Helper to get headers for refresh token API calls
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

// Export helper function
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${import.meta.env.VITE_API_URL}${cleanEndpoint}`;
};

// Export helper function for authenticated fetch with automatic refresh
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  
  const makeRequest = async (authToken: string | null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    return await fetch(getApiUrl(endpoint), {
      ...options,
      headers
    });
  };

  let response = await makeRequest(token);

  // If access token expired, try to refresh
  if (response.status === 401 && refreshToken && user) {
    try {
      // Try to get fresh user data with refresh token using /me endpoint
      const refreshResponse = await fetch(getApiUrl(API_ENDPOINTS.CURRENT_USER), {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const updatedUser = result.user || result;
        
        // Update stored user data
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        
        // Store new refresh token if provided
        if (updatedUser.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, updatedUser.refreshToken);
        }
        
        // Retry original request with original token
        response = await makeRequest(token);
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }
  }

  if (!response.ok) {
    let errorData;

    try {
      errorData = await response.json();
    } catch {
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
      } else if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.ACCESS_DENIED);
      } else if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      }
    }

    throw errorData;
  }

  return response;
};

// Export error messages for use in components
export { ERROR_MESSAGES };