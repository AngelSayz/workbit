const crypto = require('crypto');
const { format, parseISO, isValid } = require('date-fns');

/**
 * Generate a unique ID
 */
const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate a hash for caching
 */
const generateHash = (data) => {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const isValidDate = (dateString) => {
  if (typeof dateString !== 'string') return false;
  const date = parseISO(dateString);
  return isValid(date);
};

/**
 * Format date to string
 */
const formatDate = (date, formatString = 'yyyy-MM-dd') => {
  try {
    return format(date, formatString);
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>\"']/g, '');
};

/**
 * Generate JWT-safe random string
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Calculate pagination offset
 */
const calculatePagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
};

/**
 * Format API response
 */
const formatResponse = (data, message = null, meta = {}) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Format API error response
 */
const formatError = (error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      message: error.message || error,
      code: statusCode
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
};

/**
 * Convert time to minutes
 */
const timeToMinutes = (hours, minutes = 0) => {
  return (hours * 60) + minutes;
};

/**
 * Convert minutes to hours and minutes
 */
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

/**
 * Calculate time difference in minutes
 */
const getTimeDifference = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Check if time ranges overlap
 */
const timeRangesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 < e2 && s2 < e1;
};

/**
 * Generate a slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasLowerCase && hasNumbers,
    strength: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    },
    score: [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length
  };
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
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

/**
 * Rate limiting helper
 */
const createRateLimiter = (maxRequests, windowMs) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const filtered = timestamps.filter(time => time > windowStart);
      if (filtered.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, filtered);
      }
    }
    
    // Check current identifier
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        resetTime: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      };
    }
    
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length
    };
  };
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  if (obj == null) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Logger helper
 */
const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};

module.exports = {
  generateId,
  generateHash,
  isValidEmail,
  isValidDate,
  formatDate,
  sanitizeInput,
  generateSecureToken,
  calculatePagination,
  formatResponse,
  formatError,
  timeToMinutes,
  minutesToTime,
  getTimeDifference,
  timeRangesOverlap,
  generateSlug,
  validatePassword,
  debounce,
  createRateLimiter,
  deepClone,
  isEmpty,
  retry,
  logger
}; 