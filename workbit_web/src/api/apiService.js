import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workbit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('workbit_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funciones de autenticación
export const authAPI = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  registerFirstAdmin: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/first-admin`, userData);
    return response.data;
  },

  checkAdminExists: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/admin-exists`);
      return response.data;
    } catch (error) {
      console.error('Error checking admin exists:', error);
      return { hasAdmin: true }; // Fail safe - si hay error, asumir que sí hay admin
    }
  },
  
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
  
  logout: async () => {
    localStorage.removeItem('workbit_token');
    return Promise.resolve();
  }
};

// Funciones de usuarios
export const usersAPI = {
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  
  getUsersByRole: async (role) => {
    const response = await apiClient.get(`/users/by-role/${role}`);
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  }
};

// Funciones de espacios/cubículos
export const spacesAPI = {
  getSpaces: async () => {
    const response = await apiClient.get('/spaces');
    return response.data;
  },
  
  getAvailableSpacesByDate: async (date) => {
    const response = await apiClient.get(`/spaces/available/${date}`);
    return response.data;
  },
  
  updateSpaceStatus: async (spaceId, status) => {
    const response = await apiClient.put(`/spaces/${spaceId}/status`, { status });
    return response.data;
  }
};

// Funciones de reservas
export const reservationsAPI = {
  getReservations: async () => {
    const response = await apiClient.get('/reservations');
    return response.data;
  },
  
  createReservation: async (reservationData) => {
    const response = await apiClient.post('/reservations', reservationData);
    return response.data;
  },
  
  updateReservationStatus: async (reservationId, status) => {
    const response = await apiClient.put(`/reservations/${reservationId}/status`, { status });
    return response.data;
  },
  
  deleteReservation: async (reservationId) => {
    const response = await apiClient.delete(`/reservations/${reservationId}`);
    return response.data;
  }
};

// Funciones de logs de acceso
export const accessLogsAPI = {
  getAccessLogs: async () => {
    const response = await apiClient.get('/access-logs');
    return response.data;
  }
};

// Funciones de administración
export const adminAPI = {
  getAdminData: async () => {
    const response = await apiClient.get('/admin');
    return response.data;
  }
};

// Funciones de técnicos
export const technicianAPI = {
  getTechnicianData: async () => {
    const response = await apiClient.get('/technician');
    return response.data;
  }
};

export default apiClient; 