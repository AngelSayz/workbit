import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'styled-components/native';
import ProfileScreen from '../../screens/ProfileScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import NotificationSettingsScreen from '../../screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

/**
 * Profile stack navigator
 */
const ProfileStack = ({ onLogout }) => {
  const theme = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.surface,
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 18,
      fontFamily: theme.typography.families.default,
    },
    headerShadowVisible: true,
    animation: 'slide_from_right',
  };

  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="ProfileMain"
        options={{
          title: 'Perfil',
          headerLargeTitle: true,
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          headerBackTitle: 'Perfil',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notificaciones',
          headerBackTitle: 'Configuración',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack; 