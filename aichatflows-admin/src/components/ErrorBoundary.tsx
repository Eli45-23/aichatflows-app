import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo });
    
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <ScrollView className="flex-1 px-6 py-8">
            <View className="items-center">
              <View className="bg-red-100 rounded-full p-4 mb-6">
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
              </View>
              
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                Something went wrong
              </Text>
              
              <Text className="text-gray-600 text-center mb-6">
                The app encountered an unexpected error. This has been logged for review.
              </Text>

              <TouchableOpacity
                onPress={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="bg-primary rounded-lg px-6 py-3 mb-4"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>

              {__DEV__ && this.state.error && (
                <View className="bg-gray-100 rounded-lg p-4 mt-6 w-full">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Debug Information:
                  </Text>
                  <Text className="text-xs text-gray-600 font-mono">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text className="text-xs text-gray-500 font-mono mt-2">
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Error display component for specific errors
interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorDisplay({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Try Again',
  icon = 'alert-circle'
}: ErrorDisplayProps) {
  return (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name={icon} size={64} color="#EF4444" />
      <Text className="text-gray-900 text-lg font-semibold mt-4">{title}</Text>
      <Text className="text-gray-600 text-center mt-2">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-primary rounded-lg px-6 py-3 mt-4"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      icon="wifi-outline"
    />
  );
}

// Not found component
export function NotFound({ 
  title = "Not Found", 
  message = "The requested item could not be found.",
  onGoBack
}: { 
  title?: string; 
  message?: string; 
  onGoBack?: () => void;
}) {
  return (
    <ErrorDisplay
      title={title}
      message={message}
      onRetry={onGoBack}
      retryText="Go Back"
      icon="search-outline"
    />
  );
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Handled error:', error);
    if (errorInfo) {
      console.error('Error info:', errorInfo);
    }
  }, []);

  return handleError;
}

// Higher-order component wrapper
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: any) => void
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}