const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const router = express.Router();

// Login validation rules
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// POST /login - Main login endpoint (matches C# backend)
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

    const { username, password } = req.body;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: 'Unable to connect to user database'
      });
    }

    // Get user with role and card information
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        roles(id, name),
        codecards(id, code)
      `)
      .eq('username', username);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to query user database'
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    const user = users[0];

    // Check password (assuming passwords are hashed with bcrypt)
    // Note: If your current passwords are plain text, you'll need to hash them first
    let passwordValid = false;
    
    if (user.password.startsWith('$2')) {
      // Password is already hashed
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password (for migration period)
      passwordValid = password === user.password;
    }

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.roles?.name || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user response (match C# backend format)
    const userResponse = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
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

// POST /api/auth/register - User registration (if needed)
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

    // Check if username or email already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username or email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        lastname,
        username,
        email,
        password: hashedPassword,
        role_id: roles.id,
        card_id: cardId
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create user account'
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: newUser.email
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
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    message: 'Logout successful',
    instruction: 'Please remove the token from client storage'
  });
});

module.exports = router; 