import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { customerService } from '@/services/customer.service';
import type { Customer } from '../../types';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, onBack }) => {
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [localEditData, setLocalEditData] = useState<Partial<Customer>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const { hasPermission, isAdmin } = useDirectPermissions();

  useEffect(() => {
    let isMounted = true;
    
    const loadCustomerDetails = async (retryCount = 2) => {
      try {
        const details = await customerService.getById(customer._id);
        if (isMounted) {
          setCustomerDetails(details);
          setLocalEditData(details);
        }
      } catch (error) {
        console.error('Failed to load customer details:', error);
        
        if (retryCount > 0 && error instanceof Error && 
            (error.message.includes('session') || error.message.includes('token'))) {
          setTimeout(() => loadCustomerDetails(retryCount - 1), 1000);
          return;
        }
        
        if (isMounted) {
          setCustomerDetails(customer);
          setLocalEditData(customer);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    };

    loadCustomerDetails();

    return () => {
      isMounted = false;
    };
  }, [customer._id, customer]);

  const handleInputChange = (field: string, value: string | number) => {
    setLocalEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateCustomer = async () => {
    if (!hasPermission('update_customers') && !isAdmin) {
      alert('You do not have permission to update customers');
      return;
    }

    try {
      const result = await customerService.update(customer._id, localEditData);

      if (result.success && result.data) {
        setCustomerDetails(result.data);
        setIsEditMode(false);
        alert('Customer updated successfully!');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-lg text-gray-600 ml-4">Loading customer details...</p>
      </div>
    );
  }

  const displayCustomer = customerDetails || customer;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600 mt-2">{displayCustomer.firstName} {displayCustomer.lastName}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onBack}>
            Back to List
          </Button>
          {!isEditMode && (isAdmin || hasPermission('update_customers')) && (
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          )}
          {isEditMode && (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel Edit
              </Button>
              <Button onClick={handleUpdateCustomer}>
                Update Customer
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
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              ) : (
                <p className="font-medium">{displayCustomer.title}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">First Name</p>
              {isEditMode ? (
                <Input value={localEditData.firstName || ''} onChange={(e) => handleInputChange('firstName', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.firstName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Name</p>
              {isEditMode ? (
                <Input value={localEditData.lastName || ''} onChange={(e) => handleInputChange('lastName', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.lastName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              {isEditMode ? (
                <Input type="email" value={localEditData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.email}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              {isEditMode ? (
                <Input value={localEditData.phoneNumber || ''} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.phoneNumber}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={displayCustomer.status === 'active' ? 'default' : 'secondary'}>
                {displayCustomer.status}
              </Badge>
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
            <div>
              <p className="text-sm text-gray-600">Street Address</p>
              {isEditMode ? (
                <Input value={localEditData.street || ''} onChange={(e) => handleInputChange('street', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.street}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              {isEditMode ? (
                <Input value={localEditData.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.city}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">State</p>
              {isEditMode ? (
                <Input value={localEditData.state || ''} onChange={(e) => handleInputChange('state', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.state}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Country</p>
              {isEditMode ? (
                <Input value={localEditData.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.country}</p>
              )}
            </div>
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
            <div>
              <p className="text-sm text-gray-600">Employer</p>
              {isEditMode ? (
                <Input value={localEditData.employerName || ''} onChange={(e) => handleInputChange('employerName', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.employerName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Job Title</p>
              {isEditMode ? (
                <Input value={localEditData.jobTitle || ''} onChange={(e) => handleInputChange('jobTitle', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.jobTitle}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Income</p>
              {isEditMode ? (
                <Input type="number" value={localEditData.monthlyIncome || ''} onChange={(e) => handleInputChange('monthlyIncome', e.target.value)} />
              ) : (
                <p className="font-medium">₦{displayCustomer.monthlyIncome?.toLocaleString()}</p>
              )}
            </div>
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
            <div>
              <p className="text-sm text-gray-600">Name</p>
              {isEditMode ? (
                <Input value={localEditData.kinName || ''} onChange={(e) => handleInputChange('kinName', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.kinName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              {isEditMode ? (
                <Input value={localEditData.relationship || ''} onChange={(e) => handleInputChange('relationship', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.relationship}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              {isEditMode ? (
                <Input value={localEditData.kinPhone || ''} onChange={(e) => handleInputChange('kinPhone', e.target.value)} />
              ) : (
                <p className="font-medium">{displayCustomer.kinPhone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};