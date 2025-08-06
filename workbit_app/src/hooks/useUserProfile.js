import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useUserProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUserProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getUserProfile(user.id);
      
      if (response.success && response.user) {
        const updatedUser = {
          ...user,
          ...response.user,
          cardCode: response.user.codecards?.code || null,
          fullname: `${response.user.name} ${response.user.lastname}`,
        };
        
        setUser(updatedUser);
        
        // Update AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      }
      
      return { success: false, error: 'No se pudo obtener el perfil del usuario' };
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    refreshUserProfile,
  };
};
