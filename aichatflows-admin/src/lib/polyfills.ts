// Import polyfills for React Native environment
// This MUST be imported before any other imports in the app

// Crypto polyfill for random values (required by Supabase)
import 'react-native-get-random-values';

// URL and URLSearchParams polyfills (required by Supabase)
import 'react-native-url-polyfill/auto';

// TextEncoder/TextDecoder polyfills (required by Supabase auth)
import { TextEncoder, TextDecoder } from 'text-encoding';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Custom fetch wrapper with better error handling
const originalFetch = global.fetch;

global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  console.log(`[Fetch Debug] Request to: ${url}`);
  console.log(`[Fetch Debug] Method: ${init?.method || 'GET'}`);
  
  // Check if this is a Supabase request and add required headers
  const isSupabaseRequest = url.includes('.supabase.co');
  let enhancedInit = { ...init };
  
  if (isSupabaseRequest) {
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseAnonKey) {
      enhancedInit.headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        ...enhancedInit.headers,
      };
      
      console.log(`[Fetch Debug] Added Supabase headers for: ${url}`);
      console.log(`[Fetch Debug] Headers:`, JSON.stringify(enhancedInit.headers, null, 2));
    } else {
      console.warn(`[Fetch Debug] Missing SUPABASE_ANON_KEY for request to: ${url}`);
    }
  }
  
  try {
    const response = await originalFetch(input, enhancedInit);
    
    console.log(`[Fetch Debug] Response status: ${response.status}`);
    
    if (response.status === 401 && isSupabaseRequest) {
      console.error(`[Fetch Debug] 401 Unauthorized for Supabase request: ${url}`);
      console.error(`[Fetch Debug] Request headers:`, JSON.stringify(enhancedInit.headers, null, 2));
    }
    
    return response;
  } catch (error: any) {
    console.error('[Fetch Debug] Error:', error);
    console.error('[Fetch Debug] Error type:', error.constructor.name);
    console.error('[Fetch Debug] Error message:', error.message);
    
    // Provide more detailed error information
    if (error.message === 'Network request failed') {
      // Check if it's a DNS/connection issue
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Cannot resolve host: ${url}. Please check your Supabase URL.`);
      }
      // Generic network error
      throw new Error(`Network request failed for ${url}. Please check your internet connection and Supabase configuration.`);
    }
    
    throw error;
  }
};

console.log('[Polyfills] All polyfills loaded successfully');