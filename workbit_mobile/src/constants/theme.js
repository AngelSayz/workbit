import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  families: {
    // System fonts for better accessibility and native feel
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  },
};

const LIGHT_THEME = {
  name: 'light',
  colors: {
    // Background colors
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text colors (WCAG AA compliant)
    text: '#424242',
    textSecondary: '#757575',
    textDisabled: '#BDBDBD',
    textOnPrimary: '#FFFFFF',
    
    // Primary colors
    primary: '#1976D2',
    primaryVariant: '#1565C0',
    
    // Status colors
    success: '#4CAF50',
    error: '#D32F2F',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Interactive colors
    inactive: '#BDBDBD',
    border: '#E0E0E0',
    divider: '#E0E0E0',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
  },
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

const DARK_THEME = {
  name: 'dark',
  colors: {
    // Background colors
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2D2D2D',
    
    // Text colors (WCAG AA compliant)
    text: '#E0E0E0',
    textSecondary: '#B0B0B0',
    textDisabled: '#757575',
    textOnPrimary: '#FFFFFF',
    
    // Primary colors (adjusted for dark theme contrast)
    primary: '#64B5F6',
    primaryVariant: '#42A5F5',
    
    // Status colors (adjusted for dark theme)
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFB74D',
    info: '#64B5F6',
    
    // Interactive colors
    inactive: '#757575',
    border: '#424242',
    divider: '#424242',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

const COMMON_THEME = {
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  animations: {
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: [0.25, 0.1, 0.25, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOut: [0, 0, 0.58, 1],
      easeInOut: [0.42, 0, 0.58, 1],
    },
  },
};

export const lightTheme = {
  ...COMMON_THEME,
  ...LIGHT_THEME,
};

export const darkTheme = {
  ...COMMON_THEME,
  ...DARK_THEME,
};

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState(null); // null, 'light', 'dark'

  // Determine current theme: override takes precedence, fallback to device
  const isDarkMode = themeOverride === 'dark' || (themeOverride === null && deviceColorScheme === 'dark');
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    if (themeOverride === null) {
      // If following system, set to opposite of current system
      setThemeOverride(deviceColorScheme === 'dark' ? 'light' : 'dark');
    } else if (themeOverride === 'dark') {
      setThemeOverride('light');
    } else {
      setThemeOverride('dark');
    }
  };

  const resetToSystemTheme = () => {
    setThemeOverride(null);
  };

  const value = {
    currentTheme,
    isDarkMode,
    themeOverride,
    deviceColorScheme,
    toggleTheme,
    resetToSystemTheme,
    isFollowingSystem: themeOverride === null,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { SPACING, TYPOGRAPHY }; 