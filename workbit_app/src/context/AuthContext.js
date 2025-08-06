import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (userData && authToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        ApiService.setAuthToken(authToken);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await ApiService.login(email, password);
      
      // Handle new backend response format
      if (response.token && response.user) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          fullname: `${response.user.name} ${response.user.lastname}`,
          name: response.user.name,
          lastname: response.user.lastname,
          email: response.user.email,
          role: response.user.role,
          userId: response.user.id,
          cardCode: response.user.cardCode,
        };

        // Store token and user data
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Set token in API service
        ApiService.setAuthToken(response.token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Respuesta inválida del servidor' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log('Starting registration process...', userData);
      
      const response = await ApiService.register(userData);
      console.log('Registration response received:', response);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Registration error:', error);
      console.log('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return { 
        success: false, 
        error: error.message || 'Error al registrar usuario' 
      };
    } finally {
      console.log('Registration process finished, setting loading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await ApiService.logout();
      
      // Clear local storage
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
      
      // Clear API service token
      ApiService.clearAuthToken();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser, // Add setUser to context
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 