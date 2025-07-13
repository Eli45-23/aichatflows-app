import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Payment } from '../../src/types';
import { usePayments } from '../../src/hooks/usePayments';
import { useClients } from '../../src/hooks/useClients';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle',
  failed: 'close-circle',
};

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { payments, updatePayment, deletePayment } = usePayments();
  const { clients } = useClients();

  useEffect(() => {
    if (id) {
      const foundPayment = payments.find(p => p.id === id);
      if (foundPayment) {
        setPayment(foundPayment);
        setLoading(false);
      } else {
        setError('Payment not found');
        setLoading(false);
      }
    }
  }, [id, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async (newStatus: 'pending' | 'confirmed' | 'failed') => {
    if (!payment) return;

    try {
      await updatePayment(payment.id, { status: newStatus });
      setPayment({ ...payment, status: newStatus });
      Alert.alert('Success', `Payment status updated to ${newStatus}`);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDelete = async () => {
    if (!payment) return;

    Alert.alert(
      'Delete Payment',
      `Are you sure you want to delete this payment of ${formatCurrency(payment.amount)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(payment.id);
              Alert.alert('Success', 'Payment deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              // Error already handled in hook
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-gray-600 mt-4">Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text className="text-gray-900 text-lg font-semibold mt-4">Payment Not Found</Text>
          <Text className="text-gray-600 text-center mt-2">{error || 'The requested payment could not be found.'}</Text>
          <TouchableOpacity
            className="bg-primary rounded-lg px-6 py-3 mt-4"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const client = clients.find(c => c.id === payment.client_id);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-6 py-4">
        {/* Header with Back Button */}
        <TouchableOpacity
          className="flex-row items-center mb-6"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#00D4AA" />
          <Text className="text-primary text-lg ml-2">Back to Payments</Text>
        </TouchableOpacity>

        {/* Payment Amount Card */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="items-center">
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              {formatCurrency(payment.amount)}
            </Text>
            <View className={`px-4 py-2 rounded-full border ${(statusColors as any)[payment.status]}`}>
              <View className="flex-row items-center">
                <Ionicons 
                  name={(statusIcons as any)[payment.status]} 
                  size={16} 
                  color={payment.status === 'pending' ? '#D97706' : payment.status === 'confirmed' ? '#059669' : '#DC2626'} 
                />
                <Text className="ml-2 font-semibold capitalize">
                  {payment.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Details</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Payment ID</Text>
              <Text className="font-medium text-gray-900">{payment.id.slice(0, 8)}...</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Payment Date</Text>
              <Text className="font-medium text-gray-900">{formatDate(payment.payment_date)}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Created</Text>
              <Text className="font-medium text-gray-900">{formatDateTime(payment.created_at || payment.payment_date)}</Text>
            </View>
            
            {payment.updated_at && payment.updated_at !== payment.created_at && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Last Updated</Text>
                <Text className="font-medium text-gray-900">{formatDateTime(payment.updated_at)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client Information */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Client Information</Text>
          
          {client ? (
            <TouchableOpacity 
              className="border border-gray-200 rounded-lg p-4"
              onPress={() => router.push(`/client/${client.id}`)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{client.name}</Text>
                  <Text className="text-gray-600 text-sm">{client.email}</Text>
                  {client.phone && (
                    <Text className="text-gray-500 text-sm">{client.phone}</Text>
                  )}
                  <View className="flex-row items-center mt-2">
                    <View className={`px-2 py-1 rounded-full ${client.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Text className={`text-xs font-medium ${client.status === 'active' ? 'text-green-800' : 'text-gray-800'}`}>
                        {client.status || 'Unknown'}
                      </Text>
                    </View>
                    <View className="bg-blue-100 px-2 py-1 rounded-full ml-2">
                      <Text className="text-blue-800 text-xs font-medium">{client.plan}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ) : (
            <View className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <Text className="text-gray-500 ml-2">No client associated</Text>
              </View>
              <Text className="text-gray-400 text-sm mt-1">This is a direct payment</Text>
            </View>
          )}
        </View>

        {/* Payment Description */}
        {payment.description && (
          <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Description</Text>
            <Text className="text-gray-700 leading-6">{payment.description}</Text>
          </View>
        )}

        {/* Status Update Actions */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Update Status</Text>
          
          <View className="flex-row space-x-3">
            {(['pending', 'confirmed', 'failed'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                className={`flex-1 py-3 px-4 rounded-lg border ${
                  payment.status === status
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => handleStatusUpdate(status)}
                disabled={payment.status === status}
              >
                <Text className={`text-center font-medium ${
                  payment.status === status ? 'text-white' : 'text-gray-700'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 flex-row items-center justify-center"
            onPress={() => router.push(`/(tabs)/payments`)}
          >
            <Ionicons name="list" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View All Payments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-red-600 rounded-lg py-4 flex-row items-center justify-center"
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Delete Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}