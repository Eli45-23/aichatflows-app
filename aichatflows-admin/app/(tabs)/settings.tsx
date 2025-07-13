import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '../../src/components/Card';
import { Toggle } from '../../src/components/Toggle';
import { Button } from '../../src/components/Button';
import { useSettings } from '../../src/hooks/useSettings';
import { Toast } from '../../src/components/Toast';
import { useTheme } from '../../src/contexts/ThemeContext';

type DropdownOption = {
  label: string;
  value: string;
};

const THEME_OPTIONS: DropdownOption[] = [
  { label: 'White (Default)', value: 'white' },
  { label: 'Mint Green', value: 'mint' },
  { label: 'Teal Blue', value: 'teal' },
];

const FONT_SIZE_OPTIONS: DropdownOption[] = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'default' },
  { label: 'Large', value: 'large' },
];

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onValueChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { themeClasses } = useTheme();
  const selectedOption = options.find(option => option.value === value);

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className={`flex-row items-center justify-between ${themeClasses.card} rounded-lg px-4 py-3`}
      >
        <Text className={`text-base ${themeClasses.text.primary}`}>
          {selectedOption?.label || placeholder || 'Select...'}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <Animated.View 
          entering={FadeInDown}
          className={`absolute top-full left-0 right-0 ${themeClasses.card} rounded-lg mt-1 shadow-lg z-50`}
          style={{ zIndex: 1000 }}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                option.value === value ? 'bg-primary/5' : ''
              }`}
            >
              <Text className={`text-base ${
                option.value === value ? 'text-primary font-medium' : themeClasses.text.primary
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
}

const SettingSection: React.FC<SettingSectionProps & { delay?: number }> = ({ title, children, icon, delay = 0 }) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).springify().damping(15).stiffness(100)} 
    className="mb-6"
  >
    <View className="flex-row items-center mb-3">
      {icon && (
        <Ionicons name={icon} size={20} color="#00D4AA" style={{ marginRight: 8 }} />
      )}
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
    </View>
    <Card variant="default" size="md">
      {children}
    </Card>
  </Animated.View>
);

export default function SettingsScreen() {
  const { settings, updateSetting, isLoaded, error } = useSettings();
  const { theme, setTheme, themeClasses } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleChange = async (key: keyof typeof settings, value: boolean) => {
    await updateSetting(key, value);
    showSuccessToast('Preferences saved');
  };

  const handleDropdownChange = async (key: keyof typeof settings, value: any) => {
    if (key === 'themeColor') {
      // Use theme context for immediate visual updates
      await setTheme(value);
    } else {
      await updateSetting(key, value);
    }
    showSuccessToast('Preferences saved');
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'Are you sure you want to delete all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Data deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Feature Coming Soon', 'Password change will be available in a future update.');
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Loading settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-4">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
          Settings Error
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          {error}
        </Text>
        <Button onPress={() => window.location.reload()} variant="primary" style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${themeClasses.bg.secondary} theme-${theme}`}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* General Preferences Section */}
        <SettingSection title="General Preferences" icon="options" delay={100}>
          <View className="space-y-0">
            <Toggle
              label="Enable sound effects"
              description="Play sounds for actions and notifications"
              value={settings.soundEffects}
              onValueChange={(value) => handleToggleChange('soundEffects', value)}
            />
            
            <View className="border-t border-gray-100" />
            
            <Toggle
              label="Enable subtle animations"
              description="Smooth transitions and micro-interactions"
              value={settings.animations}
              onValueChange={(value) => handleToggleChange('animations', value)}
            />
            
            <View className="border-t border-gray-100" />
            
            <Toggle
              label="Enable vibration feedback"
              description="Haptic feedback for button presses"
              value={settings.vibrationFeedback}
              onValueChange={(value) => handleToggleChange('vibrationFeedback', value)}
            />
            
            <View className="border-t border-gray-100" />
            
            <Toggle
              label="Enable push notifications"
              description="Receive important updates and reminders"
              value={settings.pushNotifications}
              onValueChange={(value) => handleToggleChange('pushNotifications', value)}
            />
          </View>
        </SettingSection>

        {/* Display Settings Section */}
        <SettingSection title="Display Settings" icon="color-palette" delay={200}>
          <View className="space-y-4">
            <View>
              <Text className="text-base font-medium text-gray-900 mb-2">Theme Color</Text>
              <Text className="text-sm text-gray-500 mb-3">Choose your preferred color theme</Text>
              <Dropdown
                options={THEME_OPTIONS}
                value={settings.themeColor}
                onValueChange={(value) => handleDropdownChange('themeColor', value)}
                placeholder="Select theme"
              />
            </View>
            
            <View className="border-t border-gray-100 pt-4">
              <Text className="text-base font-medium text-gray-900 mb-2">Font Size</Text>
              <Text className="text-sm text-gray-500 mb-3">Adjust text size for better readability</Text>
              <Dropdown
                options={FONT_SIZE_OPTIONS}
                value={settings.fontSize}
                onValueChange={(value) => handleDropdownChange('fontSize', value)}
                placeholder="Select font size"
              />
            </View>
          </View>
        </SettingSection>

        {/* Account Info Section */}
        <SettingSection title="Account Info" icon="person-circle" delay={300}>
          <View className="space-y-4">
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-sm text-gray-600 mb-1">Signed in as</Text>
              <Text className="text-base font-medium text-gray-900">admin@aichatflows.com</Text>
            </View>
            
            <View className="space-y-3">
              <Button
                variant="secondary"
                onPress={handleChangePassword}
                icon="key"
                fullWidth
              >
                Change Password
              </Button>
              
              <Button
                variant="danger"
                onPress={handleDeleteData}
                icon="trash"
                fullWidth
              >
                Delete My Data
              </Button>
            </View>
          </View>
        </SettingSection>

        {/* Extra spacing at bottom */}
        <View className="h-8" />
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          title={toastMessage}
          type="success"
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
      )}
    </View>
  );
}