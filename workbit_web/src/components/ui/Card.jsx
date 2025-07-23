import { motion } from 'framer-motion';
import { cn, getStatusColor } from '../../lib/utils';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  padding = 'p-6',
  ...props 
}) => {
  const baseClasses = `
    bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200
    ${hoverable ? 'hover:shadow-md hover:border-gray-300' : ''}
    ${padding}
  `;

  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(baseClasses, className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(baseClasses, className)} {...props}>
      {children}
    </div>
  );
};

// Componente especializado para espacios
export const SpaceCard = ({ space, onStatusChange, ...props }) => {
  return (
    <Card
      hoverable
      className="transition-all duration-200 hover:shadow-lg"
      {...props}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {space.name || `Espacio ${space.id}`}
          </h3>
          <p className="text-sm text-gray-600">
            {space.description || 'Cubículo de trabajo'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(space.status, 'space')}`}>
          {space.status || 'Disponible'}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {space.capacity && (
          <p>Capacidad: {space.capacity} personas</p>
        )}
        {space.equipment && (
          <p>Equipamiento: {space.equipment}</p>
        )}
      </div>
      
      {onStatusChange && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onStatusChange(space.id, 'available')}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Disponible
          </button>
          <button
            onClick={() => onStatusChange(space.id, 'occupied')}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Ocupado
          </button>
          <button
            onClick={() => onStatusChange(space.id, 'maintenance')}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            Mantenimiento
          </button>
        </div>
      )}
    </Card>
  );
};

// Componente especializado para reservas
export const ReservationCard = ({ reservation, onStatusChange, ...props }) => {
  return (
    <Card hoverable {...props}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {reservation.spaceName || `Espacio ${reservation.spaceId}`}
          </h3>
          <p className="text-sm text-gray-600">
            {reservation.userName || 'Usuario'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status, 'reservation')}`}>
          {reservation.status || 'Pendiente'}
        </span>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p>Fecha: {reservation.date}</p>
        <p>Hora: {reservation.startTime} - {reservation.endTime}</p>
        {reservation.purpose && (
          <p>Propósito: {reservation.purpose}</p>
        )}
      </div>
      
      {onStatusChange && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onStatusChange(reservation.id, 'active')}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={() => onStatusChange(reservation.id, 'cancelled')}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </Card>
  );
};

export default Card; 