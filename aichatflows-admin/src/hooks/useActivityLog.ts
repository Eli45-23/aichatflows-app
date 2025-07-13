import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLogEntry } from '../types';
import { createActivityLog } from '../utils/finance';

const ACTIVITY_LOG_KEY = 'activity_log_entries';
const MAX_ENTRIES = 100; // Keep only the latest 100 entries

export function useActivityLog() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load activities from AsyncStorage on mount
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by timestamp, most recent first
        const sorted = parsed.sort((a: ActivityLogEntry, b: ActivityLogEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivities(sorted);
      }
    } catch (error) {
      console.error('Error loading activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveActivities = async (newActivities: ActivityLogEntry[]) => {
    try {
      // Keep only the latest MAX_ENTRIES
      const trimmed = newActivities.slice(0, MAX_ENTRIES);
      await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
      setActivities(trimmed);
    } catch (error) {
      console.error('Error saving activity log:', error);
    }
  };

  const logActivity = (
    type: ActivityLogEntry['type'],
    description: string,
    clientId?: string,
    clientName?: string,
    data?: Record<string, any>
  ) => {
    const activity = createActivityLog(type, description, clientId, clientName, data);
    const updated = [activity, ...activities];
    saveActivities(updated);
    return activity;
  };

  // Convenience methods for common activities
  const logPlanChange = (clientId: string, clientName: string, oldPlan: string, newPlan: string) => {
    return logActivity(
      'plan_change',
      `${clientName}'s plan changed from ${oldPlan} to ${newPlan}`,
      clientId,
      clientName,
      { oldPlan, newPlan }
    );
  };

  const logPaymentStatusChange = (
    clientId: string, 
    clientName: string, 
    oldStatus: string, 
    newStatus: string
  ) => {
    return logActivity(
      'payment_status',
      `${clientName}'s payment status changed from ${oldStatus} to ${newStatus}`,
      clientId,
      clientName,
      { oldStatus, newStatus }
    );
  };

  const logInPersonSignup = (clientName: string, plan: string) => {
    return logActivity(
      'in_person_signup',
      `${clientName} signed up in-person for ${plan} plan`,
      undefined,
      clientName,
      { plan, signupType: 'in_person' }
    );
  };

  const logClientCreated = (clientId: string, clientName: string, plan: string, isInPerson = false) => {
    return logActivity(
      'client_created',
      `${clientName} was added as a new client with ${plan} plan${isInPerson ? ' (from in-person signup)' : ''}`,
      clientId,
      clientName,
      { plan, isInPerson }
    );
  };

  // Get recent activities (default last 10)
  const getRecentActivities = (limit = 10): ActivityLogEntry[] => {
    return activities.slice(0, limit);
  };

  // Get activities for a specific client
  const getClientActivities = (clientId: string): ActivityLogEntry[] => {
    return activities.filter(activity => activity.client_id === clientId);
  };

  // Get activities by type
  const getActivitiesByType = (type: ActivityLogEntry['type']): ActivityLogEntry[] => {
    return activities.filter(activity => activity.type === type);
  };

  // Get activities from last N days
  const getActivitiesFromDays = (days: number): ActivityLogEntry[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return activities.filter(activity => 
      new Date(activity.timestamp) >= cutoff
    );
  };

  // Clear all activities
  const clearActivities = async () => {
    await AsyncStorage.removeItem(ACTIVITY_LOG_KEY);
    setActivities([]);
  };

  // Get activity stats
  const getActivityStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= today
    );

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const weekActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= thisWeek
    );

    return {
      total: activities.length,
      today: todayActivities.length,
      thisWeek: weekActivities.length,
      byType: {
        plan_change: activities.filter(a => a.type === 'plan_change').length,
        payment_status: activities.filter(a => a.type === 'payment_status').length,
        in_person_signup: activities.filter(a => a.type === 'in_person_signup').length,
        client_created: activities.filter(a => a.type === 'client_created').length,
      }
    };
  };

  return {
    activities,
    loading,
    logActivity,
    logPlanChange,
    logPaymentStatusChange,
    logInPersonSignup,
    logClientCreated,
    getRecentActivities,
    getClientActivities,
    getActivitiesByType,
    getActivitiesFromDays,
    clearActivities,
    getActivityStats,
    refetch: loadActivities
  };
}