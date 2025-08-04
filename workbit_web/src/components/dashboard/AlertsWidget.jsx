import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Bell, 
  Filter, 
  X, 
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const AlertsWidget = ({ 
  alerts = [], 
  notifications = [], 
  onAlertClick = () => {},
  onFilterChange = () => {},
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('alerts'); // alerts, notifications
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const priorityFilters = [
    { value: 'all', label: 'Todas', color: 'gray' },
    { value: 'high', label: 'Alta', color: 'red' },
    { value: 'medium', label: 'Media', color: 'orange' },
    { value: 'low', label: 'Baja', color: 'blue' }
  ];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedPriority === 'all') return true;
    
    const severityToPriority = {
      'critical': 'high',
      'high': 'high', 
      'medium': 'medium',
      'low': 'low'
    };
    
    return severityToPriority[alert.severity] === selectedPriority;
  });

  const AlertItem = ({ alert }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 2 }}
      onClick={() => onAlertClick(alert)}
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${getSeverityColor(alert.severity)}`}
    >
      <div className="flex items-start space-x-3">
        {getSeverityIcon(alert.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium truncate">
              {alert.alert_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Alerta del Sistema'}
            </p>
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formatTimestamp(alert.createdAt)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {alert.message}
          </p>
          {alert.space_name && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              {alert.space_name}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const NotificationItem = ({ notification }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
      onClick={() => onAlertClick(notification)}
    >
      <div className="flex items-start space-x-3">
        <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-blue-900 truncate">
              {notification.title}
            </p>
            <span className="text-xs text-blue-600 ml-2 flex-shrink-0">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-2 line-clamp-2">
            {notification.message}
          </p>
          {notification.space_name && (
            <div className="flex items-center text-xs text-blue-600">
              <MapPin className="w-3 h-3 mr-1" />
              {notification.space_name}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alertas y Notificaciones</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'alerts'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Alertas</span>
              {alerts.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'alerts' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filteredAlerts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'notifications'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notificaciones</span>
              {notifications.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'notifications' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {notifications.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {priorityFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setSelectedPriority(filter.value);
                      onFilterChange(filter.value);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      selectedPriority === filter.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === 'alerts' ? (
            <div key="alerts" className="space-y-3">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <AlertItem key={alert._id || alert.id} alert={alert} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No hay alertas activas</p>
                  <p className="text-xs text-gray-500 mt-1">El sistema funciona correctamente</p>
                </motion.div>
              )}
            </div>
          ) : (
            <div key="notifications" className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No hay notificaciones</p>
                  <p className="text-xs text-gray-500 mt-1">Cuando ocurra algo importante, te notificaremos aquí</p>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertsWidget;