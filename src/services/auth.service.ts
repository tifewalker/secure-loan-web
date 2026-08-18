import { fetchWithRetry, handleApiError } from './api-client';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';

export const authService = {
  // Forgot password - send reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      // TODO: Update with actual endpoint when available
      const response = await fetchWithRetry('api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to send reset email');
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Reset email sent successfully' };
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      // TODO: Update with actual endpoint when available
      const response = await fetchWithRetry('api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to reset password');
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Password reset successfully' };
    } catch (error) {
      return handleApiError(error, 'Failed to reset password');
    }
  }
};