import { useToast } from './use-toast';

/**
 * Custom hook for handling errors consistently
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: any, defaultMessage = 'An error occurred') => {
    console.error('Error:', error);
    
    const message = 
      error?.response?.data?.message ||
      error?.message ||
      defaultMessage;

    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    });
  };

  const handleSuccess = (message: string, title = 'Success') => {
    toast({
      variant: 'success',
      title,
      description: message,
    });
  };

  return {
    handleError,
    handleSuccess,
  };
}

