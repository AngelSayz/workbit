const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { format, parseISO, isValid } = require('date-fns');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishSpaceStatus } = require('../config/mqtt');
const router = express.Router();

// GET /api/spaces - Get all spaces
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('*')
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch spaces'
      });
    }

    res.json({
      spaces: spaces || [],
      total: spaces ? spaces.length : 0
    });

  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({
      error: 'Failed to retrieve spaces'
    });
  }
});

// GET /api/spaces/available/:date - Get available spaces for a specific date (matches C# backend)
router.get('/available/:date', 
  authenticateToken,
  [
    param('date').custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      return true;
    })
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

      const { date } = req.params;
      const targetDate = parseISO(date);

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Get all spaces
      const { data: allSpaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .order('name');

      if (spacesError) {
        console.error('Spaces query error:', spacesError);
        return res.status(500).json({
          error: 'Failed to fetch spaces'
        });
      }

      // Get reservations for the target date
      const startOfDay = format(targetDate, 'yyyy-MM-dd 00:00:00');
      const endOfDay = format(targetDate, 'yyyy-MM-dd 23:59:59');

      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('space_id, start_time, end_time, status')
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .in('status', ['confirmed', 'pending']);

      if (reservationsError) {
        console.error('Reservations query error:', reservationsError);
        return res.status(500).json({
          error: 'Failed to fetch reservations'
        });
      }

      // Filter available spaces
      const availableSpaces = allSpaces.filter(space => {
        // Skip spaces that are permanently unavailable or in maintenance
        if (['unavailable', 'maintenance'].includes(space.status)) {
          return false;
        }

        // Check if space has any conflicting reservations
        const hasConflictingReservation = reservations.some(reservation => 
          reservation.space_id === space.id
        );

        return !hasConflictingReservation;
      });

      // Add availability info to each space
      const spacesWithAvailability = availableSpaces.map(space => ({
        ...space,
        isAvailable: true,
        availableForDate: date,
        reservedSlots: reservations
          .filter(r => r.space_id === space.id)
          .map(r => ({
            start_time: r.start_time,
            end_time: r.end_time,
            status: r.status
          }))
      }));

      res.json({
        date: date,
        availableSpaces: spacesWithAvailability,
        totalAvailable: spacesWithAvailability.length,
        totalSpaces: allSpaces.length
      });

    } catch (error) {
      console.error('Get available spaces error:', error);
      res.status(500).json({
        error: 'Failed to retrieve available spaces'
      });
    }
  }
);

// GET /api/AvailableSpaces/:date - Legacy endpoint compatibility (matches C# backend exactly)
router.get('/AvailableSpaces/:date', 
  authenticateToken,
  [
    param('date').custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      return true;
    })
  ],
  async (req, res) => {
    // Redirect to new endpoint
    req.url = `/available/${req.params.date}`;
    return router.handle(req, res);
  }
);

// GET /api/spaces/:id - Get specific space details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !space) {
      return res.status(404).json({
        error: 'Space not found'
      });
    }

    // Get recent reservations for this space
    const { data: recentReservations } = await supabase
      .from('reservations')
      .select(`
        id,
        reason,
        start_time,
        end_time,
        status,
        users(name, lastname, username)
      `)
      .eq('space_id', id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    res.json({
      ...space,
      upcomingReservations: recentReservations || []
    });

  } catch (error) {
    console.error('Get space details error:', error);
    res.status(500).json({
      error: 'Failed to retrieve space details'
    });
  }
});

// PUT /api/spaces/:id/status - Update space status (admin/technician only)
router.put('/:id/status', 
  authenticateToken, 
  requireRole(['admin', 'technician']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'unavailable', 'occupied', 'reserved', 'maintenance'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses
        });
      }

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      const { data: updatedSpace, error } = await supabase
        .from('spaces')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update space status error:', error);
        return res.status(500).json({
          error: 'Failed to update space status'
        });
      }

      if (!updatedSpace) {
        return res.status(404).json({
          error: 'Space not found'
        });
      }

      // Publish status update via MQTT
      publishSpaceStatus(id, status);

      res.json({
        message: 'Space status updated successfully',
        space: updatedSpace
      });

    } catch (error) {
      console.error('Update space status error:', error);
      res.status(500).json({
        error: 'Failed to update space status'
      });
    }
  }
);

// GET /api/spaces/status/summary - Get spaces status summary (admin/technician only)
router.get('/status/summary', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('status');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch spaces status'
      });
    }

    // Count spaces by status
    const statusSummary = spaces.reduce((acc, space) => {
      acc[space.status] = (acc[space.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: statusSummary,
      totalSpaces: spaces.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get spaces status summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve spaces status summary'
    });
  }
});

module.exports = router; 