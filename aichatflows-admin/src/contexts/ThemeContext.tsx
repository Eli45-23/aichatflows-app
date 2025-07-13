import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';

export type ThemeType = 'white' | 'mint' | 'teal';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeClasses: {
    container: string;
    card: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    bg: {
      primary: string;
      secondary: string;
    };
    button: {
      primary: string;
      secondary: string;
    };
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSetting, isLoaded } = useSettings();
  const [theme, setThemeState] = useState<ThemeType>('white');

  // Update theme when settings change
  useEffect(() => {
    if (isLoaded && settings.themeColor) {
      setThemeState(settings.themeColor);
    }
  }, [settings.themeColor, isLoaded]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await updateSetting('themeColor', newTheme);
  };

  // Generate theme-specific classes
  const getThemeClasses = (currentTheme: ThemeType) => {
    switch (currentTheme) {
      case 'mint':
        return {
          container: 'bg-mint-bg-primary',
          card: 'bg-mint-bg-card border-mint-border',
          text: {
            primary: 'text-mint-text-primary',
            secondary: 'text-mint-text-secondary',
            muted: 'text-mint-text-muted',
          },
          bg: {
            primary: 'bg-mint-bg-primary',
            secondary: 'bg-mint-bg-secondary',
          },
          button: {
            primary: 'bg-mint-primary',
            secondary: 'bg-mint-bg-card border-mint-border',
          },
          border: 'border-mint-border',
        };
      case 'teal':
        return {
          container: 'bg-teal-bg-primary',
          card: 'bg-teal-bg-card border-teal-border',
          text: {
            primary: 'text-teal-text-primary',
            secondary: 'text-teal-text-secondary',
            muted: 'text-teal-text-muted',
          },
          bg: {
            primary: 'bg-teal-bg-primary',
            secondary: 'bg-teal-bg-secondary',
          },
          button: {
            primary: 'bg-teal-primary',
            secondary: 'bg-teal-bg-card border-teal-border',
          },
          border: 'border-teal-border',
        };
      default: // white
        return {
          container: 'bg-bg-primary',
          card: 'bg-bg-card border-border-primary',
          text: {
            primary: 'text-text-primary',
            secondary: 'text-text-secondary',
            muted: 'text-text-muted',
          },
          bg: {
            primary: 'bg-bg-primary',
            secondary: 'bg-bg-secondary',
          },
          button: {
            primary: 'bg-primary',
            secondary: 'bg-bg-card border-border-primary',
          },
          border: 'border-border-primary',
        };
    }
  };

  const themeClasses = getThemeClasses(theme);

  const value: ThemeContextType = {
    theme,
    setTheme,
    themeClasses,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};