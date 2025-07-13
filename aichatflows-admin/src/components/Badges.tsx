import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Client } from '../types';
import { getPaymentStatusColor, getPaymentStatusText, getPlanColor, PLANS } from '../utils/finance';

interface PaymentStatusBadgeProps {
  status: Client['payment_status'];
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function PaymentStatusBadge({ status = 'unpaid', onPress, size = 'md' }: PaymentStatusBadgeProps) {
  const color = getPaymentStatusColor(status);
  const text = getPaymentStatusText(status);
  
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress} className={`${sizeClasses[size]} rounded-full`}>
      <View style={{ backgroundColor: color }} className="rounded-full px-2 py-1">
        <Text className={`${textSizeClasses[size]} font-medium text-white text-center`}>
          {text}
        </Text>
      </View>
    </Component>
  );
}

interface PlanBadgeProps {
  plan: Client['plan'];
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
}

export function PlanBadge({ plan = 'starter', onPress, size = 'md', showPrice = false }: PlanBadgeProps) {
  const color = getPlanColor(plan);
  const planInfo = PLANS[plan];
  const displayText = showPrice 
    ? `${plan?.toUpperCase()} - $${planInfo.price}`
    : plan?.toUpperCase() || 'STARTER';
  
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress} className={`${sizeClasses[size]} rounded-full`}>
      <View style={{ backgroundColor: color }} className="rounded-full px-2 py-1">
        <Text className={`${textSizeClasses[size]} font-bold text-white text-center`}>
          {displayText}
        </Text>
      </View>
    </Component>
  );
}

interface StatusBadgeProps {
  status: Client['status'];
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusColor = (status: Client['status']): string => {
    switch (status) {
      case 'active':
        return '#10B981'; // Green
      case 'in_progress':
        return '#F59E0B'; // Yellow
      case 'paused':
        return '#6B7280'; // Gray
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const color = getStatusColor(status);
  
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <View className={`${sizeClasses[size]} rounded-full`}>
      <View style={{ backgroundColor: color }} className="rounded-full px-2 py-1">
        <Text className={`${textSizeClasses[size]} font-medium text-white text-center capitalize`}>
          {status.replace('_', ' ')}
        </Text>
      </View>
    </View>
  );
}

interface InPersonBadgeProps {
  signedInPerson: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InPersonBadge({ signedInPerson, size = 'sm' }: InPersonBadgeProps) {
  if (!signedInPerson) return null;

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <View className={`${sizeClasses[size]} rounded-full`}>
      <View style={{ backgroundColor: '#8B5CF6' }} className="rounded-full px-2 py-1">
        <Text className={`${textSizeClasses[size]} font-medium text-white text-center`}>
          👥 In-Person
        </Text>
      </View>
    </View>
  );
}

interface CombinedClientBadgesProps {
  client: Client;
  onPaymentPress?: () => void;
  onPlanPress?: () => void;
  showPrice?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CombinedClientBadges({ 
  client, 
  onPaymentPress, 
  onPlanPress, 
  showPrice = false,
  size = 'sm' 
}: CombinedClientBadgesProps) {
  return (
    <View className="flex-row flex-wrap gap-1 mt-1">
      <PlanBadge 
        plan={client.plan} 
        onPress={onPlanPress}
        size={size}
        showPrice={showPrice}
      />
      <PaymentStatusBadge 
        status={client.payment_status} 
        onPress={onPaymentPress}
        size={size}
      />
      <InPersonBadge 
        signedInPerson={client.signed_in_person || false}
        size={size}
      />
    </View>
  );
}

interface QuickActionBadgeProps {
  label: string;
  onPress: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuickActionBadge({ label, onPress, color = '#00D4AA', size = 'sm' }: QuickActionBadgeProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <TouchableOpacity onPress={onPress} className={`${sizeClasses[size]} rounded-full`}>
      <View style={{ backgroundColor: color }} className="rounded-full px-3 py-1">
        <Text className={`${textSizeClasses[size]} font-semibold text-white text-center`}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}