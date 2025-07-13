import React, { ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  } & Partial<ButtonProps>;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
}

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 40,
    iconContainer: 'mb-3',
    title: 'text-base font-medium',
    description: 'text-sm',
    spacing: 'space-y-2'
  },
  md: {
    container: 'py-12',
    icon: 48,
    iconContainer: 'mb-4',
    title: 'text-lg font-semibold',
    description: 'text-base',
    spacing: 'space-y-3'
  },
  lg: {
    container: 'py-16',
    icon: 64,
    iconContainer: 'mb-6',
    title: 'text-xl font-bold',
    description: 'text-lg',
    spacing: 'space-y-4'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
  size = 'md',
  animated = true,
  style,
  children
}) => {
  const floatAnimation = useSharedValue(0);
  const fadeAnimation = useSharedValue(0);
  
  React.useEffect(() => {
    if (animated) {
      // Fade in animation
      fadeAnimation.value = withTiming(1, { 
        duration: 600,
        easing: Easing.out(Easing.cubic)
      });
      
      // Floating animation for icon
      floatAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      fadeAnimation.value = 1;
    }
  }, [animated]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatAnimation.value * 8 }
      ],
      opacity: fadeAnimation.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnimation.value,
      transform: [
        { translateY: (1 - fadeAnimation.value) * 20 }
      ],
    };
  });

  const sizeStyle = sizeStyles[size];

  return (
    <View 
      className={`items-center justify-center ${sizeStyle.container}`}
      style={style}
    >
      <Animated.View 
        className={`items-center ${sizeStyle.spacing}`}
        style={contentAnimatedStyle}
      >
        {/* Icon */}
        <Animated.View 
          className={sizeStyle.iconContainer}
          style={iconAnimatedStyle}
        >
          <View className="bg-gray-100 rounded-full p-4">
            <Ionicons 
              name={icon} 
              size={sizeStyle.icon} 
              color="#9CA3AF" 
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Text className={`${sizeStyle.title} text-gray-900 text-center`}>
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text className={`${sizeStyle.description} text-gray-500 text-center max-w-xs`}>
            {description}
          </Text>
        )}

        {/* Custom Children */}
        {children}

        {/* Action Button */}
        {action && (
          <View className="mt-4">
            <Button
              variant={action.variant || 'primary'}
              size={action.size || (size === 'lg' ? 'lg' : 'md')}
              onPress={action.onPress}
              icon={action.icon}
            >
              {action.label}
            </Button>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// Preset empty state components for common scenarios
export const NoDataEmptyState: React.FC<Omit<EmptyStateProps, 'icon' | 'title'> & { dataType: string }> = ({ 
  dataType, 
  ...props 
}) => (
  <EmptyState
    {...props}
    icon="document-outline"
    title={`No ${dataType} found`}
    description={`You don't have any ${dataType.toLowerCase()} yet. Add your first one to get started.`}
  />
);

export const NetworkErrorEmptyState: React.FC<Omit<EmptyStateProps, 'icon'> & { title?: string; description?: string }> = ({ 
  title = "Connection Error",
  description = "Unable to load data. Please check your internet connection and try again.",
  ...props 
}) => (
  <EmptyState
    {...props}
    icon="cloud-offline-outline"
    title={title}
    description={description}
  />
);

export const SearchEmptyState: React.FC<Omit<EmptyStateProps, 'icon' | 'title'> & { searchTerm?: string }> = ({ 
  searchTerm, 
  ...props 
}) => (
  <EmptyState
    {...props}
    icon="search-outline"
    title="No results found"
    description={searchTerm ? `No results for "${searchTerm}". Try adjusting your search.` : "Try different search terms."}
  />
);

export const LoadingEmptyState: React.FC<Omit<EmptyStateProps, 'icon' | 'animated'> & { title?: string; description?: string }> = ({ 
  title = "Loading...", 
  description = "Please wait while we fetch your data.",
  ...props 
}) => (
  <EmptyState
    {...props}
    icon="refresh-outline"
    title={title}
    description={description}
    animated={true}
  />
);

export default EmptyState;