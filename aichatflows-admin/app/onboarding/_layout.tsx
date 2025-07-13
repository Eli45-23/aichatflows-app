import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Onboarding Submissions',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Submission Details',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
    </Stack>
  );
}