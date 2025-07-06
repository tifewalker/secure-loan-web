
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

const LoanHistoryPage = () => {
  const loanHistory = [
    {
      id: 'LN001',
      amount: 15000,
      purpose: 'Home Renovation',
      status: 'active',
      appliedDate: '2024-01-15',
      approvedDate: '2024-01-16',
      interestRate: 5.5,
      term: 36,
      monthlyPayment: 452.50,
      remainingBalance: 12500
    },
    {
      id: 'LN002',
      amount: 5000,
      purpose: 'Car Purchase',
      status: 'completed',
      appliedDate: '2023-06-10',
      approvedDate: '2023-06-11',
      completedDate: '2024-01-15',
      interestRate: 4.8,
      term: 24,
      monthlyPayment: 219.36
    },
    {
      id: 'LN003',
      amount: 8000,
      purpose: 'Debt Consolidation',
      status: 'rejected',
      appliedDate: '2023-03-20',
      rejectedDate: '2023-03-22',
      rejectionReason: 'Insufficient credit score'
    },
    {
      id: 'LN004',
      amount: 25000,
      purpose: 'Business Expansion',
      status: 'pending',
      appliedDate: '2024-07-01',
      interestRate: 6.2,
      term: 48
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan History</h1>
        <p className="text-gray-600 mt-2">View all your loan applications and their current status.</p>
      </div>

      <div className="grid gap-6">
        {loanHistory.map((loan) => (
          <Card key={loan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Loan #{loan.id}
                    <Badge variant={getStatusVariant(loan.status)} className="flex items-center gap-1">
                      {getStatusIcon(loan.status)}
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{loan.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${loan.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Applied: {loan.appliedDate}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loan.status === 'active' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="font-semibold">${loan.monthlyPayment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining Balance</p>
                      <p className="font-semibold">${loan.remainingBalance?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="font-semibold">{loan.term} months</p>
                    </div>
                  </>
                )}
                
                {loan.status === 'completed' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Completed Date</p>
                      <p className="font-semibold">{loan.completedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Final Payment</p>
                      <p className="font-semibold">${loan.monthlyPayment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="font-semibold">{loan.term} months</p>
                    </div>
                  </>
                )}
                
                {loan.status === 'rejected' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Rejected Date</p>
                      <p className="font-semibold">{loan.rejectedDate}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="font-semibold text-red-600">{loan.rejectionReason}</p>
                    </div>
                  </>
                )}
                
                {loan.status === 'pending' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="font-semibold">{loan.term} months</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold text-yellow-600">Under Review</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LoanHistoryPage;
