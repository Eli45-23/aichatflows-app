import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FormSubmission } from '../../src/types';
import { useFormSubmissions } from '../../src/hooks/useOnboardingSubmissions';

export default function OnboardingSubmissionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    submissions, 
    loading, 
    error, 
    searchSubmissions, 
    getSubmissionStats,
    refetch 
  } = useFormSubmissions();

  const filteredSubmissions = searchSubmissions(searchQuery);
  const stats = getSubmissionStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderSubmission = ({ item }: { item: FormSubmission }) => {
    const { date, time } = formatDate(item.submitted_at);
    
    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 shadow-sm"
        onPress={() => router.push(`/onboarding/${item.id}`)}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.email}
            </Text>
            
            <View className="flex-row items-center space-x-4 mb-2">
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-blue-800 text-xs">{item.status}</Text>
              </View>
            </View>
            
            <Text className="text-gray-500 text-sm">
              Submitted: {date} at {time}
            </Text>
            
            {item.client && (
              <Text className="text-gray-400 text-xs mt-1">
                Client: {item.client.name} ({item.client.status})
              </Text>
            )}
          </View>
          
          <View className="flex-col items-end">
            <View className="bg-purple-100 p-2 rounded-full mb-2">
              <Ionicons name="document-text" size={20} color="#5856D6" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D4AA" />
          <Text className="text-gray-600 mt-4">Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text className="text-gray-900 text-lg font-semibold mt-4">Error Loading Submissions</Text>
          <Text className="text-gray-600 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="bg-primary rounded-lg px-6 py-3 mt-4"
            onPress={refetch}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        {/* Header with Back Button */}
        <TouchableOpacity
          className="flex-row items-center mb-6"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#00D4AA" />
          <Text className="text-primary text-lg ml-2">Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Header Stats */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.total}
              </Text>
              <Text className="text-gray-600">Total Submissions</Text>
            </View>
            <View className="bg-green-100 p-3 rounded-full">
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            </View>
          </View>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">{stats.today}</Text>
              <Text className="text-xs text-gray-600">Today</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">{stats.thisWeek}</Text>
              <Text className="text-xs text-gray-600">This Week</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">{stats.thisMonth}</Text>
              <Text className="text-xs text-gray-600">This Month</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">{stats.recent}</Text>
              <Text className="text-xs text-gray-600">Recent</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <TextInput
            className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-base text-gray-900"
            placeholder="Search by company, contact, or email..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlignVertical="center"
            style={{ lineHeight: 20 }}
          />
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={{ position: 'absolute', left: 12, top: 14 }}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={{ position: 'absolute', right: 12, top: 14 }}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Header */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            Submissions ({filteredSubmissions.length})
          </Text>
        </View>

        {/* Submissions List */}
        <FlatList
          data={filteredSubmissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D4AA']}
              tintColor="#00D4AA"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons 
                name={searchQuery ? "search-outline" : "document-text-outline"} 
                size={64} 
                color="#9CA3AF" 
              />
              <Text className="text-gray-500 text-lg mt-4">
                {searchQuery ? 'No submissions found' : 'No submissions yet'}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Onboarding forms will appear here when submitted'
                }
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}