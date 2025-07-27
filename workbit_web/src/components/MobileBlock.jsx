import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Smartphone, Monitor } from 'lucide-react';

const MobileBlock = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('mobile.blockTitle')}
          </h1>
          <p className="text-gray-600">
            {t('mobile.blockMessage')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-gray-700 mb-2">
              <Monitor className="w-5 h-5" />
              <span className="font-medium">Accede desde tu computadora</span>
            </div>
            <p className="text-sm text-gray-600">
              Para una mejor experiencia y funcionalidad completa, utiliza un dispositivo de escritorio
            </p>
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p>• Pantalla más grande para mejor visualización</p>
            <p>• Funcionalidades completas del dashboard</p>
            <p>• Mejor experiencia de usuario</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            {t('mobile.back')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MobileBlock; 