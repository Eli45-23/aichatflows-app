import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Environment variable validation and debugging
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

// Debug logging function
const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Supabase Debug] ${message}`, data || '');
  }
};

// Validate environment variables
const validateEnvironmentVariables = () => {
  debugLog('Validating environment variables...');
  debugLog('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  debugLog('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  debugLog('Debug mode:', debugMode);

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    debugLog('Environment validation failed:', errorMessage);
    
    Alert.alert(
      'Configuration Error',
      `${errorMessage}\n\nPlease check your .env file and restart the app.`,
      [{ text: 'OK' }]
    );
    
    throw new Error(errorMessage);
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    const errorMessage = 'Invalid SUPABASE_URL format. Should be: https://your-project-id.supabase.co';
    debugLog('URL validation failed:', errorMessage);
    
    Alert.alert(
      'Configuration Error',
      `${errorMessage}\n\nCurrent URL: ${supabaseUrl}`,
      [{ text: 'OK' }]
    );
    
    throw new Error(errorMessage);
  }

  // Validate anon key format
  if (!supabaseAnonKey.startsWith('eyJ')) {
    const errorMessage = 'Invalid SUPABASE_ANON_KEY format. Should start with: eyJ...';
    debugLog('Anon key validation failed:', errorMessage);
    
    Alert.alert(
      'Configuration Error',
      `${errorMessage}\n\nCheck your Supabase dashboard for the correct anon key.`,
      [{ text: 'OK' }]
    );
    
    throw new Error(errorMessage);
  }

  debugLog('Environment variables validated successfully');
};

// Validate environment variables before creating client
validateEnvironmentVariables();

// Custom fetch wrapper for better error handling
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  debugLog(`Custom fetch request to: ${url}`);
  
  // Ensure Supabase headers are always present
  const enhancedInit = {
    ...init,
    headers: {
      'apikey': supabaseAnonKey || '',
      'Authorization': `Bearer ${supabaseAnonKey || ''}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AIChatFlows-Admin-Expo',
      ...init?.headers,
    },
  };
  
  debugLog(`Request headers:`, enhancedInit.headers);
  
  try {
    const response = await fetch(input, enhancedInit);
    
    debugLog(`Response received: ${response.status}`);
    
    if (response.status === 401) {
      debugLog(`401 Unauthorized response for: ${url}`);
      debugLog(`Request headers sent:`, enhancedInit.headers);
      
      // Try to get response body for more details
      try {
        const errorBody = await response.clone().text();
        debugLog(`401 Error response body:`, errorBody);
      } catch (e) {
        debugLog(`Could not read 401 error response body`);
      }
    }
    
    return response;
  } catch (error: any) {
    debugLog('Fetch error details:', error);
    
    // Check if it's a DNS resolution error
    if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      const errorMsg = `Cannot resolve Supabase URL: ${url}. Please verify your EXPO_PUBLIC_SUPABASE_URL is correct.`;
      debugLog(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Network connectivity error
    if (error.message === 'Network request failed') {
      const errorMsg = `Network request failed for ${url}. Please check your internet connection and ensure the Supabase URL is correct.`;
      debugLog(errorMsg);
      throw new Error(errorMsg);
    }
    
    throw error;
  }
};

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Add custom headers for debugging
  global: {
    headers: {
      'X-Client-Info': 'aichatflows-admin-expo',
    },
    fetch: customFetch,
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  debugLog('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      debugLog('Connection test failed:', error);
      throw error;
    }
    
    debugLog('Connection test successful');
    return { success: true, session: data.session };
  } catch (error: any) {
    debugLog('Connection test error:', error);
    
    // Provide helpful error messages
    let userMessage = 'Failed to connect to Supabase.';
    
    if (error.message?.includes('fetch')) {
      userMessage += ' Network error - check your internet connection and Supabase URL.';
    } else if (error.message?.includes('Invalid API key')) {
      userMessage += ' Invalid API key - check your SUPABASE_ANON_KEY.';
    } else if (error.message?.includes('Project not found')) {
      userMessage += ' Project not found - check your SUPABASE_URL.';
    }
    
    Alert.alert(
      'Connection Error',
      `${userMessage}\n\nTechnical details: ${error.message}`,
      [{ text: 'OK' }]
    );
    
    return { success: false, error: error.message };
  }
};

// Initialize connection test in debug mode
if (debugMode) {
  // Test connection after a short delay to avoid blocking the app startup
  setTimeout(() => {
    testSupabaseConnection();
  }, 2000);
}

debugLog('Supabase client initialized successfully');