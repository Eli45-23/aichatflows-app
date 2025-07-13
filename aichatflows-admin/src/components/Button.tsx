import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string; loadingColor: string }> = {
  primary: {
    container: 'bg-primary border border-primary',
    text: 'text-white font-semibold',
    loadingColor: '#FFFFFF'
  },
  secondary: {
    container: 'bg-white border border-gray-300',
    text: 'text-gray-700 font-semibold',
    loadingColor: '#374151'
  },
  ghost: {
    container: 'bg-transparent border border-transparent',
    text: 'text-primary font-semibold',
    loadingColor: '#00D4AA'
  },
  danger: {
    container: 'bg-red-500 border border-red-500',
    text: 'text-white font-semibold',
    loadingColor: '#FFFFFF'
  },
  success: {
    container: 'bg-green-500 border border-green-500',
    text: 'text-white font-semibold',
    loadingColor: '#FFFFFF'
  }
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: {
    container: 'px-4 py-3 rounded-button min-h-[44px]',
    text: 'text-sm',
    icon: 16
  },
  md: {
    container: 'px-6 py-4 rounded-button min-h-[48px]',
    text: 'text-base',
    icon: 20
  },
  lg: {
    container: 'px-8 py-5 rounded-button min-h-[52px]',
    text: 'text-lg',
    icon: 24
  }
};

const disabledStyles = {
  container: 'opacity-50',
  text: ''
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
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
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(0.8, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const buttonClasses = [
    variantStyle.container,
    sizeStyle.container,
    fullWidth ? 'w-full' : '',
    isDisabled ? disabledStyles.container : '',
    'shadow-sm',
    'flex-row items-center justify-center'
  ].filter(Boolean).join(' ');

  const textClasses = [
    variantStyle.text,
    sizeStyle.text,
    isDisabled ? disabledStyles.text : ''
  ].filter(Boolean).join(' ');

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <Ionicons
        name={icon}
        size={sizeStyle.icon}
        color={variant === 'ghost' ? '#00D4AA' : variant === 'secondary' ? '#374151' : '#FFFFFF'}
        style={position === 'left' ? { marginRight: 8 } : { marginLeft: 8 }}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-row items-center">
          <ActivityIndicator 
            size="small" 
            color={variantStyle.loadingColor}
            style={{ marginRight: 8 }}
          />
          <Text className={textClasses} style={textStyle}>
            {typeof children === 'string' ? children : 'Loading...'}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-row items-center">
        {renderIcon('left')}
        <Text className={textClasses} style={textStyle}>
          {children}
        </Text>
        {renderIcon('right')}
      </View>
    );
  };

  return (
    <AnimatedTouchableOpacity
      className={buttonClasses}
      style={[animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      testID={testID}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );
};

// Preset button components for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="ghost" />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="danger" />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="success" />
);