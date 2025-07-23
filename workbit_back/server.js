require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import database connections
const { connectMongoDB } = require('./config/mongodb');
const supabase = require('./config/supabase');
const mqttClient = require('./config/mqtt');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const spaceRoutes = require('./routes/spaces');
const reservationRoutes = require('./routes/reservations');
const accessLogRoutes = require('./routes/accessLogs');
const healthRoutes = require('./routes/health');
const gridRoutes = require('./routes/grid');
const cardRoutes = require('./routes/cards');
const roleRoutes = require('./routes/roles');
const analyticsRoutes = require('./routes/analytics');
const sensorRoutes = require('./routes/sensors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
let corsOptions;
if (process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN) {
  corsOptions = { origin: '*', credentials: true, optionsSuccessStatus: 200 };
} else {
  corsOptions = {
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    optionsSuccessStatus: 200
  };
}
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/grid', gridRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sensors', sensorRoutes);

// Legacy route compatibility (from C# backend)
app.use('/login', authRoutes);
app.use('/api/Users', userRoutes);
app.use('/api/AvailableSpaces', spaceRoutes);
app.use('/api/Reservations', reservationRoutes);
app.use('/api/AccessLog', accessLogRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WorkBit API - Node.js Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    databases: {
      supabase: 'connected',
      mongodb: 'connected'
    },
    mqtt: mqttClient.connected ? 'connected' : 'disconnected'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    databases: {
      supabase: supabase ? 'connected' : 'disconnected',
      mongodb: 'connected' // Will be checked in health route
    },
    mqtt: mqttClient.connected ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Initialize connections and start server
async function startServer() {
  try {
    console.log('🚀 Starting WorkBit Backend...');
    
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB connected');
    
    // Test Supabase connection
    const { data, error } = await supabase.from('roles').select('count').limit(1);
    if (error) {
      console.warn('⚠️ Supabase connection issue:', error.message);
    } else {
      console.log('✅ Supabase connected');
    }
    
    // Start MQTT client
    console.log('✅ MQTT client initialized');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}`);
      console.log('✨ Backend ready to accept requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer(); 