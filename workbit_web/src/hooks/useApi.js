import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result.data || result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error en la petición';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export const useApiCall = (apiFunction, autoExecute = false, dependencies = []) => {
  const { data, loading, error, execute, reset } = useApi(apiFunction, dependencies);

  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [execute, autoExecute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch: execute
  };
};

export default useApi; 