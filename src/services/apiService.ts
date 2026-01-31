import { getApiUrl, authFetch, ERROR_MESSAGES } from '@/contexts/AuthContext';
import { 
  Customer, CreateCustomerData, ApiResponse, Staff, CreateStaffData, UpdateStaffData,
  Role, Permission, UserRole, CreateRoleData, UpdateRoleData, RoleUser,
  Fee, CreateFeeData, UpdateFeeData,
  Interest, CreateInterestData, UpdateInterestData,
  LoanApplication, LoanProduct, CreateLoanProductData,
   GLAccount, CreateGLAccountData, UpdateGLAccountData
} from '@/types';

// Helper function for retry logic
const fetchWithRetry = async (endpoint: string, options: RequestInit = {}, retries = 1): Promise<Response> => {
  try {
    return await authFetch(endpoint, options);
  } catch (error) {
    if (retries > 0 && (error instanceof Error && 
        (error.message.includes('session expired') || 
         error.message.includes('401') || 
         error.message.includes('token')))) {
      console.log(`Retrying ${endpoint}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(endpoint, options, retries - 1);
    }
    throw error;
  }
};

// Helper function to handle API errors consistently
const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // Check for session expired errors
    if (error.message.includes('session expired') || 
        error.message.includes('401') || 
        error.message.includes('token expired')) {
      // Don't clear storage here - let AuthContext handle it
      // Just re-throw the error
    }
    throw error;
  }
  
  throw new Error(defaultMessage);
};

// Customer API Service
export const customerService = {
  // Get all customers
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await fetchWithRetry('api/customers/getall');
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || errorResult.error || 'Failed to fetch customers');
      }

      const result = await response.json();
      
      let rawCustomers = [];
      if (result.success && result.data) {
        rawCustomers = result.data;
      } else if (result.customers) {
        rawCustomers = result.customers;
      } else if (Array.isArray(result)) {
        rawCustomers = result;
      }
      
      // Flatten customers for list view
      return rawCustomers.map((c: Customer) => ({
        _id: c._id,
        id: c.id,
        title: c.title,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        status: c.status || 'active',
        createdAt: c.createdAt,
        totalLoans: c.totalLoans || 0,
        activeLoans: c.activeLoans || 0,
        creditScore: c.creditScore,
        street: c.street || '',
        city: c.city || '',
        identificationNumber: c.identificationNumber || '',
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get customer by ID
 getById: async (customerId: string): Promise<Customer> => {
  try {
    const response = await fetchWithRetry(`api/customers/${customerId}`);
    
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || errorResult.error || 'Failed to fetch customer');
    }

    const result = await response.json();
    const details = result.user || result.customer || result; // Handle different response structures

    // Return the customer data, correctly mapping nested fields to your interface
    return {
      _id: details._id,
      id: details.customerId, // Use customerId from API
      title: details.title,
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email,
      phoneNumber: details.phoneNumber,
      status: details.status || 'active',
      createdAt: details.createdAt,
      // Flatten address
      street: details.address?.street || '',
      city: details.address?.city || '',
      state: details.address?.state || '',
      country: details.address?.country || '',
      zipCode: details.address?.zipCode || '',
      // Flatten employment details
      employerName: details.employmentDetails?.employerName || '',
      jobTitle: details.employmentDetails?.jobTitle || '',
      employmentType: details.employmentDetails?.employmentType || '',
      monthlyIncome: details.employmentDetails?.monthlyIncome || 0,
      employmentStartDate: details.employmentDetails?.employmentStartDate || '',
      Occupation: details.employmentDetails?.Occupation || '',
      employmentStreet: details.employmentDetails?.employmentAddress?.street || '',
      employmentCity: details.employmentDetails?.employmentAddress?.city || '',
      employmentState: details.employmentDetails?.employmentAddress?.state || '',
      employmentCountry: details.employmentDetails?.employmentAddress?.country || '',
      employmentZipCode: details.employmentDetails?.employmentAddress?.zipCode || '',
      // Flatten next of kin
      kinName: details.nextOfKin?.name || '',
      relationship: details.nextOfKin?.relationship || '',
      kinPhone: details.nextOfKin?.phone || '',
      kinEmail: details.nextOfKin?.email || '',
      kinStreet: details.nextOfKin?.address?.street || '',
      kinCity: details.nextOfKin?.address?.city || '',
      kinState: details.nextOfKin?.address?.state || '',
      kinCountry: details.nextOfKin?.address?.country || '',
      kinZipCode: details.nextOfKin?.address?.zipCode || '',
      // Flatten banking
      bankName: details.bankingDetails?.bankName || '',
      accountNumber: details.bankingDetails?.accountNumber || '',
      accountName: details.bankingDetails?.accountName || '',
      accountType: details.bankingDetails?.accountType || '',
      // Other fields
      employmentStatus: details.employmentStatus || '',
      income: details.income || 0,
      guarantor: details.guarantor,
      // Identification fields
      identificationNumber: details.identificationNumber || '',
      identificationType: details.identificationType || '',
      issueDate: details.issueDate || '',
      expiryDate: details.expiryDate || ''
    };
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
  }
},

  // Create new customer
  create: async (customerData: CreateCustomerData): Promise<ApiResponse<Customer>> => {
    try {
      const response = await authFetch('api/customers/create', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || ERROR_MESSAGES.REGISTRATION_FAILED);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.REGISTRATION_FAILED);
    }
  },

  // Update customer
  update: async (customerId: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    try {
      const response = await authFetch(`api/customers/update/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update customer');
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return handleApiError(error, 'Failed to update customer');
    }
  },

  // Delete customer
  delete: async (customerId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/customers/delete/${customerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete customer');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete customer');
    }
  },

  // Toggle customer status (activate/deactivate)
  toggleStatus: async (customerId: string, currentStatus: string): Promise<void> => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/customers/activation/${customerId}`, {
        method: 'POST',
        body: JSON.stringify({ status: currentStatus === 'active' ? 'inactive' : 'active' })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} customer`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} customer`);
    }
  }
};

// Staff API Service
export const staffService = {
  // Get all staff
  getAll: async (): Promise<Staff[]> => {
    try {
      const response = await fetchWithRetry('api/users/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch staff');
      }

      const result = await response.json();
      
      // Map API response to our Staff interface
     return (result.users || result.data || result || []).map((user: Staff) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  staffId: user.staffId || '',
  accessLevel: user.accessLevel || '',
  phoneNumber: user.phoneNumber || '',
  fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  department: user.department || '',
  designation: user.designation || user.position || '',
  isActive: user.isActive !== undefined ? user.isActive : true,
  createdAt: user.createdAt,
  roles: user.roles || [],
}));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new staff
  create: async (staffData: CreateStaffData): Promise<Staff> => {
    try {
      const response = await authFetch('api/users/create', {
        method: 'POST',
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create staff');
      }

      const result = await response.json();
      
      // Map response to Staff interface
      return {
        _id: result._id,
        email: result.email,
        firstName: result.firstName || '',
        lastName: result.lastName || '',
        staffId: result.staffId || '',
        accessLevel: result.accessLevel || '',
        phoneNumber: result.phoneNumber || '',
        fullName: result.fullName || result.name,
        department: result.department,
        designation: result.designation || result.position,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create staff');
    }
  },

  // Update staff
  update: async (staffId: string, staffData: UpdateStaffData): Promise<Staff> => {
    try {
      const response = await authFetch(`api/users/update/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update staff');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        email: result.email || staffData.email,
        firstName: result.firstName || staffData.firstName,
        lastName: result.lastName || staffData.lastName,
        staffId: result.staffId || staffData.staffId,
        accessLevel: result.accessLevel || staffData.accessLevel,
        phoneNumber: result.phoneNumber || staffData.phoneNumber,
        fullName: result.fullName || staffData.fullName,
        department: result.department || staffData.department,
        designation: result.designation || staffData.designation,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update staff');
    }
  },

  // Delete staff
  delete: async (staffId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/users/delete/${staffId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete staff');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete staff');
    }
  },

  // Toggle staff status (activate/deactivate)
  toggleStatus: async (staffId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/users/activation/${staffId}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} staff`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} staff`);
    }
  }
};

// Role API Service
export const roleService = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    try {
      const response = await fetchWithRetry('api/roles/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch roles');
      }

      const result = await response.json();
      
      // Handle different response formats
      let rolesData = [];
      if (result.roles && Array.isArray(result.roles)) {
        rolesData = result.roles;
      } else if (Array.isArray(result)) {
        rolesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        rolesData = result.data;
      } else {
        console.warn('Unexpected roles response format:', result);
        rolesData = [];
      }

      return rolesData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all permissions
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await fetchWithRetry('api/permissions/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch permissions');
      }

      const result = await response.json();
      
      // Handle different response formats
      let permissionsData = [];
      if (result.permission && Array.isArray(result.permission)) {
        permissionsData = result.permission;
      } else if (Array.isArray(result)) {
        permissionsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        permissionsData = result.data;
      } else {
        console.warn('Unexpected permissions response format:', result);
        permissionsData = [];
      }

      return permissionsData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all user role assignments
  getUserRoles: async (): Promise<UserRole[]> => {
    try {
      const response = await fetchWithRetry('api/roles/v1/userrole', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch user roles');
      }

      const result = await response.json();
      
      // Handle different response formats
      let userRolesData = [];
      if (result.userRoles && Array.isArray(result.userRoles)) {
        userRolesData = result.userRoles;
      } else if (Array.isArray(result)) {
        userRolesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        userRolesData = result.data;
      } else {
        console.warn('Unexpected user roles response format:', result);
        userRolesData = [];
      }

      return userRolesData;
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get all users for role assignments
  getUsers: async (): Promise<RoleUser[]> => {
    try {
      const response = await fetchWithRetry('api/users/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch users');
      }

      const result = await response.json();
      
      // Handle different response formats and map to RoleUser
      let usersData = [];
      if (Array.isArray(result)) {
        usersData = result;
      } else if (result.users && Array.isArray(result.users)) {
        usersData = result.users;
      } else if (result.data && Array.isArray(result.data)) {
        usersData = result.data;
      } else {
        console.warn('Unexpected users response format:', result);
        usersData = [];
      }

      // Map to RoleUser interface
      return usersData.map((user: Record<string, unknown>) => {
        const u = user as {
          _id?: string;
          fullName?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          staffId?: string;
        };
        return {
          _id: u._id,
          fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          staffId: u.staffId
        } as RoleUser;
      });
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new role
  create: async (roleData: CreateRoleData): Promise<Role> => {
    try {
      const response = await authFetch('api/roles/v1/create', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to create role');
    }
  },

  // Update role
  update: async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    try {
      const response = await authFetch(`api/roles/v1/update/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to update role');
    }
  },

  // Delete role
  delete: async (roleId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/roles/v1/delete/${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete role');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete role');
    }
  },

  // Assign role to user
  assign: async (userId: string, roleId: string, assignedBy: string): Promise<UserRole> => {
    try {
      const response = await authFetch('api/roles/v1/assign', {
        method: 'POST',
        body: JSON.stringify({ userId, roleId, assignedBy })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to assign role');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Failed to assign role');
    }
  },

  // Remove role from user
  remove: async (userId: string, roleId: string): Promise<void> => {
    try {
      const response = await authFetch('api/roles/v1/remove', {
        method: 'DELETE',
        body: JSON.stringify({ userId, roleId })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to remove role');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to remove role');
    }
  }
};

// Fee API Service
export const feeService = {
  // Get all fees
  getAll: async (): Promise<Fee[]> => {
    try {
      const response = await fetchWithRetry('api/fee/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch fees');
      }

      const result = await response.json();
      
      // Handle different response formats
      let feesData = [];
      if (result.fees && Array.isArray(result.fees)) {
        feesData = result.fees;
      } else if (Array.isArray(result)) {
        feesData = result;
      } else if (result.data && Array.isArray(result.data)) {
        feesData = result.data;
      } else {
        console.warn('Unexpected fees response format:', result);
        feesData = [];
      }

      return feesData.map((fee: Fee) => ({
        _id: fee._id,
        name: fee.name,
        type: fee.type,
        value: fee.value,
        glAccount: fee.glAccount,
        status: fee.status,
        isActive: fee.status === 'active', 
        createdAt: fee.createdAt,
        updatedAt: fee.updatedAt
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new fee
  create: async (feeData: CreateFeeData & { createdBy?: string }): Promise<Fee> => {
    try {
      const response = await authFetch('api/fee/v1/create', {
        method: 'POST',
        body: JSON.stringify(feeData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create fee');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        type: result.type,
        value: result.value,
        glAccount: result.glAccount,
        status: result.status !== undefined ? result.status : (result.isActive ? 'active' : 'inactive'),
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create fee');
    }
  },

  // Update fee
  update: async (feeId: string, feeData: UpdateFeeData & { updatedBy?: string }): Promise<Fee> => {
    try {
      const response = await authFetch(`api/fee/v1/update/${feeId}`, {
        method: 'PUT',
        body: JSON.stringify(feeData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update fee');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        type: result.type,
        value: result.value,
        glAccount: result.glAccount,
        status: result.status !== undefined ? result.status : (result.isActive ? 'active' : 'inactive'),
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update fee');
    }
  },

  // Delete fee
  delete: async (feeId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/fee/v1/delete/${feeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete fee');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete fee');
    }
  },

  // Toggle fee status (activate/deactivate)
  toggleStatus: async (feeId: string, currentStatus: boolean, updatedBy?: string): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/fee/v1/activation/${feeId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          isActive: !currentStatus,
          updatedBy: updatedBy 
        })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} fee`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} fee`);
    }
  }
};

// Interest API Service
export const interestService = {
  getAll: async (): Promise<Interest[]> => {
    try {
      const response = await fetchWithRetry('api/interest/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch interest rates');
      }

      const result = await response.json();
      
      // Handle different response formats
      let interestData = [];
      if (result.interest && Array.isArray(result.interest)) {
        interestData = result.interest;
      } else if (result.interests && Array.isArray(result.interests)) {
        interestData = result.interests;
      } else if (Array.isArray(result)) {
        interestData = result;
      } else if (result.data && Array.isArray(result.data)) {
        interestData = result.data;
      } else {
        console.warn('Unexpected interest response format:', result);
        interestData = [];
      }

      return interestData.map((interest: Record<string, unknown>) => ({
        _id: interest._id,
        name: interest.name,
        rate: interest.rate,
        rateType: interest.rateType,
        calculationPeriod: interest.calculationPeriod,
        glInterestIncome: interest.glInterestIncome,
        status: interest.status, 
        isActive: interest.isActive !== undefined ? interest.isActive : interest.status === 'active',
        createdAt: interest.createdAt,
        updatedAt: interest.updatedAt
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Create new interest rate
  create: async (interestData: CreateInterestData): Promise<Interest> => {
    try {
      const response = await authFetch('api/interest/v1/create', {
        method: 'POST',
        body: JSON.stringify(interestData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create interest rate');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        rate: result.rate,
        rateType: result.rateType,
        calculationPeriod: result.calculationPeriod,
        glInterestIncome: result.glInterestIncome,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create interest rate');
    }
  },

  // Update interest rate
  update: async (interestId: string, interestData: UpdateInterestData): Promise<Interest> => {
    try {
      const response = await authFetch(`api/interest/v1/update/${interestId}`, {
        method: 'PUT',
        body: JSON.stringify(interestData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update interest rate');
      }

      const result = await response.json();
      return {
        _id: result._id,
        name: result.name,
        rate: result.rate,
        rateType: result.rateType,
        calculationPeriod: result.calculationPeriod,
        glInterestIncome: result.glInterestIncome,
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update interest rate');
    }
  },

  // Delete interest rate
  delete: async (interestId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/interest/v1/delete/${interestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete interest rate');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete interest rate');
    }
  },
  
  // Toggle interest rate status (activate/deactivate)
  toggleStatus: async (interestId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/interest/v1/activation/${interestId}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} interest rate`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} interest rate`);
    }
  }
};

// Helper function to map API status to application status
const mapLoanStatus = (status: string | undefined | null): LoanApplication['status'] => {
  // Add safety check for undefined/null status
  if (!status) {
    return 'pending';
  }
  
  const statusMap: Record<string, LoanApplication['status']> = {
    'booked': 'pending',
    'pending': 'pending',
    'submitted': 'pending',
    'under_review': 'under-review',
    'review': 'under-review',
    'approved': 'approved',
    'rejected': 'rejected',
    'disbursed': 'disbursed',
    'active': 'approved',
    'closed': 'disbursed'
  };
  
  return statusMap[status.toLowerCase()] || 'pending';
};

// Loan API Service
export const loanService = {
  // Get all loan applications
getApplications: async (): Promise<LoanApplication[]> => {
  try {
    // Use the correct endpoint - from your description
    const response = await fetchWithRetry('api/loan/v1/all', {}, 2);
    
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to fetch loan applications');
    }

    const result = await response.json();
    console.log('Raw loan applications response:', result);
    
    // Handle different response formats
    let applicationsData = [];
    if (result.loans && Array.isArray(result.loans)) {
      applicationsData = result.loans;
    } else if (Array.isArray(result)) {
      applicationsData = result;
    } else if (result.data && Array.isArray(result.data)) {
      applicationsData = result.data;
    } else {
      console.warn('Unexpected loan applications response format:', result);
      applicationsData = [];
    }

    console.log('Applications data for mapping:', applicationsData);

    return applicationsData.map((app: Record<string, unknown>) => {
      const loanData = app as Record<string, unknown>;
      
      // FIX: Properly extract customer object
      const customer = (loanData.customerId as {
        _id?: string;
        fullName?: string;
        email?: string;
        status?: string;
      }) || {};
      
      const loanProduct = (loanData.loanProduct as Record<string, unknown>) || {};
      
return {
  _id: loanData._id || '',
  id: loanData.id || loanData.applicationId || loanData.loanId || loanData._id,
  customer: customer.fullName || 'Unknown Customer',
  customerId: customer._id || loanData.customerId || '',
  amount: loanData.principalAmount || loanData.amount || loanData.requestedAmount || 0,
  purpose: loanData.purpose || loanProduct.name || 'General Loan',
  status: mapLoanStatus(loanData.status as string),  // Removed || 'pending'
  appliedDate: loanData.appliedDate || loanData.startDate || loanData.createdAt || new Date().toISOString(),
  creditScore: loanData.creditScore || 0,
  monthlyIncome: loanData.monthlyIncome || 0,
  requestedTerm: loanData.tenure || loanData.requestedTerm || 0,
  loanProductId: loanData.loanProductId || loanProduct._id,
  interestRate: loanData.interestRate || loanProduct.interestRate,
  createdAt: loanData.createdAt,
  updatedAt: loanData.updatedAt,
  // Additional fields from API
  totalRepayable: loanData.totalRepayable as number,
  outstandingPrincipal: loanData.outstandingPrincipal as number,
  outstandingInterest: loanData.outstandingInterest as number,
  tenureUnit: loanData.tenureUnit as string,
  startDate: loanData.startDate as string,
  bookedBy: loanData.bookedBy as string
};
    });
  } catch (error) {
    console.error('API Service - Error fetching applications:', error);
    return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
  }
},

updateApplicationStatus: async (applicationId: string, newStatus: string): Promise<LoanApplication> => {
  try {
    // Map frontend status to backend status if needed
    const statusMap: Record<string, string> = {
      'pending': 'booked',
      'under-review': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'disbursed': 'disbursed'
    };
    
    const backendStatus = statusMap[newStatus] || newStatus;
    
    const response = await authFetch(`api/loan/v1/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: backendStatus })
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to update application status');
    }

    const result = await response.json();
    return loanService.mapLoanToApplication(result);
    
  } catch (error) {
    console.error('Error updating application status:', error);
    return handleApiError(error, 'Failed to update application status');
  }
},

// Helper method to map loan to application
mapLoanToApplication: (loanData: Record<string, unknown>): LoanApplication => {
  // Extract customer object from backend response
  const apiCustomer = (loanData.customerId as {
    _id?: string;
    fullName?: string;
    email?: string;
    status?: string;
  } | null) || {};
  
  // Extract other loan data
  const loanProduct = loanData.loanProduct || '';
  
  return {
    _id: (loanData._id as string) || '',
    id: (loanData._id as string) || '', 
    customer: apiCustomer?.fullName || 'Unknown Customer', 
    customerId: apiCustomer?._id || '', 
    amount: (loanData.principalAmount as number) || 0,
    purpose: 'General Loan', 
    status: mapLoanStatus(loanData.status as string),  
    appliedDate: (loanData.startDate as string) || (loanData.createdAt as string) || new Date().toISOString(),
    creditScore: 0, 
    monthlyIncome: 0, 
    requestedTerm: (loanData.tenure as number) || 0,
    loanProductId: loanProduct as string,
    interestRate: (loanData.interestRate as number) || 0,
    createdAt: loanData.createdAt as string,
    updatedAt: loanData.updatedAt as string,
    
    // Additional fields for potential future use
    totalRepayable: (loanData.totalRepayable as number) || 0,
    outstandingPrincipal: (loanData.outstandingPrincipal as number) || 0,
    outstandingInterest: (loanData.outstandingInterest as number) || 0,
    tenureUnit: loanData.tenureUnit as string,
    startDate: loanData.startDate as string,
    bookedBy: loanData.bookedBy as string
  };
},

createApplication: async (applicationData: {
  loanProductId: string;
  customerId: string;
  principalAmount: number;
  tenure: number;
  purpose?: string;
}): Promise<LoanApplication> => {
  try {
    const response = await authFetch('api/loan/v1/bookloan', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to create loan application');
    }

    const result = await response.json();
    return loanService.mapLoanToApplication(result);
    
  } catch (error) {
    console.error('Error creating loan application:', error);
    return handleApiError(error, 'Failed to create loan application');
  }
},

  // Get all loan products
  getLoanProducts: async (): Promise<LoanProduct[]> => {
  try {
    const response = await fetchWithRetry('api/loanproduct/v1/all', {}, 2);
    
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to fetch loan products');
    }

    const result = await response.json();
    console.log('API Service - Raw result:', result);
    
    // Handle different response formats - API returns { loanProducts: [...] }
    let productsData = [];
    if (result.loanProducts && Array.isArray(result.loanProducts)) {
      productsData = result.loanProducts;
    } else if (result.products && Array.isArray(result.products)) {
      productsData = result.products;
    } else if (Array.isArray(result)) {
      productsData = result;
    } else if (result.data && Array.isArray(result.data)) {
      productsData = result.data;
    } else {
      console.warn('Unexpected loan products response format:', result);
      productsData = [];
    }

    console.log('API Service - Extracted products data:', productsData);

    return productsData.map((product: Record<string, unknown>) => {
      const repaymentPattern = (product.repaymentPattern as Record<string, unknown>) || {};
      const glMapping = (product.glMapping as Record<string, unknown>) || {};
      
      const mapped = {
        _id: product._id,
        name: product.name,
        description: product.description,
        minAmount: product.minAmount,
        maxAmount: product.maxAmount,
        tenure: product.tenure,
        tenureUnit: product.tenureUnit,
        frequencyValue: repaymentPattern.frequencyValue || product.frequencyValue || 1,
        frequencyUnit: repaymentPattern.frequencyUnit || product.frequencyUnit || 'months',
        periodValue: repaymentPattern.periodValue || product.periodValue || 1,
        periodUnit: repaymentPattern.periodUnit || product.periodUnit || 'months',
        repaymentDescription: repaymentPattern.description || product.repaymentDescription || product.repaymentdescription || '',
        interestId: product.interestId,
        principalReceivable: glMapping.principalReceivable || product.principalReceivable || '',
        interestReceivable: glMapping.interestReceivable || product.interestReceivable || '',
        interestIncome: glMapping.interestIncome || product.interestIncome || '',
        feeIncome: glMapping.feeIncome || product.feeIncome || '',
        disbursementAccount: glMapping.disbursementAccount || product.disbursementAccount || '',
        cashAccount: glMapping.cashAccount || product.cashAccount || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
      
      console.log('API Service - Mapped product:', mapped);
      return mapped;
    });
  } catch (error) {
    console.error('API Service - Error:', error);
    return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
  }
},

  // Create loan product
 createLoanProduct: async (productData: CreateLoanProductData): Promise<LoanProduct> => {
  try {
    const response = await authFetch('api/Loanproduct/v1/create', {
      method: 'POST',
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to create loan product');
    }

    const result = await response.json();
    console.log('Create product response:', result);
    
    // Handle potential nested structure in response
    const product = result.loanProduct || result.product || result;
    const repaymentPattern = product.repaymentPattern || {};
    const glMapping = product.glMapping || {};
    
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      tenure: product.tenure,
      tenureUnit: product.tenureUnit,
      frequencyValue: repaymentPattern.frequencyValue || product.frequencyValue || 1,
      frequencyUnit: repaymentPattern.frequencyUnit || product.frequencyUnit || 'months',
      periodValue: repaymentPattern.periodValue || product.periodValue || 1,
      periodUnit: repaymentPattern.periodUnit || product.periodUnit || 'months',
      repaymentDescription: repaymentPattern.description || product.repaymentDescription || product.repaymentdescription || '',
      interestId: product.interestId,
      principalReceivable: glMapping.principalReceivable || product.principalReceivable || '',
      interestReceivable: glMapping.interestReceivable || product.interestReceivable || '',
      interestIncome: glMapping.interestIncome || product.interestIncome || '',
      feeIncome: glMapping.feeIncome || product.feeIncome || '',
      disbursementAccount: glMapping.disbursementAccount || product.disbursementAccount || '',
      cashAccount: glMapping.cashAccount || product.cashAccount || '',
      repaymentPattern: repaymentPattern,
      glMapping: glMapping,
      isActive: product.isActive !== undefined ? product.isActive : true,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Create product error:', error);
    return handleApiError(error, 'Failed to create loan product');
  }
},

};

export const glAccountService = {
  // Get all GL accounts
  getAll: async (): Promise<GLAccount[]> => {
    try {
      const response = await fetchWithRetry('api/gl/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch GL accounts');
      }

      const result = await response.json();
      
      // Handle different response formats
      let accountsData = [];
      if (Array.isArray(result)) {
        accountsData = result;
      } else if (result.accounts && Array.isArray(result.accounts)) {
        accountsData = result.accounts;
      } else if (result.data && Array.isArray(result.data)) {
        accountsData = result.data;
      } else {
        console.warn('Unexpected GL accounts response format:', result);
        accountsData = [];
      }

      return accountsData.map((account: Record<string, unknown>) => ({
        _id: account._id,
        glCode: account.glCode,
        glName: account.glName,
        level1Category: account.level1Category,
        accountNumber: account.accountNumber,
        level2Category: account.level2Category,
        level3Category: account.level3Category,
        ifrsCategory: account.ifrsCategory,
        description: account.description,
        transactionPermission: account.transactionPermission || 'open',
        status: account.status || 'active',
        currency: account.currency || 'NGN',
        isActive: account.isActive !== undefined ? account.isActive : account.status === 'active',
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get GL account by ID
  getById: async (accountId: string): Promise<GLAccount> => {
    try {
      const response = await fetchWithRetry(`api/gl/v1/${accountId}`, {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch GL account');
      }

      const result = await response.json();
      const account = result.account || result.data || result;
      
      return {
        _id: account._id,
        glCode: account.glCode,
        glName: account.glName,
        level1Category: account.level1Category,
        accountNumber: account.accountNumber,
        level2Category: account.level2Category,
        level3Category: account.level3Category,
        ifrsCategory: account.ifrsCategory,
        description: account.description,
        transactionPermission: account.transactionPermission || 'open',
        status: account.status || 'active',
        currency: account.currency || 'NGN',
        isActive: account.isActive !== undefined ? account.isActive : account.status === 'active',
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to fetch GL account');
    }
  },

  // Create new GL account
  create: async (accountData: CreateGLAccountData & { createdBy?: string }): Promise<GLAccount> => {
    try {
      const response = await authFetch('api/gl/v1/create', {
        method: 'POST',
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to create GL account');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        glCode: result.glCode,
        glName: result.glName,
        level1Category: result.level1Category,
        accountNumber: result.accountNumber,
        level2Category: result.level2Category,
        level3Category: result.level3Category,
        ifrsCategory: result.ifrsCategory,
        description: result.description,
        transactionPermission: result.transactionPermission || 'open',
        status: result.status || 'active',
        currency: result.currency || 'NGN',
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to create GL account');
    }
  },

  // Update GL account
  update: async (accountId: string, accountData: UpdateGLAccountData): Promise<GLAccount> => {
    try {
      const response = await authFetch(`api/gl/v1/update/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(accountData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update GL account');
      }

      const result = await response.json();
      
      return {
        _id: result._id,
        glCode: result.glCode,
        glName: result.glName,
        level1Category: result.level1Category,
        accountNumber: result.accountNumber,
        level2Category: result.level2Category,
        level3Category: result.level3Category,
        ifrsCategory: result.ifrsCategory,
        description: result.description,
        transactionPermission: result.transactionPermission || 'open',
        status: result.status || 'active',
        currency: result.currency || 'NGN',
        isActive: result.isActive !== undefined ? result.isActive : true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return handleApiError(error, 'Failed to update GL account');
    }
  },

  // Delete GL account
  delete: async (accountId: string): Promise<void> => {
    try {
      const response = await authFetch(`api/gl/v1/delete/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete GL account');
      }
    } catch (error) {
      return handleApiError(error, 'Failed to delete GL account');
    }
  },

  // Toggle GL account status (activate/deactivate)
  toggleStatus: async (accountId: string, currentStatus: boolean): Promise<void> => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    try {
      const response = await authFetch(`api/gl/v1/toggle-status/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `Failed to ${action} GL account`);
      }
    } catch (error) {
      return handleApiError(error, `Failed to ${action} GL account`);
    }
  }
};

// Main API service export
interface ApiService {
  customers: typeof customerService;
  staff: typeof staffService;
  roles: typeof roleService;
  fees: typeof feeService;
  interests: typeof interestService;
  loans: typeof loanService;
glAccounts: typeof glAccountService;
}

export const apiService: ApiService = {
  customers: customerService,
  staff: staffService,
  roles: roleService,
  fees: feeService,
  interests: interestService,
  loans: loanService,
  glAccounts: glAccountService,
};

export default apiService;