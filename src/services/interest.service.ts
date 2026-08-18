import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { Interest, CreateInterestData, UpdateInterestData } from '@/types';

export const interestService = {
  // Get all interest rates
  getAll: async (): Promise<Interest[]> => {
    try {
      const response = await fetchWithRetry('api/interest/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch interest rates');
      }

      const result = await response.json();
      
     let interestData: Record<string, unknown>[] = [];
      if (result.interest && Array.isArray(result.interest)) {
        interestData = result.interest;
      } else if (result.interests && Array.isArray(result.interests)) {
        interestData = result.interests;
      } else if (Array.isArray(result)) {
        interestData = result;
      } else if (result.data && Array.isArray(result.data)) {
        interestData = result.data;
      } else {
        console.warn('Unexpected interest response format:', result);
        interestData = [];
      }

    return interestData.map((interest: Record<string, unknown>) => ({
  _id: interest._id as string,
  name: interest.name as string,
  rate: interest.rate as number,
  rateType: interest.rateType as Interest['rateType'],
  calculationPeriod: interest.calculationPeriod as Interest['calculationPeriod'],
  glInterestIncome: interest.glInterestIncome as string,
  status: interest.status as string,
  isActive: (interest.isActive !== undefined ? interest.isActive : interest.status === 'active') as boolean,
  createdAt: interest.createdAt as string,
  updatedAt: interest.updatedAt as string
}));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new interest rate
  create: async (interestData: CreateInterestData): Promise<Interest> => {
    try {
      const response = await authFetch('api/interest/v1/create', {
        method: 'POST',
        body: JSON.stringify(interestData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create interest rate');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        rate: result.rate,
        rateType: result.rateType,
        calculationPeriod: result.calculationPeriod,
        glInterestIncome: result.glInterestIncome,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create interest rate');
    }
  },

  // Update interest rate
  update: async (interestId: string, interestData: UpdateInterestData): Promise<Interest> => {
    try {
      const response = await authFetch(`api/interest/v1/update/${interestId}`, {
        method: 'PUT',
        body: JSON.stringify(interestData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update interest rate');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        rate: result.rate,
        rateType: result.rateType,
        calculationPeriod: result.calculationPeriod,
        glInterestIncome: result.glInterestIncome,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update interest rate');
    }
  },

  // Delete interest rate
  delete: async (interestId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/interest/v1/delete/${interestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete interest rate');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete interest rate');
    }
  },
  
  // Toggle interest rate status
  toggleStatus: async (interestId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/interest/v1/activation/${interestId}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} interest rate`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} interest rate`);
    }
  }
};