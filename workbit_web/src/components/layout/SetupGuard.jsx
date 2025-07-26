import { useState, useEffect } from 'react';
import { authAPI } from '../../api/apiService';
import FirstSetupPage from '../../pages/FirstSetupPage';

const SetupGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkSystemSetup();
  }, []);

  const checkSystemSetup = async () => {
    try {
      console.log('🔍 Verificando si existe un administrador en el sistema...');
      const response = await authAPI.checkAdminExists();
      setNeedsSetup(!response.hasAdmin);
      
      if (!response.hasAdmin) {
        console.log('⚠️ No se encontraron administradores. Mostrando página de configuración inicial.');
      } else {
        console.log('✅ Se encontraron administradores. Continuando con el login normal.');
      }
    } catch (error) {
      console.error('❌ Error verificando configuración del sistema:', error);
      // En caso de error, asumir que el sistema está configurado para evitar bloqueos
      setNeedsSetup(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando configuración del sistema...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <FirstSetupPage />;
  }

  return children;
};

export default SetupGuard; 