import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import UsersPage from './pages/dashboard/UsersPage';

// Components
import ProtectedRoute from './features/auth/ProtectedRoute';
import RoleGuard from './features/auth/RoleGuard';
import SetupGuard from './components/layout/SetupGuard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={
              <SetupGuard>
                <LoginPage />
              </SetupGuard>
            } 
          />
          
          {/* Protected Dashboard Routes - Solo proteger la ruta principal */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Pages - Sin protección adicional */}
            <Route path="overview" element={<OverviewPage />} />
            
            {/* Users Management - Solo verificar rol, no autenticación */}
            <Route 
              path="users" 
              element={
                <RoleGuard requiredRole="admin">
                  <UsersPage />
                </RoleGuard>
              } 
            />
            
            {/* Placeholder Pages */}
            <Route 
              path="spaces" 
              element={
                <div className="w-full h-full p-6">
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Espacios</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </div>
                </div>
              } 
            />
            
            <Route 
              path="reservations" 
              element={
                <div className="w-full h-full p-6">
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Reservas</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </div>
                </div>
              } 
            />
            
            <Route 
              path="settings" 
              element={
                <div className="w-full h-full p-6">
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </div>
                </div>
              } 
            />
            
            {/* Default redirect to overview */}
            <Route path="" element={<Navigate to="overview" replace />} />
          </Route>
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                  <a 
                    href="/" 
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Volver al inicio
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
