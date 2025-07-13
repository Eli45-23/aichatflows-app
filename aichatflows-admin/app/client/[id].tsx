import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Client, Payment, Goal, BusinessVisit } from '../../src/types';
import { useClients } from '../../src/hooks/useClients';
import { usePayments } from '../../src/hooks/usePayments';
import { useGoals } from '../../src/hooks/useGoals';
import { useBusinessVisits } from '../../src/hooks/useBusinessVisits';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-800',
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const { clients } = useClients();
  const { payments } = usePayments();
  const { goals } = useGoals();
  const { visits } = useBusinessVisits();

  useEffect(() => {
    if (id && clients.length > 0) {
      const foundClient = clients.find(c => c.id === id);
      setClient(foundClient || null);
      setLoading(false);
    }
  }, [id, clients]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter data for this client
  const clientPayments = payments.filter(p => p.client_id === id);
  const clientGoals = goals; // All goals are now global
  const clientVisits = visits.filter(v => v.client_id === id);

  // Calculate stats
  const totalRevenue = clientPayments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = clientPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-gray-600 mt-4">Loading client details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="px-6 py-4">
          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#00D4AA" />
            <Text className="text-primary text-lg ml-2">Back</Text>
          </TouchableOpacity>
          <View className="flex-1 justify-center items-center">
            <Ionicons name="person-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">Client not found</Text>
          </View>
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
          <Text className="text-primary text-lg ml-2">Back to Clients</Text>
        </TouchableOpacity>

        {/* Client Info Card */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-2">{client.name}</Text>
              <Text className="text-gray-600 mb-1">{client.email}</Text>
              {client.phone && (
                <Text className="text-gray-600 mb-3">{client.phone}</Text>
              )}
              <View className={`self-start px-3 py-1 rounded-full ${(statusColors as any)[client.status || 'unknown'] || 'bg-gray-100 text-gray-800'}`}>
                <Text className="text-sm font-medium capitalize">
                  {client.status ? client.status.replace('_', ' ') : 'Unknown'}
                </Text>
              </View>
            </View>
            <View className="bg-blue-100 p-3 rounded-full">
              <Ionicons name="person" size={24} color="#00D4AA" />
            </View>
          </View>
          <Text className="text-gray-500 text-sm">
            Client since {formatDate(client.created_at)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row space-x-4 mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
            <Text className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</Text>
            <Text className="text-gray-600 text-sm">Total Revenue</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
            <Text className="text-2xl font-bold text-orange-600">{formatCurrency(pendingRevenue)}</Text>
            <Text className="text-gray-600 text-sm">Pending</Text>
          </View>
        </View>

        <View className="flex-row space-x-4 mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
            <Text className="text-2xl font-bold text-blue-600">{clientGoals.length}</Text>
            <Text className="text-gray-600 text-sm">Goals</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
            <Text className="text-2xl font-bold text-purple-600">{clientVisits.length}</Text>
            <Text className="text-gray-600 text-sm">Visits</Text>
          </View>
        </View>

        {/* Recent Payments */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</Text>
          {clientPayments.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No payments yet</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {clientPayments.slice(0, 3).map((payment) => (
                <View key={payment.id} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{formatCurrency(payment.amount)}</Text>
                    <Text className="text-gray-500 text-sm">{formatDate(payment.payment_date)}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    payment.status === 'confirmed' ? 'bg-green-100' :
                    payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Text className={`text-xs font-medium capitalize ${
                      payment.status === 'confirmed' ? 'text-green-800' :
                      payment.status === 'pending' ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
              ))}
              {clientPayments.length > 3 && (
                <Text className="text-primary text-sm text-center pt-2">
                  +{clientPayments.length - 3} more payments
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Goals */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Goals</Text>
          {clientGoals.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No goals set</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {clientGoals.map((goal) => (
                <View key={goal.id} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{goal.title}</Text>
                    <Text className="text-gray-500 text-sm">Target: {goal.target}</Text>
                  </View>
                  <Ionicons name="flag" size={16} color="#00D4AA" />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Visits */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Visits</Text>
          {clientVisits.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No visits recorded</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {clientVisits.slice(0, 3).map((visit) => (
                <View key={visit.id} className="flex-row items-start py-2 border-b border-gray-100">
                  <Ionicons name="location" size={16} color="#34C759" style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-gray-900">Business Visit</Text>
                    <Text className="text-gray-500 text-sm" numberOfLines={2}>
                      {visit.location}
                    </Text>
                  </View>
                </View>
              ))}
              {clientVisits.length > 3 && (
                <Text className="text-primary text-sm text-center pt-2">
                  +{clientVisits.length - 3} more visits
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}