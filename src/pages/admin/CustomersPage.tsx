import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, User, Trash2, Edit, Plus, Ban, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { apiService } from '@/services/apiService';
import { Customer, CreateCustomerData } from '@/types';
import NoAccessPage from '@/components/NoAccessPage';
import { useCallback } from 'react';


const CustomersPage = () => {
  const { user, isAuthenticated, isLoading: authLoading, authInitialized } = useAuth();
 const { hasPermission, isAdmin } = useDirectPermissions();
  
  const [currentView, setCurrentView] = useState('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers function - defined outside useEffect so it can be reused
 const fetchCustomers = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const customersData = await apiService.customers.getAll();
    setCustomers(customersData);
  } catch (error) {
    console.error('Error fetching customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
    setError(errorMessage);
    
    if (errorMessage.includes('session expired') || errorMessage.includes('401') || errorMessage.includes('token')) {
      setError('Your session has expired. Please log in again.');
    }
  } finally {
    setIsLoading(false);
  }
}, []);

  // Fetch customers when component mounts AND when auth becomes ready
  useEffect(() => {
    // Don't fetch until auth is fully initialized
    if (!authInitialized) {
      return;
    }
    
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }
    
    // Only fetch if we have permission
     const userCanView = user?.permissions?.includes('view_customers') || user?.role === 'admin';
  if (!userCanView) {
    return;
  }
    
    // Now fetch the customers
     fetchCustomers();
}, [authInitialized, isAuthenticated, user, fetchCustomers]);

  // Show loading while auth is initializing
  if (authLoading || !authInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Authentication guard - after we know auth is initialized
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Please log in to access customers.</p>
          <p className="text-sm text-gray-500">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  // Permission guard - after we know user is authenticated
  if (!hasPermission('view_customers')) {
    return <NoAccessPage 
      message="You don't have permission to view customers."
      title="Access Denied - Customers"
    />;
  }

const blacklistCustomer = async (customerId: string, currentStatus: string) => {
  if (!hasPermission('blacklist_customers')) {
    alert('You do not have permission to blacklist customers');
    return;
  }
  
  const action = currentStatus === 'active' ? 'blacklist' : 'activate';
  const actionPast = currentStatus === 'active' ? 'blacklisted' : 'activated';
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  if (!window.confirm(`Are you sure you want to ${action} this customer?`)) {
    return;
  }

  try {
    // Use the toggleStatus endpoint which changes status between active/inactive
    await apiService.customers.toggleStatus(customerId, currentStatus);
    alert(`Customer ${actionPast} successfully!`);
    
    // Update the local state to reflect the new status
    setCustomers(prev => prev.map(customer => 
      customer._id === customerId 
        ? { ...customer, status: newStatus } 
        : customer
    ));
  } catch (error) {
    console.error(`Error ${action}ing customer:`, error);
    const errorMessage = error instanceof Error ? error.message : `Failed to ${action} customer`;
    alert(`Error: ${errorMessage}`);
  }
};

  const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    
    if (!hasPermission('update_customers')) {
      alert(`You do not have permission to ${action} customers`);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) {
      return;
    }

    try {
      await apiService.customers.toggleStatus(customerId, currentStatus);
      alert(`Customer ${action}d successfully!`);
     fetchCustomers(); // Refresh the list
      if (currentView === 'details') {
        setCurrentView('list');
      }
    } catch (error) {
      console.error(`Error ${action}ing customer:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} customer`;
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle view customer details
  const handleViewCustomer = async (customer: Customer) => {
    if (!hasPermission('view_customers')) {
      alert('You do not have permission to view customer details');
      return;
    }
    setSelectedCustomer(customer);
    setCurrentView('details');
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const id = (customer._id || '').toLowerCase();
    const phone = customer.phoneNumber || '';
    const idNumber = (customer.identificationNumber || '').toLowerCase();

    return (
      customerName.includes(searchLower) ||
      email.includes(searchLower) ||
      id.includes(searchLower) ||
      phone.includes(searchTerm) ||
      idNumber.includes(searchLower)
    );
  });

  // Calculate summary stats
  const summaryStats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    totalLoans: customers.reduce((sum, c) => sum + (c.totalLoans || 0), 0),
    activeLoans: customers.reduce((sum, c) => sum + (c.activeLoans || 0), 0),
  };

  const CreateCustomerForm = () => {
    const [formData, setFormData] = useState<CreateCustomerData>({
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
      
      // Employment Details
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
      
      // Banking Details
      bankName: '',
      accountNumber: '',
      accountName: '',
      accountType: 'savings',
      bankBranch: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Check permission before rendering form
   if (!hasPermission('create_customers')) {
  return <NoAccessPage 
    message="You don't have permission to create customers."
    title="Access Denied - Create Customer"
    showHomeButton={false}
  />;
}

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear form error when user starts typing
      if (formError) setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError(null);
      
      try {
        // Prepare payload according to your API structure
        const customerPayload: CreateCustomerData = {
          ...formData,
          createdBy: user?._id,
        };

        const result = await apiService.customers.create(customerPayload);

        if (result.success) {
          alert('Customer created successfully!');
          setCurrentView('list');
          fetchCustomers();
          // Reset form
          setFormData({
            title: '', firstName: '', lastName: '', email: '', phoneNumber: '',
            identificationNumber: '', identificationType: 'national_id', issueDate: '', expiryDate: '',
            street: '', city: '', state: '', country: '', zipCode: '',
            employerName: '', jobTitle: '', employmentType: '', monthlyIncome: '',
            employmentStartDate: '', Occupation: '', employmentStreet: '', employmentCity: '',
            employmentState: '', employmentCountry: '', employmentZipCode: '', 
            kinName: '', relationship: '', kinPhone: '', kinEmail: '', kinStreet: '',
            kinCity: '', kinState: '', kinCountry: '', kinZipCode: '',
            bankName: '', accountNumber: '', accountName: '', accountType: 'savings', bankBranch: '',
          });
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
        setFormError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-600 mt-2">Create a new customer account with complete details.</p>
            <p className="text-xs text-gray-500 mt-1">Creating as: {user?.fullName} ({user?.role})</p>
          </div>
          <Button variant="outline" onClick={() => setCurrentView('list')}>
            Back to Customers
          </Button>
        </div>

        {/* Form Error Display */}
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
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <Input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Identification Number</label>
                  <Input
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    required
                  />
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
                  <Input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <Input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <Input
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name</label>
                  <Input
                    name="employerName"
                    value={formData.employerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <Input
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                  <Input
                    name="Occupation"
                    value={formData.Occupation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="contract">Contract</option>
                    <option value="part_time">Part Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
                  <Input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Start Date</label>
                  <Input
                    type="date"
                    name="employmentStartDate"
                    value={formData.employmentStartDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next of Kin */}
          <Card>
            <CardHeader>
              <CardTitle>Next of Kin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <Input
                    name="kinName"
                    value={formData.kinName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                  <Input
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <Input
                    name="kinPhone"
                    value={formData.kinPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  name="kinEmail"
                  value={formData.kinEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <Input
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                  <Input
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="current">Current</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Branch</label>
                <Input
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentView('list')}
            >
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

const CustomerDetailsView = ({ customer }: { customer: Customer }) => {
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [localEditData, setLocalEditData] = useState<Partial<Customer>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const { hasPermission, isAdmin } =  useDirectPermissions();

  useEffect(() => {
    let isMounted = true;
    
    const loadCustomerDetails = async (retryCount = 2) => {
      try {
        const details = await apiService.customers.getById(customer._id);
        if (isMounted) {
          setCustomerDetails(details);
          setLocalEditData(details);
        }
      } catch (error) {
        console.error('Failed to load customer details:', error);
        
        // Retry logic for token refresh issues
        if (retryCount > 0 && error instanceof Error && 
            (error.message.includes('session') || error.message.includes('token'))) {
          console.log(`Retrying customer details load, attempts left: ${retryCount}`);
          setTimeout(() => loadCustomerDetails(retryCount - 1), 1000);
          return;
        }
        
        if (isMounted) {
          // Use the basic customer data as fallback
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
  }, [customer._id]);

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
      const result = await apiService.customers.update(customer._id, localEditData);

      if (result.success && result.data) {
        setCustomerDetails(result.data);
        setIsEditMode(false);
        alert('Customer updated successfully!');
        // Refresh the customer list
        window.dispatchEvent(new CustomEvent('refreshCustomers'));
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
          <Button variant="outline" onClick={() => setCurrentView('list')}>
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
          {(isAdmin || hasPermission('update_customers')) && (
            <Button 
              variant={displayCustomer.status === 'active' ? "destructive" : "default"}
              onClick={() => {
                const action = displayCustomer.status === 'active' ? 'deactivate' : 'activate';
                if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
                  // This would trigger the status toggle
                  window.dispatchEvent(new CustomEvent('toggleCustomerStatus', {
                    detail: { customerId: customer._id, currentStatus: displayCustomer.status }
                  }));
                }
              }}
            >
              {displayCustomer.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
            </Button>
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
                <Input
                  value={localEditData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.firstName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Name</p>
              {isEditMode ? (
                <Input
                  value={localEditData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.lastName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              {isEditMode ? (
                <Input
                  type="email"
                  value={localEditData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.email}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              {isEditMode ? (
                <Input
                  value={localEditData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
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
                <Input
                  value={localEditData.street || ''}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.street}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              {isEditMode ? (
                <Input
                  value={localEditData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.city}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">State</p>
              {isEditMode ? (
                <Input
                  value={localEditData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.state}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Country</p>
              {isEditMode ? (
                <Input
                  value={localEditData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
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
                <Input
                  value={localEditData.employerName || ''} 
                  onChange={(e) => handleInputChange('employerName', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.employerName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Job Title</p>
              {isEditMode ? (
                <Input
                  value={localEditData.jobTitle || ''}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.jobTitle}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Income</p>
              {isEditMode ? (
                <Input
                  type="number"
                  value={localEditData.monthlyIncome || ''}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                />
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
                <Input
                  value={localEditData.kinName || ''}
                  onChange={(e) => handleInputChange('kinName', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.kinName}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              {isEditMode ? (
                <Input
                  value={localEditData.relationship || ''}
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
                />
              ) : (
                <p className="font-medium">{displayCustomer.relationship}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              {isEditMode ? (
                <Input
                  value={localEditData.kinPhone || ''}
                  onChange={(e) => handleInputChange('kinPhone', e.target.value)}
                />
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

  // Main render logic
  if (currentView === 'create') {
    return <CreateCustomerForm />
  }

  if (currentView === 'details' && selectedCustomer) {
    return <CustomerDetailsView customer={selectedCustomer} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage customer accounts and information.</p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as: {user?.fullName} ({user?.role}) - {user?.department}
          </p>
        </div>
        {hasPermission('create_customers') && (
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
        )}
      </div>

      {/* Summary Stats - Moved to top */}
      {!isLoading && customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalCustomers}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.activeCustomers}
                </p>
                <p className="text-sm text-gray-600">Active Customers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summaryStats.totalLoans}
                </p>
                <p className="text-sm text-gray-600">Total Loans</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.activeLoans}
                </p>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search customers by name, email, or ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {setError(null); fetchCustomers();}}
                >
                  Retry
                </Button>
                {(error.includes('session') || error.includes('token')) && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => window.location.href = '/login'}
                  >
                    Login Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 ml-4">Loading customers...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      {!isLoading && (
        <div className="grid gap-6">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">No customers found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first customer'}
                  </p>
                {hasPermission('create_customers') && !searchTerm && (
                    <Button onClick={() => setCurrentView('create')} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Customer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-gray-600">ID: {customer._id}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status || 'Active'}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                       {hasPermission('blacklist_customers') && (
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => blacklistCustomer(customer._id, customer.status)}
    className="text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50"
    title={customer.status === 'active' ? 'Blacklist Customer' : 'Activate Customer'}
  >
   
    {customer.status === 'active' ? (
      <Ban className="w-4 h-4" />
    ) : (
      <ShieldCheck className="w-4 h-4" /> 
    )}
  </Button>
)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Join Date</p>
                      <p className="font-medium">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Loans</p>
                      <p className="font-medium">{customer.totalLoans || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Loans</p>
                      <p className="font-medium">{customer.activeLoans || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Credit Score</p>
                      <p className="font-medium">
                        {(hasPermission('view_customers') || isAdmin) ? 
                          (customer.creditScore || 'N/A') : '***'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-sm">{customer.phoneNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

