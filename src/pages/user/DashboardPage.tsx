
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  FileText, 
  Calendar,
  AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalLoans: 2,
    activeLoan: 15000,
    nextPayment: 1250,
    creditScore: 750
  };

  const recentLoans = [
    {
      id: 1,
      amount: 15000,
      purpose: 'Home Renovation',
      status: 'active',
      nextPayment: '2024-07-15',
      remainingBalance: 12500
    },
    {
      id: 2,
      amount: 5000,
      purpose: 'Car Purchase',
      status: 'paid',
      paidDate: '2024-01-15'
    }
  ];

  const upcomingPayments = [
    {
      amount: 1250,
      dueDate: '2024-07-15',
      loanId: 1
    },
    {
      amount: 1250,
      dueDate: '2024-08-15',
      loanId: 1
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your loans.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-muted-foreground">Active and completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.activeLoan.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.nextPayment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Due July 15, 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.creditScore}</div>
            <p className="text-xs text-green-600">+15 from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <Link to="/apply">Apply for New Loan</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/repayment">Make a Payment</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/history">View Loan History</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(loan.status)}
                    <div>
                      <p className="font-medium">{loan.purpose}</p>
                      <p className="text-sm text-gray-600">${loan.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                    {loan.status === 'active' && (
                      <p className="text-sm text-gray-600 mt-1">
                        Balance: ${loan.remainingBalance?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">${payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Due {payment.dueDate}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Home Renovation Loan</span>
                <span>83% Complete</span>
              </div>
              <Progress value={83} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$12,500 remaining</span>
                <span>$15,000 total</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
