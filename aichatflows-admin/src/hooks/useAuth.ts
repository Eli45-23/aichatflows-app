import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { initializePushNotifications, removePushToken } from '../utils/pushTokens';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Auth Debug] ${message}`, data || '');
  }
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debugLog('Initializing auth state...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        debugLog('Error getting initial session:', error);
        console.error('Auth initialization error:', error);
      } else {
        debugLog('Initial session loaded:', !!session);
      }
      
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debugLog(`Auth state changed: ${event}`, !!session);
        setSession(session);
        
        // Initialize push notifications when user signs in
        if (event === 'SIGNED_IN' && session?.user?.id) {
          try {
            await initializePushNotifications(session.user.id);
          } catch (error) {
            debugLog('Failed to initialize push notifications:', error);
          }
        }
      }
    );

    return () => {
      debugLog('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    debugLog('Attempting sign in...', { email });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        debugLog('Sign in error:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'Sign in failed.';
        
        if (error.message?.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          userMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message?.includes('Too many requests')) {
          userMessage = 'Too many sign in attempts. Please wait a moment and try again.';
        } else if (error.message?.includes('Network')) {
          userMessage = 'Network error. Please check your internet connection.';
        }
        
        throw new Error(userMessage);
      }

      debugLog('Sign in successful:', !!data.session);
      return data;
    } catch (error: any) {
      debugLog('Sign in exception:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    debugLog('Attempting sign up...', { email });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        debugLog('Sign up error:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'Sign up failed.';
        
        if (error.message?.includes('User already registered')) {
          userMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message?.includes('Password should be at least')) {
          userMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message?.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('Network')) {
          userMessage = 'Network error. Please check your internet connection.';
        } else if (error.message?.includes('fetch')) {
          userMessage = 'Connection error. Please check your internet connection and try again.';
        }
        
        throw new Error(userMessage);
      }

      debugLog('Sign up successful:', !!data.user);
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        debugLog('Email confirmation required');
        Alert.alert(
          'Check Your Email',
          'We sent you a confirmation link. Please check your email and click the link to activate your account.',
          [{ text: 'OK' }]
        );
      }
      
      return data;
    } catch (error: any) {
      debugLog('Sign up exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    debugLog('Attempting sign out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debugLog('Sign out error:', error);
        throw error;
      }
      
      debugLog('Sign out successful');
    } catch (error: any) {
      debugLog('Sign out exception:', error);
      throw error;
    }
  };

  // Connection test function for debugging
  const testConnection = async () => {
    debugLog('Testing connection from useAuth...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      Alert.alert(
        'Connection Test',
        'Successfully connected to Supabase!',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error: any) {
      Alert.alert(
        'Connection Test Failed',
        `Error: ${error.message}\n\nPlease check your Supabase configuration.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  return {
    session,
    user: session?.user || null,
    loading,
    signIn,
    signUp,
    signOut,
    testConnection, // Exposed for debugging
  };
}