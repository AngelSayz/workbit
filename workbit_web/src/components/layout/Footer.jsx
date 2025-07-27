import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Github,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import LanguageSelector from '../LanguageSelector';

const Footer = () => {
  const { t } = useTranslation();
  const footerLinks = {
    product: [
      { name: t('footer.links.features'), href: '#features' },
      { name: t('footer.links.pricing'), href: '#pricing' },
      { name: 'Integraciones', href: '#integrations' },
      { name: 'API', href: '#api' }
    ],
    company: [
      { name: t('footer.company.about'), href: '/about' },
      { name: t('footer.company.careers'), href: '/careers' },
      { name: t('footer.company.blog'), href: '/blog' },
      { name: 'Prensa', href: '/press' }
    ],
    support: [
      { name: 'Centro de Ayuda', href: '/help' },
      { name: 'Documentación', href: '/docs' },
      { name: 'Comunidad', href: '/community' },
      { name: t('footer.company.contact'), href: '#contact' }
    ],
    legal: [
      { name: t('footer.legal.privacy'), href: '/privacy' },
      { name: t('footer.legal.terms'), href: '/terms' },
      { name: t('footer.legal.cookies'), href: '/cookies' },
      { name: 'Seguridad', href: '/security' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/workbit' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/workbit' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/workbit' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/workbit' },
    { name: 'GitHub', icon: Github, href: 'https://github.com/workbit' }
  ];

  const contactInfo = [
    { 
      icon: Mail, 
      text: 'hola@workbit.com',
      href: 'mailto:hola@workbit.com'
    },
    { 
      icon: Phone, 
      text: '+1 (555) 123-4567',
      href: 'tel:+15551234567'
    },
    { 
      icon: MapPin, 
      text: 'Madrid, España',
      href: '#'
    }
  ];

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              {/* Logo */}
              <div className="flex items-center space-x-2 mb-4 md:mb-6">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-lg">W</span>
                </div>
                <span className="text-xl md:text-2xl font-bold">WorkBit</span>
              </div>

              <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6 leading-relaxed font-light">
                {t('footer.description')}
              </p>

              {/* Contact Info */}
              <div className="space-y-2 md:space-y-3">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.a
                      key={index}
                      href={item.href}
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-2 md:space-x-3 text-gray-400 hover:text-blue-400 transition-colors text-sm md:text-base"
                    >
                      <Icon size={14} className="md:w-4 md:h-4" />
                      <span>{item.text}</span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Links Sections */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {/* Producto */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('footer.links.product')}</h3>
                <ul className="space-y-2 md:space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-sm md:text-base text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Empresa */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('footer.company.about')}</h3>
                <ul className="space-y-2 md:space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm md:text-base text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Soporte */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('footer.links.support')}</h3>
                <ul className="space-y-2 md:space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      {link.href.startsWith('#') ? (
                        <button
                          onClick={() => scrollToSection(link.href)}
                          className="text-sm md:text-base text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {link.name}
                        </button>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm md:text-base text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Legal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Legal</h3>
                <ul className="space-y-2 md:space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm md:text-base text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 py-6 md:py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-xs md:text-sm text-center md:text-left">
              {t('footer.copyright')}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon size={18} className="md:w-5 md:h-5" />
                  </motion.a>
                );
              })}
            </div>

            {/* Language Selector */}
            <div className="text-gray-400 text-xs md:text-sm">
              <LanguageSelector />
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 