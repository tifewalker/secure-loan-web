import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NoAccessPageProps {
  message?: string;
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const NoAccessPage: React.FC<NoAccessPageProps> = ({
  message = "You don't have permission to access this page or resource.",
  title = "Access Denied",
  showBackButton = true,
  showHomeButton = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              {message}
            </p>
            
            <p className="text-sm text-gray-500">
              Please contact your administrator if you believe this is an error.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {showBackButton && (
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}
              
              {showHomeButton && (
                <Button
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you need access to this resource, please contact your system administrator
                or manager to request the appropriate permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoAccessPage;