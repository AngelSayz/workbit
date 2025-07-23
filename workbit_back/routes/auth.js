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
  console.log('Registration request received:', req.body);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, lastname, username, email, password, cardCode } = req.body;
    console.log('Processing registration for:', { name, lastname, username, email });

    if (!supabase) {
      console.error('Supabase not configured');
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Check if username already exists in our users table
    console.log('Checking for existing username...');
    const { data: existingUsers, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username);

    if (usernameCheckError) {
      console.error('Username check error:', usernameCheckError);
      return res.status(500).json({
        error: 'Database error during username check',
        message: usernameCheckError.message
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('Username already exists:', username);
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Username is already taken'
      });
    }

    // Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message
      });
    }

    if (!authData.user) {
      console.error('No user data returned from Supabase');
      return res.status(400).json({
        error: 'Registration failed',
        message: 'Failed to create user account'
      });
    }

    console.log('User created in Supabase Auth:', authData.user.id);

    // Get default role (user)
    console.log('Getting default role...');
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    if (roleError) {
      console.error('Role lookup error:', roleError);
      return res.status(500).json({
        error: 'Default role lookup failed',
        message: roleError.message
      });
    }

    if (!roles) {
      console.error('Default role not found');
      return res.status(500).json({
        error: 'Default role not found'
      });
    }

    console.log('Default role found:', roles.id);

    // Handle card code - auto-generate if not provided
    let cardId = null;
    let finalCardCode = cardCode;
    
    if (!cardCode) {
      console.log('Auto-generating card code...');
      // Auto-generate a unique card code
      const generateCardCode = () => {
        const prefix = 'WB';
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${randomPart}`;
      };

      let attempts = 0;
      let isUnique = false;
      
      while (!isUnique && attempts < 10) {
        finalCardCode = generateCardCode();
        console.log(`Checking card code uniqueness (attempt ${attempts + 1}):`, finalCardCode);
        
        // Check if this code already exists
        const { data: existingCard, error: cardCheckError } = await supabase
          .from('codecards')
          .select('id')
          .eq('code', finalCardCode)
          .single();
        
        if (cardCheckError && cardCheckError.code === 'PGRST116') {
          // No rows returned - code is unique
          isUnique = true;
        } else if (cardCheckError) {
          console.error('Card check error:', cardCheckError);
          break;
        } else if (!existingCard) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        console.error('Could not generate unique card code after 10 attempts');
        return res.status(500).json({
          error: 'Could not generate unique card code'
        });
      }
      
      console.log('Generated unique card code:', finalCardCode);
    }

    // Create or find card
    if (finalCardCode) {
      console.log('Creating/finding card with code:', finalCardCode);
      // Try to find existing card first
      const { data: existingCard, error: existingCardError } = await supabase
        .from('codecards')
        .select('id')
        .eq('code', finalCardCode)
        .single();
      
      if (existingCardError && existingCardError.code !== 'PGRST116') {
        console.error('Error checking existing card:', existingCardError);
      } else if (existingCard) {
        console.log('Using existing card:', existingCard.id);
        cardId = existingCard.id;
      } else {
        console.log('Creating new card...');
        // Create new card
        const { data: newCard, error: cardError } = await supabase
          .from('codecards')
          .insert({ code: finalCardCode })
          .select('id')
          .single();
        
        if (cardError) {
          console.error('Error creating card:', cardError);
          // Continue without card if creation fails
        } else {
          console.log('Card created:', newCard.id);
          cardId = newCard.id;
        }
      }
    }

    // Create user profile in our users table
    console.log('Creating user profile...');
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
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create user profile'
      });
    }

    console.log('User profile created successfully:', newUser.id);

    const responseData = {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: authData.user.email,
        cardCode: finalCardCode
      }
    };

    console.log('Sending successful response:', responseData);
    res.status(201).json(responseData);

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