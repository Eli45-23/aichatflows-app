import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Dashboard Stats Hook] ${message}`, data || '');
  }
};

interface DashboardStatsHookState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

export interface DashboardStats {
  totalClients: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  newSubmissions: number;
  activeGoals: number;
  recentVisits: number;
  clientsByStatus: {
    active: number;
    in_progress: number;
    paused: number;
    cancelled: number;
    unknown: number;
  };
  paymentsByStatus: {
    pending: number;
    confirmed: number;
    failed: number;
  };
}

export function useDashboardStats() {
  const initialStats: DashboardStats = {
    totalClients: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    yearRevenue: 0,
    newSubmissions: 0,
    activeGoals: 0,
    recentVisits: 0,
    clientsByStatus: {
      active: 0,
      in_progress: 0,
      paused: 0,
      cancelled: 0,
      unknown: 0,
    },
    paymentsByStatus: {
      pending: 0,
      confirmed: 0,
      failed: 0,
    },
  };

  const [state, setState] = useState<DashboardStatsHookState>({
    stats: initialStats,
    loading: true,
    error: null,
  });

  const { stats, loading, error } = state;

  const updateState = (updates: Partial<DashboardStatsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const fetchDashboardStats = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching dashboard statistics from new schema...');

      // Get date ranges with improved calculations
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      debugLog('Date ranges:', {
        today: today.toISOString(),
        startOfWeek: startOfWeek.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
        startOfYear: startOfYear.toISOString(),
        last7Days: last7Days.toISOString(),
      });

      // Fetch all data in parallel with explicit field selection
      const [
        clientsResult,
        paymentsResult,
        submissionsResult,
        goalsResult,
        visitsResult,
      ] = await Promise.all([
        // Clients data with status field
        supabase
          .from('clients')
          .select('id, status, created_at'),
        
        // Payments data with amount, status, and date
        supabase
          .from('payments')
          .select('id, amount, status, payment_date'),
        
        // Recent form submissions
        supabase
          .from('form_submissions')
          .select('id, submitted_at')
          .gte('submitted_at', last7Days.toISOString()),
        
        // Goals (simplified since no period fields exist)
        supabase
          .from('goals')
          .select('id, created_at, client_id, title, target'),
        
        // Recent business visits (no date filter since schema doesn't have visited_at)
        supabase
          .from('business_visits')
          .select('id, location'),
      ]);

      // Enhanced error checking with specific error messages
      if (clientsResult.error) {
        debugLog('Clients query error:', clientsResult.error);
        throw new Error(`Failed to fetch clients: ${clientsResult.error.message}`);
      }
      if (paymentsResult.error) {
        debugLog('Payments query error:', paymentsResult.error);
        throw new Error(`Failed to fetch payments: ${paymentsResult.error.message}`);
      }
      if (submissionsResult.error) {
        debugLog('Form submissions query error:', submissionsResult.error);
        throw new Error(`Failed to fetch form submissions: ${submissionsResult.error.message}`);
      }
      if (goalsResult.error) {
        debugLog('Goals query error:', goalsResult.error);
        throw new Error(`Failed to fetch goals: ${goalsResult.error.message}`);
      }
      if (visitsResult.error) {
        debugLog('Visits query error:', visitsResult.error);
        throw new Error(`Failed to fetch visits: ${visitsResult.error.message}`);
      }

      const clients = clientsResult.data || [];
      const payments = paymentsResult.data || [];
      const submissions = submissionsResult.data || [];
      const goals = goalsResult.data || [];
      const visits = visitsResult.data || [];

      debugLog('Raw data fetched from new schema:', {
        clients: clients.length,
        payments: payments.length,
        submissions: submissions.length,
        goals: goals.length,
        visits: visits.length,
      });

      // Calculate client statistics with validation (including null status)
      const clientsByStatus = {
        active: clients.filter(c => c && c.status === 'active').length,
        in_progress: clients.filter(c => c && c.status === 'in_progress').length,
        paused: clients.filter(c => c && c.status === 'paused').length,
        cancelled: clients.filter(c => c && c.status === 'cancelled').length,
        unknown: clients.filter(c => !c || !c.status || c.status === null).length,
      };

      // Calculate payment statistics with validation
      const paymentsByStatus = {
        pending: payments.filter(p => p.status === 'pending').length,
        confirmed: payments.filter(p => p.status === 'confirmed').length,
        failed: payments.filter(p => p.status === 'failed').length,
      };

      // Enhanced revenue calculations with error handling
      const confirmedPayments = payments.filter(p => {
        return p && 
               p.status === 'confirmed' && 
               typeof p.amount === 'number' && 
               !isNaN(p.amount) &&
               p.amount > 0 &&
               p.payment_date &&
               typeof p.payment_date === 'string';
      });
      
      const totalRevenue = confirmedPayments.reduce((sum, p) => {
        return sum + (Number(p.amount) || 0);
      }, 0);
      
      const todayRevenue = confirmedPayments
        .filter(p => {
          try {
            const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
            return paymentDate && !isNaN(paymentDate.getTime()) && paymentDate >= today;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      const weekRevenue = confirmedPayments
        .filter(p => {
          try {
            return new Date(p.payment_date) >= startOfWeek;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      const monthRevenue = confirmedPayments
        .filter(p => {
          try {
            return new Date(p.payment_date) >= startOfMonth;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      const yearRevenue = confirmedPayments
        .filter(p => {
          try {
            return new Date(p.payment_date) >= startOfYear;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const newStats: DashboardStats = {
        totalClients: clients.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        weekRevenue: Math.round(weekRevenue * 100) / 100,
        monthRevenue: Math.round(monthRevenue * 100) / 100,
        yearRevenue: Math.round(yearRevenue * 100) / 100,
        newSubmissions: submissions.length,
        activeGoals: goals.length,
        recentVisits: visits.length,
        clientsByStatus,
        paymentsByStatus,
      };

      debugLog('Calculated stats from new schema:', newStats);
      updateState({ stats: newStats, loading: false });
      return newStats;

    } catch (error: any) {
      debugLog('Exception fetching dashboard stats:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load dashboard statistics: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Get stats summary for quick access
  const getStatsSummary = () => {
    return {
      totalClients: stats.totalClients,
      totalRevenue: stats.totalRevenue,
      activeClients: stats.clientsByStatus.active,
      pendingPayments: stats.paymentsByStatus.pending,
      activeGoals: stats.activeGoals,
      recentActivity: stats.newSubmissions + stats.recentVisits,
    };
  };

  // Set up real-time subscriptions with debouncing
  useEffect(() => {
    fetchDashboardStats();

    // Debounce function to prevent too frequent updates
    let updateTimeout: ReturnType<typeof setTimeout>;
    const debouncedRefresh = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        debugLog('Debounced refresh triggered');
        fetchDashboardStats(false);
      }, 2000); // 2 second delay
    };

    // Subscribe to changes in all relevant tables with enhanced error handling
    const subscription = supabase
      .channel('dashboard_realtime_new_schema')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          debugLog('Clients changed, refreshing stats', payload.eventType);
          debouncedRefresh();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          debugLog('Payments changed, refreshing stats', payload.eventType);
          debouncedRefresh();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'form_submissions' },
        (payload) => {
          debugLog('Form submissions changed, refreshing stats', payload.eventType);
          debouncedRefresh();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'goals' },
        (payload) => {
          debugLog('Goals changed, refreshing stats', payload.eventType);
          debouncedRefresh();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'business_visits' },
        (payload) => {
          debugLog('Visits changed, refreshing stats', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to dashboard real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Dashboard channel error:', err);
        } else if (status === 'TIMED_OUT') {
          debugLog('Dashboard real-time subscription timed out');
        } else if (status === 'CLOSED') {
          debugLog('Dashboard real-time subscription closed');
        }
      });

    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      debugLog('Periodic dashboard refresh');
      fetchDashboardStats(false);
    }, 5 * 60 * 1000);

    return () => {
      debugLog('Cleaning up dashboard subscription');
      subscription.unsubscribe();
      clearTimeout(updateTimeout);
      clearInterval(refreshInterval);
    };
  }, []);

  return {
    stats,
    loading,
    error,
    getStatsSummary,
    refetch: () => fetchDashboardStats(true),
    refetchSilent: () => fetchDashboardStats(false),
  };
}