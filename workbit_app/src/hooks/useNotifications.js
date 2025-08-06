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

  const showConfirmation = useCallback((config) => {
    setConfirmation({
      visible: true,
      title: config.title || '¿Estás seguro?',
      message: config.message || 'Esta acción no se puede deshacer.',
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar',
      type: config.type || 'warning',
      onConfirm: config.onConfirm || (() => {}),
      onCancel: config.onCancel || (() => {}),
      loading: false,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({ ...prev, visible: false }));
  }, []);

  const setLoading = useCallback((loading) => {
    setConfirmation(prev => ({ ...prev, loading }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await confirmation.onConfirm();
      hideConfirmation();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
    }
  }, [confirmation.onConfirm, hideConfirmation, setLoading]);

  const handleCancel = useCallback(() => {
    confirmation.onCancel();
    hideConfirmation();
  }, [confirmation.onCancel, hideConfirmation]);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    setLoading,
  };
};
