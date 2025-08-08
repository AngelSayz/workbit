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
      console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      );
      
      // Create fetch promise
      const fetchPromise = fetch(url, config);
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`✅ API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Intentar obtener el mensaje de error del backend
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('❌ Validation errors:', errorData.details);
            errorMessage += ` - ${JSON.stringify(errorData.details)}`;
          }
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`📦 API Data received for ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      
      // Improve error messages
      if (error.message === 'Request timeout') {
        throw new Error('Conexión lenta. Verifica tu internet.');
      } else if (error.message === 'Network request failed' || error.name === 'TypeError') {
        throw new Error('Sin conexión a internet.');
      }
      
      throw error;
    }
  }

  setAuthToken(token) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = null;
  }

  // User profile endpoints
  async getUserProfile(userId) {
    return this.request(`/api/users/${userId}/profile`);
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

  // Environmental data endpoints
  async getReservationEnvironmentalData(reservationId) {
    return this.request(`/api/reservations/${reservationId}/environmental-data`);
  }

  async getSpaceEnvironmentalData(spaceId, hours = 24) {
    return this.request(`/api/sensors/readings/${spaceId}?hours=${hours}`);
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

  // Validate user existence
  async validateUser(username) {
    return this.request(`/api/users/validate/${encodeURIComponent(username)}`);
  }

  // Report endpoints
  async createReport({ reservation_id, title, description, attachments = [] }) {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ reservation_id, title, description, attachments }),
    });
  }

  async getMyReports() {
    return this.request('/api/reports/my');
  }

  async getReportByReservation(reservationId) {
    return this.request(`/api/reports/by-reservation/${reservationId}`);
  }

  async uploadReportImage(formData) {
    // formData must be FormData with 'image' file and optional reservation_id
    const url = `${API_BASE_URL}/api/uploads/report-image`;
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      throw new Error('Error subiendo imagen');
    }
    return response.json();
  }
}

export default new ApiService();