import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Client, Payment, BusinessVisit, Goal, NotificationLog } from '../types';
import { PLANS } from './finance';

// Save notification to database for history
async function saveNotificationToDatabase(
  userId: string,
  type: NotificationLog['type'],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<NotificationLog | null> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving notification to database:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Error in saveNotificationToDatabase:', error);
    return null;
  }
}

// Check if notification was recently sent to prevent duplicates
async function wasRecentlySent(
  userId: string,
  type: string,
  uniqueKey: string,
  hoursThreshold: number = 1
): Promise<boolean> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursThreshold);

    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', cutoffTime.toISOString())
      .ilike('data->unique_key', uniqueKey)
      .limit(1);

    if (error) {
      console.error('Error checking recent notifications:', error);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Error in wasRecentlySent:', error);
    return false;
  }
}

// Send local notification
async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
}

// Notify when a new client is added
export async function notifyClientAdded(
  client: Client,
  userId: string
): Promise<void> {
  const uniqueKey = `client_${client.id}`;
  
  // Check for duplicates
  if (await wasRecentlySent(userId, 'client_added', uniqueKey)) {
    console.log('Client added notification recently sent, skipping');
    return;
  }

  const title = '🎉 New client added';
  const body = `${client.name}${client.business_name ? ` (${client.business_name})` : ''}`;
  const data = {
    type: 'client_added',
    clientId: client.id,
    clientName: client.name,
    unique_key: uniqueKey,
  };

  // Send local notification
  await sendLocalNotification(title, body, data);

  // Save to database
  await saveNotificationToDatabase(userId, 'client_added', title, body, data);
}

// Notify when a payment is received
export async function notifyPaymentReceived(
  payment: Payment,
  client: Client,
  userId: string
): Promise<void> {
  // Only notify for confirmed payments
  if (payment.status !== 'confirmed') {
    return;
  }

  const uniqueKey = `payment_${payment.id}`;
  
  // Check for duplicates
  if (await wasRecentlySent(userId, 'payment_received', uniqueKey)) {
    console.log('Payment notification recently sent, skipping');
    return;
  }

  const planInfo = client.plan ? PLANS[client.plan] : null;
  const planName = planInfo ? `${planInfo.name.charAt(0).toUpperCase() + planInfo.name.slice(1)} Plan` : '';
  
  const title = '💰 Payment received';
  const body = `${client.name} — $${payment.amount}${planName ? ` (${planName})` : ''}`;
  const data = {
    type: 'payment_received',
    paymentId: payment.id,
    clientId: client.id,
    clientName: client.name,
    amount: payment.amount,
    plan: client.plan,
    unique_key: uniqueKey,
  };

  // Send local notification
  await sendLocalNotification(title, body, data);

  // Save to database
  await saveNotificationToDatabase(userId, 'payment_received', title, body, data);
}

// Notify when a visit is logged
export async function notifyVisitLogged(
  visit: BusinessVisit,
  client: Client | undefined,
  userId: string
): Promise<void> {
  const uniqueKey = `visit_${visit.id}`;
  
  // Check for duplicates
  if (await wasRecentlySent(userId, 'visit_logged', uniqueKey)) {
    console.log('Visit notification recently sent, skipping');
    return;
  }

  const businessName = client?.business_name || client?.name || visit.location || 'Unknown Business';
  
  const title = '📍 Visit logged';
  const body = businessName;
  const data = {
    type: 'visit_logged',
    visitId: visit.id,
    clientId: visit.client_id,
    businessName,
    location: visit.location,
    unique_key: uniqueKey,
  };

  // Send local notification
  await sendLocalNotification(title, body, data);

  // Save to database
  await saveNotificationToDatabase(userId, 'visit_logged', title, body, data);
}

// Notify when a goal is reached
export async function notifyGoalReached(
  goal: Goal,
  currentProgress: number,
  userId: string
): Promise<void> {
  // Only notify when goal is actually reached
  if (currentProgress < goal.target) {
    return;
  }

  const uniqueKey = `goal_${goal.id}_${new Date().toISOString().split('T')[0]}`; // One per day per goal
  
  // Check for duplicates
  if (await wasRecentlySent(userId, 'goal_reached', uniqueKey, 24)) { // 24 hours for goals
    console.log('Goal reached notification recently sent, skipping');
    return;
  }

  const frequencyText = goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1);
  
  const title = '✅ Goal reached!';
  const body = `${frequencyText} goal "${goal.title}" completed! ${currentProgress}/${goal.target}`;
  const data = {
    type: 'goal_reached',
    goalId: goal.id,
    goalTitle: goal.title,
    frequency: goal.frequency,
    target: goal.target,
    progress: currentProgress,
    unique_key: uniqueKey,
  };

  // Send local notification
  await sendLocalNotification(title, body, data);

  // Save to database
  await saveNotificationToDatabase(userId, 'goal_reached', title, body, data);
}

// Get notification history for user
export async function getNotificationHistory(
  userId: string,
  limit: number = 50
): Promise<NotificationLog[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNotificationHistory:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}