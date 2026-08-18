import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, FileText, DollarSign, TrendingUp, CheckCircle,
  Clock, XCircle, MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Placeholder data - no API calls
const placeholderStats = {
  totalCustomers: 1247,
  activeLoans: 342,
  totalDisbursed: 2450000,
  monthlyGrowth: 12.5,
};

const placeholderRecentApplications = [
  { id: 'LN005', customer: 'Alice Johnson', amount: 15000, status: 'pending', date: '2026-08-18' },
  { id: 'LN006', customer: 'Bob Smith', amount: 8000, status: 'approved', date: '2026-08-17' },
  { id: 'LN007', customer: 'Carol Davis', amount: 25000, status: 'under-review', date: '2026-08-16' },
  { id: 'LN008', customer: 'David Wilson', amount: 12000, status: 'rejected', date: '2026-08-15' },
];

const AdminDashboardPage = () => {
  const statCards = [
    {
      label: 'Total Customers',
      value: placeholderStats.totalCustomers.toLocaleString(),
      sub: '+12% from last month',
      icon: Users,
    },
    {
      label: 'Active Loans',
      value: placeholderStats.activeLoans.toString(),
      sub: 'Currently active',
      icon: FileText,
    },
    {
      label: 'Total Disbursed',
      value: `₦${(placeholderStats.totalDisbursed / 1000000).toFixed(1)}M`,
      sub: 'This year',
      icon: DollarSign,
    },
    {
      label: 'Growth Rate',
      value: `${placeholderStats.monthlyGrowth}%`,
      sub: 'Monthly growth',
      icon: TrendingUp,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="size-3" />;
      case 'pending':
      case 'under-review':
        return <Clock className="size-3" />;
      case 'rejected':
        return <XCircle className="size-3" />;
      default:
        return <Clock className="size-3" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'under-review':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your loan management system
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent Applications</h2>
          <span className="text-xs text-muted-foreground">
            Last 4 applications
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Loan Details</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Date</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {placeholderRecentApplications.map((app) => (
                <tr
                  key={app.id}
                  className="group border-b transition-colors last:border-b-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <FileText className="size-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{app.customer}</div>
                        <div className="text-xs text-muted-foreground">Loan #{app.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium tabular-nums">
                      ₦{app.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 font-normal ${getStatusBadgeClass(app.status)}`}
                    >
                      {getStatusIcon(app.status)}
                      {getStatusDisplay(app.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground sm:table-cell">
                    {formatDate(app.date)}
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
                        <DropdownMenuItem>
                          <FileText className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;