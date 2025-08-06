import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { reservationsAPI } from '../../api/apiService';
import { useNotification } from '../../hooks';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingReservation, setProcessingReservation] = useState(null);
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getReservations();
      if (response.reservations) {
        setReservations(response.reservations);
      } else {
        setError('Error al cargar las reservas');
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationAction = async (reservationId, action) => {
    try {
      setProcessingReservation(reservationId);
      
      await reservationsAPI.updateReservationStatus(reservationId, action);
      
      // Actualizar la lista de reservas
      await fetchReservations();
      
      const actionText = action === 'confirmed' ? 'confirmada' : 'cancelada';
      showSuccess(`Reserva ${actionText} exitosamente`);
      
    } catch (error) {
      console.error('Error updating reservation:', error);
      showError(`Error al ${action === 'confirmed' ? 'confirmar' : 'cancelar'} la reserva`);
    } finally {
      setProcessingReservation(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'cancelled': 'Cancelada'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.spaces?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${reservation.users?.name} ${reservation.users?.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReservations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
          <p className="text-gray-600 mt-2">Administrar todas las reservas del sistema</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Reserva
        </button>
      </motion.div>

      {/* Reservas Pendientes Section */}
      {reservations.filter(r => r.status === 'pending').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Reservas Pendientes de Confirmación
            </h2>
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              {reservations.filter(r => r.status === 'pending').length}
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Las siguientes reservas requieren confirmación manual. Se auto-confirmarán en 5 minutos si no se toma acción.
          </p>
          
          <div className="grid gap-4">
            {reservations
              .filter(r => r.status === 'pending')
              .slice(0, 5) // Mostrar máximo 5 reservas pendientes
              .map((reservation) => (
                <div key={reservation.id} className="bg-white rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{reservation.reason}</h3>
                          <p className="text-sm text-gray-600">
                            {reservation.space?.name || 'Espacio no especificado'} • 
                            {reservation.owner?.name} {reservation.owner?.lastname}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{new Date(reservation.start_time).toLocaleDateString()}</p>
                          <p>{new Date(reservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleReservationAction(reservation.id, 'confirmed')}
                        disabled={processingReservation === reservation.id}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {processingReservation === reservation.id ? 'Confirmando...' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => handleReservationAction(reservation.id, 'cancelled')}
                        disabled={processingReservation === reservation.id}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {processingReservation === reservation.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {reservations.filter(r => r.status === 'pending').length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Y {reservations.filter(r => r.status === 'pending').length - 5} más...
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por motivo, espacio o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Reservations List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Espacio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.reason}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {reservation.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.spaces?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Capacidad: {reservation.spaces?.capacity || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.users?.name} {reservation.users?.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{reservation.users?.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(reservation.start_time)}
                          </div>
                          <div className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDate(reservation.end_time)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="Ver detalles">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {reservation.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleReservationAction(reservation.id, 'confirmed')}
                              disabled={processingReservation === reservation.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Confirmar reserva"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReservationAction(reservation.id, 'cancelled')}
                              disabled={processingReservation === reservation.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Cancelar reserva"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {reservation.status !== 'pending' && (
                          <>
                            <button className="text-green-600 hover:text-green-900" title="Editar">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No se encontraron reservas</p>
                    <p className="text-sm">No hay reservas que coincidan con los filtros aplicados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {reservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-2xl font-bold text-gray-900">
                {reservations.filter(r => r.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReservationsPage; 