
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, GeneralLedgerEntry, AuditLog } from '../types/banking';

interface BankingContextType {
  accounts: Account[];
  transactions: Transaction[];
  ledgerEntries: GeneralLedgerEntry[];
  auditLogs: AuditLog[];
  createAccount: (accountData: Omit<Account, 'id' | 'accountNumber' | 'openedDate' | 'lastTransactionDate'>) => void;
  postTransaction: (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'balanceAfter' | 'status'>) => void;
  getAccountById: (accountId: string) => Account | undefined;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const useBanking = () => {
  const context = useContext(BankingContext);
  if (context === undefined) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      accountNumber: '1001234567',
      accountType: 'savings',
      customerId: '1',
      customerName: 'John Doe',
      balance: 15000,
      status: 'active',
      openedDate: '2024-01-15',
      lastTransactionDate: '2024-07-05',
      interestRate: 2.5,
      minimumBalance: 1000
    },
    {
      id: '2',
      accountNumber: '2001234567',
      accountType: 'current',
      customerId: '2',
      customerName: 'Alice Johnson',
      balance: 25000,
      status: 'active',
      openedDate: '2024-02-20',
      lastTransactionDate: '2024-07-06',
      minimumBalance: 5000
    }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      accountId: '1',
      type: 'credit',
      amount: 5000,
      description: 'Salary Credit',
      reference: 'SAL001',
      timestamp: '2024-07-05T10:00:00Z',
      postedBy: 'system',
      status: 'completed',
      balanceAfter: 15000
    }
  ]);

  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([
    {
      id: '1',
      accountCode: '1001',
      accountName: 'Customer Savings Accounts',
      debit: 0,
      credit: 5000,
      description: 'Salary Credit - John Doe',
      reference: 'SAL001',
      timestamp: '2024-07-05T10:00:00Z',
      postedBy: 'system',
      transactionId: '1'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const createAccount = (accountData: Omit<Account, 'id' | 'accountNumber' | 'openedDate' | 'lastTransactionDate'>) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      accountNumber: generateAccountNumber(accountData.accountType),
      openedDate: new Date().toISOString().split('T')[0],
      lastTransactionDate: new Date().toISOString().split('T')[0]
    };
    
    setAccounts(prev => [...prev, newAccount]);
    
    addAuditLog({
      userId: 'current-user',
      userName: 'Current User',
      action: 'CREATE',
      resource: 'account',
      resourceId: newAccount.id,
      newValues: newAccount,
      ipAddress: '192.168.1.1',
      userAgent: 'Browser'
    });
  };

  const postTransaction = (transactionData: Omit<Transaction, 'id' | 'timestamp' | 'balanceAfter' | 'status'>) => {
    const account = accounts.find(acc => acc.id === transactionData.accountId);
    if (!account) return;

    const newBalance = transactionData.type === 'credit' 
      ? account.balance + transactionData.amount
      : account.balance - transactionData.amount;

    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance,
      status: 'completed'
    };

    setTransactions(prev => [...prev, newTransaction]);
    
    // Update account balance
    setAccounts(prev => prev.map(acc => 
      acc.id === transactionData.accountId 
        ? { ...acc, balance: newBalance, lastTransactionDate: new Date().toISOString().split('T')[0] }
        : acc
    ));

    // Create GL entries
    const glEntry: GeneralLedgerEntry = {
      id: Date.now().toString(),
      accountCode: account.accountType === 'savings' ? '1001' : '1002',
      accountName: account.accountType === 'savings' ? 'Customer Savings Accounts' : 'Customer Current Accounts',
      debit: transactionData.type === 'debit' ? transactionData.amount : 0,
      credit: transactionData.type === 'credit' ? transactionData.amount : 0,
      description: `${transactionData.description} - ${account.customerName}`,
      reference: transactionData.reference,
      timestamp: new Date().toISOString(),
      postedBy: transactionData.postedBy,
      transactionId: newTransaction.id
    };

    setLedgerEntries(prev => [...prev, glEntry]);

    addAuditLog({
      userId: transactionData.postedBy,
      userName: 'Current User',
      action: 'CREATE',
      resource: 'transaction',
      resourceId: newTransaction.id,
      newValues: newTransaction,
      ipAddress: '192.168.1.1',
      userAgent: 'Browser'
    });
  };

  const generateAccountNumber = (type: 'current' | 'savings'): string => {
    const prefix = type === 'savings' ? '1' : '2';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return prefix + random;
  };

  const getAccountById = (accountId: string) => accounts.find(acc => acc.id === accountId);
  
  const getTransactionsByAccount = (accountId: string) => 
    transactions.filter(txn => txn.accountId === accountId);

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  return (
    <BankingContext.Provider value={{
      accounts,
      transactions,
      ledgerEntries,
      auditLogs,
      createAccount,
      postTransaction,
      getAccountById,
      getTransactionsByAccount,
      addAuditLog
    }}>
      {children}
    </BankingContext.Provider>
  );
};
