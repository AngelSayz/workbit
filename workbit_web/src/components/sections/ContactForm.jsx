import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Mail, User, MessageSquare } from 'lucide-react';
import { Button, Input } from '../ui';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envío de formulario
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real de envío del formulario
      console.log('Formulario enviado:', formData);
      
      setIsSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      
      // Resetear success después de 3 segundos
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error enviando formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center bg-white rounded-2xl p-12 shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Mensaje enviado con éxito!
            </h3>
            
            <p className="text-xl text-gray-600 mb-8">
              Gracias por contactarnos. Nuestro equipo se pondrá en contacto contigo muy pronto.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSuccess(false)}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar otro mensaje
            </motion.button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold tracking-wide uppercase mb-8"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Hablemos
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
            ¿Listo para{' '}
            <span className="text-blue-600">
              comenzar?
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Solicita una demo personalizada y descubre cómo WorkBit puede 
            transformar la gestión de espacios en tu organización.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nombre */}
            <Input
              label="Nombre completo"
              type="text"
              name="name"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              icon={<User size={20} />}
              required
            />

            {/* Email */}
            <Input
              label="Email corporativo"
              type="email"
              name="email"
              placeholder="tu@empresa.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              icon={<Mail size={20} />}
              required
            />

            {/* Mensaje */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mensaje
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              <div className="relative">
                <textarea
                  name="message"
                  rows={6}
                  placeholder="Cuéntanos sobre tu empresa y cómo podemos ayudarte..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`
                    w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-all duration-200 resize-none
                    ${errors.message ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                />
                
                <MessageSquare 
                  size={20} 
                  className="absolute top-3 left-3 text-gray-400" 
                />
              </div>
              
              {errors.message && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {errors.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Send size={20} />}
                iconPosition="right"
                className="text-lg py-4"
              >
                {isSubmitting ? 'Enviando mensaje...' : 'Solicitar Demo Gratuita'}
              </Button>
            </motion.div>
          </form>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Respuesta rápida</h4>
                <p className="text-gray-600 text-sm">Menos de 24 horas</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Demo personalizada</h4>
                <p className="text-gray-600 text-sm">Adaptada a tus necesidades</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Sin compromiso</h4>
                <p className="text-gray-600 text-sm">Consulta completamente gratuita</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm; 