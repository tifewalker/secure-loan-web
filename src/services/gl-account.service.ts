import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { GLAccount, CreateGLAccountData, UpdateGLAccountData } from '@/types';

export const glAccountService = {
  // Get all GL accounts
  getAll: async (): Promise<GLAccount[]> => {
    try {
      const response = await fetchWithRetry('api/gl/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch GL accounts');
      }

      const result = await response.json();
      
  let accountsData: Record<string, unknown>[] = [];
      if (Array.isArray(result)) {
        accountsData = result;
      } else if (result.accounts && Array.isArray(result.accounts)) {
        accountsData = result.accounts;
      } else if (result.data && Array.isArray(result.data)) {
        accountsData = result.data;
      } else {
        console.warn('Unexpected GL accounts response format:', result);
        accountsData = [];
      }

   return accountsData.map((account: Record<string, unknown>) => ({
  _id: account._id as string,
  glCode: account.glCode as string,
  glName: account.glName as string,
  level1Category: account.level1Category as string,
  accountNumber: account.accountNumber as string,
  level2Category: account.level2Category as string | undefined,
  level3Category: account.level3Category as string | undefined,
  ifrsCategory: account.ifrsCategory as string | undefined,
  description: account.description as string | undefined,
  transactionPermission: (account.transactionPermission as 'open' | 'closed') || 'open',
  status: (account.status as 'active' | 'inactive') || 'active',
  currency: (account.currency as string) || 'NGN',
  isActive: account.isActive !== undefined ? account.isActive as boolean : account.status === 'active',
  createdAt: account.createdAt as string | undefined,
  updatedAt: account.updatedAt as string | undefined
}));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get GL account by ID
  getById: async (accountId: string): Promise<GLAccount> => {
    try {
      const response = await fetchWithRetry(`api/gl/v1/${accountId}`, {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch GL account');
      }

      const result = await response.json();
      const account = result.account || result.data || result;
      
      return {
        _id: account._id,
        glCode: account.glCode,
        glName: account.glName,
        level1Category: account.level1Category,
        accountNumber: account.accountNumber,
        level2Category: account.level2Category,
        level3Category: account.level3Category,
        ifrsCategory: account.ifrsCategory,
        description: account.description,
        transactionPermission: account.transactionPermission || 'open',
        status: account.status || 'active',
        currency: account.currency || 'NGN',
        isActive: account.isActive !== undefined ? account.isActive : account.status === 'active',
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to fetch GL account');
    }
  },

  // Create new GL account
  create: async (accountData: CreateGLAccountData & { createdBy?: string }): Promise<GLAccount> => {
    try {
      const response = await authFetch('api/gl/v1/create', {
        method: 'POST',
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create GL account');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        glCode: result.glCode,
        glName: result.glName,
        level1Category: result.level1Category,
        accountNumber: result.accountNumber,
        level2Category: result.level2Category,
        level3Category: result.level3Category,
        ifrsCategory: result.ifrsCategory,
        description: result.description,
        transactionPermission: result.transactionPermission || 'open',
        status: result.status || 'active',
        currency: result.currency || 'NGN',
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create GL account');
    }
  },

  // Update GL account
  update: async (accountId: string, accountData: UpdateGLAccountData): Promise<GLAccount> => {
    try {
      const response = await authFetch(`api/gl/v1/update/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update GL account');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        glCode: result.glCode,
        glName: result.glName,
        level1Category: result.level1Category,
        accountNumber: result.accountNumber,
        level2Category: result.level2Category,
        level3Category: result.level3Category,
        ifrsCategory: result.ifrsCategory,
        description: result.description,
        transactionPermission: result.transactionPermission || 'open',
        status: result.status || 'active',
        currency: result.currency || 'NGN',
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update GL account');
    }
  },

  // Delete GL account
  delete: async (accountId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/gl/v1/delete/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete GL account');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete GL account');
    }
  },

  // Toggle GL account status
  toggleStatus: async (accountId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/gl/v1/toggle-status/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} GL account`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} GL account`);
    }
  }
};