export interface Account {
  id: string;
  accountNumber: string;
  accountType: 'current' | 'savings';
  customerId: string;
  customerName: string;
  balance: number;
  status: 'active' | 'inactive' | 'closed';
  openedDate: string;
  lastTransactionDate: string;
  interestRate?: number;
  minimumBalance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference: string;
  timestamp: string;
  postedBy: string;
  status: 'pending' | 'completed' | 'failed';
  balanceAfter: number;
}

export interface GeneralLedgerEntry {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
  timestamp: string;
  postedBy: string;
  transactionId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface Staff {
  fullName: ReactNode;
  isActive: any;
  designation: ReactNode;
  id: string;
  email: string;
  name: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}
