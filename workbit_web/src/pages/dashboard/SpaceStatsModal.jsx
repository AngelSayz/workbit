import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Thermometer, 
  Shield, 
  Activity, 
  MapPin, 
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import { devicesAPI } from '../../api/apiService';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SpaceStatsModal = ({ space, onClose }) => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [chartData, setChartData] = useState({
    temperature: [],
    humidity: [],
    co2: [],
    labels: []
  });

  useEffect(() => {
    if (space) {
      fetchSpaceDevices();
      fetchChartData();
    }
  }, [space, timeRange]);

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

  const fetchChartData = async () => {
    try {
      const response = await devicesAPI.getSpaceReadings(space.id, timeRange);
      setChartData(response.data || {
        temperature: [],
        humidity: [],
        co2: [],
        labels: []
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData({
        temperature: [],
        humidity: [],
        co2: [],
        labels: []
      });
    }
  };

  // Usar solo datos reales
  const { labels, temperatureData, humidityData, co2Data } = {
    labels: chartData.labels,
    temperatureData: chartData.temperature,
    humidityData: chartData.humidity,
    co2Data: chartData.co2
  };

  const temperatureChartData = {
    labels,
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: temperatureData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const humidityChartData = {
    labels,
    datasets: [
      {
        label: 'Humedad (%)',
        data: humidityData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const co2ChartData = {
    labels,
    datasets: [
      {
        label: 'CO2 (ppm)',
        data: co2Data,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const deviceTypeData = {
    labels: ['Monitoreo Ambiental', 'Control de Acceso'],
    datasets: [
      {
        data: [stats.environmental_devices || 0, stats.access_control_devices || 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const deviceStatusData = {
    labels: ['Activos', 'Inactivos', 'Mantenimiento', 'Offline'],
    datasets: [
      {
        data: [
          stats.active_devices || 0,
          stats.inactive_devices || 0,
          stats.maintenance_devices || 0,
          stats.offline_devices || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(156, 163, 175, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (!space) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Estadísticas - {space.name}</h2>
              <p className="text-sm text-gray-600">Análisis detallado de dispositivos y sensores</p>
            </div>
          </div>
                      <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
              {chartData.labels.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  📊 Datos Disponibles
                </span>
              )}
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
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchSpaceDevices} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Total Dispositivos</p>
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
                      <p className="text-xs font-medium text-gray-600">Control Acceso</p>
                      <p className="text-lg font-bold text-gray-900">{stats.access_control_devices || 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Activos</p>
                      <p className="text-lg font-bold text-gray-900">{stats.active_devices || 0}</p>
                    </div>
                  </div>
                </Card>
              </div>

                             {/* Charts Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Temperature Chart */}
                 <Card className="p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperatura</h3>
                   {temperatureData.length > 0 ? (
                     <Line data={temperatureChartData} options={chartOptions} />
                   ) : (
                     <div className="flex items-center justify-center h-48 text-gray-500">
                       <div className="text-center">
                         <Thermometer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                         <p>No hay datos de temperatura disponibles</p>
                         <p className="text-sm">Los dispositivos no han enviado lecturas recientes</p>
                       </div>
                     </div>
                   )}
                 </Card>

                 {/* Humidity Chart */}
                 <Card className="p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Humedad</h3>
                   {humidityData.length > 0 ? (
                     <Line data={humidityChartData} options={chartOptions} />
                   ) : (
                     <div className="flex items-center justify-center h-48 text-gray-500">
                       <div className="text-center">
                         <Thermometer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                         <p>No hay datos de humedad disponibles</p>
                         <p className="text-sm">Los dispositivos no han enviado lecturas recientes</p>
                       </div>
                     </div>
                   )}
                 </Card>

                 {/* CO2 Chart */}
                 <Card className="p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Nivel de CO2</h3>
                   {co2Data.length > 0 ? (
                     <Line data={co2ChartData} options={chartOptions} />
                   ) : (
                     <div className="flex items-center justify-center h-48 text-gray-500">
                       <div className="text-center">
                         <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                         <p>No hay datos de CO2 disponibles</p>
                         <p className="text-sm">Los dispositivos no han enviado lecturas recientes</p>
                       </div>
                     </div>
                   )}
                 </Card>

                 {/* Device Types Chart */}
                 <Card className="p-4">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Dispositivos</h3>
                   {(stats.environmental_devices > 0 || stats.access_control_devices > 0) ? (
                     <Doughnut data={deviceTypeData} options={chartOptions} />
                   ) : (
                     <div className="flex items-center justify-center h-48 text-gray-500">
                       <div className="text-center">
                         <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                         <p>No hay dispositivos registrados</p>
                         <p className="text-sm">Registra dispositivos para ver estadísticas</p>
                       </div>
                     </div>
                   )}
                 </Card>
               </div>

                             {/* Device Status Chart */}
               <Card className="p-4">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Dispositivos</h3>
                 <div className="w-full max-w-2xl mx-auto">
                   {stats.total_devices > 0 ? (
                     <Bar data={deviceStatusData} options={chartOptions} />
                   ) : (
                     <div className="flex items-center justify-center h-48 text-gray-500">
                       <div className="text-center">
                         <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                         <p>No hay dispositivos registrados</p>
                         <p className="text-sm">Registra dispositivos para ver estadísticas de estado</p>
                       </div>
                     </div>
                   )}
                 </div>
               </Card>

                             {/* Recent Activity */}
               <Card className="p-4">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                 {devices.length > 0 ? (
                   <div className="space-y-3">
                     {devices.slice(0, 5).map((device) => (
                       <div key={device.device_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                         <div className="flex items-center space-x-3">
                           {device.type === 'environmental' ? (
                             <Thermometer className="w-4 h-4 text-blue-500" />
                           ) : (
                             <Shield className="w-4 h-4 text-purple-500" />
                           )}
                           <div>
                             <p className="font-medium text-sm">{device.name}</p>
                             <p className="text-xs text-gray-500">{device.device_id}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium">{device.status}</p>
                           <p className="text-xs text-gray-500">
                             {new Date(device.last_seen).toLocaleString()}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-32 text-gray-500">
                     <div className="text-center">
                       <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                       <p>No hay actividad reciente</p>
                       <p className="text-sm">Los dispositivos no han reportado actividad</p>
                     </div>
                   </div>
                 )}
               </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SpaceStatsModal; 