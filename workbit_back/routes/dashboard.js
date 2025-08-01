const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
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
        .select('id, roles(name)')
        .eq('roles.name', 'user');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return res.status(500).json({
          error: 'Failed to fetch users'
        });
      }

      // Get total technicians (role = 'technician')
      const { data: technicians, error: techniciansError } = await supabase
        .from('users')
        .select('id, roles(name)')
        .eq('roles.name', 'technician');

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
        .select('roles(name)');

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return res.status(500).json({
          error: 'Failed to fetch users by role'
        });
      }

      // Count users by role
      const roleCounts = {};
      usersByRole?.forEach(user => {
        const role = user.roles?.name || 'unknown';
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

module.exports = router; 