import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

export interface FilterOption {
  key: string;
  label: string;
  value: any;
  icon?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  showClearAll?: boolean;
}

export interface FilterBarProps {
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, any[]>;
  onFilterChange: (groupId: string, selectedValues: any[]) => void;
  onClearAll?: () => void;
  showActiveCount?: boolean;
  className?: string;
}

export function FilterBar({
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClearAll,
  showActiveCount = true,
  className = ''
}: FilterBarProps) {
  const totalActiveFilters = Object.values(selectedFilters).reduce(
    (total, filters) => total + filters.length,
    0
  );

  const handleFilterToggle = (groupId: string, option: FilterOption, multiSelect: boolean = false) => {
    const currentFilters = selectedFilters[groupId] || [];
    
    if (multiSelect) {
      // Multi-select: toggle the option
      const isSelected = currentFilters.includes(option.value);
      const newFilters = isSelected
        ? currentFilters.filter(f => f !== option.value)
        : [...currentFilters, option.value];
      onFilterChange(groupId, newFilters);
    } else {
      // Single select: replace current selection
      const isSelected = currentFilters.includes(option.value);
      const newFilters = isSelected ? [] : [option.value];
      onFilterChange(groupId, newFilters);
    }
  };

  const handleClearGroup = (groupId: string) => {
    onFilterChange(groupId, []);
  };

  const isOptionSelected = (groupId: string, value: any): boolean => {
    return (selectedFilters[groupId] || []).includes(value);
  };

  return (
    <View className={`bg-white ${className}`}>
      {/* Header with active count and clear all */}
      {(totalActiveFilters > 0 || showActiveCount) && (
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100">
          <Text className="text-sm text-gray-600">
            {totalActiveFilters > 0 ? `${totalActiveFilters} filter${totalActiveFilters > 1 ? 's' : ''} active` : 'No filters'}
          </Text>
          {totalActiveFilters > 0 && onClearAll && (
            <TouchableOpacity
              onPress={onClearAll}
              className="flex-row items-center px-2 py-1"
            >
              <X size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Groups */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {filterGroups.map((group) => (
          <View key={group.id} className="mr-6">
            {/* Group Label */}
            <View className="flex-row items-center mb-2">
              <Text className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                {group.label}
              </Text>
              {(selectedFilters[group.id] || []).length > 0 && group.showClearAll && (
                <TouchableOpacity
                  onPress={() => handleClearGroup(group.id)}
                  className="ml-2 p-0.5"
                >
                  <X size={12} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Options */}
            <View className="flex-row flex-wrap">
              {group.options.map((option) => {
                const isSelected = isOptionSelected(group.id, option.value);
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => handleFilterToggle(group.id, option, group.multiSelect)}
                    className={`mr-2 mb-2 px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Predefined filter configurations for common use cases
export const CLIENT_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { key: 'active', label: 'Active', value: 'active' },
      { key: 'in_progress', label: 'In Progress', value: 'in_progress' },
      { key: 'paused', label: 'Paused', value: 'paused' },
      { key: 'cancelled', label: 'Cancelled', value: 'cancelled' },
    ],
    showClearAll: true,
  },
  {
    id: 'plan',
    label: 'Plan',
    options: [
      { key: 'starter', label: 'Starter', value: 'starter' },
      { key: 'pro', label: 'Pro', value: 'pro' },
    ],
    showClearAll: true,
  },
  {
    id: 'payment_status',
    label: 'Payment',
    options: [
      { key: 'paid', label: 'Paid', value: 'paid' },
      { key: 'unpaid', label: 'Unpaid', value: 'unpaid' },
      { key: 'overdue', label: 'Overdue', value: 'overdue' },
    ],
    showClearAll: true,
  },
  {
    id: 'signup_type',
    label: 'Signup Type',
    options: [
      { key: 'in_person', label: 'In-Person', value: true },
      { key: 'online', label: 'Online', value: false },
    ],
    showClearAll: true,
  },
];

export const PAYMENT_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { key: 'pending', label: 'Pending', value: 'pending' },
      { key: 'confirmed', label: 'Confirmed', value: 'confirmed' },
      { key: 'failed', label: 'Failed', value: 'failed' },
    ],
    showClearAll: true,
  },
  {
    id: 'amount_range',
    label: 'Amount',
    options: [
      { key: 'under_100', label: 'Under $100', value: { min: 0, max: 99 } },
      { key: '100_200', label: '$100-$200', value: { min: 100, max: 200 } },
      { key: 'over_200', label: 'Over $200', value: { min: 201, max: Infinity } },
    ],
    showClearAll: true,
  },
];

export const GOAL_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'frequency',
    label: 'Frequency',
    options: [
      { key: 'daily', label: 'Daily', value: 'daily' },
      { key: 'weekly', label: 'Weekly', value: 'weekly' },
      { key: 'monthly', label: 'Monthly', value: 'monthly' },
    ],
    showClearAll: true,
  },
  {
    id: 'progress',
    label: 'Progress',
    options: [
      { key: 'not_started', label: 'Not Started', value: 'not_started' },
      { key: 'in_progress', label: 'In Progress', value: 'in_progress' },
      { key: 'at_risk', label: 'At Risk', value: 'at_risk' },
      { key: 'completed', label: 'Completed', value: 'completed' },
    ],
    showClearAll: true,
  },
];

export const VISIT_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'date_range',
    label: 'Date Range',
    options: [
      { key: 'today', label: 'Today', value: 'today' },
      { key: 'week', label: 'This Week', value: 'week' },
      { key: 'month', label: 'This Month', value: 'month' },
      { key: 'quarter', label: 'This Quarter', value: 'quarter' },
    ],
    showClearAll: true,
  },
  {
    id: 'client_assignment',
    label: 'Assignment',
    options: [
      { key: 'assigned', label: 'Assigned', value: 'assigned' },
      { key: 'unassigned', label: 'Unassigned', value: 'unassigned' },
    ],
    showClearAll: true,
  },
];