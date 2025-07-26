import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { Button } from '../ui';
import useMobile from '../../hooks/useMobile';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMobile();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    if (isMobile) {
      alert('El panel de administración no está disponible en dispositivos móviles. Por favor, accede desde tu computadora.');
      setIsOpen(false);
      return;
    }
    window.location.href = '/login';
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl sm:text-2xl font-bold text-blue-600"
            >
              WorkBit
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a 
                href="#features" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-300"
              >
                Características
              </a>
              <a 
                href="#contact" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-300"
              >
                Contacto
              </a>
            </div>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <Button
              onClick={handleLogin}
              icon={<LogIn size={18} />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Iniciar Sesión
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="#features"
                className="text-gray-700 hover:text-blue-600 block px-3 py-3 text-base font-medium transition-colors duration-300 rounded-lg hover:bg-gray-50"
                onClick={toggleMenu}
              >
                Características
              </a>
              <a 
                href="#contact"
                className="text-gray-700 hover:text-blue-600 block px-3 py-3 text-base font-medium transition-colors duration-300 rounded-lg hover:bg-gray-50"
                onClick={toggleMenu}
              >
                Contacto
              </a>
              <div className="pt-2">
                <Button
                  onClick={handleLogin}
                  icon={<LogIn size={18} />}
                  className={`w-full py-3 text-base font-medium transition-all duration-300 ${
                    isMobile 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isMobile ? 'Solo Disponible en PC' : 'Iniciar Sesión'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar; 