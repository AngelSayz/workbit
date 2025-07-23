import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';

// Components
import ProtectedRoute from './features/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta raíz - HomePage pública */}
          <Route path="/" element={<HomePage />} />
          
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas del dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Rutas hijas del dashboard */}
            <Route path="overview" element={<OverviewPage />} />
            
            {/* Placeholder para futuras páginas */}
            <Route 
              path="spaces" 
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Espacios</h1>
                  <p className="text-gray-600">Esta página estará disponible pronto...</p>
                </motion.div>
              } 
            />
            
            <Route 
              path="reservations" 
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Reservas</h1>
                  <p className="text-gray-600">Esta página estará disponible pronto...</p>
                </motion.div>
              } 
            />
            
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredRole="Admin">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="admin" 
              element={
                <ProtectedRoute requiredRole="Admin">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel de Administración</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="technician" 
              element={
                <ProtectedRoute requiredRole="Technician">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel de Técnico</h1>
                    <p className="text-gray-600">Esta página estará disponible pronto...</p>
                  </motion.div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="settings" 
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h1>
                  <p className="text-gray-600">Esta página estará disponible pronto...</p>
                </motion.div>
              } 
            />
            
            {/* Ruta por defecto del dashboard */}
            <Route path="" element={<Navigate to="overview" replace />} />
          </Route>
          
          {/* Ruta 404 */}
          <Route 
            path="*" 
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center"
              >
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                  <a 
                    href="/dashboard/overview" 
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Volver al dashboard
                  </a>
                </div>
              </motion.div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
