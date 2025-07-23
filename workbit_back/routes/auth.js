const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const router = express.Router();

// Login validation rules for Supabase Auth
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// POST /login - Main login endpoint using Supabase Auth
router.post('/', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: 'Unable to connect to authentication service'
      });
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!authData.user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to authenticate user'
      });
    }

    // Get user profile data from our users table using the auth user_id
    const { data: users, error: userError } = await supabase
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
      .eq('user_id', authData.user.id);

    if (userError) {
      console.error('Database error:', userError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to query user database'
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User profile not found in system'
      });
    }

    const user = users[0];

    // Generate JWT token for our internal API
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.roles?.name || 'user',
        supabaseUserId: authData.user.id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user response
    const userResponse = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      email: authData.user.email,
      role: user.roles?.name || 'user',
      cardCode: user.codecards?.code || null,
      created_at: user.created_at
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/login - Alternative endpoint
router.post('/login', loginValidation, async (req, res) => {
  // Redirect to main login handler
  req.url = '/';
  return router.handle(req, res);
});

// POST /api/auth/register - User registration with Supabase Auth
router.post('/register', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('lastname').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cardCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, lastname, username, email, password, cardCode } = req.body;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Check if username already exists in our users table
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username')
      .eq('username', username);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Username is already taken'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'Failed to create user account'
      });
    }

    // Get default role (user)
    const { data: roles } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    if (!roles) {
      return res.status(500).json({
        error: 'Default role not found'
      });
    }

    // Handle card code
    let cardId = null;
    if (cardCode) {
      const { data: card } = await supabase
        .from('codecards')
        .select('id')
        .eq('code', cardCode)
        .single();
      
      if (card) {
        cardId = card.id;
      }
    }

    // Create user profile in our users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        lastname,
        username,
        user_id: authData.user.id,
        role_id: roles.id,
        card_id: cardId
      })
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      
      // If user profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create user profile'
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: authData.user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // If user is authenticated with Supabase, sign them out
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token && supabase) {
      // We could add additional logout logic here if needed
      // For now, just return success since JWT tokens are stateless
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error during logout'
    });
  }
});

module.exports = router; 