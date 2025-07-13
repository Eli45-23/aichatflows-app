import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useGoals } from '../../src/hooks/useGoals';
import { useClients } from '../../src/hooks/useClients';
import { usePayments } from '../../src/hooks/usePayments';

export default function GoalsAnalyticsScreen() {
  const { goals, loading: goalsLoading } = useGoals();
  const { clients } = useClients();
  const { payments } = usePayments();
  const [selectedFrequency, setSelectedFrequency] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const loading = goalsLoading;

  const calculateGoalProgress = (goal: any) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    // Calculate period based on goal frequency
    switch (goal.frequency) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (goal.metric === 'revenue') {
      // Calculate revenue progress
      const relevantPayments = payments.filter(payment => 
        payment.status === 'confirmed' &&
        new Date(payment.payment_date) >= startDate &&
        new Date(payment.payment_date) <= endDate
      );
      const totalRevenue = relevantPayments.reduce((sum, payment) => sum + payment.amount, 0);
      return {
        current: totalRevenue,
        percentage: goal.target > 0 ? Math.min((totalRevenue / goal.target) * 100, 100) : 0,
        isComplete: totalRevenue >= goal.target,
      };
    } else {
      // Calculate client acquisition progress
      const newClients = clients.filter(client => 
        new Date(client.created_at) >= startDate &&
        new Date(client.created_at) <= endDate
      );
      return {
        current: newClients.length,
        percentage: goal.target > 0 ? Math.min((newClients.length / goal.target) * 100, 100) : 0,
        isComplete: newClients.length >= goal.target,
      };
    }
  };

  const getFilteredGoals = () => {
    if (selectedFrequency === 'all') return goals;
    return goals.filter(goal => goal.frequency === selectedFrequency);
  };

  const getGoalStats = () => {
    const filteredGoals = getFilteredGoals();
    const completed = filteredGoals.filter(goal => {
      const progress = calculateGoalProgress(goal);
      return progress.isComplete;
    });
    
    const inProgress = filteredGoals.filter(goal => {
      const progress = calculateGoalProgress(goal);
      return !progress.isComplete && progress.current > 0;
    });

    const notStarted = filteredGoals.filter(goal => {
      const progress = calculateGoalProgress(goal);
      return progress.current === 0;
    });

    return {
      total: filteredGoals.length,
      completed: completed.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      completionRate: filteredGoals.length > 0 ? (completed.length / filteredGoals.length) * 100 : 0,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredGoals = getFilteredGoals();
  const goalStats = getGoalStats();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-gray-600 mt-4">Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-6 py-4">
        {/* Header with Back Button */}
        <TouchableOpacity
          className="flex-row items-center mb-6"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#00D4AA" />
          <Text className="text-primary text-lg ml-2">Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Page Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Goals Analytics</Text>
          <Text className="text-gray-600">Track your progress and achievements</Text>
        </View>

        {/* Frequency Filter */}
        <View className="flex-row mb-6 space-x-2">
          {(['all', 'daily', 'weekly', 'monthly'] as const).map((frequency) => (
            <TouchableOpacity
              key={frequency}
              className={`px-4 py-2 rounded-full ${
                selectedFrequency === frequency ? 'bg-primary' : 'bg-white border border-gray-300'
              }`}
              onPress={() => setSelectedFrequency(frequency)}
            >
              <Text className={`text-sm font-medium ${
                selectedFrequency === frequency ? 'text-white' : 'text-gray-700'
              }`}>
                {frequency === 'all' ? 'All Goals' : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals Overview */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Goals Overview</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Goals</Text>
              <Text className="font-semibold text-gray-900">{goalStats.total}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Completed</Text>
              <Text className="font-semibold text-green-600">{goalStats.completed}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">In Progress</Text>
              <Text className="font-semibold text-yellow-600">{goalStats.inProgress}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Not Started</Text>
              <Text className="font-semibold text-gray-500">{goalStats.notStarted}</Text>
            </View>
            <View className="border-t border-gray-200 pt-3 mt-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Completion Rate</Text>
                <Text className="font-semibold text-blue-600">
                  {Math.round(goalStats.completionRate)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Chart Placeholder */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</Text>
          <View className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <Ionicons name="bar-chart" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Progress Chart</Text>
            <Text className="text-gray-400 text-sm">Coming Soon</Text>
          </View>
        </View>

        {/* Goal Status Breakdown */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Goal Status</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-green-500 rounded-full mr-3"></View>
                <Text className="text-gray-600">Completed</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{goalStats.completed}</Text>
                <Text className="text-xs text-gray-500">
                  ({goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0}%)
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></View>
                <Text className="text-gray-600">In Progress</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{goalStats.inProgress}</Text>
                <Text className="text-xs text-gray-500">
                  ({goalStats.total > 0 ? Math.round((goalStats.inProgress / goalStats.total) * 100) : 0}%)
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-gray-400 rounded-full mr-3"></View>
                <Text className="text-gray-600">Not Started</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{goalStats.notStarted}</Text>
                <Text className="text-xs text-gray-500">
                  ({goalStats.total > 0 ? Math.round((goalStats.notStarted / goalStats.total) * 100) : 0}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Goals */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Current Goals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
              <Text className="text-primary text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {filteredGoals.slice(0, 5).map((goal) => {
            const progress = calculateGoalProgress(goal);
            return (
              <View
                key={goal.id}
                className="py-4 border-b border-gray-100 last:border-b-0"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{goal.title}</Text>
                    <Text className="text-gray-500 text-sm">
                      {goal.frequency} • client goal
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-semibold text-gray-900">
                      {progress.current} / {goal.target} clients
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {Math.round(progress.percentage)}% complete
                    </Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View className="bg-gray-200 rounded-full h-2 mt-2">
                  <View 
                    className={`h-2 rounded-full ${getProgressColor(progress.percentage)}`}
                    style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                  />
                </View>
                
                {progress.isComplete && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    <Text className="text-green-600 text-sm ml-1">Goal completed!</Text>
                  </View>
                )}
              </View>
            );
          })}
          {filteredGoals.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No goals found</Text>
              <Text className="text-gray-400 text-sm">Create your first goal to get started</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/(tabs)/goals')}
          >
            <Ionicons name="trophy" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Manage Goals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/analytics/clients')}
          >
            <Ionicons name="analytics" size={20} color="#00D4AA" />
            <Text className="text-primary font-semibold ml-2">Client Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}