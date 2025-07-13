import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeeklyMetrics, MonthlyMetrics, formatMetricsSummary } from '../utils/metrics';
import { Card } from './Card';

interface MetricsSummaryProps {
  currentWeek: WeeklyMetrics | null;
  currentMonth: MonthlyMetrics | null;
  previousWeek: WeeklyMetrics | null;
  previousMonth: MonthlyMetrics | null;
  loading: boolean;
}

export function MetricsSummary({ 
  currentWeek, 
  currentMonth, 
  previousWeek, 
  previousMonth,
  loading 
}: MetricsSummaryProps) {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');

  // Safe date formatting function to prevent crashes
  const formatDateSafely = (date: any): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'N/A';
    }
    try {
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const handleShare = async (metrics: WeeklyMetrics | MonthlyMetrics) => {
    try {
      const summary = formatMetricsSummary(metrics);
      await Share.share({
        message: summary,
        title: `AIChatFlows ${activeTab === 'week' ? 'Weekly' : 'Monthly'} Summary`,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share summary');
    }
  };

  const calculateChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const renderChangeIndicator = (current: number, previous: number) => {
    const { value, isPositive } = calculateChange(current, previous);
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? 'trending-up' : 'trending-down';
    
    return (
      <View className="flex-row items-center">
        <Ionicons name={icon} size={12} color={isPositive ? '#16A34A' : '#DC2626'} />
        <Text className={`text-xs ml-1 ${color}`}>
          {(value || 0).toFixed(0)}%
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <Card>
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">📊 Performance Summary</Text>
            <View className="bg-primary/10 p-2 rounded-lg">
              <Ionicons name="analytics" size={16} color="#00D4AA" />
            </View>
          </View>
          <View className="items-center py-6">
            <View className="bg-primary/10 p-4 rounded-full mb-3">
              <Ionicons name="bar-chart" size={32} color="#00D4AA" />
            </View>
            <Text className="text-gray-600 text-center mb-1">Loading performance data...</Text>
            <Text className="text-gray-400 text-sm text-center">
              Analyzing your latest metrics
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  const currentMetrics = activeTab === 'week' ? currentWeek : currentMonth;
  const previousMetrics = activeTab === 'week' ? previousWeek : previousMonth;

  if (!currentMetrics) {
    return (
      <Card>
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">📊 Performance Summary</Text>
            <View className="bg-gray-100 p-2 rounded-lg">
              <Ionicons name="analytics-outline" size={16} color="#9CA3AF" />
            </View>
          </View>
          <View className="items-center py-6">
            <View className="bg-gray-50 p-4 rounded-full mb-4">
              <Ionicons name="trending-up" size={32} color="#D1D5DB" />
            </View>
            <Text className="text-gray-600 text-center mb-2 font-medium">
              No performance summary available yet
            </Text>
            <Text className="text-gray-400 text-sm text-center px-4">
              Your data will appear here once activity begins
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View className="p-4">
        {/* Header with tabs */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">📊 Performance Summary</Text>
          <TouchableOpacity 
            onPress={() => handleShare(currentMetrics)}
            className="p-2 bg-primary/10 rounded-lg"
          >
            <Ionicons name="share-outline" size={16} color="#00D4AA" />
          </TouchableOpacity>
        </View>

        {/* Tab buttons */}
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            className={`flex-1 py-2 px-3 rounded-md ${
              activeTab === 'week' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('week')}
          >
            <Text className={`text-center text-sm font-medium ${
              activeTab === 'week' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 px-3 rounded-md ${
              activeTab === 'month' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('month')}
          >
            <Text className={`text-center text-sm font-medium ${
              activeTab === 'month' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metrics grid */}
        <View className="space-y-4">
          {/* New Clients */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-600">👥 New Clients</Text>
              <Text className="text-2xl font-bold text-gray-900">{currentMetrics.newClients || 0}</Text>
              {currentMetrics.clientNames && currentMetrics.clientNames.length > 0 && (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {currentMetrics.clientNames.slice(0, 2).join(', ')}
                  {currentMetrics.clientNames.length > 2 && ` +${currentMetrics.clientNames.length - 2} more`}
                </Text>
              )}
            </View>
            {previousMetrics && (
              <View className="items-end">
                {renderChangeIndicator(currentMetrics.newClients, previousMetrics.newClients)}
              </View>
            )}
          </View>

          {/* Business Visits */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-600">📍 Business Visits</Text>
              <Text className="text-2xl font-bold text-gray-900">{currentMetrics.businessVisits || 0}</Text>
              {currentMetrics.visitLocations && currentMetrics.visitLocations.length > 0 && (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {currentMetrics.visitLocations.slice(0, 2).join(', ')}
                  {currentMetrics.visitLocations.length > 2 && ` +${currentMetrics.visitLocations.length - 2} more`}
                </Text>
              )}
            </View>
            {previousMetrics && (
              <View className="items-end">
                {renderChangeIndicator(currentMetrics.businessVisits, previousMetrics.businessVisits)}
              </View>
            )}
          </View>

          {/* Revenue */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-600">💰 Revenue</Text>
              <Text className="text-2xl font-bold text-primary">
                ${(currentMetrics.totalRevenue || 0).toLocaleString()}
              </Text>
              {(currentMetrics.paymentsReceived || 0) > 0 && (
                <Text className="text-xs text-gray-500 mt-1">
                  {currentMetrics.paymentsReceived} payment{currentMetrics.paymentsReceived !== 1 ? 's' : ''} • 
                  Avg: ${(currentMetrics.averagePayment || 0).toFixed(0)}
                </Text>
              )}
            </View>
            {previousMetrics && (
              <View className="items-end">
                {renderChangeIndicator(currentMetrics.totalRevenue, previousMetrics.totalRevenue)}
              </View>
            )}
          </View>

          {/* Goals Completed */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-600">🎯 Goals Completed</Text>
              <Text className="text-2xl font-bold text-gray-900">{currentMetrics.goalsCompleted || 0}</Text>
              {currentMetrics.goalTitles && currentMetrics.goalTitles.length > 0 && (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {currentMetrics.goalTitles.slice(0, 2).join(', ')}
                  {currentMetrics.goalTitles.length > 2 && ` +${currentMetrics.goalTitles.length - 2} more`}
                </Text>
              )}
            </View>
            {previousMetrics && (
              <View className="items-end">
                {renderChangeIndicator(currentMetrics.goalsCompleted, previousMetrics.goalsCompleted)}
              </View>
            )}
          </View>
        </View>

        {/* Period display */}
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="text-xs text-gray-500 text-center">
            {activeTab === 'week' 
              ? `${formatDateSafely((currentMetrics as any)?.weekStart)} - ${formatDateSafely((currentMetrics as any)?.weekEnd)}`
              : `${formatDateSafely((currentMetrics as any)?.monthStart)} - ${formatDateSafely((currentMetrics as any)?.monthEnd)}`
            }
          </Text>
        </View>
      </View>
    </Card>
  );
}

// Simplified summary card for quick overview
export function QuickSummaryCard({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon, 
  color = 'primary' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: { value: number; isPositive: boolean };
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <Card>
      <View className="p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">{title}</Text>
          <Text className={`text-2xl font-bold ${colorClasses[color]}`}>
            {typeof value === 'number' ? (value || 0).toLocaleString() : value}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
          )}
        </View>
        <View className="items-center">
          <Text className="text-2xl mb-1">{icon}</Text>
          {change && (
            <View className="flex-row items-center">
              <Ionicons 
                name={change.isPositive ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={change.isPositive ? '#16A34A' : '#DC2626'} 
              />
              <Text className={`text-xs ml-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {(change.value || 0).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      </View>
    </Card>
  );
}