import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Client, Goal, BusinessVisit } from '../types';
import { getClientsNeedingAttention, getGoalsAtRisk } from '../utils/metrics';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationState {
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
}

export interface SmartNotification {
  id: string;
  type: 'goal_progress' | 'client_attention' | 'milestone' | 'streak';
  title: string;
  body: string;
  data?: any;
  triggerAfter?: number; // seconds
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permissionGranted: false,
    loading: true,
    error: null,
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([]);

  // Request notification permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D4AA',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setState(prev => ({ ...prev, permissionGranted: granted, loading: false }));
      return granted;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      return false;
    }
  };

  // Send immediate notification
  const sendNotification = async (notification: Omit<SmartNotification, 'id'>): Promise<string | null> => {
    try {
      if (!state.permissionGranted) {
        console.warn('Notification permissions not granted');
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null, // Immediate notification for now
      });

      setScheduledNotifications(prev => [...prev, identifier]);
      return identifier;
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    }
  };

  // Schedule smart notifications based on data
  const scheduleSmartNotifications = async (
    clients: Client[],
    goals: Goal[],
    visits: BusinessVisit[]
  ) => {
    if (!state.permissionGranted) return;

    try {
      // Clear existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      setScheduledNotifications([]);

      const notifications: SmartNotification[] = [];

      // 1. Check for clients needing attention (14+ days since visit)
      const clientsNeedingAttention = getClientsNeedingAttention(clients, visits, 14);
      clientsNeedingAttention.slice(0, 3).forEach((item, index) => {
        notifications.push({
          id: `client-attention-${item.client.id}`,
          type: 'client_attention',
          title: `Don't forget to visit ${item.client.name}`,
          body: `It's been ${item.daysSinceVisit} days since your last visit. Check in to maintain the relationship!`,
          data: { clientId: item.client.id, daysSince: item.daysSinceVisit },
          triggerAfter: (index + 1) * 3600, // Spread over hours
        });
      });

      // 2. Check for goals at risk
      const goalsAtRisk = getGoalsAtRisk(goals, clients, []);
      goalsAtRisk.forEach((item, index) => {
        if (item.remaining <= 2) {
          const encouragement = item.remaining === 1 
            ? "You're just 1 client away from your goal!" 
            : `You need ${item.remaining} more clients to reach your goal!`;

          notifications.push({
            id: `goal-risk-${item.goal.id}`,
            type: 'goal_progress',
            title: `${item.goal.title} - ${item.timeLeft}`,
            body: `${encouragement} Keep pushing! 🚀`,
            data: { goalId: item.goal.id, remaining: item.remaining },
            triggerAfter: (index + 1) * 1800, // 30 min intervals
          });
        }
      });

      // 3. Check for inactivity (no new clients in 3+ days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentClients = clients.filter(client => 
        new Date(client.created_at) >= threeDaysAgo
      );

      if (recentClients.length === 0) {
        notifications.push({
          id: 'inactivity-reminder',
          type: 'milestone',
          title: 'Time to grow your business!',
          body: 'You haven\'t added any new clients recently. Consider reaching out to prospects!',
          data: { type: 'inactivity' },
          triggerAfter: 7200, // 2 hours
        });
      }

      // 4. Milestone celebrations
      const totalClients = clients.length;
      const milestones = [10, 25, 50, 100, 250, 500];
      const nextMilestone = milestones.find(m => m > totalClients);
      
      if (nextMilestone && totalClients >= nextMilestone - 2) {
        notifications.push({
          id: `milestone-${nextMilestone}`,
          type: 'milestone',
          title: 'Milestone Achievement Coming Up!',
          body: `You're ${nextMilestone - totalClients} clients away from ${nextMilestone} total clients! 🎉`,
          data: { milestone: nextMilestone, current: totalClients },
          triggerAfter: 10800, // 3 hours
        });
      }

      // Schedule all notifications
      for (const notification of notifications.slice(0, 5)) { // Limit to 5 notifications
        await sendNotification(notification);
      }

      console.log(`Scheduled ${notifications.length} smart notifications`);
    } catch (error: any) {
      console.error('Failed to schedule smart notifications:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  // Show achievement notification
  const showAchievementNotification = async (
    title: string,
    message: string,
    data?: any
  ) => {
    return await sendNotification({
      type: 'milestone',
      title,
      body: message,
      data,
    });
  };

  // Show goal completion celebration
  const showGoalCompletionNotification = async (goalTitle: string) => {
    return await sendNotification({
      type: 'milestone',
      title: '🎉 Goal Completed!',
      body: `Congratulations! You've completed "${goalTitle}". Time to set your next target!`,
      data: { type: 'goal_completion', goalTitle },
    });
  };

  // Show streak notification
  const showStreakNotification = async (streak: number) => {
    const streakEmoji = streak >= 7 ? '🔥🔥🔥' : streak >= 3 ? '🔥🔥' : '🔥';
    return await sendNotification({
      type: 'streak',
      title: `${streakEmoji} ${streak}-Day Streak!`,
      body: `You've been consistent for ${streak} days straight! Keep the momentum going!`,
      data: { type: 'streak', count: streak },
    });
  };

  // Show weekly summary notification
  const showWeeklySummaryNotification = async (
    newClients: number,
    totalRevenue: number,
    goalsCompleted: number
  ) => {
    return await sendNotification({
      type: 'milestone',
      title: '📊 Your Week in Review',
      body: `${newClients} new clients, $${totalRevenue.toLocaleString()} revenue, ${goalsCompleted} goals completed. Great work!`,
      data: { 
        type: 'weekly_summary', 
        clients: newClients, 
        revenue: totalRevenue, 
        goals: goalsCompleted 
      },
    });
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      setScheduledNotifications([]);
    } catch (error: any) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Listen for notification responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      
      // Handle notification taps here
      if (data?.type === 'goal_completion') {
        // Navigate to goals screen
      } else if (data?.clientId) {
        // Navigate to client details
      }
    });

    return () => subscription.remove();
  }, []);

  // Initialize permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  return {
    ...state,
    requestPermissions,
    sendNotification,
    scheduleSmartNotifications,
    showAchievementNotification,
    showGoalCompletionNotification,
    showStreakNotification,
    showWeeklySummaryNotification,
    clearAllNotifications,
    scheduledNotifications,
  };
}