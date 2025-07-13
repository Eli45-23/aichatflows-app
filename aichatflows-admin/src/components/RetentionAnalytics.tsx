import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientRetentionMetrics } from '../utils/metrics';
import { Card } from './Card';

interface RetentionAnalyticsProps {
  retention: ClientRetentionMetrics | null;
  loading?: boolean;
  onClientPress?: (clientName: string) => void;
}

export function RetentionAnalytics({ retention, loading = false, onClientPress }: RetentionAnalyticsProps) {
  if (loading) {
    return (
      <Card>
        <View className="p-4 mb-6">
          <View className="bg-gray-200 rounded h-6 w-40 mb-4" />
          <View className="space-y-3">
            <View className="bg-gray-200 rounded h-4" />
            <View className="bg-gray-200 rounded h-4 w-3/4" />
            <View className="bg-gray-200 rounded h-4 w-1/2" />
          </View>
        </View>
      </Card>
    );
  }

  if (!retention) {
    return (
      <Card>
        <View className="p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">🔄 Client Retention</Text>
          <Text className="text-gray-500">No retention data available</Text>
        </View>
      </Card>
    );
  }

  const getRetentionColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    if (rate >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRetentionBadgeColor = (rate: number): string => {
    if (rate >= 70) return 'bg-green-100 text-green-700';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-700';
    if (rate >= 30) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getRetentionMessage = (rate: number): string => {
    if (rate >= 70) return 'Excellent retention! Clients love coming back.';
    if (rate >= 50) return 'Good retention rate. Room for improvement.';
    if (rate >= 30) return 'Fair retention. Consider follow-up strategies.';
    return 'Low retention. Focus on client relationships.';
  };

  const renderTopClient = ({ item, index }: { item: typeof retention.topReturningClients[0]; index: number }) => (
    <TouchableOpacity
      key={index}
      className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-2"
      onPress={() => onClientPress?.(item.clientName)}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
        }`}>
          <Text className="text-sm font-bold">
            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-medium text-gray-900" numberOfLines={1}>
            {item.clientName}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.visitCount} visit{item.visitCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <Card>
      <View className="p-4 mb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">🔄 Client Retention</Text>
          <View className={`px-3 py-1 rounded-full ${getRetentionBadgeColor(retention.retentionRate)}`}>
            <Text className="text-xs font-medium">
              {retention.retentionRate.toFixed(0)}% retained
            </Text>
          </View>
        </View>

        {/* Main metrics */}
        <View className="space-y-4 mb-6">
          {/* Retention rate */}
          <View className="bg-gray-50 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-600">Retention Rate</Text>
              <Ionicons name="people" size={16} color="#00D4AA" />
            </View>
            <Text className={`text-2xl font-bold ${getRetentionColor(retention.retentionRate)}`}>
              {retention.retentionRate.toFixed(1)}%
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {retention.clientsWithMultipleVisits} of {retention.totalClients} clients returned
            </Text>
            <Text className="text-xs text-gray-600 mt-2">
              {getRetentionMessage(retention.retentionRate)}
            </Text>
          </View>

          {/* Average days between visits */}
          <View className="flex-row space-x-4">
            <View className="flex-1 bg-blue-50 rounded-lg p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-600">Avg. Days Between</Text>
                <Ionicons name="calendar" size={16} color="#3B82F6" />
              </View>
              <Text className="text-xl font-bold text-blue-600">
                {retention.averageDaysBetweenVisits.toFixed(0)}
              </Text>
              <Text className="text-xs text-gray-500">days</Text>
            </View>

            <View className="flex-1 bg-green-50 rounded-lg p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-600">Return Clients</Text>
                <Ionicons name="repeat" size={16} color="#10B981" />
              </View>
              <Text className="text-xl font-bold text-green-600">
                {retention.clientsWithMultipleVisits}
              </Text>
              <Text className="text-xs text-gray-500">clients</Text>
            </View>
          </View>
        </View>

        {/* Top returning clients */}
        {retention.topReturningClients.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-3">
              🏆 Top Returning Clients
            </Text>
            <View>
              {retention.topReturningClients.slice(0, 3).map((client, index) => 
                renderTopClient({ item: client, index })
              )}
            </View>
          </View>
        )}

        {/* Insights */}
        <View className="mt-6 pt-4 border-t border-gray-100">
          <View className="bg-blue-50 rounded-lg p-3">
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={16} color="#3B82F6" className="mt-0.5 mr-2" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-900 mb-1">
                  Retention Insight
                </Text>
                <Text className="text-xs text-blue-700">
                  {retention.retentionRate < 30 
                    ? "Consider implementing a follow-up system. Regular check-ins can significantly improve retention rates."
                    : retention.retentionRate < 50
                    ? "Good foundation! Try scheduling regular maintenance visits or offering loyalty incentives."
                    : retention.retentionRate < 70
                    ? "Great work! Small improvements in communication can push you to excellent retention."
                    : "Outstanding retention! Your clients clearly value your services. Consider case studies for marketing."
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

// Compact retention indicator for dashboard
export function CompactRetentionIndicator({ retention }: { retention: ClientRetentionMetrics | null }) {
  if (!retention) return null;

  const getRetentionColor = (rate: number): string => {
    if (rate >= 70) return 'bg-green-100 text-green-700';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-700';
    if (rate >= 30) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <View className={`flex-row items-center px-3 py-1 rounded-full ${getRetentionColor(retention.retentionRate)}`}>
      <Ionicons name="repeat" size={12} color="currentColor" />
      <Text className="text-xs font-medium ml-1">
        {retention.retentionRate.toFixed(0)}% retention
      </Text>
    </View>
  );
}