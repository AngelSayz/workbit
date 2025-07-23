import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Users, Building2, Calendar } from 'lucide-react';

const AnimatedCounter = ({ value, duration = 2 }) => {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const isInView = useInView(ref);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [springValue]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
};

const StatsSection = () => {
  const stats = [
    {
      id: 1,
      name: 'Usuarios Activos',
      value: 12500,
      icon: Users,
      description: 'Profesionales utilizando WorkBit diariamente',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Empresas',
      value: 250,
      icon: Building2,
      description: 'Organizaciones que confían en nuestra plataforma',
      color: 'green'
    },
    {
      id: 3,
      name: 'Reservas',
      value: 850000,
      icon: Calendar,
      description: 'Reservas gestionadas exitosamente',
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200'
      }
    };
    return colorMap[color];
  };

  return (
    <section id="stats" className="py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            NUESTRO IMPACTO
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
            Resultados que
            <span className="block text-blue-600">marcan la diferencia</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
            Descubre el impacto que WorkBit está teniendo en organizaciones de todo el mundo
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = getColorClasses(stat.color);
            
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`
                  relative p-8 rounded-2xl bg-white border border-gray-200 shadow-lg
                  hover:shadow-2xl hover:border-gray-300 transition-all duration-500 group
                `}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-2xl">
                  <div className={`absolute top-2 right-2 w-16 h-16 ${colors.bg} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${colors.bg} rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${colors.text}`} />
                  </div>

                  {/* Counter */}
                  <div className="mb-6">
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                      <AnimatedCounter value={stat.value} />
                      {stat.id === 3 && <span className="text-3xl">+</span>}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {stat.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed font-light">
                    {stat.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <motion.div
                  className={`absolute inset-0 ${colors.bg} rounded-2xl opacity-0`}
                  whileHover={{ opacity: 0.05 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            ¿Listo para formar parte de estas estadísticas?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const contactSection = document.querySelector('#contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Únete ahora
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection; 