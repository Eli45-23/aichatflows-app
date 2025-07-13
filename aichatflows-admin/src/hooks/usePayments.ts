import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Payment, Client } from '../types';
import { notifyPaymentReceived } from '../utils/notifications';
import { useAuth } from './useAuth';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Payments Hook] ${message}`, data || '');
  }
};

interface PaymentsHookState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
}

export function usePayments() {
  const { user } = useAuth();
  const [state, setState] = useState<PaymentsHookState>({
    payments: [],
    loading: true,
    error: null,
  });

  const { payments, loading, error } = state;

  const updateState = (updates: Partial<PaymentsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch all payments with client data from new schema
  const fetchPayments = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching payments from new schema...');

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          client_id,
          amount,
          status,
          payment_date,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        debugLog('Error fetching payments:', error);
        throw error;
      }

      debugLog('Payments fetched successfully from new schema:', data?.length);
      updateState({ payments: (data as unknown as Payment[]) || [], loading: false });
      return data || [];
    } catch (error: any) {
      debugLog('Exception fetching payments:', error);
      const errorMessage = error.message;
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load payments: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Create new payment
  const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
    try {
      debugLog('Creating payment in new schema...', paymentData);

      // Validate required fields
      if (!paymentData.client_id || !paymentData.amount || !paymentData.payment_date) {
        throw new Error('Client ID, amount, and payment date are required');
      }

      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Verify client exists
      const { data: clientExists } = await supabase
        .from('clients')
        .select('id')
        .eq('id', paymentData.client_id)
        .single();

      if (!clientExists) {
        throw new Error('Client not found');
      }

      // Prepare payment data
      const newPaymentData = {
        client_id: paymentData.client_id,
        amount: Math.round(paymentData.amount * 100) / 100, // Round to 2 decimal places
        status: paymentData.status || 'pending',
        payment_date: paymentData.payment_date,
      };

      const { data, error } = await supabase
        .from('payments')
        .insert([newPaymentData])
        .select(`
          id,
          client_id,
          amount,
          status,
          payment_date,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .single();

      if (error) {
        debugLog('Error creating payment:', error);
        throw error;
      }

      debugLog('Payment created successfully in new schema:', data);
      
      // Optimistic update to local state
      updateState({ payments: [data as unknown as Payment, ...payments] });
      
      // Trigger notification for confirmed payments
      if (user?.id && data.status === 'confirmed' && data.client) {
        try {
          const client = Array.isArray(data.client) ? data.client[0] : data.client;
          await notifyPaymentReceived(data as unknown as Payment, client as Client, user.id);
        } catch (notificationError) {
          debugLog('Failed to send payment notification:', notificationError);
          // Don't throw error for notification failures
        }
      }
      
      return data;
    } catch (error: any) {
      debugLog('Exception creating payment:', error);
      Alert.alert('Error', `Failed to create payment: ${error.message}`);
      throw error;
    }
  };

  // Update payment
  const updatePayment = async (id: string, updates: Partial<Omit<Payment, 'id' | 'client_id'>>) => {
    try {
      debugLog('Updating payment in new schema...', { id, updates });

      // Validate payment exists
      const existingPayment = payments.find(p => p.id === id);
      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      // Prepare sanitized updates
      const sanitizedUpdates: any = {};

      if (updates.amount !== undefined) {
        if (updates.amount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        sanitizedUpdates.amount = Math.round(updates.amount * 100) / 100;
      }
      if (updates.status !== undefined) {
        sanitizedUpdates.status = updates.status;
      }
      if (updates.payment_date !== undefined) {
        sanitizedUpdates.payment_date = updates.payment_date;
      }
      // description field doesn't exist in new schema
      // if (updates.description !== undefined) {
      //   sanitizedUpdates.description = updates.description?.trim() || null;
      // }

      const { data, error } = await supabase
        .from('payments')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select(`
          id,
          client_id,
          amount,
          status,
          payment_date,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .single();

      if (error) {
        debugLog('Error updating payment:', error);
        throw error;
      }

      debugLog('Payment updated successfully in new schema:', data);
      
      // Update local state
      updateState({ 
        payments: payments.map(payment => payment.id === id ? (data as unknown as Payment) : payment)
      });
      
      return data;
    } catch (error: any) {
      debugLog('Exception updating payment:', error);
      Alert.alert('Error', `Failed to update payment: ${error.message}`);
      throw error;
    }
  };

  // Legacy method for backward compatibility
  const updatePaymentStatus = async (id: string, status: Payment['status']) => {
    return updatePayment(id, { status });
  };

  // Get total revenue (confirmed payments only) with null safety
  const getTotalRevenue = () => {
    return payments
      .filter(payment => {
        // Add null safety check
        if (!payment || !payment.status) {
          console.warn('⚠️ Payment missing status property:', payment);
          return false;
        }
        return payment.status === 'confirmed';
      })
      .reduce((total, payment) => {
        // Add null safety for amount
        if (!payment || typeof payment.amount !== 'number') {
          console.warn('⚠️ Payment missing or invalid amount:', payment);
          return total;
        }
        return total + payment.amount;
      }, 0);
  };

  // Get revenue for specific time period with null safety
  const getRevenueForPeriod = (startDate: Date, endDate: Date) => {
    return payments
      .filter(payment => {
        // Add null safety checks
        if (!payment || !payment.status) {
          console.warn('⚠️ Payment missing status property:', payment);
          return false;
        }
        if (payment.status !== 'confirmed') return false;
        
        if (!payment.payment_date) {
          console.warn('⚠️ Payment missing payment_date:', payment);
          return false;
        }
        
        try {
          const paymentDate = new Date(payment.payment_date);
          if (isNaN(paymentDate.getTime())) {
            console.warn('⚠️ Invalid payment date:', payment.payment_date);
            return false;
          }
          return paymentDate >= startDate && paymentDate <= endDate;
        } catch (error) {
          console.warn('⚠️ Error parsing payment date:', payment.payment_date, error);
          return false;
        }
      })
      .reduce((total, payment) => {
        // Add null safety for amount
        if (!payment || typeof payment.amount !== 'number') {
          console.warn('⚠️ Payment missing or invalid amount:', payment);
          return total;
        }
        return total + payment.amount;
      }, 0);
  };

  // Get today's revenue
  const getTodayRevenue = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return getRevenueForPeriod(startOfDay, endOfDay);
  };

  // Get this week's revenue
  const getWeekRevenue = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return getRevenueForPeriod(startOfWeek, endOfWeek);
  };

  // Get this month's revenue
  const getMonthRevenue = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    return getRevenueForPeriod(startOfMonth, endOfMonth);
  };

  // Get this year's revenue
  const getYearRevenue = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
    
    return getRevenueForPeriod(startOfYear, endOfYear);
  };

  // Filter payments by status with null safety
  const getPaymentsByStatus = (status: Payment['status']) => {
    return payments.filter(payment => {
      // Add null safety check
      if (!payment || !payment.status) {
        console.warn('⚠️ Payment missing status property:', payment);
        return false;
      }
      return payment.status === status;
    });
  };

  // Filter payments with null safety
  const filterPayments = (status: 'all' | Payment['status']) => {
    if (status === 'all') return payments;
    return payments.filter(payment => {
      // Add null safety check
      if (!payment || !payment.status) {
        console.warn('⚠️ Payment missing status property:', payment);
        return false;
      }
      return payment.status === status;
    });
  };

  // Get revenue statistics
  const getRevenueStats = () => {
    return {
      total: getTotalRevenue(),
      today: getTodayRevenue(),
      week: getWeekRevenue(),
      month: getMonthRevenue(),
      year: getYearRevenue(),
      pending: getPaymentsByStatus('pending').reduce((sum, p) => sum + p.amount, 0),
      confirmed: getPaymentsByStatus('confirmed').reduce((sum, p) => sum + p.amount, 0),
      failed: getPaymentsByStatus('failed').reduce((sum, p) => sum + p.amount, 0),
    };
  };

  // Delete payment
  const deletePayment = async (id: string) => {
    try {
      debugLog('Deleting payment from new schema...', id);

      // Validate payment exists
      const existingPayment = payments.find(p => p.id === id);
      if (!existingPayment) {
        throw new Error('Payment not found');
      }

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        debugLog('Error deleting payment:', error);
        throw error;
      }

      debugLog('Payment deleted successfully from new schema');
      
      // Remove from local state
      updateState({ 
        payments: payments.filter(payment => payment.id !== id)
      });
      
    } catch (error: any) {
      debugLog('Exception deleting payment:', error);
      Alert.alert('Error', `Failed to delete payment: ${error.message}`);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchPayments();

    // Subscribe to real-time changes with enhanced error handling
    const subscription = supabase
      .channel('payments_realtime_new_schema')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          debugLog('Real-time payment change in new schema:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              // Re-fetch to get complete client data
              fetchPayments(false);
            } else if (payload.eventType === 'UPDATE') {
              // Update existing payment while preserving client data
              updateState({ 
                payments: payments.map(payment => 
                  payment.id === payload.new.id 
                    ? { ...payment, ...payload.new } as Payment 
                    : payment
                )
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              updateState({ 
                payments: payments.filter(payment => payment.id !== deletedId)
              });
            }
          } catch (error) {
            debugLog('Error handling real-time update:', error);
            // Re-fetch data on error to ensure consistency
            fetchPayments(false);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to payments real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Channel error:', err);
        } else if (status === 'TIMED_OUT') {
          debugLog('Real-time subscription timed out');
        } else if (status === 'CLOSED') {
          debugLog('Real-time subscription closed');
        }
      });

    return () => {
      debugLog('Cleaning up payments subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    updatePaymentStatus, // Legacy method
    deletePayment,
    getPaymentsByStatus,
    filterPayments,
    getTotalRevenue,
    getTodayRevenue,
    getWeekRevenue,
    getMonthRevenue,
    getYearRevenue,
    getRevenueStats,
    refetch: () => fetchPayments(true),
    refetchSilent: () => fetchPayments(false),
  };
}