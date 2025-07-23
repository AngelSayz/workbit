const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { parseISO, isValid, format } = require('date-fns');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishAccessEvent } = require('../config/mqtt');
const router = express.Router();

// GET /api/access-logs - Get all access logs (admin/technician only)
router.get('/', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    const { user_id, space_id, date, limit = 100 } = req.query;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    let query = supabase
      .from('access_logs')
      .select(`
        id,
        access_time,
        exit_time,
        users(id, name, lastname, username),
        spaces(id, name),
        reservations(id, reason, status)
      `)
      .order('access_time', { ascending: false })
      .limit(parseInt(limit));

    // Filter by user if provided
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Filter by space if provided
    if (space_id) {
      query = query.eq('space_id', space_id);
    }

    // Filter by date if provided
    if (date) {
      const targetDate = parseISO(date);
      if (isValid(targetDate)) {
        const startOfDay = format(targetDate, 'yyyy-MM-dd 00:00:00');
        const endOfDay = format(targetDate, 'yyyy-MM-dd 23:59:59');
        query = query.gte('access_time', startOfDay).lte('access_time', endOfDay);
      }
    }

    const { data: accessLogs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch access logs'
      });
    }

    // Format response
    const formattedLogs = accessLogs.map(log => ({
      id: log.id,
      access_time: log.access_time,
      exit_time: log.exit_time,
      duration: log.exit_time ? 
        Math.round((new Date(log.exit_time) - new Date(log.access_time)) / 1000 / 60) : null, // minutes
      user: {
        id: log.users.id,
        name: log.users.name,
        lastname: log.users.lastname,
        username: log.users.username
      },
      space: {
        id: log.spaces.id,
        name: log.spaces.name
      },
      reservation: log.reservations ? {
        id: log.reservations.id,
        reason: log.reservations.reason,
        status: log.reservations.status
      } : null
    }));

    res.json({
      accessLogs: formattedLogs,
      total: formattedLogs.length,
      filters: { user_id, space_id, date, limit }
    });

  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve access logs'
    });
  }
});

// GET /api/access-logs/user/:userId - Get access logs for specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const userRole = req.user.roles?.name || req.user.role;

    // Users can only see their own logs unless admin/technician
    if (!['admin', 'technician'].includes(userRole) && parseInt(userId) !== req.user.id) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: accessLogs, error } = await supabase
      .from('access_logs')
      .select(`
        id,
        access_time,
        exit_time,
        spaces(id, name),
        reservations(id, reason, status)
      `)
      .eq('user_id', userId)
      .order('access_time', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch user access logs'
      });
    }

    const formattedLogs = accessLogs.map(log => ({
      id: log.id,
      access_time: log.access_time,
      exit_time: log.exit_time,
      duration: log.exit_time ? 
        Math.round((new Date(log.exit_time) - new Date(log.access_time)) / 1000 / 60) : null,
      space: {
        id: log.spaces.id,
        name: log.spaces.name
      },
      reservation: log.reservations ? {
        id: log.reservations.id,
        reason: log.reservations.reason,
        status: log.reservations.status
      } : null
    }));

    res.json({
      userId: parseInt(userId),
      accessLogs: formattedLogs,
      total: formattedLogs.length
    });

  } catch (error) {
    console.error('Get user access logs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user access logs'
    });
  }
});

// GET /api/access-logs/space/:spaceId - Get access logs for specific space
router.get('/space/:spaceId', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { date, limit = 100 } = req.query;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    let query = supabase
      .from('access_logs')
      .select(`
        id,
        access_time,
        exit_time,
        users(id, name, lastname, username),
        reservations(id, reason, status)
      `)
      .eq('space_id', spaceId)
      .order('access_time', { ascending: false })
      .limit(parseInt(limit));

    // Filter by date if provided
    if (date) {
      const targetDate = parseISO(date);
      if (isValid(targetDate)) {
        const startOfDay = format(targetDate, 'yyyy-MM-dd 00:00:00');
        const endOfDay = format(targetDate, 'yyyy-MM-dd 23:59:59');
        query = query.gte('access_time', startOfDay).lte('access_time', endOfDay);
      }
    }

    const { data: accessLogs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch space access logs'
      });
    }

    const formattedLogs = accessLogs.map(log => ({
      id: log.id,
      access_time: log.access_time,
      exit_time: log.exit_time,
      duration: log.exit_time ? 
        Math.round((new Date(log.exit_time) - new Date(log.access_time)) / 1000 / 60) : null,
      user: {
        id: log.users.id,
        name: log.users.name,
        lastname: log.users.lastname,
        username: log.users.username
      },
      reservation: log.reservations ? {
        id: log.reservations.id,
        reason: log.reservations.reason,
        status: log.reservations.status
      } : null
    }));

    res.json({
      spaceId: parseInt(spaceId),
      accessLogs: formattedLogs,
      total: formattedLogs.length,
      filters: { date, limit }
    });

  } catch (error) {
    console.error('Get space access logs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve space access logs'
    });
  }
});

// POST /api/access-logs - Create new access log (entry)
router.post('/', 
  authenticateToken,
  [
    body('space_id').isInt({ min: 1 }).withMessage('Valid space ID is required'),
    body('user_id').optional().isInt({ min: 1 }).withMessage('Valid user ID required'),
    body('reservation_id').optional().isInt({ min: 1 }).withMessage('Valid reservation ID required'),
    body('cardCode').optional().isString().withMessage('Card code must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { space_id, user_id, reservation_id, cardCode } = req.body;
      let finalUserId = user_id || req.user.id;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // If cardCode is provided, find the user by card
      if (cardCode && !user_id) {
        const { data: cardUser, error: cardError } = await supabase
          .from('users')
          .select('id')
          .eq('codecards.code', cardCode)
          .single();

        if (!cardError && cardUser) {
          finalUserId = cardUser.id;
        }
      }

      // Verify space exists
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('id, name, status')
        .eq('id', space_id)
        .single();

      if (spaceError || !space) {
        return res.status(404).json({
          error: 'Space not found'
        });
      }

      // Check if user has an active session (no exit_time)
      const { data: activeSession, error: sessionError } = await supabase
        .from('access_logs')
        .select('id')
        .eq('user_id', finalUserId)
        .eq('space_id', space_id)
        .is('exit_time', null)
        .single();

      if (!sessionError && activeSession) {
        return res.status(409).json({
          error: 'User already has an active session in this space'
        });
      }

      // Create access log entry
      const { data: newAccessLog, error: createError } = await supabase
        .from('access_logs')
        .insert({
          user_id: finalUserId,
          space_id,
          reservation_id: reservation_id || null,
          access_time: new Date().toISOString()
        })
        .select(`
          id,
          access_time,
          exit_time,
          users(id, name, lastname, username),
          spaces(id, name),
          reservations(id, reason, status)
        `)
        .single();

      if (createError) {
        console.error('Create access log error:', createError);
        return res.status(500).json({
          error: 'Failed to create access log'
        });
      }

      // Publish access event via MQTT
      publishAccessEvent(space_id, 'entry', finalUserId, reservation_id);

      res.status(201).json({
        message: 'Access logged successfully',
        accessLog: {
          id: newAccessLog.id,
          access_time: newAccessLog.access_time,
          exit_time: newAccessLog.exit_time,
          user: {
            id: newAccessLog.users.id,
            name: newAccessLog.users.name,
            lastname: newAccessLog.users.lastname,
            username: newAccessLog.users.username
          },
          space: {
            id: newAccessLog.spaces.id,
            name: newAccessLog.spaces.name
          },
          reservation: newAccessLog.reservations ? {
            id: newAccessLog.reservations.id,
            reason: newAccessLog.reservations.reason,
            status: newAccessLog.reservations.status
          } : null
        }
      });

    } catch (error) {
      console.error('Create access log error:', error);
      res.status(500).json({
        error: 'Failed to log access'
      });
    }
  }
);

// PUT /api/access-logs/:id/exit - Record exit time
router.put('/:id/exit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.roles?.name || req.user.role;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Get current access log
    let query = supabase
      .from('access_logs')
      .select('id, user_id, space_id, access_time, exit_time')
      .eq('id', id);

    // Users can only update their own logs unless admin/technician
    if (!['admin', 'technician'].includes(userRole)) {
      query = query.eq('user_id', req.user.id);
    }

    const { data: accessLog, error: fetchError } = await query.single();

    if (fetchError || !accessLog) {
      return res.status(404).json({
        error: 'Access log not found'
      });
    }

    if (accessLog.exit_time) {
      return res.status(400).json({
        error: 'Exit already recorded for this access log'
      });
    }

    // Update with exit time
    const exitTime = new Date().toISOString();
    const { data: updatedLog, error: updateError } = await supabase
      .from('access_logs')
      .update({ exit_time: exitTime })
      .eq('id', id)
      .select(`
        id,
        access_time,
        exit_time,
        users(id, name, lastname, username),
        spaces(id, name),
        reservations(id, reason, status)
      `)
      .single();

    if (updateError) {
      console.error('Update access log error:', updateError);
      return res.status(500).json({
        error: 'Failed to record exit'
      });
    }

    // Calculate duration
    const duration = Math.round((new Date(exitTime) - new Date(accessLog.access_time)) / 1000 / 60);

    // Publish exit event via MQTT
    publishAccessEvent(accessLog.space_id, 'exit', accessLog.user_id);

    res.json({
      message: 'Exit recorded successfully',
      accessLog: {
        id: updatedLog.id,
        access_time: updatedLog.access_time,
        exit_time: updatedLog.exit_time,
        duration: duration,
        user: {
          id: updatedLog.users.id,
          name: updatedLog.users.name,
          lastname: updatedLog.users.lastname,
          username: updatedLog.users.username
        },
        space: {
          id: updatedLog.spaces.id,
          name: updatedLog.spaces.name
        },
        reservation: updatedLog.reservations ? {
          id: updatedLog.reservations.id,
          reason: updatedLog.reservations.reason,
          status: updatedLog.reservations.status
        } : null
      }
    });

  } catch (error) {
    console.error('Record exit error:', error);
    res.status(500).json({
      error: 'Failed to record exit'
    });
  }
});

// GET /api/access-logs/active - Get active sessions (no exit time)
router.get('/active', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: activeSessions, error } = await supabase
      .from('access_logs')
      .select(`
        id,
        access_time,
        users(id, name, lastname, username),
        spaces(id, name),
        reservations(id, reason, status)
      `)
      .is('exit_time', null)
      .order('access_time', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch active sessions'
      });
    }

    const formattedSessions = activeSessions.map(session => ({
      id: session.id,
      access_time: session.access_time,
      duration: Math.round((new Date() - new Date(session.access_time)) / 1000 / 60), // minutes
      user: {
        id: session.users.id,
        name: session.users.name,
        lastname: session.users.lastname,
        username: session.users.username
      },
      space: {
        id: session.spaces.id,
        name: session.spaces.name
      },
      reservation: session.reservations ? {
        id: session.reservations.id,
        reason: session.reservations.reason,
        status: session.reservations.status
      } : null
    }));

    res.json({
      activeSessions: formattedSessions,
      total: formattedSessions.length
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve active sessions'
    });
  }
});

module.exports = router; 