import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, RefreshCw, Download, Loader2, TrendingUp, DollarSign,
  Percent, FileText, MoreHorizontal, SlidersHorizontal,
  CheckCircle, Clock, XCircle, Wallet, AlertTriangle, CalendarClock, Layers,
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
import { useReports, type ReportTab } from '@/hooks/useReports';
import { LoanDetailsDialog } from '@/components/loans/LoanDetailsDialog';
import { formatCurrency, getStatusColor, getStatusDisplay } from '@/components/loans/loan-utils';
import type { Loan } from '@/api';
import { format } from 'date-fns';

const TABS: { value: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'active', label: 'Active', icon: TrendingUp },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'disbursed', label: 'Disbursed', icon: CheckCircle },
  { value: 'closed', label: 'Closed', icon: XCircle },
  { value: 'defaulted', label: 'Defaulted', icon: AlertTriangle },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: 'overdue', label: 'Overdue', icon: CalendarClock },
  { value: 'all', label: 'All Loans', icon: Layers },
];

const TAB_DESCRIPTIONS: Record<ReportTab, string> = {
  active: 'Disbursed loans that are still being repaid',
  pending: 'Booked loans awaiting approval',
  disbursed: 'Every loan that has been paid out, including closed ones',
  closed: 'Fully repaid or paid-off loans',
  defaulted: 'Loans marked as defaulted',
  rejected: 'Loans rejected before disbursement',
  overdue: 'Every overdue instalment, oldest due date first',
  all: 'Every loan in the system',
};

const fmtDate = (value?: string, pattern = 'MMM dd, yyyy') => {
  try {
    return value ? format(new Date(value), pattern) : 'N/A';
  } catch {
    return 'N/A';
  }
};

const ReportsPage = () => {
  const {
    overdue,
    counts,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    getCurrentLoans,
    getSummaryStats,
    getOverdueStats,
    fetchAllReports,
  } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsLoan, setDetailsLoan] = useState<Loan | null>(null);

  const isOverdueTab = activeTab === 'overdue';
  const search = searchTerm.toLowerCase();
  const currentLoans = getCurrentLoans();
  const summaryStats = getSummaryStats();
  const overdueStats = getOverdueStats();

  const filteredLoans = currentLoans.filter((loan) => {
    const matchesSearch =
      (loan.customerId?.fullName || '').toLowerCase().includes(search) ||
      (loan.customerId?.email || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOverdue = overdue.filter(
    (o) =>
      (o.customer?.fullName || '').toLowerCase().includes(search) ||
      (o.customer?.email || '').toLowerCase().includes(search),
  );

  // Status filter only makes sense on tabs that mix statuses.
  const showStatusFilter = activeTab === 'all' || activeTab === 'disbursed';

  const statCards = isOverdueTab
    ? [
        { label: 'Overdue Instalments', value: overdueStats.instalments, sub: 'Past due date', icon: CalendarClock },
        { label: 'Loans Affected', value: overdueStats.loans, sub: 'With overdue instalments', icon: FileText },
        { label: 'Amount Overdue', value: formatCurrency(overdueStats.amountOverdue), sub: 'Due minus paid', icon: DollarSign },
        { label: 'Penalties', value: formatCurrency(overdueStats.penalties), sub: 'Unpaid penalties', icon: AlertTriangle },
      ]
    : [
        { label: 'Total Loans', value: summaryStats.totalLoans, sub: 'In this report', icon: FileText },
        { label: 'Principal', value: formatCurrency(summaryStats.totalPrincipal), sub: 'Total principal', icon: DollarSign },
        { label: 'Interest', value: formatCurrency(summaryStats.totalInterest), sub: 'Total interest', icon: Percent },
        { label: 'Outstanding', value: formatCurrency(summaryStats.totalOutstanding), sub: 'Still owed', icon: Wallet },
      ];

  const downloadCSV = (headers: string[], rows: (string | number)[][]) => {
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-report-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (isOverdueTab) {
      downloadCSV(
        ['Customer', 'Email', 'Instalment', 'Due Date', 'Days Overdue', 'Total Due', 'Paid', 'Overdue Amount', 'Penalty'],
        filteredOverdue.map((o) => [
          o.customer?.fullName || 'Unknown',
          o.customer?.email || '',
          o.instalmentNumber ?? '',
          fmtDate(o.dueDate, 'yyyy-MM-dd'),
          o.daysOverdue ?? '',
          o.totalDue ?? 0,
          o.totalPaid ?? 0,
          o.amountOverdue,
          o.penaltyDue ?? 0,
        ]),
      );
      return;
    }
    downloadCSV(
      ['Customer', 'Email', 'Principal', 'Interest', 'Total Repayable', 'Outstanding', 'Status', 'Start Date', 'Tenure'],
      filteredLoans.map((loan) => [
        loan.customerId?.fullName || 'Unknown',
        loan.customerId?.email || '',
        loan.principalAmount,
        loan.interestAmount,
        loan.totalRepayable,
        loan.outstandingTotal,
        getStatusDisplay(loan.status),
        loan.startDate ? fmtDate(loan.startDate, 'yyyy-MM-dd') : '',
        `${loan.tenure} ${loan.tenureUnit}`,
      ]),
    );
  };

  const rowCount = isOverdueTab ? filteredOverdue.length : filteredLoans.length;
  const totalCount = isOverdueTab ? overdue.length : currentLoans.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">{TAB_DESCRIPTIONS[activeTab]}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchAllReports()} disabled={isLoading}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={rowCount === 0}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as ReportTab);
          setStatusFilter('all');
        }}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-lg border bg-muted/50 p-1 sm:w-auto">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs">
              <Icon className="size-3.5" />
              {label}
              {counts[value] !== undefined && (
                <Badge variant="outline" className="ml-1 text-xs font-normal">{counts[value]}</Badge>
              )}
            </TabsTrigger>
          ))}
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
          {showStatusFilter && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[150px]">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {activeTab === 'all' && <SelectItem value="pending">Under Review</SelectItem>}
                {activeTab === 'all' && <SelectItem value="approved">Approved</SelectItem>}
                {activeTab === 'all' && <SelectItem value="rejected">Rejected</SelectItem>}
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {rowCount} of {totalCount} {isOverdueTab ? 'instalments' : 'loans'}
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
            <Button variant="outline" size="sm" onClick={() => fetchAllReports()}>
              Retry
            </Button>
          </div>
        ) : rowCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">{isOverdueTab ? 'No overdue instalments' : 'No loans found'}</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Nothing in this report yet.'}
            </p>
          </div>
        ) : isOverdueTab ? (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Instalment</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Days Overdue</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">Total Due</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Overdue</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground lg:table-cell">Penalty</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredOverdue.map((o) => (
                <tr key={o._id} className="group border-b transition-colors last:border-b-0 hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <CalendarClock className="size-3.5 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{o.customer?.fullName || 'Unknown'}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {o.customer?.phoneNumber || o.customer?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    #{o.instalmentNumber}
                    {o.loan?.principalAmount != null && (
                      <div className="text-xs text-muted-foreground">of {formatCurrency(o.loan.principalAmount)} loan</div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">{fmtDate(o.dueDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className="border-red-200 bg-red-50 font-normal text-red-700">
                      {o.daysOverdue ?? 0}d
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums md:table-cell">{formatCurrency(o.totalDue)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">{formatCurrency(o.amountOverdue)}</td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums lg:table-cell">{formatCurrency(o.penaltyDue)}</td>
                  <td className="px-2 py-3">
                    {o.loan && (
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
                          <DropdownMenuItem
                            onClick={() =>
                              setDetailsLoan({ ...o.loan!, customerId: typeof o.loan!.customerId === 'object' ? o.loan!.customerId : o.customer ?? o.loan!.customerId })
                            }
                          >
                            <FileText className="mr-2 size-4" />
                            View Loan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(loan.principalAmount)}</td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums sm:table-cell">{formatCurrency(loan.interestAmount)}</td>
                  <td className="hidden px-4 py-3 text-right text-sm font-medium tabular-nums md:table-cell">
                    {formatCurrency(loan.totalRepayable)}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums lg:table-cell">{formatCurrency(loan.outstandingTotal)}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge variant="outline" className={`flex w-fit items-center gap-1 font-normal ${getStatusColor(loan.status)}`}>
                      {getStatusDisplay(loan.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground md:table-cell">
                    {loan.startDate ? fmtDate(loan.startDate) : 'N/A'}
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
                        <DropdownMenuItem onClick={() => setDetailsLoan(loan.loan)}>
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

      <LoanDetailsDialog loan={detailsLoan} onOpenChange={(open) => !open && setDetailsLoan(null)} />
    </div>
  );
};

export default ReportsPage;
