import React, { ReactNode } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
  interpolate
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

export type BadgeVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'neutral';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  dot?: boolean;
  outline?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, { 
  bg: string; 
  text: string; 
  border: string;
  dot: string;
}> = {
  primary: {
    bg: 'bg-primary',
    text: 'text-white',
    border: 'border-primary',
    dot: '#00D4AA'
  },
  secondary: {
    bg: 'bg-gray-500',
    text: 'text-white',
    border: 'border-gray-500',
    dot: '#6B7280'
  },
  success: {
    bg: 'bg-green-500',
    text: 'text-white',
    border: 'border-green-500',
    dot: '#22C55E'
  },
  warning: {
    bg: 'bg-yellow-500',
    text: 'text-white',
    border: 'border-yellow-500',
    dot: '#EAB308'
  },
  danger: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-500',
    dot: '#EF4444'
  },
  info: {
    bg: 'bg-blue-500',
    text: 'text-white',
    border: 'border-blue-500',
    dot: '#3B82F6'
  },
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: '#9CA3AF'
  }
};

const outlineVariantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  secondary: { bg: 'bg-gray-100', text: 'text-gray-700' },
  success: { bg: 'bg-green-50', text: 'text-green-700' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  danger: { bg: 'bg-red-50', text: 'text-red-700' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600' }
};

const sizeStyles: Record<BadgeSize, { 
  container: string; 
  text: string; 
  icon: number;
  dot: string;
  padding: string;
}> = {
  xs: {
    container: 'h-4 min-w-4',
    text: 'text-xs font-medium',
    icon: 10,
    dot: 'w-1.5 h-1.5',
    padding: 'px-1.5'
  },
  sm: {
    container: 'h-5 min-w-5',
    text: 'text-xs font-medium',
    icon: 12,
    dot: 'w-2 h-2',
    padding: 'px-2'
  },
  md: {
    container: 'h-6 min-w-6',
    text: 'text-sm font-medium',
    icon: 14,
    dot: 'w-2.5 h-2.5',
    padding: 'px-2.5 py-0.5'
  },
  lg: {
    container: 'h-7 min-w-7',
    text: 'text-sm font-semibold',
    icon: 16,
    dot: 'w-3 h-3',
    padding: 'px-3 py-1'
  }
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  dot = false,
  outline = false,
  rounded = true,
  style,
  textStyle,
  animated = false,
  pulse = false
}) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
    }

    if (pulse) {
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
      // Repeat pulse
      const interval = setInterval(() => {
        pulseScale.value = withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        );
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [animated, pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * pulseScale.value }
      ],
    };
  });

  const variantStyle = outline ? outlineVariantStyles[variant] : variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerClasses = [
    outline ? variantStyle.bg : variantStyles[variant].bg,
    outline ? `border ${variantStyles[variant].border}` : '',
    sizeStyle.container,
    sizeStyle.padding,
    rounded ? 'rounded-full' : 'rounded',
    'flex-row items-center justify-center',
    dot ? 'w-auto' : ''
  ].filter(Boolean).join(' ');

  const textClasses = [
    variantStyle.text,
    sizeStyle.text
  ].filter(Boolean).join(' ');

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <Ionicons
        name={icon}
        size={sizeStyle.icon}
        color={outline ? variantStyles[variant].dot : '#FFFFFF'}
        style={position === 'left' ? { marginRight: 4 } : { marginLeft: 4 }}
      />
    );
  };

  const renderDot = () => {
    if (!dot) return null;
    
    return (
      <View 
        className={`${sizeStyle.dot} rounded-full mr-2`}
        style={{ backgroundColor: variantStyles[variant].dot }}
      />
    );
  };

  if (dot && typeof children === 'string') {
    return (
      <AnimatedView 
        className="flex-row items-center"
        style={[animatedStyle, style]}
      >
        {renderDot()}
        <Text className={textClasses} style={textStyle}>
          {children}
        </Text>
      </AnimatedView>
    );
  }

  return (
    <AnimatedView 
      className={containerClasses}
      style={[animatedStyle, style]}
    >
      {renderIcon('left')}
      <Text className={textClasses} style={textStyle}>
        {children}
      </Text>
      {renderIcon('right')}
    </AnimatedView>
  );
};

// Status badge preset components
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'cancelled';
  size?: BadgeSize;
  outline?: boolean;
}> = ({ status, size = 'sm', outline = true }) => {
  const statusConfig = {
    active: { variant: 'success' as BadgeVariant, icon: 'checkmark-circle' as const, label: 'Active' },
    inactive: { variant: 'neutral' as BadgeVariant, icon: 'pause-circle' as const, label: 'Inactive' },
    pending: { variant: 'warning' as BadgeVariant, icon: 'time' as const, label: 'Pending' },
    completed: { variant: 'success' as BadgeVariant, icon: 'checkmark-circle' as const, label: 'Completed' },
    failed: { variant: 'danger' as BadgeVariant, icon: 'close-circle' as const, label: 'Failed' },
    cancelled: { variant: 'neutral' as BadgeVariant, icon: 'ban' as const, label: 'Cancelled' }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon}
      outline={outline}
    >
      {config.label}
    </Badge>
  );
};

// Priority badge
export const PriorityBadge: React.FC<{
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: BadgeSize;
}> = ({ priority, size = 'sm' }) => {
  const priorityConfig = {
    low: { variant: 'neutral' as BadgeVariant, icon: 'arrow-down' as const },
    medium: { variant: 'warning' as BadgeVariant, icon: 'remove' as const },
    high: { variant: 'danger' as BadgeVariant, icon: 'arrow-up' as const },
    urgent: { variant: 'danger' as BadgeVariant, icon: 'warning' as const }
  };

  const config = priorityConfig[priority];

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon}
      pulse={priority === 'urgent'}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

// Count badge (for notifications, etc.)
export const CountBadge: React.FC<{
  count: number;
  max?: number;
  size?: BadgeSize;
  variant?: BadgeVariant;
}> = ({ count, max = 99, size = 'sm', variant = 'danger' }) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  if (count === 0) return null;

  return (
    <Badge
      variant={variant}
      size={size}
      animated={count > 0}
    >
      {displayCount}
    </Badge>
  );
};

export default Badge;