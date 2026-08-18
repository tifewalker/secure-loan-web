// ==================== BANKING TYPES (NO DUPLICATES) ====================
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
  oldValues?: unknown;
  newValues?: unknown;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}