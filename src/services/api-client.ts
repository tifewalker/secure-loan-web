import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';

// Helper function for retry logic
export const fetchWithRetry = async (endpoint: string, options: RequestInit = {}, retries = 1): Promise<Response> => {
  try {
    return await authFetch(endpoint, options);
  } catch (error) {
    if (retries > 0 && (error instanceof Error && 
        (error.message.includes('session expired') || 
         error.message.includes('401') || 
         error.message.includes('token')))) {
      console.log(`Retrying ${endpoint}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(endpoint, options, retries - 1);
    }
    throw error;
  }
};

// Helper function to handle API errors consistently
export const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // Check for session expired errors
    if (error.message.includes('session expired') || 
        error.message.includes('401') || 
        error.message.includes('token expired')) {
      // Don't clear storage here - let AuthContext handle it
      // Just re-throw the error
    }
    throw error;
  }
  
  throw new Error(defaultMessage);
};