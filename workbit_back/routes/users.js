const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        lastname,
        username,
        user_id,
        created_at,
        roles(id, name),
        codecards(id, code)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch users'
      });
    }

    // Format response to match expected format
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      role: user.roles?.name || 'user',
      cardCode: user.codecards?.code || null,
      created_at: user.created_at
    }));

    res.json({
      users: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users'
    });
  }
});

// GET /api/users/by-role/:role - Get users by role
router.get('/by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        lastname,
        username,
        user_id,
        created_at,
        roles!inner(id, name),
        codecards(id, code)
      `)
      .eq('roles.name', role)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to fetch users by role'
      });
    }

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      role: user.roles?.name || 'user',
      cardCode: user.codecards?.code || null,
      created_at: user.created_at
    }));

    res.json({
      users: formattedUsers,
      role: role,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users by role'
    });
  }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        lastname,
        username,
        user_id,
        created_at,
        roles(id, name),
        codecards(id, code)
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      role: user.roles?.name || 'user',
      cardCode: user.codecards?.code || null,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user profile'
    });
  }
});

// GET /api/users/:id - Get specific user (admin only)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        lastname,
        username,
        user_id,
        created_at,
        roles(id, name),
        codecards(id, code)
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      role: user.roles?.name || 'user',
      cardCode: user.codecards?.code || null,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user'
    });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', 
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('lastname').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('role').optional().isIn(['user', 'admin', 'technician']).withMessage('Invalid role')
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
      const updates = req.body;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Remove undefined fields
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      // Check if username is being updated and if it's unique
      if (updates.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', updates.username)
          .neq('id', id)
          .single();

        if (existingUser) {
          return res.status(409).json({
            error: 'Username already exists',
            message: 'Username is already taken by another user'
          });
        }
      }

      // Handle role update
      if (updates.role) {
        const { data: role } = await supabase
          .from('roles')
          .select('id')
          .eq('name', updates.role)
          .single();

        if (role) {
          updates.role_id = role.id;
        }
        delete updates.role;
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select(`
          id,
          name,
          lastname,
          username,
          user_id,
          created_at,
          roles(id, name),
          codecards(id, code)
        `)
        .single();

      if (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
          error: 'Failed to update user'
        });
      }

      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          lastname: updatedUser.lastname,
          username: updatedUser.username,
          role: updatedUser.roles?.name || 'user',
          cardCode: updatedUser.codecards?.code || null,
          created_at: updatedUser.created_at
        }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user'
      });
    }
  }
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Check if user exists and get user_id for Supabase Auth cleanup
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username, user_id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete user from our users table
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        error: 'Failed to delete user'
      });
    }

    // Optionally delete from Supabase Auth as well
    // Note: This requires service role key
    if (existingUser.user_id) {
      try {
        await supabase.auth.admin.deleteUser(existingUser.user_id);
      } catch (authError) {
        console.warn('Failed to delete user from Supabase Auth:', authError);
        // Continue even if auth deletion fails
      }
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        username: existingUser.username
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user'
    });
  }
});

// PUT /api/users/:id/card-code - Update user card code (admin only)
router.put('/:id/card-code', 
  authenticateToken, 
  requireRole(['admin']),
  [
    body('cardCode').notEmpty().withMessage('Card code is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation errors',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { cardCode } = req.body;

      if (!supabase) {
        return res.status(500).json({
          error: 'Database connection failed'
        });
      }

      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, lastname')
        .eq('id', id)
        .single();

      if (checkError || !existingUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Check if code card already exists for this user
      const { data: existingCard, error: cardCheckError } = await supabase
        .from('codecards')
        .select('id')
        .eq('user_id', id)
        .single();

      if (cardCheckError && cardCheckError.code !== 'PGRST116') {
        console.error('Error checking existing card:', cardCheckError);
        return res.status(500).json({
          error: 'Failed to check existing card code'
        });
      }

      let result;
      if (existingCard) {
        // Update existing card code
        const { data: updatedCard, error: updateError } = await supabase
          .from('codecards')
          .update({ code: cardCode })
          .eq('user_id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Update card code error:', updateError);
          return res.status(500).json({
            error: 'Failed to update card code'
          });
        }

        result = updatedCard;
      } else {
        // Create new card code
        const { data: newCard, error: createError } = await supabase
          .from('codecards')
          .insert({
            user_id: id,
            code: cardCode
          })
          .select()
          .single();

        if (createError) {
          console.error('Create card code error:', createError);
          return res.status(500).json({
            error: 'Failed to create card code'
          });
        }

        result = newCard;
      }

      res.json({
        message: 'Card code updated successfully',
        cardCode: result.code
      });

    } catch (error) {
      console.error('Update card code error:', error);
      res.status(500).json({
        error: 'Failed to update card code'
      });
    }
  }
);

module.exports = router; 