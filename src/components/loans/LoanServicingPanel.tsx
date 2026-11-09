import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  getErrorMessage,
  useDefaultLoan,
  useLoanRepayments,
  useLoanSchedule,
  usePayoffLoan,
  usePayoffQuote,
  useReinstateLoan,
  useRepayLoan,
  type LoanStatus,
  type PaymentSource,
} from '@/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, isServiceable } from './loan-utils';

interface LoanServicingPanelProps {
  loanId: string;
  status: LoanStatus;
  canPostPayments: boolean;
  canDefault: boolean;
}

const fmtDate = (value?: string) => {
  try {
    return value ? format(new Date(value), 'MMM dd, yyyy') : '—';
  } catch {
    return '—';
  }
};

const INSTALMENT_COLORS: Record<string, string> = {
  paid: 'border-green-200 bg-green-50 text-green-700',
  partially_paid: 'border-blue-200 bg-blue-50 text-blue-700',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  pending: 'border-gray-200 bg-gray-50 text-gray-600',
  cancelled: 'border-gray-200 bg-gray-50 text-gray-400',
};

const emptyPayment = { amount: '', method: 'transfer', reference: '', paymentDate: '', source: 'external' as PaymentSource };

/** Schedule, repayment history and servicing actions for a disbursed loan. */
export const LoanServicingPanel: React.FC<LoanServicingPanelProps> = ({ loanId, status, canPostPayments, canDefault }) => {
  const serviceable = isServiceable(status);
  const schedule = useLoanSchedule(loanId);
  const repayments = useLoanRepayments(loanId);
  const quote = usePayoffQuote(loanId, { enabled: serviceable });

  const repay = useRepayLoan();
  const payoff = usePayoffLoan();
  const markDefault = useDefaultLoan();
  const reinstate = useReinstateLoan();

  const [payment, setPayment] = useState(emptyPayment);
  const [confirmPayoff, setConfirmPayoff] = useState(false);
  const [statusAction, setStatusAction] = useState<'default' | 'reinstate' | null>(null);

  const summary = schedule.data?.loan;
  const instalments = schedule.data?.schedule ?? [];

  const paymentBody = () => ({
    amount: payment.amount ? Number(payment.amount) : undefined,
    source: payment.source,
    method: payment.source === 'external' ? payment.method || undefined : undefined,
    reference: payment.reference || undefined,
    paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : undefined,
  });

  const handleRepay = async () => {
    if (payment.source === 'external' && !(Number(payment.amount) > 0)) {
      toast({ title: 'Enter an amount', description: 'An amount is required for external payments.', variant: 'destructive' });
      return;
    }
    try {
      const result = await repay.mutateAsync({ id: loanId, ...paymentBody() });
      const r = result.repayment;
      toast({
        title: r ? 'Repayment posted' : 'Nothing due',
        description: r
          ? `${formatCurrency(r.appliedAmount)} applied${r.overpayment ? `, ${formatCurrency(r.overpayment)} credited to wallet` : ''}.`
          : result.message || 'No instalment is currently due.',
      });
      setPayment(emptyPayment);
    } catch (err) {
      toast({ title: 'Repayment failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handlePayoff = async () => {
    const total = quote.data?.total ?? 0;
    try {
      await payoff.mutateAsync({
        id: loanId,
        ...paymentBody(),
        amount: payment.source === 'external' ? Math.max(Number(payment.amount) || 0, total) : undefined,
      });
      toast({ title: 'Loan paid off', description: 'The loan is now closed.' });
      setConfirmPayoff(false);
      setPayment(emptyPayment);
    } catch (err) {
      toast({ title: 'Payoff failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleStatusAction = async (reason: string) => {
    try {
      if (statusAction === 'default') await markDefault.mutateAsync({ id: loanId, reason });
      else await reinstate.mutateAsync({ id: loanId, reason });
      toast({ title: statusAction === 'default' ? 'Loan marked as defaulted' : 'Loan reinstated' });
      setStatusAction(null);
    } catch (err) {
      toast({ title: 'Action failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const outstanding =
    (summary?.outstandingPrincipal ?? 0) +
    (summary?.outstandingInterest ?? 0) +
    (summary?.outstandingFees ?? 0) +
    (summary?.outstandingPenalty ?? 0);

  return (
    <div className="space-y-4">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Outstanding', value: outstanding },
          { label: 'Principal', value: summary?.outstandingPrincipal },
          { label: 'Interest', value: summary?.outstandingInterest },
          { label: 'Total Paid', value: summary?.totalPaid },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          {serviceable && canPostPayments && <TabsTrigger value="payment">Post Payment</TabsTrigger>}
        </TabsList>

        <TabsContent value="schedule">
          {schedule.isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : instalments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No schedule yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>#</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instalments.map((i) => (
                    <TableRow key={i._id}>
                      <TableCell className="text-sm">{i.instalmentNumber}</TableCell>
                      <TableCell className="text-sm">{fmtDate(i.dueDate)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatCurrency(i.totalDue)}
                        {!!i.penaltyDue && <div className="text-xs text-red-600">incl. {formatCurrency(i.penaltyDue)} penalty</div>}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(i.totalPaid)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal ${INSTALMENT_COLORS[i.status ?? 'pending'] ?? ''}`}>
                          {(i.status ?? 'pending').replace('_', ' ')}
                          {i.status === 'overdue' && i.daysOverdue ? ` (${i.daysOverdue}d)` : ''}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="repayments">
          {repayments.isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (repayments.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No repayments yet.</p>
          ) : (
            <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {repayments.data!.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <div className="font-medium capitalize">
                      {r.type?.replace('_', ' ')} {r.source === 'wallet' && <span className="text-xs text-muted-foreground">(wallet)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(r.paymentDate)}
                      {r.method ? ` • ${r.method}` : ''}
                      {r.reference ? ` • ref ${r.reference}` : ''}
                      {r.postedBy?.fullName ? ` • by ${r.postedBy.fullName}` : ''}
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="font-medium">{formatCurrency(r.amount)}</div>
                    {!!r.overpayment && <div className="text-xs text-muted-foreground">{formatCurrency(r.overpayment)} to wallet</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {serviceable && canPostPayments && (
          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={payment.source}
                  onChange={(e) => setPayment({ ...payment, source: e.target.value as PaymentSource })}
                >
                  <option value="external">Money received</option>
                  <option value="wallet">Customer wallet</option>
                </select>
              </div>
              <div>
                <Label>Amount (₦){payment.source === 'external' ? ' *' : ''}</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1"
                  value={payment.amount}
                  onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                  placeholder={payment.source === 'wallet' ? 'Everything due' : 'Enter amount'}
                />
              </div>
              {payment.source === 'external' && (
                <>
                  <div>
                    <Label>Method</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={payment.method}
                      onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                    >
                      <option value="transfer">Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <Label>Reference</Label>
                    <Input
                      className="mt-1"
                      value={payment.reference}
                      onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                      placeholder="Must be unique"
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  max={new Date().toISOString().slice(0, 10)}
                  value={payment.paymentDate}
                  onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })}
                />
              </div>
            </div>

            {quote.data && (
              <p className="text-xs text-muted-foreground">
                Payoff today: <span className="font-medium text-foreground">{formatCurrency(quote.data.total)}</span>
                {quote.data.interestWaived ? ` (${formatCurrency(quote.data.interestWaived)} future interest waived)` : ''}
                {' • '}Wallet balance: {formatCurrency(quote.data.walletBalance)}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmPayoff(true)} disabled={!quote.data || payoff.isPending}>
                Pay Off Loan
              </Button>
              <Button onClick={handleRepay} disabled={repay.isPending}>
                {repay.isPending ? 'Posting...' : 'Post Repayment'}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {canDefault && (status === 'active' || status === 'defaulted') && (
        <div className="flex justify-end">
          {status === 'active' ? (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setStatusAction('default')}>
              Mark as Defaulted
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setStatusAction('reinstate')}>
              Reinstate Loan
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmPayoff}
        onOpenChange={setConfirmPayoff}
        title="Pay off this loan?"
        description={
          <>
            This settles every instalment and closes the loan.{' '}
            {payment.source === 'wallet'
              ? `${formatCurrency(quote.data?.total)} will be taken from the customer's wallet.`
              : `${formatCurrency(Math.max(Number(payment.amount) || 0, quote.data?.total ?? 0))} will be recorded as received; anything above ${formatCurrency(quote.data?.total)} goes to the wallet.`}
          </>
        }
        confirmLabel="Pay off"
        isPending={payoff.isPending}
        onConfirm={handlePayoff}
      />

      <ConfirmDialog
        open={!!statusAction}
        onOpenChange={(open) => !open && setStatusAction(null)}
        title={statusAction === 'default' ? 'Mark loan as defaulted?' : 'Reinstate loan?'}
        description={
          statusAction === 'default'
            ? 'Defaulted loans still accept repayments and close normally once fully paid.'
            : 'Moves the loan back to active. Refused while an instalment is still overdue past the default threshold.'
        }
        confirmLabel={statusAction === 'default' ? 'Mark defaulted' : 'Reinstate'}
        destructive={statusAction === 'default'}
        requireReason
        isPending={markDefault.isPending || reinstate.isPending}
        onConfirm={handleStatusAction}
      />
    </div>
  );
};
