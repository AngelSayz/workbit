import { motion } from 'framer-motion';
import { 
  Construction, 
  Users, 
  Building, 
  Calendar,
  Activity,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const OverviewPage = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Espacios Totales',
      value: '24',
      icon: Building,
      color: 'blue'
    },
    {
      name: 'Usuarios Activos',
      value: '156',
      icon: Users,
      color: 'green'
    },
    {
      name: 'Reservas Hoy',
      value: '12',
      icon: Calendar,
      color: 'purple'
    },
    {
      name: 'Ocupación Actual',
      value: '68%',
      icon: Activity,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Principal
        </h1>
        <p className="text-gray-600">
          Vista general del sistema de gestión de espacios
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Working On It Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard en Desarrollo
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Estamos trabajando en las funcionalidades completas del dashboard. 
            Pronto tendrás acceso a métricas en tiempo real, análisis detallados 
            y herramientas de gestión avanzadas.
          </p>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Funcionalidades disponibles próximamente</span>
          </div>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              ¡Bienvenido, {user?.name}!
            </h3>
            <p className="text-blue-700">
              Has iniciado sesión como {user?.role}. Tu sesión está activa y segura.
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewPage; 