import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Building, 
  Calendar, 
  Settings, 
  LogOut,
  User,
  Wrench,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard/overview', 
      icon: Home,
      roles: ['admin', 'technician']
    },
    { 
      name: 'Reservas', 
      href: '/dashboard/reservations', 
      icon: Calendar,
      roles: ['admin', 'technician']
    },
    { 
      name: 'Espacios', 
      href: '/dashboard/spaces', 
      icon: Building,
      roles: ['admin', 'technician']
    },
    { 
      name: 'Estadísticas', 
      href: '/dashboard/statistics', 
      icon: BarChart3,
      roles: ['admin']
    },
    { 
      name: 'Usuarios', 
      href: '/dashboard/users', 
      icon: Users,
      roles: ['admin']
    },
    { 
      name: 'Staff', 
      href: '/dashboard/staff', 
      icon: Wrench,
      roles: ['admin']
    },
    { 
      name: 'Tareas', 
      href: '/dashboard/tasks', 
      icon: Wrench,
      roles: ['admin', 'technician']
    },
    { 
      name: 'Configuración', 
      href: '/dashboard/settings', 
      icon: Settings,
      roles: ['admin', 'technician']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <div className="text-xl font-bold text-blue-600">
              WorkBit
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name} {user?.lastname}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors duration-200"
            >
              <LogOut size={16} className="mr-3" />
              {t('dashboard.header.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="text-lg font-bold text-blue-600">
              WorkBit
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout; 