import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Calendar, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Wrench
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin, isTechnician } = useAuth();

  const navigation = [
    {
      name: 'Resumen',
      href: '/dashboard/overview',
      icon: LayoutDashboard,
      roles: ['Admin', 'Technician', 'Employee']
    },
    {
      name: 'Espacios',
      href: '/dashboard/spaces',
      icon: MapPin,
      roles: ['Admin', 'Technician', 'Employee']
    },
    {
      name: 'Reservas',
      href: '/dashboard/reservations',
      icon: Calendar,
      roles: ['Admin', 'Technician', 'Employee']
    },
    {
      name: 'Usuarios',
      href: '/dashboard/users',
      icon: Users,
      roles: ['Admin']
    },
    {
      name: 'Administración',
      href: '/dashboard/admin',
      icon: Shield,
      roles: ['Admin']
    },
    {
      name: 'Técnico',
      href: '/dashboard/technician',
      icon: Wrench,
      roles: ['Technician']
    },
    {
      name: 'Configuración',
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['Admin', 'Technician', 'Employee']
    }
  ];

  const filteredNavigation = navigation.filter(item => {
    const userRole = user?.role;
    return item.roles.includes(userRole);
  });

  const isActive = (href) => location.pathname === href;

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0, width: isCollapsed ? 80 : 250 }}
      transition={{ duration: 0.3 }}
      className="bg-white shadow-lg border-r border-gray-200 h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900">WorkBit</span>
            </motion.div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-gray-600" />
            ) : (
              <ChevronLeft size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-4 border-b border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || user?.firstName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || 'Empleado'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon
                size={20}
                className={`
                  ${isCollapsed ? 'mx-auto' : 'mr-3'}
                  ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                `}
              />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`
            group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 
            rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200
          `}
        >
          <LogOut
            size={20}
            className={`
              ${isCollapsed ? 'mx-auto' : 'mr-3'}
              text-gray-400 group-hover:text-red-600
            `}
          />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Cerrar Sesión
            </motion.span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar; 