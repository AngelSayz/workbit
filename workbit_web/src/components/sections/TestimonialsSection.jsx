import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('testimonials.testimonials.0.name'),
      role: t('testimonials.testimonials.0.role'),
      company: t('testimonials.testimonials.0.company'),
      content: t('testimonials.testimonials.0.content'),
      rating: 5
    },
    {
      name: t('testimonials.testimonials.1.name'),
      role: t('testimonials.testimonials.1.role'), 
      company: t('testimonials.testimonials.1.company'),
      content: t('testimonials.testimonials.1.content'),
      rating: 5
    },
    {
      name: t('testimonials.testimonials.2.name'),
      role: t('testimonials.testimonials.2.role'),
      company: t('testimonials.testimonials.2.company'),
      content: t('testimonials.testimonials.2.content'),
      rating: 5
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Glassmorphism background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 shadow-xl"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-blue-200/30 backdrop-blur-lg rounded-2xl border border-blue-300/30 shadow-lg transform rotate-45"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/25 backdrop-blur-md rounded-xl border border-white/40 shadow-md transform -rotate-12"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 px-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
            >
              {/* Quote icon */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Rating stars */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-6 text-sm md:text-base italic">
                "{testimonial.content}"
              </p>

              {/* Author info */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 text-base md:text-lg">
                  {testimonial.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {testimonial.role}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {testimonial.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <p className="text-lg md:text-xl text-gray-600 mb-6">
            {t('testimonials.cta.text')}
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
            className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
          >
            {t('testimonials.cta.button')}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
