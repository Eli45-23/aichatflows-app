import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Client } from '../types';
import { notifyClientAdded } from '../utils/notifications';
import { useAuth } from './useAuth';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Clients Hook] ${message}`, data || '');
  }
};

interface ClientsHookState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

export function useClients() {
  const { user } = useAuth();
  const [state, setState] = useState<ClientsHookState>({
    clients: [],
    loading: true,
    error: null,
  });

  const { clients, loading, error } = state;

  const updateState = (updates: Partial<ClientsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch all clients
  const fetchClients = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching clients from new schema...');

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        debugLog('Error fetching clients:', error);
        throw error;
      }

      debugLog('Clients fetched successfully from new schema:', data?.length);
      updateState({ clients: data || [], loading: false });
      return data || [];
    } catch (error: any) {
      debugLog('Exception fetching clients:', error);
      const errorMessage = error.message;
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load clients: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Create new client
  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      debugLog('Creating client with comprehensive data...', clientData);

      // Validate required fields
      if (!clientData.name || !clientData.email) {
        throw new Error('Name and email are required fields');
      }

      // Prepare comprehensive client data with timestamps
      const now = new Date().toISOString();
      const newClientData = {
        // Basic required fields
        name: clientData.name.trim(),
        email: clientData.email.trim().toLowerCase(),
        phone: clientData.phone?.trim() || '',
        status: clientData.status || 'active' as Client['status'],
        created_at: now,
        
        // Social media handles
        instagram_handle: clientData.instagram_handle?.trim() || null,
        facebook_url: clientData.facebook_url?.trim() || null,
        tiktok_handle: clientData.tiktok_handle?.trim() || null,
        
        // Business preferences
        delivery_preference: clientData.delivery_preference || null,
        platform_preference: clientData.platform_preference || null,
        plan: clientData.plan || null,
        payment_status: clientData.payment_status || 'unpaid',
        signed_in_person: clientData.signed_in_person || false,
        payment_method: clientData.payment_method?.trim() || null,
        notes: clientData.notes?.trim() || null,
        
        // Comprehensive business details
        business_name: clientData.business_name?.trim() || null,
        other_platforms: clientData.other_platforms?.trim() || null,
        business_type: clientData.business_type?.trim() || null,
        business_niche: clientData.business_niche?.trim() || null,
        common_customer_question: clientData.common_customer_question?.trim() || null,
        products_or_services: clientData.products_or_services?.trim() || null,
        has_faqs: clientData.has_faqs || false,
        faq_location: clientData.faq_location?.trim() || null,
        consent_to_share: clientData.consent_to_share || false,
        
        // Login credentials (if provided)
        instagram_password: clientData.instagram_password?.trim() || null,
        facebook_password: clientData.facebook_password?.trim() || null,
        tiktok_password: clientData.tiktok_password?.trim() || null,
        
        // Delivery details
        delivery_method: clientData.delivery_method?.trim() || null,
        delivery_notes: clientData.delivery_notes?.trim() || null,
        pickup_method: clientData.pickup_method?.trim() || null,
        pickup_notes: clientData.pickup_notes?.trim() || null,
        
        // Photo upload
        photo_url: clientData.photo_url?.trim() || null,
      };

      debugLog('Prepared client data for insertion:', newClientData);

      const { data, error } = await supabase
        .from('clients')
        .insert([newClientData])
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at,
          instagram_handle,
          facebook_url,
          tiktok_handle,
          delivery_preference,
          platform_preference,
          plan,
          payment_status,
          signed_in_person,
          payment_method,
          notes,
          business_name,
          other_platforms,
          business_type,
          business_niche,
          common_customer_question,
          products_or_services,
          has_faqs,
          faq_location,
          consent_to_share,
          instagram_password,
          facebook_password,
          tiktok_password,
          delivery_method,
          delivery_notes,
          pickup_method,
          pickup_notes,
          photo_url
        `)
        .single();

      if (error) {
        console.error('🚨 Client Creation Error:', error);
        debugLog('Error creating client:', error);
        
        // Handle specific schema-related errors
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const columnMatch = error.message.match(/'([^']+)'/);
          const missingColumn = columnMatch ? columnMatch[1] : 'unknown column';
          
          console.warn(`🚨 Database Schema Error: Missing column '${missingColumn}' in clients table`);
          console.warn(`💡 Solution: Run the database migration at: migrations/02_add_missing_client_columns.sql`);
          console.warn(`🔄 After running migration, execute: NOTIFY pgrst, 'reload schema';`);
          
          throw new Error(`Database schema is missing the '${missingColumn}' column. Please run the database migration to add missing columns.`);
        }
        
        // Handle other potential schema cache issues
        if (error.message.includes('schema cache') || error.code === '42P01') {
          console.warn(`🚨 Schema Cache Error: ${error.message}`);
          console.warn(`🔄 Solution: Run 'NOTIFY pgrst, 'reload schema';' in your Supabase SQL editor`);
          
          throw new Error('Database schema cache needs to be refreshed. Please reload the schema cache and try again.');
        }
        
        throw error;
      }

      // Handle case where no error but data is null/undefined
      if (!data) {
        console.error('🚨 Client Creation Failed: No data returned from insert operation');
        console.error('📊 Insert operation completed without error but returned no data');
        console.error('🔍 This could indicate:');
        console.error('   1. Row Level Security (RLS) policies blocking the insert');
        console.error('   2. Database triggers or constraints preventing insertion');
        console.error('   3. Supabase client configuration issues');
        console.error('💡 Check your Supabase RLS policies for the clients table');
        
        throw new Error('Client creation returned no data. This may be due to database permissions or Row Level Security policies. Please check your Supabase configuration.');
      }

      console.log('✅ Client created successfully:', {
        id: data.id,
        name: data.name,
        email: data.email
      });
      debugLog('Client created successfully in new schema:', data);
      
      // Optimistic update to local state
      updateState({ clients: [data, ...clients] });
      
      // Trigger notification
      if (user?.id) {
        try {
          await notifyClientAdded(data, user.id);
        } catch (notificationError) {
          debugLog('Failed to send notification:', notificationError);
          // Don't throw error for notification failures
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Client Creation Exception:', error);
      debugLog('Exception creating client:', error);
      
      // Provide specific error messages based on error type
      let userMessage = 'Failed to create client';
      let consoleMessage = `Failed to create client: ${error.message}`;
      
      if (error.message.includes('schema') || error.message.includes('column')) {
        userMessage = 'Database schema error. Please check migration status.';
        consoleMessage = 'Database schema issue detected. Check console for migration instructions.';
      } else if (error.message.includes('permission') || error.message.includes('RLS') || error.message.includes('policy')) {
        userMessage = 'Permission denied. Please check database access rights.';
        consoleMessage = 'Database permission issue. Check RLS policies and authentication.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection.';
        consoleMessage = 'Network connectivity issue detected.';
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        userMessage = 'Invalid data provided. Please check all required fields.';
        consoleMessage = 'Data validation failed. Check required fields and data types.';
      }
      
      console.error(`🔍 Error Analysis: ${consoleMessage}`);
      Alert.alert('Error', userMessage);
      throw error;
    }
  };

  // Update client
  const updateClient = async (id: string, updates: Partial<Omit<Client, 'id' | 'created_at'>>) => {
    try {
      debugLog('Updating client in new schema...', { id, updates });

      // Validate client exists
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      // Prepare sanitized updates
      const sanitizedUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined && updates.name !== null) {
        sanitizedUpdates.name = updates.name.trim();
      }
      if (updates.email !== undefined && updates.email !== null) {
        sanitizedUpdates.email = updates.email.trim().toLowerCase();
      }
      if (updates.phone !== undefined && updates.phone !== null) {
        sanitizedUpdates.phone = updates.phone.trim();
      }
      if (updates.status !== undefined) {
        sanitizedUpdates.status = updates.status;
      }
      // notes field doesn't exist in new schema
      // if (updates.notes !== undefined) {
      //   sanitizedUpdates.notes = updates.notes?.trim() || null;
      // }

      const { data, error } = await supabase
        .from('clients')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at
        `)
        .single();

      if (error) {
        debugLog('Error updating client:', error);
        throw error;
      }

      debugLog('Client updated successfully in new schema:', data);
      
      // Update local state
      updateState({ 
        clients: clients.map(client => client.id === id ? data : client)
      });
      
      return data;
    } catch (error: any) {
      debugLog('Exception updating client:', error);
      Alert.alert('Error', `Failed to update client: ${error.message}`);
      throw error;
    }
  };

  // Delete client (with cascade protection)
  const deleteClient = async (id: string) => {
    try {
      debugLog('Deleting client from new schema...', id);

      // Validate client exists
      const existingClient = clients.find(c => c.id === id);
      if (!existingClient) {
        throw new Error('Client not found');
      }

      // Check for related records before deletion
      const [paymentsCheck, submissionsCheck] = await Promise.all([
        supabase.from('payments').select('id').eq('client_id', id).limit(1),
        supabase.from('onboarding_submissions').select('id').eq('client_id', id).limit(1),
      ]);

      const hasRelatedData = 
        (paymentsCheck.data && paymentsCheck.data.length > 0) ||
        (submissionsCheck.data && submissionsCheck.data.length > 0);

      if (hasRelatedData) {
        Alert.alert(
          'Cannot Delete Client',
          'This client has associated payments or submissions. Please remove those first or set client status to cancelled.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Set to Cancelled', 
              onPress: () => updateClient(id, { status: 'cancelled' })
            }
          ]
        );
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        debugLog('Error deleting client:', error);
        throw error;
      }

      debugLog('Client deleted successfully from new schema');
      
      // Remove from local state
      updateState({ 
        clients: clients.filter(client => client.id !== id)
      });
      
    } catch (error: any) {
      debugLog('Exception deleting client:', error);
      Alert.alert('Error', `Failed to delete client: ${error.message}`);
      throw error;
    }
  };

  // Get clients by status
  const getClientsByStatus = (status: Client['status']) => {
    return clients.filter(client => client.status === status);
  };

  // Search clients
  const searchClients = (query: string) => {
    if (!query.trim()) return clients;
    
    const lowercaseQuery = query.toLowerCase();
    return clients.filter(client => 
      (client.name && client.name.toLowerCase().includes(lowercaseQuery)) ||
      (client.email && client.email.toLowerCase().includes(lowercaseQuery)) ||
      (client.phone && client.phone.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Filter clients
  const filterClients = (status: 'all' | Client['status'] | 'unknown', searchQuery: string = '') => {
    let filtered = clients;
    
    // Apply status filter
    if (status !== 'all') {
      if (status === 'unknown') {
        filtered = filtered.filter(client => !client.status || client.status === null);
      } else {
        filtered = filtered.filter(client => client.status === status);
      }
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(lowercaseQuery) ||
        client.email.toLowerCase().includes(lowercaseQuery) ||
        client.phone?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    return filtered;
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchClients();

    // Subscribe to real-time changes with enhanced error handling
    const subscription = supabase
      .channel('clients_realtime_new_schema')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          debugLog('Real-time client change in new schema:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              const newClient = payload.new as Client;
              updateState({ 
                clients: [newClient, ...clients.filter(c => c.id !== newClient.id)]
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedClient = payload.new as Client;
              updateState({ 
                clients: clients.map(client => 
                  client.id === updatedClient.id ? updatedClient : client
                )
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              updateState({ 
                clients: clients.filter(client => client.id !== deletedId)
              });
            }
          } catch (error) {
            debugLog('Error handling real-time update:', error);
            // Re-fetch data on error to ensure consistency
            fetchClients(false);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to clients real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Channel error:', err);
        } else if (status === 'TIMED_OUT') {
          debugLog('Real-time subscription timed out');
        } else if (status === 'CLOSED') {
          debugLog('Real-time subscription closed');
        }
      });

    return () => {
      debugLog('Cleaning up clients subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientsByStatus,
    searchClients,
    filterClients,
    refetch: () => fetchClients(true),
    refetchSilent: () => fetchClients(false),
  };
}