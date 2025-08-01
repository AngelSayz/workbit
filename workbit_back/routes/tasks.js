const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// GET /api/tasks - Get all tasks (admin/technician only)
router.get('/', 
  authenticateToken, 
  requireRole(['admin', 'technician']),
  async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          assigned_to,
          space_id,
          created_at,
          updated_at,
          spaces(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          error: 'Failed to fetch tasks'
        });
      }

      res.json({
        success: true,
        data: {
          tasks: tasks || [],
          total: tasks ? tasks.length : 0
        }
      });

    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tasks',
        error: error.message
      });
    }
  }
);

// POST /api/tasks - Create new task (admin only)
router.post('/', 
  authenticateToken, 
  requireRole(['admin']),
  [
    body('title').notEmpty().withMessage('Task title is required'),
    body('description').notEmpty().withMessage('Task description is required'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('space_id').isInt().withMessage('Space ID must be a valid integer'),
    body('assigned_to').optional().isInt().withMessage('Assigned user ID must be a valid integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { title, description, priority, space_id, assigned_to } = req.body;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Verify space exists
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('id')
        .eq('id', space_id)
        .single();

      if (spaceError || !space) {
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      // Verify assigned user exists and is a technician (if provided)
      if (assigned_to) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, roles(name)')
          .eq('id', assigned_to)
          .single();

        if (userError || !user) {
          return res.status(404).json({
            success: false,
            message: 'Assigned user not found'
          });
        }

        if (user.roles?.name !== 'technician') {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a technician'
          });
        }
      }

      // Create task
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          priority,
          space_id,
          assigned_to,
          created_by: req.user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Create task error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create task'
        });
      }

      // Log activity
      await logActivity(req.user.id, 'task_created', {
        task_id: newTask.id,
        title: newTask.title,
        space_id: newTask.space_id,
        assigned_to: newTask.assigned_to
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask
      });

    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating task',
        error: error.message
      });
    }
  }
);

// PUT /api/tasks/:id - Update task (admin/technician only)
router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'technician']),
  [
    body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Task description cannot be empty'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('assigned_to').optional().isInt().withMessage('Assigned user ID must be a valid integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const taskId = parseInt(req.params.id);
      const { title, description, priority, status, assigned_to } = req.body;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Check if task exists
      const { data: existingTask, error: checkError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (checkError || !existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Verify assigned user exists and is a technician (if provided)
      if (assigned_to) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, roles(name)')
          .eq('id', assigned_to)
          .single();

        if (userError || !user) {
          return res.status(404).json({
            success: false,
            message: 'Assigned user not found'
          });
        }

        if (user.roles?.name !== 'technician') {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a technician'
          });
        }
      }

      // Update task
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Update task error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update task'
        });
      }

      // Log activity
      await logActivity(req.user.id, 'task_updated', {
        task_id: taskId,
        changes: updateData
      });

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });

    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating task',
        error: error.message
      });
    }
  }
);

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Check if task exists
      const { data: existingTask, error: checkError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (checkError || !existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Delete task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Delete task error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete task'
        });
      }

      // Log activity
      await logActivity(req.user.id, 'task_deleted', {
        task_id: taskId,
        title: existingTask.title
      });

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });

    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting task',
        error: error.message
      });
    }
  }
);

module.exports = router; 