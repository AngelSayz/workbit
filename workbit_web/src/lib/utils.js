// Utilidad para combinar clases CSS
export const cn = (...classes) => {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Utilidades de formateo de fecha
export const formatDate = (date, locale = 'es-ES') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time) => {
  if (!time) return '';
  
  // Si es un objeto Date
  if (time instanceof Date) {
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Si es un string, asumir formato HH:MM
  return time;
};

export const formatDateTime = (dateTime, locale = 'es-ES') => {
  if (!dateTime) return '';
  
  const dateObj = new Date(dateTime);
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Utilidades de validación
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

// Utilidades de texto
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatUserName = (user) => {
  if (!user) return 'Usuario';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.name) {
    return user.name;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Usuario';
};

// Utilidades de estado
export const getStatusColor = (status, type = 'space') => {
  const statusColors = {
    space: {
      'available': 'bg-green-100 text-green-800',
      'disponible': 'bg-green-100 text-green-800',
      'occupied': 'bg-red-100 text-red-800',
      'ocupado': 'bg-red-100 text-red-800',
      'reserved': 'bg-yellow-100 text-yellow-800',
      'reservado': 'bg-yellow-100 text-yellow-800',
      'maintenance': 'bg-gray-100 text-gray-800',
      'mantenimiento': 'bg-gray-100 text-gray-800'
    },
    reservation: {
      'pending': 'bg-yellow-100 text-yellow-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'activa': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'completada': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'cancelada': 'bg-red-100 text-red-800'
    }
  };
  
  return statusColors[type]?.[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status) => {
  const statusTexts = {
    'available': 'Disponible',
    'occupied': 'Ocupado',
    'reserved': 'Reservado',
    'maintenance': 'Mantenimiento',
    'pending': 'Pendiente',
    'active': 'Activa',
    'completed': 'Completada',
    'cancelled': 'Cancelada'
  };
  
  return statusTexts[status?.toLowerCase()] || status;
};

// Utilidades de API
export const handleApiError = (error) => {
  if (error.response) {
    // Error de respuesta del servidor
    return error.response.data?.message || 'Error del servidor';
  } else if (error.request) {
    // Error de red
    return 'Error de conexión';
  } else {
    // Error de configuración
    return error.message || 'Error desconocido';
  }
};

// Utilidades de debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Utilidades de localStorage
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
}; 