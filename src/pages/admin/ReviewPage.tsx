
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const ReviewPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Review</h1>
        <p className="text-gray-600 mt-2">Detailed review and approval process for loan applications.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Application Review System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page will contain detailed loan review functionality with document verification, credit analysis, and approval workflows.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewPage;
