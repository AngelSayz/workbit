// Date formatting utilities
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...options
  };
  
  return new Date(date).toLocaleDateString('es-ES', defaultOptions);
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Storage utilities
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  AUTH_TOKEN: 'authToken',
  APP_SETTINGS: 'appSettings'
};

// API utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || 'Error del servidor';
  } else if (error.request) {
    // Network error
    return 'Error de conexión. Verifica tu internet.';
  } else {
    // Other error
    return error.message || 'Error inesperado';
  }
}; 