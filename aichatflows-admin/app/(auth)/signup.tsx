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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, testConnection } = useAuth();

  const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert('Success', 'Account created! Please check your email to verify.');
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
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
              Create Account
            </Text>
            <Text className="text-gray-600">
              Sign up for AIChatFlows Admin
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
                placeholder="Create a password"
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg py-4 mt-6"
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            {debugMode && (
              <TouchableOpacity
                className="bg-gray-600 rounded-lg py-3 mt-4"
                onPress={testConnection}
              >
                <Text className="text-white text-center font-semibold text-base">
                  🔧 Test Supabase Connection
                </Text>
              </TouchableOpacity>
            )}

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}