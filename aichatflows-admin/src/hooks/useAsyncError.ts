import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncErrorOptions {
  retryCount?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

// Hook for handling async operations with comprehensive error handling
export function useAsyncError<T = any>(
  initialData: T | null = null
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options: AsyncErrorOptions = {}
  ) => {
    const { retryCount = 0, retryDelay = 1000, onError } = options;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    const attemptExecution = async (attempt: number): Promise<void> => {
      try {
        const result = await asyncFunction();
        setState(prev => ({ ...prev, data: result, loading: false, error: null }));
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        
        if (attempt < retryCount) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptExecution(attempt + 1);
        }

        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        
        if (onError) {
          onError(error as Error);
        }
      }
    };

    await attemptExecution(0);
  }, []);

  const retry = useCallback((
    asyncFunction: () => Promise<T>,
    options?: AsyncErrorOptions
  ) => {
    execute(asyncFunction, options);
  }, [execute]);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    setData,
    setError,
  };
}

// Utility function to extract error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'An unexpected error occurred';
}

// Hook for network-specific error handling
export function useNetworkError<T = any>(initialData: T | null = null) {
  const { execute, ...rest } = useAsyncError<T>(initialData);

  const executeWithNetworkHandling = useCallback(async (
    asyncFunction: () => Promise<T>,
    options: AsyncErrorOptions = {}
  ) => {
    const enhancedOptions: AsyncErrorOptions = {
      retryCount: 2,
      retryDelay: 1000,
      ...options,
      onError: (error) => {
        // Handle network-specific errors
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          console.warn('Network error detected:', error.message);
        }
        
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    await execute(asyncFunction, enhancedOptions);
  }, [execute]);

  return {
    ...rest,
    execute: executeWithNetworkHandling,
  };
}

// Hook for API-specific error handling with standardized error responses
export function useApiError<T = any>(initialData: T | null = null) {
  const { execute, ...rest } = useAsyncError<T>(initialData);

  const executeWithApiHandling = useCallback(async (
    asyncFunction: () => Promise<T>,
    options: AsyncErrorOptions = {}
  ) => {
    const enhancedOptions: AsyncErrorOptions = {
      ...options,
      onError: (error) => {
        // Handle API-specific errors
        const message = error.message.toLowerCase();
        
        if (message.includes('401') || message.includes('unauthorized')) {
          console.error('Authentication error');
        } else if (message.includes('403') || message.includes('forbidden')) {
          console.error('Authorization error');
        } else if (message.includes('404') || message.includes('not found')) {
          console.error('Resource not found');
        } else if (message.includes('500') || message.includes('server')) {
          console.error('Server error');
        }
        
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    await execute(asyncFunction, enhancedOptions);
  }, [execute]);

  return {
    ...rest,
    execute: executeWithApiHandling,
  };
}

// Custom hook for form submission with validation error handling
export function useFormError<T = any>() {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    errors: Record<string, string>;
    generalError: string | null;
  }>({
    data: null,
    loading: false,
    errors: {},
    generalError: null,
  });

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    onValidationError?: (errors: Record<string, string>) => void
  ) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      errors: {}, 
      generalError: null 
    }));

    try {
      const result = await asyncFunction();
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false 
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      
      // Check if this is a validation error (assuming validation errors have a specific format)
      if (error instanceof Error && error.message.includes('validation')) {
        try {
          const validationErrors = JSON.parse(errorMessage);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            errors: validationErrors 
          }));
          
          if (onValidationError) {
            onValidationError(validationErrors);
          }
          return;
        } catch {
          // If parsing fails, treat as general error
        }
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        generalError: errorMessage 
      }));
    }
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {}, generalError: null }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setState(prev => ({ 
      ...prev, 
      errors: { ...prev.errors, [field]: error } 
    }));
  }, []);

  return {
    ...state,
    execute,
    clearErrors,
    setFieldError,
    hasErrors: Object.keys(state.errors).length > 0 || !!state.generalError,
  };
}

export default useAsyncError;