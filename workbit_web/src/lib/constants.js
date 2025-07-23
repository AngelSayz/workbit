// Configuración de la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'Admin',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee'
};

// Estados de espacios
export const SPACE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
};

// Estados de reservas
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'WorkBit',
  VERSION: '1.0.0',
  TOKEN_KEY: 'workbit_token'
}; 