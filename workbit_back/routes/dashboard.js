const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// GET /api/dashboard/stats - Get dashboard statistics (admin only)
router.get('/stats', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Get total completed reservations (status = 'confirmed' and end_time < now)
      const { data: completedReservations, error: completedError } = await supabase
        .from('reservations')
        .select('id')
        .eq('status', 'confirmed')
        .lt('end_time', new Date().toISOString());

      if (completedError) {
        console.error('Error fetching completed reservations:', completedError);
        return res.status(500).json({
          error: 'Failed to fetch completed reservations'
        });
      }

      // Get total future reservations (status = 'confirmed' and start_time > now)
      const { data: futureReservations, error: futureError } = await supabase
        .from('reservations')
        .select('id')
        .eq('status', 'confirmed')
        .gt('start_time', new Date().toISOString());

      if (futureError) {
        console.error('Error fetching future reservations:', futureError);
        return res.status(500).json({
          error: 'Failed to fetch future reservations'
        });
      }

      // Get total users (role = 'user')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', 1); // Assuming role_id 1 is 'user'

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return res.status(500).json({
          error: 'Failed to fetch users'
        });
      }

      // Get total technicians (role = 'technician')
      const { data: technicians, error: techniciansError } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', 3); // Assuming role_id 3 is 'technician'

      if (techniciansError) {
        console.error('Error fetching technicians:', techniciansError);
        return res.status(500).json({
          error: 'Failed to fetch technicians'
        });
      }

      // Get total spaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id');

      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
        return res.status(500).json({
          error: 'Failed to fetch spaces'
        });
      }

      // Get total pending tasks
      const { data: pendingTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'pending');

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return res.status(500).json({
          error: 'Failed to fetch tasks'
        });
      }

      res.json({
        success: true,
        data: {
          total_completed_reservations: completedReservations?.length || 0,
          total_future_reservations: futureReservations?.length || 0,
          total_users: users?.length || 0,
          total_technicians: technicians?.length || 0,
          total_spaces: spaces?.length || 0,
          total_pending_tasks: pendingTasks?.length || 0
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message
      });
    }
  }
);

// GET /api/dashboard/charts - Get chart data for statistics (admin only)
router.get('/charts', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Get reservations by status for pie chart
      const { data: reservationsByStatus, error: statusError } = await supabase
        .from('reservations')
        .select('status');

      if (statusError) {
        console.error('Error fetching reservations by status:', statusError);
        return res.status(500).json({
          error: 'Failed to fetch reservations by status'
        });
      }

      // Count reservations by status
      const statusCounts = {};
      reservationsByStatus?.forEach(reservation => {
        statusCounts[reservation.status] = (statusCounts[reservation.status] || 0) + 1;
      });

      // Get reservations by month for line chart (last 12 months)
      const { data: reservationsByMonth, error: monthError } = await supabase
        .from('reservations')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (monthError) {
        console.error('Error fetching reservations by month:', monthError);
        return res.status(500).json({
          error: 'Failed to fetch reservations by month'
        });
      }

      // Group by month
      const monthlyData = {};
      reservationsByMonth?.forEach(reservation => {
        const month = new Date(reservation.created_at).toISOString().slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      // Get spaces by status for bar chart
      const { data: spacesByStatus, error: spacesError } = await supabase
        .from('spaces')
        .select('status');

      if (spacesError) {
        console.error('Error fetching spaces by status:', spacesError);
        return res.status(500).json({
          error: 'Failed to fetch spaces by status'
        });
      }

      // Count spaces by status
      const spaceStatusCounts = {};
      spacesByStatus?.forEach(space => {
        spaceStatusCounts[space.status] = (spaceStatusCounts[space.status] || 0) + 1;
      });

      // Get users by role for pie chart
      const { data: usersByRole, error: usersError } = await supabase
        .from('users')
        .select('role_id');

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return res.status(500).json({
          error: 'Failed to fetch users by role'
        });
      }

      // Count users by role
      const roleCounts = {};
      usersByRole?.forEach(user => {
        const role = user.role_id === 1 ? 'user' : user.role_id === 2 ? 'admin' : user.role_id === 3 ? 'technician' : 'unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          reservations_by_status: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count
          })),
          reservations_by_month: Object.entries(monthlyData).map(([month, count]) => ({
            month,
            count
          })),
          spaces_by_status: Object.entries(spaceStatusCounts).map(([status, count]) => ({
            status,
            count
          })),
          users_by_role: Object.entries(roleCounts).map(([role, count]) => ({
            role,
            count
          }))
        }
      });

    } catch (error) {
      console.error('Dashboard charts error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chart data',
        error: error.message
      });
    }
  }
);

// GET /api/dashboard/overview - Comprehensive dashboard overview (admin only)
router.get('/overview',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Get current date/time info
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 1. Get spaces by status
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, status, capacity');

      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
        return res.status(500).json({ error: 'Failed to fetch spaces' });
      }

      // Count spaces by status
      const spaceStatusCounts = {
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
        unavailable: 0
      };
      
      spaces?.forEach(space => {
        if (spaceStatusCounts.hasOwnProperty(space.status)) {
          spaceStatusCounts[space.status]++;
        }
      });

      // 2. Get reservations with time filters
      const { data: allReservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('id, status, start_time, end_time, created_at')
        .order('created_at', { ascending: false });

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        return res.status(500).json({ error: 'Failed to fetch reservations' });
      }

      // Analyze reservations by time periods and status
      const reservationStats = {
        '24h': { completed: 0, active: 0, pending: 0 },
        '7d': { completed: 0, active: 0, pending: 0 },
        '30d': { completed: 0, active: 0, pending: 0 },
        total: { completed: 0, active: 0, pending: 0 }
      };

      allReservations?.forEach(reservation => {
        const reservationDate = new Date(reservation.created_at);
        const startTime = new Date(reservation.start_time);
        const endTime = new Date(reservation.end_time);
        
        // Determine reservation status
        let status = 'pending';
        if (reservation.status === 'confirmed') {
          if (endTime < now) {
            status = 'completed';
          } else if (startTime <= now && endTime > now) {
            status = 'active';
          } else {
            status = 'pending'; // future confirmed reservation
          }
        }

        // Count by time periods
        reservationStats.total[status]++;
        
        if (reservationDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
          reservationStats['24h'][status]++;
        }
        if (reservationDate >= weekAgo) {
          reservationStats['7d'][status]++;
        }
        if (reservationDate >= monthAgo) {
          reservationStats['30d'][status]++;
        }
      });

      // 3. Get users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', 1); // Assuming role_id 1 is 'user'

      if (usersError) {
        console.error('Error fetching users count:', usersError);
        return res.status(500).json({ error: 'Failed to fetch users count' });
      }

      // 4. Get technicians count
      const { count: totalTechnicians, error: techniciansError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', 3); // Assuming role_id 3 is 'technician'

      if (techniciansError) {
        console.error('Error fetching technicians count:', techniciansError);
        return res.status(500).json({ error: 'Failed to fetch technicians count' });
      }

      // 5. Get calendar data for current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data: monthReservations, error: monthReservationsError } = await supabase
        .from('reservations')
        .select('id, start_time, end_time, status, space_id')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .eq('status', 'confirmed');

      if (monthReservationsError) {
        console.error('Error fetching month reservations:', monthReservationsError);
      }

      // Group reservations by day for calendar
      const calendarData = {};
      monthReservations?.forEach(reservation => {
        const day = new Date(reservation.start_time).getDate();
        if (!calendarData[day]) {
          calendarData[day] = {
            date: day,
            reservations: 0,
            spaces_used: new Set()
          };
        }
        calendarData[day].reservations++;
        calendarData[day].spaces_used.add(reservation.space_id);
      });

      // Convert to array and add space count
      const calendarArray = Object.values(calendarData).map(day => ({
        ...day,
        spaces_used: day.spaces_used.size
      }));

      res.json({
        success: true,
        data: {
          // KPI Cards data
          kpis: {
            spaces: {
              total: spaces?.length || 0,
              distribution: spaceStatusCounts
            },
            reservations: reservationStats,
            users: totalUsers || 0,
            technicians: totalTechnicians || 0
          },
          
          // Calendar data
          calendar: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            days: calendarArray
          },

          // Additional metadata
          last_updated: now.toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard overview'
      });
    }
  }
);

// GET /api/dashboard/alerts - Get system alerts with filters (admin only)
router.get('/alerts',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { 
        severity, 
        resolved = 'false', 
        limit = 50,
        priority // high, medium, low
      } = req.query;

      // Import Alert model
      const Alert = require('../models/Alert');

      // Build filter
      let filter = {};
      
      if (severity) {
        filter.severity = severity;
      }
      
      if (priority) {
        // Map priority to severity levels
        const priorityMap = {
          'high': ['critical', 'high'],
          'medium': ['medium'],
          'low': ['low']
        };
        if (priorityMap[priority]) {
          filter.severity = { $in: priorityMap[priority] };
        }
      }
      
      filter.resolved = resolved === 'true';

      // Get alerts with space information
      const alerts = await Alert.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      // Get space names for alerts
      const spaceIds = [...new Set(alerts.map(alert => alert.space_id))];
      let spacesMap = {};
      
      if (spaceIds.length > 0) {
        const { data: spaces, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name')
          .in('id', spaceIds);

        if (!spacesError && spaces) {
          spaces.forEach(space => {
            spacesMap[space.id] = space.name;
          });
        }
      }

      // Enrich alerts with space names
      const enrichedAlerts = alerts.map(alert => ({
        ...alert.toObject(),
        space_name: spacesMap[alert.space_id] || 'Unknown Space'
      }));

      // Get alert statistics
      const alertStats = await Alert.aggregate([
        { $match: { resolved: false } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          alerts: enrichedAlerts,
          statistics: {
            total: alerts.length,
            by_severity: alertStats,
            active_count: await Alert.countDocuments({ resolved: false })
          }
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard alerts'
      });
    }
  }
);

// GET /api/dashboard/notifications - Get system notifications (admin only)
router.get('/notifications',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;

      // Import EventLog model
      const Analytics = require('../models/Analytics');
      const EventLog = Analytics.EventLog;

      // Get recent system events as notifications
      const events = await EventLog.find({
        event_type: {
          $in: ['reservation_cancelled', 'space_status_changed', 'system_alert', 'device_offline']
        }
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

      // Get space names for events that have space_id
      const spaceIds = [...new Set(events.filter(e => e.space_id).map(e => e.space_id))];
      let spacesMap = {};
      
      if (spaceIds.length > 0) {
        const { data: spaces, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name')
          .in('id', spaceIds);

        if (!spacesError && spaces) {
          spaces.forEach(space => {
            spacesMap[space.id] = space.name;
          });
        }
      }

      // Format notifications
      const notifications = events.map(event => ({
        id: event._id,
        type: event.event_type,
        title: getNotificationTitle(event.event_type),
        message: getNotificationMessage(event, spacesMap[event.space_id]),
        severity: event.severity || 'info',
        timestamp: event.timestamp,
        space_id: event.space_id,
        space_name: spacesMap[event.space_id] || null
      }));

      res.json({
        success: true,
        data: {
          notifications,
          count: notifications.length
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard notifications'
      });
    }
  }
);

// Helper functions for notifications
function getNotificationTitle(eventType) {
  const titles = {
    'reservation_cancelled': 'Reserva Cancelada',
    'space_status_changed': 'Estado del Espacio Actualizado',
    'system_alert': 'Alerta del Sistema',
    'device_offline': 'Dispositivo Fuera de Línea'
  };
  return titles[eventType] || 'Notificación';
}

function getNotificationMessage(event, spaceName) {
  const space = spaceName ? ` en ${spaceName}` : '';
  
  switch (event.event_type) {
    case 'reservation_cancelled':
      return `Se canceló una reserva${space}`;
    case 'space_status_changed':
      return `El estado del espacio${space} ha cambiado`;
    case 'system_alert':
      return `Alerta del sistema${space}: ${event.event_data?.message || 'Alerta generada'}`;
    case 'device_offline':
      return `Dispositivo${space} está fuera de línea`;
    default:
      return `Evento del sistema: ${event.event_type}`;
  }
}

module.exports = router; 