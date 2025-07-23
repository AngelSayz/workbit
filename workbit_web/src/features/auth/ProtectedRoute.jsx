import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol si es requerido
  if (requiredRole) {
    const userRole = getUserRole();
    const hasPermission = Array.isArray(requiredRole) 
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
            <p className="text-xl text-gray-600 mb-8">No tienes permisos para acceder a esta página</p>
            <Navigate to="/dashboard/overview" replace />
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute; 