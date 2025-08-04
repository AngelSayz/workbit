import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CubiclesLayout from '../../components/CubiclesLayout';
import SpaceDetailsModal from './SpaceDetailsModal';
import SpaceStatsModal from './SpaceStatsModal';
import SpaceAdminModal from './SpaceAdminModal';

const SpacesPage = () => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showSpaceDetails, setShowSpaceDetails] = useState(false);
  const [showSpaceStats, setShowSpaceStats] = useState(false);
  const [showSpaceAdmin, setShowSpaceAdmin] = useState(false);

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
    setShowSpaceDetails(true);
  };

  const handleViewStats = (space) => {
    setSelectedSpace(space);
    setShowSpaceDetails(false);
    setShowSpaceStats(true);
  };

  const handleAdmin = (space) => {
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

  const handleUpdateSpace = (updatedSpace) => {
    // Aquí se actualizaría el espacio en la base de datos
    console.log('Actualizando espacio:', updatedSpace);
    // TODO: Implementar actualización en la API
  };

  const handleRelocateSpace = (spaceId, newX, newY) => {
    // Aquí se actualizaría la posición del espacio en la base de datos
    console.log('Recolocando espacio:', spaceId, 'a posición:', newX, newY);
    // TODO: Implementar actualización de posición en la API
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