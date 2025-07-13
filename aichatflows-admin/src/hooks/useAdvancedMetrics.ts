import { useState, useEffect, useCallback } from 'react';
import { 
  WeeklyMetrics, 
  MonthlyMetrics, 
  ClientRetentionMetrics, 
  GoalStreakData,
  TrendData,
  calculateWeeklyMetrics,
  calculateMonthlyMetrics,
  calculateClientRetentionMetrics,
  calculateGoalStreak,
  generateTrendData,
  getCurrentWeek,
  getCurrentMonth,
  getPreviousWeek,
  getPreviousMonth
} from '../utils/metrics';
import { useClients } from './useClients';
import { usePayments } from './usePayments';
import { useGoals } from './useGoals';
import { useBusinessVisits } from './useBusinessVisits';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdvancedMetricsState {
  currentWeek: WeeklyMetrics | null;
  currentMonth: MonthlyMetrics | null;
  previousWeek: WeeklyMetrics | null;
  previousMonth: MonthlyMetrics | null;
  retention: ClientRetentionMetrics | null;
  goalStreak: GoalStreakData | null;
  trends30Days: TrendData[];
  trends7Days: TrendData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'advanced_metrics_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdvancedMetrics() {
  const [state, setState] = useState<AdvancedMetricsState>({
    currentWeek: null,
    currentMonth: null,
    previousWeek: null,
    previousMonth: null,
    retention: null,
    goalStreak: null,
    trends30Days: [],
    trends7Days: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const { clients, loading: clientsLoading } = useClients();
  const { payments, loading: paymentsLoading } = usePayments();
  const { goals, loading: goalsLoading } = useGoals();
  const { visits, loading: visitsLoading } = useBusinessVisits();

  const dataLoading = clientsLoading || paymentsLoading || goalsLoading || visitsLoading;

  // Load cached metrics
  const loadCachedMetrics = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          setState(prev => ({
            ...prev,
            ...data,
            loading: false,
            lastUpdated: new Date(timestamp),
          }));
          return true; // Using cached data
        }
      }
    } catch (error) {
      console.warn('Failed to load cached metrics:', error);
    }
    return false; // Need to calculate fresh
  }, []);

  // Save metrics to cache
  const cacheMetrics = useCallback(async (metrics: Partial<AdvancedMetricsState>) => {
    try {
      const cacheData = {
        data: metrics,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache metrics:', error);
    }
  }, []);

  // Calculate all metrics
  const calculateMetrics = useCallback(async () => {
    if (dataLoading || clients.length === 0) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check cache first
      const usingCache = await loadCachedMetrics();
      if (usingCache) return;

      console.log('Calculating fresh advanced metrics...');

      // Calculate current period metrics
      const currentWeekPeriod = getCurrentWeek();
      const currentMonthPeriod = getCurrentMonth();
      const previousWeekPeriod = getPreviousWeek();
      const previousMonthPeriod = getPreviousMonth();

      const currentWeek = calculateWeeklyMetrics(
        clients, payments, goals, visits,
        currentWeekPeriod.start, currentWeekPeriod.end
      );

      const currentMonth = calculateMonthlyMetrics(
        clients, payments, goals, visits,
        currentMonthPeriod.start, currentMonthPeriod.end
      );

      const previousWeek = calculateWeeklyMetrics(
        clients, payments, goals, visits,
        previousWeekPeriod.start, previousWeekPeriod.end
      );

      const previousMonth = calculateMonthlyMetrics(
        clients, payments, goals, visits,
        previousMonthPeriod.start, previousMonthPeriod.end
      );

      // Calculate retention metrics
      const retention = calculateClientRetentionMetrics(clients, visits);

      // Calculate goal streak
      const goalStreak = calculateGoalStreak(goals, clients, payments);

      // Generate trend data
      const trends30Days = generateTrendData(clients, payments, visits, 30);
      const trends7Days = generateTrendData(clients, payments, visits, 7);

      const newMetrics = {
        currentWeek,
        currentMonth,
        previousWeek,
        previousMonth,
        retention,
        goalStreak,
        trends30Days,
        trends7Days,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };

      setState(prev => ({ ...prev, ...newMetrics }));

      // Cache the results
      await cacheMetrics(newMetrics);

      console.log('Advanced metrics calculation complete');
    } catch (error: any) {
      console.error('Failed to calculate advanced metrics:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to calculate metrics',
      }));
    }
  }, [clients, payments, goals, visits, dataLoading, loadCachedMetrics, cacheMetrics]);

  // Force refresh metrics (bypass cache)
  const refreshMetrics = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await calculateMetrics();
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  }, [calculateMetrics]);

  // Calculate metrics when data changes
  useEffect(() => {
    if (!dataLoading) {
      calculateMetrics();
    }
  }, [dataLoading, calculateMetrics]);

  // Comparison utilities
  const getWeekOverWeekChange = useCallback((metric: keyof WeeklyMetrics) => {
    if (!state.currentWeek || !state.previousWeek) return null;
    
    const current = state.currentWeek[metric] as number;
    const previous = state.previousWeek[metric] as number;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [state.currentWeek, state.previousWeek]);

  const getMonthOverMonthChange = useCallback((metric: keyof MonthlyMetrics) => {
    if (!state.currentMonth || !state.previousMonth) return null;
    
    const current = state.currentMonth[metric] as number;
    const previous = state.previousMonth[metric] as number;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [state.currentMonth, state.previousMonth]);

  // Get performance insights
  const getPerformanceInsights = useCallback(() => {
    const insights = [];

    // Week over week insights
    const clientsChange = getWeekOverWeekChange('newClients');
    const revenueChange = getWeekOverWeekChange('totalRevenue');
    const visitsChange = getWeekOverWeekChange('businessVisits');

    if (clientsChange !== null) {
      if (clientsChange > 20) {
        insights.push({
          type: 'positive',
          title: 'Strong Client Growth',
          message: `New clients increased by ${clientsChange.toFixed(0)}% this week!`,
          icon: '📈'
        });
      } else if (clientsChange < -20) {
        insights.push({
          type: 'warning',
          title: 'Client Acquisition Slowing',
          message: `New clients decreased by ${Math.abs(clientsChange).toFixed(0)}% this week.`,
          icon: '⚠️'
        });
      }
    }

    if (revenueChange !== null) {
      if (revenueChange > 25) {
        insights.push({
          type: 'positive',
          title: 'Revenue Surge',
          message: `Revenue increased by ${revenueChange.toFixed(0)}% this week!`,
          icon: '💰'
        });
      }
    }

    // Retention insights
    if (state.retention) {
      if (state.retention.retentionRate < 30) {
        insights.push({
          type: 'warning',
          title: 'Low Client Retention',
          message: `Only ${state.retention.retentionRate.toFixed(0)}% of clients have multiple visits.`,
          icon: '🔄'
        });
      } else if (state.retention.retentionRate > 70) {
        insights.push({
          type: 'positive',
          title: 'Excellent Retention',
          message: `${state.retention.retentionRate.toFixed(0)}% client retention rate - outstanding!`,
          icon: '⭐'
        });
      }
    }

    // Goal streak insights
    if (state.goalStreak) {
      if (state.goalStreak.currentStreak >= 7) {
        insights.push({
          type: 'positive',
          title: 'On Fire!',
          message: `You're on a ${state.goalStreak.currentStreak}-day goal streak! 🔥`,
          icon: '🔥'
        });
      } else if (state.goalStreak.currentStreak === 0) {
        insights.push({
          type: 'info',
          title: 'Streak Opportunity',
          message: 'Start a new goal streak by making progress today!',
          icon: '🎯'
        });
      }
    }

    return insights.slice(0, 3); // Limit to top 3 insights
  }, [state, getWeekOverWeekChange, getMonthOverMonthChange]);

  return {
    ...state,
    refreshMetrics,
    getWeekOverWeekChange,
    getMonthOverMonthChange,
    getPerformanceInsights,
    isStale: state.lastUpdated && (Date.now() - state.lastUpdated.getTime()) > CACHE_DURATION,
  };
}