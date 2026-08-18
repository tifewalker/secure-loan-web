import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface LoginFormData {
  email: string;
  password: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = (user: User | null): string => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      return '/admin/dashboard';
    }
    return '/dashboard';
  };

  const handleLogin = async (formData: LoginFormData): Promise<boolean> => {
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });

        // Get user from localStorage to determine route
        const storedUser = localStorage.getItem('user');
        let userData: User | null = null;
        
        if (storedUser) {
          try {
            userData = JSON.parse(storedUser) as User;
          } catch (error) {
            console.error('Failed to parse user data:', error);
          }
        }

        const route = getDashboardRoute(userData);
        navigate(route);
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleLogin,
  };
};