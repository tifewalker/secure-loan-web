// ==================== LOAN TYPES ====================
export interface LoanApplication {
  _id: string;
  id: string;
  customer: string;
  customerId: string;
  amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'closed' | 'defaulted';
  appliedDate: string;
  creditScore: number;
  monthlyIncome: number;
  requestedTerm: number;
  loanProductId?: string;
  interestRate?: number;
  createdAt?: string;
  updatedAt?: string;
  totalRepayable?: number;
  outstandingPrincipal?: number;
  outstandingInterest?: number;
  tenureUnit?: string;
  startDate?: string;
  bookedBy?: string;
}

export interface LoanProduct {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: string;
  frequencyValue: number;
  frequencyUnit: string;
  periodValue: number;
  periodUnit: string;
  repaymentDescription: string;
  interestId: string;
  principalReceivable: string;
  interestReceivable: string;
  interestIncome: string;
  feeIncome: string;
  disbursementAccount: string;
  cashAccount: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  repaymentPattern: {
    frequencyValue: number;
    frequencyUnit: string;
    periodValue: number;
    periodUnit: string;
    description: string;
  };
  glMapping: {
    principalReceivable: string;
    interestReceivable: string;
    interestIncome: string;
    feeIncome: string;
    disbursementAccount: string;
    cashAccount: string;
  };
}

export interface CreateLoanProductData {
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  tenure: number;
  tenureUnit: string;
  frequencyValue: number;
  frequencyUnit: string;
  periodValue: number;
  periodUnit: string;
  repaymentDescription: string;
  interestId: string;
  principalReceivable: string;
  interestReceivable: string;
  interestIncome: string;
  feeIncome: string;
  disbursementAccount: string;
  cashAccount: string;
}