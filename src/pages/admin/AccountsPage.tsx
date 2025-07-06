
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Plus, Eye, CreditCard } from 'lucide-react';
import { useBanking } from '../../contexts/BankingContext';
import { Account } from '../../types/banking';

const AccountsPage = () => {
  const { accounts, createAccount } = useBanking();
  const [searchTerm, setSearchTerm] = useState('');
  const [newAccount, setNewAccount] = useState({
    accountType: 'savings' as 'current' | 'savings',
    customerId: '',
    customerName: '',
    balance: 0,
    status: 'active' as 'active' | 'inactive' | 'closed',
    interestRate: 0,
    minimumBalance: 0
  });

  const filteredAccounts = accounts.filter(account =>
    account.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm)
  );

  const handleCreateAccount = () => {
    createAccount(newAccount);
    setNewAccount({
      accountType: 'savings',
      customerId: '',
      customerName: '',
      balance: 0,
      status: 'active',
      interestRate: 0,
      minimumBalance: 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CASA Accounts</h1>
          <p className="text-gray-600 mt-2">Manage Current and Savings Accounts.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newAccount.customerName}
                  onChange={(e) => setNewAccount({...newAccount, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  value={newAccount.customerId}
                  onChange={(e) => setNewAccount({...newAccount, customerId: e.target.value})}
                  placeholder="Enter customer ID"
                />
              </div>
              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={newAccount.accountType} onValueChange={(value: 'current' | 'savings') => setNewAccount({...newAccount, accountType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({...newAccount, balance: Number(e.target.value)})}
                  placeholder="Enter initial balance"
                />
              </div>
              <div>
                <Label htmlFor="minimumBalance">Minimum Balance</Label>
                <Input
                  id="minimumBalance"
                  type="number"
                  value={newAccount.minimumBalance}
                  onChange={(e) => setNewAccount({...newAccount, minimumBalance: Number(e.target.value)})}
                  placeholder="Enter minimum balance"
                />
              </div>
              {newAccount.accountType === 'savings' && (
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={newAccount.interestRate}
                    onChange={(e) => setNewAccount({...newAccount, interestRate: Number(e.target.value)})}
                    placeholder="Enter interest rate"
                  />
                </div>
              )}
              <Button onClick={handleCreateAccount} className="w-full">
                Create Account
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
              placeholder="Search accounts by customer name or account number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="grid gap-6">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{account.customerName}</h3>
                    <p className="text-gray-600">Account: {account.accountNumber}</p>
                    <p className="text-sm text-gray-500">
                      {account.accountType === 'savings' ? 'Savings Account' : 'Current Account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Balance</p>
                  <p className="font-medium text-lg">${account.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum Balance</p>
                  <p className="font-medium">${account.minimumBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Opened</p>
                  <p className="font-medium">{account.openedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Transaction</p>
                  <p className="font-medium">{account.lastTransactionDate}</p>
                </div>
                {account.interestRate && (
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{account.interestRate}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountsPage;
