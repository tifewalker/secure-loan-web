import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { CreateLoanProductRequest, GLCategory, GLMapping, LoanProduct, TimeUnit } from '@/api';
import type { FeeRow, GLRow, InterestRow } from '@/components/accounting/accounting-utils';

const TIME_UNITS: TimeUnit[] = ['days', 'weeks', 'months', 'years'];

/** Each GL slot of a product and the account category it normally belongs to. */
const GL_FIELDS: { key: keyof GLMapping; label: string; category: GLCategory; required: boolean; hint?: string }[] = [
  { key: 'principalReceivable', label: 'Principal Receivable', category: 'Asset', required: true },
  { key: 'interestReceivable', label: 'Interest Receivable', category: 'Asset', required: true },
  { key: 'interestIncome', label: 'Interest Income', category: 'Income', required: true },
  { key: 'feeIncome', label: 'Fee Income', category: 'Income', required: true },
  { key: 'disbursementAccount', label: 'Disbursement Account', category: 'Asset', required: true },
  { key: 'cashAccount', label: 'Cash / Collection Account', category: 'Asset', required: true, hint: 'Repayments are received into this account' },
  { key: 'penaltyIncome', label: 'Penalty Income', category: 'Income', required: false, hint: 'Falls back to Interest Income' },
  { key: 'walletLiability', label: 'Customer Wallet Liability', category: 'Liability', required: false, hint: 'Needed for overpayments and wallet repayments' },
];

interface FormState {
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  tenure: string;
  tenureUnit: TimeUnit;
  frequencyValue: string;
  frequencyUnit: TimeUnit;
  periodValue: string;
  periodUnit: TimeUnit;
  repaymentdescription: string;
  interestId: string;
  feeId: string;
  defaultAfterDays: string;
  gl: Record<keyof GLMapping, string>;
}

const emptyGL = Object.fromEntries(GL_FIELDS.map((f) => [f.key, ''])) as Record<keyof GLMapping, string>;

const toForm = (p?: LoanProduct): FormState => ({
  name: p?.name ?? '',
  description: p?.description ?? '',
  minAmount: p?.minAmount != null ? String(p.minAmount) : '',
  maxAmount: p?.maxAmount != null ? String(p.maxAmount) : '',
  tenure: p?.tenure != null ? String(p.tenure) : '',
  tenureUnit: p?.tenureUnit ?? 'months',
  frequencyValue: String(p?.repaymentPattern?.frequencyValue ?? 1),
  frequencyUnit: p?.repaymentPattern?.frequencyUnit ?? 'months',
  periodValue: p?.repaymentPattern?.periodValue != null ? String(p.repaymentPattern.periodValue) : '',
  periodUnit: p?.repaymentPattern?.periodUnit ?? 'months',
  repaymentdescription: p?.repaymentPattern?.description ?? '',
  interestId: p?.interestId ?? '',
  feeId: p?.feeId ?? '',
  defaultAfterDays: String(p?.defaultAfterDays ?? 90),
  gl: { ...emptyGL, ...Object.fromEntries(Object.entries(p?.glMapping ?? {}).filter(([, v]) => v)) },
});

interface LoanProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing. */
  product?: LoanProduct | null;
  interests: InterestRow[];
  fees: FeeRow[];
  glAccounts: GLRow[];
  isSubmitting: boolean;
  onSubmit: (data: CreateLoanProductRequest) => Promise<{ success: boolean }>;
}

const selectClass = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export const LoanProductFormDialog: React.FC<LoanProductFormDialogProps> = ({
  open,
  onOpenChange,
  product,
  interests,
  fees,
  glAccounts,
  isSubmitting,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(() => toForm(product ?? undefined));
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = !!product;

  useEffect(() => {
    if (open) {
      setForm(toForm(product ?? undefined));
      setFormError(null);
    }
  }, [open, product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setGL = (key: keyof GLMapping, value: string) => setForm((prev) => ({ ...prev, gl: { ...prev.gl, [key]: value } }));

  const activeGL = glAccounts.filter((a) => a.isActive);
  const glOptions = (category: GLCategory) => {
    const matching = activeGL.filter((a) => a.level1Category === category);
    return matching.length ? matching : activeGL;
  };

  const handleSubmit = async () => {
    const min = Number(form.minAmount);
    const max = Number(form.maxAmount);
    const tenure = Number(form.tenure);
    if (!form.name.trim()) return setFormError('Product name is required.');
    if (!(min > 0) || !(max > 0)) return setFormError('Minimum and maximum amounts are required.');
    if (max < min) return setFormError('Maximum amount must be greater than or equal to the minimum.');
    if (!(tenure > 0)) return setFormError('Tenure is required.');
    if (!form.interestId) return setFormError('Select an interest configuration.');
    const missingGL = GL_FIELDS.find((f) => f.required && !form.gl[f.key]);
    if (missingGL) return setFormError(`Select the ${missingGL.label} GL account.`);

    const optionalGL = Object.fromEntries(
      GL_FIELDS.filter((f) => !f.required).map((f) => [f.key, form.gl[f.key] || undefined]),
    );

    const result = await onSubmit({
      name: form.name.trim(),
      description: form.description || undefined,
      minAmount: min,
      maxAmount: max,
      tenure,
      tenureUnit: form.tenureUnit,
      frequencyValue: Number(form.frequencyValue) || 1,
      frequencyUnit: form.frequencyUnit,
      periodValue: form.periodValue ? Number(form.periodValue) : undefined,
      periodUnit: form.periodUnit,
      repaymentdescription: form.repaymentdescription || undefined,
      interestId: form.interestId,
      feeId: form.feeId || undefined,
      defaultAfterDays: form.defaultAfterDays === '' ? undefined : Number(form.defaultAfterDays),
      principalReceivable: form.gl.principalReceivable,
      interestReceivable: form.gl.interestReceivable,
      interestIncome: form.gl.interestIncome,
      feeIncome: form.gl.feeIncome,
      disbursementAccount: form.gl.disbursementAccount,
      cashAccount: form.gl.cashAccount,
      ...optionalGL,
    });
    if (result.success) onOpenChange(false);
  };

  const unitSelect = (value: TimeUnit, onChange: (u: TimeUnit) => void) => (
    <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value as TimeUnit)}>
      {TIME_UNITS.map((u) => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Loan Product' : 'Create Loan Product'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Changes apply to new bookings. Booked loans keep the terms and GL mapping they were booked with.'
              : 'Define the limits, repayment pattern, pricing and GL mapping for a new product.'}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{formError}</div>
        )}

        <div className="space-y-5">
          {/* Basics */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="productName">Product Name *</Label>
              <Input id="productName" className="mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g., SME Working Capital" />
            </div>
            <div>
              <Label htmlFor="productDescription">Description</Label>
              <Textarea id="productDescription" className="mt-1 resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>Min Amount (₦) *</Label>
                <Input type="number" min="0" className="mt-1" value={form.minAmount} onChange={(e) => set('minAmount', e.target.value)} />
              </div>
              <div>
                <Label>Max Amount (₦) *</Label>
                <Input type="number" min="0" className="mt-1" value={form.maxAmount} onChange={(e) => set('maxAmount', e.target.value)} />
              </div>
              <div>
                <Label>Tenure *</Label>
                <Input type="number" min="1" className="mt-1" value={form.tenure} onChange={(e) => set('tenure', e.target.value)} />
              </div>
              <div>
                <Label>Tenure Unit</Label>
                {unitSelect(form.tenureUnit, (u) => set('tenureUnit', u))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Repayment pattern */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Repayment Pattern</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>Repay Every</Label>
                <Input type="number" min="1" className="mt-1" value={form.frequencyValue} onChange={(e) => set('frequencyValue', e.target.value)} />
              </div>
              <div>
                <Label>Frequency Unit</Label>
                {unitSelect(form.frequencyUnit, (u) => set('frequencyUnit', u))}
              </div>
              <div>
                <Label>Period</Label>
                <Input type="number" min="1" className="mt-1" value={form.periodValue} onChange={(e) => set('periodValue', e.target.value)} placeholder="= tenure" />
              </div>
              <div>
                <Label>Period Unit</Label>
                {unitSelect(form.periodUnit, (u) => set('periodUnit', u))}
              </div>
            </div>
            <div>
              <Label>Repayment Description</Label>
              <Input className="mt-1" value={form.repaymentdescription} onChange={(e) => set('repaymentdescription', e.target.value)} placeholder="Standard repayment" />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Pricing</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Interest *</Label>
                <select className={selectClass} value={form.interestId} onChange={(e) => set('interestId', e.target.value)}>
                  <option value="">Select interest</option>
                  {interests.filter((i) => i.isActive || i._id === form.interestId).map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.rate}% {i.calculationPeriod}, {i.rateType.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fee</Label>
                <select className={selectClass} value={form.feeId} onChange={(e) => set('feeId', e.target.value)}>
                  <option value="">No fee</option>
                  {fees.filter((f) => f.isActive || f._id === form.feeId).map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.type === 'percentage' ? `${f.value}%` : `₦${f.value.toLocaleString()}`})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Auto-default After (days)</Label>
                <Input type="number" min="0" className="mt-1" value={form.defaultAfterDays} onChange={(e) => set('defaultAfterDays', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Days overdue before a loan defaults; 0 = never.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* GL mapping */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">GL Mapping</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GL_FIELDS.map(({ key, label, category, required, hint }) => (
                <div key={key}>
                  <Label>
                    {label}
                    {required ? ' *' : ''}
                  </Label>
                  <select className={selectClass} value={form.gl[key]} onChange={(e) => setGL(key, e.target.value)}>
                    <option value="">{required ? 'Select account' : 'Not set'}</option>
                    {glOptions(category).map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.glCode} - {a.glName}
                      </option>
                    ))}
                  </select>
                  {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
