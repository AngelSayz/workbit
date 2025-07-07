import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'styled-components/native';
import ReservationsScreen from '../../screens/ReservationsScreen';
import ReservationDetailScreen from '../../screens/ReservationDetailScreen';
import EnvironmentalMonitoringScreen from '../../screens/EnvironmentalMonitoringScreen';

const Stack = createNativeStackNavigator();

/**
 * Reservations stack navigator
 */
const ReservationsStack = () => {
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
      initialRouteName="ReservationsList"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="ReservationsList"
        component={ReservationsScreen}
        options={{
          title: 'Mis Reservas',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="ReservationDetail"
        component={ReservationDetailScreen}
        options={({ route }) => ({
          title: route.params?.reservation?.reason || 'Detalle de Reserva',
          headerBackTitle: 'Reservas',
        })}
      />
      <Stack.Screen
        name="EnvironmentalMonitoring"
        component={EnvironmentalMonitoringScreen}
        options={{
          title: 'Monitoreo Ambiental',
          headerBackTitle: 'Reserva',
        }}
      />
    </Stack.Navigator>
  );
};

export default ReservationsStack; 