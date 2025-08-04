const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// Get current grid layout
router.get('/', async (req, res) => {
  try {
    const { data: gridSettings, error } = await supabase
      .from('grid_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Default grid if none exists
    const defaultGrid = {
      id: null,
      rows: 5,
      cols: 8,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: gridSettings || defaultGrid
    });

  } catch (error) {
    console.error('Error fetching grid settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grid settings',
      error: error.message
    });
  }
});

// Update grid dimensions
router.put('/', [
  authenticateToken,
  requireRole(['admin']),
  body('rows').isInt({ min: 1, max: 20 }).withMessage('Rows must be between 1 and 20'),
  body('cols').isInt({ min: 1, max: 20 }).withMessage('Columns must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { rows, cols } = req.body;

    // Check if grid settings exist
    const { data: existingGrid } = await supabase
      .from('grid_settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existingGrid) {
      // Update existing
      const { data, error } = await supabase
        .from('grid_settings')
        .update({ 
          rows, 
          cols, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingGrid.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('grid_settings')
        .insert({ rows, cols })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log activity
    await logActivity(req.user.id, 'grid_updated', {
      rows,
      cols,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Grid settings updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating grid settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grid settings',
      error: error.message
    });
  }
});

// Get spaces with their grid positions (public endpoint for mobile app)
router.get('/spaces/public', async (req, res) => {
  try {
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('id, name, position_x, position_y, status, capacity')
      .order('position_y')
      .order('position_x');

    if (error) throw error;

    // Get current grid settings
    const { data: gridSettings } = await supabase
      .from('grid_settings')
      .select('rows, cols')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      data: {
        grid: gridSettings || { rows: 5, cols: 8 },
        spaces: spaces || []
      }
    });

  } catch (error) {
    console.error('Error fetching spaces map:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spaces map',
      error: error.message
    });
  }
});

// Get spaces with their grid positions
router.get('/spaces', authenticateToken, async (req, res) => {
  try {
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('id, name, position_x, position_y, status, capacity')
      .order('position_y')
      .order('position_x');

    if (error) throw error;

    console.log('Grid spaces endpoint - Raw spaces data:', spaces);

    // Get current grid settings (use default if table doesn't exist)
    let gridSettings = { rows: 5, cols: 8 };
    try {
      const { data: gridData } = await supabase
        .from('grid_settings')
        .select('rows, cols')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (gridData) {
        gridSettings = gridData;
      }
    } catch (gridError) {
      console.log('Grid settings table not found, using defaults:', gridError.message);
    }

    const response = {
      success: true,
      data: {
        grid: gridSettings,
        spaces: spaces || []
      }
    };

    console.log('Grid spaces endpoint - Response:', response);
    res.json(response);

  } catch (error) {
    console.error('Error fetching spaces map:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spaces map',
      error: error.message
    });
  }
});

// Update space position
router.put('/spaces/:id/position', [
  authenticateToken,
  requireRole(['admin', 'technician']),
  body('position_x').isInt({ min: 0 }).withMessage('Position X must be a non-negative integer'),
  body('position_y').isInt({ min: 0 }).withMessage('Position Y must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const spaceId = parseInt(req.params.id);
    const { position_x, position_y } = req.body;

    // Check if space exists
    const { data: existingSpace, error: checkError } = await supabase
      .from('spaces')
      .select('id, name')
      .eq('id', spaceId)
      .single();

    if (checkError || !existingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Check if position is already occupied
    const { data: occupiedSpace, error: positionError } = await supabase
      .from('spaces')
      .select('id, name')
      .eq('position_x', position_x)
      .eq('position_y', position_y)
      .neq('id', spaceId)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      throw positionError;
    }

    if (occupiedSpace) {
      return res.status(400).json({
        success: false,
        message: `Position (${position_x}, ${position_y}) is already occupied by ${occupiedSpace.name}`
      });
    }

    // Update space position
    const { data: updatedSpace, error: updateError } = await supabase
      .from('spaces')
      .update({ position_x, position_y })
      .eq('id', spaceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await logActivity(req.user.id, 'space_position_updated', {
      space_id: spaceId,
      space_name: existingSpace.name,
      old_position: { x: existingSpace.position_x, y: existingSpace.position_y },
      new_position: { x: position_x, y: position_y },
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Space position updated successfully',
      data: updatedSpace
    });

  } catch (error) {
    console.error('Error updating space position:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating space position',
      error: error.message
    });
  }
});

// Bulk update space positions
router.put('/spaces/positions', [
  authenticateToken,
  requireRole(['admin']),
  body('updates').isArray().withMessage('Updates must be an array'),
  body('updates.*.space_id').isInt().withMessage('Space ID must be an integer'),
  body('updates.*.position_x').isInt({ min: 0 }).withMessage('Position X must be a non-negative integer'),
  body('updates.*.position_y').isInt({ min: 0 }).withMessage('Position Y must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { updates } = req.body;
    const results = [];
    const updateErrors = [];

    for (const update of updates) {
      try {
        const { data, error } = await supabase
          .from('spaces')
          .update({ 
            position_x: update.position_x, 
            position_y: update.position_y 
          })
          .eq('id', update.space_id)
          .select()
          .single();

        if (error) throw error;
        results.push(data);
      } catch (error) {
        updateErrors.push({
          space_id: update.space_id,
          error: error.message
        });
      }
    }

    // Log activity
    await logActivity(req.user.id, 'bulk_space_positions_updated', {
      updates_count: results.length,
      errors_count: updateErrors.length,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: `Updated ${results.length} space positions`,
      data: {
        successful_updates: results,
        errors: updateErrors
      }
    });

  } catch (error) {
    console.error('Error bulk updating space positions:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating space positions',
      error: error.message
    });
  }
});

module.exports = router; 