import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onHide: () => void;
}

export function Toast({
  visible,
  type,
  title,
  message,
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'bg-green-500',
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: 'bg-red-500',
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: 'bg-yellow-500',
          icon: 'warning' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: 'bg-blue-500',
          icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FFFFFF',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 z-50"
      style={{
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View className="px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={hideToast}
          className={`${config.backgroundColor} rounded-xl p-4 shadow-lg`}
        >
          <View className="flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Ionicons name={config.icon} size={20} color={config.iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">
                {title}
              </Text>
              {message && (
                <Text className="text-white/90 text-sm mt-1">
                  {message}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={hideToast} className="ml-2">
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Toast context and hook for global toast management
import { createContext, useContext, useState } from 'react';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<{
    visible: boolean;
    type: ToastType;
    title: string;
    message?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
  });

  const showToast = (type: ToastType, title: string, message?: string) => {
    setToast({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}