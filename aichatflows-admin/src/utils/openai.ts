/**
 * OpenAI Integration Utility
 * 
 * IMPORTANT: After updating .env file, you must restart Expo:
 * 1. Stop the Metro bundler (Ctrl+C)
 * 2. Clear cache: npx expo start -c
 * 3. Restart: npx expo start
 */

// 🔍 RUNTIME VERIFICATION: API key loading status (without exposing the key)
if (__DEV__) {
  console.log("🔍 API KEY STATUS:", process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'LOADED' : 'NOT_FOUND');
}

// Access the OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * Check if a key is a placeholder/example value
 */
const isPlaceholderKey = (key: string | undefined): boolean => {
  if (!key) return true;
  
  // Common placeholder patterns
  const placeholderPatterns = [
    'your-api-key-here',
    'sk-proj-your-openai-api-key-here',
    'your-openai-api-key-here',
    'replace-with-your-key',
    'INSERT_YOUR_KEY_HERE',
    'sk-proj-xxxx',
    'sk-xxxx',
  ];
  
  // Check for exact matches
  if (placeholderPatterns.includes(key)) {
    return true;
  }
  
  // Check for patterns that suggest placeholder (contains obvious placeholder text)
  const lowercaseKey = key.toLowerCase();
  const placeholderIndicators = ['your-', 'example', 'placeholder', 'replace', 'insert', 'xxxx', 'yyyy'];
  
  for (const indicator of placeholderIndicators) {
    if (lowercaseKey.includes(indicator)) {
      return true;
    }
  }
  
  // If it's very short (less than 20 chars), likely incomplete
  if (key.length < 20) {
    return true;
  }
  
  return false;
};

// Comprehensive debug logging for environment variable detection
if (__DEV__) {
  const timestamp = new Date().toLocaleTimeString();
  const envVarName = 'EXPO_PUBLIC_OPENAI_API_KEY';
  const actualValue = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  console.log(`\n🔧 [${timestamp}] OpenAI Debug Report:`);
  console.log('='.repeat(50));
  console.log(`📝 Environment Variable Name: ${envVarName}`);
  console.log(`🔍 Raw Value Type: ${typeof actualValue}`);
  console.log(`📊 Raw Value Length: ${actualValue ? actualValue.length : 0}`);
  console.log(`🎯 Raw Value Preview: ${actualValue ? `"${actualValue.substring(0, 6)}..."` : 'undefined'}`);
  console.log(`🏷️  Key Format Valid: ${actualValue ? actualValue.startsWith('sk-') : false}`);
  
  // Test all validation conditions
  console.log('\n🧪 Validation Tests:');
  console.log(`   • Exists (truthy): ${!!actualValue}`);
  console.log(`   • Not placeholder: ${actualValue ? !isPlaceholderKey(actualValue) : false}`);
  console.log(`   • Starts with 'sk-': ${actualValue ? actualValue.startsWith('sk-') : false}`);
  console.log(`   • Length > 20: ${actualValue ? actualValue.length > 20 : false}`);
  
  // Overall status
  const isValid = !!(actualValue && !isPlaceholderKey(actualValue) && actualValue.startsWith('sk-') && actualValue.length > 20);
  console.log(`\n🎯 Overall Configuration Status: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (!actualValue) {
    console.warn(`\n❌ ISSUE: Environment variable not found or undefined`);
    console.warn(`💡 SOLUTION: Add ${envVarName}=sk-proj-xxxxx... to your .env file`);
    console.warn(`🔄 ACTION: Restart Expo with 'npx expo start -c'`);
    console.warn(`📁 FILE: Copy .env.example to .env and update it`);
  } else if (isPlaceholderKey(actualValue)) {
    console.warn(`\n❌ ISSUE: Still using placeholder value`);
    console.warn(`💡 SOLUTION: Replace with your actual OpenAI API key`);
    console.warn(`🌐 GET KEY: https://platform.openai.com/api-keys`);
  } else if (!actualValue.startsWith('sk-')) {
    console.warn(`\n❌ ISSUE: Invalid key format`);
    console.warn(`💡 SOLUTION: OpenAI API keys should start with 'sk-'`);
    console.warn(`📋 EXAMPLE: sk-proj-abcd1234...`);
  } else if (actualValue.length <= 10) {
    console.warn(`\n❌ ISSUE: Key appears incomplete (too short)`);
    console.warn(`💡 SOLUTION: Ensure you copied the complete API key`);
  } else {
    console.log(`\n✅ SUCCESS: OpenAI API key is properly configured!`);
  }
  console.log('='.repeat(50) + '\n');
}

/**
 * Configuration for OpenAI API
 */
export const openAIConfig = {
  apiKey: OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4',
  maxTokens: 1000,
  temperature: 0.7,
};

/**
 * Check if OpenAI is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  const result = !!(
    OPENAI_API_KEY && 
    !isPlaceholderKey(OPENAI_API_KEY) &&
    OPENAI_API_KEY.startsWith('sk-') &&
    OPENAI_API_KEY.length > 20
  );
  
  // Debug logging for isOpenAIConfigured calls
  if (__DEV__) {
    console.log(`\n🔍 isOpenAIConfigured() called at ${new Date().toLocaleTimeString()}`);
    console.log(`   Result: ${result ? '✅ TRUE' : '❌ FALSE'}`);
    if (!result) {
      console.log(`   Current key status: ${OPENAI_API_KEY ? 'EXISTS' : 'MISSING'}`);
      console.log(`   Validation breakdown:`);
      console.log(`      • Key exists: ${!!OPENAI_API_KEY}`);
      console.log(`      • Not placeholder: ${OPENAI_API_KEY ? !isPlaceholderKey(OPENAI_API_KEY) : 'N/A'}`);
      console.log(`      • Starts with 'sk-': ${OPENAI_API_KEY ? OPENAI_API_KEY.startsWith('sk-') : 'N/A'}`);
      console.log(`      • Length > 20: ${OPENAI_API_KEY ? OPENAI_API_KEY.length > 20 : 'N/A'}`);
    }
  }
  
  return result;
};

/**
 * Test environment variable loading specifically
 */
export const testEnvironmentVariables = (): { 
  envTestResults: any; 
  recommendations: string[]; 
} => {
  const recommendations: string[] = [];
  const envTestResults = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    expoDev: __DEV__,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
    keyExists: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    typeOfValue: typeof process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    valueLength: process.env.EXPO_PUBLIC_OPENAI_API_KEY?.length || 0,
    startsWithSk: process.env.EXPO_PUBLIC_OPENAI_API_KEY?.startsWith('sk-') || false,
    hasEnvFile: 'Unknown - cannot check file system from React Native',
  };

  console.log('\n🔬 Environment Variable Test Results:');
  console.log('='.repeat(60));
  console.log(JSON.stringify(envTestResults, null, 2));
  console.log('='.repeat(60));

  if (!envTestResults.keyExists) {
    recommendations.push('1. Ensure you have a .env file in your project root');
    recommendations.push('2. Add this line to .env: EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-key');
    recommendations.push('3. Stop Expo and restart with cache clear: npx expo start -c');
  } else if (envTestResults.keyExists && isPlaceholderKey(process.env.EXPO_PUBLIC_OPENAI_API_KEY)) {
    recommendations.push('1. Replace the placeholder value with your real OpenAI API key');
    recommendations.push('2. Get your key from: https://platform.openai.com/api-keys');
    recommendations.push('3. Restart Expo after updating: npx expo start -c');
  } else if (!envTestResults.startsWithSk) {
    recommendations.push('1. Verify your API key starts with "sk-" (usually "sk-proj-")');
    recommendations.push('2. Check for extra spaces or characters in your .env file');
    recommendations.push('3. Ensure no quotes around the value in .env');
  } else if (envTestResults.valueLength < 20) {
    recommendations.push('1. Your API key appears incomplete (too short)');
    recommendations.push('2. Copy the complete key from OpenAI dashboard');
    recommendations.push('3. Check for line breaks or truncation in .env file');
  }

  return { envTestResults, recommendations };
};

/**
 * Quick OpenAI configuration test function
 * Provides immediate feedback on configuration status
 */
export const testOpenAIConfiguration = (): {
  isConfigured: boolean;
  status: string;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  console.log('\n🧪 Testing OpenAI Configuration...');
  
  if (!OPENAI_API_KEY) {
    issues.push('API key not found in environment variables');
    recommendations.push('Create a .env file with EXPO_PUBLIC_OPENAI_API_KEY=your-key');
    recommendations.push('Restart Expo with: npx expo start -c');
  } else if (isPlaceholderKey(OPENAI_API_KEY)) {
    issues.push('Using placeholder API key value');
    recommendations.push('Replace with actual OpenAI API key from https://platform.openai.com/api-keys');
    recommendations.push('Restart Expo after updating .env file');
  } else if (!OPENAI_API_KEY.startsWith('sk-')) {
    issues.push('Invalid API key format (should start with "sk-")');
    recommendations.push('Verify you copied the correct API key from OpenAI dashboard');
    recommendations.push('Check for extra spaces or quotes in .env file');
  } else if (OPENAI_API_KEY.length < 20) {
    issues.push('API key appears incomplete (too short)');
    recommendations.push('Copy the complete API key from OpenAI dashboard');
    recommendations.push('Check for line breaks in .env file');
  }
  
  const isConfigured = issues.length === 0;
  const status = isConfigured 
    ? '✅ OpenAI is properly configured!' 
    : `❌ ${issues.length} configuration issue${issues.length > 1 ? 's' : ''} found`;
  
  console.log(`📊 Configuration Status: ${status}`);
  if (issues.length > 0) {
    console.log('🚨 Issues found:');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    console.log('💡 Recommendations:');
    recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
  }
  
  return { isConfigured, status, issues, recommendations };
};

/**
 * Get detailed configuration status for debugging
 */
export const getOpenAIConfigStatus = (): { 
  configured: boolean; 
  reason?: string; 
  suggestion?: string; 
} => {
  if (!OPENAI_API_KEY) {
    return {
      configured: false,
      reason: 'API key not found',
      suggestion: 'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file and restart Expo'
    };
  }
  
  if (isPlaceholderKey(OPENAI_API_KEY)) {
    return {
      configured: false,
      reason: 'Using placeholder value',
      suggestion: 'Replace with your actual OpenAI API key from https://platform.openai.com/api-keys'
    };
  }
  
  if (!OPENAI_API_KEY.startsWith('sk-')) {
    return {
      configured: false,
      reason: 'Invalid key format',
      suggestion: 'OpenAI API keys should start with "sk-". Please verify your key.'
    };
  }
  
  if (OPENAI_API_KEY.length < 20) {
    return {
      configured: false,
      reason: 'Key appears incomplete',
      suggestion: 'API key seems too short. Please check you copied the full key.'
    };
  }
  
  return { configured: true };
};

/**
 * Types for OpenAI requests and responses
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Make a chat completion request to OpenAI
 * @param messages - Array of chat messages
 * @param options - Optional parameters for the request
 * @returns Promise with the completion response
 */
export async function createChatCompletion(
  messages: ChatMessage[],
  options?: Partial<ChatCompletionRequest>
): Promise<ChatCompletionResponse> {
  // Runtime verification logging
  if (__DEV__) {
    console.log(`\n🚀 createChatCompletion() called at ${new Date().toLocaleTimeString()}`);
    console.log(`   API Key exists: ${!!OPENAI_API_KEY}`);
    console.log(`   API Key format valid: ${OPENAI_API_KEY ? OPENAI_API_KEY.startsWith('sk-') : false}`);
  }
  
  const configStatus = getOpenAIConfigStatus();
  if (!configStatus.configured) {
    const errorMsg = `OpenAI API Configuration Error: ${configStatus.reason}. ${configStatus.suggestion}`;
    if (__DEV__) {
      console.error(`❌ ${errorMsg}`);
    }
    throw new Error(errorMsg);
  }

  try {
    const response = await fetch(`${openAIConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || openAIConfig.defaultModel,
        messages,
        temperature: options?.temperature ?? openAIConfig.temperature,
        max_tokens: options?.max_tokens ?? openAIConfig.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * Simple wrapper for single-turn completions
 * @param prompt - The user's prompt
 * @param systemMessage - Optional system message for context
 * @returns Promise with the assistant's response
 */
export async function getCompletion(
  prompt: string,
  systemMessage?: string
): Promise<string> {
  const messages: ChatMessage[] = [];
  
  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await createChatCompletion(messages);
  return response.choices[0]?.message.content || '';
}

/**
 * Example usage in a React component:
 * 
 * import { getCompletion, isOpenAIConfigured } from '@/utils/openai';
 * 
 * const MyComponent = () => {
 *   const [response, setResponse] = useState('');
 *   const [loading, setLoading] = useState(false);
 * 
 *   const handleAIRequest = async () => {
 *     if (!isOpenAIConfigured()) {
 *       Alert.alert('Configuration Error', 'Please configure your OpenAI API key');
 *       return;
 *     }
 * 
 *     setLoading(true);
 *     try {
 *       const result = await getCompletion('Tell me a joke about React Native');
 *       setResponse(result);
 *     } catch (error) {
 *       Alert.alert('Error', error.message);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <View>
 *       <Button title="Get AI Response" onPress={handleAIRequest} />
 *       {loading && <ActivityIndicator />}
 *       {response && <Text>{response}</Text>}
 *     </View>
 *   );
 * };
 */