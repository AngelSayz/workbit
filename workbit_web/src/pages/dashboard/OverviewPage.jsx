import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Users, 
  Building, 
  Wrench, 
  RefreshCw
} from 'lucide-react';
import { dashboardAPI } from '../../api/apiService';
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

  useEffect(() => {
    fetchDashboardData();
    fetchAlertsAndNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getOverview();
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
    await Promise.all([
      fetchDashboardData(),
      fetchAlertsAndNotifications()
    ]);
    setRefreshing(false);
  };

  const handleReservationPeriodChange = (newPeriod) => {
    setSelectedReservationPeriod(newPeriod);
  };

  const handleCalendarDateClick = (date, dayData) => {
    console.log('Date clicked:', date, dayData);
  };

  const handleAlertClick = (alert) => {
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

  const kpis = dashboardData?.kpis || {};
  const reservationData = kpis.reservations?.[selectedReservationPeriod] || { completed: 0, active: 0, pending: 0 };
  const usersData = kpis.users || { total: 0, with_upcoming_reservations: 0, active_last_24h: 0 };
  const techniciansData = kpis.technicians || { total: 0, with_tasks: 0, without_tasks: 0, unassigned_tasks: 0 };

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Vista general del sistema WorkBit</p>
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cubículos Card - Chart principal */}
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
              size={120}
              strokeWidth={12}
              showLabels={true}
            />
          }
        />

        {/* Reservas Card */}
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

        {/* Usuarios Card - Con más detalles */}
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

        {/* Técnicos Card - Con más detalles */}
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
      </div>

      {/* Main Content: Calendar (70%) + Alerts (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Calendar Section (70%) */}
        <div className="lg:col-span-7">
          <CalendarWidget
            calendarData={dashboardData?.calendar?.days || []}
            onDateClick={handleCalendarDateClick}
            currentMonth={dashboardData?.calendar?.month || new Date().getMonth()}
            currentYear={dashboardData?.calendar?.year || new Date().getFullYear()}
          />
        </div>

        {/* Alerts & Notifications Section (30%) */}
        <div className="lg:col-span-3">
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

      {/* Additional Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
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
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
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