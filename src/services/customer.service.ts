import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { Customer, CreateCustomerData, ApiResponse } from '@/types';

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
      
      let rawCustomers: Customer[] = [];
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
})) as Customer[];
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
      const details = result.user || result.customer || result;

      return {
        _id: details._id,
        id: details.customerId,
        title: details.title,
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phoneNumber: details.phoneNumber,
        status: details.status || 'active',
        createdAt: details.createdAt,
        street: details.address?.street || '',
        city: details.address?.city || '',
        state: details.address?.state || '',
        country: details.address?.country || '',
        zipCode: details.address?.zipCode || '',
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
        kinName: details.nextOfKin?.name || '',
        relationship: details.nextOfKin?.relationship || '',
        kinPhone: details.nextOfKin?.phone || '',
        kinEmail: details.nextOfKin?.email || '',
        kinStreet: details.nextOfKin?.address?.street || '',
        kinCity: details.nextOfKin?.address?.city || '',
        kinState: details.nextOfKin?.address?.state || '',
        kinCountry: details.nextOfKin?.address?.country || '',
        kinZipCode: details.nextOfKin?.address?.zipCode || '',
        bankName: details.bankingDetails?.bankName || '',
        accountNumber: details.bankingDetails?.accountNumber || '',
        accountName: details.bankingDetails?.accountName || '',
        accountType: details.bankingDetails?.accountType || '',
        employmentStatus: details.employmentStatus || '',
        income: details.income || 0,
        guarantor: details.guarantor,
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

  // Toggle customer status
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