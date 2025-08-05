import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { Button } from '../ui';
import useMobile from '../../hooks/useMobile';

const HeroSection = () => {
  const isMobile = useMobile();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (isMobile) {
      // En móvil, mostrar mensaje en lugar de redirigir
      alert(t('nav.mobileAlert'));
      return;
    }
    window.location.href = '/login';
  };

  const handleLearnMore = () => {
    const contactSection = document.querySelector('#features');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50 overflow-hidden pt-16 sm:pt-20 md:pt-24">
      {/* Glassmorphism background elements */}
      <div className="absolute inset-0">
        {/* Large glassmorphism shapes */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-200/30 backdrop-blur-xl rounded-full border border-blue-300/30 shadow-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-white/25 backdrop-blur-xl rounded-full border border-white/40 shadow-2xl"></div>
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-blue-100/40 backdrop-blur-xl rounded-full border border-blue-200/40 shadow-2xl"></div>
        
        {/* Medium glassmorphism elements */}
        <div className="absolute top-60 left-1/2 w-48 h-48 bg-white/15 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl transform rotate-45"></div>
        <div className="absolute top-80 right-10 w-40 h-40 bg-blue-50/50 backdrop-blur-lg rounded-2xl border border-blue-100/30 shadow-xl transform -rotate-12"></div>
        <div className="absolute bottom-60 left-20 w-52 h-52 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/25 shadow-xl transform rotate-12"></div>
        
        {/* Small floating elements */}
        <div className="absolute top-32 right-1/4 w-24 h-24 bg-blue-200/40 backdrop-blur-md rounded-xl border border-blue-300/30 shadow-lg transform rotate-45"></div>
        <div className="absolute bottom-40 left-1/2 w-20 h-20 bg-white/30 backdrop-blur-md rounded-xl border border-white/40 shadow-lg transform -rotate-30"></div>
        <div className="absolute top-1/2 right-1/2 w-16 h-16 bg-blue-100/50 backdrop-blur-md rounded-full border border-blue-200/40 shadow-lg"></div>
      </div>
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4 sm:space-y-6 md:space-y-8 py-12 sm:py-16 md:py-20"
        >

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight px-2 sm:px-4 md:px-6"
          >
            {t('hero.title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-6"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Features Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8 py-4 sm:py-6 md:py-8 px-2 sm:px-4"
          >
            <div className="flex items-center space-x-2 text-gray-700 text-xs sm:text-sm md:text-base">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              <span className="font-medium">{t('hero.features.secure')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 text-xs sm:text-sm md:text-base">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              <span className="font-medium">{t('hero.features.realtime')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 text-xs sm:text-sm md:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              <span className="font-medium">{t('hero.features.collaborative')}</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 px-2 sm:px-4"
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              icon={<ArrowRight size={18} className="sm:w-5 sm:h-5" />}
              iconPosition="right"
              className={`text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto ${
                isMobile ? 'bg-orange-600 hover:bg-orange-700' : ''
              }`}
            >
              {isMobile ? t('hero.ctaMobile') : t('hero.cta')}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleLearnMore}
              className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 w-full sm:w-auto"
            >
              {t('stats.learnMore')}
            </Button>
          </motion.div>

          {/* Stats or Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pt-8 sm:pt-12 md:pt-16 px-2 sm:px-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('hero.stats.monitoring')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">100%</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('hero.stats.realtime')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">IoT</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('hero.stats.iot')}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1 h-8 bg-blue-600 rounded-full"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection; 