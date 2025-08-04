import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allSpaces, setAllSpaces] = useState([]);

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

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchAllSpaces = async () => {
    try {
      const response = await spacesAPI.getGridSpaces();
      if (response.success) {
        setAllSpaces(response.data.spaces || []);
      }
    } catch (error) {
      console.error('Error fetching all spaces:', error);
    }
  };

  useEffect(() => {
    fetchAllSpaces();
  }, [refreshTrigger]);

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
        showNotification('Espacio actualizado exitosamente', 'success');
        // Forzar actualización del grid
        setRefreshTrigger(prev => prev + 1);
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
        showNotification('Espacio recolocado exitosamente', 'success');
        // Forzar actualización del grid
        setRefreshTrigger(prev => prev + 1);
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

      {/* Layout Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6">
          <CubiclesLayout onSpaceClick={handleSpaceClick} refreshTrigger={refreshTrigger} />
        </div>
      </motion.div>

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Procesando...</span>
          </div>
        </div>
      )}

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
          allSpaces={allSpaces}
        />
      )}
    </div>
  );
};

export default SpacesPage;