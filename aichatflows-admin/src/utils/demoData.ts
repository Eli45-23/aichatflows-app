import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export interface DemoDataOptions {
  includeClients?: boolean;
  includePayments?: boolean;
  includeGoals?: boolean;
  includeVisits?: boolean;
}

// Demo client data for showcasing
export const demoClients = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@beautysalon.com',
    phone: '(555) 123-4567',
    status: 'active' as const,
    business_name: 'Elegant Beauty Salon',
    plan: 'pro' as const,
    platform_preference: 'instagram' as const,
    delivery_preference: 'delivery' as const,
    instagram_handle: 'elegantbeauty_salon',
    business_type: 'Beauty & Wellness',
    business_niche: 'Hair & Makeup',
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike@fitnessplus.com',
    phone: '(555) 234-5678',
    status: 'active' as const,
    business_name: 'FitnessPlus Gym',
    plan: 'starter' as const,
    platform_preference: 'facebook' as const,
    delivery_preference: 'pickup' as const,
    facebook_url: 'https://facebook.com/fitnessplus',
    business_type: 'Health & Fitness',
    business_niche: 'Personal Training',
  },
  {
    name: 'Emma Chen',
    email: 'emma@tastybites.com',
    phone: '(555) 345-6789',
    status: 'in_progress' as const,
    business_name: 'Tasty Bites Restaurant',
    plan: 'pro' as const,
    platform_preference: 'instagram' as const,
    delivery_preference: 'delivery' as const,
    instagram_handle: 'tastybites_restaurant',
    business_type: 'Food & Beverage',
    business_niche: 'Asian Cuisine',
  },
  {
    name: 'David Thompson',
    email: 'david@techsolutions.com',
    phone: '(555) 456-7890',
    status: 'active' as const,
    business_name: 'Tech Solutions Inc',
    plan: 'pro' as const,
    platform_preference: 'facebook' as const,
    delivery_preference: 'pickup' as const,
    facebook_url: 'https://facebook.com/techsolutions',
    business_type: 'Technology',
    business_niche: 'Software Development',
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa@petcare.com',
    phone: '(555) 567-8901',
    status: 'paused' as const,
    business_name: 'Happy Pets Care',
    plan: 'starter' as const,
    platform_preference: 'instagram' as const,
    delivery_preference: 'delivery' as const,
    instagram_handle: 'happypetscare',
    business_type: 'Pet Services',
    business_niche: 'Veterinary Care',
  }
];

// Demo goals data
export const demoGoals = [
  {
    title: 'Monthly Client Acquisition',
    frequency: 'monthly' as const,
    target: 10,
    is_global: true,
  },
  {
    title: 'Weekly New Clients',
    frequency: 'weekly' as const,
    target: 3,
    is_global: true,
  }
];

// Clear all data from the database
export const clearAllData = async (): Promise<boolean> => {
  try {
    // Delete in order to respect foreign key constraints
    await supabase.from('business_visits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('form_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Populate database with demo data
export const populateDemoData = async (options: DemoDataOptions = {}): Promise<boolean> => {
  const {
    includeClients = true,
    includePayments = true,
    includeGoals = true,
    includeVisits = true,
  } = options;

  try {
    let clientIds: string[] = [];

    // Add demo clients
    if (includeClients) {
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .insert(demoClients)
        .select('id');

      if (clientError) throw clientError;
      clientIds = clients?.map(c => c.id) || [];
    }

    // Add demo goals
    if (includeGoals) {
      const { error: goalError } = await supabase
        .from('goals')
        .insert(demoGoals);

      if (goalError) throw goalError;
    }

    // Add demo payments
    if (includePayments && clientIds.length > 0) {
      const demoPayments = [
        {
          client_id: clientIds[0],
          amount: 299.99,
          status: 'confirmed' as const,
          payment_date: new Date().toISOString(),
          description: 'Monthly Pro Plan - Sarah Johnson',
          payment_method: 'Credit Card',
        },
        {
          client_id: clientIds[1],
          amount: 99.99,
          status: 'confirmed' as const,
          payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Starter Plan - Mike Rodriguez',
          payment_method: 'PayPal',
        },
        {
          client_id: clientIds[2],
          amount: 299.99,
          status: 'pending' as const,
          payment_date: new Date().toISOString(),
          description: 'Pro Plan Setup - Emma Chen',
          payment_method: 'Bank Transfer',
        }
      ];

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(demoPayments);

      if (paymentError) throw paymentError;
    }

    // Add demo visits
    if (includeVisits && clientIds.length > 0) {
      const demoVisits = [
        {
          client_id: clientIds[0],
          location: 'Elegant Beauty Salon, 123 Main St, Downtown',
          latitude: 37.7749,
          longitude: -122.4194,
          notes: 'Initial consultation and photo session',
        },
        {
          client_id: clientIds[1],
          location: 'FitnessPlus Gym, 456 Oak Ave, Midtown',
          latitude: 37.7849,
          longitude: -122.4094,
          notes: 'Equipment photography for social media',
        },
        {
          client_id: clientIds[2],
          location: 'Tasty Bites Restaurant, 789 Pine St, Food District',
          latitude: 37.7649,
          longitude: -122.4294,
          notes: 'Menu photography and restaurant ambiance shots',
        }
      ];

      const { error: visitError } = await supabase
        .from('business_visits')
        .insert(demoVisits);

      if (visitError) throw visitError;
    }

    return true;
  } catch (error) {
    console.error('Error populating demo data:', error);
    return false;
  }
};

// Reset and populate with fresh demo data
export const resetToDemo = async (options?: DemoDataOptions): Promise<boolean> => {
  try {
    // Clear existing data
    const cleared = await clearAllData();
    if (!cleared) {
      throw new Error('Failed to clear existing data');
    }

    // Wait a moment for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Populate with demo data
    const populated = await populateDemoData(options);
    if (!populated) {
      throw new Error('Failed to populate demo data');
    }

    return true;
  } catch (error) {
    console.error('Error resetting to demo:', error);
    return false;
  }
};

// Show demo data reset confirmation dialog
export const showDemoResetDialog = () => {
  Alert.alert(
    'Reset to Demo Data',
    'This will replace all current data with demo data for showcasing. This action cannot be undone.\n\nContinue?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset to Demo',
        style: 'destructive',
        onPress: async () => {
          Alert.alert('Resetting...', 'Please wait while we prepare demo data.');
          
          const success = await resetToDemo();
          
          if (success) {
            Alert.alert(
              'Demo Data Ready',
              'The app has been populated with demo data for showcasing.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Error',
              'Failed to reset to demo data. Please try again.',
              [{ text: 'OK' }]
            );
          }
        },
      },
    ]
  );
};

// Show clear all data confirmation dialog
export const showClearDataDialog = () => {
  Alert.alert(
    'Clear All Data',
    'This will permanently delete all clients, payments, goals, and visits. This action cannot be undone.\n\nContinue?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear All Data',
        style: 'destructive',
        onPress: async () => {
          Alert.alert('Clearing...', 'Please wait while we clear all data.');
          
          const success = await clearAllData();
          
          if (success) {
            Alert.alert(
              'Data Cleared',
              'All data has been successfully cleared.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Error',
              'Failed to clear data. Please try again.',
              [{ text: 'OK' }]
            );
          }
        },
      },
    ]
  );
};