import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const RoleGuard = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  // Si está cargando, mostrar un loading más sutil
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene el rol requerido
  if (user?.role !== requiredRole) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-4">
            Necesitas permisos de <strong>{requiredRole}</strong> para acceder a esta página.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Volver al Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Si tiene los permisos, mostrar el contenido
  return children;
};

export default RoleGuard; 