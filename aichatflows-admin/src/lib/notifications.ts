import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function schedulePushNotification(
  title: string,
  body: string,
  data?: any,
  seconds = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds 
    },
  });
}

export function setupNotificationListeners() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Notification types for the admin app
export const NotificationTypes = {
  ONBOARDING_SUBMITTED: 'onboarding_submitted',
  PAYMENT_RECEIVED: 'payment_received',
  GOAL_ACHIEVED: 'goal_achieved',
  CLIENT_STATUS_CHANGE: 'client_status_change',
} as const;

// Helper functions for specific notification types
export const AdminNotifications = {
  async onboardingSubmitted(clientName: string) {
    await schedulePushNotification(
      'New Onboarding Submission',
      `${clientName} has submitted their onboarding form`,
      { type: NotificationTypes.ONBOARDING_SUBMITTED, clientName }
    );
  },

  async paymentReceived(clientName: string, amount: number) {
    await schedulePushNotification(
      'Payment Received',
      `$${amount} payment received from ${clientName}`,
      { type: NotificationTypes.PAYMENT_RECEIVED, clientName, amount }
    );
  },

  async goalAchieved(goalType: string, metric: string) {
    await schedulePushNotification(
      'Goal Achieved! 🎉',
      `Your ${goalType} ${metric} goal has been achieved!`,
      { type: NotificationTypes.GOAL_ACHIEVED, goalType, metric }
    );
  },

  async clientStatusChange(clientName: string, newStatus: string) {
    await schedulePushNotification(
      'Client Status Updated',
      `${clientName} is now ${newStatus}`,
      { type: NotificationTypes.CLIENT_STATUS_CHANGE, clientName, newStatus }
    );
  },
};