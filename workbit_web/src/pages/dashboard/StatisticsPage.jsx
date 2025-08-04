import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Building, 
  Calendar,
  RefreshCw,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Award,
  Server,
  Timer,
  ChevronDown
} from 'lucide-react';
import { dashboardAPI } from '../../api/apiService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Bar, Pie, Line, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

const StatisticsPage = () => {
  const [advancedStats, setAdvancedStats] = useState(null);
  const [basicCharts, setBasicCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeSection, setActiveSection] = useState('overview');
  const { t } = useTranslation();

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both basic charts and advanced statistics
      const [chartsResponse, advancedResponse] = await Promise.all([
        dashboardAPI.getCharts(),
        dashboardAPI.getAdvancedStatistics({ period: selectedPeriod })
      ]);

      if (chartsResponse.success) {
        setBasicCharts(chartsResponse.data);
      }

      if (advancedResponse.success) {
        setAdvancedStats(advancedResponse.data);
      }

      if (!chartsResponse.success && !advancedResponse.success) {
        setError('Error al cargar los datos de estadísticas');
      }
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError('Error al cargar los datos de estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#10b981',
      'cancelled': '#ef4444',
      'available': '#10b981',
      'unavailable': '#ef4444',
      'occupied': '#3b82f6',
      'reserved': '#8b5cf6',
      'maintenance': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': '#ef4444',
      'technician': '#f59e0b',
      'user': '#3b82f6'
    };
    return colors[role] || '#6b7280';
  };

  // Helper functions for chart colors and formatting
  const getHealthScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 70) return '#F59E0B'; // Yellow
    if (score >= 50) return '#EF4444'; // Red
    return '#DC2626'; // Dark red
  };

  const formatHours = (hours) => {
    return `${Math.round(hours * 10) / 10}h`;
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 10) / 10}%`;
  };

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
            onClick={fetchAllData}
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
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas Avanzadas</h1>
          <p className="text-gray-600 mt-2">Análisis completo y métricas de rendimiento del sistema WorkBit</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={fetchAllData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* System Health Overview */}
      {advancedStats?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Puntuación de Salud</h3>
                <p className="text-2xl font-bold mt-1" style={{ color: getHealthScoreColor(advancedStats.summary.system_health_score) }}>
                  {advancedStats.summary.system_health_score}/100
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Horas Totales Usadas</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatHours(advancedStats.summary.total_hours_used)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tasa de Ocupación</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatPercentage(advancedStats.summary.average_occupancy_rate)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Reservas</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {advancedStats.summary.total_reservations}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Space Efficiency Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Award className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Eficiencia de Espacios</h2>
          </div>
          {advancedStats?.space_analytics?.space_efficiency && advancedStats.space_analytics.space_efficiency.length > 0 ? (
            <div className="h-64">
              <Bar
                data={{
                  labels: advancedStats.space_analytics.space_efficiency.slice(0, 8).map(space => space.space_name),
                  datasets: [{
                    label: 'Puntuación de Eficiencia',
                    data: advancedStats.space_analytics.space_efficiency.slice(0, 8).map(space => space.efficiency_score),
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </motion.div>

        {/* Peak Hours Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Horas Pico de Uso</h2>
          </div>
          {advancedStats?.space_analytics?.peak_hours && advancedStats.space_analytics.peak_hours.length > 0 ? (
            <div className="h-64">
              <Line
                data={{
                  labels: advancedStats.space_analytics.peak_hours.map(hour => `${hour._id}:00`),
                  datasets: [{
                    label: 'Uso Total',
                    data: advancedStats.space_analytics.peak_hours.map(hour => hour.total_usage),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </motion.div>

        {/* Top Users Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Usuarios Más Activos</h2>
          </div>
          {advancedStats?.user_behavior?.top_users && advancedStats.user_behavior.top_users.length > 0 ? (
            <div className="h-64">
              <Doughnut
                data={{
                  labels: advancedStats.user_behavior.top_users.slice(0, 6).map(user => user.username),
                  datasets: [{
                    data: advancedStats.user_behavior.top_users.slice(0, 6).map(user => user.total_hours),
                    backgroundColor: [
                      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </motion.div>

        {/* System Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Server className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Rendimiento del Sistema</h2>
          </div>
          {advancedStats?.system_performance?.summary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo de Respuesta Promedio</span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round(advancedStats.system_performance.summary.avg_response_time || 0)}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Requests API Totales</span>
                <span className="text-sm font-medium text-green-600">
                  {(advancedStats.system_performance.summary.total_api_requests || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mensajes MQTT</span>
                <span className="text-sm font-medium text-purple-600">
                  {(advancedStats.system_performance.summary.total_mqtt_messages || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-green-600">
                  {advancedStats.system_performance.uptime_percentage}%
                </span>
              </div>
              {/* Performance Score Circle */}
              <div className="mt-6 flex justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke={getHealthScoreColor(advancedStats.summary?.system_health_score || 0)}
                      strokeWidth="8" 
                      fill="none"
                      strokeDasharray={`${(advancedStats.summary?.system_health_score || 0) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {advancedStats.summary?.system_health_score || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </motion.div>
      </div>

      {/* Reservation Trends */}
      {advancedStats?.reservation_trends?.daily_data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Tendencias de Reservas</h2>
          </div>
          <div className="h-64">
            <Line
              data={{
                labels: advancedStats.reservation_trends.daily_data.map(day => 
                  new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                  {
                    label: 'Total Reservas',
                    data: advancedStats.reservation_trends.daily_data.map(day => day.reservations),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Confirmadas',
                    data: advancedStats.reservation_trends.daily_data.map(day => day.confirmed),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                  },
                  {
                    label: 'Canceladas',
                    data: advancedStats.reservation_trends.daily_data.map(day => day.cancelled),
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </motion.div>
      )}

      {/* API Performance Table */}
      {advancedStats?.system_performance?.api_performance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Zap className="w-5 h-5 text-yellow-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Rendimiento de API</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo Promedio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa de Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advancedStats.system_performance.api_performance.slice(0, 8).map((endpoint, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endpoint.total_requests.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(endpoint.avg_response_time)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endpoint.error_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (endpoint.error_count / endpoint.total_requests * 100) > 5 
                          ? 'bg-red-100 text-red-800' 
                          : (endpoint.error_count / endpoint.total_requests * 100) > 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {((endpoint.error_count / endpoint.total_requests) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StatisticsPage;