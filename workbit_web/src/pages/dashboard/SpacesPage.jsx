import React, { useState } from 'react';
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
      console.log('Actualizando espacio:', updatedSpace);
      
      // Preparar datos para actualización
      const updateData = {};
      if (updatedSpace.capacity !== undefined) updateData.capacity = updatedSpace.capacity;
      if (updatedSpace.status !== undefined) updateData.status = updatedSpace.status;
      if (updatedSpace.name !== undefined) updateData.name = updatedSpace.name;
      
      const response = await spacesAPI.updateSpaceAdmin(updatedSpace.id, updateData);
      
      if (response.success) {
        console.log('Espacio actualizado exitosamente:', response.space);
        // Aquí podrías actualizar el estado local si es necesario
        // Por ahora, el grid se recargará automáticamente
      }
    } catch (error) {
      console.error('Error al actualizar espacio:', error);
      // Aquí podrías mostrar una notificación de error al usuario
    }
  };

  const handleRelocateSpace = async (spaceId, newX, newY) => {
    try {
      console.log('Recolocando espacio:', spaceId, 'a posición:', newX, newY);
      
      const response = await spacesAPI.relocateSpace(spaceId, newX, newY);
      
      if (response.success) {
        console.log('Espacio recolocado exitosamente:', response.space);
        // Aquí podrías actualizar el estado local si es necesario
        // Por ahora, el grid se recargará automáticamente
      }
    } catch (error) {
      console.error('Error al recolocar espacio:', error);
      // Aquí podrías mostrar una notificación de error al usuario
      if (error.response?.status === 409) {
        alert('Ya existe un espacio en esa posición. Por favor, selecciona otra posición.');
      }
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
          <CubiclesLayout onSpaceClick={handleSpaceClick} />
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
        />
      )}
    </div>
  );
};

export default SpacesPage;