
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, DollarSign, Clock } from 'lucide-react';

const RepaymentPage = () => {
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const activeLoan = {
    id: 'LN001',
    purpose: 'Home Renovation',
    balance: 12500,
    monthlyPayment: 452.50,
    nextDueDate: '2024-07-15',
    interestRate: 5.5,
    term: 36,
    paymentsRemaining: 28
  };

  const paymentHistory = [
    { date: '2024-06-15', amount: 452.50, status: 'completed' },
    { date: '2024-05-15', amount: 452.50, status: 'completed' },
    { date: '2024-04-15', amount: 452.50, status: 'completed' },
    { date: '2024-03-15', amount: 452.50, status: 'completed' },
    { date: '2024-02-15', amount: 452.50, status: 'completed' },
  ];

  const upcomingPayments = [
    { date: '2024-07-15', amount: 452.50 },
    { date: '2024-08-15', amount: 452.50 },
    { date: '2024-09-15', amount: 452.50 },
    { date: '2024-10-15', amount: 452.50 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Repayment</h1>
        <p className="text-gray-600 mt-2">Manage your loan payments and view payment history.</p>
      </div>

      {/* Active Loan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Loan Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Loan Purpose</p>
              <p className="font-semibold">{activeLoan.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Balance</p>
              <p className="text-2xl font-bold text-blue-600">${activeLoan.balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Payment</p>
              <p className="text-xl font-semibold">${activeLoan.monthlyPayment}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Due Date</p>
              <p className="font-semibold text-orange-600">{activeLoan.nextDueDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Make Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Make a Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setPaymentAmount(activeLoan.monthlyPayment.toString())}
              >
                Monthly Payment (${activeLoan.monthlyPayment})
              </Button>
              <Button 
                variant="outline"
                onClick={() => setPaymentAmount(activeLoan.balance.toString())}
              >
                Pay Off Loan (${activeLoan.balance.toLocaleString()})
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Bank Account ****1234</p>
                  <p className="text-sm text-gray-600">Primary checking account</p>
                </div>
              </div>
            </div>

            <Button className="w-full" disabled={!paymentAmount}>
              <DollarSign className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.date}</p>
                    <p className="text-sm text-gray-600">${payment.amount}</p>
                  </div>
                  {index === 0 && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Due Soon
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentHistory.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">${payment.amount}</p>
                    <p className="text-sm text-gray-600">{payment.date}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepaymentPage;
