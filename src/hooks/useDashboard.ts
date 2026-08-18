import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStats, RecentApplication } from '@/types';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    monthlyGrowth: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getDashboardData();
      setStats(data.stats);
      setRecentApplications(data.recentApplications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentApplications,
    isLoading,
    error,
    refreshDashboard: fetchDashboardData
  };
};