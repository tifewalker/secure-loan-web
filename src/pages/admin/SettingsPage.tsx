import { Card, CardContent } from '@/components/ui/card';
import { Settings, Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure interest rates, loan terms, and system parameters
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-muted-foreground/10 shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Construction className="size-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Coming Soon</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The Settings page is currently under development. You'll soon be able to configure
              interest rates, loan terms, approval workflows, and other system parameters from here.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')} className="mt-2">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;