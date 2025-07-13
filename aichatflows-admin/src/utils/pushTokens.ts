import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { UserDevice } from '../types';
import Constants from 'expo-constants';

// Get Expo push token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Get existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
    });
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4AA',
    });
  }

  return token;
}

// Save push token to Supabase
export async function savePushToken(token: string, userId: string): Promise<UserDevice | null> {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    
    // Check if device already exists
    const { data: existingDevice, error: fetchError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('push_token', token)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking existing device:', fetchError);
      return null;
    }

    // Update existing device
    if (existingDevice) {
      const { data, error } = await supabase
        .from('user_devices')
        .update({ 
          updated_at: new Date().toISOString(),
          device_type: deviceType 
        })
        .eq('id', existingDevice.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating device:', error);
        return null;
      }

      return data;
    }

    // Create new device
    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        push_token: token,
        device_type: deviceType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving device:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in savePushToken:', error);
    return null;
  }
}

// Remove push token (on logout)
export async function removePushToken(token: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('push_token', token)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing device:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removePushToken:', error);
    return false;
  }
}

// Get user devices
export async function getUserDevices(userId: string): Promise<UserDevice[]> {
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user devices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserDevices:', error);
    return [];
  }
}

// Initialize push notifications for current user
export async function initializePushNotifications(userId: string): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  
  if (token && userId) {
    const device = await savePushToken(token, userId);
    if (device) {
      console.log('Push token saved successfully');
      return token;
    }
  }

  return null;
}