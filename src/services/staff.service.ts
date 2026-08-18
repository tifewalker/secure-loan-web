import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { Staff, CreateStaffData, UpdateStaffData } from '@/types';

export const staffService = {
  // Get all staff
  getAll: async (): Promise<Staff[]> => {
    try {
      const response = await fetchWithRetry('api/users/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch staff');
      }

      const result = await response.json();
      
      return (result.users || result.data || result || []).map((user: Staff) => ({
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        staffId: user.staffId || '',
        accessLevel: user.accessLevel || '',
        phoneNumber: user.phoneNumber || '',
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        department: user.department || '',
        designation: user.designation || user.position || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt,
        roles: user.roles || [],
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new staff
  create: async (staffData: CreateStaffData): Promise<Staff> => {
    try {
      const response = await authFetch('api/users/create', {
        method: 'POST',
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create staff');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        email: result.email,
        firstName: result.firstName || '',
        lastName: result.lastName || '',
        staffId: result.staffId || '',
        accessLevel: result.accessLevel || '',
        phoneNumber: result.phoneNumber || '',
        fullName: result.fullName || result.name,
        department: result.department,
        designation: result.designation || result.position,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create staff');
    }
  },

  // Update staff
  update: async (staffId: string, staffData: UpdateStaffData): Promise<Staff> => {
    try {
      const response = await authFetch(`api/users/update/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update staff');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        email: result.email || staffData.email,
        firstName: result.firstName || staffData.firstName,
        lastName: result.lastName || staffData.lastName,
        staffId: result.staffId || staffData.staffId,
        accessLevel: result.accessLevel || staffData.accessLevel,
        phoneNumber: result.phoneNumber || staffData.phoneNumber,
        fullName: result.fullName || staffData.fullName,
        department: result.department || staffData.department,
        designation: result.designation || staffData.designation,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update staff');
    }
  },

  // Delete staff
  delete: async (staffId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/users/delete/${staffId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete staff');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete staff');
    }
  },

  // Toggle staff status
  toggleStatus: async (staffId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/users/activation/${staffId}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} staff`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} staff`);
    }
  }
};