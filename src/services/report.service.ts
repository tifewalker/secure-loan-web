import { fetchWithRetry, handleApiError } from './api-client';
import { ERROR_MESSAGES } from '@/contexts/auth-constants';

export interface LoanReport {
  _id: string;
  customerId: {
    _id: string;
    email: string;
    phoneNumber: string;
    status: string;
    fullName: string;
  };
  loanProduct: string;
  principalAmount: number;
  interestRate: number;
  interestType: string;
  interestAmount: number;
  totalRepayable: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingPenalty: number;
  tenure: number;
  tenureUnit: string;
  status: string;
  bookedBy: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  glSnapshot?: {
    principalReceivable: string;
    interestIncome: string;
    feeIncome: string;
    cashAccount: string;
  };
}

export const reportService = {
  // Get closed loans
  getClosedLoans: async (): Promise<LoanReport[]> => {
    try {
      const response = await fetchWithRetry('api/report/v1/loan/closed/all', {}, 1);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch closed loans');
      }

      const result = await response.json();
      
      let loansData: Record<string, unknown>[] = [];
      if (Array.isArray(result)) {
        loansData = result;
      } else if (result.loans && Array.isArray(result.loans)) {
        loansData = result.loans;
      } else if (result.data && Array.isArray(result.data)) {
        loansData = result.data;
      }

      return loansData as unknown as LoanReport[];
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get active loans
  getActiveLoans: async (): Promise<LoanReport[]> => {
    try {
      const response = await fetchWithRetry('api/report/v1loan/active/all', {}, 1);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch active loans');
      }

      const result = await response.json();
      
      let loansData: Record<string, unknown>[] = [];
      if (Array.isArray(result)) {
        loansData = result;
      } else if (result.loans && Array.isArray(result.loans)) {
        loansData = result.loans;
      } else if (result.data && Array.isArray(result.data)) {
        loansData = result.data;
      }

      return loansData as unknown as LoanReport[];
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },

  // Get disbursed loans
  getDisbursedLoans: async (): Promise<LoanReport[]> => {
    try {
      const response = await fetchWithRetry('api/report/v1loan/disbursed/all', {}, 1);
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'Failed to fetch disbursed loans');
      }

      const result = await response.json();
      
      let loansData: Record<string, unknown>[] = [];
      if (Array.isArray(result)) {
        loansData = result;
      } else if (result.loans && Array.isArray(result.loans)) {
        loansData = result.loans;
      } else if (result.data && Array.isArray(result.data)) {
        loansData = result.data;
      }

      return loansData as unknown as LoanReport[];
    } catch (error) {
      return handleApiError(error, ERROR_MESSAGES.NETWORK_ERROR);
    }
  },
};