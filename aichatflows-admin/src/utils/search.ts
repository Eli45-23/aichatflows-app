// Enhanced search and filter utilities with fuzzy matching

import { useState, useEffect } from 'react';

export interface SearchableItem {
  [key: string]: any;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching with typo tolerance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Higher score means more similar
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

/**
 * Check if search term matches target with fuzzy logic
 */
function fuzzyMatch(searchTerm: string, target: string, threshold: number = 0.6): boolean {
  if (!searchTerm || !target) return false;
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();
  
  // Exact match
  if (normalizedTarget.includes(normalizedSearch)) return true;
  
  // Fuzzy match for longer terms
  if (normalizedSearch.length >= 3) {
    const similarity = calculateSimilarity(normalizedSearch, normalizedTarget);
    return similarity >= threshold;
  }
  
  return false;
}

/**
 * Search configuration for different field types
 */
export interface SearchField {
  key: string;
  weight: number; // Higher weight = more important in search results
  fuzzy?: boolean; // Enable fuzzy matching for this field
  threshold?: number; // Fuzzy match threshold (0-1)
}

/**
 * Search result with relevance score
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
}

/**
 * Get nested object value by dot notation key
 */
function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((value, k) => value?.[k], obj);
}

export interface FilterConfig<T> {
  field: keyof T;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
  caseSensitive?: boolean;
}

export interface SortConfig<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

/**
 * Enhanced fuzzy search function with configurable fields and weights
 */
export function fuzzySearchItems<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  fields: SearchField[],
  maxResults?: number
): SearchResult<T>[] {
  if (!searchTerm.trim()) return items.map(item => ({ item, score: 1, matchedFields: [] }));

  const results: SearchResult<T>[] = [];
  const normalizedSearch = searchTerm.toLowerCase().trim();

  for (const item of items) {
    let totalScore = 0;
    let maxFieldScore = 0;
    const matchedFields: string[] = [];

    for (const field of fields) {
      const value = getNestedValue(item, field.key);
      if (!value) continue;

      const stringValue = String(value);
      let fieldScore = 0;

      // Exact substring match gets highest score
      if (stringValue.toLowerCase().includes(normalizedSearch)) {
        fieldScore = 1;
        matchedFields.push(field.key);
      }
      // Fuzzy match if enabled
      else if (field.fuzzy !== false && normalizedSearch.length >= 3) {
        const similarity = calculateSimilarity(normalizedSearch, stringValue.toLowerCase());
        const threshold = field.threshold || 0.6;
        
        if (similarity >= threshold) {
          fieldScore = similarity * 0.8; // Fuzzy matches get slightly lower score
          matchedFields.push(field.key);
        }
      }

      // Apply field weight
      const weightedScore = fieldScore * field.weight;
      totalScore += weightedScore;
      maxFieldScore = Math.max(maxFieldScore, weightedScore);
    }

    // Only include items with at least one match
    if (totalScore > 0) {
      // Use max field score to prevent bias toward items with many fields
      const finalScore = maxFieldScore;
      results.push({ item, score: finalScore, matchedFields });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Limit results if specified
  return maxResults ? results.slice(0, maxResults) : results;
}

// Search function that looks through multiple fields (legacy/simple version)
export function searchItems<T extends SearchableItem>(
  items: T[],
  query: string,
  searchFields: Array<keyof T>,
  caseSensitive = false
): T[] {
  if (!query.trim()) return items;

  const searchTerm = caseSensitive ? query : query.toLowerCase();

  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      
      const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
      return stringValue.includes(searchTerm);
    });
  });
}

// Advanced search with multiple criteria
export function advancedSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  searchFields: Array<keyof T>,
  filters: FilterConfig<T>[] = [],
  sort?: SortConfig<T>
): T[] {
  let result = items;

  // Apply text search
  if (query.trim()) {
    result = searchItems(result, query, searchFields);
  }

  // Apply filters
  result = applyFilters(result, filters);

  // Apply sorting
  if (sort) {
    result = sortItems(result, sort);
  }

  return result;
}

// Apply multiple filters
export function applyFilters<T extends SearchableItem>(
  items: T[],
  filters: FilterConfig<T>[]
): T[] {
  return items.filter(item => {
    return filters.every(filter => applyFilter(item, filter));
  });
}

// Apply single filter
function applyFilter<T extends SearchableItem>(
  item: T,
  filter: FilterConfig<T>
): boolean {
  const value = item[filter.field];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return value === filterValue;
    
    case 'contains':
      if (typeof value === 'string' && typeof filterValue === 'string') {
        const itemStr = filter.caseSensitive ? value : value.toLowerCase();
        const filterStr = filter.caseSensitive ? filterValue : filterValue.toLowerCase();
        return itemStr.includes(filterStr);
      }
      return false;
    
    case 'startsWith':
      if (typeof value === 'string' && typeof filterValue === 'string') {
        const itemStr = filter.caseSensitive ? value : value.toLowerCase();
        const filterStr = filter.caseSensitive ? filterValue : filterValue.toLowerCase();
        return itemStr.startsWith(filterStr);
      }
      return false;
    
    case 'endsWith':
      if (typeof value === 'string' && typeof filterValue === 'string') {
        const itemStr = filter.caseSensitive ? value : value.toLowerCase();
        const filterStr = filter.caseSensitive ? filterValue : filterValue.toLowerCase();
        return itemStr.endsWith(filterStr);
      }
      return false;
    
    case 'greaterThan':
      return Number(value) > Number(filterValue);
    
    case 'lessThan':
      return Number(value) < Number(filterValue);
    
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const numValue = Number(value);
        return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
      }
      return false;
    
    default:
      return true;
  }
}

// Sort items
export function sortItems<T extends SearchableItem>(
  items: T[],
  sort: SortConfig<T>
): T[] {
  return [...items].sort((a, b) => {
    const aValue = a ? a[sort.field] : null;
    const bValue = b ? b[sort.field] : null;

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sort.direction === 'asc' ? comparison : -comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return sort.direction === 'asc' ? comparison : -comparison;
    }

    // Try date comparison if both values can be converted to dates
    try {
      const aDate = new Date(aValue as any);
      const bDate = new Date(bValue as any);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        const comparison = aDate.getTime() - bDate.getTime();
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    } catch {
      // Fall through to string comparison
    }

    // Default string comparison
    const comparison = String(aValue).localeCompare(String(bValue));
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

// Debounced search hook

export function useDebounceSearch(
  value: string,
  delay: number = 300
): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search hooks for specific data types
export function useClientSearch() {
  const searchFields = ['name', 'email', 'phone', 'instagram_handle', 'notes'];
  
  const filterClients = (
    clients: any[],
    query: string,
    status?: string,
    plan?: string,
    platform?: string
  ) => {
    const filters: FilterConfig<any>[] = [];
    
    if (status && status !== 'all') {
      filters.push({ field: 'status', operator: 'equals', value: status });
    }
    
    if (plan && plan !== 'all') {
      filters.push({ field: 'plan', operator: 'equals', value: plan });
    }
    
    if (platform && platform !== 'all') {
      filters.push({ field: 'platform_preference', operator: 'equals', value: platform });
    }
    
    return advancedSearch(clients, query, searchFields, filters);
  };
  
  return { filterClients, searchFields };
}

export function usePaymentSearch() {
  const searchFields = ['amount', 'description'];
  
  const filterPayments = (
    payments: any[],
    query: string,
    status?: string,
    dateRange?: [Date, Date],
    amountRange?: [number, number]
  ) => {
    const filters: FilterConfig<any>[] = [];
    
    if (status && status !== 'all') {
      filters.push({ field: 'status', operator: 'equals', value: status });
    }
    
    if (dateRange) {
      // Note: This would need custom implementation for date ranges
    }
    
    if (amountRange) {
      filters.push({ field: 'amount', operator: 'between', value: amountRange });
    }
    
    return advancedSearch(payments, query, searchFields, filters);
  };
  
  return { filterPayments, searchFields };
}

export function useGoalSearch() {
  const searchFields = ['title'];
  
  const filterGoals = (
    goals: any[],
    query: string,
    frequency?: string,
    metric?: string,
    status?: 'completed' | 'active'
  ) => {
    const filters: FilterConfig<any>[] = [];
    
    if (frequency && frequency !== 'all') {
      filters.push({ field: 'frequency', operator: 'equals', value: frequency });
    }
    
    if (metric && metric !== 'all') {
      filters.push({ field: 'metric', operator: 'equals', value: metric });
    }
    
    // Status would need to be calculated based on progress
    
    return advancedSearch(goals, query, searchFields, filters);
  };
  
  return { filterGoals, searchFields };
}

export function useVisitSearch() {
  const searchFields = ['location', 'business_name'];
  
  const filterVisits = (
    visits: any[],
    query: string,
    dateRange?: [Date, Date]
  ) => {
    const filters: FilterConfig<any>[] = [];
    
    if (dateRange) {
      // Note: This would need custom implementation for date ranges
    }
    
    return advancedSearch(visits, query, searchFields, filters);
  };
  
  return { filterVisits, searchFields };
}

// Utility for highlighting search terms in text
export function highlightSearchTerm(
  text: string,
  searchTerm: string,
  highlightClass = 'bg-yellow-200'
): string {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
}

// Export utility for creating search-enabled lists
export interface SearchableListProps<T> {
  items: T[];
  searchFields: Array<keyof T>;
  placeholder?: string;
  onSearch?: (query: string, results: T[]) => void;
  onFilter?: (filters: FilterConfig<T>[]) => void;
  onSort?: (sort: SortConfig<T>) => void;
}

export function createSearchableList<T extends SearchableItem>(
  props: SearchableListProps<T>
) {
  return {
    search: (query: string) => searchItems(props.items, query, props.searchFields),
    filter: (filters: FilterConfig<T>[]) => applyFilters(props.items, filters),
    sort: (sort: SortConfig<T>) => sortItems(props.items, sort),
    advancedSearch: (query: string, filters: FilterConfig<T>[], sort?: SortConfig<T>) =>
      advancedSearch(props.items, query, props.searchFields, filters, sort),
  };
}

/**
 * Predefined search configurations for common entities
 */
export const CLIENT_SEARCH_FIELDS: SearchField[] = [
  { key: 'name', weight: 1.0, fuzzy: true },
  { key: 'email', weight: 0.9, fuzzy: false },
  { key: 'business_name', weight: 0.8, fuzzy: true },
  { key: 'phone', weight: 0.7, fuzzy: false },
  { key: 'business_type', weight: 0.6, fuzzy: true },
  { key: 'products_or_services', weight: 0.5, fuzzy: true },
  { key: 'notes', weight: 0.4, fuzzy: true },
];

export const PAYMENT_SEARCH_FIELDS: SearchField[] = [
  { key: 'client.name', weight: 1.0, fuzzy: true },
  { key: 'amount', weight: 0.9, fuzzy: false },
  { key: 'description', weight: 0.7, fuzzy: true },
  { key: 'client.email', weight: 0.6, fuzzy: false },
  { key: 'payment_method', weight: 0.5, fuzzy: true },
];

export const VISIT_SEARCH_FIELDS: SearchField[] = [
  { key: 'location', weight: 1.0, fuzzy: true },
  { key: 'client.name', weight: 0.9, fuzzy: true },
  { key: 'client.business_name', weight: 0.8, fuzzy: true },
  { key: 'notes', weight: 0.6, fuzzy: true },
];

export const GOAL_SEARCH_FIELDS: SearchField[] = [
  { key: 'title', weight: 1.0, fuzzy: true },
  { key: 'frequency', weight: 0.7, fuzzy: false },
  { key: 'metric', weight: 0.6, fuzzy: false },
  { key: 'client.name', weight: 0.8, fuzzy: true },
];

/**
 * Highlight matching text in search results
 */
export function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Simple search for basic string matching (fallback)
 */
export function simpleSearch<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchKeys: string[]
): T[] {
  if (!searchTerm.trim()) return items;

  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return items.filter(item => {
    return searchKeys.some(key => {
      const value = getNestedValue(item, key);
      return value && String(value).toLowerCase().includes(normalizedSearch);
    });
  });
}