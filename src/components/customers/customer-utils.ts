import type { Customer, CustomerInput, DocumentType, Loan } from '@/api';

export const customerName = (c: Pick<Customer, 'fullName' | 'firstName' | 'lastName'>) =>
  c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed customer';

export interface CustomerLoanCounts {
  total: number;
  active: number;
}

const ACTIVE_LOAN_STATUSES = new Set(['active', 'disbursed', 'defaulted']);

/** Counts loans per customer `_id` from the all-loans report. */
export const loanCountsByCustomer = (loans: Loan[] = []): Map<string, CustomerLoanCounts> => {
  const counts = new Map<string, CustomerLoanCounts>();
  for (const loan of loans) {
    const id = typeof loan.customerId === 'string' ? loan.customerId : loan.customerId?._id;
    if (!id) continue;
    const entry = counts.get(id) ?? { total: 0, active: 0 };
    entry.total += 1;
    if (loan.status && ACTIVE_LOAN_STATUSES.has(loan.status)) entry.active += 1;
    counts.set(id, entry);
  }
  return counts;
};

/** Flattens a customer from the API into the shape the update endpoint accepts. */
export const toCustomerInput = (c: Customer): CustomerInput => ({
  title: c.title,
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  phoneNumber: c.phoneNumber,
  street: c.address?.street,
  city: c.address?.city,
  state: c.address?.state,
  country: c.address?.country,
  zipCode: c.address?.zipCode,
  identificationNumber: c.meansOfIdentification?.identificationNumber,
  identificationType: c.meansOfIdentification?.identificationType,
  issueDate: c.meansOfIdentification?.issueDate?.slice(0, 10),
  expiryDate: c.meansOfIdentification?.expiryDate?.slice(0, 10),
  employerName: c.employmentDetails?.employerName,
  jobTitle: c.employmentDetails?.jobTitle,
  employmentType: c.employmentDetails?.employmentType,
  monthlyIncome: c.employmentDetails?.monthlyIncome,
  Occupation: c.employmentDetails?.Occupation,
  kinName: c.nextOfKin?.name,
  relationship: c.nextOfKin?.relationship,
  kinPhone: c.nextOfKin?.phone,
  kinEmail: c.nextOfKin?.email,
  bankName: c.bankingDetails?.bankName,
  accountNumber: c.bankingDetails?.accountNumber,
  accountName: c.bankingDetails?.accountName,
  accountType: c.bankingDetails?.accountType,
});

/** Only the fields that changed, so the update endpoint touches nothing else. */
export const changedFields = (original: CustomerInput, edited: CustomerInput): CustomerInput => {
  const diff: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(edited)) {
    if (value !== (original as Record<string, unknown>)[key]) diff[key] = value;
  }
  return diff as CustomerInput;
};

/** Documents collected on the create form, and the API type each is stored as. */
export const CREATE_FORM_DOCUMENTS: { field: 'passport' | 'nin' | 'signature'; type: DocumentType; label: string }[] = [
  { field: 'passport', type: 'passport_photograph', label: 'Passport Photograph' },
  { field: 'nin', type: 'nin', label: 'NIN Document' },
  { field: 'signature', type: 'signature', label: 'Signature' },
];

export const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
