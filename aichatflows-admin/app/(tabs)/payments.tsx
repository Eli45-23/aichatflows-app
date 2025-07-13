import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Payment, PaymentFormData } from '../../src/types';
import { usePayments } from '../../src/hooks/usePayments';
import { useClients } from '../../src/hooks/useClients';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { SimpleFormModal } from '../../src/components/SimpleFormModal';
import { 
  SearchInput,
  FilterBar,
  SortDropdown
} from '../../src/components';
import { PAYMENT_FILTER_GROUPS } from '../../src/components/FilterBar';
import { PAYMENT_SORT_OPTIONS } from '../../src/components/SortDropdown';
import { fuzzySearchItems, PAYMENT_SEARCH_FIELDS, useDebounceSearch, sortItems } from '../../src/utils/search';
import { validatePayment } from '../../src/utils/validation';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function PaymentsScreen() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Payment | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(searchQuery, 300);
  const [newPayment, setNewPayment] = useState<PaymentFormData>({
    client_id: '',
    amount: '',
    status: 'pending',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  
  const { payments, loading, error, filterPayments, getRevenueStats, createPayment, updatePayment, deletePayment, refetch } = usePayments();
  const { clients } = useClients();

  // Enhanced filtered and sorted payments with fuzzy search
  const filteredAndSortedPayments = useMemo(() => {
    let result = payments;

    // Apply new filter system
    if (Object.keys(selectedFilters).length > 0) {
      result = result.filter(payment => {
        return Object.entries(selectedFilters).every(([groupId, values]) => {
          if (values.length === 0) return true;
          
          switch (groupId) {
            case 'status':
              return values.includes(payment.status);
            case 'amount_range':
              const amount = parseFloat(payment.amount.toString());
              return values.some((range: any) => {
                if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
                  return amount >= range.min && amount <= range.max;
                }
                return false;
              });
            case 'date_range':
              // Simple date range filtering - in a real app you'd use proper date parsing
              const paymentDate = new Date(payment.payment_date);
              const now = new Date();
              
              return values.some((range: string) => {
                switch (range) {
                  case 'today':
                    return paymentDate.toDateString() === now.toDateString();
                  case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return paymentDate >= weekAgo;
                  case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return paymentDate >= monthAgo;
                  case 'quarter':
                    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    return paymentDate >= quarterAgo;
                  default:
                    return true;
                }
              });
            default:
              return true;
          }
        });
      });
    }

    // Apply fuzzy search
    if (debouncedSearch.trim()) {
      const searchResults = fuzzySearchItems(result, debouncedSearch, PAYMENT_SEARCH_FIELDS);
      result = searchResults.map(r => r.item);
    }

    // Apply sorting
    if (selectedSort) {
      const sortOption = PAYMENT_SORT_OPTIONS.find(opt => opt.key === selectedSort);
      if (sortOption) {
        result = sortItems(result, { field: sortOption.field as keyof Payment, direction: sortOption.direction });
      }
    } else {
      // Default sort: newest first
      result = sortItems(result, { field: 'payment_date' as keyof Payment, direction: 'desc' });
    }

    return result;
  }, [payments, selectedFilters, debouncedSearch, selectedSort]);
  
  // Helper to check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  const filteredPayments = filteredAndSortedPayments;
  const revenueStats = getRevenueStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setNewPayment({
      client_id: '',
      amount: '',
      status: 'pending',
      payment_date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setValidationErrors({});
    setEditingPayment(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (payment: Payment) => {
    setNewPayment({
      client_id: payment.client_id || '',
      amount: payment.amount.toString(),
      status: payment.status,
      payment_date: payment.payment_date.split('T')[0],
      description: payment.description || '',
    });
    setEditingPayment(payment);
    setValidationErrors({});
    setShowAddModal(true);
  };

  const handleCreatePayment = async () => {
    const paymentData = {
      client_id: newPayment.client_id || undefined,
      amount: newPayment.amount, // Keep as string for validation
      status: newPayment.status,
      payment_date: newPayment.payment_date,
      description: newPayment.description || undefined,
    };

    const validation = validatePayment(paymentData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      if (editingPayment) {
        // Convert form data to Payment type for update
        const paymentForUpdate = {
          client_id: paymentData.client_id,
          amount: parseFloat(paymentData.amount),
          status: paymentData.status,
          payment_date: paymentData.payment_date,
          description: paymentData.description,
        };
        await updatePayment(editingPayment.id, paymentForUpdate);
        Alert.alert('Success', 'Payment updated successfully!');
      } else {
        // Convert form data to Payment type
        const paymentForCreation = {
          client_id: paymentData.client_id,
          amount: parseFloat(paymentData.amount),
          status: paymentData.status,
          payment_date: paymentData.payment_date,
          description: paymentData.description,
        };
        await createPayment(paymentForCreation);
        Alert.alert('Success', 'Payment created successfully!');
      }

      resetForm();
      setShowAddModal(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    try {
      await deletePayment(payment.id);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Payment deleted successfully!');
    } catch (error) {
      // Error already handled in hook
    }
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

  const renderPayment = ({ item }: { item: Payment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <TouchableOpacity onPress={() => router.push(`/payment/${item.id}`)}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-gray-900">
                {formatCurrency(item.amount)}
              </Text>
              <View className={`px-2 py-1 rounded-full ${(statusColors as any)[item.status] || 'bg-gray-100 text-gray-800'}`}>
                <Text className="text-xs font-medium capitalize">{item.status}</Text>
              </View>
            </View>
            
            {item.client && (
              <Text className="text-gray-600 mb-1">{item.client.name}</Text>
            )}
            
            {item.description && (
              <Text className="text-gray-500 text-sm mb-1" numberOfLines={1}>
                {item.description}
              </Text>
            )}
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">
                {formatDate(item.payment_date)}
              </Text>
              {item.client?.email && (
                <Text className="text-xs text-gray-400">{item.client.email}</Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center space-x-2 ml-3">
            <TouchableOpacity 
              className="p-2 bg-blue-100 rounded-lg"
              onPress={() => handleOpenEditModal(item)}
            >
              <Ionicons name="pencil" size={16} color="#00D4AA" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-2 bg-red-100 rounded-lg"
              onPress={() => setShowDeleteConfirm(item)}
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-text-secondary mt-4">Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-4 rounded-card mb-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-text-primary text-lg font-bold mt-4">Error Loading Payments</Text>
          <Text className="text-text-muted text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="btn-primary mt-6"
            onPress={refetch}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-secondary">
      <View className="px-6 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-lg font-semibold text-gray-900">
              Payments ({filteredPayments.length})
            </Text>
            <View className="flex-row space-x-4 mt-1">
              <Text className="text-green-600 text-sm">{formatCurrency(revenueStats.total)} total</Text>
              <Text className="text-blue-600 text-sm">{payments.filter(p => p.status === 'confirmed').length} confirmed</Text>
            </View>
          </View>
          <TouchableOpacity
            className="btn-primary flex-row items-center"
            onPress={handleOpenAddModal}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Add Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Stats */}
        <View className="gap-4 mb-6">
          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm flex-1"
              onPress={() => router.push('/analytics/revenue')}
            >
              <Text className="text-2xl font-bold text-gray-900">
                {formatCurrency(revenueStats.total)}
              </Text>
              <Text className="text-gray-600">Total Revenue</Text>
              <Text className="text-sm text-green-600 mt-1">
                {payments.filter(p => p.status === 'confirmed').length} confirmed
              </Text>
            </TouchableOpacity>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {formatCurrency(revenueStats.today)}
              </Text>
              <Text className="text-gray-600">Today</Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueStats.week)}
              </Text>
              <Text className="text-gray-600 text-sm">This Week</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueStats.month)}
              </Text>
              <Text className="text-gray-600 text-sm">This Month</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-yellow-600">
                {payments.filter(p => p.status === 'pending').length}
              </Text>
              <Text className="text-gray-600 text-sm">Pending</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Search Bar with Filters and Sort */}
        <View className="mb-6 gap-4">
          {/* Search Input with Sort */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <SearchInput
                placeholder="Search payments by client, amount, description..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </View>
            
            <SortDropdown
              options={PAYMENT_SORT_OPTIONS}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              placeholder="Sort"
              className="min-w-[120px] max-w-[140px]"
            />
          </View>
          
          {/* Filter Bar */}
          <FilterBar
            filterGroups={PAYMENT_FILTER_GROUPS}
            selectedFilters={selectedFilters}
            onFilterChange={(groupId, values) => {
              setSelectedFilters(prev => ({
                ...prev,
                [groupId]: values
              }));
            }}
            onClearAll={() => setSelectedFilters({})}
          />
        </View>

        {/* Payment List */}
        <FlatList
          data={filteredPayments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D4AA']}
              tintColor="#00D4AA"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons 
                name={searchQuery || hasActiveFilters ? "search-outline" : "cash-outline"} 
                size={64} 
                color="#9CA3AF" 
              />
              <Text className="text-gray-500 text-lg mt-4">
                {searchQuery || hasActiveFilters ? 'No payments found' : 'No payments yet'}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {searchQuery || hasActiveFilters 
                  ? 'Try adjusting your search or filter'
                  : 'Payments will appear here when received'
                }
              </Text>
            </View>
          }
        />

        {/* Add/Edit Payment Modal */}
        <SimpleFormModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingPayment ? 'Edit Payment' : 'Add New Payment'}
          fullScreen={true}
          size="lg"
        >
          {(() => {
            try {
              return (
                <ScrollView 
                  className="flex-1" 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="space-y-4 px-6 py-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Client</Text>
                  {clients.length === 0 ? (
                    <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                      <Text className="text-gray-500 text-center">No clients available</Text>
                      <Text className="text-gray-400 text-center text-sm mt-1">
                        Add a client first to assign payments
                      </Text>
                    </View>
                  ) : (
                    <View className="border border-gray-300 rounded-lg" style={{ maxHeight: 200 }}>
                      <ScrollView 
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {[{ id: '', name: 'No Client (Direct Payment)', email: '' }, ...clients].map((item, index) => (
                          <TouchableOpacity
                            key={item.id || 'no-client'}
                            className={`px-4 py-3 border-b border-gray-200 flex-row items-center justify-between ${
                              newPayment.client_id === item.id ? 'bg-blue-50' : 'bg-white'
                            } ${index === clients.length ? 'border-b-0' : ''}`}
                            onPress={() => setNewPayment({ ...newPayment, client_id: item.id })}
                          >
                            <View className="flex-1">
                              <Text className={`font-medium ${
                                newPayment.client_id === item.id ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {item.name}
                              </Text>
                              {item.email && (
                                <Text className="text-gray-500 text-sm">{item.email}</Text>
                              )}
                            </View>
                            {newPayment.client_id === item.id && (
                              <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {validationErrors.client_id && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.client_id}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Amount *</Text>
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-base ${
                      validationErrors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={newPayment.amount}
                    onChangeText={(text) => setNewPayment({ ...newPayment, amount: text })}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                  />
                  {validationErrors.amount && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.amount}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Status *</Text>
                  <View className="flex-row space-x-2">
                    {(['pending', 'confirmed', 'failed'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        className={`flex-1 px-4 py-3 rounded-lg border ${
                          newPayment.status === status
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-300'
                        }`}
                        onPress={() => setNewPayment({ ...newPayment, status })}
                      >
                        <Text className={`text-center font-medium ${
                          newPayment.status === status ? 'text-white' : 'text-gray-700'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {validationErrors.status && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.status}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Payment Date *</Text>
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-base ${
                      validationErrors.payment_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={newPayment.payment_date}
                    onChangeText={(text) => setNewPayment({ ...newPayment, payment_date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                  {validationErrors.payment_date && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.payment_date}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    value={newPayment.description}
                    onChangeText={(text) => setNewPayment({ ...newPayment, description: text })}
                    placeholder="Payment description (optional)"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-4"
                onPress={() => setShowAddModal(false)}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-lg py-4 ${
                  !newPayment.amount || !newPayment.payment_date
                    ? 'bg-gray-300' 
                    : 'bg-primary'
                }`}
                onPress={handleCreatePayment}
                disabled={!newPayment.amount || !newPayment.payment_date}
              >
                <Text className={`text-center font-semibold text-base ${
                  !newPayment.amount || !newPayment.payment_date
                    ? 'text-gray-500' 
                    : 'text-white'
                }`}>
                  {editingPayment ? 'Update Payment' : 'Add Payment'}
                </Text>
              </TouchableOpacity>
            </View>
                  </View>
                </ScrollView>
              );
            } catch (err) {
              console.error('Modal form crash:', err);
              return <Text>Error loading form</Text>;
            }
          })()}
        </SimpleFormModal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          visible={!!showDeleteConfirm}
          title="Delete Payment"
          message={`Are you sure you want to delete this payment of ${showDeleteConfirm ? formatCurrency(showDeleteConfirm.amount) : ''}? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => showDeleteConfirm && handleDeletePayment(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          destructive={true}
          icon="trash"
        />
      </View>
    </SafeAreaView>
  );
}