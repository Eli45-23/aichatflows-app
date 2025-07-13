import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin, Edit, Trash2, Navigation } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { BusinessVisit, Client } from '../../src/types';
import { useBusinessVisits } from '../../src/hooks/useBusinessVisits';
import { useClients } from '../../src/hooks/useClients';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { SimpleFormModal } from '../../src/components/SimpleFormModal';
import { 
  SearchInput,
  FilterBar,
  SortDropdown
} from '../../src/components';
import { VISIT_FILTER_GROUPS } from '../../src/components/FilterBar';
import { VISIT_SORT_OPTIONS } from '../../src/components/SortDropdown';
import { fuzzySearchItems, VISIT_SEARCH_FIELDS, useDebounceSearch, sortItems } from '../../src/utils/search';

export default function VisitsScreen() {
  const { 
    visits, 
    loading, 
    error, 
    isMarkingVisit, 
    markVisit,
    updateVisit,
    deleteVisit,
    getRecentVisits,
    getVisitStats,
    searchVisits,
    refetch 
  } = useBusinessVisits();
  
  const { clients } = useClients();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<BusinessVisit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<BusinessVisit | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(searchQuery, 300);
  
  // Map state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (results && results.length > 0) {
        const place = results[0];
        
        // Create a proper business name (prefer place name, fallback to generic)
        // Priority: place.name > place.formattedAddress business name > generic fallback
        let businessName = 'Business Location';
        
        if (place.name && place.name !== place.street && place.name !== place.city) {
          // Use place.name if it's meaningful (not just street or city)
          businessName = place.name;
        } else if (place.formattedAddress) {
          // Try to extract business name from formatted address
          const addressParts = place.formattedAddress.split(',');
          const firstPart = addressParts[0]?.trim();
          if (firstPart && !firstPart.match(/^\d+/)) {
            // If first part doesn't start with number, it might be a business name
            businessName = firstPart;
          }
        }
        
        // Create full address without including the business name
        const addressParts = [
          place.streetNumber && place.street ? `${place.streetNumber} ${place.street}` : place.street,
          place.city,
          place.region,
          place.postalCode,
          place.country
        ].filter(Boolean);
        
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Unknown Address';
        
        return {
          businessName,
          address
        };
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    }
    return null;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setBusinessName('');
    setManualAddress('');
    setSelectedLocation(null);
    setEditingVisit(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (visit: BusinessVisit) => {
    setEditingVisit(visit);
    setSelectedClientId(visit.client_id || '');
    // Extract business name from location if available
    const locationParts = visit.location ? visit.location.split(' - ') : [];
    setBusinessName(locationParts[0] || '');
    setShowEditModal(true);
  };

  const handleCreateVisit = async () => {
    // Client selection is now optional
    const visitData = {
      clientId: selectedClientId || undefined,
      businessName: businessName || undefined,
      manualAddress: manualAddress || undefined,
      selectedCoordinates: selectedLocation,
    };
    
    const result = await markVisit(visitData.clientId, visitData.businessName, visitData.manualAddress, visitData.selectedCoordinates || undefined);
    if (result) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleUpdateVisit = async () => {
    if (!editingVisit || !selectedClientId) {
      Alert.alert('Error', 'Please select a client.');
      return;
    }

    try {
      // Since we can only update location in the simplified schema
      const locationPrefix = businessName ? `${businessName} - ` : 'Business Visit - ';
      const currentLocation = editingVisit.location || '';
      const locationParts = currentLocation ? currentLocation.split(' - ') : [];
      const addressPart = locationParts.slice(1).join(' - ') || 'Unknown Location'; // Keep the address part
      
      const newLocation = locationPrefix + addressPart;
      
      await updateVisit(editingVisit.id, {
        location: newLocation
      });
      
      setShowEditModal(false);
      resetForm();
      Alert.alert('Success', 'Visit updated successfully!');
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeleteVisit = async (visit: BusinessVisit) => {
    try {
      await deleteVisit(visit.id);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Visit deleted successfully!');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Enhanced filtered and sorted visits with fuzzy search
  const filteredAndSortedVisits = React.useMemo(() => {
    let result = visits;

    // Apply new filter system
    if (Object.keys(selectedFilters).length > 0) {
      result = result.filter(visit => {
        return Object.entries(selectedFilters).every(([groupId, values]) => {
          if (values.length === 0) return true;
          
          switch (groupId) {
            case 'date_range':
              // Simple date range filtering - in a real app you'd use actual dates
              const stats = getVisitStats();
              if (values.includes('today')) {
                const todayVisits = result.slice(0, Math.ceil(result.length * 0.1));
                return todayVisits.includes(visit);
              }
              if (values.includes('week')) {
                const weekVisits = getRecentVisits();
                return weekVisits.includes(visit);
              }
              if (values.includes('month')) {
                const monthVisits = result.slice(0, Math.ceil(result.length * 0.8));
                return monthVisits.includes(visit);
              }
              return true;
            case 'client_assignment':
              if (values.includes('assigned')) {
                return visit.client_id && visit.client_id.trim() !== '';
              }
              if (values.includes('unassigned')) {
                return !visit.client_id || visit.client_id.trim() === '';
              }
              return true;
            default:
              return true;
          }
        });
      });
    }

    // Apply fuzzy search
    if (debouncedSearch.trim()) {
      const searchResults = fuzzySearchItems(result, debouncedSearch, VISIT_SEARCH_FIELDS);
      result = searchResults.map(r => r.item);
    }

    // Apply sorting
    if (selectedSort) {
      const sortOption = VISIT_SORT_OPTIONS.find(opt => opt.key === selectedSort);
      if (sortOption) {
        result = sortItems(result, { field: sortOption.field as keyof BusinessVisit, direction: sortOption.direction });
      }
    } else {
      // Default sort: newest first
      result = sortItems(result, { field: 'created_at' as keyof BusinessVisit, direction: 'desc' });
    }

    return result;
  }, [visits, selectedFilters, debouncedSearch, selectedSort]);
  
  // Helper to check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  const formatLocation = (location: string | null) => {
    // Extract business name and address from location string
    if (!location) {
      return {
        businessName: 'Business Visit',
        address: 'Unknown Location'
      };
    }
    const parts = location.split(' - ');
    if (parts.length >= 2) {
      return {
        businessName: parts[0],
        address: parts.slice(1).join(' - ')
      };
    }
    return {
      businessName: 'Business Visit',
      address: location
    };
  };

  const getLocationCoordinates = (location: string | null) => {
    // Extract coordinates from location string (lat, lng)
    if (!location) {
      return null;
    }
    const match = location.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }
    return null;
  };

  const renderVisit = ({ item }: { item: BusinessVisit }) => {
    const locationInfo = formatLocation(item.location);
    const coordinates = getLocationCoordinates(item.location);
    const client = clients.find(c => c.id === item.client_id);

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {locationInfo.businessName}
            </Text>
            {client && (
              <Text className="text-blue-600 text-sm font-medium mb-1">
                Client: {client.name}
              </Text>
            )}
            <View className="flex-row items-center mb-2">
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1 flex-1" numberOfLines={2}>
                {locationInfo.address}
              </Text>
            </View>
            {coordinates && (
              <Text className="text-xs text-gray-400">
                {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
              </Text>
            )}
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
            <View className="p-2 bg-green-100 rounded-lg">
              <Ionicons name="location" size={16} color="#34C759" />
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-text-secondary mt-4 animate-fade-in">Loading visits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-4 rounded-card mb-4">
            <MapPin size={32} color="#EF4444" />
          </View>
          <Text className="text-text-primary text-lg font-bold mt-4">Error Loading Visits</Text>
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

  const filteredVisits = filteredAndSortedVisits;
  const stats = getVisitStats();

  return (
    <SafeAreaView className="flex-1 bg-bg-secondary">
      <View className="px-page py-section">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8 animate-enter">
          <View>
            <Text className="text-3xl font-bold text-text-primary">
              Business Visits
            </Text>
            <Text className="text-text-muted mt-1">{filteredVisits.length} visits tracked</Text>
            <View className="flex-row space-x-4 mt-2">
              <View className="status-info px-3 py-1 rounded-full">
                <Text className="text-xs font-medium">{stats.total} total</Text>
              </View>
              <View className="status-success px-3 py-1 rounded-full">
                <Text className="text-xs font-medium">{stats.recent} recent</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            className={`flex-row items-center ${
              isMarkingVisit ? 'bg-gray-100 border border-gray-300 rounded-button p-3' : 'btn-primary'
            }`}
            onPress={handleOpenCreateModal}
            disabled={isMarkingVisit}
          >
            {isMarkingVisit ? (
              <ActivityIndicator size="small" color="#00D4AA" />
            ) : (
              <Plus size={20} color="white" />
            )}
            <Text className={`font-semibold ml-2 ${
              isMarkingVisit ? 'text-text-accent' : 'text-white'
            }`}>
              {isMarkingVisit ? 'Creating...' : 'Mark Visit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {visits.length > 0 && (
          <View className="flex-row gap-4 mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-gray-900">{stats.total}</Text>
              <Text className="text-gray-600 text-sm">Total Visits</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-green-600">{stats.recent}</Text>
              <Text className="text-gray-600 text-sm">Recent</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1">
              <Text className="text-xl font-bold text-blue-600">{clients.length}</Text>
              <Text className="text-gray-600 text-sm">Clients</Text>
            </View>
          </View>
        )}

        {/* Enhanced Search Bar with Filters and Sort */}
        <View className="mb-6 gap-4">
          {/* Search Input with Sort */}
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <SearchInput
                placeholder="Search visits by location, business name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </View>
            
            <SortDropdown
              options={VISIT_SORT_OPTIONS}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
              placeholder="Sort"
              className="min-w-[120px] max-w-[140px]"
            />
          </View>
          
          {/* Filter Bar */}
          <FilterBar
            filterGroups={VISIT_FILTER_GROUPS}
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

        {/* Visits List */}
        <FlatList
          data={filteredVisits}
          renderItem={renderVisit}
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
                name={searchQuery || hasActiveFilters ? "search-outline" : "location-outline"} 
                size={64} 
                color="#9CA3AF" 
              />
              <Text className="text-gray-500 text-lg mt-4">
                {searchQuery || hasActiveFilters ? 'No visits found' : 'No visits recorded'}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filter'
                  : 'Tap "Mark Visit" to record your business visits with GPS location'
                }
              </Text>
            </View>
          }
        />

        {/* Create Visit Modal */}
        <SimpleFormModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Mark New Visit"
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
                  <Text className="text-sm font-medium text-gray-700 mb-2">Business Name (Optional)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter business name"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Manual Address (Optional)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    value={manualAddress}
                    onChangeText={setManualAddress}
                    placeholder="Enter address manually"
                    multiline
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Client (Optional)</Text>
                  {clients.length === 0 ? (
                    <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                      <Text className="text-gray-500 text-center">No clients available</Text>
                      <Text className="text-gray-400 text-center text-sm mt-1">
                        Visit will be marked without client assignment
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <TouchableOpacity
                        className={`px-4 py-3 border border-gray-300 rounded-lg mb-2 flex-row items-center justify-between ${
                          !selectedClientId ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                        onPress={() => setSelectedClientId('')}
                      >
                        <Text className={`font-medium ${
                          !selectedClientId ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          No client (standalone visit)
                        </Text>
                        {!selectedClientId && (
                          <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                        )}
                      </TouchableOpacity>
                      <View className="border border-gray-300 rounded-lg" style={{ maxHeight: 200 }}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {clients.slice(0, 5).map((item, index) => (
                            <TouchableOpacity
                              key={item.id}
                              className={`px-4 py-3 border-b border-gray-200 flex-row items-center justify-between ${
                                selectedClientId === item.id ? 'bg-blue-50' : 'bg-white'
                              } ${index === Math.min(clients.length - 1, 4) ? 'border-b-0' : ''}`}
                              onPress={() => setSelectedClientId(item.id)}
                            >
                              <View className="flex-1">
                                <Text className={`font-medium ${
                                  selectedClientId === item.id ? 'text-blue-700' : 'text-gray-900'
                                }`}>
                                  {item.name}
                                </Text>
                                <Text className="text-gray-500 text-sm">{item.email}</Text>
                              </View>
                              {selectedClientId === item.id && (
                                <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                              )}
                            </TouchableOpacity>
                          ))}
                          {clients.length > 5 && (
                            <View className="px-4 py-2 bg-gray-50">
                              <Text className="text-gray-500 text-sm text-center">
                                +{clients.length - 5} more clients...
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>

                {/* Interactive Map */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Select Location</Text>
                  <View className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: 200 }}>
                    <MapView
                      style={{ flex: 1 }}
                      region={mapRegion}
                      onPress={async (event) => {
                        const { latitude, longitude } = event.nativeEvent.coordinate;
                        setSelectedLocation({ latitude, longitude });
                        
                        // Auto-fill business name and address from coordinates
                        const locationInfo = await reverseGeocode(latitude, longitude);
                        if (locationInfo) {
                          // Always update fields when a new location is selected
                          setBusinessName(locationInfo.businessName);
                          setManualAddress(locationInfo.address);
                        }
                      }}
                      showsUserLocation={true}
                      showsMyLocationButton={true}
                    >
                      {selectedLocation && (
                        <Marker
                          coordinate={selectedLocation}
                          title="Selected Location"
                          description="Tap to move this marker"
                          pinColor="red"
                        />
                      )}
                    </MapView>
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">
                    Tap on the map to select a location, or use GPS detection below
                  </Text>
                </View>

                <View className="bg-blue-50 px-4 py-3 rounded-lg">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#00D4AA" />
                    <Text className="text-blue-700 font-medium ml-2">
                      {selectedLocation ? 'Custom location selected' : 'GPS location will be used'}
                    </Text>
                  </View>
                  <Text className="text-blue-600 text-sm mt-1">
                    {selectedLocation 
                      ? `Selected: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                      : 'Your current GPS location will be recorded with this visit'
                    }
                  </Text>
                </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-4"
                onPress={() => setShowCreateModal(false)}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-lg py-4 flex-row items-center justify-center ${
                  !isMarkingVisit ? 'bg-primary' : 'bg-gray-300'
                }`}
                onPress={handleCreateVisit}
                disabled={isMarkingVisit}
              >
                {isMarkingVisit ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="location" size={20} color={!isMarkingVisit ? "white" : "#9CA3AF"} />
                )}
                <Text className={`font-semibold text-base ml-1 ${
                  !isMarkingVisit ? 'text-white' : 'text-gray-500'
                }`}>
                  {isMarkingVisit ? 'Marking...' : 'Mark Visit'}
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

        {/* Edit Visit Modal */}
        <SimpleFormModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Visit"
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
                  <Text className="text-sm font-medium text-gray-700 mb-2">Business Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter business name"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Client *</Text>
                  <View className="border border-gray-300 rounded-lg" style={{ maxHeight: 200 }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {clients.map((item, index) => (
                        <TouchableOpacity
                          key={item.id}
                          className={`px-4 py-3 border-b border-gray-200 flex-row items-center justify-between ${
                            selectedClientId === item.id ? 'bg-blue-50' : 'bg-white'
                          } ${index === clients.length - 1 ? 'border-b-0' : ''}`}
                          onPress={() => setSelectedClientId(item.id)}
                        >
                          <View className="flex-1">
                            <Text className={`font-medium ${
                              selectedClientId === item.id ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </Text>
                            <Text className="text-gray-500 text-sm">{item.email}</Text>
                          </View>
                          {selectedClientId === item.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {editingVisit && (
                  <View className="bg-gray-50 px-4 py-3 rounded-lg">
                    <Text className="text-gray-700 font-medium mb-1">Current Location:</Text>
                    <Text className="text-gray-600 text-sm">
                      {formatLocation(editingVisit.location).address}
                    </Text>
                  </View>
                )}

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-4"
                onPress={() => setShowEditModal(false)}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-lg py-4 ${
                  selectedClientId ? 'bg-primary' : 'bg-gray-300'
                }`}
                onPress={handleUpdateVisit}
                disabled={!selectedClientId}
              >
                <Text className={`text-center font-semibold text-base ${
                  selectedClientId ? 'text-white' : 'text-gray-500'
                }`}>
                  Update Visit
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
          title="Delete Visit"
          message={`Are you sure you want to delete this visit to "${showDeleteConfirm ? formatLocation(showDeleteConfirm.location).businessName : ''}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => showDeleteConfirm && handleDeleteVisit(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          destructive={true}
          icon="trash"
        />
      </View>
    </SafeAreaView>
  );
}