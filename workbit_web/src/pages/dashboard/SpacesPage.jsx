import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import CubiclesLayout from '../../components/CubiclesLayout';
import SpaceDetailsModal from './SpaceDetailsModal';
import SpaceStatsModal from './SpaceStatsModal';
import SpaceAdminModal from './SpaceAdminModal';
import { spacesAPI } from '../../api/apiService';

const SpacesPage = () => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showSpaceDetails, setShowSpaceDetails] = useState(false);
  const [showSpaceStats, setShowSpaceStats] = useState(false);
  const [showSpaceAdmin, setShowSpaceAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [spaces, setSpaces] = useState([]); // Estado local para los espacios

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para cargar espacios inicialmente
  const fetchSpaces = async () => {
    try {
      const response = await spacesAPI.getGridSpaces();
      if (response.success) {
        setSpaces(response.data.spaces || []);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  };

  // Cargar espacios al montar el componente
  useEffect(() => {
    fetchSpaces();
  }, []);

  // Función para actualizar el estado local de espacios
  const updateLocalSpace = (updatedSpace) => {
    setSpaces(prevSpaces => 
      prevSpaces.map(space => 
        space.id === updatedSpace.id ? updatedSpace : space
      )
    );
  };

  const handleSpaceClick = (space) => {
    console.log('SpacesPage - Space clicked:', space);
    setSelectedSpace(space);
    setShowSpaceDetails(true);
  };

  const handleViewStats = (space) => {
    setSelectedSpace(space);
    setShowSpaceDetails(false);
    setShowSpaceStats(true);
  };

  const handleAdmin = (space) => {
    console.log('SpacesPage - Admin clicked for space:', space);
    console.log('SpacesPage - Space ID:', space?.id);
    console.log('SpacesPage - Space capacity:', space?.capacity);
    console.log('SpacesPage - Space status:', space?.status);
    setSelectedSpace(space);
    setShowSpaceDetails(false);
    setShowSpaceAdmin(true);
  };

  const handleCloseModals = () => {
    setShowSpaceDetails(false);
    setShowSpaceStats(false);
    setShowSpaceAdmin(false);
    setSelectedSpace(null);
  };

  const handleUpdateSpace = async (updatedSpace) => {
    try {
      setIsLoading(true);
      console.log('Actualizando espacio:', updatedSpace);
      console.log('UpdatedSpace ID:', updatedSpace?.id);
      console.log('UpdatedSpace capacity:', updatedSpace?.capacity);
      console.log('UpdatedSpace status:', updatedSpace?.status);
      
      // Preparar datos para actualización
      const updateData = {};
      if (updatedSpace.capacity !== undefined) updateData.capacity = updatedSpace.capacity;
      if (updatedSpace.status !== undefined) updateData.status = updatedSpace.status;
      if (updatedSpace.name !== undefined) updateData.name = updatedSpace.name;
      
      console.log('Update data being sent:', updateData);
      const response = await spacesAPI.updateSpaceAdmin(updatedSpace.id, updateData);
      
      if (response.success) {
        console.log('Espacio actualizado exitosamente:', response.space);
        // Actualizar estado local
        updateLocalSpace(response.space);
        // Actualizar el espacio seleccionado si es el mismo
        if (selectedSpace && selectedSpace.id === updatedSpace.id) {
          setSelectedSpace(response.space);
        }
        showNotification('Espacio actualizado exitosamente');
        handleCloseModals();
      }
    } catch (error) {
      console.error('Error al actualizar espacio:', error);
      showNotification('Error al actualizar el espacio', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelocateSpace = async (spaceId, newX, newY) => {
    try {
      setIsLoading(true);
      console.log('Recolocando espacio:', spaceId, 'a posición:', newX, newY);
      console.log('SpaceId type:', typeof spaceId);
      console.log('NewX type:', typeof newX);
      console.log('NewY type:', typeof newY);
      
      const response = await spacesAPI.relocateSpace(spaceId, newX, newY);
      
      if (response.success) {
        console.log('Espacio recolocado exitosamente:', response.space);
        // Actualizar estado local
        updateLocalSpace(response.space);
        // Actualizar el espacio seleccionado si es el mismo
        if (selectedSpace && selectedSpace.id === spaceId) {
          setSelectedSpace(response.space);
        }
        showNotification('Espacio recolocado exitosamente');
        handleCloseModals();
      }
    } catch (error) {
      console.error('Error al recolocar espacio:', error);
      if (error.response?.status === 409) {
        showNotification('Ya existe un espacio en esa posición. Por favor, selecciona otra posición.', 'error');
      } else {
        showNotification('Error al recolocar el espacio', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        </div>
      </motion.div>

      {/* Notificación */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Layout Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6">
          <CubiclesLayout onSpaceClick={handleSpaceClick} externalSpaces={spaces} />
        </div>
      </motion.div>

      {/* Modals */}
      {showSpaceDetails && selectedSpace && (
        <SpaceDetailsModal
          space={selectedSpace}
          onClose={handleCloseModals}
          onViewStats={handleViewStats}
          onAdmin={handleAdmin}
        />
      )}

      {showSpaceStats && selectedSpace && (
        <SpaceStatsModal
          space={selectedSpace}
          onClose={handleCloseModals}
        />
      )}

      {showSpaceAdmin && selectedSpace && (
        <SpaceAdminModal
          space={selectedSpace}
          onClose={handleCloseModals}
          onUpdateSpace={handleUpdateSpace}
          onRelocate={handleRelocateSpace}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default SpacesPage;