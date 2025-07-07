import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../components/atoms';
import ReservationsTab from './stacks/ReservationsStack';
import MapTab from './stacks/MapStack';
import ProfileTab from './stacks/ProfileStack';

const Tab = createBottomTabNavigator();

/**
 * Main tab navigator with bottom tabs and safe area support
 */
const TabNavigator = ({ onLogout }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Graceful fallback if haptics not available
      console.log('Haptics not available:', error);
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Reservations':
              iconName = 'calendar';
              break;
            case 'Map':
              iconName = 'map';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'help-circle';
          }

          return (
            <Icon
              name={iconName}
              size={size}
              color={color}
              accessibilityHidden={true}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.divider,
          paddingBottom: Math.max(insets.bottom, 8), // Respeta el safe area bottom
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0), // Ajusta altura dinámicamente
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: theme.typography.families.default,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarButton: (props) => {
          return (
            <TouchableOpacity
              {...props}
              onPress={async (e) => {
                await handleTabPress();
                props.onPress?.(e);
              }}
              accessibilityRole="tab"
              accessibilityState={props.accessibilityState}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Reservations"
        component={ReservationsTab}
        options={{
          title: 'Reservas',
          tabBarLabel: 'Reservas',
          tabBarAccessibilityLabel: 'Pestaña de reservas',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapTab}
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarAccessibilityLabel: 'Pestaña de mapa de espacios',
        }}
      />
      <Tab.Screen name="Profile" options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarAccessibilityLabel: 'Pestaña de perfil',
        }}>
        {(props) => <ProfileTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigator; 