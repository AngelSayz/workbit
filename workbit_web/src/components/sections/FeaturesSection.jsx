import { motion } from 'framer-motion';
import { 
  Monitor, 
  Shield, 
  BarChart3, 
  Clock, 
  Users, 
  Smartphone 
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Monitoreo IoT",
      description: "Sensores inteligentes que monitorizan la ocupación y condiciones ambientales en tiempo real."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Acceso Seguro",
      description: "Control de acceso mediante tecnología RFID y autenticación digital avanzada."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analíticas Avanzadas",
      description: "Dashboard con métricas detalladas para optimizar el uso de espacios y recursos."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Gestión de Reservas",
      description: "Sistema completo de reservas con confirmación automática y gestión de horarios."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-usuario",
      description: "Gestión de diferentes tipos de usuarios con roles y permisos personalizables."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Multiplataforma",
      description: "Acceso desde web, móvil y dispositivos IoT para máxima flexibilidad."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Características
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnología avanzada para la gestión inteligente de espacios de trabajo
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="text-blue-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 