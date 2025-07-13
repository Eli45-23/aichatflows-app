import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  pressable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  showShadow?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-card',
  outlined: 'bg-transparent border-2 border-gray-300',
  ghost: 'bg-gray-50'
};

const sizeStyles: Record<CardSize, { container: string; padding: string; title: string; subtitle: string }> = {
  sm: {
    container: 'rounded-lg',
    padding: 'p-3',
    title: 'text-sm font-semibold',
    subtitle: 'text-xs'
  },
  md: {
    container: 'rounded-card',
    padding: 'p-4',
    title: 'text-base font-semibold',
    subtitle: 'text-sm'
  },
  lg: {
    container: 'rounded-xl',
    padding: 'p-6',
    title: 'text-lg font-bold',
    subtitle: 'text-base'
  }
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  title,
  subtitle,
  icon,
  onPress,
  style,
  contentStyle,
  pressable = false,
  loading = false,
  disabled = false,
  showShadow = variant === 'elevated'
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if ((pressable || onPress) && !disabled && !loading) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(0.8, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if ((pressable || onPress) && !disabled && !loading) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isInteractive = (pressable || onPress) && !disabled && !loading;

  const cardClasses = [
    variantStyle,
    sizeStyle.container,
    sizeStyle.padding,
    disabled ? 'opacity-50' : '',
    isInteractive ? 'active:opacity-80' : ''
  ].filter(Boolean).join(' ');

  const shadowStyle = showShadow ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } : {};

  const renderHeader = () => {
    if (!title && !subtitle && !icon) return null;

    return (
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          {title && (
            <View className="flex-row items-center">
              {icon && (
                <View className="mr-2">
                  <Ionicons 
                    name={icon} 
                    size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} 
                    color="#6B7280" 
                  />
                </View>
              )}
              <Text className={`${sizeStyle.title} text-gray-900`}>
                {title}
              </Text>
            </View>
          )}
          {subtitle && (
            <Text className={`${sizeStyle.subtitle} text-gray-500 mt-1`}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const content = (
    <>
      {renderHeader()}
      <View style={contentStyle}>
        {children}
      </View>
    </>
  );

  if (isInteractive) {
    return (
      <AnimatedTouchableOpacity
        className={cardClasses}
        style={[animatedStyle, shadowStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {content}
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedView 
      className={cardClasses}
      style={[shadowStyle, style]}
    >
      {content}
    </AnimatedView>
  );
};

// Preset card components for common use cases
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary', onPress }) => {
  const colorStyles = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const trendIcons = {
    up: 'trending-up' as const,
    down: 'trending-down' as const,
    neutral: 'remove' as const
  };

  const trendColors = {
    up: '#22C55E',
    down: '#EF4444',
    neutral: '#6B7280'
  };

  return (
    <Card 
      variant="elevated" 
      size="md" 
      onPress={onPress}
      pressable={!!onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">{title}</Text>
          <Text className={`text-2xl font-bold ${colorStyles[color]} mb-1`}>
            {value}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500">{subtitle}</Text>
          )}
        </View>
        
        <View className="items-end">
          {icon && (
            <View className="bg-gray-100 p-2 rounded-lg mb-2">
              <Ionicons name={icon} size={20} color="#6B7280" />
            </View>
          )}
          {trend && trendValue && (
            <View className="flex-row items-center">
              <Ionicons 
                name={trendIcons[trend]} 
                size={16} 
                color={trendColors[trend]} 
              />
              <Text 
                className="text-xs ml-1" 
                style={{ color: trendColors[trend] }}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export const ActionCard: React.FC<{
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}> = ({ title, description, icon, onPress, disabled }) => (
  <Card 
    variant="outlined" 
    size="md" 
    onPress={onPress}
    disabled={disabled}
    pressable
  >
    <View className="items-center text-center py-4">
      <View className="bg-primary/10 p-3 rounded-full mb-3">
        <Ionicons name={icon} size={24} color="#00D4AA" />
      </View>
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