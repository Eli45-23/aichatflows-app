import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, TrendingUp, Users, MapPin, CreditCard, Target, DollarSign } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useDashboardStats } from '../../src/hooks/useDashboardStats';
import { useAdvancedMetrics } from '../../src/hooks/useAdvancedMetrics';
import { useNotifications } from '../../src/hooks/useNotifications';
import { 
  Button, Card, StatsCard, ActionCard, EmptyState, LoadingEmptyState, NetworkErrorEmptyState, 
  Badge, StatusBadge, MetricsSummary, QuickSummaryCard, CompactStreakIndicator, 
  CompactRetentionIndicator, ClientsChart, RevenueChart, NotificationCenter, NotificationBell
} from '../../src/components';
import { calculateRevenueStats, formatCurrency as formatCurrencyUtil, generateRevenueSummary } from '../../src/utils/finance';
import { useActivityLog } from '../../src/hooks/useActivityLog';
import { ActivityLog } from '../../src/components/ActivityLog';
import { showDemoResetDialog, showClearDataDialog } from '../../src/utils/demoData';
import { useClients } from '../../src/hooks/useClients';
import { useGoals } from '../../src/hooks/useGoals';
import { useBusinessVisits } from '../../src/hooks/useBusinessVisits';
import { useNotificationCenter } from '../../src/hooks/useNotificationCenter';

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { stats, loading, error, refetch } = useDashboardStats();
  const { 
    currentWeek, 
    currentMonth, 
    previousWeek, 
    previousMonth, 
    retention, 
    goalStreak, 
    trends7Days,
    trends30Days,
    loading: metricsLoading,
    refreshMetrics,
    getPerformanceInsights
  } = useAdvancedMetrics();
  const { 
    permissionGranted, 
    scheduleSmartNotifications,
    showAchievementNotification 
  } = useNotifications();
  const { clients } = useClients();
  const { goals } = useGoals();
  const { visits } = useBusinessVisits();
  const { activities, loading: activitiesLoading, getRecentActivities } = useActivityLog();
  const { unreadCount } = useNotificationCenter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdvancedView, setShowAdvancedView] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refreshMetrics()]);
    setRefreshing(false);
  };

  // Schedule smart notifications when data changes
  useEffect(() => {
    if (permissionGranted && clients.length > 0 && goals.length > 0) {
      scheduleSmartNotifications(clients, goals, visits);
    }
  }, [clients.length, goals.length, visits.length, permissionGranted]);

  // Get performance insights for dashboard
  const insights = getPerformanceInsights();
  
  // Calculate revenue statistics for Phase 7
  const revenueStats = calculateRevenueStats(clients);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', `Failed to sign out: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const showAdminMenu = () => {
    Alert.alert(
      'Admin Functions',
      'Choose an admin function:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset to Demo Data', onPress: showDemoResetDialog },
        { text: 'Clear All Data', style: 'destructive', onPress: showClearDataDialog },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-secondary">
        <LoadingEmptyState 
          title="Loading Dashboard" 
          description="Fetching your latest stats and data..." 
          size="lg"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-bg-secondary">
        <NetworkErrorEmptyState 
          title="Dashboard Error"
          description={error || "Failed to load dashboard data. Please try again."}
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

  return (
    <SafeAreaView className="flex-1 bg-bg-secondary">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D4AA']}
            tintColor="#00D4AA"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-page py-section pb-8">
          {/* Header */}
          <View className="mb-6">
            {/* Branding */}
            <View className="mb-4">
              <Text className="text-2xl font-bold text-primary mb-1">AIChatFlows Admin</Text>
              <View className="w-12 h-1 bg-primary rounded-full" />
            </View>
            
            {/* Main Header */}
            <View className="flex-row justify-between items-start gap-4">
              <TouchableOpacity onLongPress={showAdminMenu} activeOpacity={1} className="flex-1 min-w-0">
                <View>
                  <Text className="text-3xl font-bold text-text-primary">Dashboard</Text>
                  <View className="mt-2">
                    <Text className="text-text-muted mb-1">Welcome back</Text>
                    {(goalStreak?.currentStreak > 0 || retention?.retentionRate > 0) ? (
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <CompactStreakIndicator streakData={goalStreak} />
                        <CompactRetentionIndicator retention={retention} />
                      </View>
                    ) : (
                      <Text className="text-text-muted text-sm italic">Ready to track your progress</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              
              <View className="flex-row items-center gap-3 flex-shrink-0">
                <NotificationBell 
                  unreadCount={unreadCount}
                  onPress={() => setShowNotifications(true)}
                />
                <Button 
                  variant="secondary"
                  size="sm"
                  icon="log-out"
                  onPress={handleSignOut}
                >
                  Sign Out
                </Button>
              </View>
            </View>
          </View>

          {/* Performance Insights */}
          {insights.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">💡 Performance Insights</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                {insights.map((insight, index) => (
                  <View key={index} className={`p-4 rounded-xl min-w-72 mr-3 ${
                    insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg mr-2">{insight.icon}</Text>
                      <Text className={`font-semibold ${
                        insight.type === 'positive' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {insight.title}
                      </Text>
                    </View>
                    <Text className={`text-sm ${
                      insight.type === 'positive' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {insight.message}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Phase 7: Revenue Summary */}
          <View className="mb-6">
            <Card>
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">💰 Revenue Summary</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert('Revenue Details', generateRevenueSummary(revenueStats))}
                  className="px-3 py-1 bg-green-100 rounded-full"
                >
                  <Text className="text-green-700 text-sm font-medium">Details</Text>
                </TouchableOpacity>
              </View>
              
              <View className="space-y-3">
                {/* Total Revenue */}
                <View className="bg-green-50 p-4 rounded-lg">
                  <Text className="text-2xl font-bold text-green-700">
                    {formatCurrencyUtil(revenueStats.totalRevenue)}
                  </Text>
                  <Text className="text-green-600 text-sm">Monthly Recurring Revenue</Text>
                </View>

                {/* Plan Breakdown */}
                <View className="flex-row space-x-3">
                  <View className="flex-1 bg-blue-50 p-3 rounded-lg">
                    <Text className="text-lg font-bold text-blue-700">
                      {revenueStats.starterCount}
                    </Text>
                    <Text className="text-blue-600 text-xs">Starter Plans</Text>
                    <Text className="text-blue-500 text-xs">
                      {formatCurrencyUtil(revenueStats.starterRevenue)} earned
                    </Text>
                  </View>
                  <View className="flex-1 bg-purple-50 p-3 rounded-lg">
                    <Text className="text-lg font-bold text-purple-700">
                      {revenueStats.proCount}
                    </Text>
                    <Text className="text-purple-600 text-xs">Pro Plans</Text>
                    <Text className="text-purple-500 text-xs">
                      {formatCurrencyUtil(revenueStats.proRevenue)} earned
                    </Text>
                  </View>
                </View>

                {/* Payment Status */}
                <View className="flex-row space-x-2">
                  <View className="flex-1 bg-green-50 p-2 rounded">
                    <Text className="text-lg font-bold text-green-700">{revenueStats.paidCount}</Text>
                    <Text className="text-green-600 text-xs">Paid</Text>
                  </View>
                  <View className="flex-1 bg-yellow-50 p-2 rounded">
                    <Text className="text-lg font-bold text-yellow-700">{revenueStats.unpaidCount}</Text>
                    <Text className="text-yellow-600 text-xs">Unpaid</Text>
                  </View>
                  <View className="flex-1 bg-red-50 p-2 rounded">
                    <Text className="text-lg font-bold text-red-700">{revenueStats.overdueCount}</Text>
                    <Text className="text-red-600 text-xs">Overdue</Text>
                  </View>
                </View>
              </View>
            </View>
            </Card>
          </View>

          {/* Weekly/Monthly Summary */}
          <View className="mb-6">
            <MetricsSummary
            currentWeek={currentWeek}
            currentMonth={currentMonth}
            previousWeek={previousWeek}
            previousMonth={previousMonth}
            loading={metricsLoading}
            />
          </View>

          {/* Hero Stats Cards */}
          <View className="gap-4 mb-6">
            {/* Main Revenue Card */}
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              subtitle={`${stats.paymentsByStatus.confirmed} confirmed payments`}
              icon="card"
              trend="up"
              trendValue="+12%"
              color="primary"
              onPress={() => router.push('/analytics/revenue')}
            />

            {/* Clients Card */}
            <Card
              variant="elevated"
              size="lg"
              onPress={() => router.push('/analytics/clients')}
              pressable
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-gray-900 mb-1">{stats.totalClients}</Text>
                  <Text className="text-gray-600 text-lg">Total Clients</Text>
                  <View className="flex-row space-x-3 mt-3">
                    <StatusBadge status="active" size="xs" />
                    <Badge variant="success" size="xs">
                      {stats.clientsByStatus.active} Active
                    </Badge>
                    <Badge variant="warning" size="xs">
                      {stats.clientsByStatus.in_progress} In Progress
                    </Badge>
                  </View>
                </View>
                <View className="bg-primary/10 p-4 rounded-lg">
                  <Ionicons name="people" size={28} color="#00D4AA" />
                </View>
              </View>
            </Card>

            {/* Performance Grid */}
            <View className="gap-4">
              <Text className="text-gray-700 font-semibold text-lg">Revenue Performance</Text>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <StatsCard
                    title="This Week"
                    value={formatCurrency(stats.weekRevenue)}
                    icon="calendar"
                    color="success"
                    onPress={() => router.push('/analytics/revenue?period=week')}
                  />
                </View>
                
                <View className="flex-1">
                  <StatsCard
                    title="This Month"
                    value={formatCurrency(stats.monthRevenue)}
                    icon="calendar-outline"
                    color="warning"
                    onPress={() => router.push('/analytics/revenue?period=month')}
                  />
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <StatsCard
                    title="Today"
                    value={formatCurrency(stats.todayRevenue)}
                    icon="today"
                    trend="up"
                    trendValue="+5%"
                    color="primary"
                    onPress={() => router.push('/analytics/revenue?period=today')}
                  />
                </View>
                
                <View className="flex-1">
                  <StatsCard
                    title="Active Goals"
                    value={stats.activeGoals.toString()}
                    icon="flag"
                    color="primary"
                    onPress={() => router.push('/analytics/goals')}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold text-lg mb-4">Quick Actions</Text>
            <View className="gap-4">
              <ActionCard
                title="View Onboarding Submissions"
                description={`${stats.newSubmissions} new submission${stats.newSubmissions !== 1 ? 's' : ''}`}
                icon="document-text"
                onPress={() => router.push('/onboarding')}
              />

              <ActionCard
                title="Mark Business Visit"
                description={`${stats.recentVisits} visit${stats.recentVisits !== 1 ? 's' : ''} this week`}
                icon="location"
                onPress={() => router.push('/(tabs)/visits')}
              />

              <ActionCard
                title="Track Goals"
                description={`${stats.activeGoals} active goal${stats.activeGoals !== 1 ? 's' : ''}`}
                icon="flag"
                onPress={() => router.push('/(tabs)/goals')}
              />
            </View>
          </View>

          {/* Activity Log */}
          <View className="mb-6">
            <ActivityLog 
              activities={getRecentActivities(8)}
              loading={activitiesLoading}
              limit={8}
              onActivityPress={(activity) => {
                Alert.alert(
                  'Activity Details',
                  `${activity.description}\n\nTime: ${new Date(activity.timestamp).toLocaleString()}`,
                  [{ text: 'OK' }]
                );
              }}
            />
          </View>

          {/* Performance Trends Charts */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">📈 Performance Trends</Text>
              <TouchableOpacity 
                onPress={() => setShowAdvancedView(!showAdvancedView)}
                className="flex-row items-center px-3 py-1 bg-primary/10 rounded-lg"
              >
                <Text className="text-sm text-primary mr-1">
                  {showAdvancedView ? '7 Days' : '30 Days'}
                </Text>
                <Ionicons name="swap-horizontal" size={14} color="#00D4AA" />
              </TouchableOpacity>
            </View>
            
            {trends7Days.length > 0 || trends30Days.length > 0 ? (
              <View className="space-y-4">
                <ClientsChart 
                  data={showAdvancedView ? trends30Days : trends7Days} 
                  title={`New Clients - Last ${showAdvancedView ? '30' : '7'} Days`}
                />
                <RevenueChart 
                  data={showAdvancedView ? trends30Days : trends7Days} 
                  title={`Revenue Trends - Last ${showAdvancedView ? '30' : '7'} Days`}
                />
              </View>
            ) : (
              <View className="bg-white rounded-xl p-6 shadow-sm">
                <View className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Ionicons name="bar-chart" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2 text-center">Performance trends will populate after the first client goal or visit is recorded</Text>
                </View>
              </View>
            )}
          </View>

          {/* Payment Status Overview */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">💰 Payment Status</Text>
            {stats.paymentsByStatus.confirmed + stats.paymentsByStatus.pending + stats.paymentsByStatus.failed > 0 ? (
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Confirmed Payments</Text>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                    <Text className="font-semibold text-green-600">
                      {stats.paymentsByStatus.confirmed}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Pending Payments</Text>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                    <Text className="font-semibold text-yellow-600">
                      {stats.paymentsByStatus.pending}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Failed Payments</Text>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                    <Text className="font-semibold text-red-600">
                      {stats.paymentsByStatus.failed}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-gray-500 text-center mb-2">No payment records yet</Text>
                <Text className="text-gray-400 text-sm text-center">
                  Payment status will appear here once clients begin making payments
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Notification Center Modal */}
      <NotificationCenter 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
}