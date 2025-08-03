import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Thermometer, 
  Shield, 
  Activity, 
  MapPin, 
  Clock,
  BarChart3,
  TrendingUp,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { devicesAPI } from '../../api/apiService';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';

const SpaceDetailsModal = ({ space, onClose, onViewStats }) => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (space) {
      fetchSpaceDevices();
    }
  }, [space]);

  const fetchSpaceDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await devicesAPI.getBySpace(space.id);
      setDevices(response.data.devices || []);
      setStats(response.data.statistics || {});
    } catch (error) {
      console.error('Error fetching space devices:', error);
      setError('Error al cargar los dispositivos del espacio');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'maintenance':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'environmental':
        return <Thermometer className="w-5 h-5 text-blue-500" />;
      case 'access_control':
        return <Shield className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'environmental':
        return 'Monitoreo Ambiental';
      case 'access_control':
        return 'Control de Acceso';
      default:
        return type;
    }
  };

  const DeviceCard = ({ device }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getTypeIcon(device.type)}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{device.name}</h4>
              <p className="text-xs text-gray-500">{getTypeLabel(device.type)}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(device.status)}
              <span className="capitalize">{device.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="text-xs text-gray-600">
            <span className="font-medium">ID:</span> {device.device_id}
          </div>
          
          {/* Latest Readings */}
          {device.latest_reading && device.latest_reading.readings && (
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs font-medium text-gray-700 mb-1">Últimas lecturas:</div>
              <div className="space-y-1">
                {device.latest_reading.readings.slice(0, 2).map((reading, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{reading.sensor_name}:</span>
                    <span className="font-medium">
                      {reading.value}{reading.unit ? ` ${reading.unit}` : ''}
                    </span>
                  </div>
                ))}
                {device.latest_reading.readings.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{device.latest_reading.readings.length - 2} más...
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(device.latest_reading.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Última actividad: {new Date(device.last_seen).toLocaleString()}
        </div>
      </Card>
    </motion.div>
  );

  if (!space) return null;

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
              <h2 className="text-xl font-bold text-gray-900">{space.name}</h2>
              <p className="text-sm text-gray-600">{space.description || 'Espacio de trabajo'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewStats(space)}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Ver Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchSpaceDevices} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">{stats.total_devices || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Thermometer className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Ambiental</p>
                      <p className="text-lg font-bold text-gray-900">{stats.environmental_devices || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Acceso</p>
                      <p className="text-lg font-bold text-gray-900">{stats.access_control_devices || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Activos</p>
                      <p className="text-lg font-bold text-gray-900">{stats.active_devices || 0}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Devices Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dispositivos ({devices.length})
                </h3>
                
                {devices.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No hay dispositivos</h4>
                    <p className="text-gray-600">
                      Este espacio no tiene dispositivos IoT registrados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map((device) => (
                      <DeviceCard key={device.device_id} device={device} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SpaceDetailsModal; 