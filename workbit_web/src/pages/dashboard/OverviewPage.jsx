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
    <div className="w-full h-full p-6 space-y-6">
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Funcionalidades en Desarrollo
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Estamos trabajando en implementar todas las funcionalidades del dashboard. 
            Pronto tendrás acceso completo a la gestión de espacios, reservas y usuarios.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Próximamente</span>
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              <span>En desarrollo</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewPage; 