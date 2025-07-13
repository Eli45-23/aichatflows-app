import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  X, 
  Check, 
  DollarSign, 
  Users, 
  MapPin, 
  Target,
  CheckCircle 
} from 'lucide-react-native';
import { NotificationLog } from '../types';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import { EmptyState } from './EmptyState';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const {
    groupedNotifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotificationCenter();

  const getNotificationIcon = (type: NotificationLog['type']) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'client_added':
        return <Users {...iconProps} color="#3B82F6" />;
      case 'payment_received':
        return <DollarSign {...iconProps} color="#10B981" />;
      case 'visit_logged':
        return <MapPin {...iconProps} color="#F59E0B" />;
      case 'goal_reached':
        return <Target {...iconProps} color="#8B5CF6" />;
      default:
        return <Bell {...iconProps} color="#6B7280" />;
    }
  };

  const getNotificationColor = (type: NotificationLog['type']) => {
    switch (type) {
      case 'client_added':
        return '#EFF6FF'; // blue-50
      case 'payment_received':
        return '#ECFDF5'; // green-50
      case 'visit_logged':
        return '#FEF3C7'; // yellow-50
      case 'goal_reached':
        return '#F3E8FF'; // purple-50
      default:
        return '#F9FAFB'; // gray-50
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  const handleNotificationPress = (notification: NotificationLog) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    // TODO: Navigate to relevant screen based on notification type
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-bg-secondary">
        {/* Header */}
        <View className="flex-row items-center justify-between px-page py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-text-primary">Notifications</Text>
            {unreadCount > 0 && (
              <View className="ml-2 px-2 py-0.5 bg-primary rounded-full">
                <Text className="text-xs font-medium text-white">{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center space-x-3">
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                className="flex-row items-center"
              >
                <CheckCircle size={20} color="#00D4AA" />
                <Text className="ml-1 text-sm text-primary font-medium">Mark all read</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-gray-100 rounded-lg"
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#00D4AA" />
          </View>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <View className="flex-1 px-page py-8">
            <EmptyState
              icon="notifications"
              title="No notifications yet"
              description="You'll see notifications here when there's activity in your app"
            />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#00D4AA"
              />
            }
          >
            {Object.entries(groupedNotifications).map(([date, notifications]) => (
              <View key={date}>
                <Text className="px-page py-2 text-sm font-medium text-text-muted bg-gray-50">
                  {date === new Date().toLocaleDateString() ? 'Today' : date}
                </Text>
                
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    className={`px-page py-4 ${!notification.read_at ? 'bg-white' : 'bg-gray-50'}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row">
                      {/* Icon */}
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </View>
                      
                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 mr-2">
                            <Text className={`text-sm font-medium ${!notification.read_at ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {notification.title}
                            </Text>
                            <Text className={`text-sm mt-0.5 ${!notification.read_at ? 'text-text-secondary' : 'text-text-muted'}`}>
                              {notification.body}
                            </Text>
                          </View>
                          
                          {/* Unread indicator */}
                          {!notification.read_at && (
                            <View className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                          )}
                        </View>
                        
                        {/* Timestamp */}
                        <Text className="text-xs text-text-muted mt-1">
                          {formatRelativeTime(notification.created_at)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            
            {/* Bottom padding */}
            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// Notification Bell with Badge
interface NotificationBellProps {
  onPress: () => void;
  unreadCount?: number;
}

export function NotificationBell({ onPress, unreadCount = 0 }: NotificationBellProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="relative p-2"
    >
      <Bell size={24} color="#6B7280" />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
          <Text className="text-xs font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}