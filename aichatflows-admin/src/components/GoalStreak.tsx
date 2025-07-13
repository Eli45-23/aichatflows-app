import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalStreakData } from '../utils/metrics';
import { Card } from './Card';

interface GoalStreakProps {
  streakData: GoalStreakData | null;
  loading?: boolean;
  onStreakTap?: () => void;
}

export function GoalStreak({ streakData, loading = false, onStreakTap }: GoalStreakProps) {
  if (loading) {
    return (
      <Card>
        <View className="p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="bg-gray-200 rounded h-6 w-24" />
            <View className="bg-gray-200 rounded-full w-8 h-8" />
          </View>
          <View className="bg-gray-200 rounded h-4 w-32 mt-2" />
        </View>
      </Card>
    );
  }

  if (!streakData) {
    return (
      <Card>
        <View className="p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-900">🎯 Goal Streak</Text>
              <Text className="text-sm text-gray-500">Start your streak today!</Text>
            </View>
            <View className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center">
              <Text className="text-lg">0</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '💎';
    if (streak >= 7) return '🔥🔥🔥';
    if (streak >= 3) return '🔥🔥';
    if (streak >= 1) return '🔥';
    return '⭐';
  };

  const getStreakMessage = (streak: number): string => {
    if (streak >= 30) return 'Legendary streak! You\'re unstoppable!';
    if (streak >= 14) return 'Two weeks strong! Amazing consistency!';
    if (streak >= 7) return 'One week streak! You\'re on fire!';
    if (streak >= 3) return 'Great momentum! Keep it going!';
    if (streak >= 1) return 'Nice start! Build that momentum!';
    return 'Ready to start a new streak?';
  };

  const getStreakColor = (streak: number): string => {
    if (streak >= 7) return 'text-orange-600';
    if (streak >= 3) return 'text-yellow-600';
    if (streak >= 1) return 'text-primary';
    return 'text-gray-500';
  };

  const streakEmoji = getStreakEmoji(streakData.currentStreak);
  const streakMessage = getStreakMessage(streakData.currentStreak);
  const streakColor = getStreakColor(streakData.currentStreak);

  return (
    <TouchableOpacity onPress={onStreakTap} disabled={!onStreakTap}>
      <Card>
        <View className="p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg font-semibold text-gray-900 mr-2">
                  Goal Streak
                </Text>
                <Text className="text-xl">{streakEmoji}</Text>
              </View>
              <Text className="text-sm text-gray-600 mb-2">
                {streakMessage}
              </Text>
              
              {/* Streak details */}
              <View className="flex-row items-center space-x-4">
                <View className="flex-row items-center">
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text className="text-xs text-gray-500 ml-1">
                    Current: {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={14} color="#EAB308" />
                  <Text className="text-xs text-gray-500 ml-1">
                    Best: {streakData.longestStreak} day{streakData.longestStreak !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Today's status */}
              <View className="flex-row items-center mt-2">
                <View className={`w-2 h-2 rounded-full mr-2 ${
                  streakData.isActiveToday ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <Text className="text-xs text-gray-500">
                  {streakData.isActiveToday 
                    ? 'Active today! Goal progress made' 
                    : 'Make progress on a goal to continue your streak'
                  }
                </Text>
              </View>
            </View>

            {/* Streak counter */}
            <View className={`rounded-full w-16 h-16 items-center justify-center ${
              streakData.currentStreak >= 7 
                ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                : streakData.currentStreak >= 3
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                : streakData.currentStreak >= 1
                ? 'bg-gradient-to-br from-green-400 to-primary'
                : 'bg-gray-100'
            }`}>
              <Text className={`text-xl font-bold ${
                streakData.currentStreak >= 1 ? 'text-white' : 'text-gray-500'
              }`}>
                {streakData.currentStreak}
              </Text>
            </View>
          </View>

          {/* Visual streak calendar (last 7 days) */}
          {streakData.streakDates.length > 0 && (
            <View className="mt-4 pt-4 border-t border-gray-100">
              <Text className="text-xs text-gray-500 mb-2">Last 7 days</Text>
              <View className="flex-row space-x-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Safe date comparison with proper validation
                  const isActive = streakData.streakDates.some(d => {
                    // Check if d is a valid date object
                    if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
                      return false;
                    }
                    try {
                      return d.toISOString().split('T')[0] === dateStr;
                    } catch (error) {
                      return false;
                    }
                  });
                  
                  return (
                    <View key={i} className="flex-1 items-center">
                      <Text className="text-xs text-gray-400 mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
                      </Text>
                      <View className={`w-6 h-6 rounded-full border-2 ${
                        isActive 
                          ? 'bg-primary border-primary' 
                          : 'border-gray-200'
                      }`}>
                        {isActive && (
                          <View className="w-full h-full items-center justify-center">
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// Compact streak indicator for headers
export function CompactStreakIndicator({ streakData }: { streakData: GoalStreakData | null }) {
  if (!streakData || streakData.currentStreak === 0) return null;

  const streakEmoji = streakData.currentStreak >= 7 ? '🔥🔥🔥' : 
                     streakData.currentStreak >= 3 ? '🔥🔥' : '🔥';

  return (
    <View className="flex-row items-center bg-orange-50 px-3 py-1 rounded-full">
      <Text className="text-sm mr-1">{streakEmoji}</Text>
      <Text className="text-sm font-medium text-orange-700">
        {streakData.currentStreak}-day streak
      </Text>
    </View>
  );
}