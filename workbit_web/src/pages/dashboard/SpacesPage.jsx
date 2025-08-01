import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Grid, 
  Plus, 
  Settings, 
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import CubiclesLayout from '../../components/CubiclesLayout';

const SpacesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('layout');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh - en realidad el componente CubiclesLayout se actualizará automáticamente
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const tabs = [
    { id: 'layout', name: 'Layout Visual', icon: Eye },
    { id: 'list', name: 'Lista de Espacios', icon: Grid },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-full h-full p-6 space-y-6" style={{ minHeight: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Espacios
          </h1>
          <p className="text-gray-600">
            Administra y visualiza todos los cubículos del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nuevo Espacio
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6" style={{ minHeight: '500px' }}>
          {activeTab === 'layout' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CubiclesLayout />
            </motion.div>
          )}

          {activeTab === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <Grid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Lista de Espacios
              </h3>
              <p className="text-gray-600">
                Vista en tabla de todos los espacios disponibles
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Funcionalidad en desarrollo
              </p>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configuración del Grid
              </h3>
              <p className="text-gray-600">
                Ajusta las dimensiones y configuración del layout
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Funcionalidad en desarrollo
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SpacesPage;