import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '../ui';

const HeroSection = () => {
  const handleRequestDemo = () => {
    // Scroll to contact form
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen opacity-10 filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen opacity-10 filter blur-3xl animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen opacity-10 filter blur-3xl animate-pulse delay-700"></div>
      </div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
          >
            Gestiona tus{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              espacios
            </span>
            <br />
            de forma inteligente
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            WorkBit combina sensores IoT, tecnología RFID y una plataforma web intuitiva 
            para optimizar el uso de espacios de trabajo en tiempo real.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={handleRequestDemo}
              icon={<ArrowRight size={20} />}
              iconPosition="right"
              className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Solicitar Demo
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              icon={<Play size={20} />}
              className="text-lg px-10 py-4 border-2 border-gray-600 text-white hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              Ver Demo
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pt-16 text-center"
          >
            <p className="text-sm text-gray-400 mb-8 uppercase tracking-wide font-medium">Confiado por empresas líderes</p>
            <div className="flex justify-center items-center space-x-12 opacity-50">
              {['TechCorp', 'InnovateLab', 'FutureSpace', 'SmartWork'].map((company, index) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + (index * 0.1), duration: 0.5 }}
                  className="text-gray-300 font-medium text-lg tracking-wider hover:text-white transition-colors duration-300"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-gray-300 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection; 