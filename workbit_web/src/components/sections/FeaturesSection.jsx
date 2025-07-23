import { motion } from 'framer-motion';
import { 
  Wifi, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Clock,
  Users,
  MapPin,
  Bell
} from 'lucide-react';
import { Card } from '../ui';

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      icon: Wifi,
      title: 'Sensores IoT',
      description: 'Monitoreo en tiempo real de ocupación, temperatura, humedad y calidad del aire en cada espacio de trabajo.',
      color: 'blue'
    },
    {
      id: 2,
      icon: CreditCard,
      title: 'Tecnología RFID',
      description: 'Control de acceso seguro y seguimiento automático de entrada y salida de empleados.',
      color: 'green'
    },
    {
      id: 3,
      icon: BarChart3,
      title: 'Analytics Avanzado',
      description: 'Dashboards intuitivos con métricas detalladas sobre uso de espacios y patrones de ocupación.',
      color: 'purple'
    },
    {
      id: 4,
      icon: Shield,
      title: 'Seguridad Empresarial',
      description: 'Encriptación de extremo a extremo y cumplimiento con estándares de seguridad corporativa.',
      color: 'red'
    },
    {
      id: 5,
      icon: Smartphone,
      title: 'App Móvil',
      description: 'Aplicación nativa para iOS y Android con funcionalidades completas de reserva y gestión.',
      color: 'indigo'
    },
    {
      id: 6,
      icon: Clock,
      title: 'Gestión Inteligente',
      description: 'Algoritmos de IA para optimizar la asignación de espacios basada en patrones de uso históricos.',
      color: 'orange'
    },
    {
      id: 7,
      icon: Users,
      title: 'Colaboración',
      description: 'Herramientas integradas para facilitar la colaboración entre equipos y gestión de reuniones.',
      color: 'teal'
    },
    {
      id: 8,
      icon: MapPin,
      title: 'Mapas Interactivos',
      description: 'Visualización en tiempo real del estado de todos los espacios con mapas interactivos y navegación.',
      color: 'pink'
    },
    {
      id: 9,
      icon: Bell,
      title: 'Notificaciones Smart',
      description: 'Alertas personalizadas sobre disponibilidad, recordatorios de reservas y actualizaciones importantes.',
      color: 'yellow'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600',
      orange: 'from-orange-500 to-orange-600',
      teal: 'from-teal-500 to-teal-600',
      pink: 'from-pink-500 to-pink-600',
      yellow: 'from-yellow-500 to-yellow-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold tracking-wide uppercase mb-8"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Tecnología de vanguardia
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
            Características que{' '}
            <span className="text-blue-600">
              revolucionan
            </span>
            <br />
            tu espacio de trabajo
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
            Descubre cómo WorkBit integra las últimas tecnologías para crear 
            una experiencia de gestión de espacios completamente nueva.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const gradientClass = getColorClasses(feature.color);
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card 
                  hoverable
                  className="h-full p-8 border border-gray-200 bg-white hover:border-gray-300 transition-all duration-500 hover:shadow-2xl group"
                >
                  {/* Icon */}
                  <div className="relative mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${gradientClass} rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={28} />
                    </div>
                    
                    {/* Glow effect */}
                    <div className={`absolute inset-0 w-16 h-16 bg-gradient-to-r ${gradientClass} rounded-2xl opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover indicator */}
                  <motion.div
                    className="mt-8 flex items-center text-sm font-semibold text-gray-400 group-hover:text-blue-600 transition-colors"
                    initial={false}
                    whileHover={{ x: 5 }}
                  >
                    Más información →
                  </motion.div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para transformar tu espacio de trabajo?
            </h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Únete a las empresas que ya están revolucionando la gestión de sus espacios con WorkBit.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const contactSection = document.querySelector('#contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Solicitar Demo Gratuita
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Ver Documentación
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection; 