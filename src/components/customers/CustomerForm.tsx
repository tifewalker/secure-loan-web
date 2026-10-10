import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DocumentUpload } from './DocumentUpload';
import type { CreateCustomerData } from '@/types';

interface CustomerFormProps {
  onSubmit: (data: CreateCustomerData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  userFullName?: string;
  userRole?: string;
}

const initialFormData: CreateCustomerData = {
  // Personal Information
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  identificationNumber: '',
  identificationType: 'national_id',
  issueDate: '',
  expiryDate: '',

  // Address
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',

  // Employment
  employerName: '',
  jobTitle: '',
  employmentType: '',
  monthlyIncome: '',
  employmentStartDate: '',
  Occupation: '',
  employmentStreet: '',
  employmentCity: '',
  employmentState: '',
  employmentCountry: '',
  employmentZipCode: '',

  // Next of Kin
  kinName: '',
  relationship: '',
  kinPhone: '',
  kinEmail: '',
  kinStreet: '',
  kinCity: '',
  kinState: '',
  kinCountry: '',
  kinZipCode: '',

  // Banking
  bankName: '',
  accountNumber: '',
  accountName: '',
  accountType: 'savings',
  bankBranch: '',

  // Documents
  passport: null,
  nin: null,
  signature: null,
};

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onSubmit,
  onCancel,
  userFullName,
  userRole,
}) => {
  const [formData, setFormData] = useState<CreateCustomerData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleDocumentChange = (
    field: 'passport' | 'nin' | 'signature',
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const result = await onSubmit(formData);

    if (!result.success) {
      setFormError(result.error || 'Failed to create customer');
    } else {
      setFormData(initialFormData);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add New Customer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new customer account with complete details
          </p>
          {userFullName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Creating as: {userFullName} ({userRole})
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Back to Customers
        </Button>
      </div>

      {/* Error */}
      {formError && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{formError}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="identificationNumber">Identification Number *</Label>
                <Input id="identificationNumber" name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="identificationType">Identification Type *</Label>
                <select
                  id="identificationType"
                  name="identificationType"
                  value={formData.identificationType}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="bvn">BVN</option>
                </select>
              </div>
              <div>
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input id="issueDate" type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input id="expiryDate" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input id="street" name="street" value={formData.street} onChange={handleInputChange} className="mt-2" required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input id="state" name="state" value={formData.state} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input id="country" name="country" value={formData.country} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="employerName">Employer Name *</Label>
                <Input id="employerName" name="employerName" value={formData.employerName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="Occupation">Occupation *</Label>
                <Input id="Occupation" name="Occupation" value={formData.Occupation} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Type</option>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="contract">Contract</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income *</Label>
                <Input id="monthlyIncome" type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="employmentStartDate">Start Date *</Label>
                <Input id="employmentStartDate" type="date" name="employmentStartDate" value={formData.employmentStartDate} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
            <div>
              <Label htmlFor="employmentStreet">Employment Address *</Label>
              <Input id="employmentStreet" name="employmentStreet" value={formData.employmentStreet} onChange={handleInputChange} className="mt-2" required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="employmentCity">City *</Label>
                <Input id="employmentCity" name="employmentCity" value={formData.employmentCity} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="employmentState">State *</Label>
                <Input id="employmentState" name="employmentState" value={formData.employmentState} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="employmentCountry">Country *</Label>
                <Input id="employmentCountry" name="employmentCountry" value={formData.employmentCountry} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="employmentZipCode">Zip Code *</Label>
                <Input id="employmentZipCode" name="employmentZipCode" value={formData.employmentZipCode} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Next of Kin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="kinName">Full Name *</Label>
                <Input id="kinName" name="kinName" value={formData.kinName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship *</Label>
                <Input id="relationship" name="relationship" value={formData.relationship} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="kinPhone">Phone Number *</Label>
                <Input id="kinPhone" name="kinPhone" value={formData.kinPhone} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
            <div>
              <Label htmlFor="kinEmail">Email *</Label>
              <Input id="kinEmail" type="email" name="kinEmail" value={formData.kinEmail} onChange={handleInputChange} className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="kinStreet">Address *</Label>
              <Input id="kinStreet" name="kinStreet" value={formData.kinStreet} onChange={handleInputChange} className="mt-2" required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="kinCity">City *</Label>
                <Input id="kinCity" name="kinCity" value={formData.kinCity} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="kinState">State *</Label>
                <Input id="kinState" name="kinState" value={formData.kinState} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="kinCountry">Country *</Label>
                <Input id="kinCountry" name="kinCountry" value={formData.kinCountry} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="kinZipCode">Zip Code *</Label>
                <Input id="kinZipCode" name="kinZipCode" value={formData.kinZipCode} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Banking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="mt-2" required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input id="accountName" name="accountName" value={formData.accountName} onChange={handleInputChange} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="savings">Savings</option>
                  <option value="checking">Checking</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="bankBranch">Bank Branch</Label>
              <Input id="bankBranch" name="bankBranch" value={formData.bankBranch || ''} onChange={handleInputChange} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-muted-foreground/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
            <p className="text-xs text-muted-foreground">
              Upload passport photograph, NIN document, and signature
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DocumentUpload
                id="passport"
                label="Passport Photograph"
                file={formData.passport || null}
                onChange={(file) => handleDocumentChange('passport', file)}
                accept="image/*"
                required
                hint="PNG or JPG up to 5MB"
              />
              <DocumentUpload
                id="nin"
                label="NIN Document"
                file={formData.nin || null}
                onChange={(file) => handleDocumentChange('nin', file)}
                accept="image/*,application/pdf"
                required
                hint="PNG, JPG, or PDF up to 5MB"
              />
              <DocumentUpload
                id="signature"
                label="Signature"
                file={formData.signature || null}
                onChange={(file) => handleDocumentChange('signature', file)}
                accept="image/*"
                required
                hint="PNG or JPG up to 5MB"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Customer...' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
};