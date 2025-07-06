
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useBanking } from '../../contexts/BankingContext';
import { useAuth } from '../../contexts/AuthContext';

const TransactionsPage = () => {
  const { accounts, transactions, postTransaction } = useBanking();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [newTransaction, setNewTransaction] = useState({
    accountId: '',
    type: 'credit' as 'debit' | 'credit',
    amount: 0,
    description: '',
    reference: '',
    postedBy: user?.id || ''
  });

  const filteredTransactions = transactions.filter(txn => {
    const account = accounts.find(acc => acc.id === txn.accountId);
    return account?.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           account?.accountNumber.includes(searchTerm) ||
           txn.reference.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handlePostTransaction = () => {
    if (newTransaction.accountId && newTransaction.amount > 0) {
      postTransaction({
        ...newTransaction,
        postedBy: user?.id || 'unknown'
      });
      setNewTransaction({
        accountId: '',
        type: 'credit',
        amount: 0,
        description: '',
        reference: '',
        postedBy: user?.id || ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600 mt-2">Post and manage customer transactions.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="account">Select Account</Label>
                <Select value={newTransaction.accountId} onValueChange={(value) => setNewTransaction({...newTransaction, accountId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.customerName} - {account.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={newTransaction.type} onValueChange={(value: 'debit' | 'credit') => setNewTransaction({...newTransaction, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Deposit)</SelectItem>
                    <SelectItem value="debit">Debit (Withdrawal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={newTransaction.reference}
                  onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                  placeholder="Enter reference number"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="Enter transaction description"
                />
              </div>
              <Button onClick={handlePostTransaction} className="w-full">
                Post Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search transactions by customer, account, or reference..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.accountId);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{account?.customerName || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-sm">{account?.accountNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.type === 'credit' ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.reference}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${transaction.balanceAfter.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
