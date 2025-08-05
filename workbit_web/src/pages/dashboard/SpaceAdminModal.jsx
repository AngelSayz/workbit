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
  Cpu
} from 'lucide-react';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';

const SpaceAdminModal = ({ space, onClose, onRelocate, onUpdateSpace, allSpaces = [] }) => {
  console.log('SpaceAdminModal - Received space:', space);
  console.log('SpaceAdminModal - All spaces:', allSpaces);
  const [capacity, setCapacity] = useState(space?.capacity || 2);
  const [status, setStatus] = useState(space?.status || 'available');
  const [showRelocateGrid, setShowRelocateGrid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRelocating, setIsRelocating] = useState(false);

  const statusOptions = [
    { value: 'available', label: 'Disponible', color: 'bg-green-500' },
    { value: 'occupied', label: 'Ocupado', color: 'bg-red-500' },
    { value: 'reserved', label: 'Reservado', color: 'bg-yellow-500' },
    { value: 'maintenance', label: 'Mantenimiento', color: 'bg-purple-500' },
    { value: 'unavailable', label: 'No disponible', color: 'bg-gray-500' }
  ];

  const handleSave = async () => {
    if (onUpdateSpace && space && space.id) {
      setIsSaving(true);
      console.log('Guardando cambios para espacio:', space.id, { capacity, status });
      try {
        await onUpdateSpace({
          ...space,
          capacity: capacity,
          status: status
        });
      } catch (error) {
        console.error('Error al guardar:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.error('Error: space o space.id es undefined', { space });
    }
    onClose();
  };

  const handleRelocate = () => {
    if (!space || !space.id) {
      console.error('Error: No se puede recolocar - space.id es undefined', { space });
      return;
    }
    setShowRelocateGrid(true);
  };

  const handleGridClick = async (x, y) => {
    if (onRelocate && space && space.id) {
      setIsRelocating(true);
      console.log('Recolocando espacio:', space.id, 'a posición:', x, y);
      try {
        await onRelocate(space.id, x, y);
      } catch (error) {
        console.error('Error al recolocar:', error);
      } finally {
        setIsRelocating(false);
      }
    } else {
      console.error('Error: No se puede recolocar - datos inválidos', { space, x, y });
    }
    setShowRelocateGrid(false);
    onClose();
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Grid */}
          <div className="p-6 relative">
            {isRelocating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">Recolocando...</span>
                </div>
              </div>
            )}
            
            {/* Leyenda */}
            <div className="mb-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-500"></div>
                <span className="text-gray-700">Cubículo actual</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded border-2 border-red-300"></div>
                <span className="text-gray-700">Ocupado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-50 rounded border-2 border-gray-300"></div>
                <span className="text-gray-700">Disponible</span>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
              {Array.from({ length: 40 }, (_, i) => {
                const x = i % 8;
                const y = Math.floor(i / 8);
                
                // Buscar si hay un espacio en esta posición
                const spaceAtPosition = allSpaces.find(s => s.position_x === x && s.position_y === y);
                const isCurrentSpace = space.position_x === x && space.position_y === y;
                const isOccupied = spaceAtPosition && !isCurrentSpace;
                
                return (
                  <button
                    key={i}
                    onClick={() => handleGridClick(x, y)}
                    disabled={isRelocating || isOccupied}
                    className={`w-12 h-12 border-2 rounded transition-colors relative ${
                      isOccupied 
                        ? 'border-red-300 bg-red-100 cursor-not-allowed opacity-60' 
                        : isCurrentSpace
                        ? 'border-blue-500 bg-blue-500 hover:border-blue-600'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    } ${isRelocating ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
                  >
                    {isCurrentSpace ? (
                      <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : isOccupied ? (
                      <div className="w-full h-full bg-red-100 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
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
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  disabled={capacity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{capacity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCapacity(capacity + 1)}
                  disabled={capacity >= 10}
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
                  <p className="text-sm text-gray-600">Estado actual</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      status === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
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
                <Cpu className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Sensores conectados</h3>
                  <p className="text-sm text-gray-600">Dispositivos activos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Temperatura</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Humedad</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm">CO2</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Presencia</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Relocate */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Recolocar cubículo</h3>
                  <p className="text-sm text-gray-600">Cambiar posición en el grid</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRelocate}
              >
                Seleccionar nueva posición
              </Button>
            </div>
          </Card>
        </div>

        {/* Fixed Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-end space-x-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SpaceAdminModal; 