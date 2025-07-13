import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="warning-outline" size={64} color="#EF4444" />
            <Text className="text-gray-900 text-xl font-bold mt-4">Something went wrong</Text>
            <Text className="text-gray-600 text-center mt-2">
              An unexpected error occurred. Please try refreshing the app.
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-lg px-6 py-3 mt-6"
              onPress={() => this.setState({ hasError: false, error: undefined })}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
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