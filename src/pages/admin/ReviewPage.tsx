import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Eye, Clock, CheckCircle, XCircle,
  Search, User, Calendar, DollarSign, TrendingUp,
  AlertCircle, RefreshCw, Loader2, Percent, Hash,
  BanknoteIcon, MoreHorizontal, SlidersHorizontal,
  ThumbsUp, ThumbsDown, ArrowLeft,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useLoanApplications } from '@/hooks/useLoanApplications';
import type { LoanApplication } from '../../types';

const ReviewPage = () => {
  const {
    user,
    isAuthenticated,
    authInitialized,
    authLoading,
    applications,
    loading,
    error,
    canViewApplications,
    fetchApplications,
    updateApplicationStatus,
    getStatusDisplay,
    getStatusColor,
    formatCurrency,
    getSummaryStats,
  } = useLoanApplications();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approved' | 'rejected' | null>(null);

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`${variant === 'destructive' ? '❌' : '✅'} ${title}: ${description}`);
    alert(`${variant === 'destructive' ? '❌' : '✅'} ${title}\n${description}`);
  };

  // Only pending/booked applications
  const pendingApplications = applications.filter(app =>
    app.status === 'pending' 
  );

  const filteredApplications = pendingApplications.filter(app => {
    const customerName = app.customer || '';
    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.purpose && app.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const summaryStats = getSummaryStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'booked':
      case 'under-review':
        return <Clock className="size-3.5" />;
      case 'approved':
        return <CheckCircle className="size-3.5" />;
      case 'rejected':
        return <XCircle className="size-3.5" />;
      case 'disbursed':
        return <TrendingUp className="size-3.5" />;
      default:
        return <Clock className="size-3.5" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const handleOpenReview = (app: LoanApplication) => {
    setSelectedApplication(app);
    setReviewNote('');
    setViewDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedApplication) return;
    setConfirmAction('approved');
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    setConfirmAction('rejected');
  };

  const handleConfirmAction = async () => {
    if (!selectedApplication || !confirmAction) return;
    setIsSubmitting(true);

    const result = await updateApplicationStatus(selectedApplication._id, confirmAction);

    if (result.success) {
      showToast('Success', `Application ${confirmAction === 'approved' ? 'approved' : 'rejected'} successfully`);
      setConfirmAction(null);
      setViewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNote('');
    } else {
      showToast('Error', result.error || 'Failed to update status', 'destructive');
    }

    setIsSubmitting(false);
  };

  if (!authInitialized || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="mb-1 text-base font-medium">Authentication required</p>
          <p className="text-sm text-muted-foreground">Please log in to review loan applications.</p>
        </div>
      </div>
    );
  }

  if (!canViewApplications()) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="mb-1 text-base font-medium">Access Denied</p>
          <p className="text-sm text-muted-foreground">You don't have permission to review applications.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Pending Review', value: pendingApplications.length, sub: 'Awaiting action', icon: Clock },
    { label: 'Total Amount', value: formatCurrency(pendingApplications.reduce((sum, app) => sum + app.amount, 0)), sub: 'Pending value', icon: DollarSign },
    { label: 'Avg. Amount', value: formatCurrency(pendingApplications.length > 0 ? pendingApplications.reduce((sum, app) => sum + app.amount, 0) / pendingApplications.length : 0), sub: 'Average request', icon: TrendingUp },
    { label: 'Total Approved', value: summaryStats.approved, sub: 'All time', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loan Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve pending loan applications
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
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
              <div className="mt-2 truncate text-xl font-semibold tabular-nums">{value}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by customer or purpose..."
            className="h-9 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredApplications.length} pending applications
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchApplications}>Retry</Button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CheckCircle className="size-8 text-green-500" />
            <h3 className="text-sm font-medium">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'No matching pending applications.'
                : 'There are no pending applications to review.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[220px]">Customer</TableHead>
                <TableHead>Loan Details</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{app.customer || 'Unknown Customer'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium tabular-nums">{formatCurrency(app.amount)}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="size-3" />
                          {app.requestedTerm} {app.tenureUnit || 'months'}
                        </span>
                        {app.interestRate && (
                          <span className="flex items-center gap-1">
                            <Percent className="size-3" />
                            {app.interestRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[180px] truncate text-sm text-muted-foreground" title={app.purpose}>
                      {app.purpose || 'General Loan'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex w-fit items-center gap-1 font-normal ${getStatusColor(app.status)}`}
                    >
                      {getStatusIcon(app.status)}
                      {getStatusDisplay(app.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <div>
                        <div>{formatDate(app.appliedDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(app.appliedDate)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuLabel>Review Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenReview(app)}>
                          <Eye className="mr-2 size-4" />
                          Review Application
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Review Loan Application</DialogTitle>
            <DialogDescription>
              Review the application details and approve or reject the loan.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${getStatusColor(selectedApplication.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    <span className="font-semibold">{getStatusDisplay(selectedApplication.status)}</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedApplication.amount)}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold">
                  <User className="mr-2 size-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{selectedApplication.customer || 'Unknown Customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Application Date</p>
                    <p className="font-medium">{formatDate(selectedApplication.appliedDate)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Loan Details */}
              <div>
                <h3 className="mb-3 flex items-center text-base font-semibold">
                  <BanknoteIcon className="mr-2 size-4" />
                  Loan Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Principal Amount</p>
                    <p className="font-medium">{formatCurrency(selectedApplication.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">
                      {selectedApplication.requestedTerm} {selectedApplication.tenureUnit || 'months'}
                    </p>
                  </div>
                  {selectedApplication.interestRate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="font-medium">{selectedApplication.interestRate}%</p>
                    </div>
                  )}
                  {selectedApplication.creditScore !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Score</p>
                      <p className="font-medium">{selectedApplication.creditScore}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedApplication.purpose || 'General Loan'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Review Note */}
              <div>
                <Label htmlFor="reviewNote">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNote"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 size-4" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <ThumbsDown className="mr-2 size-4" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="mr-2 size-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAction === 'approved' ? (
                <>
                  <ThumbsUp className="size-5 text-green-500" />
                  Approve Loan Application
                </>
              ) : (
                <>
                  <ThumbsDown className="size-5 text-red-500" />
                  Reject Loan Application
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <span className="font-semibold">{confirmAction === 'approved' ? 'approve' : 'reject'}</span> the loan application for{' '}
              <span className="font-semibold">{selectedApplication?.customer}</span> for the amount of{' '}
              <span className="font-semibold">{selectedApplication && formatCurrency(selectedApplication.amount)}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isSubmitting}
              className={
                confirmAction === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmAction === 'approved' ? 'Approve' : 'Reject'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewPage;