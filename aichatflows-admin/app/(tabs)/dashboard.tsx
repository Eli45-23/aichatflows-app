import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, TrendingUp, Users, MapPin, CreditCard, Target, DollarSign, Brain, Sparkles } from 'lucide-react-native';
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
import { getCompletion, isOpenAIConfigured, testEnvironmentVariables } from '../../src/utils/openai';

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
  
  // AI-related state
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<string>('');
  const [weeklyPlanLoading, setWeeklyPlanLoading] = useState(false);
  const [showWeeklyPlanModal, setShowWeeklyPlanModal] = useState(false);

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

  // Generate AI summary when dashboard loads or data changes
  useEffect(() => {
    if (!loading && stats && isOpenAIConfigured()) {
      generateAISummary();
    }
  }, [stats.totalClients, stats.weekRevenue, currentWeek?.visits, currentWeek?.goalsCompleted]);

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

  // Generate AI Summary
  const generateAISummary = async () => {
    console.log('🤖 Starting AI Summary generation...');
    
    if (!isOpenAIConfigured()) {
      console.warn('⚠️ OpenAI not configured for AI Summary');
      
      // Run comprehensive environment variable test
      const { envTestResults, recommendations } = testEnvironmentVariables();
      console.log('🔍 Running OpenAI environment variable diagnostics...');
      console.log('📋 Recommendations:');
      recommendations.forEach((rec, i) => console.log(`   ${rec}`));
      
      setAiSummary('⚠️ Configure OpenAI API key to enable AI insights. Check console for detailed setup instructions.');
      return;
    }

    setAiSummaryLoading(true);
    
    try {
      const businessData = {
        visits: currentWeek?.visits || 0,
        goalsCompleted: currentWeek?.goalsCompleted || 0,
        totalClients: stats.totalClients || 0,
        weekRevenue: stats.weekRevenue || 0
      };
      
      console.log('📊 Business data for AI Summary:', businessData);
      
      const prompt = `As a business coach, provide a brief 2-3 sentence summary of this week's performance:
      - Client visits: ${businessData.visits} visits
      - Goals completed: ${businessData.goalsCompleted} goals
      - Total active clients: ${businessData.totalClients}
      - Revenue this week: $${businessData.weekRevenue}
      
      Focus on insights and actionable next steps.`;

      console.log('📤 Sending prompt to OpenAI (GPT-4):', prompt);
      console.log('🔧 Model: gpt-4, Max tokens: 1000, Temperature: 0.7');
      
      const startTime = Date.now();
      const response = await getCompletion(prompt, 'You are a helpful business performance analyst.');
      const duration = Date.now() - startTime;
      
      console.log(`✅ AI Summary generated successfully in ${duration}ms`);
      console.log('📝 AI Response:', response);
      
      setAiSummary(response);
      
    } catch (error: any) {
      console.error('❌ AI Summary generation failed:', error);
      
      // Enhanced error logging
      console.error('📄 Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      
      // Determine specific error type and provide actionable feedback
      let errorMessage = 'Unable to generate summary';
      
      if (error.status === 401 || error.message.includes('API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
        console.error('🔑 API Key issue detected');
      } else if (error.status === 429 || error.message.includes('rate limit')) {
        errorMessage = 'OpenAI rate limit exceeded. Please wait a moment and try again.';
        console.error('⏱️ Rate limit issue detected');
      } else if (error.status === 402 || error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'OpenAI account quota exceeded. Please check your billing and usage.';
        console.error('💳 Billing/quota issue detected');
      } else if (error.status >= 500 || error.message.includes('server')) {
        errorMessage = 'OpenAI service temporarily unavailable. Please try again later.';
        console.error('🌐 Server issue detected');
      } else if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection issue. Please check your internet connection.';
        console.error('📡 Network issue detected');
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        console.error('⏰ Timeout issue detected');
      } else {
        errorMessage = `AI service error: ${error.message}`;
        console.error('❓ Unknown error type');
      }
      
      setAiSummary(errorMessage);
      
    } finally {
      setAiSummaryLoading(false);
      console.log('🏁 AI Summary generation process completed');
    }
  };

  // Generate Weekly Plan
  const generateWeeklyPlan = async () => {
    console.log('📋 Starting Weekly Plan generation...');
    
    if (!isOpenAIConfigured()) {
      console.warn('⚠️ OpenAI not configured for Weekly Plan');
      
      // Run comprehensive environment variable test for Weekly Plan
      const { envTestResults, recommendations } = testEnvironmentVariables();
      console.log('🔍 Running OpenAI environment variable diagnostics for Weekly Plan...');
      console.log('📋 Recommendations:');
      recommendations.forEach((rec, i) => console.log(`   ${rec}`));
      
      Alert.alert(
        'Configuration Required', 
        'Please configure your OpenAI API key to use AI features. Check the console for detailed setup instructions.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    setShowWeeklyPlanModal(true);
    
    // Small delay to ensure modal is rendered before starting loading
    await new Promise(resolve => setTimeout(resolve, 100));
    setWeeklyPlanLoading(true);
    
    try {
      const businessData = {
        totalClients: stats.totalClients || 0,
        weekRevenue: stats.weekRevenue || 0,
        goalsCompleted: currentWeek?.goalsCompleted || 0,
        visits: currentWeek?.visits || 0,
        newClients: currentWeek?.newClients || 0
      };
      
      console.log('📊 Business data for Weekly Plan:', businessData);
      
      const prompt = `Based on this week's data, create a strategic weekly plan:
      
      Current Status:
      - Active clients: ${businessData.totalClients}
      - Weekly revenue: $${businessData.weekRevenue}
      - Completed goals: ${businessData.goalsCompleted}
      - Client visits: ${businessData.visits}
      - New clients this week: ${businessData.newClients}
      
      Create a prioritized action plan with 5-7 specific tasks for next week. Format as a numbered list with clear, actionable items.`;

      console.log('📤 Sending prompt to OpenAI (GPT-4):', prompt);
      console.log('🔧 Model: gpt-4, Max tokens: 1000, Temperature: 0.7');
      
      const startTime = Date.now();
      const response = await getCompletion(prompt, 'You are an expert business strategist creating actionable weekly plans.');
      const duration = Date.now() - startTime;
      
      console.log(`✅ Weekly Plan generated successfully in ${duration}ms`);
      console.log('📝 AI Response:', response);
      
      setWeeklyPlan(response);
      
    } catch (error: any) {
      console.error('❌ Weekly Plan generation failed:', error);
      
      // Enhanced error logging
      console.error('📄 Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      
      // Determine specific error type and provide actionable feedback
      let errorMessage = 'Failed to generate weekly plan';
      
      if (error.status === 401 || error.message.includes('API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key configuration and try again.';
        console.error('🔑 API Key issue detected');
      } else if (error.status === 429 || error.message.includes('rate limit')) {
        errorMessage = 'OpenAI rate limit exceeded. Please wait a few minutes and try again.';
        console.error('⏱️ Rate limit issue detected');
      } else if (error.status === 402 || error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'OpenAI account quota exceeded. Please check your billing and usage limits.';
        console.error('💳 Billing/quota issue detected');
      } else if (error.status >= 500 || error.message.includes('server')) {
        errorMessage = 'OpenAI service temporarily unavailable. Please try again in a few minutes.';
        console.error('🌐 Server issue detected');
      } else if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        console.error('📡 Network issue detected');
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        console.error('⏰ Timeout issue detected');
      } else {
        errorMessage = `AI service error: ${error.message}. Please try again or contact support.`;
        console.error('❓ Unknown error type');
      }
      
      setWeeklyPlan(errorMessage);
      
    } finally {
      setWeeklyPlanLoading(false);
      console.log('🏁 Weekly Plan generation process completed');
    }
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
                    {((goalStreak?.currentStreak ?? 0) > 0 || (retention?.retentionRate ?? 0) > 0) ? (
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

          {/* AI Summary Section */}
          <View className="mb-6">
            <Card>
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Brain size={24} color="#6366F1" />
                    <Text className="text-xl font-bold text-gray-900 ml-2">🤖 AI Summary</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={generateAISummary}
                    disabled={aiSummaryLoading}
                    className="px-3 py-1 bg-indigo-100 rounded-full flex-row items-center"
                  >
                    {aiSummaryLoading ? (
                      <ActivityIndicator size="small" color="#6366F1" />
                    ) : (
                      <Sparkles size={14} color="#6366F1" />
                    )}
                    <Text className="text-indigo-700 text-sm font-medium ml-1">
                      {aiSummaryLoading ? 'Generating...' : 'Refresh'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                  {aiSummaryLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#6366F1" />
                      <Text className="text-indigo-600 ml-2">Analyzing your data...</Text>
                    </View>
                  ) : aiSummary ? (
                    <Text className="text-gray-700 leading-6">{aiSummary}</Text>
                  ) : !isOpenAIConfigured() ? (
                    <Text className="text-amber-600 text-sm">
                      ⚠️ Configure OpenAI API key to enable AI insights
                    </Text>
                  ) : (
                    <Text className="text-gray-500 italic">Tap refresh to generate AI insights</Text>
                  )}
                </View>

                {/* Generate Weekly Plan Button */}
                <TouchableOpacity
                  onPress={generateWeeklyPlan}
                  disabled={weeklyPlanLoading || !isOpenAIConfigured()}
                  className={`mt-4 p-3 rounded-lg flex-row items-center justify-center ${
                    isOpenAIConfigured() && !weeklyPlanLoading 
                      ? 'bg-indigo-600' 
                      : 'bg-gray-300'
                  }`}
                >
                  {weeklyPlanLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Target size={18} color="white" />
                  )}
                  <Text className={`font-semibold ml-2 ${
                    isOpenAIConfigured() && !weeklyPlanLoading 
                      ? 'text-white' 
                      : 'text-gray-500'
                  }`}>
                    {weeklyPlanLoading ? 'Generating Plan...' : 'Generate Weekly Plan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>

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
                    <StatusBadge status="active" size="sm" />
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

      {/* Weekly Plan Modal */}
      <Modal
        visible={showWeeklyPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWeeklyPlanModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Target size={24} color="#6366F1" />
                  <Text className="text-xl font-bold text-gray-900 ml-2">Weekly Action Plan</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowWeeklyPlanModal(false)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <ScrollView 
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Fixed height container to prevent scroll snapping */}
              <View style={{ minHeight: 500 }}>
                {weeklyPlanLoading ? (
                  <View className="flex-1 justify-center items-center py-12">
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text className="text-indigo-600 mt-4 text-center">
                      Analyzing your data and creating personalized plan...
                    </Text>
                    {/* Invisible spacer to maintain layout height */}
                    <View style={{ height: 140 }} />
                  </View>
                ) : weeklyPlan ? (
                  <View className="space-y-4">
                    <View className="bg-indigo-50 p-4 rounded-lg">
                      <Text className="text-indigo-700 font-medium mb-2">
                        🎯 AI-Generated Strategic Plan
                      </Text>
                      <Text className="text-indigo-600 text-sm">
                        Based on your current performance metrics and business goals
                      </Text>
                    </View>
                    
                    <View className="bg-white border border-gray-200 rounded-lg p-4">
                      <Text className="text-gray-800 leading-7">{weeklyPlan}</Text>
                    </View>

                    {/* Button with extra spacing to ensure it's accessible */}
                    <View style={{ marginTop: 24, paddingBottom: 80 }}>
                      <TouchableOpacity
                        onPress={generateWeeklyPlan}
                        disabled={weeklyPlanLoading}
                        className="bg-indigo-600 p-3 rounded-lg flex-row items-center justify-center"
                        activeOpacity={0.8}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        style={{ minHeight: 50 }}
                      >
                        <Sparkles size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">Generate New Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center py-12">
                    <Text className="text-red-600 text-center mb-6">
                      Failed to generate plan. Please try again.
                    </Text>
                    <TouchableOpacity
                      onPress={generateWeeklyPlan}
                      disabled={weeklyPlanLoading}
                      className="bg-indigo-600 p-3 rounded-lg"
                      activeOpacity={0.8}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      style={{ minHeight: 50 }}
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                    {/* Invisible spacer to maintain layout height */}
                    <View style={{ height: 140 }} />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}