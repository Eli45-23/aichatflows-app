import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { testNetworkConnectivity, validateSupabaseUrl } from '../../src/utils/networkDebug';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-600">
              Sign in to AIChatFlows Admin
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg py-4 mt-6"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Don&apos;t have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' && (
              <TouchableOpacity
                className="mt-4 bg-gray-200 rounded-lg py-3"
                onPress={async () => {
                  const urlValidation = validateSupabaseUrl();
                  if (!urlValidation.valid) {
                    Alert.alert('URL Validation Failed', urlValidation.error);
                  } else {
                    Alert.alert('URL Valid', `Project ID: ${urlValidation.projectId}`);
                  }
                  await testNetworkConnectivity();
                }}
              >
                <Text className="text-center text-gray-700">🔧 Test Network</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}