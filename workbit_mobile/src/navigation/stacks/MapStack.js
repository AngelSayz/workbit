import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'styled-components/native';
import MapScreen from '../../screens/MapScreen';
import SpaceDetailScreen from '../../screens/SpaceDetailScreen';

const Stack = createNativeStackNavigator();

/**
 * Map stack navigator for space selection
 */
const MapStack = () => {
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
      initialRouteName="MapView"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="MapView"
        component={MapScreen}
        options={{
          title: 'Espacios Disponibles',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="SpaceDetail"
        component={SpaceDetailScreen}
        options={({ route }) => ({
          title: route.params?.space?.name || 'Detalle del Espacio',
          headerBackTitle: 'Mapa',
        })}
      />
    </Stack.Navigator>
  );
};

export default MapStack; 