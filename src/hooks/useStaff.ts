import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useRoles } from '@/contexts/RoleContext';
import { staffService } from '@/services/staff.service';
import type { Staff, CreateStaffData, UpdateStaffData } from '../types';

export const useStaff = () => {
  const { user, isAuthenticated, authInitialized, isLoading: authLoading } = useAuth();
  const { hasPermission, isAdmin } = useUserPermissions();
  const { roles, assignRole, removeRole, getUserRoles } = useRoles();
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const staffData = await staffService.getAll();
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch staff';
      setError(errorMessage);
      
      if (errorMessage.includes('session expired') || errorMessage.includes('401') || errorMessage.includes('token')) {
        setError('Your session has expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = async (staffData: CreateStaffData): Promise<{ success: boolean; error?: string; data?: Staff }> => {
    try {
      const newStaffMember = await staffService.create(staffData);
      setStaff(prev => [...prev, newStaffMember]);
      return { success: true, data: newStaffMember };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create staff';
      return { success: false, error: errorMessage };
    }
  };

  const updateStaff = async (staffId: string, staffData: UpdateStaffData): Promise<{ success: boolean; error?: string; data?: Staff }> => {
    try {
      const updatedStaff = await staffService.update(staffId, staffData);
      setStaff(prev => prev.map(s => s._id === staffId ? updatedStaff : s));
      return { success: true, data: updatedStaff };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update staff';
      return { success: false, error: errorMessage };
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      await staffService.toggleStatus(staffId, currentStatus);
      setStaff(prev => prev.map(s => s._id === staffId ? { ...s, isActive: !currentStatus } : s));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update staff status';
      return { success: false, error: errorMessage };
    }
  };

  const deleteStaff = async (staffId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await staffService.delete(staffId);
      setStaff(prev => prev.filter(s => s._id !== staffId));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff';
      return { success: false, error: errorMessage };
    }
  };

  const searchStaff = (searchTerm: string) => {
    if (!searchTerm) return staff;
    
    const searchLower = searchTerm.toLowerCase();
    return staff.filter(s =>
      s.fullName?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower) ||
      s.department?.toLowerCase().includes(searchLower) ||
      s.staffId?.toLowerCase().includes(searchLower)
    );
  };

  const getSummaryStats = () => {
    return {
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.isActive).length,
      departments: new Set(staff.map(s => s.department)).size,
      totalRoleAssignments: staff.reduce((total, s) => {
        const userRoles = Array.isArray(getUserRoles(s._id)) ? getUserRoles(s._id) : [];
        return total + userRoles.length;
      }, 0)
    };
  };

  const handleAssignRole = async (staffId: string, roleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await assignRole(staffId, roleId, user?._id || 'admin');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign role';
      return { success: false, error: errorMessage };
    }
  };

  const handleRemoveRole = async (staffId: string, roleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await removeRole(staffId, roleId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    hasPermission,
    isAdmin,
    roles,
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    searchStaff,
    getSummaryStats,
    handleAssignRole,
    handleRemoveRole,
    getUserRoles,
  };
};