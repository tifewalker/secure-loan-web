import { useState, useEffect, useRef, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { loanService } from '@/services/loan.service';
import { staffService } from '@/services/staff.service';
import { roleService } from '@/services/role.service';
import type { Customer, LoanApplication, Staff, Role } from '../types';

export interface AdminDashboardData {
  customers: Customer[];
  applications: LoanApplication[];
  staff: Staff[];
  roles: Role[];
}

export const useAdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData>({
    customers: [],
    applications: [],
    staff: [],
    roles: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [customers, applications, staff, roles] = await Promise.all([
        customerService.getAll().catch(() => []),
        loanService.getApplications().catch(() => []),
        staffService.getAll().catch(() => []),
        roleService.getAll().catch(() => []),
      ]);

      setData({
        customers: customers || [],
        applications: applications || [],
        staff: staff || [],
        roles: roles || [],
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== STATS CALCULATIONS ====================
  const getStats = () => {
    const { customers, applications, staff } = data;

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;

    const activeLoans = applications.filter(
      app => app.status === 'disbursed'
    ).length;

    const pendingReview = applications.filter(
      app => app.status === 'pending'
    ).length;

    const approved = applications.filter(
      app => app.status === 'approved'
    ).length;

    const totalDisbursed = applications
      .filter(app => app.status === 'disbursed' || app.status === 'closed')
      .reduce((sum, app) => sum + (app.amount || 0), 0);

    const totalPortfolio = applications
      .filter(app => app.status === 'disbursed')
      .reduce((sum, app) => sum + (app.amount || 0), 0);

    const totalInterestEarned = applications
      .filter(app => app.status === 'disbursed' || app.status === 'closed')
      .reduce((sum, app) => {
        const interest = (app.totalRepayable || 0) - (app.amount || 0);
        return sum + interest;
      }, 0);

    // Growth calculation — this month vs last month
    const now = new Date();
    const thisMonth = applications.filter(app => {
      const d = new Date(app.createdAt || app.appliedDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const lastMonth = applications.filter(app => {
      const d = new Date(app.createdAt || app.appliedDate);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastMonthDate.getMonth() &&
             d.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    const growthRate = lastMonth > 0
      ? ((thisMonth - lastMonth) / lastMonth) * 100
      : thisMonth > 0 ? 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      activeLoans,
      pendingReview,
      approved,
      totalDisbursed,
      totalPortfolio,
      totalInterestEarned,
      thisMonth,
      lastMonth,
      growthRate: Math.round(growthRate * 10) / 10,
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.isActive).length,
      totalRoles: data.roles.length,
    };
  };

  // ==================== RECENT APPLICATIONS ====================
  const getRecentApplications = (limit = 5) => {
    return [...data.applications]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.appliedDate).getTime();
        const dateB = new Date(b.createdAt || b.appliedDate).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  };

  // ==================== LOAN STATUS DISTRIBUTION ====================
  const getStatusDistribution = () => {
    const { applications } = data;
    const statuses: Record<string, number> = {
      pending: 0,
      approved: 0,
      disbursed: 0,
      rejected: 0,
      closed: 0,
      defaulted: 0,
    };

    applications.forEach(app => {
      if (statuses[app.status] !== undefined) {
        statuses[app.status]++;
      }
    });

    return statuses;
  };

  // ==================== MONTHLY TREND (LAST 6 MONTHS) ====================
  const getMonthlyTrend = () => {
    const months: { month: string; applications: number; amount: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthApps = data.applications.filter(app => {
        const date = new Date(app.createdAt || app.appliedDate);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      months.push({
        month: monthLabel,
        applications: monthApps.length,
        amount: monthApps.reduce((sum, app) => sum + (app.amount || 0), 0),
      });
    }

    return months;
  };

  // ==================== TOP CUSTOMERS ====================
  const getTopCustomers = (limit = 5) => {
    const customerMap = new Map<string, {
      id: string;
      name: string;
      totalAmount: number;
      loanCount: number;
    }>();

    data.applications.forEach(app => {
      const id = app.customerId || 'unknown';
      const name = app.customer || 'Unknown';

      if (!customerMap.has(id)) {
        customerMap.set(id, { id, name, totalAmount: 0, loanCount: 0 });
      }

      const entry = customerMap.get(id)!;
      entry.totalAmount += app.amount || 0;
      entry.loanCount += 1;
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  };

  // ==================== PORTFOLIO BY PRODUCT ====================
  const getPortfolioByProduct = () => {
    const productMap = new Map<string, { name: string; value: number; count: number }>();

    data.applications.forEach(app => {
      const productId = app.loanProductId || 'unknown';
      const productName = app.purpose || 'Other';

      if (!productMap.has(productId)) {
        productMap.set(productId, { name: productName, value: 0, count: 0 });
      }

      const entry = productMap.get(productId)!;
      entry.value += app.amount || 0;
      entry.count += 1;
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  return {
    ...data,
    isLoading,
    error,
    fetchDashboardData,
    getStats,
    getRecentApplications,
    getStatusDistribution,
    getMonthlyTrend,
    getTopCustomers,
    getPortfolioByProduct,
  };
};