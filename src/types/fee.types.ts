// ==================== FEE TYPES ====================
export interface Fee {
  _id: string;
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  glAccount: string;
  status: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateFeeData {
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  glAccount: string;
}

export interface UpdateFeeData {
  name?: string;
  type?: 'flat' | 'percentage';
  value?: number;
  glAccount?: string;
  status?: 'active' | 'inactive';
}