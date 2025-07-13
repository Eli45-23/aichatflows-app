import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { BusinessVisit, Client } from '../types';
import { notifyVisitLogged } from '../utils/notifications';
import { useAuth } from './useAuth';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Business Visits Hook] ${message}`, data || '');
  }
};

interface BusinessVisitsHookState {
  visits: BusinessVisit[];
  loading: boolean;
  error: string | null;
  isMarkingVisit: boolean;
}

export function useBusinessVisits() {
  const { user } = useAuth();
  const [state, setState] = useState<BusinessVisitsHookState>({
    visits: [],
    loading: true,
    error: null,
    isMarkingVisit: false,
  });

  const { visits, loading, error, isMarkingVisit } = state;

  const updateState = (updates: Partial<BusinessVisitsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch all business visits from new schema
  const fetchVisits = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching business visits from new schema...');

      const { data, error } = await supabase
        .from('business_visits')
        .select(`
          id,
          client_id,
          location
        `)
        .order('id', { ascending: false });

      if (error) {
        debugLog('Error fetching visits:', error);
        throw error;
      }

      // Filter out null visits and ensure all required properties exist
      const validVisits = (data || []).filter(visit => 
        visit && 
        visit.id && 
        typeof visit.id === 'string'
      );
      
      debugLog('Visits fetched successfully from new schema:', validVisits.length);
      updateState({ visits: validVisits, loading: false });
      return validVisits;
    } catch (error: any) {
      debugLog('Exception fetching visits:', error);
      const errorMessage = error.message;
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load business visits: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Mark a new business visit with enhanced validation and location options
  const markVisit = async (
    clientId?: string, 
    businessName?: string, 
    manualAddress?: string,
    selectedCoordinates?: {latitude: number, longitude: number}
  ) => {
    try {
      updateState({ isMarkingVisit: true });
      debugLog('Marking new business visit in new schema...');

      // Client ID is now optional - verify only if provided
      if (clientId && typeof clientId === 'string' && clientId.trim() !== '') {
        // Verify client exists in database
        const { data: clientExists, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('id', clientId)
          .single();

        if (clientError || !clientExists) {
          throw new Error('Selected client not found. Please select a valid client.');
        }
      } else {
        // Clear clientId if empty string provided
        clientId = undefined;
      }

      let latitude: number;
      let longitude: number;

      // Prioritize selected coordinates over GPS
      if (selectedCoordinates) {
        debugLog('Using selected coordinates from map...');
        latitude = selectedCoordinates.latitude;
        longitude = selectedCoordinates.longitude;
        debugLog('Using selected coordinates:', { latitude, longitude });
      } else {
        // Request location permission for GPS fallback
        let permissionResult;
        try {
          permissionResult = await Location.requestForegroundPermissionsAsync();
        } catch (permissionError) {
          debugLog('Permission request failed:', permissionError);
          Alert.alert('Permission Error', 'Unable to request location permission. Please enable location services in settings.');
          return null;
        }

        if (permissionResult.status !== 'granted') {
          Alert.alert(
            'Location Permission Required', 
            'Location access is required to mark business visits. Please enable location permissions in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
            ]
          );
          return null;
        }

        // Get current location with timeout and accuracy options
        let location;
        try {
          debugLog('Getting current GPS location...');
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch (locationError) {
          debugLog('Failed to get high accuracy location, trying balanced:', locationError);
          try {
            location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
          } catch (fallbackError) {
            debugLog('Failed to get location:', fallbackError);
            Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
            return null;
          }
        }

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        debugLog('Got GPS location:', { latitude, longitude, accuracy: location.coords.accuracy });
      }

      // Validate coordinates
      if (!latitude || !longitude || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        throw new Error('Invalid GPS coordinates received');
      }

      // Determine address string - prioritize manual address over geocoding
      let addressString: string;
      
      if (manualAddress && manualAddress.trim()) {
        debugLog('Using manual address...');
        addressString = manualAddress.trim();
      } else {
        // Fall back to reverse geocoding
        addressString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
          debugLog('Reverse geocoding location...');
          const address = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (address && address[0]) {
            const addr = address[0];
            const addressParts = [
              addr.streetNumber,
              addr.street,
              addr.city,
              addr.region,
              addr.postalCode,
              addr.country
            ].filter(Boolean);
            
            if (addressParts.length > 0) {
              addressString = addressParts.join(', ');
            }
          }
        } catch (geocodeError) {
          debugLog('Geocoding failed, using coordinates:', geocodeError);
          // Keep coordinate fallback
        }
      }

      debugLog('Address resolved:', addressString);

      // Prepare visit data with validation for new schema
      const sanitizedLocation = `${businessName || 'Business Visit'} - ${addressString} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`.substring(0, 500);

      const visitData = {
        client_id: clientId || null, // Handle optional client assignment
        location: sanitizedLocation,
      };

      const { data, error } = await supabase
        .from('business_visits')
        .insert([visitData])
        .select(`
          id,
          client_id,
          location
        `)
        .single();

      if (error) {
        debugLog('Error creating visit:', error);
        throw error;
      }

      debugLog('Visit marked successfully in new schema:', data);
      
      // Optimistic update to local state with null check
      if (data && data.id) {
        updateState({ visits: [data, ...visits] });
      }
      
      // Trigger notification
      if (user?.id) {
        try {
          // Get client data if clientId exists
          let client: Client | undefined;
          if (data.client_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('*')
              .eq('id', data.client_id)
              .single();
            client = clientData || undefined;
          }
          
          await notifyVisitLogged(data, client, user.id);
        } catch (notificationError) {
          debugLog('Failed to send visit notification:', notificationError);
          // Don't throw error for notification failures
        }
      }
      
      Alert.alert('Success', 'Business visit marked successfully!');
      return data;

    } catch (error: any) {
      debugLog('Exception marking visit:', error);
      Alert.alert('Error', `Failed to mark visit: ${error.message}`);
      return null;
    } finally {
      updateState({ isMarkingVisit: false });
    }
  };

  // Update visit
  const updateVisit = async (id: string, updates: Partial<Omit<BusinessVisit, 'id' | 'visited_at'>>) => {
    try {
      debugLog('Updating visit in new schema...', { id, updates });

      // Validate visit exists with null check
      const existingVisit = visits.find(v => v && v.id === id);
      if (!existingVisit) {
        throw new Error('Visit not found');
      }

      // Prepare sanitized updates
      const sanitizedUpdates: any = {};

      // business_name field doesn't exist in new schema
      // if (updates.business_name !== undefined) {
      //   sanitizedUpdates.business_name = updates.business_name.trim().substring(0, 100);
      // }
      if (updates.location !== undefined && updates.location !== null) {
        sanitizedUpdates.location = updates.location.trim().substring(0, 200);
      }
      // coordinates field doesn't exist in new schema
      // if (updates.coordinates !== undefined) {
      //   // Validate coordinates
      //   const { latitude, longitude } = updates.coordinates;
      //   if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      //     throw new Error('Invalid coordinates');
      //   }
      //   sanitizedUpdates.coordinates = { latitude, longitude };
      // }
      // notes field doesn't exist in new schema
      // if (updates.notes !== undefined) {
      //   sanitizedUpdates.notes = updates.notes?.trim().substring(0, 500) || null;
      // }

      const { data, error } = await supabase
        .from('business_visits')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select(`
          id,
          client_id,
          location
        `)
        .single();

      if (error) {
        debugLog('Error updating visit:', error);
        throw error;
      }

      debugLog('Visit updated successfully in new schema:', data);
      
      // Update local state with null check
      if (data && data.id) {
        updateState({ 
          visits: visits.map(visit => visit.id === id ? data : visit)
        });
      }
      
      return data;
    } catch (error: any) {
      debugLog('Exception updating visit:', error);
      Alert.alert('Error', `Failed to update visit: ${error.message}`);
      throw error;
    }
  };

  // Delete visit
  const deleteVisit = async (id: string) => {
    try {
      debugLog('Deleting visit from new schema...', id);

      // Validate visit exists with null check
      const existingVisit = visits.find(v => v && v.id === id);
      if (!existingVisit) {
        throw new Error('Visit not found');
      }

      const { error } = await supabase
        .from('business_visits')
        .delete()
        .eq('id', id);

      if (error) {
        debugLog('Error deleting visit:', error);
        throw error;
      }

      debugLog('Visit deleted successfully from new schema');
      
      // Remove from local state with null check
      updateState({ 
        visits: visits.filter(visit => visit && visit.id !== id)
      });
      
    } catch (error: any) {
      debugLog('Exception deleting visit:', error);
      Alert.alert('Error', `Failed to delete visit: ${error.message}`);
      throw error;
    }
  };

  // Get visits for specific date range - disabled since visited_at field doesn't exist
  const getVisitsForDateRange = (startDate: Date, endDate: Date) => {
    // Without timestamp field, we can't filter by date
    return visits;
  };

  // Get recent visits (last 7 days)
  const getRecentVisits = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return getVisitsForDateRange(sevenDaysAgo, new Date());
  };

  // Get visits by business name - disabled since business_name field doesn't exist
  const getVisitsByBusiness = (businessName: string) => {
    // business_name field doesn't exist in new schema
    return visits;
  };

  // Get visit statistics
  const getVisitStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: visits.length,
      today: getVisitsForDateRange(today, new Date()).length,
      thisWeek: getVisitsForDateRange(thisWeek, new Date()).length,
      thisMonth: getVisitsForDateRange(thisMonth, new Date()).length,
      recent: getRecentVisits().length,
    };
  };

  // Search visits by business name or location
  const searchVisits = (query: string) => {
    if (!query.trim()) return visits;
    
    const lowercaseQuery = query.toLowerCase();
    return visits.filter(visit => {
      // Null check and business_name and notes fields don't exist in new schema
      if (!visit) return false;
      const location = visit.location ? visit.location.toLowerCase() : '';
      return location.includes(lowercaseQuery);
    });
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchVisits();

    // Subscribe to real-time changes with enhanced error handling
    const subscription = supabase
      .channel('visits_realtime_new_schema')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'business_visits' },
        (payload) => {
          debugLog('Real-time visit change in new schema:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              const newVisit = payload.new as BusinessVisit;
              updateState({ 
                visits: [newVisit, ...visits.filter(v => v.id !== newVisit.id)]
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedVisit = payload.new as BusinessVisit;
              updateState({ 
                visits: visits.map(visit => 
                  visit.id === updatedVisit.id ? updatedVisit : visit
                )
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              updateState({ 
                visits: visits.filter(visit => visit.id !== deletedId)
              });
            }
          } catch (error) {
            debugLog('Error handling real-time update:', error);
            // Re-fetch data on error to ensure consistency
            fetchVisits(false);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to visits real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Channel error:', err);
        } else if (status === 'TIMED_OUT') {
          debugLog('Real-time subscription timed out');
        } else if (status === 'CLOSED') {
          debugLog('Real-time subscription closed');
        }
      });

    return () => {
      debugLog('Cleaning up visits subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    visits,
    loading,
    error,
    isMarkingVisit,
    markVisit,
    updateVisit,
    deleteVisit,
    getVisitsForDateRange,
    getRecentVisits,
    getVisitsByBusiness,
    getVisitStats,
    searchVisits,
    refetch: () => fetchVisits(true),
    refetchSilent: () => fetchVisits(false),
  };
}