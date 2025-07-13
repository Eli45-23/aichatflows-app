import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClients } from '../../src/hooks/useClients';
import { useDashboardStats } from '../../src/hooks/useDashboardStats';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-800',
};

export default function ClientAnalyticsScreen() {
  const { clients, loading: clientsLoading } = useClients();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const loading = clientsLoading || statsLoading;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredClients = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return clients.filter(client => new Date(client.created_at) >= startDate);
  };

  const getClientsByPlan = () => {
    const starter = clients.filter(c => c.plan === 'starter').length;
    const pro = clients.filter(c => c.plan === 'pro').length;
    return { starter, pro };
  };

  const getClientsByPlatform = () => {
    const instagram = clients.filter(c => c.platform_preference === 'instagram').length;
    const facebook = clients.filter(c => c.platform_preference === 'facebook').length;
    const tiktok = clients.filter(c => c.platform_preference === 'tiktok').length;
    return { instagram, facebook, tiktok };
  };

  const filteredClients = getFilteredClients();
  const planBreakdown = getClientsByPlan();
  const platformBreakdown = getClientsByPlatform();

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
          <Text className="text-2xl font-bold text-gray-900">Client Analytics</Text>
          <Text className="text-gray-600">Detailed insights into your client base</Text>
        </View>

        {/* Period Filter */}
        <View className="flex-row mb-6 space-x-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              className={`px-4 py-2 rounded-full ${
                selectedPeriod === period ? 'bg-primary' : 'bg-white border border-gray-300'
              }`}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text className={`text-sm font-medium ${
                selectedPeriod === period ? 'text-white' : 'text-gray-700'
              }`}>
                This {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Client Overview</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Clients</Text>
              <Text className="font-semibold text-gray-900">{clients.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">New This {selectedPeriod}</Text>
              <Text className="font-semibold text-green-600">+{filteredClients.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Active Clients</Text>
              <Text className="font-semibold text-green-600">{stats.clientsByStatus.active}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Conversion Rate</Text>
              <Text className="font-semibold text-blue-600">
                {clients.length > 0 ? Math.round((stats.clientsByStatus.active / clients.length) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Status Breakdown */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Client Status Breakdown</Text>
          <View className="space-y-3">
            {Object.entries(stats.clientsByStatus).map(([status, count]) => (
              <View key={status} className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`px-2 py-1 rounded-full mr-3 ${(statusColors as any)[status] || 'bg-gray-100 text-gray-800'}`}>
                    <Text className="text-xs font-medium capitalize">
                      {status.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text className="text-gray-600 capitalize">{status.replace('_', ' ')}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900 mr-2">{count}</Text>
                  <Text className="text-xs text-gray-500">
                    ({clients.length > 0 ? Math.round((count / clients.length) * 100) : 0}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Plan Breakdown */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-blue-500 rounded mr-3"></View>
                <Text className="text-gray-600">Starter Plan</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{planBreakdown.starter}</Text>
                <Text className="text-xs text-gray-500">
                  ({clients.length > 0 ? Math.round((planBreakdown.starter / clients.length) * 100) : 0}%)
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-purple-500 rounded mr-3"></View>
                <Text className="text-gray-600">Pro Plan</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{planBreakdown.pro}</Text>
                <Text className="text-xs text-gray-500">
                  ({clients.length > 0 ? Math.round((planBreakdown.pro / clients.length) * 100) : 0}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Platform Preferences */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Platform Preferences</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-pink-500 rounded mr-3"></View>
                <Text className="text-gray-600">Instagram</Text>
              </View>
              <Text className="font-semibold text-gray-900">{platformBreakdown.instagram}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-blue-600 rounded mr-3"></View>
                <Text className="text-gray-600">Facebook</Text>
              </View>
              <Text className="font-semibold text-gray-900">{platformBreakdown.facebook}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-4 h-4 bg-black rounded mr-3"></View>
                <Text className="text-gray-600">TikTok</Text>
              </View>
              <Text className="font-semibold text-gray-900">{platformBreakdown.tiktok}</Text>
            </View>
          </View>
        </View>

        {/* Recent Clients */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Recent Clients</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
              <Text className="text-primary text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {filteredClients.slice(0, 5).map((client) => (
            <TouchableOpacity
              key={client.id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              onPress={() => router.push(`/client/${client.id}`)}
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{client.name}</Text>
                <Text className="text-gray-500 text-sm">{client.email}</Text>
              </View>
              <View className="items-end">
                <View className={`px-2 py-1 rounded-full ${(statusColors as any)[client.status || 'unknown']}`}>
                  <Text className="text-xs font-medium capitalize">
                    {client.status ? client.status.replace('_', ' ') : 'Unknown'}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400 mt-1">
                  {formatDate(client.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {filteredClients.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No new clients this {selectedPeriod}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/(tabs)/clients')}
          >
            <Ionicons name="people" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View All Clients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/analytics/revenue')}
          >
            <Ionicons name="analytics" size={20} color="#00D4AA" />
            <Text className="text-primary font-semibold ml-2">Revenue Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}