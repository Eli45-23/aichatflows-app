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

// Enhanced error boundary for navigation issues
class NavigationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    console.log("🔴 NavigationErrorBoundary: Error detected, returning error state");
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Safe logging to prevent TurboModule crashes
    try {
      console.error('🔴 NavigationErrorBoundary: Navigation Error caught');
      console.error('🔴 NavigationErrorBoundary: Error name:', error.name || 'Unknown');
      console.error('🔴 NavigationErrorBoundary: Error message:', error.message || 'No message');
      console.error('🔴 NavigationErrorBoundary: Has stack trace:', !!error.stack);
      console.error('🔴 NavigationErrorBoundary: Has component stack:', !!errorInfo.componentStack);
    } catch (logError) {
      // Fallback if even simple logging fails
      console.error('🔴 NavigationErrorBoundary: Error logging failed');
    }
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
  console.log("🟢 RootLayout: Component rendering...");
  console.log("🔧 RootLayout: React and imports loaded successfully");
  
  // Early return with simple text for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 Debug mode: Rendering simple component");
  }
  
  console.log("🔧 RootLayout: About to initialize state...");
  
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  
  console.log("🔧 RootLayout: State initialized, navigation ready:", isNavigationReady);

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
      // Safe logging to prevent TurboModule crashes
      try {
        console.error('🔴 Global Error Boundary: Error caught in root layout');
        console.error('🔴 Global Error Boundary: Error name:', error.name || 'Unknown');
        console.error('🔴 Global Error Boundary: Error message:', error.message || 'No message');
        console.error('🔴 Global Error Boundary: Has stack trace:', !!error.stack);
        console.error('🔴 Global Error Boundary: Has component stack:', !!errorInfo.componentStack);
      } catch (logError) {
        // Fallback if even simple logging fails
        console.error('🔴 Global Error Boundary: Error logging failed');
      }
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