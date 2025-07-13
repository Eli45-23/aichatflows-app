import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Check } from 'lucide-react-native';

export interface SortOption {
  key: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
  icon?: React.ReactNode;
}

export interface SortDropdownProps {
  options: SortOption[];
  selectedSort: string | null;
  onSortChange: (sortKey: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function SortDropdown({
  options,
  selectedSort,
  onSortChange,
  placeholder = 'Sort by...',
  className = ''
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.key === selectedSort);

  const handleSelectOption = (optionKey: string) => {
    onSortChange(optionKey === selectedSort ? null : optionKey);
    setIsOpen(false);
  };

  const handleClearSort = () => {
    onSortChange(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* Sort Button */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className={`flex-row items-center px-3 py-2 bg-white border border-gray-300 rounded-lg ${className}`}
        activeOpacity={0.7}
      >
        <View className="flex-1 flex-row items-center">
          {selectedOption ? (
            <>
              <Text className="text-sm font-medium text-gray-900 mr-2">
                {selectedOption.label}
              </Text>
              {selectedOption.direction === 'asc' ? (
                <ArrowUp size={14} color="#6B7280" />
              ) : (
                <ArrowDown size={14} color="#6B7280" />
              )}
            </>
          ) : (
            <Text className="text-sm text-gray-500">{placeholder}</Text>
          )}
        </View>
        {isOpen ? (
          <ChevronUp size={16} color="#9CA3AF" />
        ) : (
          <ChevronDown size={16} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          className="flex-1 bg-black/20"
        >
          <View className="flex-1 justify-center items-center px-4">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-lg max-w-sm w-full"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              {/* Header */}
              <View className="px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">Sort Options</Text>
                  {selectedSort && (
                    <TouchableOpacity
                      onPress={handleClearSort}
                      className="px-2 py-1"
                    >
                      <Text className="text-sm text-primary font-medium">Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Options */}
              <ScrollView className="max-h-80">
                {options.map((option) => {
                  const isSelected = option.key === selectedSort;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => handleSelectOption(option.key)}
                      className={`px-4 py-3 flex-row items-center ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                      activeOpacity={0.7}
                    >
                      <View className="flex-1 flex-row items-center">
                        <Text
                          className={`text-sm font-medium mr-2 ${
                            isSelected ? 'text-primary' : 'text-gray-900'
                          }`}
                        >
                          {option.label}
                        </Text>
                        {option.direction === 'asc' ? (
                          <ArrowUp size={14} color={isSelected ? '#00D4AA' : '#6B7280'} />
                        ) : (
                          <ArrowDown size={14} color={isSelected ? '#00D4AA' : '#6B7280'} />
                        )}
                      </View>
                      {isSelected && (
                        <Check size={16} color="#00D4AA" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Close Button */}
              <View className="px-4 py-3 border-t border-gray-100">
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  className="bg-gray-100 py-2 px-4 rounded-lg"
                >
                  <Text className="text-center text-sm font-medium text-gray-700">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Predefined sort configurations for common entities
export const CLIENT_SORT_OPTIONS: SortOption[] = [
  {
    key: 'name_asc',
    label: 'Name A-Z',
    field: 'name',
    direction: 'asc',
  },
  {
    key: 'name_desc',
    label: 'Name Z-A',
    field: 'name',
    direction: 'desc',
  },
  {
    key: 'created_newest',
    label: 'Newest First',
    field: 'created_at',
    direction: 'desc',
  },
  {
    key: 'created_oldest',
    label: 'Oldest First',
    field: 'created_at',
    direction: 'asc',
  },
  {
    key: 'plan_asc',
    label: 'Plan A-Z',
    field: 'plan',
    direction: 'asc',
  },
  {
    key: 'plan_desc',
    label: 'Plan Z-A',
    field: 'plan',
    direction: 'desc',
  },
];

export const PAYMENT_SORT_OPTIONS: SortOption[] = [
  {
    key: 'amount_desc',
    label: 'Amount High-Low',
    field: 'amount',
    direction: 'desc',
  },
  {
    key: 'amount_asc',
    label: 'Amount Low-High',
    field: 'amount',
    direction: 'asc',
  },
  {
    key: 'date_newest',
    label: 'Date Newest',
    field: 'payment_date',
    direction: 'desc',
  },
  {
    key: 'date_oldest',
    label: 'Date Oldest',
    field: 'payment_date',
    direction: 'asc',
  },
  {
    key: 'client_asc',
    label: 'Client A-Z',
    field: 'client.name',
    direction: 'asc',
  },
  {
    key: 'client_desc',
    label: 'Client Z-A',
    field: 'client.name',
    direction: 'desc',
  },
  {
    key: 'status_asc',
    label: 'Status A-Z',
    field: 'status',
    direction: 'asc',
  },
];

export const GOAL_SORT_OPTIONS: SortOption[] = [
  {
    key: 'progress_desc',
    label: 'Progress High-Low',
    field: 'progress_percentage',
    direction: 'desc',
  },
  {
    key: 'progress_asc',
    label: 'Progress Low-High',
    field: 'progress_percentage',
    direction: 'asc',
  },
  {
    key: 'title_asc',
    label: 'Title A-Z',
    field: 'title',
    direction: 'asc',
  },
  {
    key: 'title_desc',
    label: 'Title Z-A',
    field: 'title',
    direction: 'desc',
  },
  {
    key: 'target_desc',
    label: 'Target High-Low',
    field: 'target',
    direction: 'desc',
  },
  {
    key: 'target_asc',
    label: 'Target Low-High',
    field: 'target',
    direction: 'asc',
  },
  {
    key: 'created_newest',
    label: 'Newest First',
    field: 'created_at',
    direction: 'desc',
  },
  {
    key: 'created_oldest',
    label: 'Oldest First',
    field: 'created_at',
    direction: 'asc',
  },
];

export const VISIT_SORT_OPTIONS: SortOption[] = [
  {
    key: 'date_newest',
    label: 'Date Newest',
    field: 'created_at',
    direction: 'desc',
  },
  {
    key: 'date_oldest',
    label: 'Date Oldest',
    field: 'created_at',
    direction: 'asc',
  },
  {
    key: 'location_asc',
    label: 'Location A-Z',
    field: 'location',
    direction: 'asc',
  },
  {
    key: 'location_desc',
    label: 'Location Z-A',
    field: 'location',
    direction: 'desc',
  },
  {
    key: 'client_asc',
    label: 'Client A-Z',
    field: 'client.name',
    direction: 'asc',
  },
  {
    key: 'client_desc',
    label: 'Client Z-A',
    field: 'client.name',
    direction: 'desc',
  },
];