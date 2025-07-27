import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import UsersPage from './pages/dashboard/UsersPage';
import FirstSetupPage from './pages/FirstSetupPage';

// Components
import ProtectedRoute from './features/auth/ProtectedRoute';
import RoleGuard from './features/auth/RoleGuard';
import SetupGuard from './components/layout/SetupGuard';
import MobileBlock from './components/MobileBlock';
import ScrollToTop from './components/ScrollToTop';
import useMobile from './hooks/useMobile';

function App() {
  const isMobile = useMobile();

  return (
    <Router>
      <div className="App">
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Bloquear acceso al login desde móviles */}
          <Route 
            path="/login" 
            element={
              isMobile ? (
                <MobileBlock />
              ) : (
                <SetupGuard>
                  <LoginPage />
                </SetupGuard>
              )
            } 
          />
          
          {/* Bloquear acceso al setup desde móviles */}
          <Route 
            path="/setup" 
            element={
              isMobile ? (
                <MobileBlock />
              ) : (
                <FirstSetupPage />
              )
            } 
          />
          
          {/* Bloquear acceso al dashboard desde móviles */}
          <Route 
            path="/dashboard" 
            element={
              isMobile ? (
                <MobileBlock />
              ) : (
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              )
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Espacios</h2>
                    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
                  </div>
                </div>
              } 
            />
            
            <Route 
              path="reservations" 
              element={
                <div className="w-full h-full p-6">
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Reservas</h2>
                    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
                  </div>
                </div>
              } 
            />
            
            <Route 
              path="settings" 
              element={
                <div className="w-full h-full p-6">
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h2>
                    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
                  </div>
                </div>
              } 
            />
            
            {/* Default redirect to overview */}
            <Route path="" element={<OverviewPage />} />
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
