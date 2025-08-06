import React from 'react';
import { Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import SpacesScreen from '../screens/SpacesScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingTop: 0, // ❌ Sin padding superior - los botones ocuparán todo el espacio
          paddingBottom: insets.bottom, // Solo el área segura del dispositivo, sin padding adicional
          paddingHorizontal: 0,
          height: 56 + insets.bottom, // Altura más compacta sin texto y sin padding adicional
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8, // Sombra en Android
          shadowColor: '#000', // Sombra en iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          overflow: 'hidden', // Contiene el efecto ripple dentro del TabBar
        },
        tabBarItemStyle: {
          flex: 1, // Cada botón toma 1/3 del espacio disponible
          paddingVertical: 0, // ❌ Sin padding vertical - los botones ocupan toda la altura
          marginHorizontal: 4, // Margen más pequeño para mayor área de tap
          marginTop: 4, // Pequeño margen superior para separar del borde
          marginBottom: 4, // Pequeño margen inferior para separar del borde
          borderRadius: 12, // Bordes redondeados para el área del botón
          overflow: 'hidden', // Contiene el efecto ripple dentro de cada botón
        },
        tabBarShowLabel: false, // Oculta todas las etiquetas
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Reservations" 
        component={ReservationsScreen}
        options={{
          tabBarIcon: ({ color, size = 28 }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              android_ripple={{
                color: '#d1d5db',
                borderless: false, // El ripple se contiene dentro del botón completo
              }}
              style={({ pressed }) => [
                props.style,
                {
                  flex: 1, // Toma todo el espacio disponible del botón
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Spaces" 
        component={SpacesScreen}
        options={{
          tabBarIcon: ({ color, size = 28 }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              android_ripple={{
                color: '#d1d5db',
                borderless: false, // El ripple se contiene dentro del botón completo
              }}
              style={({ pressed }) => [
                props.style,
                {
                  flex: 1, // Toma todo el espacio disponible del botón
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size = 28 }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              android_ripple={{
                color: '#d1d5db',
                borderless: false, // El ripple se contiene dentro del botón completo
              }}
              style={({ pressed }) => [
                props.style,
                {
                  flex: 1, // Toma todo el espacio disponible del botón
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right' 
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Iniciando WorkBit..." />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator; 