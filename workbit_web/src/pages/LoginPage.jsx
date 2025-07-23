import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '../features/auth';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Columna Izquierda - Formulario */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative">
        {/* Botón de Atrás */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-8 left-8"
        >
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Atrás</span>
          </Link>
        </motion.div>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          <LoginForm />
        </div>
      </div>

      {/* Columna Derecha - Imagen de Marca */}
      <div className="hidden lg:block relative flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 h-full w-full object-cover bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"
        >
          {/* Pattern Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center max-w-lg"
            >
              {/* Logo */}
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-2xl">W</span>
                </div>
                <span className="text-4xl font-bold">WorkBit</span>
              </div>

              <h2 className="text-4xl font-bold mb-6">
                Gestión inteligente de espacios
              </h2>
              
              <p className="text-xl opacity-90 mb-8 leading-relaxed">
                Revoluciona la forma en que tu empresa gestiona y optimiza 
                sus espacios de trabajo con tecnología IoT de vanguardia.
              </p>

              <div className="grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Sensores IoT en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Control de acceso RFID</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Analytics y reportes avanzados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Aplicación móvil nativa</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white bg-opacity-5 rounded-full blur-2xl" />
          <div className="absolute top-1/2 right-10 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-lg" />
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 