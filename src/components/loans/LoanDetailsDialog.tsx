import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { Loan } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { LoanServicingPanel } from './LoanServicingPanel';
import { formatCurrency, getStatusColor, getStatusDisplay, isDisbursed, toLoanRow } from './loan-utils';

interface LoanDetailsDialogProps {
  loan: Loan | null;
  onOpenChange: (open: boolean) => void;
}

const fmtDate = (value?: string) => {
  try {
    return value ? format(new Date(value), 'MMM dd, yyyy') : '—';
  } catch {
    return '—';
  }
};

/** Read-only loan summary, with schedule/repayments/servicing for disbursed loans. */
export const LoanDetailsDialog: React.FC<LoanDetailsDialogProps> = ({ loan, onOpenChange }) => {
  const { hasPermission, isAdmin } = useAuth();
  const row = loan ? toLoanRow(loan) : null;

  return (
    <Dialog open={!!loan} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${row && isDisbursed(row.status) ? 'sm:max-w-[780px]' : 'sm:max-w-[600px]'}`}>
        <DialogHeader>
          <DialogTitle>Loan Details</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-5 text-sm">
            <div className={`flex items-center justify-between rounded-lg border p-4 ${getStatusColor(row.status)}`}>
              <span className="font-semibold">{getStatusDisplay(row.status)}</span>
              <span className="text-2xl font-bold">{formatCurrency(row.amount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{row.customer || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Loan Product</p>
                <p className="font-medium">{row.productName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tenure</p>
                <p className="font-medium">{row.requestedTerm} {row.tenureUnit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest</p>
                <p className="font-medium">
                  {row.interestRate != null ? `${row.interestRate}%` : '—'}
                  {row.interestType ? ` (${row.interestType.replace('_', ' ')})` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Repayable</p>
                <p className="font-medium">{formatCurrency(row.totalRepayable)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Booked</p>
                <p className="font-medium">{fmtDate(row.appliedDate)}</p>
              </div>
              {row.loan.disbursedAt && (
                <div>
                  <p className="text-muted-foreground">Disbursed</p>
                  <p className="font-medium">{fmtDate(row.loan.disbursedAt)}</p>
                </div>
              )}
              {row.loan.maturityDate && (
                <div>
                  <p className="text-muted-foreground">Maturity</p>
                  <p className="font-medium">{fmtDate(row.loan.maturityDate)}</p>
                </div>
              )}
              {(row.loan.rejectionReason || row.loan.defaultReason) && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">{row.loan.rejectionReason ? 'Rejection Reason' : 'Default Reason'}</p>
                  <p className="font-medium">{row.loan.rejectionReason || row.loan.defaultReason}</p>
                </div>
              )}
              {row.purpose && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Remarks</p>
                  <p className="font-medium">{row.purpose}</p>
                </div>
              )}
            </div>

            {!!row.loan.statusHistory?.length && (
              <div>
                <p className="mb-2 font-semibold">Status History</p>
                <div className="space-y-1">
                  {row.loan.statusHistory.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={`font-normal ${getStatusColor(h.status ?? '')}`}>
                        {getStatusDisplay(h.status ?? '')}
                      </Badge>
                      <span className="text-muted-foreground">{fmtDate(h.at)}</span>
                      {h.reason && <span className="truncate">— {h.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDisbursed(row.status) && (
              <>
                <Separator />
                <LoanServicingPanel
                  loanId={row._id}
                  status={row.status}
                  canPostPayments={isAdmin || hasPermission('update_loan_applications')}
                  canDefault={isAdmin || hasPermission('default_loans')}
                />
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
