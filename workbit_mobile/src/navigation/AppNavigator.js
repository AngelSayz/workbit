import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { useTheme } from 'styled-components/native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TabNavigator from './TabNavigator';
import { LoadingSpinner } from '../components/molecules';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main app navigator handling authentication flow
 */
const AppNavigator = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if this is the first app launch
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }

      // Check authentication state
      // API_CALL: checkAuthenticationStatus()
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        // Validate token with backend
        // API_CALL: validateToken(userToken)
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      // Fallback to unauthenticated state
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      // Hide splash screen once we're done loading
      await SplashScreen.hideAsync();
    }
  };

  const handleAuthentication = async (userData) => {
    try {
      // Store authentication data
      await AsyncStorage.setItem('userToken', userData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Navigation theme based on current color scheme
  const navigationTheme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Iniciando WorkBit..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!isAuthenticated ? (
          // Auth flow screens
          <Stack.Group>
            {isFirstLaunch && (
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                  animationTypeForReplace: 'push',
                }}
              />
            )}
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen name="Auth">
              {(props) => (
                <AuthScreen
                  {...props}
                  onAuthentication={handleAuthentication}
                />
              )}
            </Stack.Screen>
          </Stack.Group>
        ) : (
          // Main app screens
          <Stack.Group>
            <Stack.Screen 
              name="MainApp" 
              component={TabNavigator}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 