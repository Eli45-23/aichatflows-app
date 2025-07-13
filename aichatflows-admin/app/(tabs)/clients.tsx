import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Users, Search, X, Edit, Trash2, User, Mail, Phone, Camera } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Client, ClientFormData } from '../../src/types';
import { useClients } from '../../src/hooks/useClients';
import { validateClient } from '../../src/utils/validation';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { 
  Button, 
  Input, 
  FormField, 
  Card, 
  Badge, 
  StatusBadge, 
  EmptyState, 
  NoDataEmptyState, 
  LoadingEmptyState, 
  SimpleFormModal,
  SearchInput,
  RetentionAnalytics,
  FilterBar,
  SortDropdown
} from '../../src/components';
import { CombinedClientBadges, PlanBadge, PaymentStatusBadge } from '../../src/components/Badges';
import { PLANS, getClientsNeedingPaymentFollowup } from '../../src/utils/finance';
import { useAdvancedMetrics } from '../../src/hooks/useAdvancedMetrics';
import { useActivityLog } from '../../src/hooks/useActivityLog';
import { CLIENT_FILTER_GROUPS } from '../../src/components/FilterBar';
import { CLIENT_SORT_OPTIONS } from '../../src/components/SortDropdown';
import { fuzzySearchItems, CLIENT_SEARCH_FIELDS, useDebounceSearch, sortItems } from '../../src/utils/search';

const statusColors = {
  active: 'status-success',
  in_progress: 'status-warning',
  paused: 'bg-orange-50 text-orange-700 border border-orange-200',
  cancelled: 'status-danger',
  unknown: 'bg-gray-50 text-gray-600 border border-gray-200',
};

export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  
  // Helper to check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(searchQuery, 300);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Client | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [faqInputType, setFaqInputType] = useState<'text' | 'photo' | null>(null);
  const [faqLocation, setFaqLocation] = useState('');
  const [newClient, setNewClient] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    instagram_handle: '',
    facebook_url: '',
    tiktok_handle: '',
    delivery_preference: 'delivery',
    platform_preference: 'instagram',
    plan: 'starter',
    payment_status: 'unpaid',
    signed_in_person: false,
    payment_method: '',
    notes: '',
    business_name: '',
    other_platforms: '',
    business_type: '',
    business_niche: '',
    common_customer_question: '',
    products_or_services: '',
    has_faqs: false,
    faq_location: '',
    consent_to_share: false,
    // Login credentials
    instagram_password: '',
    facebook_password: '',
    tiktok_password: '',
    // Delivery details
    delivery_method: '',
    delivery_notes: '',
    // Pickup details
    pickup_method: '',
    pickup_notes: '',
    // Photo upload
    photo_url: '',
  });
  
  const { clients, loading, error, filterClients, createClient, updateClient, deleteClient, refetch } = useClients();
  const { retention } = useAdvancedMetrics();
  const { logPlanChange, logPaymentStatusChange, logClientCreated } = useActivityLog();

  // Safe navigation function with error handling
  const navigateToClient = useCallback((clientId: string) => {
    try {
      router.push(`/client/${clientId}`);
    } catch (error) {
      console.warn('Navigation failed:', error);
      Alert.alert('Navigation Error', 'Unable to open client details. Please try again.');
    }
  }, []);

  // Enhanced filtered and sorted clients with fuzzy search
  const filteredAndSortedClients = useMemo(() => {
    let result = clients;

    // Apply new filter system
    if (Object.keys(selectedFilters).length > 0) {
      result = result.filter(client => {
        return Object.entries(selectedFilters).every(([groupId, values]) => {
          if (values.length === 0) return true;
          
          switch (groupId) {
            case 'status':
              return values.includes(client.status);
            case 'plan':
              return values.includes(client.plan);
            case 'payment_status':
              return values.includes(client.payment_status);
            case 'signup_type':
              return values.includes(client.signed_in_person);
            default:
              return true;
          }
        });
      });
    }
    
    // Legacy filters removed - now using selectedFilters only

    // Apply fuzzy search
    if (debouncedSearch.trim()) {
      const searchResults = fuzzySearchItems(result, debouncedSearch, CLIENT_SEARCH_FIELDS);
      result = searchResults.map(r => r.item);
    }

    // Apply sorting
    if (selectedSort) {
      const sortOption = CLIENT_SORT_OPTIONS.find(opt => opt.key === selectedSort);
      if (sortOption) {
        result = sortItems(result, { field: sortOption.field as keyof Client, direction: sortOption.direction });
      }
    } else {
      // Default sort: newest first
      result = sortItems(result, { field: 'created_at' as keyof Client, direction: 'desc' });
    }

    return result;
  }, [clients, selectedFilters, debouncedSearch, selectedSort]);

  // Legacy for components that still use filteredClients
  const filteredClients = filteredAndSortedClients;

  // Memoize client stats to prevent recalculation
  const clientStats = useMemo(() => {
    return {
      active: clients.filter(c => c.status === 'active').length,
      inProgress: clients.filter(c => c.status === 'in_progress').length,
      other: clients.filter(c => c.status === 'paused').length + 
             clients.filter(c => c.status === 'cancelled').length + 
             clients.filter(c => !c.status || c.status === null).length
    };
  }, [clients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a US number (10 or 11 digits)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // For international or non-standard numbers, just add some formatting
    if (cleaned.length > 10) {
      return `+${cleaned.slice(0, -10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
    
    return phone; // Return original if can't format
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { 
        bg: 'bg-success/20', 
        text: 'text-success', 
        border: 'border-success/30',
        icon: 'checkmark-circle'
      },
      in_progress: { 
        bg: 'bg-warning/20', 
        text: 'text-warning', 
        border: 'border-warning/30',
        icon: 'time'
      },
      paused: { 
        bg: 'bg-orange-500/20', 
        text: 'text-orange-400', 
        border: 'border-orange-500/30',
        icon: 'pause-circle'
      },
      cancelled: { 
        bg: 'bg-danger/20', 
        text: 'text-danger', 
        border: 'border-danger/30',
        icon: 'close-circle'
      },
      unknown: { 
        bg: 'bg-text-muted/20', 
        text: 'text-text-muted', 
        border: 'border-text-muted/30',
        icon: 'help-circle'
      }
    };
    return configs[status as keyof typeof configs] || configs.unknown;
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      status: 'active',
      instagram_handle: '',
      facebook_url: '',
      tiktok_handle: '',
      delivery_preference: 'delivery',
      platform_preference: 'instagram',
      plan: 'starter',
      payment_status: 'unpaid',
      signed_in_person: false,
      payment_method: '',
      notes: '',
      business_name: '',
      other_platforms: '',
      business_type: '',
      business_niche: '',
      common_customer_question: '',
      products_or_services: '',
      has_faqs: false,
      faq_location: '',
      consent_to_share: false,
      // Login credentials
      instagram_password: '',
      facebook_password: '',
      tiktok_password: '',
      // Delivery details
      delivery_method: '',
      delivery_notes: '',
      // Pickup details
      pickup_method: '',
      pickup_notes: '',
      // Photo upload
      photo_url: '',
    });
    setValidationErrors({});
    setEditingClient(null);
    setFaqInputType(null);
    setFaqLocation('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setNewClient({
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      instagram_handle: client.instagram_handle || '',
      facebook_url: client.facebook_url || '',
      tiktok_handle: client.tiktok_handle || '',
      delivery_preference: client.delivery_preference,
      platform_preference: client.platform_preference,
      plan: client.plan,
      payment_status: client.payment_status,
      signed_in_person: client.signed_in_person,
      payment_method: client.payment_method || '',
      notes: client.notes || '',
      business_name: client.business_name || '',
      other_platforms: client.other_platforms || '',
      business_type: client.business_type || '',
      business_niche: client.business_niche || '',
      common_customer_question: client.common_customer_question || '',
      products_or_services: client.products_or_services || '',
      has_faqs: client.has_faqs || false,
      faq_location: client.faq_location || '',
      consent_to_share: client.consent_to_share || false,
      // Login credentials
      instagram_password: client.instagram_password || '',
      facebook_password: client.facebook_password || '',
      tiktok_password: client.tiktok_password || '',
      // Delivery details
      delivery_method: client.delivery_method || '',
      delivery_notes: client.delivery_notes || '',
      // Pickup details
      pickup_method: client.pickup_method || '',
      pickup_notes: client.pickup_notes || '',
      // Photo upload
      photo_url: client.photo_url || '',
    });
    setEditingClient(client);
    setValidationErrors({});
    // Set FAQ state for editing
    if (client.has_faqs && client.faq_location) {
      setFaqInputType('text');
      setFaqLocation(client.faq_location);
    } else if (client.has_faqs && client.photo_url) {
      setFaqInputType('photo');
    }
    setShowAddModal(true);
  };

  const handleCreateClient = async () => {
    const validation = validateClient(newClient);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      if (editingClient) {
        // Update existing client
        await updateClient(editingClient.id, newClient);
        Alert.alert('Success', 'Client updated successfully!');
      } else {
        // Create new client
        const newClientResponse = await createClient(newClient);
        if (newClientResponse) {
          // Log the activity
          logClientCreated(
            newClientResponse.id, 
            newClient.name, 
            newClient.plan || 'starter', 
            newClient.signed_in_person || false
          );
        }
        Alert.alert('Success', 'Client added successfully!');
      }

      resetForm();
      setShowAddModal(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      await deleteClient(client.id);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Client deleted successfully!');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Phase 7: Payment status and plan update handlers
  const handleUpdatePaymentStatus = async (clientId: string, status: 'paid' | 'unpaid' | 'overdue') => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const oldStatus = client.payment_status || 'unpaid';
      await updateClient(clientId, { ...client, payment_status: status });
      
      // Log the activity
      logPaymentStatusChange(clientId, client.name, oldStatus, status);
      
      Alert.alert('Success', `Payment status updated to ${status}`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to update payment status: ${error.message}`);
    }
  };

  const handleUpdatePlan = async (clientId: string, plan: 'starter' | 'pro') => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const oldPlan = client.plan || 'starter';
      await updateClient(clientId, { ...client, plan });
      
      // Log the activity
      logPlanChange(clientId, client.name, oldPlan, plan);
      
      Alert.alert('Success', `Plan updated to ${plan}`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to update plan: ${error.message}`);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos.');
        return;
      }

      // Show options for camera or library
      Alert.alert(
        'Select Photo',
        'Choose how you\'d like to add a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Photo', 
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status === 'granted') {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  setNewClient({ ...newClient, photo_url: result.assets[0].uri });
                }
              }
            }
          },
          { 
            text: 'Choose from Library', 
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setNewClient({ ...newClient, photo_url: result.assets[0].uri });
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera or photo library');
    }
  };

  const renderClient = useCallback(({ item }: { item: Client }) => {
    const statusConfig = getStatusConfig(item.status || 'unknown');
    
    return (
      <TouchableOpacity 
        className="card-elevated mb-4"
        onPress={() => navigateToClient(item.id)}
        activeOpacity={0.95}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1">
            {/* Client Avatar */}
            <View className="bg-primary w-12 h-12 rounded-card items-center justify-center mr-4">
              <Text className="text-white font-bold text-lg">
                {getInitials(item.name)}
              </Text>
            </View>
            
            {/* Client Info */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-primary mb-1">
                {item.name}
              </Text>
              
              <View className="flex-row items-center mb-2">
                <Mail size={14} color="#A0A0A0" />
                <Text className="text-text-secondary text-sm ml-2">
                  {item.email}
                </Text>
              </View>
              
              {item.phone && (
                <View className="flex-row items-center mb-3">
                  <Phone size={14} color="#A0A0A0" />
                  <Text className="text-text-secondary text-sm ml-2">
                    {formatPhoneNumber(item.phone)}
                  </Text>
                </View>
              )}
              
              {/* Enhanced Badge Display for Phase 7 */}
              <View className="flex-row items-center mb-1">
                <Text className="text-text-primary font-bold text-base">
                  {item.business_name ? `${item.business_name} • ` : ''}
                  <Text className="text-blue-600 font-bold">
                    {(item.plan || 'starter').toUpperCase()}
                  </Text>
                </Text>
              </View>
              
              <CombinedClientBadges 
                client={item}
                onPaymentPress={() => {
                  Alert.alert(
                    'Update Payment Status',
                    `Current status: ${item.payment_status || 'unpaid'}`,
                    [
                      { text: 'Mark as Paid', onPress: () => handleUpdatePaymentStatus(item.id, 'paid') },
                      { text: 'Mark as Unpaid', onPress: () => handleUpdatePaymentStatus(item.id, 'unpaid') },
                      { text: 'Mark as Overdue', onPress: () => handleUpdatePaymentStatus(item.id, 'overdue') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                onPlanPress={() => {
                  Alert.alert(
                    'Change Plan',
                    `Current plan: ${item.plan || 'starter'}`,
                    [
                      { text: 'Starter ($100)', onPress: () => handleUpdatePlan(item.id, 'starter') },
                      { text: 'Pro ($150)', onPress: () => handleUpdatePlan(item.id, 'pro') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                size="sm"
              />
              
              <View className="flex-row items-center mt-2">
                <View className={`${statusConfig.bg} ${statusConfig.border} border px-2 py-1 rounded-full flex-row items-center`}>
                  <Ionicons name={statusConfig.icon as any} size={10} color={statusConfig.text.includes('success') ? '#00D9FF' : statusConfig.text.includes('warning') ? '#FFB800' : statusConfig.text.includes('danger') ? '#FF4757' : '#A0A0A0'} />
                  <Text className={`${statusConfig.text} text-xs font-medium ml-1 capitalize`}>
                    {item.status ? item.status.replace('_', ' ') : 'Unknown'}
                  </Text>
                </View>
                
                {item.platform_preference && (
                  <View className="bg-primary/20 border border-primary/30 px-2 py-1 rounded-full ml-2">
                    <Text className="text-primary text-xs font-medium capitalize">
                      {item.platform_preference}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text className="text-xs text-text-muted">
                Added {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row items-center space-x-2 ml-3">
            <TouchableOpacity 
              className="p-2 bg-primary/20 rounded-lg"
              onPress={(e) => {
                e.stopPropagation();
                handleOpenEditModal(item);
              }}
              activeOpacity={0.7}
            >
              <Edit size={16} color="#00D4AA" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-2 bg-danger/20 rounded-lg"
              onPress={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(item);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#FF4757" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigateToClient, handleOpenEditModal, setShowDeleteConfirm, formatPhoneNumber, getInitials, getStatusConfig, formatDate]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-green-50 p-6 rounded-card mb-6">
            <ActivityIndicator size="large" color="#00D4AA" />
          </View>
          <Text className="text-text-primary text-xl font-bold mb-2">Loading Clients</Text>
          <Text className="text-text-muted text-center animate-fade-in">
            Fetching your client data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-6 rounded-card mb-6">
            <Users size={48} color="#EF4444" />
          </View>
          <Text className="text-text-primary text-xl font-bold mb-2">Failed to Load Clients</Text>
          <Text className="text-text-muted text-center mb-6 max-w-sm">
            {error || 'Something went wrong while loading your clients. Please try again.'}
          </Text>
          <TouchableOpacity
            className="btn-primary flex-row items-center"
            onPress={refetch}
          >
            <Text className="text-white font-semibold mr-2">Retry</Text>
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-secondary">
      <View className="px-page py-section">
        {/* Header with Stats */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-3xl font-bold text-text-primary">Clients</Text>
            <Text className="text-text-muted mt-1">{filteredClients.length} clients managed</Text>
          </View>
          <TouchableOpacity
            className="btn-primary flex-row items-center"
            onPress={handleOpenAddModal}
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Client</Text>
          </TouchableOpacity>
        </View>
        {/* Client Stats */}
        <View className="flex-row gap-4 mb-6">
          <View className="card-primary flex-1 p-4">
            <Text className="text-xl font-bold text-success">
              {clientStats.active}
            </Text>
            <Text className="text-text-muted text-sm">Active</Text>
          </View>
          <View className="card-primary flex-1 p-4">
            <Text className="text-xl font-bold text-warning">
              {clientStats.inProgress}
            </Text>
            <Text className="text-text-muted text-sm">In Progress</Text>
          </View>
          <View className="card-primary flex-1 p-4">
            <Text className="text-xl font-bold text-text-muted">
              {clientStats.other}
            </Text>
            <Text className="text-text-muted text-sm">Other</Text>
          </View>
        </View>

        {/* Client Retention Analytics */}
        <RetentionAnalytics
          retention={retention}
          loading={false}
          onClientPress={(clientName) => {
            Alert.alert(
              'Client Details',
              `View details for ${clientName}? This feature will be available in future updates.`,
              [{ text: 'OK' }]
            );
          }}
        />

        {/* Enhanced Search Bar with Filters and Sort */}
        <View className="mb-6 gap-4">
          {/* Search Input with Sort */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <SearchInput
                placeholder="Search by name, email, business name, phone..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </View>
            
            <SortDropdown
              options={CLIENT_SORT_OPTIONS}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              placeholder="Sort"
              className="min-w-[120px] max-w-[140px]"
            />
          </View>
          
          {/* Filter Bar */}
          <FilterBar
            filterGroups={CLIENT_FILTER_GROUPS}
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

        {/* Client List */}
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
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
            <View className="flex-1 justify-center items-center py-16">
              <View className="bg-gray-50 p-6 rounded-card mb-6">
                <Users 
                  size={48} 
                  color={searchQuery || hasActiveFilters ? "#A0A0A0" : "#00D4AA"} 
                />
              </View>
              <Text className="text-text-primary text-xl font-bold mb-2">
                {searchQuery || hasActiveFilters ? 'No clients found' : 'No clients yet'}
              </Text>
              <Text className="text-text-muted text-center max-w-xs">
                {searchQuery || hasActiveFilters 
                  ? 'Try adjusting your search terms or filter criteria'
                  : 'Start building your client base by adding your first client'
                }
              </Text>
              {!searchQuery && !hasActiveFilters && (
                <TouchableOpacity
                  className="btn-primary mt-6 flex-row items-center"
                  onPress={handleOpenAddModal}
                >
                  <Plus size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Add First Client</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Enhanced Add/Edit Client Modal */}
        <SimpleFormModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingClient ? 'Edit Client' : 'Add New Client'}
          size="lg"
          fullScreen={true}
        >
          {(() => {
            try {
              return (
                <View className="space-y-6">
                {/* Basic Information */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-4">Basic Information</Text>
                  
                  <View className="space-y-4">
                    <FormField spacing="compact">
                      <Input
                        label="Name"
                        required
                        value={newClient.name}
                        onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                        placeholder="Enter client name"
                        autoCapitalize="words"
                        leftIcon="person"
                        error={validationErrors.name}
                        variant={validationErrors.name ? 'error' : 'default'}
                      />
                    </FormField>

                    <FormField spacing="compact">
                      <Input
                        label="Email"
                        required
                        value={newClient.email}
                        onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                        placeholder="Enter email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon="mail"
                        error={validationErrors.email}
                        variant={validationErrors.email ? 'error' : 'default'}
                      />
                    </FormField>

                    <FormField spacing="compact">
                      <Input
                        label="Phone"
                        required
                        value={newClient.phone}
                        onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        leftIcon="call"
                        error={validationErrors.phone}
                        variant={validationErrors.phone ? 'error' : 'default'}
                      />
                    </FormField>
                  </View>
                </View>

                {/* Social Media */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Social Media</Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Instagram Handle</Text>
                      <TextInput
                        className={`border rounded-lg px-4 py-3 text-base ${
                          validationErrors.instagram_handle ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={newClient.instagram_handle}
                        onChangeText={(text) => setNewClient({ ...newClient, instagram_handle: text })}
                        placeholder="@username"
                        autoCapitalize="none"
                      />
                      {validationErrors.instagram_handle && (
                        <Text className="text-red-500 text-sm mt-1">{validationErrors.instagram_handle}</Text>
                      )}
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Facebook Page URL</Text>
                      <TextInput
                        className={`border rounded-lg px-4 py-3 text-base ${
                          validationErrors.facebook_url ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={newClient.facebook_url}
                        onChangeText={(text) => setNewClient({ ...newClient, facebook_url: text })}
                        placeholder="https://facebook.com/page"
                        autoCapitalize="none"
                      />
                      {validationErrors.facebook_url && (
                        <Text className="text-red-500 text-sm mt-1">{validationErrors.facebook_url}</Text>
                      )}
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">TikTok Handle</Text>
                      <TextInput
                        className={`border rounded-lg px-4 py-3 text-base ${
                          validationErrors.tiktok_handle ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={newClient.tiktok_handle}
                        onChangeText={(text) => setNewClient({ ...newClient, tiktok_handle: text })}
                        placeholder="@username"
                        autoCapitalize="none"
                      />
                      {validationErrors.tiktok_handle && (
                        <Text className="text-red-500 text-sm mt-1">{validationErrors.tiktok_handle}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Login Credentials */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Login Credentials</Text>
                  
                  <View className="space-y-4">
                    {newClient.platform_preference === 'instagram' && (
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Instagram Password</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                          value={newClient.instagram_password}
                          onChangeText={(text) => setNewClient({ ...newClient, instagram_password: text })}
                          placeholder="Enter Instagram password"
                          secureTextEntry
                        />
                      </View>
                    )}

                    {newClient.platform_preference === 'facebook' && newClient.plan === 'pro' && (
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Facebook Password</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                          value={newClient.facebook_password}
                          onChangeText={(text) => setNewClient({ ...newClient, facebook_password: text })}
                          placeholder="Enter Facebook password"
                          secureTextEntry
                        />
                      </View>
                    )}

                    {newClient.platform_preference === 'tiktok' && newClient.plan === 'pro' && (
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">TikTok Password</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                          value={newClient.tiktok_password}
                          onChangeText={(text) => setNewClient({ ...newClient, tiktok_password: text })}
                          placeholder="Enter TikTok password"
                          secureTextEntry
                        />
                      </View>
                    )}
                  </View>
                </View>

                {/* Preferences */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Preferences</Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Delivery Preference *</Text>
                      <View className="flex-row space-x-2">
                        {(['delivery', 'pickup'] as const).map((preference) => (
                          <TouchableOpacity
                            key={preference}
                            className={`flex-1 px-4 py-3 rounded-lg border ${
                              newClient.delivery_preference === preference
                                ? 'bg-primary border-primary'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => setNewClient({ ...newClient, delivery_preference: preference })}
                          >
                            <Text className={`text-center font-medium ${
                              newClient.delivery_preference === preference ? 'text-white' : 'text-gray-700'
                            }`}>
                              {preference.charAt(0).toUpperCase() + preference.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Platform Preference *</Text>
                      <View className="flex-row space-x-2">
                        {(['instagram', 'facebook', 'tiktok'] as const).map((platform) => {
                          const isDisabled = newClient.plan === 'starter' && platform !== 'instagram';
                          return (
                            <TouchableOpacity
                              key={platform}
                              className={`flex-1 px-3 py-3 rounded-lg border ${
                                newClient.platform_preference === platform
                                  ? 'bg-primary border-primary'
                                  : isDisabled
                                  ? 'bg-gray-100 border-gray-200'
                                  : 'bg-white border-gray-300'
                              }`}
                              onPress={() => {
                                if (!isDisabled) {
                                  setNewClient({ ...newClient, platform_preference: platform });
                                }
                              }}
                              disabled={isDisabled}
                            >
                              <Text className={`text-center font-medium text-sm ${
                                newClient.platform_preference === platform
                                  ? 'text-white'
                                  : isDisabled
                                  ? 'text-gray-400'
                                  : 'text-gray-700'
                              }`}>
                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {newClient.plan === 'starter' && (
                        <Text className="text-xs text-gray-500 mt-2">
                          Starter plan includes Instagram only. Upgrade to Pro for Facebook and TikTok.
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Delivery/Pickup Details */}
                {newClient.delivery_preference === 'delivery' && (
                  <View>
                    <Text className="text-lg font-semibold text-gray-900 mb-3">Delivery Details</Text>
                    
                    <View className="space-y-4">
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Delivery Method</Text>
                        <View className="flex-row space-x-2">
                          {(['UberEats', 'DoorDash', 'Grubhub', 'Postmates', 'Other'] as const).map((method) => (
                            <TouchableOpacity
                              key={method}
                              className={`px-3 py-2 rounded-lg border ${
                                newClient.delivery_method === method
                                  ? 'bg-primary border-primary'
                                  : 'bg-white border-gray-300'
                              }`}
                              onPress={() => setNewClient({ ...newClient, delivery_method: method })}
                            >
                              <Text className={`text-center font-medium text-xs ${
                                newClient.delivery_method === method ? 'text-white' : 'text-gray-700'
                              }`}>
                                {method}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Delivery Notes</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                          value={newClient.delivery_notes}
                          onChangeText={(text) => setNewClient({ ...newClient, delivery_notes: text })}
                          placeholder="Special delivery instructions..."
                          multiline
                          numberOfLines={2}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {newClient.delivery_preference === 'pickup' && (
                  <View>
                    <Text className="text-lg font-semibold text-gray-900 mb-3">Pickup Details</Text>
                    
                    <View className="space-y-4">
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Pickup Method</Text>
                        <View className="flex-row space-x-2">
                          {(['In-store', 'Curbside', 'By Phone', 'Other'] as const).map((method) => (
                            <TouchableOpacity
                              key={method}
                              className={`px-3 py-2 rounded-lg border ${
                                newClient.pickup_method === method
                                  ? 'bg-primary border-primary'
                                  : 'bg-white border-gray-300'
                              }`}
                              onPress={() => setNewClient({ ...newClient, pickup_method: method })}
                            >
                              <Text className={`text-center font-medium text-xs ${
                                newClient.pickup_method === method ? 'text-white' : 'text-gray-700'
                              }`}>
                                {method}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Pickup Notes</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                          value={newClient.pickup_notes}
                          onChangeText={(text) => setNewClient({ ...newClient, pickup_notes: text })}
                          placeholder="Special pickup instructions..."
                          multiline
                          numberOfLines={2}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Plan & Status */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Plan & Status</Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Plan *</Text>
                      <View className="flex-row space-x-2">
                        {(['starter', 'pro'] as const).map((plan) => (
                          <TouchableOpacity
                            key={plan}
                            className={`flex-1 px-4 py-3 rounded-lg border ${
                              newClient.plan === plan
                                ? 'bg-primary border-primary'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => setNewClient({ 
                              ...newClient, 
                              plan,
                              // Reset platform preference if switching to starter
                              platform_preference: plan === 'starter' ? 'instagram' : newClient.platform_preference
                            })}
                          >
                            <Text className={`text-center font-medium ${
                              newClient.plan === plan ? 'text-white' : 'text-gray-700'
                            }`}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </Text>
                            <Text className={`text-center text-sm ${
                              newClient.plan === plan ? 'text-white' : 'text-gray-500'
                            }`}>
                              {plan === 'starter' ? '$100' : '$150'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
                      <View className="flex-row space-x-2">
                        {(['active', 'in_progress', 'paused', 'cancelled'] as const).map((status) => (
                          <TouchableOpacity
                            key={status}
                            className={`flex-1 px-2 py-3 rounded-lg border ${
                              newClient.status === status
                                ? 'bg-primary border-primary'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => setNewClient({ ...newClient, status })}
                          >
                            <Text className={`text-center font-medium text-xs ${
                              newClient.status === status ? 'text-white' : 'text-gray-700'
                            }`}>
                              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Phase 7: Payment Status Selection */}
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Payment Status</Text>
                      <View className="flex-row space-x-2">
                        {(['paid', 'unpaid', 'overdue'] as const).map((paymentStatus) => (
                          <TouchableOpacity
                            key={paymentStatus}
                            className={`flex-1 px-3 py-3 rounded-lg border-2 ${
                              newClient.payment_status === paymentStatus
                                ? paymentStatus === 'paid' 
                                  ? 'bg-green-500 border-green-500'
                                  : paymentStatus === 'unpaid'
                                  ? 'bg-yellow-500 border-yellow-500' 
                                  : 'bg-red-500 border-red-500'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => setNewClient({ ...newClient, payment_status: paymentStatus })}
                          >
                            <Text className={`text-center font-medium text-sm ${
                              newClient.payment_status === paymentStatus ? 'text-white' : 'text-gray-700'
                            }`}>
                              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        Default is &quot;unpaid&quot; - update when payment is received
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Business Information */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Business Information</Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Business Name</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.business_name}
                        onChangeText={(text) => setNewClient({ ...newClient, business_name: text })}
                        placeholder="Enter business name"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Other Platforms</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.other_platforms}
                        onChangeText={(text) => setNewClient({ ...newClient, other_platforms: text })}
                        placeholder="e.g., YouTube, LinkedIn, Twitter"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Business Type</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.business_type}
                        onChangeText={(text) => setNewClient({ ...newClient, business_type: text })}
                        placeholder="e.g., Restaurant, Retail, Service"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Business Niche</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.business_niche}
                        onChangeText={(text) => setNewClient({ ...newClient, business_niche: text })}
                        placeholder="e.g., Italian Food, Fashion, Fitness"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Common Customer Question</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.common_customer_question}
                        onChangeText={(text) => setNewClient({ ...newClient, common_customer_question: text })}
                        placeholder="Most frequently asked question"
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Products or Services Offered</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.products_or_services}
                        onChangeText={(text) => setNewClient({ ...newClient, products_or_services: text })}
                        placeholder="Describe main products/services"
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </View>

                {/* Additional Information */}
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Additional Information</Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Payment Method</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.payment_method}
                        onChangeText={(text) => setNewClient({ ...newClient, payment_method: text })}
                        placeholder="e.g., Credit Card, PayPal, Bank Transfer"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Do you have FAQs?</Text>
                      <View className="flex-row space-x-2">
                        {[true, false].map((value) => (
                          <TouchableOpacity
                            key={value.toString()}
                            className={`flex-1 px-4 py-3 rounded-lg border ${
                              newClient.has_faqs === value
                                ? 'bg-primary border-primary'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => {
                              setNewClient({ ...newClient, has_faqs: value });
                              if (!value) {
                                setFaqInputType(null);
                                setFaqLocation('');
                              }
                            }}
                          >
                            <Text className={`text-center font-medium ${
                              newClient.has_faqs === value ? 'text-white' : 'text-gray-700'
                            }`}>
                              {value ? 'Yes' : 'No'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {/* Conditional FAQ Input Options */}
                      {newClient.has_faqs && (
                        <View className="mt-4 space-y-4">
                          <Text className="text-sm font-medium text-gray-700">How would you like to provide your FAQs?</Text>
                          
                          {/* FAQ Input Type Selection */}
                          <View className="flex-row space-x-2">
                            <TouchableOpacity
                              className={`flex-1 px-4 py-3 rounded-lg border ${
                                faqInputType === 'text'
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-white border-gray-300'
                              }`}
                              onPress={() => setFaqInputType('text')}
                            >
                              <Text className={`text-center font-medium ${
                                faqInputType === 'text' ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                                📝 Enter Link/Location
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              className={`flex-1 px-4 py-3 rounded-lg border ${
                                faqInputType === 'photo'
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-white border-gray-300'
                              }`}
                              onPress={() => setFaqInputType('photo')}
                            >
                              <Text className={`text-center font-medium ${
                                faqInputType === 'photo' ? 'text-green-700' : 'text-gray-700'
                              }`}>
                                📸 Upload Photo
                              </Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* FAQ Text Input */}
                          {faqInputType === 'text' && (
                            <FormField spacing="compact">
                              <Input
                                label="FAQ Location or Link"
                                value={faqLocation}
                                onChangeText={(text) => {
                                  setFaqLocation(text);
                                  setNewClient({ ...newClient, faq_location: text });
                                }}
                                placeholder="Enter website URL, document link, or location description..."
                                leftIcon="link"
                                multiline={true}
                                numberOfLines={3}
                              />
                            </FormField>
                          )}
                          
                          {/* FAQ Photo Upload */}
                          {faqInputType === 'photo' && (
                            <FormField label="FAQ Document Photo" helperText="Upload a photo of your FAQ document or sheet">
                              <TouchableOpacity
                                className="flex-row items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50"
                                onPress={handlePhotoUpload}
                              >
                                <Camera size={24} color="#A0A0A0" />
                                <Text className="text-text-secondary ml-3 font-medium">
                                  {newClient.photo_url ? 'FAQ Photo Selected ✓' : 'Upload FAQ Photo'}
                                </Text>
                              </TouchableOpacity>
                            </FormField>
                          )}
                        </View>
                      )}
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Consent to Share Information</Text>
                      <View className="flex-row space-x-2">
                        {[true, false].map((value) => (
                          <TouchableOpacity
                            key={value.toString()}
                            className={`flex-1 px-4 py-3 rounded-lg border ${
                              newClient.consent_to_share === value
                                ? 'bg-primary border-primary'
                                : 'bg-white border-gray-300'
                            }`}
                            onPress={() => setNewClient({ ...newClient, consent_to_share: value })}
                          >
                            <Text className={`text-center font-medium ${
                              newClient.consent_to_share === value ? 'text-white' : 'text-gray-700'
                            }`}>
                              {value ? 'Yes' : 'No'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <FormField label="Photo Upload" helperText="Upload a photo of the client's business, menu, or storefront">
                      <Button
                        variant="secondary"
                        icon={newClient.photo_url ? "camera" : "camera-outline"}
                        onPress={handlePhotoUpload}
                        fullWidth
                      >
                        {newClient.photo_url ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      
                      {newClient.photo_url && (
                        <View className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                              <Text className="text-sm text-green-700 ml-2 font-medium">Photo uploaded successfully</Text>
                            </View>
                            <Button 
                              variant="ghost"
                              size="sm"
                              icon="close"
                              onPress={() => setNewClient({ ...newClient, photo_url: '' })}
                            >
                              Remove
                            </Button>
                          </View>
                          <Image 
                            source={{ uri: newClient.photo_url }} 
                            className="w-24 h-24 rounded-lg border border-green-300"
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </FormField>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Notes</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        value={newClient.notes}
                        onChangeText={(text) => setNewClient({ ...newClient, notes: text })}
                        placeholder="Additional notes about the client"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
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
                className="flex-1 bg-primary rounded-lg py-4"
                onPress={handleCreateClient}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </Text>
              </TouchableOpacity>
            </View>
                </View>
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
          title="Delete Client"
          message={`Are you sure you want to delete ${showDeleteConfirm?.name}? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => showDeleteConfirm && handleDeleteClient(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          destructive={true}
          icon="trash"
        />
      </View>
    </SafeAreaView>
  );
}