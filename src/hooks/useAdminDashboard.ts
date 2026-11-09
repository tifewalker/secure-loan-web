import { useMemo } from 'react';
import { getErrorMessage, useCustomers, useLoanReport, useRoles, useUsers, type Customer, type Role, type UserWithRoles } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { isDisbursed, toLoanRow, type LoanRow } from '@/components/loans/loan-utils';

export interface AdminDashboardData {
  customers: Customer[];
  applications: LoanRow[];
  staff: UserWithRoles[];
  roles: Role[];
}

const dateOf = (app: LoanRow) => new Date(app.createdAt || app.appliedDate);
const isActiveStaff = (s: UserWithRoles) => (s.status ? s.status === 'active' : !!s.isActive);

export const useAdminDashboard = () => {
  const { isAuthenticated, hasPermission } = useAuth();

  // Each source is optional: sections the user cannot see just stay empty.
  const customersQuery = useCustomers({ enabled: isAuthenticated && hasPermission('view_customers'), retry: false });
  const loansQuery = useLoanReport('all', { enabled: isAuthenticated, retry: false });
  const staffQuery = useUsers({ enabled: isAuthenticated && hasPermission('view_users'), retry: false });
  const rolesQuery = useRoles({ enabled: isAuthenticated, retry: false });

  const data: AdminDashboardData = useMemo(
    () => ({
      customers: customersQuery.data ?? [],
      applications: (loansQuery.data ?? []).map(toLoanRow),
      staff: staffQuery.data ?? [],
      roles: rolesQuery.data ?? [],
    }),
    [customersQuery.data, loansQuery.data, staffQuery.data, rolesQuery.data],
  );

  const isLoading = [customersQuery, loansQuery, staffQuery, rolesQuery].some((q) => q.isLoading);
  const error = loansQuery.error ? getErrorMessage(loansQuery.error, 'Failed to load dashboard data') : null;

  const fetchDashboardData = () =>
    Promise.all([customersQuery, loansQuery, staffQuery, rolesQuery].map((q) => q.refetch()));

  // ==================== STATS CALCULATIONS ====================
  const getStats = () => {
    const { customers, applications, staff } = data;
    const disbursed = applications.filter((app) => isDisbursed(app.status));
    const live = applications.filter((app) => app.status === 'active' || app.status === 'defaulted');

    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const inMonth = (d: Date, ref: Date) => d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    const thisMonth = applications.filter((app) => inMonth(dateOf(app), now)).length;
    const lastMonth = applications.filter((app) => inMonth(dateOf(app), lastMonthDate)).length;
    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'active').length,
      activeLoans: live.length,
      pendingReview: applications.filter((app) => app.status === 'pending').length,
      approved: applications.filter((app) => app.status === 'approved').length,
      totalDisbursed: disbursed.reduce((sum, app) => sum + app.amount, 0),
      // Money still owed on live loans.
      totalPortfolio: live.reduce((sum, app) => sum + app.outstanding, 0),
      totalInterestEarned: disbursed.reduce((sum, app) => sum + (app.loan.interestAmount ?? 0), 0),
      thisMonth,
      lastMonth,
      growthRate: Math.round(growthRate * 10) / 10,
      totalStaff: staff.length,
      activeStaff: staff.filter(isActiveStaff).length,
      totalRoles: data.roles.length,
    };
  };

  // ==================== RECENT APPLICATIONS ====================
  const getRecentApplications = (limit = 5) =>
    [...data.applications].sort((a, b) => dateOf(b).getTime() - dateOf(a).getTime()).slice(0, limit);

  // ==================== LOAN STATUS DISTRIBUTION ====================
  const getStatusDistribution = () => {
    const statuses: Record<string, number> = { pending: 0, approved: 0, disbursed: 0, rejected: 0, closed: 0, defaulted: 0 };
    data.applications.forEach((app) => {
      // `active` (post-disbursement) is shown in the "disbursed" bucket.
      const key = app.status === 'active' ? 'disbursed' : app.status;
      if (statuses[key] !== undefined) statuses[key]++;
    });
    return statuses;
  };

  // ==================== MONTHLY TREND (LAST 6 MONTHS) ====================
  const getMonthlyTrend = () => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const monthApps = data.applications.filter((app) => {
        const date = dateOf(app);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });
      return {
        month: d.toLocaleString('en-US', { month: 'short' }),
        applications: monthApps.length,
        amount: monthApps.reduce((sum, app) => sum + app.amount, 0),
      };
    });
  };

  // ==================== TOP CUSTOMERS ====================
  const getTopCustomers = (limit = 5) => {
    const customerMap = new Map<string, { id: string; name: string; totalAmount: number; loanCount: number }>();
    data.applications.forEach((app) => {
      const id = app.customerId || 'unknown';
      const entry = customerMap.get(id) ?? { id, name: app.customer || 'Unknown', totalAmount: 0, loanCount: 0 };
      entry.totalAmount += app.amount;
      entry.loanCount += 1;
      customerMap.set(id, entry);
    });
    return Array.from(customerMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  };

  // ==================== PORTFOLIO BY PRODUCT ====================
  const getPortfolioByProduct = () => {
    const productMap = new Map<string, { name: string; value: number; count: number }>();
    data.applications.forEach((app) => {
      const productId = app.loanProductId || 'unknown';
      const entry = productMap.get(productId) ?? { name: app.productName || 'Other', value: 0, count: 0 };
      entry.value += app.amount;
      entry.count += 1;
      productMap.set(productId, entry);
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
