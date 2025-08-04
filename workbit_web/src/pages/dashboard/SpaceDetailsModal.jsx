import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Activity, 
  Users,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { devicesAPI } from '../../api/apiService';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SpaceDetailsModal = ({ space, onClose, onViewStats, onAdmin }) => {
  const [spaceData, setSpaceData] = useState(null);
  const [chartData, setChartData] = useState({
    temperature: [],
    humidity: [],
    co2: [],
    labels: []
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (space) {
      fetchSpaceData();
      fetchChartData();
      fetchActivityLogs();
    }
  }, [space]);

  const fetchSpaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await devicesAPI.getBySpace(space.id);
      setSpaceData(response.data);
    } catch (error) {
      console.error('Error fetching space data:', error);
      setError('Error al cargar los datos del espacio');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await devicesAPI.getSpaceReadings(space.id, '24h');
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

  const fetchActivityLogs = async () => {
    try {
      const response = await devicesAPI.getSpaceActivity(space.id, 10);
      setActivityLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'access':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'movement':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'occupancy':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Thermometer className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType) {
      case 'access':
        return 'bg-blue-50 border-blue-200';
      case 'movement':
        return 'bg-green-50 border-green-200';
      case 'occupancy':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
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
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{space.name}</h2>
              <p className="text-sm text-gray-600">Vista detallada del espacio</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
                            <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAdmin(space)}
                >
                  Administrar
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
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchSpaceData} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Sensor Cards - Horizontal Layout */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Temperature Card */}
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Thermometer className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Temperatura</p>
                      {spaceData?.statistics?.latest_temperature ? (
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {spaceData.statistics.latest_temperature.value.toFixed(1)} {spaceData.statistics.latest_temperature.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(spaceData.statistics.latest_temperature.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Sin datos</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Humidity Card */}
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Humedad</p>
                      {spaceData?.statistics?.latest_humidity ? (
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {spaceData.statistics.latest_humidity.value.toFixed(1)} {spaceData.statistics.latest_humidity.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(spaceData.statistics.latest_humidity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Sin datos</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* CO2 Card */}
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">CO2</p>
                      {spaceData?.statistics?.latest_co2 ? (
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {spaceData.statistics.latest_co2.value.toFixed(0)} {spaceData.statistics.latest_co2.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(spaceData.statistics.latest_co2.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Sin datos</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* People Count Card */}
                <Card className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">Personas</p>
                      <p className="text-lg font-bold text-gray-900">
                        {spaceData?.statistics?.people_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">En el cubiculo</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts - Vertical Layout */}
              <div className="space-y-6">
                {/* Temperature Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperatura</h3>
                  {chartData.temperature.length > 0 ? (
                    <Line 
                      data={{
                        labels: chartData.labels,
                        datasets: [{
                          label: 'Temperatura (°C)',
                          data: chartData.temperature,
                          borderColor: 'rgb(239, 68, 68)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          tension: 0.4,
                        }]
                      }} 
                      options={chartOptions} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      <div className="text-center">
                        <Thermometer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay datos de temperatura disponibles</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Humidity Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Humedad</h3>
                  {chartData.humidity.length > 0 ? (
                    <Line 
                      data={{
                        labels: chartData.labels,
                        datasets: [{
                          label: 'Humedad (%)',
                          data: chartData.humidity,
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                        }]
                      }} 
                      options={chartOptions} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      <div className="text-center">
                        <Droplets className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay datos de humedad disponibles</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* CO2 Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nivel de CO2</h3>
                  {chartData.co2.length > 0 ? (
                    <Line 
                      data={{
                        labels: chartData.labels,
                        datasets: [{
                          label: 'CO2 (ppm)',
                          data: chartData.co2,
                          borderColor: 'rgb(34, 197, 94)',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          tension: 0.4,
                        }]
                      }} 
                      options={chartOptions} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay datos de CO2 disponibles</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Activity Logs */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                {activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded border ${getActivityColor(log.activity_type)}`}>
                        <div className="flex items-center space-x-3">
                          {getActivityIcon(log.activity_type)}
                          <div>
                            <p className="font-medium text-sm">{log.description}</p>
                            <p className="text-xs text-gray-500">{log.device_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
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

export default SpaceDetailsModal; 