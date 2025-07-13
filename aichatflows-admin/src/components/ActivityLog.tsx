import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, User, CreditCard, UserPlus, Settings, TrendingUp, Activity } from 'lucide-react-native';
import { ActivityLogEntry } from '../types';

interface ActivityLogProps {
  activities: ActivityLogEntry[];
  loading?: boolean;
  limit?: number;
  showHeader?: boolean;
  onActivityPress?: (activity: ActivityLogEntry) => void;
}

export function ActivityLog({ 
  activities, 
  loading = false, 
  limit = 5, 
  showHeader = true,
  onActivityPress 
}: ActivityLogProps) {
  const getActivityIcon = (type: ActivityLogEntry['type']) => {
    const iconProps = { size: 16, color: getActivityColor(type) };
    
    switch (type) {
      case 'plan_change':
        return <TrendingUp {...iconProps} />;
      case 'payment_status':
        return <CreditCard {...iconProps} />;
      case 'in_person_signup':
        return <UserPlus {...iconProps} />;
      case 'client_created':
        return <User {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getActivityColor = (type: ActivityLogEntry['type']): string => {
    switch (type) {
      case 'plan_change':
        return '#8B5CF6'; // Purple
      case 'payment_status':
        return '#10B981'; // Green
      case 'in_person_signup':
        return '#3B82F6'; // Blue
      case 'client_created':
        return '#00D4AA'; // Primary
      default:
        return '#6B7280'; // Gray
    }
  };

  const getActivityBackgroundColor = (type: ActivityLogEntry['type']): string => {
    switch (type) {
      case 'plan_change':
        return '#F3E8FF'; // Purple light
      case 'payment_status':
        return '#ECFDF5'; // Green light
      case 'in_person_signup':
        return '#EFF6FF'; // Blue light
      case 'client_created':
        return '#ECFDF5'; // Green light
      default:
        return '#F9FAFB'; // Gray light
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        {showHeader && (
          <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</Text>
        )}
        <View className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <View key={index} className="flex-row items-center space-x-3">
              <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <View className="flex-1">
                <View className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <View className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const displayActivities = activities.slice(0, limit);

  if (displayActivities.length === 0) {
    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        {showHeader && (
          <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</Text>
        )}
        <View className="flex items-center justify-center py-8">
          <View className="bg-gray-100 p-3 rounded-full mb-3">
            <Activity size={24} color="#6B7280" />
          </View>
          <Text className="text-gray-500 text-sm text-center mb-2">Your activity feed will appear here</Text>
          <Text className="text-gray-400 text-xs text-center">
            Activity appears once clients start using the platform
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm">
      {showHeader && (
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Recent Activity</Text>
          {activities.length > limit && (
            <Text className="text-sm text-blue-600">
              {activities.length} total
            </Text>
          )}
        </View>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="max-h-80"
      >
        <View className="space-y-3">
          {displayActivities.map((activity, index) => (
            <TouchableOpacity
              key={activity.id}
              onPress={() => onActivityPress?.(activity)}
              className="flex-row items-start space-x-3 p-2 rounded-lg hover:bg-gray-50"
              activeOpacity={0.7}
            >
              {/* Activity Icon */}
              <View 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getActivityBackgroundColor(activity.type) }}
              >
                {getActivityIcon(activity.type)}
              </View>
              
              {/* Activity Content */}
              <View className="flex-1">
                <Text className="text-sm text-gray-900 leading-5">
                  {activity.description}
                </Text>
                <View className="flex-row items-center mt-1 space-x-2">
                  <Clock size={12} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </Text>
                  {activity.client_name && (
                    <>
                      <View className="w-1 h-1 bg-gray-300 rounded-full" />
                      <Text className="text-xs text-gray-500">
                        {activity.client_name}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {activities.length > limit && (
        <TouchableOpacity 
          className="mt-4 pt-3 border-t border-gray-100"
          onPress={() => {/* Handle view all */}}
        >
          <Text className="text-sm text-blue-600 text-center font-medium">
            View All Activity
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface ActivityStatsProps {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    byType: Record<string, number>;
  };
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  const getActivityColor = (type: ActivityLogEntry['type']): string => {
    switch (type) {
      case 'plan_change':
        return '#8B5CF6'; // Purple
      case 'payment_status':
        return '#10B981'; // Green
      case 'in_person_signup':
        return '#3B82F6'; // Blue
      case 'client_created':
        return '#00D4AA'; // Primary
      default:
        return '#6B7280'; // Gray
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</Text>
      
      <View className="space-y-4">
        {/* Quick Stats */}
        <View className="flex-row space-x-4">
          <View className="flex-1 bg-blue-50 p-3 rounded-lg">
            <Text className="text-2xl font-bold text-blue-600">{stats.today}</Text>
            <Text className="text-blue-500 text-xs">Today</Text>
          </View>
          <View className="flex-1 bg-green-50 p-3 rounded-lg">
            <Text className="text-2xl font-bold text-green-600">{stats.thisWeek}</Text>
            <Text className="text-green-500 text-xs">This Week</Text>
          </View>
          <View className="flex-1 bg-purple-50 p-3 rounded-lg">
            <Text className="text-2xl font-bold text-purple-600">{stats.total}</Text>
            <Text className="text-purple-500 text-xs">Total</Text>
          </View>
        </View>

        {/* Activity Types */}
        <View className="space-y-2">
          <Text className="text-sm font-medium text-gray-700">By Type</Text>
          {Object.entries(stats.byType).map(([type, count]) => (
            <View key={type} className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <View 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getActivityColor(type as ActivityLogEntry['type']) }}
                />
                <Text className="text-sm text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </Text>
              </View>
              <Text className="text-sm font-medium text-gray-900">{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}