import { useState, useEffect, useCallback } from 'react';
import { NotificationLog } from '../types';
import { 
  getNotificationHistory, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from '../utils/notifications';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export function useNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📱 Loading notification history for user:', user.id);
      
      const [notificationList, count] = await Promise.all([
        getNotificationHistory(user.id),
        getUnreadNotificationCount(user.id)
      ]);
      
      console.log('✅ Loaded notifications:', notificationList.length, 'unread:', count);
      
      setNotifications(notificationList);
      setUnreadCount(count);
    } catch (error: any) {
      console.error('❌ Error loading notifications:', error);
      
      // Handle specific database errors gracefully
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        setError('Notifications table not found. Database setup may be incomplete.');
        console.warn('💡 To fix: Run the SQL migration script at migrations/01_create_notifications_table.sql');
      } else {
        setError('Failed to load notifications. Please try again.');
      }
      
      // Set safe defaults so app doesn't crash
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      setError(null);
      
      const [notificationList, count] = await Promise.all([
        getNotificationHistory(user.id),
        getUnreadNotificationCount(user.id)
      ]);
      
      setNotifications(notificationList);
      setUnreadCount(count);
    } catch (error: any) {
      console.error('❌ Error refreshing notifications:', error);
      
      // Handle specific database errors gracefully
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        setError('Notifications table not found. Database setup may be incomplete.');
      } else {
        setError('Failed to refresh notifications. Please try again.');
      }
      
      // Keep existing data if refresh fails
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    const success = await markNotificationAsRead(notificationId, user.id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || now }))
      );
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    loadNotifications();

    // Subscribe to new notifications (with error handling)
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 New notification received:', payload);
          
          try {
            // Add new notification to the top
            setNotifications(prev => [payload.new as NotificationLog, ...prev]);
            
            // Increment unread count if notification is unread
            if (!payload.new.read_at) {
              setUnreadCount(prev => prev + 1);
            }
          } catch (error) {
            console.error('❌ Error handling new notification:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📝 Notification updated:', payload);
          
          try {
            // Update the notification in the list
            setNotifications(prev =>
              prev.map(n =>
                n.id === payload.new.id ? payload.new as NotificationLog : n
              )
            );
            
            // Update unread count if read status changed
            if (payload.old.read_at === null && payload.new.read_at !== null) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } catch (error) {
            console.error('❌ Error handling notification update:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to notification updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Notification subscription error:', err);
          setError('Real-time notifications may not work properly.');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Notification subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('🔌 Notification subscription closed');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadNotifications]);

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, NotificationLog[]>);

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}