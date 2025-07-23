const API_BASE_URL = 'https://workbit-api.azurewebsites.net';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

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

  // Auth endpoints
  async login(username, password) {
    const formData = new FormData();
    formData.append('Username', username);
    formData.append('Password', password);

    return this.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Username: username,
        Password: password,
      }),
    });
  }

  // User endpoints
  async getUser(id) {
    return this.request(`/api/Users/${id}`);
  }

  async getAllUsers() {
    return this.request('/api/Users');
  }

  // Space endpoints
  async getAvailableSpaces(date) {
    // Format date as YYYY-MM-DD
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    return this.request(`/api/AvailableSpaces/${formattedDate}`);
  }

  // Reservation endpoints
  async getAllReservations() {
    return this.request('/api/Reservations');
  }

  async getReservationById(id) {
    return this.request(`/api/Reservations/${id}`);
  }

  async getReservationsByDate(date) {
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : date;
    return this.request(`/api/Reservations/${formattedDate}`);
  }

  async createReservation(reservationData) {
    return this.request('/api/Reservations/createResevation', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
  }

  async updateReservationStatus(id, status) {
    return this.request('/api/Reservations/update', {
      method: 'POST',
      body: JSON.stringify({ Id: id, Status: status }),
    });
  }

  // Access log endpoints  
  async createAccessLog(accessLogData) {
    return this.request('/api/AccessLog', {
      method: 'POST',
      body: JSON.stringify(accessLogData),
    });
  }
}

export default new ApiService(); 