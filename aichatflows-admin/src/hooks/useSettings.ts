import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // General Preferences
  soundEffects: boolean;
  animations: boolean;
  vibrationFeedback: boolean;
  pushNotifications: boolean;
  
  // Display Settings
  themeColor: 'white' | 'mint' | 'teal';
  fontSize: 'small' | 'default' | 'large';
}

const DEFAULT_SETTINGS: AppSettings = {
  // General Preferences - default ON except push notifications
  soundEffects: true,
  animations: true,
  vibrationFeedback: true,
  pushNotifications: false,
  
  // Display Settings
  themeColor: 'white',
  fontSize: 'default',
};

const SETTINGS_STORAGE_KEY = '@aichatflows_settings';

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoaded: boolean;
  error: string | null;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings) as Partial<AppSettings>;
        // Merge with defaults to ensure all keys exist
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } else {
        // First time - save default settings
        await saveSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
      // Use defaults if loading fails
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
      throw err;
    }
  };

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    try {
      setError(null);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      setError(`Failed to update ${key}`);
      // Revert the setting if save failed
      setSettings(prev => prev);
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      setSettings(DEFAULT_SETTINGS);
      await saveSettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError('Failed to reset settings');
    }
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
    error,
  };
}

// Hook for individual setting access (optimization for components that only need one setting)
export function useSetting<K extends keyof AppSettings>(key: K) {
  const { settings, updateSetting, isLoaded } = useSettings();
  
  return {
    value: settings[key],
    setValue: (value: AppSettings[K]) => updateSetting(key, value),
    isLoaded,
  };
}