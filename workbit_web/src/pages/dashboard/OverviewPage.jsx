import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Users, 
  Building, 
  Wrench, 
  CheckCircle, 
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { dashboardAPI } from '../../api/apiService';

const OverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Error al cargar las estadísticas');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Reservas Completadas',
      value: stats?.total_completed_reservations || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Reservas Futuras',
      value: stats?.total_future_reservations || 0,
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Usuarios',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Técnicos',
      value: stats?.total_technicians || 0,
      icon: Wrench,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    },
    {
      title: 'Cubículos',
      value: stats?.total_spaces || 0,
      icon: Building,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    },
    {
      title: 'Tareas Pendientes',
      value: stats?.total_pending_tasks || 0,
      icon: BarChart3,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    }
  ];

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
            onClick={fetchStats}
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Vista general del sistema WorkBit</p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <span className="text-sm text-gray-500">Tiempo real</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/dashboard/spaces"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-900">Layout de Cubículos</span>
          </a>
          <a
            href="/dashboard/reservations"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-900">Gestionar Reservas</span>
          </a>
          <a
            href="/dashboard/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium text-gray-900">Gestionar Usuarios</span>
          </a>
          <a
            href="/dashboard/staff"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wrench className="w-5 h-5 text-orange-600 mr-3" />
            <span className="font-medium text-gray-900">Gestionar Staff</span>
          </a>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sistema actualizado</p>
              <p className="text-xs text-gray-500">Hace 5 minutos</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Nueva reserva creada</p>
              <p className="text-xs text-gray-500">Hace 15 minutos</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Tarea asignada</p>
              <p className="text-xs text-gray-500">Hace 1 hora</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewPage;