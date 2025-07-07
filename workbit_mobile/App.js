import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from './src/constants/theme';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent = () => {
  const { currentTheme, isDarkMode } = useTheme();

  return (
    <StyledThemeProvider theme={currentTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </StyledThemeProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
