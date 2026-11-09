import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * The API has no password-reset endpoint yet (staff accounts are managed by an
 * admin), so this tells the user who to contact instead of pretending an email
 * was sent. Wire `isSubmitted` back up once the backend adds the endpoint.
 */
export const useForgotPassword = () => {
  const [isLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleForgotPassword = async (_email: string): Promise<boolean> => {
    toast({
      title: 'Password reset unavailable',
      description: 'Please contact your administrator to reset your password.',
    });
    return false;
  };

  const resetSubmission = () => setIsSubmitted(false);

  return { isLoading, isSubmitted, handleForgotPassword, resetSubmission };
};
