const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { format, parseISO, isValid } = require('date-fns');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { publishSpaceStatus } = require('../config/mqtt');
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

module.exports = router; 