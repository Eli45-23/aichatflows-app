import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Goal } from '../types';
import { notifyGoalReached } from '../utils/notifications';
import { useAuth } from './useAuth';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Goals Hook] ${message}`, data || '');
  }
};

// Check if enhanced columns exist in the goals table
const checkEnhancedColumns = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('goals')
      .select('frequency, metric, is_global')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
};

interface GoalsHookState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
}

export function useGoals() {
  const { user } = useAuth();
  const [state, setState] = useState<GoalsHookState>({
    goals: [],
    loading: true,
    error: null,
  });

  const { goals, loading, error } = state;

  const updateState = (updates: Partial<GoalsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch all goals from new schema
  const fetchGoals = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching goals from new schema...');

      // First, try the enhanced schema
      let { data, error } = await supabase
        .from('goals')
        .select(`
          id,
          title,
          frequency,
          metric,
          target,
          is_global,
          client_id,
          created_at,
          updated_at,
          client:clients(
            id,
            name,
            email,
            status
          )
        `)
        .order('created_at', { ascending: false });

      // If enhanced columns don't exist, fall back to basic schema
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        debugLog('Enhanced columns not found, falling back to basic schema...');
        const fallbackResult = await supabase
          .from('goals')
          .select(`
            id,
            title,
            target,
            client_id,
            created_at,
            client:clients(
              id,
              name,
              email,
              status
            )
          `)
          .order('created_at', { ascending: false });
        
        // Add default values for missing fields
        if (fallbackResult.data) {
          data = fallbackResult.data.map((goal: any) => ({
            ...goal,
            frequency: 'weekly' as const,
            metric: 'clients' as const,
            is_global: false,
            updated_at: goal.created_at || new Date().toISOString(),
          }));
        }
        error = fallbackResult.error;
      }

      if (error) {
        debugLog('Error fetching goals:', error);
        throw error;
      }

      debugLog('Goals fetched successfully from new schema:', data?.length);
      updateState({ goals: (data as unknown as Goal[]) || [], loading: false });
      return data || [];
    } catch (error: any) {
      debugLog('Exception fetching goals:', error);
      const errorMessage = error.message;
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load goals: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Create new goal with enhanced logic
  const createGoal = async (goalData: Omit<Goal, 'id' | 'created_at'>) => {
    try {
      debugLog('Creating client acquisition goal...', goalData);

      // Validate required fields
      if (!goalData.title || !goalData.target) {
        throw new Error('Title and target are required');
      }

      if (goalData.target <= 0) {
        throw new Error('Goal target must be greater than 0');
      }

      if (!goalData.frequency) {
        throw new Error('Frequency is required');
      }

      // All goals are now global client acquisition goals
      const isGlobal = true;

      // Prepare goal data - simplified for client goals only
      let newGoalData: any = {
        title: goalData.title.trim(),
        target: Math.round(goalData.target),
        created_at: new Date().toISOString(),
      };

      // Try to include enhanced fields if they exist
      const hasEnhancedColumns = await checkEnhancedColumns();
      if (hasEnhancedColumns) {
        newGoalData = {
          ...newGoalData,
          frequency: goalData.frequency,
          is_global: isGlobal,
        };
      }

      let { data, error } = await supabase
        .from('goals')
        .insert([newGoalData])
        .select(`
          id,
          title,
          ${hasEnhancedColumns ? 'frequency,' : ''}
          ${hasEnhancedColumns ? 'metric,' : ''}
          target,
          ${hasEnhancedColumns ? 'is_global,' : ''}
          client_id,
          created_at,
          ${hasEnhancedColumns ? 'updated_at,' : ''}
          client:clients(
            id,
            name,
            email,
            status
          )
        `)
        .single();

      // If enhanced columns failed, try basic insert
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        debugLog('Enhanced columns not available, using basic insert...');
        const basicGoalData = {
          title: goalData.title.trim(),
          target: Math.round(goalData.target),
          client_id: goalData.client_id || null,
        };

        ({ data, error } = await supabase
          .from('goals')
          .insert([basicGoalData])
          .select(`
            id,
            title,
            target,
            client_id,
            created_at,
            client:clients(
              id,
              name,
              email,
              status
            )
          `)
          .single());

        // Add default enhanced values
        if (data) {
          data = {
            ...(data as any),
            frequency: goalData.frequency || 'weekly',
            metric: goalData.metric || 'clients',
            is_global: isGlobal,
            updated_at: (data as any).created_at || new Date().toISOString(),
          };
        }
      }

      if (error) {
        debugLog('Error creating goal:', error);
        throw error;
      }

      debugLog('Goal created successfully in new schema:', data);
      
      // Optimistic update to local state
      updateState({ goals: [data as unknown as Goal, ...goals] });
      
      return data as unknown as Goal;
    } catch (error: any) {
      debugLog('Exception creating goal:', error);
      Alert.alert('Error', `Failed to create goal: ${error.message}`);
      throw error;
    }
  };

  // Update goal with enhanced logic
  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'created_at'>>) => {
    try {
      debugLog('Updating goal with enhanced logic...', { id, updates });

      const existingGoal = goals.find(g => g.id === id);
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      // Validate updates
      if (updates.target !== undefined && updates.target <= 0) {
        throw new Error('Goal target must be greater than 0');
      }

      // Determine if goal is global based on metric and client selection
      const updatedMetric = updates.metric || existingGoal.metric;
      const updatedClientId = updates.client_id !== undefined ? updates.client_id : existingGoal.client_id;
      const isGlobal = !updatedClientId;

      // Verify client exists if client_id is provided
      if (updates.client_id) {
        const { data: clientExists } = await supabase
          .from('clients')
          .select('id')
          .eq('id', updates.client_id)
          .single();

        if (!clientExists) {
          throw new Error('Selected client not found');
        }
      }

      // Check if enhanced columns exist
      const hasEnhancedColumns = await checkEnhancedColumns();
      
      const sanitizedUpdates: any = {};

      if (updates.title !== undefined) {
        sanitizedUpdates.title = updates.title.trim();
      }
      if (updates.target !== undefined) {
        sanitizedUpdates.target = Math.round(updates.target);
      }
      if (updates.client_id !== undefined) {
        sanitizedUpdates.client_id = updates.client_id;
      }

      // Add enhanced fields only if columns exist
      if (hasEnhancedColumns) {
        sanitizedUpdates.updated_at = new Date().toISOString();
        if (updates.frequency !== undefined) {
          sanitizedUpdates.frequency = updates.frequency;
        }
        if (updates.metric !== undefined) {
          sanitizedUpdates.metric = updates.metric;
        }
        sanitizedUpdates.is_global = isGlobal;
      }

      // Try enhanced update first
      let { data, error } = await supabase
        .from('goals')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select(`
          id,
          title,
          ${hasEnhancedColumns ? 'frequency,' : ''}
          ${hasEnhancedColumns ? 'metric,' : ''}
          target,
          ${hasEnhancedColumns ? 'is_global,' : ''}
          client_id,
          created_at,
          ${hasEnhancedColumns ? 'updated_at,' : ''}
          client:clients(
            id,
            name,
            email,
            status
          )
        `)
        .single();

      // If enhanced columns failed, try basic update
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        debugLog('Enhanced columns not available, using basic update...');
        const basicUpdates: any = {};
        if (updates.title !== undefined) {
          basicUpdates.title = updates.title.trim();
        }
        if (updates.target !== undefined) {
          basicUpdates.target = Math.round(updates.target);
        }
        if (updates.client_id !== undefined) {
          basicUpdates.client_id = updates.client_id;
        }

        ({ data, error } = await supabase
          .from('goals')
          .update(basicUpdates)
          .eq('id', id)
          .select(`
            id,
            title,
            target,
            client_id,
            created_at,
            client:clients(
              id,
              name,
              email,
              status
            )
          `)
          .single());

        // Add default enhanced values
        if (data) {
          data = {
            ...(data as any),
            frequency: updates.frequency || existingGoal.frequency || 'weekly',
            metric: updates.metric || existingGoal.metric || 'clients',
            is_global: isGlobal,
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (error) {
        debugLog('Error updating goal:', error);
        throw error;
      }

      debugLog('Goal updated successfully in new schema:', data);
      
      updateState({ 
        goals: goals.map(goal => goal.id === id ? (data as unknown as Goal) : goal)
      });
      
      return data as unknown as Goal;
    } catch (error: any) {
      debugLog('Exception updating goal:', error);
      Alert.alert('Error', `Failed to update goal: ${error.message}`);
      throw error;
    }
  };

  // Delete goal
  const deleteGoal = async (id: string) => {
    try {
      debugLog('Deleting goal from new schema...', id);

      const existingGoal = goals.find(g => g.id === id);
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        debugLog('Error deleting goal:', error);
        throw error;
      }

      debugLog('Goal deleted successfully from new schema');
      
      updateState({ 
        goals: goals.filter(goal => goal.id !== id)
      });
      
    } catch (error: any) {
      debugLog('Exception deleting goal:', error);
      Alert.alert('Error', `Failed to delete goal: ${error.message}`);
      throw error;
    }
  };

  // Get goals by client
  const getGoalsByClient = (clientId: string) => {
    return goals.filter(goal => goal.client_id === clientId);
  };

  // Get global goals (client acquisition goals)
  const getGlobalGoals = () => {
    return goals.filter(goal => goal.is_global);
  };

  // Get goals by frequency (with null safety)
  const getGoalsByFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    return goals.filter(goal => {
      // Add null safety check
      if (!goal || !goal.frequency) {
        console.warn('⚠️ Goal missing frequency property:', goal);
        return false;
      }
      return goal.frequency === frequency;
    });
  };

  // Get goals by metric
  const getGoalsByMetric = (metric: 'clients') => {
    return goals.filter(goal => goal.metric === metric);
  };

  // Calculate goal progress (with null safety)
  const calculateGoalProgress = (goal: Goal, payments: any[], clients: any[]) => {
    // Add comprehensive null safety checks
    if (!goal) {
      console.warn('⚠️ Goal is null or undefined in calculateGoalProgress');
      return {
        current: 0,
        percentage: 0,
        isComplete: false,
        periodStart: new Date(),
        periodEnd: new Date(),
      };
    }

    if (!goal.frequency) {
      console.warn('⚠️ Goal missing frequency property:', goal);
      // Provide default frequency
      goal.frequency = 'weekly';
    }

    if (!goal.target || goal.target <= 0) {
      console.warn('⚠️ Goal has invalid target:', goal);
      return {
        current: 0,
        percentage: 0,
        isComplete: false,
        periodStart: new Date(),
        periodEnd: new Date(),
      };
    }

    const now = new Date();
    let startDate: Date;
    let endDate = now;

    // Calculate period based on goal frequency
    switch (goal.frequency) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Calculate client acquisition progress (global or client-specific) with null safety
    const newClients = (clients || []).filter(client => {
      // Add null safety for client data
      if (!client || !client.created_at) {
        console.warn('⚠️ Client missing created_at:', client);
        return false;
      }
      
      try {
        return new Date(client.created_at) >= startDate &&
               new Date(client.created_at) <= endDate &&
               (goal.is_global || client.id === goal.client_id);
      } catch (error) {
        console.warn('⚠️ Error parsing client date:', client.created_at, error);
        return false;
      }
    });
    return {
      current: newClients.length,
      percentage: goal.target > 0 ? Math.min((newClients.length / goal.target) * 100, 100) : 0,
      isComplete: newClients.length >= goal.target,
      periodStart: startDate,
      periodEnd: endDate,
    };
  };

  // Get goals with progress calculation
  const getGoalsWithProgress = (payments: any[], clients: any[]) => {
    return goals.map(goal => ({
      ...goal,
      progress: calculateGoalProgress(goal, payments, clients),
    }));
  };

  // Get completed goals
  const getCompletedGoals = (payments: any[], clients: any[]) => {
    return goals.filter(goal => {
      const progress = calculateGoalProgress(goal, payments, clients);
      return progress.isComplete;
    });
  };

  // Get active goals (not completed)
  const getActiveGoals = (payments: any[], clients: any[]) => {
    return goals.filter(goal => {
      const progress = calculateGoalProgress(goal, payments, clients);
      return !progress.isComplete;
    });
  };

  // Check for goal completion and notify
  const checkGoalCompletion = async (payments: any[], clients: any[]) => {
    if (!user?.id) return;

    for (const goal of goals) {
      const progress = calculateGoalProgress(goal, payments, clients);
      
      if (progress.isComplete && progress.current >= goal.target) {
        try {
          await notifyGoalReached(goal, progress.current, user.id);
        } catch (notificationError) {
          debugLog('Failed to send goal completion notification:', notificationError);
          // Don't throw error for notification failures
        }
      }
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchGoals();

    const subscription = supabase
      .channel('goals_realtime_simple')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'goals' },
        (payload) => {
          debugLog('Real-time goal change in new schema:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              fetchGoals(false); // Re-fetch to get client data
            } else if (payload.eventType === 'UPDATE') {
              const updatedGoal = payload.new as Goal;
              updateState({ 
                goals: goals.map(goal => 
                  goal.id === updatedGoal.id ? updatedGoal : goal
                )
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              updateState({ 
                goals: goals.filter(goal => goal.id !== deletedId)
              });
            }
          } catch (error) {
            debugLog('Error handling real-time update:', error);
            fetchGoals(false);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to goals real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Channel error:', err);
        }
      });

    return () => {
      debugLog('Cleaning up goals subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalsByClient,
    getGlobalGoals,
    getGoalsByFrequency,
    getGoalsByMetric,
    calculateGoalProgress,
    getGoalsWithProgress,
    getCompletedGoals,
    getActiveGoals,
    checkGoalCompletion,
    refetch: () => fetchGoals(true),
    refetchSilent: () => fetchGoals(false),
  };
}