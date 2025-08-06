import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
    duration: 3000,
  });

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  }, []);

  const showSuccess = useCallback((message, duration = 3000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration = 4000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration = 3500) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration = 3000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };
};

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {},
    loading: false,
  });

  const showConfirmation = useCallback((title, message, type = 'warning') => {
    return new Promise((resolve) => {
      setConfirmation({
        visible: true,
        title: title || '¿Estás seguro?',
        message: message || 'Esta acción no se puede deshacer.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: type,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, visible: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmation(prev => ({ ...prev, visible: false }));
          resolve(false);
        },
        loading: false,
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({ 
      ...prev, 
      visible: false,
      onConfirm: () => {},
      onCancel: () => {}
    }));
  }, []);

  const setLoading = useCallback((loading) => {
    setConfirmation(prev => ({ ...prev, loading }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await confirmation.onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
    }
  }, [confirmation.onConfirm, setLoading]);

  const handleCancel = useCallback(() => {
    confirmation.onCancel();
  }, [confirmation.onCancel]);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    setLoading,
  };
};
