import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success', title = null, duration = 3000) => {
    const notificationData = {
      message,
      type,
      title,
      id: Date.now() // Para identificar notificaciones únicas
    };
    
    setNotification(notificationData);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Métodos específicos para cada tipo
  const showSuccess = useCallback((message, title = null, duration = 3000) => {
    showNotification(message, 'success', title, duration);
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error', duration = 5000) => {
    showNotification(message, 'error', title, duration);
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Advertencia', duration = 4000) => {
    showNotification(message, 'warning', title, duration);
  }, [showNotification]);

  const showInfo = useCallback((message, title = null, duration = 3000) => {
    showNotification(message, 'info', title, duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
