import { getApiUrl, ERROR_MESSAGES, STORAGE_KEYS, API_ENDPOINTS } from './auth-constants';

// Authenticated fetch with automatic refresh
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