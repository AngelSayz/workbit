const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
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

// GET /api/auth/admin-exists - Check if administrators exist in the system
router.get('/admin-exists', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // Buscar usuarios con rol admin
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, roles!inner(name)')
      .eq('roles.name', 'admin')
      .limit(1);

    if (error) {
      console.error('Error checking admins:', error);
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    const hasAdmin = admins && admins.length > 0;

    res.json({
      hasAdmin,
      message: hasAdmin ? 'Administrators exist' : 'No administrators found'
    });

  } catch (error) {
    console.error('Error in admin-exists:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/first-admin - Create first administrator
router.post('/first-admin', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('lastname').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, lastname, username, email, password } = req.body;

    if (!supabase) {
      return res.status(500).json({
        error: 'Database connection failed'
      });
    }

    // VERIFICAR QUE NO EXISTAN ADMINISTRADORES
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('users')
      .select('id, roles!inner(name)')
      .eq('roles.name', 'admin')
      .limit(1);

    if (adminCheckError) {
      console.error('Error checking existing admins:', adminCheckError);
      return res.status(500).json({
        error: 'Database error during admin check'
      });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Administrators already exist. Use regular registration process.'
      });
    }

    // Verificar que el username no exista
    const { data: existingUsers, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username);

    if (usernameCheckError) {
      console.error('Username check error:', usernameCheckError);
      return res.status(500).json({
        error: 'Database error during username check'
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Crear usuario en Supabase Auth
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
      return res.status(400).json({
        error: 'Registration failed',
        message: 'Failed to create user account'
      });
    }

    // CONFIRMAR EMAIL AUTOMÁTICAMENTE PARA EL PRIMER ADMIN
    if (authData.user.id) {
      try {
        await supabase.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true
        });
        console.log('Email auto-confirmed for first admin');
      } catch (confirmError) {
        console.warn('Could not auto-confirm email for first admin:', confirmError);
        // Continuar aunque no se pueda confirmar automáticamente
      }
    }

    // Obtener rol de admin
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('Admin role not found:', roleError);
      return res.status(500).json({
        error: 'Admin role not found in system'
      });
    }

    // Crear perfil de usuario
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        lastname,
        username,
        user_id: authData.user.id,
        role_id: adminRole.id
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      // Intentar limpiar el usuario de auth si falló el perfil
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Error cleaning up auth user:', cleanupError);
      }
      return res.status(500).json({
        error: 'Failed to create user profile'
      });
    }

    res.status(201).json({
      success: true,
      message: 'First administrator created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: authData.user.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('First admin registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/register - Registro abierto SOLO para rol 'user' (app móvil)
router.post('/register', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('lastname').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cardCode').optional().trim()
], async (req, res) => {
  console.log('Mobile registration request received:', req.body);
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
      return res.status(500).json({ error: 'Database connection failed' });
    }
    // Check if username already exists
    const { data: existingUsers, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username);
    if (usernameCheckError) {
      return res.status(500).json({ error: 'Database error during username check', message: usernameCheckError.message });
    }
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username already exists', message: 'Username is already taken' });
    }
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      return res.status(400).json({ error: 'Registration failed', message: authError.message });
    }
    if (!authData.user) {
      return res.status(400).json({ error: 'Registration failed', message: 'Failed to create user account' });
    }
    // Get role 'user'
    const { data: userRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();
    if (roleError || !userRole) {
      return res.status(500).json({ error: 'User role not found in system' });
    }
    // Handle card code (opcional)
    let cardId = null;
    let finalCardCode = cardCode;
    if (cardCode) {
      const { data: existingCard, error: existingCardError } = await supabase
        .from('codecards')
        .select('id')
        .eq('code', cardCode)
        .single();
      if (!existingCardError && existingCard) {
        cardId = existingCard.id;
      } else {
        const { data: newCard, error: cardError } = await supabase
          .from('codecards')
          .insert({ code: cardCode })
          .select('id')
          .single();
        if (!cardError && newCard) {
          cardId = newCard.id;
        }
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
        role_id: userRole.id,
        card_id: cardId
      })
      .select()
      .single();
    if (userError) {
      // Clean up auth user if profile creation fails
      try { await supabase.auth.admin.deleteUser(authData.user.id); } catch {}
      return res.status(500).json({ error: 'Registration failed', message: 'Failed to create user profile' });
    }
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: authData.user.email,
        role: 'user',
        cardCode: finalCardCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error during registration' });
  }
});

// POST /api/auth/admin-register - SOLO para admins, permite crear admin o technician
router.post('/admin-register', [
  authenticateToken,
  requireRole(['admin']),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('lastname').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'technician']).withMessage('Invalid role'),
  body('cardCode').optional().trim()
], async (req, res) => {
  console.log('Admin registration request received:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { name, lastname, username, email, password, role = 'technician', cardCode } = req.body;
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    // Check if username already exists
    const { data: existingUsers, error: usernameCheckError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username);
    if (usernameCheckError) {
      return res.status(500).json({ error: 'Database error during username check', message: usernameCheckError.message });
    }
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username already exists', message: 'Username is already taken' });
    }
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      return res.status(400).json({ error: 'Registration failed', message: authError.message });
    }
    if (!authData.user) {
      return res.status(400).json({ error: 'Registration failed', message: 'Failed to create user account' });
    }
    // AUTO-CONFIRMAR EMAIL PARA USUARIOS CREADOS POR ADMIN
    if (authData.user.id) {
      try {
        await supabase.auth.admin.updateUserById(authData.user.id, { email_confirm: true });
      } catch {}
    }
    // Get role by name
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();
    if (roleError || !roleData) {
      return res.status(500).json({ error: 'Role not found' });
    }
    // Handle card code (opcional)
    let cardId = null;
    let finalCardCode = cardCode;
    if (cardCode) {
      const { data: existingCard, error: existingCardError } = await supabase
        .from('codecards')
        .select('id')
        .eq('code', cardCode)
        .single();
      if (!existingCardError && existingCard) {
        cardId = existingCard.id;
      } else {
        const { data: newCard, error: cardError } = await supabase
          .from('codecards')
          .insert({ code: cardCode })
          .select('id')
          .single();
        if (!cardError && newCard) {
          cardId = newCard.id;
        }
      }
    }
    // Al crear el perfil de usuario, si cardId es null, ponerlo en 0
    const safeCardId = cardId == null ? 0 : cardId;
    // Create user profile in our users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        lastname,
        username,
        user_id: authData.user.id,
        role_id: roleData.id,
        card_id: safeCardId
      })
      .select()
      .single();
    if (userError) {
      try { await supabase.auth.admin.deleteUser(authData.user.id); } catch {}
      return res.status(500).json({ error: 'Registration failed', message: 'Failed to create user profile' });
    }
    res.status(201).json({
      message: 'User registered successfully',
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        lastname: newUser.lastname,
        username: newUser.username,
        email: authData.user.email,
        role: role,
        cardCode: finalCardCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error during registration' });
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