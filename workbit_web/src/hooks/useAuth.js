import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { authAPI } from '../api/apiService';

export const useAuth = () => {
  const navigate = useNavigate();
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading,
    login: loginStore, 
    logout: logoutStore, 
    setLoading,
    getUserRole,
    isAdmin,
    isTechnician,
    isEmployee
  } = useUserStore();

  const [error, setError] = useState(null);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('workbit_token');
      
      if (storedToken && !user) {
        setLoading(true);
        try {
          const profileData = await authAPI.getProfile();
          loginStore(profileData, storedToken);
        } catch (error) {
          console.error('Error al verificar token:', error);
          logoutStore();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [user, loginStore, logoutStore, setLoading]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.token) {
        loginStore(response.user || response.data, response.token);
        navigate('/dashboard/overview');
        return { success: true };
      } else {
        throw new Error(response.message || 'Error en el inicio de sesión');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      logoutStore();
      navigate('/login');
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    // Estado
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // Métodos
    login,
    logout,
    clearError,
    
    // Helpers de rol
    getUserRole,
    isAdmin: isAdmin(),
    isTechnician: isTechnician(),
    isEmployee: isEmployee()
  };
};

export default useAuth; 