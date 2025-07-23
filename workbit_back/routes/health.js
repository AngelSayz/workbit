const express = require('express');
const supabase = require('../config/supabase');
const { mongoose } = require('../config/mongodb');
const { client: mqttClient } = require('../config/mqtt');
const router = express.Router();

// GET /api/health - Basic health check
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      databases: {},
      services: {},
      system: {
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Check Supabase connection
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('roles')
          .select('count')
          .limit(1);
        
        healthStatus.databases.supabase = {
          status: error ? 'unhealthy' : 'healthy',
          error: error?.message || null,
          responseTime: null // Could add timing here
        };
      } else {
        healthStatus.databases.supabase = {
          status: 'not_configured',
          error: 'Supabase client not initialized'
        };
      }
    } catch (error) {
      healthStatus.databases.supabase = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check MongoDB connection
    try {
      healthStatus.databases.mongodb = {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      };
    } catch (error) {
      healthStatus.databases.mongodb = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check MQTT connection
    healthStatus.services.mqtt = {
      status: mqttClient && mqttClient.connected ? 'healthy' : 'unhealthy',
      connected: mqttClient ? mqttClient.connected : false,
      broker: process.env.MQTT_BROKER_URL || 'not_configured'
    };

    // Determine overall health
    const isHealthy = 
      healthStatus.databases.supabase.status === 'healthy' &&
      healthStatus.databases.mongodb.status === 'healthy' &&
      healthStatus.services.mqtt.status === 'healthy';

    if (!isHealthy) {
      healthStatus.status = 'degraded';
    }

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/database - Detailed database health check
router.get('/database', async (req, res) => {
  try {
    const dbHealth = {
      timestamp: new Date().toISOString(),
      databases: {}
    };

    // Detailed Supabase check
    if (supabase) {
      const startTime = Date.now();
      try {
        // Test basic query
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('id, name')
          .limit(1);

        // Test users table
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        // Test spaces table
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('count')
          .limit(1);

        const responseTime = Date.now() - startTime;

        dbHealth.databases.supabase = {
          status: (!rolesError && !usersError && !spacesError) ? 'healthy' : 'unhealthy',
          responseTime: `${responseTime}ms`,
          tables: {
            roles: rolesError ? 'error' : 'ok',
            users: usersError ? 'error' : 'ok',
            spaces: spacesError ? 'error' : 'ok'
          },
          errors: [rolesError, usersError, spacesError].filter(Boolean)
        };
      } catch (error) {
        dbHealth.databases.supabase = {
          status: 'unhealthy',
          error: error.message
        };
      }
    } else {
      dbHealth.databases.supabase = {
        status: 'not_configured',
        error: 'Supabase client not initialized'
      };
    }

    // Detailed MongoDB check
    try {
      const mongoStartTime = Date.now();
      
      // Test connection
      await mongoose.connection.db.admin().ping();
      
      const mongoResponseTime = Date.now() - mongoStartTime;

      dbHealth.databases.mongodb = {
        status: 'healthy',
        responseTime: `${mongoResponseTime}ms`,
        connection: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : []
        }
      };
    } catch (error) {
      dbHealth.databases.mongodb = {
        status: 'unhealthy',
        error: error.message,
        readyState: mongoose.connection.readyState
      };
    }

    const allHealthy = Object.values(dbHealth.databases).every(db => db.status === 'healthy');
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json(dbHealth);

  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/services - Check external services (MQTT, etc.)
router.get('/services', (req, res) => {
  try {
    const servicesHealth = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // MQTT Health
    servicesHealth.services.mqtt = {
      status: mqttClient && mqttClient.connected ? 'healthy' : 'unhealthy',
      connected: mqttClient ? mqttClient.connected : false,
      broker: process.env.MQTT_BROKER_URL || 'not_configured',
      clientId: process.env.MQTT_CLIENT_ID || 'not_configured',
      reconnectAttempts: mqttClient ? mqttClient.reconnectAttempts || 0 : 0
    };

    // Environment variables check
    servicesHealth.services.environment = {
      status: 'healthy',
      variables: {
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
        SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
        MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
        MQTT_BROKER_URL: process.env.MQTT_BROKER_URL ? 'configured' : 'missing'
      }
    };

    const allHealthy = Object.values(servicesHealth.services).every(service => 
      service.status === 'healthy' || service.status === 'configured'
    );
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json(servicesHealth);

  } catch (error) {
    console.error('Services health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/readiness - Kubernetes readiness probe
router.get('/readiness', async (req, res) => {
  try {
    // Check if critical services are ready
    const isSupabaseReady = supabase !== null;
    const isMongoReady = mongoose.connection.readyState === 1;
    
    if (isSupabaseReady && isMongoReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          supabase: isSupabaseReady ? 'ready' : 'not_ready',
          mongodb: isMongoReady ? 'ready' : 'not_ready'
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/liveness - Kubernetes liveness probe
router.get('/liveness', (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/health/metrics - Basic metrics for monitoring
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      application: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    // Add database metrics if available
    if (supabase) {
      try {
        // Get basic counts from main tables
        const [rolesCount, usersCount, spacesCount, reservationsCount] = await Promise.all([
          supabase.from('roles').select('count', { count: 'exact', head: true }),
          supabase.from('users').select('count', { count: 'exact', head: true }),
          supabase.from('spaces').select('count', { count: 'exact', head: true }),
          supabase.from('reservations').select('count', { count: 'exact', head: true })
        ]);

        metrics.database = {
          supabase: {
            tables: {
              roles: rolesCount.count || 0,
              users: usersCount.count || 0,
              spaces: spacesCount.count || 0,
              reservations: reservationsCount.count || 0
            }
          }
        };
      } catch (error) {
        metrics.database = {
          supabase: { error: 'Failed to fetch metrics' }
        };
      }
    }

    res.json(metrics);

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      error: 'Failed to generate metrics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 