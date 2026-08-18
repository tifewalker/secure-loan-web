import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, RefreshCw, Download, Loader2, TrendingUp, DollarSign,
  Percent, FileText, MoreHorizontal, SlidersHorizontal,
  CheckCircle, Clock, XCircle, Wallet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useReports } from '@/hooks/useReports';
import { format } from 'date-fns';

const ReportsPage = () => {
  const {
    activeLoans,
    closedLoans,
    disbursedLoans,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    getCurrentLoans,
    getSummaryStats,
    fetchAllReports,
  } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const currentLoans = getCurrentLoans();
  const summaryStats = getSummaryStats();

  const filteredLoans = currentLoans.filter(loan => {
    const customerName = loan.customerId?.fullName || '';
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return <CheckCircle className="size-3" />;
      case 'pending':
        return <Clock className="size-3" />;
      case 'rejected':
      case 'closed':
        return <XCircle className="size-3" />;
      default:
        return <Clock className="size-3" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'rejected':
      case 'closed':
        return 'border-gray-200 bg-gray-50 text-gray-600';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  };

  const statCards = [
    { label: 'Total Loans', value: summaryStats.totalLoans, sub: 'All time', icon: FileText },
    { label: 'Principal', value: formatCurrency(summaryStats.totalPrincipal), sub: 'Total principal', icon: DollarSign },
    { label: 'Interest', value: formatCurrency(summaryStats.totalInterest), sub: 'Total interest', icon: Percent },
    { label: 'Total Repayable', value: formatCurrency(summaryStats.totalRepayable), sub: 'Principal + Interest', icon: Wallet },
  ];

  const handleExportCSV = () => {
    const headers = ['Customer', 'Email', 'Principal', 'Interest', 'Total Repayable', 'Outstanding', 'Status', 'Start Date', 'Tenure'];
    const csvContent = [
      headers.join(','),
      ...filteredLoans.map(loan => [
        `"${loan.customerId?.fullName || 'Unknown'}"`,
        `"${loan.customerId?.email || ''}"`,
        `"${loan.principalAmount}"`,
        `"${loan.interestAmount}"`,
        `"${loan.totalRepayable}"`,
        `"${loan.outstandingPrincipal + loan.outstandingInterest}"`,
        `"${loan.status}"`,
        `"${loan.startDate ? format(new Date(loan.startDate), 'yyyy-MM-dd') : ''}"`,
        `"${loan.tenure} ${loan.tenureUnit}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-report-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and analyze loan portfolio performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllReports} disabled={isLoading}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredLoans.length === 0}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="w-full justify-start rounded-lg border bg-muted/50 p-1 sm:w-auto">
          <TabsTrigger value="active" className="gap-1.5 text-xs">
            <TrendingUp className="size-3.5" />
            Active Loans
            <Badge variant="outline" className="ml-1 text-xs font-normal">{activeLoans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-1.5 text-xs">
            <XCircle className="size-3.5" />
            Closed Loans
            <Badge variant="outline" className="ml-1 text-xs font-normal">{closedLoans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="disbursed" className="gap-1.5 text-xs">
            <CheckCircle className="size-3.5" />
            Disbursed
            <Badge variant="outline" className="ml-1 text-xs font-normal">{disbursedLoans.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stat strip */}
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

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by customer name or email..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[150px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredLoans.length} of {currentLoans.length} loans
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAllReports}>
              Retry
            </Button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No loans found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : `No ${activeTab} loans available.`}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Principal</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Interest</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Total Repayable</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground lg:table-cell">Outstanding</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Start Date</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan._id} className="group border-b transition-colors last:border-b-0 hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Wallet className="size-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{loan.customerId?.fullName || 'Unknown'}</div>
                        <div className="truncate text-xs text-muted-foreground">{loan.customerId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">
                    {formatCurrency(loan.principalAmount)}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums sm:table-cell">
                    {formatCurrency(loan.interestAmount)}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm font-medium tabular-nums md:table-cell">
                    {formatCurrency(loan.totalRepayable)}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums lg:table-cell">
                    {formatCurrency(loan.outstandingPrincipal + loan.outstandingInterest)}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 font-normal ${getStatusBadgeClass(loan.status)}`}
                    >
                      {getStatusIcon(loan.status)}
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground md:table-cell">
                    {loan.startDate ? format(new Date(loan.startDate), 'MMM dd, yyyy') : 'N/A'}
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
        )}
      </div>
    </div>
  );
};

export default ReportsPage;