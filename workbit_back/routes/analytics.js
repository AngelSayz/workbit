const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');
const mongoose = require('mongoose');
const { SpaceUsage, UserActivity, SystemMetrics, EventLog, PerformanceMetrics } = require('../models/Analytics');

// Get space usage analytics
router.get('/spaces', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { date, period = '7d', space_id } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = new Date(date);
    } else {
      const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.date = { $gte: startDate };
    }

    // Build space filter
    let spaceFilter = {};
    if (space_id) {
      spaceFilter.space_id = parseInt(space_id);
    }

    const filter = { ...dateFilter, ...spaceFilter };

    // Get space usage data
    const spaceUsage = await SpaceUsage.find(filter)
      .sort({ date: -1 })
      .limit(100);

    // Calculate aggregated metrics
    const aggregated = {
      total_reservations: 0,
      total_hours_reserved: 0,
      total_hours_used: 0,
      average_occupancy_rate: 0,
      top_spaces: []
    };

    if (spaceUsage.length > 0) {
      aggregated.total_reservations = spaceUsage.reduce((sum, item) => sum + item.total_reservations, 0);
      aggregated.total_hours_reserved = spaceUsage.reduce((sum, item) => sum + item.total_hours_reserved, 0);
      aggregated.total_hours_used = spaceUsage.reduce((sum, item) => sum + item.total_hours_used, 0);
      aggregated.average_occupancy_rate = spaceUsage.reduce((sum, item) => sum + item.occupancy_rate, 0) / spaceUsage.length;

      // Group by space and calculate totals
      const spaceGroups = {};
      spaceUsage.forEach(item => {
        if (!spaceGroups[item.space_id]) {
          spaceGroups[item.space_id] = {
            space_id: item.space_id,
            space_name: item.space_name,
            total_reservations: 0,
            total_hours_used: 0,
            average_occupancy: 0,
            entries: 0
          };
        }
        spaceGroups[item.space_id].total_reservations += item.total_reservations;
        spaceGroups[item.space_id].total_hours_used += item.total_hours_used;
        spaceGroups[item.space_id].average_occupancy += item.occupancy_rate;
        spaceGroups[item.space_id].entries += 1;
      });

      // Calculate averages and get top spaces
      aggregated.top_spaces = Object.values(spaceGroups)
        .map(space => ({
          ...space,
          average_occupancy: space.average_occupancy / space.entries
        }))
        .sort((a, b) => b.total_hours_used - a.total_hours_used)
        .slice(0, 10);
    }

    res.json({
      success: true,
      data: {
        period: period,
        space_usage: spaceUsage,
        aggregated_metrics: aggregated
      }
    });

  } catch (error) {
    console.error('Error fetching space analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching space analytics',
      error: error.message
    });
  }
});

// Get user activity analytics
router.get('/users', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { date, period = '7d', user_id } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = new Date(date);
    } else {
      const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.date = { $gte: startDate };
    }

    // Build user filter
    let userFilter = {};
    if (user_id) {
      userFilter.user_id = parseInt(user_id);
    }

    const filter = { ...dateFilter, ...userFilter };

    // Get user activity data
    const userActivity = await UserActivity.find(filter)
      .sort({ date: -1 })
      .limit(100);

    // Calculate aggregated metrics
    const aggregated = {
      total_active_users: new Set(userActivity.map(item => item.user_id)).size,
      total_reservations: 0,
      total_hours_used: 0,
      most_active_users: []
    };

    if (userActivity.length > 0) {
      aggregated.total_reservations = userActivity.reduce((sum, item) => sum + item.total_reservations, 0);
      aggregated.total_hours_used = userActivity.reduce((sum, item) => sum + item.total_hours_used, 0);

      // Group by user and calculate totals
      const userGroups = {};
      userActivity.forEach(item => {
        if (!userGroups[item.user_id]) {
          userGroups[item.user_id] = {
            user_id: item.user_id,
            username: item.username,
            total_reservations: 0,
            total_hours_used: 0,
            favorite_spaces: item.favorite_spaces || []
          };
        }
        userGroups[item.user_id].total_reservations += item.total_reservations;
        userGroups[item.user_id].total_hours_used += item.total_hours_used;
      });

      // Get most active users
      aggregated.most_active_users = Object.values(userGroups)
        .sort((a, b) => b.total_hours_used - a.total_hours_used)
        .slice(0, 10);
    }

    res.json({
      success: true,
      data: {
        period: period,
        user_activity: userActivity,
        aggregated_metrics: aggregated
      }
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error.message
    });
  }
});

// Get system metrics
router.get('/system', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { date, period = '7d' } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = new Date(date);
    } else {
      const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.date = { $gte: startDate };
    }

    // Get system metrics
    const systemMetrics = await SystemMetrics.find(dateFilter)
      .sort({ date: -1 })
      .limit(100);

    // Get latest metrics for current status
    const latestMetrics = await SystemMetrics.findOne()
      .sort({ date: -1 });

    // Calculate trends
    let trends = {};
    if (systemMetrics.length >= 2) {
      const latest = systemMetrics[0];
      const previous = systemMetrics[1];
      
      trends = {
        users_trend: latest.active_users - previous.active_users,
        spaces_trend: latest.available_spaces - previous.available_spaces,
        reservations_trend: latest.total_reservations - previous.total_reservations,
        occupancy_trend: latest.average_occupancy_rate - previous.average_occupancy_rate
      };
    }

    res.json({
      success: true,
      data: {
        period: period,
        current_status: latestMetrics,
        historical_metrics: systemMetrics,
        trends: trends
      }
    });

  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system analytics',
      error: error.message
    });
  }
});

// Get event logs with analytics
router.get('/events', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { 
      event_type, 
      severity, 
      hours = 24, 
      limit = 100,
      user_id,
      space_id 
    } = req.query;
    
    // Build filter
    let filter = {};
    
    // Time filter
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - parseInt(hours));
    filter.timestamp = { $gte: startTime };

    // Type filter
    if (event_type) {
      filter.event_type = event_type;
    }

    // Severity filter
    if (severity) {
      filter.severity = severity;
    }

    // User filter
    if (user_id) {
      filter.user_id = parseInt(user_id);
    }

    // Space filter
    if (space_id) {
      filter.space_id = parseInt(space_id);
    }

    // Get events
    const events = await EventLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Get event statistics
    const eventStats = await EventLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
          latest: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get severity distribution
    const severityStats = await EventLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        events: events,
        statistics: {
          total_events: events.length,
          event_types: eventStats,
          severity_distribution: severityStats,
          time_range: `${hours} hours`
        }
      }
    });

  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event analytics',
      error: error.message
    });
  }
});

// Generate occupancy report
router.get('/reports/occupancy', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    // Get reservations from SQL for the period
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        status,
        space_id,
        spaces (
          id,
          name,
          capacity
        )
      `)
      .gte('start_time', start_date)
      .lte('end_time', end_date)
      .eq('status', 'confirmed');

    if (reservationError) throw reservationError;

    // Get access logs for actual usage
    const { data: accessLogs, error: accessError } = await supabase
      .from('access_logs')
      .select(`
        space_id,
        access_time,
        exit_time,
        spaces (
          name,
          capacity
        )
      `)
      .gte('access_time', start_date)
      .lte('access_time', end_date);

    if (accessError) throw accessError;

    // Calculate occupancy metrics
    const spaceOccupancy = {};
    
    // Process reservations
    reservations?.forEach(reservation => {
      const spaceId = reservation.space_id;
      if (!spaceOccupancy[spaceId]) {
        spaceOccupancy[spaceId] = {
          space_id: spaceId,
          space_name: reservation.spaces.name,
          capacity: reservation.spaces.capacity,
          total_reserved_hours: 0,
          total_used_hours: 0,
          reservation_count: 0,
          access_count: 0
        };
      }

      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);
      const duration = (endTime - startTime) / (1000 * 60 * 60); // hours

      spaceOccupancy[spaceId].total_reserved_hours += duration;
      spaceOccupancy[spaceId].reservation_count += 1;
    });

    // Process access logs
    accessLogs?.forEach(log => {
      const spaceId = log.space_id;
      if (!spaceOccupancy[spaceId]) {
        spaceOccupancy[spaceId] = {
          space_id: spaceId,
          space_name: log.spaces.name,
          capacity: log.spaces.capacity,
          total_reserved_hours: 0,
          total_used_hours: 0,
          reservation_count: 0,
          access_count: 0
        };
      }

      if (log.exit_time) {
        const accessTime = new Date(log.access_time);
        const exitTime = new Date(log.exit_time);
        const duration = (exitTime - accessTime) / (1000 * 60 * 60); // hours
        
        spaceOccupancy[spaceId].total_used_hours += duration;
      }
      spaceOccupancy[spaceId].access_count += 1;
    });

    // Calculate occupancy rates
    const occupancyReport = Object.values(spaceOccupancy).map(space => ({
      ...space,
      utilization_rate: space.total_reserved_hours > 0 ? 
        Math.round((space.total_used_hours / space.total_reserved_hours) * 100) : 0,
      occupancy_rate: space.capacity > 0 ? 
        Math.round((space.total_used_hours / (space.capacity * 24 * 7)) * 100) : 0 // assuming weekly period
    }));

    // Calculate overall metrics
    const totalReservedHours = occupancyReport.reduce((sum, space) => sum + space.total_reserved_hours, 0);
    const totalUsedHours = occupancyReport.reduce((sum, space) => sum + space.total_used_hours, 0);
    const overallUtilization = totalReservedHours > 0 ? 
      Math.round((totalUsedHours / totalReservedHours) * 100) : 0;

    res.json({
      success: true,
      data: {
        period: {
          start_date,
          end_date
        },
        overall_metrics: {
          total_spaces: occupancyReport.length,
          total_reserved_hours: totalReservedHours,
          total_used_hours: totalUsedHours,
          overall_utilization_rate: overallUtilization
        },
        space_occupancy: occupancyReport.sort((a, b) => b.utilization_rate - a.utilization_rate)
      }
    });

  } catch (error) {
    console.error('Error generating occupancy report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating occupancy report',
      error: error.message
    });
  }
});

// Get dashboard overview
router.get('/dashboard/overview', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    // Get current system status from SQL
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('status')
      .order('id');

    if (spacesError) throw spacesError;

    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get today's reservations
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('status')
      .gte('start_time', today)
      .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    if (reservationsError) throw reservationsError;

    // Get recent events from MongoDB
    const recentEvents = await EventLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate space distribution
    const spaceStatusCounts = spaces.reduce((acc, space) => {
      acc[space.status] = (acc[space.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate reservation distribution
    const reservationStatusCounts = todayReservations.reduce((acc, reservation) => {
      acc[reservation.status] = (acc[reservation.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        overview: {
          total_spaces: spaces.length,
          total_users: totalUsers,
          today_reservations: todayReservations.length,
          space_distribution: spaceStatusCounts,
          reservation_distribution: reservationStatusCounts
        },
        recent_activity: recentEvents,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
});

module.exports = router; 