import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Settings, 
  MapPin,
  Thermometer,
  Droplets,
  Activity,
  Wifi,
  Cpu,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';

const SpaceAdminModal = ({ space, onClose, onRelocate, onUpdateSpace, isLoading = false }) => {
  console.log('SpaceAdminModal - Received space:', space);
  console.log('SpaceAdminModal - Space ID:', space?.id);
  console.log('SpaceAdminModal - Space capacity:', space?.capacity);
  console.log('SpaceAdminModal - Space status:', space?.status);
  
  const [capacity, setCapacity] = useState(space?.capacity || 2);
  const [status, setStatus] = useState(space?.status || 'available');
  const [showRelocateGrid, setShowRelocateGrid] = useState(false);

  const statusOptions = [
    { value: 'available', label: 'Disponible', color: 'bg-green-500' },
    { value: 'occupied', label: 'Ocupado', color: 'bg-red-500' },
    { value: 'reserved', label: 'Reservado', color: 'bg-yellow-500' },
    { value: 'maintenance', label: 'Mantenimiento', color: 'bg-purple-500' },
    { value: 'unavailable', label: 'No disponible', color: 'bg-gray-500' }
  ];

  const handleSave = () => {
    if (onUpdateSpace && space && space.id) {
      console.log('Guardando cambios para espacio:', space.id, { capacity, status });
      onUpdateSpace({
        ...space,
        capacity: capacity,
        status: status
      });
    } else {
      console.error('Error: space o space.id es undefined', { space });
    }
  };

  const handleRelocate = () => {
    if (!space || !space.id) {
      console.error('Error: No se puede recolocar - space.id es undefined', { space });
      return;
    }
    setShowRelocateGrid(true);
  };

  const handleGridClick = (x, y) => {
    if (onRelocate && space && space.id) {
      console.log('Recolocando espacio:', space.id, 'a posición:', x, y);
      onRelocate(space.id, x, y);
    } else {
      console.error('Error: No se puede recolocar - datos inválidos', { space, x, y });
    }
    setShowRelocateGrid(false);
  };

  if (showRelocateGrid) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recolocar {space.name}</h2>
                <p className="text-sm text-gray-600">Haz clic en la posición donde quieres mover el cubículo</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRelocateGrid(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Grid */}
          <div className="p-6">
            <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
              {Array.from({ length: 40 }, (_, i) => {
                const x = i % 8;
                const y = Math.floor(i / 8);
                return (
                  <button
                    key={i}
                    onClick={() => handleGridClick(x, y)}
                    disabled={isLoading}
                    className="w-12 h-12 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {space.position_x === x && space.position_y === y ? (
                      <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Administrar {space.name}</h2>
              <p className="text-sm text-gray-600">Configuración del cubículo</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Capacity */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Capacidad de personas</h3>
                  <p className="text-sm text-gray-600">Número máximo de personas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCapacity(Math.max(1, capacity - 1))}
                  disabled={capacity <= 1 || isLoading}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{capacity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCapacity(capacity + 1)}
                  disabled={capacity >= 10 || isLoading}
                >
                  +
                </Button>
              </div>
            </div>
          </Card>

          {/* Status */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Estado del cubículo</h3>
                  <p className="text-sm text-gray-600">Estado actual del espacio</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      status === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Connected Sensors */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Sensores conectados</h3>
                  <p className="text-sm text-gray-600">Dispositivos IoT activos</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span>Sensor de temperatura</span>
                  <span className="text-green-600">✓ Conectado</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Sensor de humedad</span>
                  <span className="text-green-600">✓ Conectado</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <span>Sensor de CO2</span>
                  <span className="text-green-600">✓ Conectado</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Relocate Section */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Recolocar cubículo</h3>
                  <p className="text-sm text-gray-600">Cambiar la posición en el grid</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRelocate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Seleccionar nueva posición
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpaceAdminModal; 