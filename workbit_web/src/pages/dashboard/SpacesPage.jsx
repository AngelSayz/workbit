import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Plus, 
  Settings, 
  Trash2,
  Grid3x3,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GridLayout from '../../components/GridLayout';
import { useAuth } from '../../hooks/useAuth';
import { spacesAPI } from '../../api/apiService';

const SpacesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [gridConfig, setGridConfig] = useState({ rows: 5, cols: 8 });
  const [loading, setLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSpacesData();
  }, []);

  const loadSpacesData = async () => {
    try {
      setLoading(true);
      const response = await spacesAPI.getGridSpaces();
      if (response && response.success) {
        setSpaces(response.data.spaces || []);
        setGridConfig(response.data.grid || { rows: 5, cols: 8 });
      } else {
        // Fallback
        const spacesResponse = await spacesAPI.getSpaces();
        setSpaces(Array.isArray(spacesResponse) ? spacesResponse : []);
      }
    } catch (error) {
      console.error('Error loading spaces data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
    setShowEditModal(true);
    setEditForm({
      id: space.id,
      name: space.name,
      status: space.status,
      capacity: space.capacity,
      position_x: space.position_x,
      position_y: space.position_y,
    });
  };

  const handleAddSpace = async (position) => {
    try {
      const newSpace = {
        name: `Espacio ${spaces.length + 1}`,
        status: 'available',
        capacity: 1,
        position_x: position.position_x,
        position_y: position.position_y,
      };

      const response = await spacesAPI.createSpace(newSpace);
      if (response) {
        await loadSpacesData();
        setIsAddingMode(false);
      }
    } catch (error) {
      console.error('Error creating space:', error);
    }
  };

  const handleEditSpace = (space) => {
    setSelectedSpace(space);
    setShowEditModal(true);
    setEditForm({
      id: space.id,
      name: space.name,
      status: space.status,
      capacity: space.capacity,
      position_x: space.position_x,
      position_y: space.position_y,
    });
  };

  const handleDeleteSpace = async (space) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el espacio "${space.name}"?`)) {
      try {
        await spacesAPI.deleteSpace(space.id);
        await loadSpacesData();
      } catch (error) {
        console.error('Error deleting space:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await spacesAPI.updateSpace(editForm.id, editForm);
      await loadSpacesData();
      setShowEditModal(false);
      setSelectedSpace(null);
    } catch (error) {
      console.error('Error updating space:', error);
    }
  };

  const getStatusStats = () => {
    const stats = {
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      unavailable: 0,
    };

    spaces.forEach(space => {
      if (stats.hasOwnProperty(space.status)) {
        stats[space.status]++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="w-full h-full p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando espacios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Cubículos
            </h1>
            <p className="text-gray-600">
              Administra los espacios de trabajo y su disposición
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingMode(!isAddingMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAddingMode
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isAddingMode ? 'Cancelar' : 'Agregar Espacio'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        {[
          { label: 'Disponible', value: stats.available, icon: Building, color: 'green' },
          { label: 'Ocupado', value: stats.occupied, icon: Users, color: 'red' },
          { label: 'Reservado', value: stats.reserved, icon: Calendar, color: 'yellow' },
          { label: 'Mantenimiento', value: stats.maintenance, icon: Settings, color: 'gray' },
          { label: 'No disponible', value: stats.unavailable, icon: Activity, color: 'black' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Grid Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Layout de Cubículos
          </h2>
          {isAddingMode && (
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Modo agregar: Haz clic en un espacio vacío
            </div>
          )}
        </div>
        
        <GridLayout
          spaces={spaces}
          gridConfig={gridConfig}
          onSpaceClick={handleSpaceClick}
          onAddSpace={handleAddSpace}
          onEditSpace={handleEditSpace}
          onDeleteSpace={handleDeleteSpace}
          isAdmin={isAdmin}
          isAddingMode={isAddingMode}
        />
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Editar Espacio</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Disponible</option>
                  <option value="occupied">Ocupado</option>
                  <option value="reserved">Reservado</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="unavailable">No disponible</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.capacity || 1}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SpacesPage;