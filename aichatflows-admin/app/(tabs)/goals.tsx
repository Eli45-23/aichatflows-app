import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Target, TrendingUp, Edit, Trash2, CheckCircle, DollarSign, Users } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, Client } from '../../src/types';
import { useGoals } from '../../src/hooks/useGoals';
import { useClients } from '../../src/hooks/useClients';
import { usePayments } from '../../src/hooks/usePayments';
import { useAdvancedMetrics } from '../../src/hooks/useAdvancedMetrics';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { 
  Button, 
  Input, 
  FormField, 
  Card, 
  Badge, 
  EmptyState, 
  NoDataEmptyState, 
  LoadingEmptyState, 
  SimpleFormModal,
  GoalStreak,
  RetentionAnalytics,
  SearchInput,
  FilterBar,
  SortDropdown
} from '../../src/components';
import { GOAL_FILTER_GROUPS } from '../../src/components/FilterBar';
import { GOAL_SORT_OPTIONS } from '../../src/components/SortDropdown';
import { fuzzySearchItems, GOAL_SEARCH_FIELDS, useDebounceSearch, sortItems } from '../../src/utils/search';
import { validateGoal } from '../../src/utils/validation';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function GoalsScreen() {
  const { theme, themeClasses } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Goal | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newGoal, setNewGoal] = useState({
    title: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    target: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  
  // Debounced search for performance
  const debouncedSearch = useDebounceSearch(searchQuery, 300);
  
  const { 
    goals, 
    loading, 
    error, 
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalsByClient,
    getGoalsByFrequency,
    calculateGoalProgress,
    refetch 
  } = useGoals();

  const { clients } = useClients();
  const { payments } = usePayments();
  const { goalStreak, retention } = useAdvancedMetrics();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      frequency: 'weekly',
      target: '',
    });
    setValidationErrors({});
    setEditingGoal(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setNewGoal({
      title: goal.title,
      frequency: goal.frequency,
      target: goal.target.toString(),
    });
    setEditingGoal(goal);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleCreateGoal = async () => {
    try {
      console.log('🎯 Starting goal creation process');
      console.log('📝 Form data:', newGoal);
      
      // Clear previous validation errors
      setValidationErrors({});
      
      // Enhanced input validation and sanitization
      const trimmedTitle = newGoal.title?.trim();
      const trimmedTarget = newGoal.target?.trim();
      
      // Validate target number with enhanced safety
      if (!trimmedTarget) {
        setValidationErrors({ target: 'Target is required' });
        Alert.alert('Validation Error', 'Please enter a target number for your goal.');
        return;
      }
      
      const targetNumber = parseFloat(trimmedTarget);
      if (isNaN(targetNumber) || !isFinite(targetNumber)) {
        setValidationErrors({ target: 'Target must be a valid number' });
        Alert.alert('Validation Error', 'Please enter a valid number for your target.');
        return;
      }
      
      if (targetNumber <= 0) {
        setValidationErrors({ target: 'Target must be greater than 0' });
        Alert.alert('Validation Error', 'Target must be a positive number greater than 0.');
        return;
      }
      
      if (targetNumber > 10000) {
        setValidationErrors({ target: 'Target seems too large' });
        Alert.alert('Validation Error', 'Target number seems unusually large. Please check your input.');
        return;
      }
      
      // Validate frequency
      if (!newGoal.frequency || !['daily', 'weekly', 'monthly'].includes(newGoal.frequency)) {
        setValidationErrors({ frequency: 'Please select a valid frequency' });
        Alert.alert('Validation Error', 'Please select a frequency for your goal.');
        return;
      }
      
      const goalData = {
        title: trimmedTitle || `${newGoal.frequency} client goal`,
        frequency: newGoal.frequency,
        target: Math.round(targetNumber), // Ensure integer for client counts
        is_global: true, // All client acquisition goals are global
      };
      
      console.log('📤 Prepared goal data:', goalData);

      // Additional validation using the validation utility
      const validation = validateGoal(goalData);
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.errors);
        setValidationErrors(validation.errors);
        
        // Show specific validation error
        const errorMessages = Object.values(validation.errors).join('\n');
        Alert.alert('Validation Error', errorMessages);
        return;
      }

      console.log('✅ Validation passed, creating goal...');

      if (editingGoal) {
        console.log('📝 Updating existing goal:', editingGoal.id);
        await updateGoal(editingGoal.id, goalData);
        Alert.alert('Success', 'Goal updated successfully!');
        console.log('✅ Goal updated successfully');
      } else {
        console.log('➕ Creating new goal');
        await createGoal(goalData);
        Alert.alert('Success', 'Goal created successfully!');
        console.log('✅ Goal created successfully');
      }

      resetForm();
      setShowModal(false);
      
    } catch (error: any) {
      console.error('❌ Goal creation/update failed:', error);
      console.error('📄 Error details:', {
        message: error.message,
        stack: error.stack,
        formData: newGoal,
        editingGoal: editingGoal?.id
      });
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to save goal';
      if (error.message.includes('required')) {
        errorMessage = 'Missing required information. Please fill in all required fields.';
      } else if (error.message.includes('target')) {
        errorMessage = 'Invalid target value. Please enter a valid number.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        errorMessage = 'Database error. Please try again or contact support.';
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'A goal with similar settings already exists. Please modify your goal.';
      } else {
        errorMessage = `Failed to save goal: ${error.message}`;
      }
      
      Alert.alert(
        editingGoal ? 'Update Failed' : 'Creation Failed',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => {} },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id);
      setShowDeleteConfirm(null);
      Alert.alert('Success', 'Goal deleted successfully!');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Enhanced filtered and sorted goals with fuzzy search
  const filteredAndSortedGoals = useMemo(() => {
    let result = goals;

    // Apply new filter system
    if (Object.keys(selectedFilters).length > 0) {
      result = result.filter(goal => {
        return Object.entries(selectedFilters).every(([groupId, values]) => {
          if (values.length === 0) return true;
          
          switch (groupId) {
            case 'frequency':
              return values.includes(goal.frequency);
            case 'progress':
              const progress = calculateGoalProgress(goal, payments, clients);
              const progressPercentage = progress.percentage;
              
              return values.some((status: string) => {
                switch (status) {
                  case 'not_started':
                    return progressPercentage === 0;
                  case 'in_progress':
                    return progressPercentage > 0 && progressPercentage < 100;
                  case 'at_risk':
                    // Goals with low progress relative to time elapsed
                    return progressPercentage > 0 && progressPercentage < 50;
                  case 'completed':
                    return progressPercentage >= 100;
                  default:
                    return true;
                }
              });
            case 'target_range':
              const target = parseFloat(goal.target.toString());
              return values.some((range: any) => {
                if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
                  return target >= range.min && target <= range.max;
                }
                return false;
              });
            default:
              return true;
          }
        });
      });
    }

    // Apply fuzzy search
    if (debouncedSearch.trim()) {
      const searchResults = fuzzySearchItems(result, debouncedSearch, GOAL_SEARCH_FIELDS);
      result = searchResults.map(r => r.item);
    }

    // Apply sorting
    if (selectedSort) {
      const sortOption = GOAL_SORT_OPTIONS.find(opt => opt.key === selectedSort);
      if (sortOption) {
        // For progress sorting, calculate progress for each goal
        if (sortOption.field === 'progress_percentage') {
          result = result.sort((a, b) => {
            const progressA = calculateGoalProgress(a, payments, clients).percentage;
            const progressB = calculateGoalProgress(b, payments, clients).percentage;
            const comparison = progressA - progressB;
            return sortOption.direction === 'asc' ? comparison : -comparison;
          });
        } else {
          result = sortItems(result, { field: sortOption.field as keyof Goal, direction: sortOption.direction });
        }
      }
    } else {
      // Default sort: newest first
      result = sortItems(result, { field: 'created_at' as keyof Goal, direction: 'desc' });
    }

    return result;
  }, [goals, selectedFilters, debouncedSearch, selectedSort, payments, clients]);
  
  // Helper to check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(filters => filters.length > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    // Add null safety check for goal item
    if (!item) {
      console.warn('⚠️ Null goal item in renderGoal');
      return (
        <View className="card-elevated mb-4 bg-yellow-50 border border-yellow-200">
          <View className="p-4">
            <Text className="text-yellow-800 font-medium">⚠️ Goal data missing</Text>
            <Text className="text-yellow-600 text-sm mt-1">This goal has incomplete data and cannot be displayed properly.</Text>
          </View>
        </View>
      );
    }

    // Safe progress calculation with fallback
    let progress;
    try {
      progress = calculateGoalProgress(item, payments, clients);
    } catch (error) {
      console.warn('⚠️ Error calculating goal progress:', error);
      progress = {
        current: 0,
        percentage: 0,
        isComplete: false,
        periodStart: new Date(),
        periodEnd: new Date(),
      };
    }

    return (
      <View className={`card-elevated mb-4 animate-enter ${
        progress.isComplete ? 'border border-success/30' : ''
      }`}>
        {/* Goal Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Users size={20} color="#00D4AA" />
              <Text className="text-xl font-bold text-text-primary ml-2">
                {item.title}
              </Text>
            </View>
            
            <View className="flex-row items-center space-x-3 mb-2">
              <View className="bg-green-50 px-3 py-1 rounded-card">
                <Text className="text-xs font-medium text-green-600">
                  {item.frequency || 'weekly'} • client acquisition
                </Text>
              </View>
              
              <View className="bg-blue-50 px-3 py-1 rounded-card">
                <Text className="text-blue-600 text-xs font-medium">Global Goal</Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity 
              className="p-2 bg-green-50 rounded-card"
              onPress={() => handleOpenEditModal(item)}
            >
              <Edit size={16} color="#00D4AA" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-2 bg-red-50 rounded-card"
              onPress={() => setShowDeleteConfirm(item)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Section */}
        <View className="bg-gray-50 rounded-card p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-text-muted text-sm font-medium">Progress</Text>
            <Text className="text-lg font-bold text-text-primary">
              {progress.current} / {item.target} clients
            </Text>
          </View>
          
          {/* Enhanced Progress Bar */}
          <View className="bg-gray-100 rounded-button h-4 mb-2 overflow-hidden shadow-inner">
            <View 
              className={`h-4 rounded-button ${
                progress.isComplete 
                  ? 'bg-gradient-to-r from-green-400 to-green-500' 
                  : 'bg-gradient-to-r from-primary to-primary-dark'
              } shadow-sm`}
              style={{ 
                width: `${Math.min(progress.percentage, 100)}%`,
                opacity: progress.percentage > 0 ? 1 : 0.3,
                shadowColor: progress.isComplete ? '#22C55E' : '#00D4AA',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-text-muted text-sm">
              {Math.round(progress.percentage)}% complete
            </Text>
            {progress.isComplete && (
              <View className="flex-row items-center">
                <CheckCircle size={14} color="#00D9FF" />
                <Text className="text-success text-sm ml-1 font-medium">Completed!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Creation Date */}
        <Text className="text-xs text-text-muted">
          Created {formatDate(item.created_at)}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg-secondary">
        <LoadingEmptyState 
          title="Loading Goals" 
          description="Fetching your client acquisition goals..." 
          size="lg"
        />
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg-secondary">
        <EmptyState 
          icon="warning"
          title="Goals Error"
          description={error || "Failed to load goals. Please try again."}
          action={{
            label: "Retry",
            onPress: refetch,
            icon: "refresh"
          }}
          size="lg"
        />
      </SafeAreaView>
    );
  }

  const filteredGoals = filteredAndSortedGoals;
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => {
    const progress = calculateGoalProgress(goal, payments, clients);
    return progress.isComplete;
  }).length;
  const activeGoals = totalGoals - completedGoals;

  const renderHeader = () => (
    <View className="px-page py-section">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8 animate-enter">
        <View>
          <Text className="text-3xl font-bold text-text-primary">Goals</Text>
          <Text className="text-text-muted mt-1">{filteredGoals.length} goals tracking</Text>
          <View className="flex-row space-x-4 mt-2">
            <View className="status-success px-3 py-1 rounded-full">
              <Text className="text-xs font-medium">{completedGoals} completed</Text>
            </View>
            <View className="status-info px-3 py-1 rounded-full">
              <Text className="text-xs font-medium">{activeGoals} active</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          className="btn-primary flex-row items-center"
          onPress={handleOpenAddModal}
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-semibold ml-2">New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {goals.length > 0 && (
        <View className="flex-row gap-4 mb-8 animate-enter-delayed">
          <View className="card-primary flex-1">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-text-primary">{totalGoals}</Text>
                <Text className="text-text-muted text-sm">Total Goals</Text>
              </View>
              <Target size={20} color="#667EEA" />
            </View>
          </View>
          <View className="card-primary flex-1">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-success">{completedGoals}</Text>
                <Text className="text-text-muted text-sm">Completed</Text>
              </View>
              <CheckCircle size={20} color="#00D9FF" />
            </View>
          </View>
          <View className="card-primary flex-1">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-primary">{activeGoals}</Text>
                <Text className="text-text-muted text-sm">Active</Text>
              </View>
              <Target size={20} color="#00D4AA" />
            </View>
          </View>
        </View>
      )}

      {/* Goal Streak Tracker */}
      <GoalStreak 
        streakData={goalStreak} 
        loading={false}
        onStreakTap={() => {
          Alert.alert(
            '🔥 Goal Streak Info',
            'Keep making progress on your goals daily to maintain your streak! Each day you add clients, complete goals, or make business progress counts toward your streak.',
            [{ text: 'Got it!' }]
          );
        }}
      />

      {/* Enhanced Search Bar with Filters and Sort */}
      <View className="mb-6 gap-4 animate-enter-delayed-2">
        {/* Search Input with Sort */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <SearchInput
              placeholder="Search goals by title, frequency..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </View>
          
          <SortDropdown
            options={GOAL_SORT_OPTIONS}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            placeholder="Sort"
            className="min-w-[120px] max-w-[140px]"
          />
        </View>
        
        {/* Filter Bar */}
        <FilterBar
          filterGroups={GOAL_FILTER_GROUPS}
          selectedFilters={selectedFilters}
          onFilterChange={(groupId, values) => {
            setSelectedFilters(prev => ({
              ...prev,
              [groupId]: values
            }));
          }}
          onClearAll={() => setSelectedFilters({})}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${themeClasses.bg.secondary} theme-${theme}`}>
      <FlatList
        data={filteredGoals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D4AA']}
            tintColor="#00D4AA"
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">
                {searchQuery || hasActiveFilters ? 'No goals found' : 'No goals set'}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {searchQuery || hasActiveFilters 
                  ? 'Try adjusting your search or filter'
                  : 'Create your first goal to start tracking progress'
                }
              </Text>
            </View>
          }
        />

        {/* Enhanced Create/Edit Goal Modal */}
        <SimpleFormModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
          fullScreen={true}
          size="lg"
        >
          {(() => {
            try {
              return (
                <ScrollView 
                  className="flex-1" 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="space-y-4 px-6 py-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Goal Title</Text>
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-base ${
                      validationErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={newGoal.title}
                    onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                    placeholder="Enter goal title (optional)"
                  />
                  {validationErrors.title && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.title}</Text>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Frequency *</Text>
                  <View className="flex-row space-x-2">
                    {['daily', 'weekly', 'monthly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        className={`flex-1 px-4 py-3 rounded-lg border ${
                          newGoal.frequency === freq
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-300'
                        }`}
                        onPress={() => setNewGoal({ ...newGoal, frequency: freq as 'daily' | 'weekly' | 'monthly' })}
                      >
                        <Text className={`text-center font-medium ${
                          newGoal.frequency === freq ? 'text-white' : 'text-gray-700'
                        }`}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {validationErrors.frequency && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.frequency}</Text>
                  )}
                </View>

                {/* Goal Type Info */}
                <View className="bg-green-50 px-4 py-3 rounded-lg">
                  <View className="flex-row items-center">
                    <Users size={20} color="#00D4AA" />
                    <Text className="text-green-700 font-medium ml-2">
                      Client Acquisition Goal
                    </Text>
                  </View>
                  <Text className="text-green-600 text-sm mt-1">
                    Track new client acquisitions across your business
                  </Text>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Target *</Text>
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-base ${
                      validationErrors.target ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={newGoal.target}
                    onChangeText={(text) => setNewGoal({ ...newGoal, target: text })}
                    placeholder="Enter target clients (e.g. 10)"
                    keyboardType="numeric"
                  />
                  {validationErrors.target && (
                    <Text className="text-red-500 text-sm mt-1">{validationErrors.target}</Text>
                  )}
                </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-4"
                onPress={() => setShowModal(false)}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-lg py-4 ${
                  !newGoal.target ? 'bg-gray-300' : 'bg-primary'
                }`}
                onPress={handleCreateGoal}
                disabled={!newGoal.target}
              >
                <Text className={`text-center font-semibold text-base ${
                  !newGoal.target ? 'text-gray-500' : 'text-white'
                }`}>
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Text>
              </TouchableOpacity>
            </View>
                  </View>
                </ScrollView>
              );
            } catch (err) {
              console.error('Modal form crash:', err);
              return <Text>Error loading form</Text>;
            }
          })()}
        </SimpleFormModal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          visible={!!showDeleteConfirm}
          title="Delete Goal"
          message={`Are you sure you want to delete "${showDeleteConfirm?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => showDeleteConfirm && handleDeleteGoal(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          destructive={true}
          icon="trash"
        />
    </SafeAreaView>
  );
}