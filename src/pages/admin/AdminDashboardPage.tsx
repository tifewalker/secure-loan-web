import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, DollarSign, TrendingUp, CheckCircle,
  Clock, XCircle, MoreHorizontal, Percent,
  Users, RefreshCw, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import type { LoanApplication } from '../../types';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    fetchDashboardData,
    getStats,
    getRecentApplications,
    getStatusDistribution,
    getMonthlyTrend,
    getTopCustomers,
    getPortfolioByProduct,
  } = useAdminDashboard();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number): string => {
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
    return `₦${amount}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-destructive" />
          <p className="mb-1 text-base font-medium text-destructive">Error loading dashboard</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const recentApplications = getRecentApplications(5);
  const statusDistribution = getStatusDistribution();
  const monthlyTrend = getMonthlyTrend();
  const topCustomers = getTopCustomers(5);
  const portfolioByProduct = getPortfolioByProduct();

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      sub: `${stats.activeCustomers} active`,
      icon: Users,
    },
    {
      label: 'Active Loans',
      value: stats.activeLoans.toString(),
      sub: 'Currently disbursed',
      icon: FileText,
    },
    {
      label: 'Portfolio Value',
      value: formatCompact(stats.totalPortfolio),
      sub: 'Active loans',
      icon: DollarSign,
    },
    {
      label: 'Interest Earned',
      value: formatCompact(stats.totalInterestEarned),
      sub: 'All time',
      icon: Percent,
    },
  ];

  const PIE_COLORS: Record<string, string> = {
    pending: '#eab308',
    approved: '#22c55e',
    rejected: '#ef4444',
    disbursed: '#a855f7',
    closed: '#6b7280',
    defaulted: '#dc2626',
  };

  const pieData = Object.entries(statusDistribution)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status === 'pending'
        ? 'Under Review'
        : status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      status,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
          <p className="text-xs font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Amount' || entry.name === 'Value'
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'approved':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'disbursed':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'closed':
        return 'border-gray-200 bg-gray-50 text-gray-600';
      case 'defaulted':
        return 'border-red-300 bg-red-50 text-red-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status === 'pending'
      ? 'Under Review'
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytics and insights for your loan portfolio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 truncate text-xl font-semibold tabular-nums">{value}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Trend + Status Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend */}
        <Card className="border-muted-foreground/10 shadow-none lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Applications Trend</h3>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </div>
              <Badge variant="outline" className="font-normal">
                {monthlyTrend.reduce((sum, m) => sum + m.applications, 0)} total
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorApps)"
                  name="Applications"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight">Status Distribution</h3>
              <p className="text-xs text-muted-foreground">All loan applications</p>
            </div>
            {pieData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio + Top Customers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Portfolio by Product */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight">Portfolio by Product</h3>
              <p className="text-xs text-muted-foreground">Total loan value per product</p>
            </div>
            {portfolioByProduct.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={portfolioByProduct} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => formatCompact(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Top Customers</h3>
                <p className="text-xs text-muted-foreground">By total loan value</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigate('/admin/customers')}
              >
                View all
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </div>
            {topCustomers.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-muted-foreground/10 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{customer.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {customer.loanCount} loan{customer.loanCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCompact(customer.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent Applications</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate('/admin/applications')}
          >
            View all
            <ArrowRight className="ml-1 size-3" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          {recentApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <h3 className="text-sm font-medium">No applications yet</h3>
              <p className="text-sm text-muted-foreground">
                Loan applications will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Status</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Date</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app: LoanApplication) => (
                  <tr
                    key={app._id}
                    className="group border-b transition-colors last:border-b-0 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <FileText className="size-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{app.customer || 'Unknown'}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {app.purpose || 'General Loan'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">
                      {formatCurrency(app.amount)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge
                        variant="outline"
                        className={`flex w-fit items-center gap-1 font-normal ${getStatusBadgeClass(app.status)}`}
                      >
                        {getStatusDisplay(app.status)}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground md:table-cell">
                      <div>{formatDate(app.createdAt || app.appliedDate)}</div>
                      <div>{formatRelativeTime(app.createdAt || app.appliedDate)}</div>
                    </td>
                    <td className="px-2 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate('/admin/applications')}>
                            <FileText className="mr-2 size-4" />
                            View Application
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;