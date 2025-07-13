import React, { ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';

export interface FormFieldProps {
  children: ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  spacing?: 'compact' | 'normal' | 'loose';
}

const spacingStyles = {
  compact: 'mb-3',
  normal: 'mb-4',
  loose: 'mb-6'
};

export const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  style,
  spacing = 'normal'
}) => {
  const spacingClass = spacingStyles[spacing];

  return (
    <View className={`${spacingClass} ${disabled ? 'opacity-50' : ''}`} style={style}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-2">
          <Text className="text-sm font-medium text-gray-700">
            {label}
          </Text>
          {required && (
            <Text className="text-red-500 ml-1">*</Text>
          )}
        </View>
      )}

      {/* Input/Control */}
      <View>
        {children}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <View className="mt-2">
          <Text className={`text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FormField;