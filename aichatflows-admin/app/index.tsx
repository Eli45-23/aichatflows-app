import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { session, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  // Redirect based on authentication state
  if (session) {
    // User is authenticated, redirect to dashboard
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // User is not authenticated, redirect to login
  return <Redirect href="/(auth)/login" />;
}