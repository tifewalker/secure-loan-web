import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink, FileText, Loader2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  getErrorMessage,
  useCustomer,
  useCustomerDocuments,
  useDeleteDocument,
  useDocumentDownloadUrl,
  useDocumentTypes,
  useUpdateCustomer,
  useWallets,
  useUploadDocument,
  type Customer,
  type CustomerDocument,
  type CustomerInput,
  type DocumentType,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';
import { changedFields, customerName, formatDate, formatFileSize, toCustomerInput } from './customer-utils';

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId, onBack }) => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('update_customers');

  const { data: customer, isLoading, error, refetch } = useCustomer(customerId);
  const updateCustomer = useUpdateCustomer();

  const [isEditMode, setIsEditMode] = useState(false);
  const [localEditData, setLocalEditData] = useState<CustomerInput>({});
  const original = useMemo(() => (customer ? toCustomerInput(customer) : {}), [customer]);

  const startEdit = () => {
    setLocalEditData(original);
    setIsEditMode(true);
  };

  const handleInputChange = <K extends keyof CustomerInput>(field: K, value: CustomerInput[K]) => {
    setLocalEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateCustomer = async () => {
    const changes = changedFields(original, localEditData);
    if (Object.keys(changes).length === 0) {
      setIsEditMode(false);
      return;
    }
    try {
      const result = await updateCustomer.mutateAsync({ id: customerId, data: changes });
      setIsEditMode(false);
      toast({ title: 'Customer updated', description: result.message || 'Changes saved successfully.' });
    } catch (err) {
      toast({ title: 'Update failed', description: getErrorMessage(err, 'Failed to update customer'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-lg text-gray-600 ml-4">Loading customer details...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          Back to List
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-destructive">{getErrorMessage(error, 'Customer not found')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const field = (label: string, key: keyof CustomerInput, display: React.ReactNode, type = 'text') => (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      {isEditMode ? (
        <Input
          type={type}
          value={(localEditData[key] as string | number | undefined) ?? ''}
          onChange={(e) =>
            handleInputChange(key, (type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value) as never)
          }
        />
      ) : (
        <p className="font-medium">{display || '—'}</p>
      )}
    </div>
  );

  const { address, employmentDetails: employment, nextOfKin: kin, bankingDetails: banking, meansOfIdentification: id } = customer;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600 mt-2">
            {customerName(customer)}
            {customer.customerId && <span className="ml-2 text-sm text-gray-500">({customer.customerId})</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onBack}>
            Back to List
          </Button>
          {!isEditMode && canEdit && (
            <Button variant="outline" onClick={startEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          )}
          {isEditMode && (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={updateCustomer.isPending}>
                Cancel Edit
              </Button>
              <Button onClick={handleUpdateCustomer} disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Updating...' : 'Update Customer'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Title</p>
              {isEditMode ? (
                <select
                  value={localEditData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value as CustomerInput['title'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                </select>
              ) : (
                <p className="font-medium">{customer.title || '—'}</p>
              )}
            </div>
            {field('First Name', 'firstName', customer.firstName)}
            {field('Last Name', 'lastName', customer.lastName)}
            {field('Email', 'email', customer.email, 'email')}
            {field('Phone', 'phoneNumber', customer.phoneNumber)}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>{customer.status || 'inactive'}</Badge>
            </div>
            {field('Identification Type', 'identificationType', id?.identificationType)}
            {field('Identification Number', 'identificationNumber', id?.identificationNumber)}
            <div>
              <p className="text-sm text-gray-600">ID Validity</p>
              <p className="font-medium">
                {formatDate(id?.issueDate)} – {formatDate(id?.expiryDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Street Address', 'street', address?.street)}
            {field('City', 'city', address?.city)}
            {field('State', 'state', address?.state)}
            {field('Country', 'country', address?.country)}
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('Employer', 'employerName', employment?.employerName)}
            {field('Job Title', 'jobTitle', employment?.jobTitle)}
            {field(
              'Monthly Income',
              'monthlyIncome',
              employment?.monthlyIncome != null ? `₦${employment.monthlyIncome.toLocaleString()}` : '',
              'number',
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin */}
      <Card>
        <CardHeader>
          <CardTitle>Next of Kin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('Name', 'kinName', kin?.name)}
            {field('Relationship', 'relationship', kin?.relationship)}
            {field('Phone', 'kinPhone', kin?.phone)}
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('Bank Name', 'bankName', banking?.bankName)}
            {field('Account Number', 'accountNumber', banking?.accountNumber)}
            {field('Account Name', 'accountName', banking?.accountName)}
          </div>
        </CardContent>
      </Card>

      <CustomerWalletCard customer={customer} />

      <CustomerDocumentsCard
        customerId={customerId}
        canUpload={canEdit}
        canDelete={hasPermission('delete_documents')}
      />
    </div>
  );
};

/** Lists a customer's documents, opens them via a signed link, uploads and removes them. */
const CustomerDocumentsCard: React.FC<{ customerId: string; canUpload: boolean; canDelete: boolean }> = ({
  customerId,
  canUpload,
  canDelete,
}) => {
  const { data: documents = [], isLoading } = useCustomerDocuments(customerId);
  const { data: typeInfo } = useDocumentTypes();
  const upload = useUploadDocument();
  const download = useDocumentDownloadUrl();
  const remove = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] = useState<CustomerDocument | null>(null);

  const handleDelete = async (reason: string) => {
    if (!documentToDelete?._id) return;
    try {
      await remove.mutateAsync({ customerId, documentId: documentToDelete._id, reason });
      toast({ title: 'Document removed', description: `${labelFor(documentToDelete.documentType)} was removed.` });
      setDocumentToDelete(null);
    } catch (err) {
      toast({ title: 'Could not remove document', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  // Loan-bound types (collateral, agreement) need a loanId, so they are uploaded from the loan.
  const uploadableTypes = (typeInfo?.types ?? []).filter((t) => t.value && !t.requiresLoan);
  const labelFor = (type?: DocumentType) =>
    typeInfo?.types?.find((t) => t.value === type)?.label || type?.replace(/_/g, ' ') || 'Document';

  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !documentType) return;
    try {
      await upload.mutateAsync({ customerId, file, documentType });
      setFile(null);
      setDocumentType('');
      toast({ title: 'Document uploaded', description: `${labelFor(documentType)} was added.` });
    } catch (err) {
      toast({ title: 'Upload failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleView = async (documentId?: string) => {
    if (!documentId) return;
    try {
      const { url } = await download.mutateAsync({ customerId, documentId, inline: true });
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({ title: 'Could not open document', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{labelFor(doc.documentType)}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {doc.originalName} {doc.size ? `• ${formatFileSize(doc.size)}` : ''} • {formatDate(doc.createdAt)}
                      {doc.uploadedBy?.fullName ? ` • by ${doc.uploadedBy.fullName}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleView(doc._id)} disabled={download.isPending}>
                    <ExternalLink className="mr-2 size-4" />
                    View
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDocumentToDelete(doc)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canUpload && (
          <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-[220px_1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Document Type</p>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select type</option>
                {uploadableTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label || t.value}
                  </option>
                ))}
              </select>
            </div>
            <DocumentUpload
              id="customer-document"
              label="File"
              file={file}
              onChange={setFile}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              hint={`${typeInfo?.allowedFormats?.join(', ') || 'PDF, JPEG, PNG, WebP'} up to ${typeInfo?.maxFileSizeMB ?? 10}MB`}
            />
            <Button onClick={handleUpload} disabled={!file || !documentType || upload.isPending}>
              {upload.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={!!documentToDelete}
          onOpenChange={(open) => !open && setDocumentToDelete(null)}
          title="Remove document?"
          description={
            documentToDelete && (
              <>
                <strong>{labelFor(documentToDelete.documentType)}</strong> will be hidden from this customer's file. The
                stored file is kept for the audit trail.
              </>
            )
          }
          confirmLabel="Remove document"
          destructive
          requireReason
          reasonLabel="Reason for removal"
          isPending={remove.isPending}
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
};

/** The customer's wallet: overpayments waiting to be applied to future instalments. */
const CustomerWalletCard: React.FC<{ customer: Customer }> = ({ customer }) => {
  const { data: wallets, isLoading, error } = useWallets();
  const wallet = wallets?.find(
    (w) => (w.type ?? 'user') === 'user' && (w.userId === customer._id || (!!customer.customerId && w.customerId === customer.customerId)),
  );
  const money = (n?: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: wallet?.currency || 'NGN', maximumFractionDigits: 2 }).format(n ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-12 items-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Wallet information is unavailable.</p>
        ) : !wallet ? (
          <p className="text-sm text-muted-foreground">No wallet found for this customer.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-xl font-semibold tabular-nums">{money(wallet.balance)}</p>
              <p className="text-xs text-muted-foreground">Overpayments, applied automatically to the next instalment</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Account</p>
              <p className="font-medium">{wallet.walletAccountNumber || '—'}</p>
              {wallet.walletName && <p className="text-xs text-muted-foreground">{wallet.walletName}</p>}
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Transaction</p>
              {wallet.lastTransaction ? (
                <p className="font-medium">
                  <span className={wallet.lastTransactionType === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {wallet.lastTransactionType === 'credit' ? '+' : '−'}
                    {money(wallet.lastTransactionAmount)}
                  </span>{' '}
                  <span className="text-xs text-muted-foreground">on {formatDate(wallet.lastTransaction)}</span>
                </p>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
