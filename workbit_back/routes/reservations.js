const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { parseISO, isValid, format, isBefore, isAfter } = require('date-fns');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishReservationUpdate } = require('../config/mqtt');
const router = express.Router();

// GET /api/reservations - Get all reservations (admin/technician) or user's reservations
router.get('/', async (req, res) => {
  try {
    const { status, date, user_id } = req.query;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reason,
        start_time,
        end_time,
        status,
        created_at,
        spaces(id, name, capacity),
        users!reservations_owner_id_fkey(id, name, lastname, username)
      `);

    // Filter by user if provided
    if (user_id) {
      query = query.eq('owner_id', user_id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date if provided
    if (date) {
      const targetDate = parseISO(date);
      if (isValid(targetDate)) {
        const startOfDay = format(targetDate, 'yyyy-MM-dd 00:00:00');
        const endOfDay = format(targetDate, 'yyyy-MM-dd 23:59:59');
        query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
      }
    }

    const { data: reservations, error } = await query.order('start_time', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch reservations'
      });
    }

    res.json({
      reservations: reservations || [],
      total: reservations ? reservations.length : 0
    });

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reservations'
    });
  }
});

// GET /api/reservations/by-date/:date - Get reservations by date
router.get('/by-date/:date', 
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

      const startOfDay = format(targetDate, 'yyyy-MM-dd 00:00:00');
      const endOfDay = format(targetDate, 'yyyy-MM-dd 23:59:59');

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reason,
          start_time,
          end_time,
          status,
          created_at,
          spaces(id, name, capacity, status),
          users!reservations_owner_id_fkey(id, name, lastname, username)
        `)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Failed to fetch reservations by date'
        });
      }

      const formattedReservations = reservations.map(reservation => ({
        id: reservation.id,
        reason: reservation.reason,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        status: reservation.status,
        created_at: reservation.created_at,
        space: {
          id: reservation.spaces.id,
          name: reservation.spaces.name,
          capacity: reservation.spaces.capacity,
          status: reservation.spaces.status
        },
        owner: {
          id: reservation.users.id,
          name: reservation.users.name,
          lastname: reservation.users.lastname,
          username: reservation.users.username
        }
      }));

      res.json({
        date: date,
        reservations: formattedReservations,
        total: formattedReservations.length
      });

    } catch (error) {
      console.error('Get reservations by date error:', error);
      res.status(500).json({
        error: 'Failed to retrieve reservations by date'
      });
    }
  }
);

// GET /api/reservations/:id - Get specific reservation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reason,
        start_time,
        end_time,
        status,
        created_at,
        spaces(id, name, capacity, status),
        users!reservations_owner_id_fkey(id, name, lastname, username)
      `)
      .eq('id', id);

    const { data: reservation, error } = await query.single();

    if (error || !reservation) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    // Get participants
    const { data: participants } = await supabase
      .from('reservation_participants')
      .select(`
        users(id, name, lastname, username)
      `)
      .eq('reservation_id', id);

    res.json({
      id: reservation.id,
      reason: reservation.reason,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      created_at: reservation.created_at,
      space: {
        id: reservation.spaces.id,
        name: reservation.spaces.name,
        capacity: reservation.spaces.capacity,
        status: reservation.spaces.status
      },
      owner: {
        id: reservation.users.id,
        name: reservation.users.name,
        lastname: reservation.users.lastname,
        username: reservation.users.username
      },
      participants: participants ? participants.map(p => p.users) : []
    });

  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reservation'
    });
  }
});

// POST /api/reservations - Create new reservation (matches C# createResevation endpoint)
router.post('/', 
  [
    body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required'),
    body('start_time').isISO8601().withMessage('Valid start time is required'),
    body('end_time').isISO8601().withMessage('Valid end time is required'),
    body('space_id').isInt({ min: 1 }).withMessage('Valid space ID is required'),
    body('participants').optional().isArray().withMessage('Participants must be an array')
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

      const { reason, start_time, end_time, space_id, participants = [] } = req.body;
      const startTime = parseISO(start_time);
      const endTime = parseISO(end_time);

      // Validate dates
      if (!isValid(startTime) || !isValid(endTime)) {
        return res.status(400).json({
          error: 'Invalid date format'
        });
      }

      if (isBefore(endTime, startTime)) {
        return res.status(400).json({
          error: 'End time must be after start time'
        });
      }

      if (isBefore(startTime, new Date())) {
        return res.status(400).json({
          error: 'Cannot create reservations in the past'
        });
      }

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Check if space exists and is available
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('id, name, status, capacity')
        .eq('id', space_id)
        .single();

      if (spaceError || !space) {
        return res.status(404).json({
          error: 'Space not found'
        });
      }

      if (['unavailable', 'maintenance'].includes(space.status)) {
        return res.status(400).json({
          error: 'Space is not available for reservations'
        });
      }

      // Check for conflicting reservations
      const { data: conflictingReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('space_id', space_id)
        .in('status', ['confirmed', 'pending'])
        .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`);

      if (conflictingReservations && conflictingReservations.length > 0) {
        return res.status(409).json({
          error: 'Space is already reserved for the selected time period'
        });
      }

      // Create reservation
      const { data: newReservation, error: createError } = await supabase
        .from('reservations')
        .insert({
          reason,
          start_time,
          end_time,
          space_id,
          owner_id: req.user.id,
          status: 'pending'
        })
        .select(`
          id,
          reason,
          start_time,
          end_time,
          status,
          created_at,
          spaces(id, name, capacity),
          users!reservations_owner_id_fkey(id, name, lastname, username)
        `)
        .single();

      if (createError) {
        console.error('Create reservation error:', createError);
        return res.status(500).json({
          error: 'Failed to create reservation'
        });
      }

      // Add participants if provided
      if (participants.length > 0) {
        const participantInserts = participants.map(userId => ({
          reservation_id: newReservation.id,
          user_id: userId
        }));

        await supabase
          .from('reservation_participants')
          .insert(participantInserts);
      }

      // Publish reservation creation via MQTT
      publishReservationUpdate(newReservation.id, 'created', {
        space_id: space_id,
        owner_id: req.user.id,
        start_time,
        end_time
      });

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation: {
          id: newReservation.id,
          reason: newReservation.reason,
          start_time: newReservation.start_time,
          end_time: newReservation.end_time,
          status: newReservation.status,
          created_at: newReservation.created_at,
          space: {
            id: newReservation.spaces.id,
            name: newReservation.spaces.name,
            capacity: newReservation.spaces.capacity
          },
          owner: {
            id: newReservation.users.id,
            name: newReservation.users.name,
            lastname: newReservation.users.lastname,
            username: newReservation.users.username
          }
        }
      });

    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({
        error: 'Failed to create reservation'
      });
    }
  }
);

// PUT /api/reservations/:id/status - Update reservation status (matches C# update endpoint)
router.put('/:id/status', 
  [
    body('status').isIn(['pending', 'confirmed', 'cancelled']).withMessage('Invalid status')
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

      const { id } = req.params;
      const { status } = req.body;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Get current reservation
      let query = supabase
        .from('reservations')
        .select('id, owner_id, status, space_id')
        .eq('id', id);

      const { data: currentReservation, error: fetchError } = await query.single();

      if (fetchError || !currentReservation) {
        return res.status(404).json({
          error: 'Reservation not found'
        });
      }

      // Update reservation status
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .select(`
          id,
          reason,
          start_time,
          end_time,
          status,
          created_at,
          spaces(id, name, capacity),
          users!reservations_owner_id_fkey(id, name, lastname, username)
        `)
        .single();

      if (updateError) {
        console.error('Update reservation error:', updateError);
        return res.status(500).json({
          error: 'Failed to update reservation status'
        });
      }

      // Publish status update via MQTT
      publishReservationUpdate(id, status, {
        space_id: currentReservation.space_id,
        previous_status: currentReservation.status
      });

      res.json({
        message: 'Reservation status updated successfully',
        reservation: {
          id: updatedReservation.id,
          reason: updatedReservation.reason,
          start_time: updatedReservation.start_time,
          end_time: updatedReservation.end_time,
          status: updatedReservation.status,
          created_at: updatedReservation.created_at,
          space: {
            id: updatedReservation.spaces.id,
            name: updatedReservation.spaces.name,
            capacity: updatedReservation.spaces.capacity
          },
          owner: {
            id: updatedReservation.users.id,
            name: updatedReservation.users.name,
            lastname: updatedReservation.users.lastname,
            username: updatedReservation.users.username
          }
        }
      });

    } catch (error) {
      console.error('Update reservation status error:', error);
      res.status(500).json({
        error: 'Failed to update reservation status'
      });
    }
  }
);

// DELETE /api/reservations/:id - Cancel/delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Get current reservation
    let query = supabase
      .from('reservations')
      .select('id, owner_id, status, space_id, start_time')
      .eq('id', id);

    const { data: reservation, error: fetchError } = await query.single();

    if (fetchError || !reservation) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    // Check if reservation can be cancelled
    const reservationStart = parseISO(reservation.start_time);
    if (isBefore(reservationStart, new Date())) {
      return res.status(400).json({
        error: 'Cannot cancel past reservations'
      });
    }

    // Update status to cancelled instead of deleting
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Cancel reservation error:', updateError);
      return res.status(500).json({
        error: 'Failed to cancel reservation'
      });
    }

    // Publish cancellation via MQTT
    publishReservationUpdate(id, 'cancelled', {
      space_id: reservation.space_id,
      previous_status: reservation.status
    });

    res.json({
      message: 'Reservation cancelled successfully',
      reservationId: id
    });

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      error: 'Failed to cancel reservation'
    });
  }
});

module.exports = router; 