// Sistema de logging configurable
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  static info(message, data = null) {
    if (isDevelopment || isProduction) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  }

  static success(message, data = null) {
    if (isDevelopment || isProduction) {
      console.log(`✅ ${message}`, data || '');
    }
  }

  static warn(message, data = null) {
    if (isDevelopment || isProduction) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }

  static error(message, error = null) {
    if (isDevelopment || isProduction) {
      console.error(`❌ ${message}`, error?.message || error || '');
    }
  }

  static debug(message, data = null) {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, data || '');
    }
  }

  static mqtt(message, data = null) {
    if (isDevelopment) {
      console.log(`📡 ${message}`, data || '');
    }
  }

  static mongo(message, data = null) {
    if (isDevelopment) {
      console.log(`🗄️ ${message}`, data || '');
    }
  }

  static api(message, data = null) {
    if (isDevelopment) {
      console.log(`🌐 ${message}`, data || '');
    }
  }
}

module.exports = Logger; 