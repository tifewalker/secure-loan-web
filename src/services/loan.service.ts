import { fetchWithRetry, handleApiError } from './api-client';
import { authFetch } from '@/contexts/auth-fetch';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';
import type { LoanApplication, LoanProduct, CreateLoanProductData } from '@/types';

// Helper function to map API status to application status
const mapLoanStatus = (status: string | undefined | null): LoanApplication['status'] => {
  if (!status) return 'pending';
  
  const statusMap: Record<string, LoanApplication['status']> = {
    'pending': 'pending',
    'booked': 'pending',
    'submitted': 'pending',
    'under_review': 'pending',
    'review': 'pending',
    'approve': 'approved',
    'approved': 'approved',
    'reject': 'rejected',
    'rejected': 'rejected',
    'disburse': 'disbursed',
    'disbursed': 'disbursed',
    'active': 'disbursed',
    'closed': 'closed',
    'defaulted': 'defaulted',
  };
  
  return statusMap[status.toLowerCase()] || 'pending';
};

export const loanService = {
  // Get all loan applications
  getApplications: async (): Promise<LoanApplication[]> => {
    try {
      const response = await fetchWithRetry('api/loan/v1/all', {}, 2);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch loan applications');
      }

      const result = await response.json();
      console.log('Raw loan applications response:', result);
      
      let applicationsData: Record<string, unknown>[] = [];
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

        const customer = (loanData.customerId as {
          _id?: unknown;
          fullName?: unknown;
          email?: string;
          status?: string;
        } | null) ?? {};

        const loanProduct = (loanData.loanProduct as Record<string, unknown> | null) ?? {};
        const toStringValue = (value: unknown, fallback = ''): string => {
          if (typeof value === 'string') return value;
          if (typeof value === 'number' || typeof value === 'boolean') return String(value);
          return fallback;
        };
        const toNumberValue = (value: unknown, fallback = 0): number => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
          }
          return fallback;
        };

        return {
          _id: toStringValue(loanData._id),
          id: toStringValue(loanData.id ?? loanData.applicationId ?? loanData.loanId ?? loanData._id),
          customer: toStringValue(customer.fullName, 'Unknown Customer'),
          customerId: toStringValue(customer._id ?? loanData.customerId),
          amount: toNumberValue(loanData.principalAmount ?? loanData.amount ?? loanData.requestedAmount),
          purpose: toStringValue(loanData.purpose ?? loanProduct.name, 'General Loan'),
          status: mapLoanStatus(loanData.status as string),
          appliedDate: toStringValue(loanData.appliedDate ?? loanData.startDate ?? loanData.createdAt ?? new Date().toISOString()),
          creditScore: toNumberValue(loanData.creditScore),
          monthlyIncome: toNumberValue(loanData.monthlyIncome),
          requestedTerm: toNumberValue(loanData.tenure ?? loanData.requestedTerm),
          loanProductId: toStringValue(loanData.loanProductId ?? loanProduct._id),
          interestRate: toNumberValue(loanData.interestRate ?? loanProduct.interestRate),
          createdAt: toStringValue(loanData.createdAt),
          updatedAt: toStringValue(loanData.updatedAt),
          totalRepayable: toNumberValue(loanData.totalRepayable),
          outstandingPrincipal: toNumberValue(loanData.outstandingPrincipal),
          outstandingInterest: toNumberValue(loanData.outstandingInterest),
          tenureUnit: toStringValue(loanData.tenureUnit),
          startDate: toStringValue(loanData.startDate),
          bookedBy: toStringValue(loanData.bookedBy)
        };
      });
    } catch (error) {
      console.error('API Service - Error fetching applications:', error);
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

// Approve a loan application
approveApplication: async (applicationId: string): Promise<LoanApplication> => {
  try {
    const response = await authFetch(`api/loan/v1/${applicationId}/approve`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to approve application');
    }

    const result = await response.json();
    return loanService.mapLoanToApplication(result);
  } catch (error) {
    console.error('Error approving application:', error);
    return handleApiError(error, 'Failed to approve application');
  }
},

// Reject a loan application
rejectApplication: async (applicationId: string): Promise<LoanApplication> => {
  try {
    const response = await authFetch(`api/loan/v1/${applicationId}/reject`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to reject application');
    }

    const result = await response.json();
    return loanService.mapLoanToApplication(result);
  } catch (error) {
    console.error('Error rejecting application:', error);
    return handleApiError(error, 'Failed to reject application');
  }
},

// Disburse a loan (still uses the status endpoint — confirm with backend)
disburseApplication: async (applicationId: string): Promise<LoanApplication> => {
  try {
    const response = await authFetch(`api/loan/v1/${applicationId}/disburse`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      throw new Error(errorResult.message || 'Failed to disburse loan');
    }

    const result = await response.json();
    return loanService.mapLoanToApplication(result);
  } catch (error) {
    console.error('Error disbursing loan:', error);
    return handleApiError(error, 'Failed to disburse loan');
  }
},

  // Helper method to map loan to application
  mapLoanToApplication: (loanData: Record<string, unknown>): LoanApplication => {
    const apiCustomer = (loanData.customerId as {
      _id?: string;
      fullName?: string;
      email?: string;
      status?: string;
    } | null) || {};
    
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
      totalRepayable: (loanData.totalRepayable as number) || 0,
      outstandingPrincipal: (loanData.outstandingPrincipal as number) || 0,
      outstandingInterest: (loanData.outstandingInterest as number) || 0,
      tenureUnit: loanData.tenureUnit as string,
      startDate: loanData.startDate as string,
      bookedBy: loanData.bookedBy as string
    };
  },

  // Create application
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
      
     let productsData: Record<string, unknown>[] = [];
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
    _id: product._id as string,
    name: product.name as string,
    description: product.description as string,
    minAmount: product.minAmount as number,
    maxAmount: product.maxAmount as number,
    tenure: product.tenure as number,
    tenureUnit: product.tenureUnit as string,
    frequencyValue: (repaymentPattern.frequencyValue || product.frequencyValue || 1) as number,
    frequencyUnit: (repaymentPattern.frequencyUnit || product.frequencyUnit || 'months') as string,
    periodValue: (repaymentPattern.periodValue || product.periodValue || 1) as number,
    periodUnit: (repaymentPattern.periodUnit || product.periodUnit || 'months') as string,
    repaymentDescription: (repaymentPattern.description || product.repaymentDescription || product.repaymentdescription || '') as string,
    interestId: product.interestId as string,
    principalReceivable: (glMapping.principalReceivable || product.principalReceivable || '') as string,
    interestReceivable: (glMapping.interestReceivable || product.interestReceivable || '') as string,
    interestIncome: (glMapping.interestIncome || product.interestIncome || '') as string,
    feeIncome: (glMapping.feeIncome || product.feeIncome || '') as string,
    disbursementAccount: (glMapping.disbursementAccount || product.disbursementAccount || '') as string,
    cashAccount: (glMapping.cashAccount || product.cashAccount || '') as string,
    isActive: (product.isActive !== undefined ? product.isActive : true) as boolean,
    createdAt: product.createdAt as string | undefined,
    updatedAt: product.updatedAt as string | undefined,
    // Add these required properties
    repaymentPattern: {
      frequencyValue: (repaymentPattern.frequencyValue || product.frequencyValue || 1) as number,
      frequencyUnit: (repaymentPattern.frequencyUnit || product.frequencyUnit || 'months') as string,
      periodValue: (repaymentPattern.periodValue || product.periodValue || 1) as number,
      periodUnit: (repaymentPattern.periodUnit || product.periodUnit || 'months') as string,
      description: (repaymentPattern.description || product.repaymentDescription || '') as string
    },
    glMapping: {
      principalReceivable: (glMapping.principalReceivable || product.principalReceivable || '') as string,
      interestReceivable: (glMapping.interestReceivable || product.interestReceivable || '') as string,
      interestIncome: (glMapping.interestIncome || product.interestIncome || '') as string,
      feeIncome: (glMapping.feeIncome || product.feeIncome || '') as string,
      disbursementAccount: (glMapping.disbursementAccount || product.disbursementAccount || '') as string,
      cashAccount: (glMapping.cashAccount || product.cashAccount || '') as string
    }
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

  // Get single loan product by ID
  getLoanProductById: async (id: string): Promise<LoanProduct> => {
    try {
      const response = await authFetch(`api/loanproduct/v1/get/${id}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch loan product');
      }

      const result = await response.json();
      console.log('Get product by ID response:', result);
      
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
      console.error('Get product by ID error:', error);
      return handleApiError(error, 'Failed to fetch loan product');
    }
  },

  // Update loan product
  updateLoanProduct: async (id: string, productData: CreateLoanProductData): Promise<LoanProduct> => {
    try {
      const response = await authFetch(`api/loanproduct/v1/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to update loan product');
      }

      const result = await response.json();
      console.log('Update product response:', result);
      
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
      console.error('Update product error:', error);
      return handleApiError(error, 'Failed to update loan product');
    }
  },

  // Toggle activation status
  toggleLoanProductActivation: async (id: string, currentStatus: boolean): Promise<LoanProduct> => {
    try {
      const response = await authFetch(`api/loanproduct/v1/activation/${id}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to toggle loan product activation');
      }

      const result = await response.json();
      console.log('Toggle activation response:', result);
      
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
        repaymentDescription: repaymentPattern.description || product.repaymentDescription || '',
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
      console.error('Toggle activation error:', error);
      return handleApiError(error, 'Failed to toggle loan product activation');
    }
  },

  // Hard delete loan product
  deleteLoanProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authFetch(`api/loanproduct/v1/delete/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to delete loan product');
      }

      const result = await response.json();
      console.log('Delete product response:', result);
      
      return {
        success: true,
        message: result.message || 'Loan product deleted successfully'
      };
    } catch (error) {
      console.error('Delete product error:', error);
      return handleApiError(error, 'Failed to delete loan product');
    }
  }
};