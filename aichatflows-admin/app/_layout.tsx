import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import React from 'react';
import '../global.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Error boundary for navigation issues
class NavigationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: 20
        }}>
          <Text style={{ 
            fontSize: 18, 
            color: '#DC2626',
            textAlign: 'center',
            marginBottom: 10
          }}>
            Navigation Error
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#6B7280',
            textAlign: 'center' 
          }}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    console.log('🚀 RootLayout: Initializing app...');
    
    // Initialize notifications
    registerForPushNotificationsAsync();
    
    // Add a small delay to ensure navigation context is properly set up
    const timer = setTimeout(() => {
      console.log('✅ RootLayout: Navigation context ready');
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  async function registerForPushNotificationsAsync() {
    try {
      console.log('📱 RootLayout: Setting up notifications...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('⚠️ RootLayout: Push notification permission not granted');
        return;
      }
      
      console.log('✅ RootLayout: Notifications set up successfully');
    } catch (error) {
      console.error('❌ RootLayout: Error setting up notifications:', error);
    }
  }

  // Show loading screen while navigation context is being set up
  if (!isNavigationReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#fff'
          }}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={{ 
              marginTop: 16, 
              fontSize: 16, 
              color: '#6B7280',
              textAlign: 'center' 
            }}>
              Initializing Navigation...
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Global Error Boundary:', error, errorInfo);
    }}>
      <NavigationErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  presentation: 'card',
                  animation: 'default',
                }}
                initialRouteName="index"
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="analytics" options={{ headerShown: false }} />
                <Stack.Screen name="client" options={{ headerShown: false }} />
                <Stack.Screen name="payment" options={{ headerShown: false }} />
              </Stack>
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </NavigationErrorBoundary>
    </ErrorBoundary>
  );
}