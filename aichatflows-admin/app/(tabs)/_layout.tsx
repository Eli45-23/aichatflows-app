import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  
  // Get theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'mint':
        return {
          active: '#00D4AA',
          inactive: '#9CA3AF',
          background: '#FFFFFF',
          border: '#BBF7D0',
          text: '#1A1A1A',
        };
      case 'teal':
        return {
          active: '#0D9488',
          inactive: '#9CA3AF',
          background: '#FFFFFF',
          border: '#99F6E4',
          text: '#1A1A1A',
        };
      default:
        return {
          active: '#00D4AA',
          inactive: '#9CA3AF',
          background: '#FFFFFF',
          border: '#E5E7EB',
          text: '#1A1A1A',
        };
    }
  };

  const colors = getThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: colors.border,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Visits',
          tabBarLabel: 'Visits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inPerson"
        options={{
          title: 'In-Person',
          tabBarLabel: 'In-Person',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}