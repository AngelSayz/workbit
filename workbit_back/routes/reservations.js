const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { parseISO, isValid, format, isBefore, isAfter } = require('date-fns');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishReservationUpdate, publishCredentials } = require('../config/mqtt');
const router = express.Router();

// GET /api/reservations/my - Get current user's reservations
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { status, date } = req.query;
    const userId = req.user.id;

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
        spaces(id, name, capacity)
      `)
      .eq('owner_id', userId);

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
        error: 'Failed to fetch user reservations'
      });
    }

    // Format reservations for mobile app compatibility
    const formattedReservations = reservations.map(reservation => ({
      id: reservation.id,
      Reason: reservation.reason,
      StartTime: reservation.start_time,
      EndTime: reservation.end_time,
      Status: reservation.status,
      created_at: reservation.created_at,
      SpaceName: reservation.spaces?.name || 'Espacio no especificado'
    }));

    res.json(formattedReservations);

  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user reservations'
    });
  }
});

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
  authenticateToken,
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
  authenticateToken,
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

// ================= SISTEMA DE CREDENCIALES RFID AUTOMÁTICAS =================

/**
 * @swagger
 * /api/reservations/{id}/credentials:
 *   post:
 *     summary: Enviar credenciales RFID para una reserva
 *     description: Envía automáticamente las credenciales RFID al ESP32 del espacio correspondiente
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorized_cards
 *             properties:
 *               authorized_cards:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 15
 *                 description: Lista de UIDs de tarjetas RFID autorizadas (máximo 15)
 *               master_cards:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de tarjetas maestras (opcional, usa defaults si no se especifica)
 *               force_update:
 *                 type: boolean
 *                 default: false
 *                 description: Forzar actualización incluso si ya existen credenciales
 *     responses:
 *       200:
 *         description: Credenciales enviadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reservation_id:
 *                       type: integer
 *                     space_id:
 *                       type: integer
 *                     authorized_cards:
 *                       type: array
 *                       items:
 *                         type: string
 *                     master_cards:
 *                       type: array
 *                       items:
 *                         type: string
 *                     valid_from:
 *                       type: string
 *                       format: date-time
 *                     valid_until:
 *                       type: string
 *                       format: date-time
 *                     mqtt_published:
 *                       type: boolean
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/credentials', [
  param('id').isInt().withMessage('Reservation ID must be an integer'),
  body('authorized_cards').isArray().withMessage('Authorized cards must be an array'),
  body('authorized_cards.*').isString().withMessage('Card UID must be a string'),
  body('master_cards').optional().isArray().withMessage('Master cards must be an array'),
  body('force_update').optional().isBoolean().withMessage('Force update must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: errors.array()
      });
    }

    const reservationId = parseInt(req.params.id);
    const { 
      authorized_cards, 
      master_cards = ["MASTER001", "MASTER002", "ADMIN123"], 
      force_update = false 
    } = req.body;

    // Validar límite de tarjetas
    if (authorized_cards.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 15 authorized cards allowed per reservation'
      });
    }

    // Validar que las tarjetas no estén vacías
    if (authorized_cards.some(card => !card || !card.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Card UIDs cannot be empty'
      });
    }

    // Obtener información de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        space_id,
        start_time,
        end_time,
        status,
        reason,
        spaces(id, name, capacity),
        users!reservations_owner_id_fkey(id, name, username)
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    // Verificar que la reserva esté activa
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot send credentials for cancelled reservation'
      });
    }

    if (endTime < now && !force_update) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send credentials for past reservation. Use force_update=true to override.'
      });
    }

    // Obtener todas las reservas activas para el mismo espacio
    const { data: spaceReservations, error: spaceReservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        users!reservations_owner_id_fkey(id, username)
      `)
      .eq('space_id', reservation.space_id)
      .eq('status', 'active')
      .gte('end_time', now.toISOString());

    if (spaceReservationsError) {
      console.warn('Warning: Could not fetch other reservations for space', spaceReservationsError);
    }

    // Construir payload de credenciales según especificaciones
    const credentialsPayload = {
      space_id: reservation.space_id,
      reservations: [
        {
          reservation_id: `res_${reservationId}`,
          authorized_cards: authorized_cards,
          valid_from: startTime.toISOString(),
          valid_until: endTime.toISOString(),
          owner: reservation.users?.username || 'unknown'
        }
      ],
      master_cards: master_cards,
      timestamp: new Date().toISOString(),
      expires_at: endTime.toISOString(),
      // Información adicional
      space_info: {
        name: reservation.spaces?.name,
        capacity: reservation.spaces?.capacity
      },
      total_active_reservations: spaceReservations?.length || 1
    };

    // Agregar otras reservas activas si existen
    if (spaceReservations && spaceReservations.length > 1) {
      const otherReservations = spaceReservations
        .filter(r => r.id !== reservationId)
        .map(r => ({
          reservation_id: `res_${r.id}`,
          authorized_cards: [], // Placeholder - en producción esto vendría de otra fuente
          valid_from: r.start_time,
          valid_until: r.end_time,
          owner: r.users?.username || 'unknown'
        }));

      credentialsPayload.reservations.push(...otherReservations);
    }

    // Publicar credenciales por MQTT
    let mqttPublished = false;
    try {
      publishCredentials(reservation.space_id, credentialsPayload);
      mqttPublished = true;
      console.log(`✅ Credentials published for reservation ${reservationId} in space ${reservation.space_id}`);
    } catch (mqttError) {
      console.error('❌ Error publishing credentials via MQTT:', mqttError.message);
    }

    // Log activity
    try {
      if (req.user) {
        const { logActivity } = require('../utils/helpers');
        await logActivity(req.user.id, 'credentials_sent', {
          reservation_id: reservationId,
          space_id: reservation.space_id,
          space_name: reservation.spaces?.name,
          authorized_cards_count: authorized_cards.length,
          master_cards_count: master_cards.length,
          mqtt_published: mqttPublished
        });
      }
    } catch (logError) {
      console.warn('Warning: Could not log activity:', logError.message);
    }

    res.json({
      success: true,
      message: `Credentials sent successfully for reservation in ${reservation.spaces?.name || 'space'}`,
      data: {
        reservation_id: reservationId,
        space_id: reservation.space_id,
        space_name: reservation.spaces?.name,
        authorized_cards: authorized_cards,
        master_cards: master_cards,
        valid_from: startTime.toISOString(),
        valid_until: endTime.toISOString(),
        mqtt_published: mqttPublished,
        mqtt_topic: `workbit/access/credentials/${reservation.space_id}`,
        expires_in_minutes: Math.round((endTime - now) / (1000 * 60)),
        total_reservations_updated: credentialsPayload.reservations.length
      }
    });

  } catch (error) {
    console.error('Error sending credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending credentials',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/reservations/spaces/{spaceId}/credentials:
 *   get:
 *     summary: Obtener credenciales activas de un espacio
 *     description: Retorna todas las credenciales RFID activas para un espacio específico
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *       - in: query
 *         name: include_expired
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir credenciales expiradas
 *     responses:
 *       200:
 *         description: Credenciales obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     space_id:
 *                       type: integer
 *                     active_reservations:
 *                       type: array
 *                     master_cards:
 *                       type: array
 *                     total_authorized_cards:
 *                       type: integer
 *       404:
 *         description: Espacio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/spaces/:spaceId/credentials', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);
    const { include_expired = false } = req.query;

    // Validaciones
    if (isNaN(spaceId) || spaceId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Space ID must be a valid positive integer'
      });
    }

    // Verificar que el espacio existe
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, name, capacity')
      .eq('id', spaceId)
      .single();

    if (spaceError || !space) {
      return res.status(404).json({
        success: false,
        error: 'Space not found'
      });
    }

    // Construir query para reservas
    let reservationsQuery = supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        status,
        reason,
        users!reservations_owner_id_fkey(id, name, username)
      `)
      .eq('space_id', spaceId)
      .eq('status', 'active');

    // Filtrar por tiempo si no se incluyen expiradas
    if (!include_expired) {
      const now = new Date().toISOString();
      reservationsQuery = reservationsQuery.gte('end_time', now);
    }

    const { data: reservations, error: reservationsError } = await reservationsQuery;

    if (reservationsError) {
      throw reservationsError;
    }

    // Simular credenciales (en producción esto vendría de otra tabla/fuente)
    const activeReservations = reservations.map(reservation => ({
      reservation_id: `res_${reservation.id}`,
      owner: reservation.users?.username || 'unknown',
      authorized_cards: [], // Placeholder - necesitaría venir de otra fuente
      valid_from: reservation.start_time,
      valid_until: reservation.end_time,
      is_active: new Date(reservation.end_time) > new Date(),
      minutes_remaining: Math.max(0, Math.round((new Date(reservation.end_time) - new Date()) / (1000 * 60)))
    }));

    const masterCards = ["MASTER001", "MASTER002", "ADMIN123"];
    const totalAuthorizedCards = activeReservations.reduce((sum, res) => sum + res.authorized_cards.length, 0);

    res.json({
      success: true,
      data: {
        space_id: spaceId,
        space_name: space.name,
        space_capacity: space.capacity,
        active_reservations: activeReservations,
        master_cards: masterCards,
        total_authorized_cards: totalAuthorizedCards,
        total_cards: totalAuthorizedCards + masterCards.length,
        max_cards_allowed: 15,
        last_updated: new Date().toISOString(),
        include_expired: include_expired
      }
    });

  } catch (error) {
    console.error('Error fetching space credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching space credentials',
      details: error.message
    });
  }
});

module.exports = router; 