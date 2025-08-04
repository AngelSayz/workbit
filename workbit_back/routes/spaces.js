const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { format, parseISO, isValid } = require('date-fns');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishSpaceStatus, publishPeopleCount, publishAlert } = require('../config/mqtt');
const DeviceReading = require('../models/DeviceReading');
const Alert = require('../models/Alert');
const router = express.Router();

// POST /api/spaces - Create new space (admin only)
router.post('/', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { name, capacity, status, position_x, position_y } = req.body;

      // Validaciones básicas
      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Space name is required'
        });
      }

      if (!capacity || capacity < 1 || capacity > 8) {
        return res.status(400).json({
          error: 'Capacity must be between 1 and 8'
        });
      }

      const validStatuses = ['available', 'unavailable', 'occupied', 'reserved', 'maintenance'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses
        });
      }

      if (typeof position_x !== 'number' || typeof position_y !== 'number') {
        return res.status(400).json({
          error: 'Position coordinates must be numbers'
        });
      }

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Verificar si ya existe un espacio en esa posición
      const { data: existingSpace, error: checkError } = await supabase
        .from('spaces')
        .select('id')
        .eq('position_x', position_x)
        .eq('position_y', position_y)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Check existing space error:', checkError);
        return res.status(500).json({
          error: 'Failed to check existing space'
        });
      }

      if (existingSpace) {
        return res.status(409).json({
          error: 'A space already exists at this position'
        });
      }

      // Crear el nuevo espacio
      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert({
          name: name.trim(),
          capacity,
          status,
          position_x,
          position_y,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Create space error:', error);
        return res.status(500).json({
          error: 'Failed to create space'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Space created successfully',
        space: newSpace
      });

    } catch (error) {
      console.error('Create space error:', error);
      res.status(500).json({
        error: 'Failed to create space'
      });
    }
  }
);

// GET /api/spaces - Get all spaces
router.get('/', async (req, res) => {
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

// GET /api/spaces/public - Public endpoint for mobile app
router.get('/public', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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

// PUT /api/spaces/:id - Update space (admin/technician only)
router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'technician']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, capacity, status } = req.body;

      // Validaciones básicas
      if (name && !name.trim()) {
        return res.status(400).json({
          error: 'Space name cannot be empty'
        });
      }

      if (capacity && (capacity < 1 || capacity > 10)) {
        return res.status(400).json({
          error: 'Capacity must be between 1 and 10'
        });
      }

      if (status) {
        const validStatuses = ['available', 'unavailable', 'occupied', 'reserved', 'maintenance'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: 'Invalid status',
            validStatuses
          });
        }
      }

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Preparar datos para actualización
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (capacity !== undefined) updateData.capacity = capacity;
      if (status !== undefined) updateData.status = status;

      const { data: updatedSpace, error } = await supabase
        .from('spaces')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update space error:', error);
        return res.status(500).json({
          error: 'Failed to update space'
        });
      }

      if (!updatedSpace) {
        return res.status(404).json({
          error: 'Space not found'
        });
      }

      // Publish status update via MQTT if status changed
      if (status) {
        publishSpaceStatus(id, status);
      }

      res.json({
        success: true,
        message: 'Space updated successfully',
        space: updatedSpace
      });

    } catch (error) {
      console.error('Update space error:', error);
      res.status(500).json({
        error: 'Failed to update space'
      });
    }
  }
);

// PUT /api/spaces/:id/position - Update space position (admin/technician only)
router.put('/:id/position', 
  authenticateToken, 
  requireRole(['admin', 'technician']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { position_x, position_y } = req.body;

      // Validaciones básicas
      if (typeof position_x !== 'number' || typeof position_y !== 'number') {
        return res.status(400).json({
          error: 'Position coordinates must be numbers'
        });
      }

      if (position_x < 0 || position_x > 7 || position_y < 0 || position_y > 4) {
        return res.status(400).json({
          error: 'Position coordinates must be within grid bounds (0-7 for X, 0-4 for Y)'
        });
      }

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Verificar si ya existe un espacio en esa posición (excluyendo el espacio actual)
      const { data: existingSpace, error: checkError } = await supabase
        .from('spaces')
        .select('id, name')
        .eq('position_x', position_x)
        .eq('position_y', position_y)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Check existing space error:', checkError);
        return res.status(500).json({
          error: 'Failed to check existing space'
        });
      }

      if (existingSpace) {
        return res.status(409).json({
          error: `A space already exists at this position (${existingSpace.name})`
        });
      }

      // Actualizar la posición
      const { data: updatedSpace, error } = await supabase
        .from('spaces')
        .update({ 
          position_x, 
          position_y
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update space position error:', error);
        return res.status(500).json({
          error: 'Failed to update space position'
        });
      }

      if (!updatedSpace) {
        return res.status(404).json({
          error: 'Space not found'
        });
      }

      res.json({
        success: true,
        message: 'Space position updated successfully',
        space: updatedSpace
      });

    } catch (error) {
      console.error('Update space position error:', error);
      res.status(500).json({
        error: 'Failed to update space position'
      });
    }
  }
);

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
        .update({ 
          status
        })
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
        success: true,
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
router.get('/status/summary', async (req, res) => {
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

/**
 * @swagger
 * components:
 *   schemas:
 *     SpaceUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del espacio
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Capacidad de personas
 *         status:
 *           type: string
 *           enum: [available, unavailable, occupied, reserved, maintenance]
 *           description: Estado del espacio
 *     SpacePosition:
 *       type: object
 *       required:
 *         - position_x
 *         - position_y
 *       properties:
 *         position_x:
 *           type: integer
 *           minimum: 0
 *           maximum: 7
 *           description: Posición X en el grid
 *         position_y:
 *           type: integer
 *           minimum: 0
 *           maximum: 4
 *           description: Posición Y en el grid
 * 
 * /api/spaces/{id}:
 *   put:
 *     summary: Actualizar espacio
 *     description: Actualiza la información de un espacio (nombre, capacidad, estado)
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpaceUpdate'
 *     responses:
 *       200:
 *         description: Espacio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 space:
 *                   $ref: '#/components/schemas/Space'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Espacio no encontrado
 *       500:
 *         description: Error del servidor
 * 
 * /api/spaces/{id}/position:
 *   put:
 *     summary: Actualizar posición del espacio
 *     description: Cambia la posición de un espacio en el grid
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpacePosition'
 *     responses:
 *       200:
 *         description: Posición actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 space:
 *                   $ref: '#/components/schemas/Space'
 *       400:
 *         description: Coordenadas inválidas
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Espacio no encontrado
 *       409:
 *         description: Ya existe un espacio en esa posición
 *       500:
 *         description: Error del servidor
 */

// ================= SISTEMA CENTRALIZADO DE CONTEO DE PERSONAS =================

/**
 * @swagger
 * /api/spaces/{id}/people-count:
 *   put:
 *     summary: Actualizar conteo de personas en espacio
 *     description: Actualiza el conteo de personas de un espacio específico y valida capacidad
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - people_count
 *               - event
 *             properties:
 *               people_count:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 8
 *                 description: Número actual de personas en el espacio
 *               event:
 *                 type: string
 *                 enum: [entry, exit, update, manual]
 *                 description: Tipo de evento que causó el cambio
 *               device_id:
 *                 type: string
 *                 description: ID del dispositivo que reportó el cambio
 *     responses:
 *       200:
 *         description: Conteo actualizado exitosamente
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
 *                     space_id:
 *                       type: integer
 *                     previous_count:
 *                       type: integer
 *                     current_count:
 *                       type: integer
 *                     event:
 *                       type: string
 *                     capacity_status:
 *                       type: string
 *                       enum: [normal, near_full, full, exceeded]
 *                     alert_generated:
 *                       type: boolean
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Espacio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/people-count', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.id);
    const { people_count, event = 'update', device_id } = req.body;

    // Validaciones
    if (isNaN(spaceId) || spaceId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Space ID must be a valid positive integer'
      });
    }

    if (typeof people_count !== 'number' || people_count < 0 || people_count > 8) {
      return res.status(400).json({
        success: false,
        error: 'People count must be a number between 0 and 8'
      });
    }

    const validEvents = ['entry', 'exit', 'update', 'manual'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type',
        validEvents
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

    // Obtener conteo anterior
    const previousReading = await DeviceReading.findOne({
      space_id: spaceId,
      'readings.sensor_type': 'infrared_pair'
    }).sort({ timestamp: -1 });

    const previousCount = previousReading?.people_count || 0;

    // Determinar estado de capacidad
    const maxCapacity = space.capacity || 8;
    let capacityStatus = 'normal';
    let alertGenerated = false;

    if (people_count > maxCapacity) {
      capacityStatus = 'exceeded';
      alertGenerated = true;
      
      // Generar alerta de capacidad excedida
      await Alert.createSpaceAlert({
        space_id: spaceId,
        alert_type: 'capacity_exceeded',
        severity: 'high',
        value: people_count,
        message: `Capacidad excedida en ${space.name}: ${people_count} personas (máximo ${maxCapacity})`,
        device_id,
        people_count
      });

      // Publicar alerta por MQTT
      publishAlert(spaceId, {
        alert_type: 'capacity_exceeded',
        value: people_count,
        message: `Capacidad excedida: ${people_count} personas`,
        severity: 'high',
        device_id
      });

    } else if (people_count === maxCapacity) {
      capacityStatus = 'full';
    } else if (people_count >= maxCapacity * 0.8) {
      capacityStatus = 'near_full';
    }

    // Crear nuevo reading con conteo actualizado
    const reading = {
      sensor_name: 'Presencia',
      sensor_type: 'infrared_pair',
      value: people_count,
      unit: 'personas',
      event: event,
      quality: people_count <= maxCapacity ? 'good' : 'critical'
    };

    const deviceReading = new DeviceReading({
      device_id: device_id || 'manual_update',
      space_id: spaceId,
      readings: [reading],
      people_count: people_count,
      last_people_update: new Date(),
      device_status: 'online',
      raw_data: { event, source: 'api_update' }
    });

    await deviceReading.save();

    // Publicar actualización por MQTT
    publishPeopleCount(spaceId, people_count, event);

    // Log activity si hay usuario autenticado
    try {
      if (req.user) {
        const { logActivity } = require('../utils/helpers');
        await logActivity(req.user.id, 'people_count_updated', {
          space_id: spaceId,
          space_name: space.name,
          previous_count: previousCount,
          new_count: people_count,
          event: event,
          capacity_status: capacityStatus
        });
      }
    } catch (logError) {
      console.warn('Warning: Could not log activity:', logError.message);
    }

    console.log(`✅ People count updated for space ${spaceId}: ${previousCount} → ${people_count} (${event})`);

    res.json({
      success: true,
      message: `People count updated successfully for ${space.name}`,
      data: {
        space_id: spaceId,
        space_name: space.name,
        previous_count: previousCount,
        current_count: people_count,
        event: event,
        capacity_status: capacityStatus,
        max_capacity: maxCapacity,
        occupancy_percentage: Math.round((people_count / maxCapacity) * 100),
        alert_generated: alertGenerated,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating people count:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating people count',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/spaces/{id}/alerts:
 *   get:
 *     summary: Obtener alertas de un espacio
 *     description: Retorna las alertas activas e históricas de un espacio específico
 *     tags: [Spaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del espacio
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *         description: Filtrar por alertas resueltas/no resueltas
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filtrar por severidad
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de alertas a retornar
 *     responses:
 *       200:
 *         description: Alertas obtenidas exitosamente
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
 *                     space_info:
 *                       type: object
 *                     alerts:
 *                       type: array
 *                     active_count:
 *                       type: integer
 *                     total_count:
 *                       type: integer
 *       404:
 *         description: Espacio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/alerts', async (req, res) => {
  try {
    const spaceId = parseInt(req.params.id);
    const { resolved, severity, limit = 50 } = req.query;

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

    // Construir filtros
    let filter = { space_id: spaceId };
    
    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }
    
    if (severity) {
      filter.severity = severity;
    }

    // Obtener alertas
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Obtener conteo de alertas activas
    const activeCount = await Alert.countDocuments({
      space_id: spaceId,
      resolved: false
    });

    res.json({
      success: true,
      data: {
        space_info: {
          id: space.id,
          name: space.name,
          capacity: space.capacity
        },
        alerts: alerts,
        active_count: activeCount,
        total_count: alerts.length,
        filters_applied: {
          resolved: resolved !== undefined ? (resolved === 'true') : 'all',
          severity: severity || 'all',
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching space alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching space alerts',
      details: error.message
    });
  }
});

module.exports = router; 