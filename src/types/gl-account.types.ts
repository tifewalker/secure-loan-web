// ==================== GL ACCOUNT TYPES ====================
export interface GLAccount {
  _id: string;
  glCode: string;
  glName: string;
  level1Category: string;
  accountNumber: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission: 'open' | 'closed';
  status: 'active' | 'inactive';
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateGLAccountData {
  glCode: string;
  glName: string;
  level1Category: string;
  accountNumber: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission: 'open' | 'closed';
  currency: string;
  createdBy?: string;
}

export interface UpdateGLAccountData {
  glCode?: string;
  glName?: string;
  level1Category?: string;
  level2Category?: string;
  level3Category?: string;
  ifrsCategory?: string;
  description?: string;
  transactionPermission?: 'open' | 'closed';
  status?: 'active' | 'inactive';
  currency?: string;
  updatedBy?: string;
}