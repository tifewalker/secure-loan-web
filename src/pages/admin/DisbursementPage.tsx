
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DisbursementPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Disbursement</h1>
        <p className="text-gray-600 mt-2">Manage fund disbursement for approved loans.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Disbursement Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page will contain loan disbursement functionality with payment processing and fund transfer management.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisbursementPage;
