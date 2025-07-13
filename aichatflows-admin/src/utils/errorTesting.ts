/**
 * Comprehensive Error Testing Utilities
 * Use these functions to proactively test error handling throughout the app
 */

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Test Goals functionality for null safety
 */
export const testGoalsFunctionality = (goals: any[], calculateGoalProgress: Function): TestResult[] => {
  const results: TestResult[] = [];

  // Test 1: Null goal handling
  try {
    const nullGoalResult = calculateGoalProgress(null, [], []);
    results.push({
      test: 'Null Goal Handling',
      passed: nullGoalResult && typeof nullGoalResult.current === 'number',
      error: !nullGoalResult ? 'Function returned null/undefined' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Null Goal Handling',
      passed: false,
      error: error.message,
      suggestion: 'Add null safety checks in calculateGoalProgress function'
    });
  }

  // Test 2: Goal with missing frequency
  try {
    const goalMissingFrequency = { id: 'test', title: 'Test', target: 10 };
    const result = calculateGoalProgress(goalMissingFrequency, [], []);
    results.push({
      test: 'Missing Frequency Handling',
      passed: result && typeof result.current === 'number',
      error: !result ? 'Function returned null for missing frequency' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Missing Frequency Handling',
      passed: false,
      error: error.message,
      suggestion: 'Add default frequency when goal.frequency is missing'
    });
  }

  // Test 3: Invalid target values
  try {
    const goalInvalidTarget = { id: 'test', title: 'Test', frequency: 'weekly', target: 0 };
    const result = calculateGoalProgress(goalInvalidTarget, [], []);
    results.push({
      test: 'Invalid Target Handling',
      passed: result && result.percentage === 0,
      error: !result ? 'Function returned null for invalid target' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Invalid Target Handling',
      passed: false,
      error: error.message,
      suggestion: 'Add validation for goal.target values'
    });
  }

  return results;
};

/**
 * Test Payments functionality for null safety
 */
export const testPaymentsFunctionality = (payments: any[], filterFunction: Function): TestResult[] => {
  const results: TestResult[] = [];

  // Test 1: Null payment filtering
  try {
    const paymentsWithNull = [null, undefined, { id: '1', status: 'confirmed', amount: 100 }];
    const filtered = filterFunction('confirmed');
    results.push({
      test: 'Null Payment Filtering',
      passed: Array.isArray(filtered) && filtered.length >= 0,
      error: !Array.isArray(filtered) ? 'Filter function did not return array' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Null Payment Filtering',
      passed: false,
      error: error.message,
      suggestion: 'Add null safety checks in payment filter functions'
    });
  }

  // Test 2: Missing status handling
  try {
    const paymentMissingStatus = { id: 'test', amount: 100 };
    const filtered = payments.concat([paymentMissingStatus]).filter(p => p?.status === 'confirmed');
    results.push({
      test: 'Missing Status Handling',
      passed: Array.isArray(filtered),
      error: !Array.isArray(filtered) ? 'Filter operation failed' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Missing Status Handling',
      passed: false,
      error: error.message,
      suggestion: 'Add null checks before accessing payment.status'
    });
  }

  return results;
};

/**
 * Check if a key is a placeholder/example value (same logic as openai.ts)
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

/**
 * Test OpenAI configuration
 */
export const testOpenAIConfiguration = (): TestResult[] => {
  const results: TestResult[] = [];

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Test 1: API Key exists
  results.push({
    test: 'API Key Exists',
    passed: !!apiKey,
    error: !apiKey ? 'EXPO_PUBLIC_OPENAI_API_KEY not found' : undefined,
    suggestion: !apiKey ? 'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file' : undefined
  });

  // Test 2: API Key format
  if (apiKey) {
    results.push({
      test: 'API Key Format',
      passed: apiKey.startsWith('sk-') && apiKey.length > 20,
      error: !apiKey.startsWith('sk-') ? 'Invalid key format' : apiKey.length <= 20 ? 'Key too short' : undefined,
      suggestion: !apiKey.startsWith('sk-') || apiKey.length <= 20 ? 'Verify your OpenAI API key format' : undefined
    });

    // Test 3: Not placeholder value (using improved detection)
    const isPlaceholder = isPlaceholderKey(apiKey);
    results.push({
      test: 'Not Placeholder',
      passed: !isPlaceholder,
      error: isPlaceholder ? 'Still using placeholder value' : undefined,
      suggestion: isPlaceholder ? 'Replace with actual OpenAI API key from https://platform.openai.com/api-keys' : undefined
    });
  }

  return results;
};

/**
 * Test database connectivity
 */
export const testDatabaseStructure = async (supabase: any): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test 1: Clients table structure
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('business_name')
      .limit(1);
    
    results.push({
      test: 'Clients Table - business_name Column',
      passed: !error,
      error: error ? error.message : undefined,
      suggestion: error ? 'Run migration 02_add_missing_client_columns.sql' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Clients Table - business_name Column',
      passed: false,
      error: error.message,
      suggestion: 'Check database connection and run migrations'
    });
  }

  // Test 2: Goals table structure
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('frequency')
      .limit(1);
    
    results.push({
      test: 'Goals Table - frequency Column',
      passed: !error,
      error: error ? error.message : undefined,
      suggestion: error ? 'Check goals table structure' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Goals Table - frequency Column',
      passed: false,
      error: error.message,
      suggestion: 'Verify goals table exists and has correct schema'
    });
  }

  // Test 3: Notifications table
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    results.push({
      test: 'Notifications Table',
      passed: !error,
      error: error ? error.message : undefined,
      suggestion: error ? 'Run migration 01_create_notifications_table.sql' : undefined
    });
  } catch (error: any) {
    results.push({
      test: 'Notifications Table',
      passed: false,
      error: error.message,
      suggestion: 'Create notifications table using provided migration'
    });
  }

  return results;
};

/**
 * Run all tests and generate report
 */
export const runComprehensiveTests = async (
  goals: any[],
  payments: any[],
  calculateGoalProgress: Function,
  filterPayments: Function,
  supabase: any
): Promise<{ passed: number; failed: number; results: TestResult[] }> => {
  console.log('🧪 Running comprehensive error tests...');

  const allResults: TestResult[] = [];

  // Run all test suites
  allResults.push(...testGoalsFunctionality(goals, calculateGoalProgress));
  allResults.push(...testPaymentsFunctionality(payments, filterPayments));
  allResults.push(...testOpenAIConfiguration());
  allResults.push(...await testDatabaseStructure(supabase));

  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;

  // Log results
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  allResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.suggestion) {
      console.log(`   💡 ${result.suggestion}`);
    }
  });

  return { passed, failed, results: allResults };
};

/**
 * Create mock data for testing
 */
export const createMockTestData = () => ({
  validGoal: {
    id: 'test-goal-1',
    title: 'Test Goal',
    frequency: 'weekly' as const,
    target: 10,
    is_global: true,
    created_at: new Date().toISOString()
  },
  invalidGoal: {
    id: 'test-goal-2',
    title: 'Invalid Goal',
    // Missing frequency and target
  },
  validPayment: {
    id: 'test-payment-1',
    amount: 100,
    status: 'confirmed' as const,
    payment_date: new Date().toISOString(),
    client_id: 'test-client-1'
  },
  invalidPayment: {
    id: 'test-payment-2',
    // Missing amount, status, and other required fields
  },
  validClient: {
    id: 'test-client-1',
    name: 'Test Client',
    email: 'test@example.com',
    created_at: new Date().toISOString()
  }
});

export default {
  testGoalsFunctionality,
  testPaymentsFunctionality,
  testOpenAIConfiguration,
  testDatabaseStructure,
  runComprehensiveTests,
  createMockTestData
};