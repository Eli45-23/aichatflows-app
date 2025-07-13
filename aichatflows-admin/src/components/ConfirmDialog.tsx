import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
  icon = 'alert-circle',
  destructive = false,
}: ConfirmDialogProps) {
  const defaultConfirmColor = destructive ? 'bg-red-600' : 'bg-primary';
  const iconColor = destructive ? '#EF4444' : '#00D4AA';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/30 justify-center items-center px-6">
        <View className="bg-white rounded-xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className={`p-3 rounded-full mb-3 ${destructive ? 'bg-red-100' : 'bg-green-100'}`}>
              <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              {title}
            </Text>
            <Text className="text-gray-600 text-center leading-5">
              {message}
            </Text>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-lg py-4"
              onPress={onCancel}
            >
              <Text className="text-gray-700 text-center font-semibold">
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 rounded-lg py-4 ${confirmColor || defaultConfirmColor}`}
              onPress={onConfirm}
            >
              <Text className="text-white text-center font-semibold">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}