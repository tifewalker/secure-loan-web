import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage, useUpdateLoan, type FeeTreatment, type UpdateLoanRequest } from '@/api';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, toLoanRow, type LoanRow } from './loan-utils';

interface EditLoanTermsDialogProps {
  loan: LoanRow | null;
  onOpenChange: (open: boolean) => void;
  /** Receives the re-priced loan row after a successful save. */
  onSaved?: (row: LoanRow) => void;
}

const selectClass = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const toForm = (row: LoanRow | null) => ({
  principalAmount: String(row?.amount ?? ''),
  tenure: String(row?.requestedTerm ?? ''),
  feeTreatment: (row?.loan.feeTreatment ?? 'upfront') as FeeTreatment,
  penaltyDailyRate: String(row?.loan.penalty?.dailyRate ?? 0),
  penaltyGracePeriodDays: String(row?.loan.penalty?.gracePeriodDays ?? 0),
  remarks: row?.purpose ?? '',
});

/**
 * Edits a loan through `PATCH /loan/v1/{id}`. Terms can only change while the
 * loan is pending (the API re-prices it); remarks can change at any time.
 */
export const EditLoanTermsDialog: React.FC<EditLoanTermsDialogProps> = ({ loan, onOpenChange, onSaved }) => {
  const update = useUpdateLoan();
  const [form, setForm] = useState(() => toForm(loan));
  const termsEditable = loan?.status === 'pending';

  useEffect(() => {
    if (loan) setForm(toForm(loan));
  }, [loan]);

  const handleSave = async () => {
    if (!loan) return;
    const original = toForm(loan);
    const body: UpdateLoanRequest = {};
    if (form.remarks !== original.remarks) body.remarks = form.remarks;
    if (termsEditable) {
      if (form.principalAmount !== original.principalAmount) body.principalAmount = Number(form.principalAmount);
      if (form.tenure !== original.tenure) body.tenure = Number(form.tenure);
      if (form.feeTreatment !== original.feeTreatment) body.feeTreatment = form.feeTreatment;
      if (form.penaltyDailyRate !== original.penaltyDailyRate) body.penaltyDailyRate = Number(form.penaltyDailyRate);
      if (form.penaltyGracePeriodDays !== original.penaltyGracePeriodDays) body.penaltyGracePeriodDays = Number(form.penaltyGracePeriodDays);
    }
    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }
    if (body.principalAmount !== undefined && !(body.principalAmount > 0)) {
      toast({ title: 'Invalid amount', description: 'Enter a principal amount greater than 0.', variant: 'destructive' });
      return;
    }
    try {
      const result = await update.mutateAsync({ id: loan._id, data: body });
      const repriced = result.loan;
      toast({
        title: 'Loan updated',
        description: repriced?.totalRepayable != null && termsEditable
          ? `Re-priced: total repayable is now ${formatCurrency(repriced.totalRepayable)}.`
          : result.message || 'Changes saved.',
      });
      if (repriced && onSaved) {
        // Keep the populated customer/product from the original row.
        onSaved(toLoanRow({ ...repriced, customerId: loan.loan.customerId, loanProduct: loan.loan.loanProduct }));
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Update failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!loan} onOpenChange={(open) => !update.isPending && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{termsEditable ? 'Edit Loan Terms' : 'Edit Remarks'}</DialogTitle>
          <DialogDescription>
            {termsEditable
              ? 'Interest, fees and totals are recalculated with the product’s current settings.'
              : 'Loan terms can only be changed while the loan is under review.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {termsEditable && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Principal (₦)</Label>
                  <Input type="number" min="0" className="mt-1" value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Tenure ({loan?.tenureUnit || 'months'})</Label>
                  <Input type="number" min="1" className="mt-1" value={form.tenure} onChange={(e) => setForm({ ...form, tenure: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Fees</Label>
                  <select className={selectClass} value={form.feeTreatment} onChange={(e) => setForm({ ...form, feeTreatment: e.target.value as FeeTreatment })}>
                    <option value="upfront">Deduct upfront</option>
                    <option value="spread">Spread</option>
                    <option value="first_instalment">1st instalment</option>
                  </select>
                </div>
                <div>
                  <Label>Penalty (%/day)</Label>
                  <Input type="number" min="0" step="0.01" className="mt-1" value={form.penaltyDailyRate} onChange={(e) => setForm({ ...form, penaltyDailyRate: e.target.value })} />
                </div>
                <div>
                  <Label>Grace (days)</Label>
                  <Input type="number" min="0" className="mt-1" value={form.penaltyGracePeriodDays} onChange={(e) => setForm({ ...form, penaltyGracePeriodDays: e.target.value })} />
                </div>
              </div>
            </>
          )}
          <div>
            <Label>Remarks / Purpose</Label>
            <Textarea className="mt-1 resize-none" rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
