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
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  },

  registerFirstAdmin: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/first-admin`, userData);
    return response.data;
  },

  // Nuevo método para registro de usuarios por administradores
  adminRegister: async (userData) => {
    const token = localStorage.getItem('workbit_token');
    const response = await axios.post(`${API_URL}/api/auth/admin-register`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  getUserBySupabaseId: async (supabaseUserId) => {
    const response = await axios.post(`${API_URL}/api/auth/user-by-supabase-id`, { 
      supabaseUserId 
    });
    return response.data;
  },

  checkAdminExists: async () => {
    const response = await axios.get(`${API_URL}/api/auth/admin-exists`);
    return response.data;
  },

  logout: async () => {
    const token = localStorage.getItem('workbit_token');
    if (token) {
      try {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('workbit_token');
    localStorage.removeItem('workbit_user');
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
  },
  
  updateUserCardCode: async (userId, cardCode) => {
    const response = await apiClient.put(`/users/${userId}/card-code`, { cardCode });
    return response.data;
  },

  // Métodos adicionales para compatibilidad
  getAll: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};

// Funciones de dispositivos
export const devicesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/devices', { params });
    return response.data;
  },

  getById: async (deviceId) => {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  },

  updateStatus: async (deviceId, statusData) => {
    const response = await apiClient.patch(`/devices/${deviceId}/status`, statusData);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/devices/stats/overview');
    return response.data;
  },

  getOffline: async (hours = 24) => {
    const response = await apiClient.get('/devices/offline', { params: { hours } });
    return response.data;
  },

  getBySpace: async (spaceId) => {
    const response = await apiClient.get(`/devices/space/${spaceId}`);
    return response.data;
  },

            getSpaceReadings: async (spaceId, timeRange = '24h', sensorType = null) => {
            const params = { timeRange };
            if (sensorType) params.sensorType = sensorType;
            const response = await apiClient.get(`/devices/space/${spaceId}/readings`, { params });
            return response.data;
          },

          getSpaceActivity: async (spaceId, limit = 20) => {
            const response = await apiClient.get(`/devices/space/${spaceId}/activity`, { params: { limit } });
            return response.data;
          }
};

// Funciones de espacios/cubículos
export const spacesAPI = {
  getSpaces: async () => {
    const response = await apiClient.get('/spaces');
    return response.data;
  },
  
  getGridSpaces: async () => {
    const response = await apiClient.get('/grid/spaces');
    return response.data;
  },
  
  getAvailableSpacesByDate: async (date) => {
    const response = await apiClient.get(`/spaces/available/${date}`);
    return response.data;
  },
  
  createSpace: async (spaceData) => {
    const response = await apiClient.post('/spaces', spaceData);
    return response.data;
  },
  
  updateSpace: async (spaceId, spaceData) => {
    const response = await apiClient.put(`/spaces/${spaceId}`, spaceData);
    return response.data;
  },
  
  deleteSpace: async (spaceId) => {
    const response = await apiClient.delete(`/spaces/${spaceId}`);
    return response.data;
  },
  
  updateSpaceStatus: async (spaceId, status) => {
    const response = await apiClient.put(`/spaces/${spaceId}/status`, { status });
    return response.data;
  },
  
  updateSpacePosition: async (spaceId, position) => {
    const response = await apiClient.put(`/grid/spaces/${spaceId}/position`, position);
    return response.data;
  },
  
  // Nuevos métodos para administración de espacios
  updateSpaceAdmin: async (spaceId, spaceData) => {
    const response = await apiClient.put(`/spaces/${spaceId}`, spaceData);
    return response.data;
  },
  
  relocateSpace: async (spaceId, position_x, position_y) => {
    const response = await apiClient.put(`/spaces/${spaceId}/position`, { position_x, position_y });
    return response.data;
  },
  
  updateGridSettings: async (gridSettings) => {
    const response = await apiClient.put('/grid', gridSettings);
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

// Funciones de dashboard
export const dashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
  
  getCharts: async () => {
    const response = await apiClient.get('/dashboard/charts');
    return response.data;
  }
};

// Funciones de tasks
export const tasksAPI = {
  getTasks: async () => {
    const response = await apiClient.get('/tasks');
    return response.data;
  },
  
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (taskId, taskData) => {
    const response = await apiClient.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
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