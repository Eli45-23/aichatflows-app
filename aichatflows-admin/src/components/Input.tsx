import React, { useState, forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  TextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';

export type InputVariant = 'default' | 'error' | 'success';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  showPasswordToggle?: boolean;
}

const variantStyles: Record<InputVariant, { 
  border: string; 
  focusBorder: string; 
  background: string;
  text: string;
}> = {
  default: {
    border: 'border-gray-300',
    focusBorder: 'border-primary',
    background: 'bg-white',
    text: 'text-gray-900'
  },
  error: {
    border: 'border-red-300',
    focusBorder: 'border-red-500',
    background: 'bg-red-50',
    text: 'text-gray-900'
  },
  success: {
    border: 'border-green-300',
    focusBorder: 'border-green-500',
    background: 'bg-green-50',
    text: 'text-gray-900'
  }
};

const sizeStyles: Record<InputSize, { 
  container: string; 
  text: string; 
  icon: number;
  padding: string;
}> = {
  sm: {
    container: 'h-10',
    text: 'text-sm',
    icon: 16,
    padding: 'px-3 py-2'
  },
  md: {
    container: 'h-12',
    text: 'text-base',
    icon: 20,
    padding: 'px-4 py-3'
  },
  lg: {
    container: 'h-14',
    text: 'text-lg',
    icon: 24,
    padding: 'px-5 py-4'
  }
};

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  showPasswordToggle = false,
  secureTextEntry,
  ...textInputProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const focusAnimation = useSharedValue(0);
  
  // Determine final variant based on error state
  const finalVariant = error ? 'error' : variant;
  const variantStyle = variantStyles[finalVariant];
  const sizeStyle = sizeStyles[size];

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      ['#D1D5DB', '#00D4AA'] // gray-300 to primary
    );
    
    return {
      borderColor: error ? '#EF4444' : borderColor, // red-500 for errors
      shadowColor: focusAnimation.value > 0.5 ? '#00D4AA' : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: focusAnimation.value * 0.1,
      shadowRadius: focusAnimation.value * 4,
      elevation: focusAnimation.value * 2,
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnimation.value = withTiming(1, { duration: 200 });
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnimation.value = withTiming(0, { duration: 200 });
    textInputProps.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Determine if we should show password toggle
  const shouldShowPasswordToggle = showPasswordToggle && secureTextEntry !== undefined;
  const finalRightIcon = shouldShowPasswordToggle 
    ? (isPasswordVisible ? 'eye-off' : 'eye')
    : rightIcon;
  
  const handleRightIconPress = shouldShowPasswordToggle 
    ? togglePasswordVisibility 
    : onRightIconPress;

  const inputClasses = [
    'flex-1',
    sizeStyle.text,
    variantStyle.text,
    disabled ? 'text-gray-400' : ''
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'border rounded-input',
    sizeStyle.container,
    sizeStyle.padding,
    variantStyle.background,
    'flex-row items-center',
    disabled ? 'opacity-50' : ''
  ].filter(Boolean).join(' ');

  return (
    <View style={containerStyle}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-2">
          <Text 
            className={`text-sm font-medium text-gray-700 ${required ? '' : ''}`}
            style={labelStyle}
          >
            {label}
          </Text>
          {required && (
            <Text className="text-red-500 ml-1">*</Text>
          )}
        </View>
      )}

      {/* Input Container */}
      <Animated.View 
        className={containerClasses}
        style={[animatedBorderStyle]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-3">
            <Ionicons 
              name={leftIcon} 
              size={sizeStyle.icon} 
              color={isFocused ? '#00D4AA' : '#9CA3AF'} 
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          className={inputClasses}
          style={[
            { 
              textAlignVertical: 'center',
              includeFontPadding: false,
              paddingVertical: 0,
            },
            inputStyle
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={shouldShowPasswordToggle ? !isPasswordVisible : secureTextEntry}
          placeholderTextColor={disabled ? '#D1D5DB' : '#6B7280'}
          {...textInputProps}
        />

        {/* Right Icon */}
        {finalRightIcon && (
          <TouchableOpacity 
            onPress={handleRightIconPress}
            className="ml-3 p-1"
            disabled={!handleRightIconPress}
          >
            <Ionicons 
              name={finalRightIcon} 
              size={sizeStyle.icon} 
              color={isFocused ? '#00D4AA' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <View className="mt-2">
          <Text 
            className={`text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}
          >
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

// Preset input components for common use cases
export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry' | 'showPasswordToggle'>> = (props) => (
  <Input {...props} secureTextEntry showPasswordToggle />
);

export const EmailInput: React.FC<Omit<InputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete'>> = (props) => (
  <Input 
    {...props} 
    keyboardType="email-address" 
    autoCapitalize="none" 
    autoComplete="email"
    leftIcon="mail"
  />
);

export const PhoneInput: React.FC<Omit<InputProps, 'keyboardType' | 'autoComplete'>> = (props) => (
  <Input 
    {...props} 
    keyboardType="phone-pad" 
    autoComplete="tel"
    leftIcon="call"
  />
);

export const SearchInput: React.FC<Omit<InputProps, 'leftIcon'> & { 
  onClear?: () => void;
  showClearButton?: boolean;
}> = ({ onClear, showClearButton = true, value, inputStyle, ...props }) => (
  <Input 
    {...props}
    value={value}
    leftIcon="search"
    rightIcon={showClearButton && value ? "close" : undefined}
    onRightIconPress={showClearButton && value ? onClear : undefined}
    placeholder={props.placeholder || "Search..."}
    placeholderTextColor="#6B7280"
    inputStyle={{
      textAlignVertical: 'center',
      includeFontPadding: false,
      paddingVertical: 0,
      ...inputStyle,
    }}
  />
);