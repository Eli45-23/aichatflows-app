import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePayments } from '../../src/hooks/usePayments';
import { useDashboardStats } from '../../src/hooks/useDashboardStats';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function RevenueAnalyticsScreen() {
  const { period } = useLocalSearchParams<{ period?: string }>();
  const { payments, loading: paymentsLoading } = usePayments();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>(
    (period as any) || 'month'
  );

  const loading = paymentsLoading || statsLoading;

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

  const getFilteredPayments = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
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

    return payments.filter(payment => new Date(payment.payment_date) >= startDate);
  };

  const getRevenueStats = () => {
    const filteredPayments = getFilteredPayments();
    const confirmed = filteredPayments.filter(p => p.status === 'confirmed');
    const pending = filteredPayments.filter(p => p.status === 'pending');
    const failed = filteredPayments.filter(p => p.status === 'failed');

    return {
      total: confirmed.reduce((sum, p) => sum + p.amount, 0),
      pending: pending.reduce((sum, p) => sum + p.amount, 0),
      failed: failed.reduce((sum, p) => sum + p.amount, 0),
      count: {
        confirmed: confirmed.length,
        pending: pending.length,
        failed: failed.length,
      },
      average: confirmed.length > 0 ? confirmed.reduce((sum, p) => sum + p.amount, 0) / confirmed.length : 0,
    };
  };

  const getTopClients = () => {
    const filteredPayments = getFilteredPayments().filter(p => p.status === 'confirmed');
    const clientRevenue: Record<string, { client: any; total: number; count: number }> = {};

    filteredPayments.forEach(payment => {
      if (payment.client) {
        const clientId = payment.client.id;
        if (!clientRevenue[clientId]) {
          clientRevenue[clientId] = {
            client: payment.client,
            total: 0,
            count: 0,
          };
        }
        clientRevenue[clientId].total += payment.amount;
        clientRevenue[clientId].count += 1;
      }
    });

    return Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const filteredPayments = getFilteredPayments();
  const revenueStats = getRevenueStats();
  const topClients = getTopClients();

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
          <Text className="text-2xl font-bold text-gray-900">Revenue Analytics</Text>
          <Text className="text-gray-600">Track your earnings and payment trends</Text>
        </View>

        {/* Period Filter */}
        <View className="flex-row mb-6 space-x-2">
          {(['today', 'week', 'month', 'year'] as const).map((periodOption) => (
            <TouchableOpacity
              key={periodOption}
              className={`px-4 py-2 rounded-full ${
                selectedPeriod === periodOption ? 'bg-primary' : 'bg-white border border-gray-300'
              }`}
              onPress={() => setSelectedPeriod(periodOption)}
            >
              <Text className={`text-sm font-medium ${
                selectedPeriod === periodOption ? 'text-white' : 'text-gray-700'
              }`}>
                {periodOption === 'today' ? 'Today' : `This ${periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue Overview */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</Text>
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Total Revenue</Text>
              <Text className="text-2xl font-bold text-green-600">
                {formatCurrency(revenueStats.total)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Confirmed Payments</Text>
              <Text className="font-semibold text-gray-900">{revenueStats.count.confirmed}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Average Payment</Text>
              <Text className="font-semibold text-gray-900">
                {formatCurrency(revenueStats.average)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Pending Revenue</Text>
              <Text className="font-semibold text-yellow-600">
                {formatCurrency(revenueStats.pending)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status Breakdown */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Status</Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-green-100 px-2 py-1 rounded-full mr-3">
                  <Text className="text-green-800 text-xs font-medium">Confirmed</Text>
                </View>
                <Text className="text-gray-600">Confirmed</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{revenueStats.count.confirmed}</Text>
                <Text className="text-green-600 font-semibold">
                  {formatCurrency(revenueStats.total)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-yellow-100 px-2 py-1 rounded-full mr-3">
                  <Text className="text-yellow-800 text-xs font-medium">Pending</Text>
                </View>
                <Text className="text-gray-600">Pending</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{revenueStats.count.pending}</Text>
                <Text className="text-yellow-600 font-semibold">
                  {formatCurrency(revenueStats.pending)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-red-100 px-2 py-1 rounded-full mr-3">
                  <Text className="text-red-800 text-xs font-medium">Failed</Text>
                </View>
                <Text className="text-gray-600">Failed</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900 mr-2">{revenueStats.count.failed}</Text>
                <Text className="text-red-600 font-semibold">
                  {formatCurrency(revenueStats.failed)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Clients */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Top Clients</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
              <Text className="text-primary text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {topClients.map((clientData, index) => (
            <TouchableOpacity
              key={clientData.client.id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              onPress={() => router.push(`/client/${clientData.client.id}`)}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-blue-600 font-semibold text-sm">#{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{clientData.client.name}</Text>
                  <Text className="text-gray-500 text-sm">
                    {clientData.count} payment{clientData.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text className="font-semibold text-green-600">
                {formatCurrency(clientData.total)}
              </Text>
            </TouchableOpacity>
          ))}
          {topClients.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="trending-up-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No revenue this {selectedPeriod}</Text>
            </View>
          )}
        </View>

        {/* Recent Payments */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Recent Payments</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/payments')}>
              <Text className="text-primary text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {filteredPayments.slice(0, 5).map((payment) => (
            <TouchableOpacity
              key={payment.id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              onPress={() => router.push(`/payment/${payment.id}`)}
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {payment.client?.name || 'Unknown Client'}
                </Text>
              </View>
              <View className="items-end">
                <View className={`px-2 py-1 rounded-full ${(statusColors as any)[payment.status]}`}>
                  <Text className="text-xs font-medium capitalize">
                    {payment.status}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400 mt-1">
                  {formatDate(payment.payment_date)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {filteredPayments.length === 0 && (
            <View className="py-8 items-center">
              <Ionicons name="cash-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No payments this {selectedPeriod}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/(tabs)/payments')}
          >
            <Ionicons name="cash" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View All Payments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push('/analytics/goals')}
          >
            <Ionicons name="analytics" size={20} color="#00D4AA" />
            <Text className="text-primary font-semibold ml-2">Goals Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}