require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import database connections
const { connectMongoDB } = require('./config/mongodb');
const { supabase } = require('./config/supabase');
const mqttClient = require('./config/mqtt');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const spaceRoutes = require('./routes/spaces');
const reservationRoutes = require('./routes/reservations');
const accessLogRoutes = require('./routes/accessLogs');
const accessControlRoutes = require('./routes/accessControl');
const healthRoutes = require('./routes/health');
const gridRoutes = require('./routes/grid');
const cardRoutes = require('./routes/cards');
const roleRoutes = require('./routes/roles');
const analyticsRoutes = require('./routes/analytics');
const sensorRoutes = require('./routes/sensors');
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const taskRoutes = require('./routes/tasks');
const deviceRoutes = require('./routes/devices');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');

const app = express();
app.set('trust proxy', 1); // Para Render y proxies
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
app.use('/api/access-control', accessControlRoutes);
app.use('/api/grid', gridRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

// Legacy route compatibility (from C# backend)
app.use('/login', authRoutes);
app.use('/api/Users', userRoutes);
app.use('/api/AvailableSpaces', spaceRoutes);
app.use('/api/Reservations', reservationRoutes);
app.use('/api/AccessLog', accessLogRoutes);

// Swagger UI
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WorkBit API',
    version: '1.0.0',
    description: 'Documentación interactiva de la API WorkBit (sin autenticación)'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local' },
    { url: 'https://TU-URL-RENDER.onrender.com', description: 'Render' }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
    
    // MQTT status (solo mostrar si está configurado)
    if (process.env.MQTT_BROKER_URL) {
      console.log(`✅ MQTT client initialized (${mqttClient.connected ? 'connected' : 'disconnected'})`);
    } else {
      console.log('ℹ️ MQTT not configured');
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}`);
      console.log('✨ Backend ready to accept requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  // Cerrar conexiones antes de salir
  if (mqttClient && mqttClient.end) {
    mqttClient.end();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  // Cerrar conexiones antes de salir
  if (mqttClient && mqttClient.end) {
    mqttClient.end();
  }
  process.exit(0);
});

startServer();