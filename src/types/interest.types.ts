// ==================== INTEREST TYPES ====================
export interface Interest {
  _id: string;
  name: string;
  rate: number;
  rateType: 'flat' | 'reducing_balance';
  calculationPeriod: 'weekly' | 'monthly' | 'daily' | 'yearly';
  glInterestIncome: string;
  status?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateInterestData {
  name: string;
  rate: number;
  rateType: 'flat' | 'reducing_balance';
  calculationPeriod: 'weekly' | 'monthly' | 'daily' | 'yearly';
  glInterestIncome: string;
}

export interface UpdateInterestData {
  name?: string;
  rate?: number;
  rateType?: 'flat' | 'reducing_balance';
  calculationPeriod?: 'weekly' | 'monthly' | 'daily' | 'yearly';
  glInterestIncome?: string;
  status?: string;
}