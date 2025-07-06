
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, User } from 'lucide-react';

const CustomersPage = () => {
  const customers = [
    {
      id: 'CU001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      joinDate: '2024-01-15',
      totalLoans: 2,
      activeLoans: 1,
      creditScore: 750,
      status: 'active'
    },
    {
      id: 'CU002',
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1 (555) 987-6543',
      joinDate: '2023-12-20',
      totalLoans: 1,
      activeLoans: 0,
      creditScore: 720,
      status: 'active'
    },
    {
      id: 'CU003',
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      phone: '+1 (555) 456-7890',
      joinDate: '2024-02-10',
      totalLoans: 3,
      activeLoans: 2,
      creditScore: 680,
      status: 'active'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage customer accounts and information.</p>
        </div>
        <Button>Add New Customer</Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search customers by name, email, or ID..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    <p className="text-gray-600">ID: {customer.id}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{customer.status}</Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Join Date</p>
                  <p className="font-medium">{customer.joinDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Loans</p>
                  <p className="font-medium">{customer.totalLoans}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Loans</p>
                  <p className="font-medium">{customer.activeLoans}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Credit Score</p>
                  <p className="font-medium">{customer.creditScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-sm">{customer.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomersPage;
