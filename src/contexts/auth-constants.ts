// Error messages mapping
export const ERROR_MESSAGES = {
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
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: 'api/users/signin',
  REGISTER: 'api/users/create',
  CURRENT_USER: 'api/users/me',
} as const;

// Get API URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}${cleanEndpoint}`;
};