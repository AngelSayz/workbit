import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md min-w-80 ${getStyles(notification.type)}`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            {notification.title && (
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
            )}
            <p className="text-sm">{notification.message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
