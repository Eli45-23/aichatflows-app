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
      debugLog('Creating client in new schema...', clientData);

      // Validate required fields
      if (!clientData.name || !clientData.email) {
        throw new Error('Name and email are required fields');
      }

      // Prepare client data with timestamps
      const now = new Date().toISOString();
      const newClientData = {
        name: clientData.name.trim(),
        email: clientData.email.trim().toLowerCase(),
        phone: clientData.phone?.trim() || '',
        status: clientData.status || 'active' as Client['status'],
        // notes and updated_at fields don't exist in new schema
        created_at: now,
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([newClientData])
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
        debugLog('Error creating client:', error);
        throw error;
      }

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
      debugLog('Exception creating client:', error);
      Alert.alert('Error', `Failed to create client: ${error.message}`);
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