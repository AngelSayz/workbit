const API_BASE_URL = 'https://workbit.onrender.com';

class ApiService {
  constructor() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  setAuthToken(token) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = null;
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    const result = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearAuthToken();
    return result;
  }

  // User endpoints
  async getUser(id) {
    return this.request(`/api/users/${id}`);
  }

  async getAllUsers() {
    return this.request('/api/users');
  }

  async getUserProfile() {
    return this.request('/api/users/profile');
  }

  // Space endpoints
  async getAvailableSpaces(date) {
    // Format date as YYYY-MM-DD
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    return this.request(`/api/spaces/available/${formattedDate}`);
  }

  async getAllSpaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spaces/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.spaces || [];
    } catch (error) {
      console.error('API request failed:', error);
      // Retornar datos de ejemplo si falla
      return [];
    }
  }

  async getGridSpaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/grid/spaces/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      // Retornar datos de ejemplo si falla
      return {
        success: true,
        data: {
          grid: { rows: 5, cols: 8 },
          spaces: []
        }
      };
    }
  }

  // Reservation endpoints
  async getAllReservations() {
    return this.request('/api/reservations');
  }

  async getMyReservations() {
    return this.request('/api/reservations/my');
  }

  async getReservationById(id) {
    return this.request(`/api/reservations/${id}`);
  }

  async getReservationsByDate(date) {
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    return this.request(`/api/reservations/by-date/${formattedDate}`);
  }

  async createReservation(reservationData) {
    return this.request('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  async updateReservationStatus(id, status) {
    return this.request(`/api/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Access log endpoints  
  async createAccessLog(accessLogData) {
    return this.request('/api/access-logs', {
      method: 'POST',
      body: JSON.stringify(accessLogData),
    });
  }

  async getAccessLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/api/access-logs${queryParams ? `?${queryParams}` : ''}`);
  }
}

export default new ApiService(); 