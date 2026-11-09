import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface LoginFormData {
  email: string;
  password: string;
}

/** Login form handler: signs in, toasts the result and routes to the dashboard. */
export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (formData: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast({ title: 'Login successful', description: `Welcome back${user.firstName ? `, ${user.firstName}` : ''}!` });
      navigate(user.role === 'admin' || user.role === 'staff' ? '/admin/dashboard' : '/dashboard');
      return true;
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleLogin };
};
