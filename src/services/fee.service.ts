import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { Fee, CreateFeeData, UpdateFeeData } from '@/types';

export const feeService = {
  // Get all fees
  getAll: async (): Promise<Fee[]> => {
    try {
      const response = await fetchWithRetry('api/fee/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch fees');
      }

      const result = await response.json();
      
  let feesData: Fee[] = [];
      if (result.fees && Array.isArray(result.fees)) {
        feesData = result.fees;
      } else if (Array.isArray(result)) {
        feesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        feesData = result.data;
      } else {
        console.warn('Unexpected fees response format:', result);
        feesData = [];
      }

      return feesData.map((fee: Fee) => ({
        _id: fee._id,
        name: fee.name,
        type: fee.type,
        value: fee.value,
        glAccount: fee.glAccount,
        status: fee.status,
        isActive: fee.status === 'active',
        createdAt: fee.createdAt,
        updatedAt: fee.updatedAt
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new fee
  create: async (feeData: CreateFeeData & { createdBy?: string }): Promise<Fee> => {
    try {
      const response = await authFetch('api/fee/v1/create', {
        method: 'POST',
        body: JSON.stringify(feeData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create fee');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        type: result.type,
        value: result.value,
        glAccount: result.glAccount,
        status: result.status !== undefined ? result.status : (result.isActive ? 'active' : 'inactive'),
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create fee');
    }
  },

  // Update fee
  update: async (feeId: string, feeData: UpdateFeeData & { updatedBy?: string }): Promise<Fee> => {
    try {
      const response = await authFetch(`api/fee/v1/update/${feeId}`, {
        method: 'PUT',
        body: JSON.stringify(feeData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update fee');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        type: result.type,
        value: result.value,
        glAccount: result.glAccount,
        status: result.status !== undefined ? result.status : (result.isActive ? 'active' : 'inactive'),
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update fee');
    }
  },

  // Delete fee
  delete: async (feeId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/fee/v1/delete/${feeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete fee');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete fee');
    }
  },

  // Toggle fee status
  toggleStatus: async (feeId: string, currentStatus: boolean, updatedBy?: string): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/fee/v1/activation/${feeId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          isActive: !currentStatus,
          updatedBy: updatedBy 
        })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} fee`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} fee`);
    }
  }
};