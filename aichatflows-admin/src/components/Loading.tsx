import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
}

export function Loading({ 
  visible, 
  message = 'Loading...', 
  size = 'large',
  overlay = false 
}: LoadingProps) {
  if (!visible) return null;

  const content = (
    <View className="flex-1 justify-center items-center">
      <View className="bg-white rounded-xl p-6 shadow-lg items-center">
        <ActivityIndicator size={size} color="#00D4AA" />
        <Text className="text-gray-600 mt-4 text-center">{message}</Text>
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/30 justify-center items-center px-6">
          {content}
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {content}
    </SafeAreaView>
  );
}

// Full screen loading component
export function FullScreenLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text className="text-gray-600 mt-4">{message}</Text>
      </View>
    </SafeAreaView>
  );
}

// Inline loading component
export function InlineLoading({ message = 'Loading...', size = 'small' as 'small' | 'large' }) {
  return (
    <View className="py-4 items-center">
      <ActivityIndicator size={size} color="#00D4AA" />
      <Text className="text-gray-600 mt-2 text-sm">{message}</Text>
    </View>
  );
}

// Button loading state
export function ButtonLoading({ loading, children, ...props }: { loading: boolean; children: React.ReactNode; [key: string]: any }) {
  return (
    <View className={`flex-row items-center justify-center ${props.className || ''}`}>
      {loading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
      {children}
    </View>
  );
}