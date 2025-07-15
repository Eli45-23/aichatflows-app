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
  console.log("🟢 useAuth Build 5: Hook initializing...");
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log("🔧 useAuth Build 5: State initialized - loading:", loading, "session:", !!session);

  useEffect(() => {
    console.log('🚀 useAuth Build 5: useEffect triggered - initializing auth state...');
    debugLog('Initializing auth state...');
    
    // Get initial session with enhanced error handling
    try {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        try {
          if (error) {
            debugLog('Error getting initial session:', error);
            console.error('🔴 useAuth Build 5: Auth initialization error');
            console.error('🔴 Error name:', error.name || 'Unknown');
            console.error('🔴 Error message:', error.message || 'No message');
            console.error('🔴 Has stack trace:', !!error.stack);
          } else {
            debugLog('Initial session loaded:', !!session);
            console.log('✅ useAuth Build 5: Initial session loaded successfully');
          }
          
          setSession(session);
          setLoading(false);
        } catch (sessionError) {
          console.error('🔴 useAuth Build 5: Session processing error');
          console.error('🔴 Error name:', sessionError.name || 'Unknown');
          console.error('🔴 Error message:', sessionError.message || 'No message');
          setSession(null);
          setLoading(false);
        }
      }).catch(getSessionError => {
        console.error('🔴 useAuth Build 5: getSession promise rejected');
        console.error('🔴 Error name:', getSessionError.name || 'Unknown');
        console.error('🔴 Error message:', getSessionError.message || 'No message');
        setSession(null);
        setLoading(false);
      });
    } catch (syncError) {
      console.error('🔴 useAuth Build 5: getSession call failed');
      console.error('🔴 Error name:', syncError.name || 'Unknown');
      console.error('🔴 Error message:', syncError.message || 'No message');
      setSession(null);
      setLoading(false);
    }

    // Listen for auth changes with enhanced error handling
    let subscription: any;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            debugLog(`Auth state changed: ${event}`, !!session);
            console.log(`✅ useAuth Build 5: Auth state changed: ${event}`);
            setSession(session);
            
            // Initialize push notifications when user signs in
            if (event === 'SIGNED_IN' && session?.user?.id) {
              try {
                await initializePushNotifications(session.user.id);
              } catch (error) {
                debugLog('Failed to initialize push notifications:', error);
                console.error('🔴 useAuth Build 5: Push notification init failed');
              }
            }
          } catch (stateChangeError) {
            console.error('🔴 useAuth Build 5: Auth state change handler error');
            console.error('🔴 Error name:', stateChangeError.name || 'Unknown');
            console.error('🔴 Error message:', stateChangeError.message || 'No message');
          }
        }
      );
      subscription = authSubscription;
    } catch (subscriptionError) {
      console.error('🔴 useAuth Build 5: Auth subscription failed');
      console.error('🔴 Error name:', subscriptionError.name || 'Unknown');
      console.error('🔴 Error message:', subscriptionError.message || 'No message');
    }

    return () => {
      try {
        debugLog('Cleaning up auth listener');
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (cleanupError) {
        console.error('🔴 useAuth Build 5: Cleanup error');
        console.error('🔴 Error name:', cleanupError.name || 'Unknown');
        console.error('🔴 Error message:', cleanupError.message || 'No message');
      }
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