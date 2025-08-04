import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Users, 
  Building, 
  Wrench, 
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { dashboardAPI } from '../../api/apiService';
import { useAuth } from '../../hooks/useAuth';
import KPICard from '../../components/dashboard/KPICard';
import CalendarWidget from '../../components/dashboard/CalendarWidget';
import AlertsWidget from '../../components/dashboard/AlertsWidget';
import PieChart from '../../components/dashboard/PieChart';

const OverviewPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReservationPeriod, setSelectedReservationPeriod] = useState('24h');
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    // Only fetch alerts and notifications for admins
    if (user?.role === 'admin') {
      fetchAlertsAndNotifications();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let response;
      
      // Fetch different data based on user role
      if (user?.role === 'admin') {
        response = await dashboardAPI.getOverview();
      } else if (user?.role === 'technician') {
        response = await dashboardAPI.getTechnicianOverview();
      } else {
        // For other roles, use basic overview or redirect
        response = await dashboardAPI.getOverview();
      }
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Error al cargar la información del dashboard');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar la información del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertsAndNotifications = async () => {
    try {
      const [alertsResponse, notificationsResponse] = await Promise.all([
        dashboardAPI.getAlerts({ resolved: 'false', limit: 10 }),
        dashboardAPI.getNotifications({ limit: 10 })
      ]);

      if (alertsResponse.success) {
        setAlerts(alertsResponse.data.alerts || []);
      }
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching alerts and notifications:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const promises = [fetchDashboardData()];
    
    // Only fetch alerts and notifications for admins
    if (user?.role === 'admin') {
      promises.push(fetchAlertsAndNotifications());
    }
    
    await Promise.all(promises);
    setRefreshing(false);
  };

  const handleReservationPeriodChange = (newPeriod) => {
    setSelectedReservationPeriod(newPeriod);
  };

  const handleCalendarDateClick = (date, dayData) => {
    // Handle calendar date click for admins
    console.log('Calendar date clicked:', date, dayData);
  };

  const handleAlertClick = (alert) => {
    // Handle alert click for admins
    console.log('Alert clicked:', alert);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Different data structure for different roles
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  // Admin-specific data
  const kpis = dashboardData?.kpis || {};
  const reservationData = kpis.reservations?.[selectedReservationPeriod] || { completed: 0, active: 0, pending: 0 };
  const usersData = kpis.users || { total: 0, with_upcoming_reservations: 0, active_last_24h: 0 };
  const techniciansData = kpis.technicians || { total: 0, with_tasks: 0, without_tasks: 0, unassigned_tasks: 0 };

  // Technician-specific data
  const overview = dashboardData?.overview || {};
  const myAssignments = dashboardData?.my_assignments || {};
  const systemStatus = dashboardData?.system_status || {};

  return (
    <div className="w-full h-full p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isTechnician ? 'Dashboard Técnico' : 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isTechnician 
              ? 'Panel de control para gestión técnica' 
              : 'Vista general del sistema WorkBit'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Actualizar</span>
          </button>
        </div>
      </motion.div>

      {/* KPI Cards Row - Different for each role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isAdmin ? (
          <>
            {/* Admin KPI Cards */}
            <KPICard
              title="Cubículos Totales"
              value=""
              icon={Building}
              color="blue"
              chart={
                <PieChart
                  data={[
                    { label: 'Disponible', value: kpis.spaces?.distribution?.available || 0 },
                    { label: 'Ocupado', value: kpis.spaces?.distribution?.occupied || 0 },
                    { label: 'Reservado', value: kpis.spaces?.distribution?.reserved || 0 },
                    { label: 'Mantenimiento', value: kpis.spaces?.distribution?.maintenance || 0 },
                    { label: 'No disponible', value: kpis.spaces?.distribution?.unavailable || 0 }
                  ]}
                  colors={['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#6B7280']}
                  size={150}
                />
              }
            />

            <KPICard
              title="Reservas"
              value={reservationData.completed + reservationData.active + reservationData.pending}
              icon={Calendar}
              color="green"
              dropdown={{
                options: [
                  { value: '24h', label: 'Últimas 24h' },
                  { value: '7d', label: 'Última semana' },
                  { value: '30d', label: 'Último mes' }
                ],
                onChange: handleReservationPeriodChange
              }}
              subItems={[
                { label: 'Completadas', value: reservationData.completed, color: '#10B981' },
                { label: 'Activas', value: reservationData.active, color: '#3B82F6' },
                { label: 'Pendientes', value: reservationData.pending, color: '#F59E0B' }
              ]}
            />

            <KPICard
              title="Clientes"
              value={usersData.total}
              icon={Users}
              color="purple"
              subItems={[
                { label: 'Con reservas próximas', value: usersData.with_upcoming_reservations, color: '#8B5CF6' },
                { label: 'Activos últimas 24h', value: usersData.active_last_24h, color: '#06B6D4' }
              ]}
            />

            <KPICard
              title="Técnicos"
              value={techniciansData.total}
              icon={Wrench}
              color="orange"
              subItems={[
                { label: 'Con tareas asignadas', value: techniciansData.with_tasks, color: '#10B981' },
                { label: 'Sin tareas asignadas', value: techniciansData.without_tasks, color: '#6B7280' },
                { label: 'Tareas sin asignar', value: techniciansData.unassigned_tasks, color: '#EF4444' }
              ]}
            />
          </>
        ) : (
          <>
            {/* Technician KPI Cards */}
            <KPICard
              title="Mis Asignaciones"
              value={myAssignments.stats?.total || 0}
              icon={ClipboardList}
              color="blue"
              subItems={[
                { label: 'Alta prioridad', value: myAssignments.stats?.by_priority?.high || 0, color: '#EF4444' },
                { label: 'Media prioridad', value: myAssignments.stats?.by_priority?.medium || 0, color: '#F59E0B' },
                { label: 'Baja prioridad', value: myAssignments.stats?.by_priority?.low || 0, color: '#10B981' }
              ]}
            />

            <KPICard
              title="Espacios"
              value={overview.spaces?.total || 0}
              icon={Building}
              color="green"
              subItems={[
                { label: 'En mantenimiento', value: overview.spaces?.maintenance_count || 0, color: '#F59E0B' },
                { label: 'Disponibles', value: overview.spaces?.distribution?.available || 0, color: '#10B981' },
                { label: 'Ocupados', value: overview.spaces?.distribution?.occupied || 0, color: '#EF4444' }
              ]}
            />

            <KPICard
              title="Usuarios del Sistema"
              value={overview.users?.total || 0}
              icon={Users}
              color="purple"
              subItems={[
                { label: 'Clientes', value: overview.users?.clients || 0, color: '#8B5CF6' },
                { label: 'Técnicos', value: overview.users?.technicians || 0, color: '#F59E0B' },
                { label: 'Administradores', value: overview.users?.admins || 0, color: '#EF4444' }
              ]}
            />

            <KPICard
              title="Atención Requerida"
              value={systemStatus.requires_attention || 0}
              icon={AlertTriangle}
              color="red"
              subItems={[
                { label: 'Tareas sin asignar', value: systemStatus.unassigned_tasks || 0, color: '#EF4444' },
                { label: 'Espacios en mantenimiento', value: systemStatus.maintenance_spaces || 0, color: '#F59E0B' },
                { label: 'Reservas hoy', value: overview.reservations?.today_count || 0, color: '#3B82F6' }
              ]}
            />
          </>
        )}
      </div>

      {/* Main Content: Different layout per role */}
      {isAdmin ? (
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 sm:gap-6">
          {/* Calendar Section (70%) */}
          <div className="xl:col-span-7">
            <CalendarWidget
              calendarData={dashboardData?.calendar?.days || []}
              onDateClick={handleCalendarDateClick}
              currentMonth={dashboardData?.calendar?.month || new Date().getMonth()}
              currentYear={dashboardData?.calendar?.year || new Date().getFullYear()}
            />
          </div>

          {/* Alerts & Notifications Section (30%) */}
          <div className="xl:col-span-3">
            <AlertsWidget
              alerts={alerts}
              notifications={notifications}
              onAlertClick={handleAlertClick}
              onFilterChange={(priority) => {
                fetchAlertsAndNotifications();
              }}
              className="h-full"
            />
          </div>
        </div>
      ) : (
        /* Technician Content */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* My Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div className="flex items-center mb-4">
              <ClipboardList className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Mis Tareas Recientes</h2>
            </div>
            {myAssignments.recent_tasks && myAssignments.recent_tasks.length > 0 ? (
              <div className="space-y-3">
                {myAssignments.recent_tasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{task.description}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'} prioridad
                      </span>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No tienes tareas asignadas</p>
              </div>
            )}
          </motion.div>

          {/* High Priority Tasks Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Tareas Urgentes</h2>
            </div>
            {myAssignments.high_priority_pending && myAssignments.high_priority_pending.length > 0 ? (
              <div className="space-y-3">
                {myAssignments.high_priority_pending.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-red-900 truncate">{task.title}</h4>
                      <p className="text-sm text-red-700 truncate">{task.description}</p>
                      <span className="text-xs text-red-600">
                        Creada: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p>No hay tareas urgentes pendientes</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Additional Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{((kpis.spaces?.distribution?.available || 0) / (kpis.spaces?.total || 1) * 100).toFixed(1)}%</div>
              <div className="text-sm text-green-700">Disponibilidad</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
              <div className="text-sm text-blue-700">Alertas Activas</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Rápido</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reservas hoy</span>
              <span className="text-sm font-medium">{reservationData.active + reservationData.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ocupación actual</span>
              <span className="text-sm font-medium">{kpis.spaces?.distribution?.occupied || 0} espacios</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Última actualización</span>
              <span className="text-xs text-gray-500">
                {dashboardData?.last_updated ? new Date(dashboardData.last_updated).toLocaleTimeString('es-ES') : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OverviewPage;