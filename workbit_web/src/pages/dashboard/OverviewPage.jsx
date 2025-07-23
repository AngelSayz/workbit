import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Activity, Plus } from 'lucide-react';
import { Button, SpaceCard, ReservationCard } from '../../components/ui';
import { spacesAPI, reservationsAPI } from '../../api/apiService';
import useAuth from '../../hooks/useAuth';

const OverviewPage = () => {
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin, isTechnician } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [spacesResponse, reservationsResponse] = await Promise.all([
        spacesAPI.getSpaces(),
        reservationsAPI.getReservations()
      ]);

      setSpaces(spacesResponse.data || spacesResponse || []);
      setReservations(reservationsResponse.data || reservationsResponse || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSpaceStatusChange = async (spaceId, newStatus) => {
    try {
      await spacesAPI.updateSpaceStatus(spaceId, newStatus);
      // Actualizar el estado local
      setSpaces(prev => prev.map(space => 
        space.id === spaceId ? { ...space, status: newStatus } : space
      ));
    } catch (error) {
      console.error('Error updating space status:', error);
      setError('Error al actualizar el estado del espacio');
    }
  };

  const handleReservationStatusChange = async (reservationId, newStatus) => {
    try {
      await reservationsAPI.updateReservationStatus(reservationId, newStatus);
      // Actualizar el estado local
      setReservations(prev => prev.map(reservation => 
        reservation.id === reservationId ? { ...reservation, status: newStatus } : reservation
      ));
    } catch (error) {
      console.error('Error updating reservation status:', error);
      setError('Error al actualizar el estado de la reserva');
    }
  };

  // Estadísticas calculadas
  const stats = {
    totalSpaces: spaces.length,
    availableSpaces: spaces.filter(s => s.status === 'available' || s.status === 'disponible').length,
    occupiedSpaces: spaces.filter(s => s.status === 'occupied' || s.status === 'ocupado').length,
    totalReservations: reservations.length,
    activeReservations: reservations.filter(r => r.status === 'active' || r.status === 'activa').length,
    pendingReservations: reservations.filter(r => r.status === 'pending' || r.status === 'pendiente').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.name || user?.firstName || 'Usuario'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Aquí tienes un resumen de la actividad de WorkBit
          </p>
        </div>
        
        {(isAdmin || isTechnician) && (
          <div className="flex space-x-3">
            <Button variant="outline" icon={<Plus size={20} />}>
              Nueva Reserva
            </Button>
            {isAdmin && (
              <Button variant="primary" icon={<Users size={20} />}>
                Gestionar Usuarios
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2"
        >
          <span className="text-red-600">{error}</span>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Espacios Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSpaces}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableSpaces}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reservas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeReservations}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Espacios Recientes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Espacios</h2>
            <Button variant="ghost" size="sm">Ver todos</Button>
          </div>
          
          <div className="space-y-4">
            {spaces.slice(0, 4).map((space, index) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
              >
                <SpaceCard 
                  space={space} 
                  onStatusChange={isAdmin || isTechnician ? handleSpaceStatusChange : null}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reservas Recientes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Reservas Recientes</h2>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
          
          <div className="space-y-4">
            {reservations.slice(0, 4).map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
              >
                <ReservationCard 
                  reservation={reservation} 
                  onStatusChange={isAdmin || isTechnician ? handleReservationStatusChange : null}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OverviewPage; 