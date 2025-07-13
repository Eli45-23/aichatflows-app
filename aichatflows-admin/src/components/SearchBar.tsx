import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebounceSearch } from '../utils/search';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceDelay?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onSearch,
  onClear,
  debounceDelay = 300,
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debouncedValue = useDebounceSearch(internalValue, debounceDelay);

  // Use controlled value if provided
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setInternalValue('');
    onClear?.();
  };

  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }
    // If controlled, parent should handle the state update
  };

  return (
    <View className={`relative ${className}`}>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-base text-text-primary"
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        value={currentValue}
        onChangeText={handleChangeText}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="center"
        style={{ lineHeight: 20 }}
      />
      <Ionicons
        name="search"
        size={20}
        color="#9CA3AF"
        style={{ position: 'absolute', left: 12, top: 14 }}
      />
      {currentValue ? (
        <TouchableOpacity
          style={{ position: 'absolute', right: 12, top: 14 }}
          onPress={handleClear}
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Enhanced search bar with filters
interface AdvancedSearchBarProps extends SearchBarProps {
  filters?: React.ReactNode;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function AdvancedSearchBar({
  filters,
  showFilters = false,
  onToggleFilters,
  ...searchBarProps
}: AdvancedSearchBarProps) {
  return (
    <View>
      <View className="flex-row space-x-2">
        <View className="flex-1">
          <SearchBar {...searchBarProps} />
        </View>
        {filters && (
          <TouchableOpacity
            className={`px-4 py-3 rounded-lg border ${
              showFilters ? 'bg-primary border-primary' : 'bg-white border-gray-300'
            }`}
            onPress={onToggleFilters}
          >
            <Ionicons 
              name="options" 
              size={20} 
              color={showFilters ? '#FFFFFF' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        )}
      </View>
      {showFilters && filters && (
        <View className="mt-4">
          {filters}
        </View>
      )}
    </View>
  );
}

// Quick search component with suggestions
interface QuickSearchProps extends SearchBarProps {
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  maxSuggestions?: number;
}

export function QuickSearch({
  suggestions = [],
  onSuggestionPress,
  maxSuggestions = 5,
  ...searchBarProps
}: QuickSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const currentValue = searchBarProps.value || '';

  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(currentValue.toLowerCase()) &&
      suggestion.toLowerCase() !== currentValue.toLowerCase()
    )
    .slice(0, maxSuggestions);

  return (
    <View className="relative">
      <SearchBar 
        {...searchBarProps}
        onSearch={(query) => {
          setShowSuggestions(query.length > 0 && filteredSuggestions.length > 0);
          searchBarProps.onSearch(query);
        }}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10">
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={suggestion}
              className={`px-4 py-3 border-b border-gray-100 ${
                index === filteredSuggestions.length - 1 ? 'border-b-0' : ''
              }`}
              onPress={() => {
                onSuggestionPress?.(suggestion);
                setShowSuggestions(false);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <Text className="text-gray-700 ml-2">{suggestion}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}