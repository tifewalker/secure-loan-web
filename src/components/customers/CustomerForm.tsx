import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateCustomerData } from '@/types';

interface CustomerFormProps {
  onSubmit: (data: CreateCustomerData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  userFullName?: string;
  userRole?: string;
}

const initialFormData: CreateCustomerData = {
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  identificationNumber: '',
  identificationType: 'national_id',
  issueDate: '',
  expiryDate: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
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
  kinName: '',
  relationship: '',
  kinPhone: '',
  kinEmail: '',
  kinStreet: '',
  kinCity: '',
  kinState: '',
  kinCountry: '',
  kinZipCode: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  accountType: 'savings',
  bankBranch: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-gray-600 mt-2">Create a new customer account with complete details.</p>
          {userFullName && (
            <p className="text-xs text-gray-500 mt-1">Creating as: {userFullName} ({userRole})</p>
          )}
        </div>
        <Button variant="outline" onClick={onCancel}>
          Back to Customers
        </Button>
      </div>

      {formError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{formError}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identification Number</label>
                <Input name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identification Type</label>
                <select
                  name="identificationType"
                  value={formData.identificationType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="bvn">BVN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                <Input type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <Input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue with other sections... */}
        {/* Address, Employment, Next of Kin, Banking sections same as before */}
        
        <div className="flex justify-end space-x-4">
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