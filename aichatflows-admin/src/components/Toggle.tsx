import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolateColor
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

const sizeStyles = {
  sm: {
    container: 'w-10 h-6',
    thumb: 'w-4 h-4',
    translateX: 16,
  },
  md: {
    container: 'w-12 h-7',
    thumb: 'w-5 h-5',
    translateX: 20,
  },
  lg: {
    container: 'w-14 h-8',
    thumb: 'w-6 h-6',
    translateX: 24,
  }
};

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  size = 'md',
  testID,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(value ? sizeStyles[size].translateX : 2);
  
  const sizeStyle = sizeStyles[size];

  React.useEffect(() => {
    translateX.value = withSpring(value ? sizeStyle.translateX : 2, {
      damping: 15,
      stiffness: 300,
    });
  }, [value, sizeStyle.translateX, translateX]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [2, sizeStyle.translateX],
      ['#E5E7EB', '#00D4AA']
    );

    return {
      backgroundColor,
      opacity: disabled ? 0.5 : 1,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  if (label || description) {
    return (
      <Pressable 
        onPress={handlePress}
        disabled={disabled}
        className="flex-row items-center justify-between py-3"
        style={{ minHeight: 44 }} // 44pt touch target
        testID={testID}
      >
        <View className="flex-1 mr-4">
          {label && (
            <Text className={`text-base font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
              {label}
            </Text>
          )}
          {description && (
            <Text className={`text-sm mt-1 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {description}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          className="p-1" // Extra padding for touch target
        >
          <AnimatedView
            className={`${sizeStyle.container} rounded-full justify-center relative`}
            style={animatedContainerStyle}
          >
            <AnimatedView
              className={`${sizeStyle.thumb} bg-white rounded-full shadow-sm absolute`}
              style={animatedThumbStyle}
            />
          </AnimatedView>
        </TouchableOpacity>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      className="p-1"
      testID={testID}
    >
      <AnimatedView
        className={`${sizeStyle.container} rounded-full justify-center relative`}
        style={animatedContainerStyle}
      >
        <AnimatedView
          className={`${sizeStyle.thumb} bg-white rounded-full shadow-sm absolute`}
          style={animatedThumbStyle}
        />
      </AnimatedView>
    </TouchableOpacity>
  );
};

export default Toggle;