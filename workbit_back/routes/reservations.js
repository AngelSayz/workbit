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

    // Formatear reservaciones para consistencia
    const formattedReservations = (reservations || []).map(reservation => ({
      id: reservation.id,
      reason: reservation.reason,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      created_at: reservation.created_at,
      space: {
        id: reservation.spaces?.id,
        name: reservation.spaces?.name,
        capacity: reservation.spaces?.capacity
      },
      spaces: reservation.spaces, // Mantener compatibilidad con frontend web
      users: reservation.users,   // Mantener compatibilidad con frontend web
      owner: {
        id: reservation.users?.id,
        name: reservation.users?.name,
        lastname: reservation.users?.lastname,
        username: reservation.users?.username
      }
    }));

    res.json({
      reservations: formattedReservations,
      total: formattedReservations.length
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
    body('start_time').isISO8601().withMessage('Valid start time is required (ISO 8601 format)'),
    body('end_time').isISO8601().withMessage('Valid end time is required (ISO 8601 format)'),
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
      
      // Parsear fechas directamente como vienen del frontend
      // El frontend ya envía la hora local como UTC, así que no hay que convertir
      const startTime = parseISO(start_time);
      const endTime = parseISO(end_time);

      console.log('📅 Fechas recibidas (se toman como hora local de Tijuana):');
      console.log('   - Start ISO:', start_time);
      console.log('   - End ISO:', end_time);
      console.log('   - Start parseado:', startTime.toString());
      console.log('   - End parseado:', endTime.toString());

      // Validar fechas
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

      // Crear fecha actual de Tijuana para comparación correcta
      // Como las fechas que recibimos representan hora local de Tijuana,
      // necesitamos crear una fecha "actual" que también represente hora de Tijuana
      const now = new Date();
      const tijuanaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
      
      console.log('⏰ Validación de tiempo:');
      console.log('   - Hora actual UTC del servidor:', now.toISOString());
      console.log('   - Hora actual Tijuana:', tijuanaNow.toString());
      console.log('   - Reserva solicitada para:', startTime.toString());
      console.log('   - ¿Es en el pasado?', isBefore(startTime, tijuanaNow));

      if (isBefore(startTime, tijuanaNow)) {
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
      // Usar las fechas directamente para almacenar y verificar conflictos
      const startTimeISO = startTime.toISOString();
      const endTimeISO = endTime.toISOString();

      console.log('🔍 Verificando conflictos con fechas:');
      console.log('   - Start para DB:', startTimeISO);
      console.log('   - End para DB:', endTimeISO);
      
      const { data: conflictingReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('space_id', space_id)
        .in('status', ['confirmed', 'pending'])
        .or(`and(start_time.lte.${startTimeISO},end_time.gt.${startTimeISO}),and(start_time.lt.${endTimeISO},end_time.gte.${endTimeISO}),and(start_time.gte.${startTimeISO},end_time.lte.${endTimeISO})`);

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
          start_time: startTimeISO,
          end_time: endTimeISO,
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
        console.log('🔍 Resolviendo participantes:', participants);
        
        // Convert usernames to user IDs
        const { data: participantUsers, error: participantError } = await supabase
          .from('users')
          .select('id, username')
          .in('username', participants);

        if (participantError) {
          console.error('Error fetching participant users:', participantError);
          return res.status(400).json({
            error: 'Error validating participants',
            details: participantError.message
          });
        }

        if (participantUsers.length !== participants.length) {
          const foundUsernames = participantUsers.map(u => u.username);
          const missingUsernames = participants.filter(username => !foundUsernames.includes(username));
          return res.status(400).json({
            error: 'Some participants not found',
            missing_participants: missingUsernames
          });
        }

        const participantInserts = participantUsers.map(user => ({
          reservation_id: newReservation.id,
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('reservation_participants')
          .insert(participantInserts);

        if (insertError) {
          console.error('Error inserting participants:', insertError);
          return res.status(500).json({
            error: 'Error adding participants',
            details: insertError.message
          });
        }

        console.log(`✅ Agregados ${participantUsers.length} participantes`);
      }

      // Publish reservation creation via MQTT
      publishReservationUpdate(newReservation.id, 'created', {
        space_id: space_id,
        owner_id: req.user.id,
        start_time,
        end_time
      });

      // Publish updated credentials to the access control module
      try {
        const spaceCredentials = await getSpaceCredentials(space_id);
        publishCredentials(space_id, spaceCredentials);
        console.log(`✅ Credenciales actualizadas para espacio ${space_id}`);
      } catch (credentialsError) {
        console.error('Error publishing credentials:', credentialsError);
        // No fallar la reserva si las credenciales fallan
      }

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

      // Update credentials for the access control module
      try {
        const spaceCredentials = await getSpaceCredentials(currentReservation.space_id);
        publishCredentials(currentReservation.space_id, spaceCredentials);
        console.log(`✅ Credenciales actualizadas tras cambio de estado para espacio ${currentReservation.space_id}`);
      } catch (credentialsError) {
        console.error('Error publishing credentials after status update:', credentialsError);
      }

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
    const nowUTC = new Date();
    const tijuanaNow = new Date(nowUTC.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
    
    if (isBefore(reservationStart, tijuanaNow)) {
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

    // Update credentials for the access control module
    try {
      const spaceCredentials = await getSpaceCredentials(reservation.space_id);
      publishCredentials(reservation.space_id, spaceCredentials);
      console.log(`✅ Credenciales actualizadas tras cancelación para espacio ${reservation.space_id}`);
    } catch (credentialsError) {
      console.error('Error publishing credentials after cancellation:', credentialsError);
    }

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

    // Verificar que la reserva esté activa (usar zona horaria de Tijuana)
    const now = zonedTimeToUtc(new Date(), 'America/Tijuana');
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

    // Filtrar por tiempo si no se incluyen expiradas (usar zona horaria de Tijuana)
    if (!include_expired) {
      const now = zonedTimeToUtc(new Date(), 'America/Tijuana').toISOString();
      reservationsQuery = reservationsQuery.gte('end_time', now);
    }

    const { data: reservations, error: reservationsError } = await reservationsQuery;

    if (reservationsError) {
      throw reservationsError;
    }

    // Simular credenciales (en producción esto vendría de otra tabla/fuente)
    // Usar hora de Tijuana para calcular tiempo restante
    const nowTijuana = zonedTimeToUtc(new Date(), 'America/Tijuana');
    const activeReservations = reservations.map(reservation => ({
      reservation_id: `res_${reservation.id}`,
      owner: reservation.users?.username || 'unknown',
      authorized_cards: [], // Placeholder - necesitaría venir de otra fuente
      valid_from: reservation.start_time,
      valid_until: reservation.end_time,
      is_active: new Date(reservation.end_time) > nowTijuana,
      minutes_remaining: Math.max(0, Math.round((new Date(reservation.end_time) - nowTijuana) / (1000 * 60)))
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

// GET /api/reservations/credentials/:spaceId - Get and publish credentials for a specific space
router.get('/credentials/:spaceId', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    const { spaceId } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    console.log(`🔍 Solicitud manual de credenciales para espacio ${spaceId}`);

    // Get credentials
    const credentials = await getSpaceCredentials(parseInt(spaceId));
    
    // Publish to MQTT
    publishCredentials(spaceId, credentials);
    
    res.json({
      success: true,
      message: `Credentials retrieved and published for space ${spaceId}`,
      data: {
        space_id: parseInt(spaceId),
        reservations_count: credentials.reservations.length,
        master_cards_count: credentials.master_cards.length,
        expires_at: credentials.expires_at,
        credentials: credentials
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

// POST /api/reservations/credentials/sync-all - Sync credentials for all spaces with active reservations
router.post('/credentials/sync-all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    console.log('🔄 Iniciando sincronización completa de credenciales...');

    // Get all spaces with active reservations (usar zona horaria de Tijuana)
    const { data: activeSpaces, error: spacesError } = await supabase
      .from('reservations')
      .select('space_id')
      .eq('status', 'confirmed')
      .gte('end_time', zonedTimeToUtc(new Date(), 'America/Tijuana').toISOString());

    if (spacesError) {
      throw spacesError;
    }

    // Get unique space IDs
    const uniqueSpaceIds = [...new Set(activeSpaces.map(r => r.space_id))];
    console.log(`📋 Sincronizando ${uniqueSpaceIds.length} espacios con reservas activas`);

    const results = [];
    
    for (const spaceId of uniqueSpaceIds) {
      try {
        const credentials = await getSpaceCredentials(spaceId);
        publishCredentials(spaceId, credentials);
        
        results.push({
          space_id: spaceId,
          success: true,
          reservations_count: credentials.reservations.length,
          master_cards_count: credentials.master_cards.length
        });
        
        console.log(`✅ Credenciales sincronizadas para espacio ${spaceId}`);
      } catch (error) {
        console.error(`❌ Error sincronizando espacio ${spaceId}:`, error);
        results.push({
          space_id: spaceId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Credentials synchronization completed',
      spaces_processed: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error in credentials sync:', error);
    res.status(500).json({
      success: false,
      error: 'Error synchronizing credentials',
      details: error.message
    });
  }
});

// Function to get complete credentials for a space (including cards)
async function getSpaceCredentials(spaceId) {
  try {
    console.log(`🔍 Obteniendo credenciales para espacio ${spaceId}`);

    // Get all active reservations for this space
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        owner_id,
        users!owner_id(
          id,
          username,
          codecards(code)
        )
      `)
      .eq('space_id', spaceId)
      .eq('status', 'confirmed')
      .gte('end_time', zonedTimeToUtc(new Date(), 'America/Tijuana').toISOString())
      .order('start_time', { ascending: true });

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      throw reservationsError;
    }

    console.log(`📋 Encontradas ${reservations?.length || 0} reservas activas`);

    // Get participants for each reservation
    const credentialsData = [];
    
    for (const reservation of (reservations || [])) {
      console.log(`🔍 Procesando reserva ${reservation.id}`);
      
      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('reservation_participants')
        .select(`
          users(
            id,
            username,
            codecards(code)
          )
        `)
        .eq('reservation_id', reservation.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        continue;
      }

      // Collect all authorized cards (owner + participants)
      const authorizedCards = [];
      
      // Add owner's card
      if (reservation.users?.codecards?.code) {
        authorizedCards.push(reservation.users.codecards.code);
        console.log(`🪪 Tarjeta del propietario: ${reservation.users.codecards.code}`);
      }
      
      // Add participants' cards
      for (const participant of (participants || [])) {
        if (participant.users?.codecards?.code) {
          authorizedCards.push(participant.users.codecards.code);
          console.log(`🪪 Tarjeta del participante: ${participant.users.codecards.code}`);
        }
      }

      if (authorizedCards.length > 0) {
        credentialsData.push({
          reservation_id: reservation.id.toString(),
          authorized_cards: authorizedCards,
          valid_from: reservation.start_time,
          valid_until: reservation.end_time,
          owner: reservation.users?.username || 'unknown'
        });
        
        console.log(`✅ Credencial agregada: ${reservation.id} con ${authorizedCards.length} tarjetas`);
      } else {
        console.log(`⚠️ Reserva ${reservation.id} sin tarjetas RFID`);
      }
    }

    // Get master cards (admin and technician roles)
    // role_id: 2 = technician, 3 = admin
    const { data: masterUsers, error: masterError } = await supabase
      .from('users')
      .select(`
        codecards(code),
        role_id
      `)
      .in('role_id', [2, 3])
      .not('codecards.code', 'is', null);

    if (masterError) {
      console.error('Error fetching master cards:', masterError);
    }

    const masterCards = (masterUsers || [])
      .filter(user => user.codecards?.code)
      .map(user => user.codecards.code);

    console.log(`🔑 Encontradas ${masterCards.length} tarjetas maestras (role_id 2-3)`);
    if (masterUsers?.length > 0) {
      masterUsers.forEach(user => {
        if (user.codecards?.code) {
          const roleType = user.role_id === 2 ? 'technician' : user.role_id === 3 ? 'admin' : 'unknown';
          console.log(`  🔑 ${roleType}: ${user.codecards.code}`);
        }
      });
    }

    // Calculate expiration (24 hours from now, usar hora de Tijuana)
    const expiresAt = zonedTimeToUtc(new Date(), 'America/Tijuana');
    expiresAt.setHours(expiresAt.getHours() + 24);

    const credentials = {
      reservations: credentialsData,
      master_cards: masterCards.length > 0 ? masterCards : ["MASTER001", "MASTER002", "ADMIN123"],
      expires_at: expiresAt.toISOString()
    };

    console.log(`📊 Credenciales completas: ${credentialsData.length} reservas, ${masterCards.length} tarjetas maestras (admin/tech)`);
    return credentials;

  } catch (error) {
    console.error('Error getting space credentials:', error);
    throw error;
  }
}

// ================= AUTO-CONFIRMACIÓN DE RESERVAS =================

// GET /api/reservations/:id/environmental-data - Obtener datos ambientales de una reserva activa
router.get('/:id/environmental-data', async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const { hours = 2 } = req.query; // Por defecto últimas 2 horas

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
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
        spaces(id, name, capacity)
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    // Verificar que la reserva esté activa o próxima a activarse
    // Usar hora de Tijuana para comparación correcta
    const nowUTC = new Date();
    const now = new Date(nowUTC.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    
    console.log('⏰ Validación de reserva activa:');
    console.log('   - Hora actual UTC servidor:', nowUTC.toISOString());
    console.log('   - Hora actual Tijuana:', now.toString());
    console.log('   - Inicio reserva:', startTime.toString());
    console.log('   - Fin reserva:', endTime.toString());
    console.log('   - ¿Está en horario?', (now >= startTime && now <= endTime));
    
    const isActive = (reservation.status === 'confirmed' || reservation.status === 'pending') && 
                     now >= startTime && now <= endTime;

    if (!isActive) {
      return res.status(400).json({
        success: false,
        error: 'Reservation is not currently active',
        details: {
          status: reservation.status,
          current_time: now.toISOString(),
          start_time: reservation.start_time,
          end_time: reservation.end_time
        }
      });
    }

    // Obtener datos ambientales del espacio
    try {
      // Importar el modelo de SensorReading desde sensors.js
      const SensorReading = require('mongoose').model('SensorReading');
      
      // Obtener lecturas de las últimas X horas
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // Obtener lecturas más recientes por tipo de sensor
      const latestReadings = await SensorReading.aggregate([
        { 
          $match: { 
            space_id: reservation.space_id,
            timestamp: { $gte: hoursAgo }
          } 
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$sensor_type',
            latest_reading: { $first: '$$ROOT' }
          }
        }
      ]);

      // Obtener datos históricos para gráficos (últimas 2 horas, un punto cada 10 minutos)
      const historicalData = await SensorReading.aggregate([
        { 
          $match: { 
            space_id: reservation.space_id,
            timestamp: { $gte: hoursAgo }
          } 
        },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              sensor_type: '$sensor_type',
              interval: {
                $subtract: [
                  '$timestamp',
                  { $mod: [{ $toLong: '$timestamp' }, 10 * 60 * 1000] } // Agrupar por intervalos de 10 minutos
                ]
              }
            },
            avg_value: { $avg: '$value' },
            timestamp: { $first: '$timestamp' },
            unit: { $first: '$unit' }
          }
        },
        { $sort: { '_id.interval': 1 } }
      ]);

      // Si no hay lecturas de sensores en absoluto, retornar que no hay datos
      if (latestReadings.length === 0) {
        return res.json({
          success: true,
          data: null,
          reservation: {
            id: reservation.id,
            space_id: reservation.space_id,
            space_name: reservation.spaces?.name,
            status: reservation.status,
            reason: reservation.reason,
            active_until: reservation.end_time
          },
          message: 'No hay sensores enviando datos para este espacio'
        });
      }

      // Formatear datos ambientales actuales
      const environmentalData = {
        space_id: reservation.space_id,
        space_name: reservation.spaces?.name,
        reservation_id: reservationId,
        last_updated: new Date().toISOString(),
        sensors: {},
        historical: {}
      };

      // Procesar lecturas más recientes
      latestReadings.forEach(reading => {
        const sensor = reading.latest_reading;
        environmentalData.sensors[sensor.sensor_type] = {
          value: sensor.value,
          unit: sensor.unit,
          timestamp: sensor.timestamp,
          quality: sensor.quality || 'good',
          device_id: sensor.device_id
        };
      });

      // Procesar datos históricos para gráficos
      const sensorTypes = ['temperature', 'humidity', 'co2'];
      sensorTypes.forEach(sensorType => {
        const sensorHistorical = historicalData.filter(h => h._id.sensor_type === sensorType);
        if (sensorHistorical.length > 0) {
          environmentalData.historical[sensorType] = sensorHistorical.map(h => ({
            value: Math.round(h.avg_value * 10) / 10, // Redondear a 1 decimal
            timestamp: h.timestamp,
            unit: h.unit
          }));
        }
      });

      res.json({
        success: true,
        data: environmentalData,
        reservation: {
          id: reservation.id,
          space_id: reservation.space_id,
          space_name: reservation.spaces?.name,
          status: reservation.status,
          reason: reservation.reason,
          active_until: reservation.end_time
        }
      });

    } catch (sensorError) {
      console.warn('Warning: Could not fetch sensor data:', sensorError.message);
      
      // Retornar que no hay datos disponibles en lugar de simular
      res.json({
        success: true,
        data: null, // No hay datos disponibles
        reservation: {
          id: reservation.id,
          space_id: reservation.space_id,
          space_name: reservation.spaces?.name,
          status: reservation.status,
          reason: reservation.reason,
          active_until: reservation.end_time
        },
        message: 'No hay datos ambientales disponibles en este momento'
      });
    }

  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environmental data',
      details: error.message
    });
  }
});

/**
 * Auto-confirma reservas pendientes después de 5 minutos
 * En producción se puede cambiar el tiempo o cancelarlas automáticamente
 */
async function autoConfirmPendingReservations() {
  try {
    // Usar hora de Tijuana para calcular 5 minutos atrás
    const nowTijuana = zonedTimeToUtc(new Date(), 'America/Tijuana');
    const fiveMinutesAgo = new Date(nowTijuana.getTime() - 5 * 60 * 1000).toISOString();
    
    // Buscar reservas pendientes creadas hace más de 5 minutos
    const { data: pendingReservations, error } = await supabase
      .from('reservations')
      .select(`
        id,
        reason,
        start_time,
        end_time,
        space_id,
        created_at,
        spaces(name),
        users!reservations_owner_id_fkey(username)
      `)
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (error) {
      console.error('Error fetching pending reservations:', error);
      return;
    }

    if (!pendingReservations || pendingReservations.length === 0) {
      return; // No hay reservas pendientes para auto-confirmar
    }

    console.log(`🔄 Auto-confirmando ${pendingReservations.length} reservas pendientes...`);

    // Auto-confirmar cada reserva
    for (const reservation of pendingReservations) {
      try {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'confirmed' })
          .eq('id', reservation.id);

        if (updateError) {
          console.error(`❌ Error auto-confirmando reserva ${reservation.id}:`, updateError);
          continue;
        }

        // Publicar actualización por MQTT
        publishReservationUpdate(reservation.id, 'confirmed', {
          space_id: reservation.space_id,
          previous_status: 'pending',
          auto_confirmed: true
        });

        // Actualizar credenciales del espacio
        try {
          const spaceCredentials = await getSpaceCredentials(reservation.space_id);
          publishCredentials(reservation.space_id, spaceCredentials);
        } catch (credError) {
          console.warn(`⚠️ Error actualizando credenciales para espacio ${reservation.space_id}:`, credError.message);
        }

        console.log(`✅ Auto-confirmada reserva ${reservation.id} en ${reservation.spaces?.name} para ${reservation.users?.username}`);

      } catch (reservationError) {
        console.error(`❌ Error procesando reserva ${reservation.id}:`, reservationError);
      }
    }

    console.log(`🎉 Auto-confirmación completada: ${pendingReservations.length} reservas procesadas`);

  } catch (error) {
    console.error('❌ Error en auto-confirmación de reservas:', error);
  }
}

// Ejecutar auto-confirmación cada 2 minutos
setInterval(autoConfirmPendingReservations, 2 * 60 * 1000);

// Ejecutar una vez al iniciar el servidor
setTimeout(autoConfirmPendingReservations, 30 * 1000); // Esperar 30 segundos después del inicio

module.exports = router; 