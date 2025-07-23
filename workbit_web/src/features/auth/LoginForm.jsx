import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import useAuth from '../../hooks/useAuth';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState({});
  
  const { login, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    // Limpiar errores cuando se modifica el formulario
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo específico
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await login(formData.email, formData.password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6"
        >
          <span className="text-white font-bold text-2xl">W</span>
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Iniciar Sesión
        </h1>
        
        <p className="text-gray-600">
          Accede a tu cuenta de WorkBit
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-600">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={handleInputChange}
          error={formErrors.email}
          icon={<Mail size={20} />}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleInputChange}
          error={formErrors.password}
          icon={<Lock size={20} />}
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          ¿No tienes cuenta?{' '}
          <button className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Solicita acceso
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginForm; 