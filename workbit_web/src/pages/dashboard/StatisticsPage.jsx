import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Users, 
  Building, 
  Calendar,
  RefreshCw
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
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

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
  Filler
);

const StatisticsPage = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getCharts();
      if (response.success) {
        setChartData(response.data);
      } else {
        setError('Error al cargar los datos de gráficos');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Error al cargar los datos de gráficos');
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
            onClick={fetchChartData}
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
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-2">Análisis detallado del sistema WorkBit</p>
        </div>
        <button
          onClick={fetchChartData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservations by Status - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Reservas por Estado</h2>
          </div>
          {chartData?.reservations_by_status && chartData.reservations_by_status.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: chartData.reservations_by_status.map(item => 
                    item.status === 'pending' ? 'Pendiente' :
                    item.status === 'confirmed' ? 'Confirmada' :
                    item.status === 'cancelled' ? 'Cancelada' : item.status
                  ),
                  datasets: [{
                    data: chartData.reservations_by_status.map(item => item.count),
                    backgroundColor: chartData.reservations_by_status.map(item => getStatusColor(item.status)),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
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

        {/* Spaces by Status - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Espacios por Estado</h2>
          </div>
          {chartData?.spaces_by_status && chartData.spaces_by_status.length > 0 ? (
            <div className="h-64">
              <Bar
                data={{
                  labels: chartData.spaces_by_status.map(item => 
                    item.status === 'available' ? 'Disponible' :
                    item.status === 'unavailable' ? 'No disponible' :
                    item.status === 'occupied' ? 'Ocupado' :
                    item.status === 'reserved' ? 'Reservado' :
                    item.status === 'maintenance' ? 'Mantenimiento' : item.status
                  ),
                  datasets: [{
                    label: 'Cantidad',
                    data: chartData.spaces_by_status.map(item => item.count),
                    backgroundColor: chartData.spaces_by_status.map(item => getStatusColor(item.status)),
                    borderColor: chartData.spaces_by_status.map(item => getStatusColor(item.status)),
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
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
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

        {/* Users by Role - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Usuarios por Rol</h2>
          </div>
          {chartData?.users_by_role && chartData.users_by_role.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: chartData.users_by_role.map(item => 
                    item.role === 'admin' ? 'Administrador' :
                    item.role === 'technician' ? 'Técnico' :
                    item.role === 'user' ? 'Usuario' : item.role
                  ),
                  datasets: [{
                    data: chartData.users_by_role.map(item => item.count),
                    backgroundColor: chartData.users_by_role.map(item => getRoleColor(item.role)),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
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

        {/* Reservations by Month - Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Reservas por Mes</h2>
          </div>
          {chartData?.reservations_by_month && chartData.reservations_by_month.length > 0 ? (
            <div className="h-64">
              <Line
                data={{
                  labels: chartData.reservations_by_month.map(item => {
                    const [year, month] = item.month.split('-');
                    const monthNames = [
                      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
                    ];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  }),
                  datasets: [{
                    label: 'Reservas',
                    data: chartData.reservations_by_month.map(item => item.count),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
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
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {chartData?.reservations_by_status && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Reservas</h3>
            <p className="text-3xl font-bold text-blue-600">
              {chartData.reservations_by_status.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        )}
        
        {chartData?.spaces_by_status && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Espacios</h3>
            <p className="text-3xl font-bold text-green-600">
              {chartData.spaces_by_status.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        )}
        
        {chartData?.users_by_role && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Usuarios</h3>
            <p className="text-3xl font-bold text-purple-600">
              {chartData.users_by_role.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        )}
        
        {chartData?.reservations_by_month && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Promedio Mensual</h3>
            <p className="text-3xl font-bold text-orange-600">
              {Math.round(chartData.reservations_by_month.reduce((sum, item) => sum + item.count, 0) / chartData.reservations_by_month.length)}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StatisticsPage; 