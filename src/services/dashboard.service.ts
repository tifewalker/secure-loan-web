import { fetchWithRetry, handleApiError } from './api-client';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { DashboardData, DashboardStats, RecentApplication } from '@/types';

export const dashboardService = {
  // Get dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    try {
      // TODO: Replace with actual API endpoint when available
      const response = await fetchWithRetry('api/dashboard/stats', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch dashboard stats');
      }

      const result = await response.json();
      
      // Handle different response formats
      const stats = result.stats || result.data || result;
      
      return {
        totalCustomers: stats.totalCustomers || 0,
        activeLoans: stats.activeLoans || 0,
        totalDisbursed: stats.totalDisbursed || 0,
        monthlyGrowth: stats.monthlyGrowth || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for now until API is ready
      return {
        totalCustomers: 1247,
        activeLoans: 342,
        totalDisbursed: 2450000,
        monthlyGrowth: 12.5
      };
    }
  },

  // Get recent applications
  getRecentApplications: async (): Promise<RecentApplication[]> => {
    try {
      // TODO: Replace with actual API endpoint when available
      const response = await fetchWithRetry('api/loan/v1/recent', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch recent applications');
      }

      const result = await response.json();
      
    let applicationsData: Record<string, unknown>[] = [];
      if (result.applications && Array.isArray(result.applications)) {
        applicationsData = result.applications;
      } else if (Array.isArray(result)) {
        applicationsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        applicationsData = result.data;
      }

     return applicationsData.map((app: Record<string, unknown>) => ({
  id: app.id as string || app._id as string,
  customer: app.customerName as string || app.customer as string || 'Unknown',
  amount: app.amount as number || 0,
  status: app.status as RecentApplication['status'] || 'pending',
  date: app.date as string || app.appliedDate as string || new Date().toISOString().split('T')[0]
}));
    } catch (error) {
      console.error('Error fetching recent applications:', error);
      // Return mock data for now until API is ready
      return [
        { id: 'LN005', customer: 'Alice Johnson', amount: 15000, status: 'pending', date: '2024-07-06' },
        { id: 'LN006', customer: 'Bob Smith', amount: 8000, status: 'approved', date: '2024-07-05' },
        { id: 'LN007', customer: 'Carol Davis', amount: 25000, status: 'under-review', date: '2024-07-04' },
      ];
    }
  },

  // Get full dashboard data
  getDashboardData: async (): Promise<DashboardData> => {
    const [stats, recentApplications] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getRecentApplications()
    ]);

    return {
      stats,
      recentApplications
    };
  }
};