import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Thermometer,
  Shield,
  MapPin,
  Activity,
  Eye,
  Edit3
} from 'lucide-react';
import { devicesAPI } from '../../api/apiService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const DevicesPage = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await devicesAPI.getAll();
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await devicesAPI.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching device stats:', error);
    }
  };

  const handleStatusUpdate = async (deviceId, newStatus) => {
    try {
      await devicesAPI.updateStatus(deviceId, { status: newStatus });
      // Refresh devices list
      fetchDevices();
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
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

  const filteredDevices = devices.filter(device => {
    if (selectedType === 'all') return true;
    return device.type === selectedType;
  });

  const environmentalDevices = devices.filter(d => d.type === 'environmental');
  const accessControlDevices = devices.filter(d => d.type === 'access_control');

  const DeviceCard = ({ device }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getTypeIcon(device.type)}
            <div>
              <h3 className="font-semibold text-gray-900">{device.name}</h3>
              <p className="text-sm text-gray-500">{getTypeLabel(device.type)}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(device.status)}
              <span className="capitalize">{device.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{device.space_name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">ID:</span> {device.device_id}
          </div>
          {device.sensors && device.sensors.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Sensores:</span> {device.sensors.length}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Última actividad: {new Date(device.last_seen).toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDevice(device);
                setShowDetails(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDevice(device);
                // Aquí podrías abrir un modal para editar
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const StatusUpdateModal = ({ device, onClose }) => {
    const [selectedStatus, setSelectedStatus] = useState(device.status);
    const [notes, setNotes] = useState(device.notes || '');

    const handleUpdate = async () => {
      await handleStatusUpdate(device.device_id, selectedStatus);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Actualizar Estado</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="maintenance">En Mantenimiento</option>
                <option value="offline">Desconectado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Actualizar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const DeviceDetailsModal = ({ device, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Detalles del Dispositivo</h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-sm text-gray-900">{device.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="text-sm text-gray-900">{device.device_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-sm text-gray-900">{getTypeLabel(device.type)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                  {getStatusIcon(device.status)}
                  <span className="ml-1 capitalize">{device.status}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Espacio</label>
                <p className="text-sm text-gray-900">{device.space_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Última Actividad</label>
                <p className="text-sm text-gray-900">{new Date(device.last_seen).toLocaleString()}</p>
              </div>
            </div>

            {device.sensors && device.sensors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sensores</label>
                <div className="grid grid-cols-2 gap-2">
                  {device.sensors.map((sensor, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium">{sensor.name}</p>
                      <p className="text-xs text-gray-600">{sensor.type}</p>
                      {sensor.unit && <p className="text-xs text-gray-500">Unidad: {sensor.unit}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {device.hardware_info && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Información de Hardware</label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Modelo:</span> {device.hardware_info.model || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Firmware:</span> {device.hardware_info.firmware_version || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">MAC:</span> {device.hardware_info.mac_address || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">IP:</span> {device.hardware_info.ip_address || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {device.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <p className="text-sm text-gray-900">{device.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispositivos IoT</h1>
          <p className="text-gray-600">Gestiona los dispositivos de monitoreo y control de acceso</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Thermometer className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ambiental</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_type?.environmental || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acceso</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_type?.access_control || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_status?.active || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Todos ({devices.length})
        </button>
        <button
          onClick={() => setSelectedType('environmental')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedType === 'environmental'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ambiental ({environmentalDevices.length})
        </button>
        <button
          onClick={() => setSelectedType('access_control')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedType === 'access_control'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Acceso ({accessControlDevices.length})
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.device_id} device={device} />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay dispositivos</h3>
          <p className="text-gray-600">
            {selectedType === 'all' 
              ? 'No se han registrado dispositivos aún.'
              : `No hay dispositivos de tipo "${getTypeLabel(selectedType)}" registrados.`
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showDetails && selectedDevice && (
        <DeviceDetailsModal 
          device={selectedDevice} 
          onClose={() => {
            setShowDetails(false);
            setSelectedDevice(null);
          }} 
        />
      )}
    </div>
  );
};

export default DevicesPage; 