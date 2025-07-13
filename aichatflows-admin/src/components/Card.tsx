import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  pressable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  showShadow?: boolean;
}

// Simple minimal Card component to eliminate navigation context issues
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  title,
  subtitle,
  onPress,
  style,
  pressable = false,
  disabled = false,
}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg p-4';
  
  const content = (
    <View>
      {title && (
        <Text className="text-base font-semibold text-gray-900 mb-2">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text className="text-sm text-gray-500 mb-2">
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );

  if ((pressable || onPress) && !disabled) {
    return (
      <TouchableOpacity
        className={baseClasses}
        style={style}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} style={style}>
      {content}
    </View>
  );
};

// Simplified preset components
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  icon?: string; // Added for compatibility
  trend?: string; // Added for compatibility
  trendValue?: string; // Added for compatibility
  onPress?: () => void;
}> = ({ title, value, subtitle, color = 'primary', onPress }) => {
  const colorStyles = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  return (
    <Card onPress={onPress} pressable={!!onPress}>
      <View>
        <Text className="text-sm text-gray-600 mb-1">{title}</Text>
        <Text className={`text-2xl font-bold ${colorStyles[color]} mb-1`}>
          {value}
        </Text>
        {subtitle && (
          <Text className="text-xs text-gray-500">{subtitle}</Text>
        )}
      </View>
    </Card>
  );
};

export const ActionCard: React.FC<{
  title: string;
  description?: string;
  icon?: string; // Added for compatibility
  onPress: () => void;
  disabled?: boolean;
}> = ({ title, description, onPress, disabled }) => (
  <Card onPress={onPress} disabled={disabled} pressable>
    <View className="items-center text-center py-4">
      <Text className="text-base font-semibold text-gray-900 mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-500 text-center">
          {description}
        </Text>
      )}
    </View>
  </Card>
);

export default Card;