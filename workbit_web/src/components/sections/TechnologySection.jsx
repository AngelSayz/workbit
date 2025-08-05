import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  Wifi, 
  Thermometer, 
  Shield, 
  Radio, 
  Activity,
  Cloud,
  Smartphone
} from 'lucide-react';

const TechnologySection = () => {
  const { t } = useTranslation();

  const technologies = [
    {
      icon: <Cpu className="w-8 h-8 md:w-10 md:h-10" />,
      title: t('technology.modules.monitoring.title'),
      description: t('technology.modules.monitoring.description'),
      features: [
        t('technology.modules.monitoring.features.0'),
        t('technology.modules.monitoring.features.1'),
        t('technology.modules.monitoring.features.2')
      ],
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: <Shield className="w-8 h-8 md:w-10 md:h-10" />,
      title: t('technology.modules.access.title'),
      description: t('technology.modules.access.description'),
      features: [
        t('technology.modules.access.features.0'),
        t('technology.modules.access.features.1'),
        t('technology.modules.access.features.2')
      ],
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: <Cloud className="w-8 h-8 md:w-10 md:h-10" />,
      title: t('technology.modules.connectivity.title'),
      description: t('technology.modules.connectivity.description'),
      features: [
        t('technology.modules.connectivity.features.0'),
        t('technology.modules.connectivity.features.1'),
        t('technology.modules.connectivity.features.2')
      ],
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const sensors = [
    {
      icon: <Thermometer className="w-6 h-6" />,
      name: t('technology.sensors.temperature'),
      description: t('technology.sensors.temperatureDesc')
    },
    {
      icon: <Activity className="w-6 h-6" />,
      name: t('technology.sensors.air'),
      description: t('technology.sensors.airDesc')
    },
    {
      icon: <Radio className="w-6 h-6" />,
      name: t('technology.sensors.rfid'),
      description: t('technology.sensors.rfidDesc')
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      name: t('technology.sensors.connectivity'),
      description: t('technology.sensors.connectivityDesc')
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-40 h-40 bg-blue-200/20 backdrop-blur-lg rounded-full border border-blue-300/30"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-green-200/20 backdrop-blur-md rounded-2xl border border-green-300/30 transform rotate-45"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 px-4">
            {t('technology.title')}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            {t('technology.subtitle')}
          </p>
        </motion.div>

        {/* Main Technology Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className={`inline-flex p-3 md:p-4 rounded-lg ${tech.color} mb-4 md:mb-6`}>
                {tech.icon}
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                {tech.title}
              </h3>
              
              <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed">
                {tech.description}
              </p>

              <ul className="space-y-2">
                {tech.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm md:text-base text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Sensors Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100"
        >
          <div className="text-center mb-8 md:mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              {t('technology.sensorsTitle')}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('technology.sensorsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {sensors.map((sensor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-4 md:p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300"
              >
                <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-lg mb-3 md:mb-4">
                  {sensor.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                  {sensor.name}
                </h4>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {sensor.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white">
            <Smartphone className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              {t('technology.integration.title')}
            </h3>
            <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed">
              {t('technology.integration.description')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologySection;
