// ==================== DASHBOARD TYPES ====================
export interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalDisbursed: number;
  monthlyGrowth: number;
}

export interface RecentApplication {
  id: string;
  customer: string;
  amount: number;
  status: 'pending' | 'approved' | 'under-review' | 'rejected' | 'disbursed';
  date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentApplications: RecentApplication[];
}