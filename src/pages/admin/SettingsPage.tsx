
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure interest rates, loan terms, and system parameters.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Loan Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page will contain system configuration options for interest rates, loan terms, approval criteria, and other business rules.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
