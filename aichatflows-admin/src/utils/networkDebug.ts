import { Alert } from 'react-native';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

export const testNetworkConnectivity = async () => {
  console.log('[Network Debug] Starting connectivity tests...');
  
  const tests = [
    {
      name: 'DNS Resolution Test',
      url: 'https://www.google.com',
      expected: 'Should resolve and return 200',
    },
    {
      name: 'HTTPS Test',
      url: 'https://httpbin.org/get',
      expected: 'Should return JSON with origin IP',
    },
    {
      name: 'Supabase Domain Test',
      url: 'https://supabase.co',
      expected: 'Should resolve Supabase main domain',
    },
    {
      name: 'Your Supabase URL',
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      expected: 'Should resolve your specific Supabase instance',
    },
  ];
  
  const results: any[] = [];
  
  for (const test of tests) {
    console.log(`[Network Debug] Testing: ${test.name}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'AIChatFlows-NetworkTest',
        },
      });
      
      const duration = Date.now() - startTime;
      
      results.push({
        test: test.name,
        url: test.url,
        status: response.status,
        duration: `${duration}ms`,
        success: true,
      });
      
      console.log(`[Network Debug] ✅ ${test.name}: ${response.status} (${duration}ms)`);
    } catch (error: any) {
      results.push({
        test: test.name,
        url: test.url,
        error: error.message,
        success: false,
      });
      
      console.log(`[Network Debug] ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Show results in alert
  if (debugMode) {
    const summary = results
      .map(r => `${r.success ? '✅' : '❌'} ${r.test}: ${r.success ? r.status : r.error}`)
      .join('\n');
    
    Alert.alert('Network Test Results', summary);
  }
  
  return results;
};

// Check if we're using the correct Supabase URL format
export const validateSupabaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  
  if (!url) {
    return { valid: false, error: 'No Supabase URL configured' };
  }
  
  // Check URL format
  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
  if (!urlPattern.test(url)) {
    return { 
      valid: false, 
      error: 'Invalid URL format. Expected: https://[project-id].supabase.co' 
    };
  }
  
  // Extract project ID
  const projectId = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/)?.[1];
  
  return { 
    valid: true, 
    projectId,
    url,
  };
};

// DNS lookup helper (for debugging)
export const checkDNS = async (hostname: string) => {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const data = await response.json();
    
    if (data.Answer) {
      console.log(`[DNS Debug] ${hostname} resolves to:`, data.Answer.map((a: any) => a.data));
      return true;
    } else {
      console.log(`[DNS Debug] ${hostname} - No DNS records found`);
      return false;
    }
  } catch (error) {
    console.log(`[DNS Debug] Failed to check DNS for ${hostname}:`, error);
    return false;
  }
};