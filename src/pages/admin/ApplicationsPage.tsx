
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

const ApplicationsPage = () => {
  const applications = [
    {
      id: 'LN005',
      customer: 'Alice Johnson',
      customerId: 'CU002',
      amount: 15000,
      purpose: 'Home Renovation',
      status: 'pending',
      appliedDate: '2024-07-06',
      creditScore: 720,
      monthlyIncome: 5500,
      requestedTerm: 36
    },
    {
      id: 'LN006',
      customer: 'Bob Smith',
      customerId: 'CU003',
      amount: 8000,
      purpose: 'Car Purchase',
      status: 'under-review',
      appliedDate: '2024-07-05',
      creditScore: 680,
      monthlyIncome: 4200,
      requestedTerm: 24
    },
    {
      id: 'LN007',
      customer: 'Carol Davis',
      customerId: 'CU004',
      amount: 25000,
      purpose: 'Business Expansion',
      status: 'approved',
      appliedDate: '2024-07-04',
      creditScore: 780,
      monthlyIncome: 8500,
      requestedTerm: 48
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'under-review':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
        <p className="text-gray-600 mt-2">Review and manage all loan applications.</p>
      </div>

      {/* Applications List */}
      <div className="grid gap-6">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Application #{app.id}
                    <Badge variant={getStatusVariant(app.status)} className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{app.customer} • {app.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${app.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Applied: {app.appliedDate}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-semibold">{app.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Credit Score</p>
                  <p className="font-semibold">{app.creditScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Income</p>
                  <p className="font-semibold">${app.monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested Term</p>
                  <p className="font-semibold">{app.requestedTerm} months</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  {app.status === 'pending' && (
                    <>
                      <Button size="sm" variant="default">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {app.status === 'under-review' && (
                    <Button size="sm" variant="default">
                      Complete Review
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="outline">
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

export default ApplicationsPage;
