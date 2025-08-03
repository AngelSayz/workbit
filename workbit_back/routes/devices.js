const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - device_id
 *         - name
 *         - type
 *         - space_id
 *         - space_name
 *         - mqtt_topic
 *       properties:
 *         device_id:
 *           type: string
 *           description: Unique device identifier
 *         name:
 *           type: string
 *           description: Device name
 *         type:
 *           type: string
 *           enum: [environmental, access_control]
 *           description: Device type
 *         space_id:
 *           type: number
 *           description: Associated space ID
 *         space_name:
 *           type: string
 *           description: Associated space name
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance, offline]
 *           description: Device status
 *         sensors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               unit:
 *                 type: string
 *               description:
 *                 type: string
 *         mqtt_topic:
 *           type: string
 *           description: MQTT topic for device communication
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [environmental, access_control]
 *         description: Filter by device type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance, offline]
 *         description: Filter by device status
 *       - in: query
 *         name: space_id
 *         schema:
 *           type: number
 *         description: Filter by space ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status, space_id, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (space_id) filter.space_id = parseInt(space_id);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get devices with pagination
    const devices = await Device.find(filter)
      .sort({ last_seen: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get latest readings for each device
    const deviceIds = devices.map(device => device.device_id);
    const latestReadings = await DeviceReading.aggregate([
      { $match: { device_id: { $in: deviceIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$device_id',
          latest_reading: { $first: '$$ROOT' }
        }
      }
    ]);

    const readingsMap = {};
    latestReadings.forEach(item => {
      readingsMap[item._id] = item.latest_reading;
    });

    // Enrich devices with latest readings
    const enrichedDevices = devices.map(device => ({
      ...device,
      latest_reading: readingsMap[device.device_id] || null
    }));

    // Get total count for pagination
    const total = await Device.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: enrichedDevices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching devices'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await Device.findOne({ device_id: deviceId }).lean();
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching device'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}/status:
 *   patch:
 *     summary: Update device status
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance, offline]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.patch('/:deviceId/status', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['active', 'inactive', 'maintenance', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const device = await Device.findOneAndUpdate(
      { device_id: deviceId },
      { 
        status,
        notes: notes || undefined
      },
      { new: true }
    ).lean();

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating device status'
    });
  }
});

/**
 * @swagger
 * /api/devices/stats:
 *   get:
 *     summary: Get device statistics
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     by_type:
 *                       type: object
 *                     by_status:
 *                       type: object
 *                     by_space:
 *                       type: array
 *       500:
 *         description: Server error
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Get total devices
    const total = await Device.countDocuments();

    // Get devices by type
    const byType = await Device.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get devices by status
    const byStatus = await Device.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get devices by space
    const bySpace = await Device.aggregate([
      {
        $group: {
          _id: {
            space_id: '$space_id',
            space_name: '$space_name'
          },
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      {
        $sort: { '_id.space_name': 1 }
      }
    ]);

    // Get recently active devices (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyActive = await Device.countDocuments({
      last_seen: { $gte: last24Hours }
    });

    // Format data
    const stats = {
      total,
      recently_active: recentlyActive,
      by_type: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      by_status: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      by_space: bySpace.map(item => ({
        space_id: item._id.space_id,
        space_name: item._id.space_name,
        count: item.count,
        types: item.types
      }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching device statistics'
    });
  }
});

/**
 * @swagger
 * /api/devices/space/{spaceId}:
 *   get:
 *     summary: Get devices and readings for a specific space
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Space ID
 *     responses:
 *       200:
 *         description: Devices and readings for the space
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     space_info:
 *                       type: object
 *                     devices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Device'
 *                     statistics:
 *                       type: object
 *       404:
 *         description: Space not found
 *       500:
 *         description: Server error
 */
router.get('/space/:spaceId', authenticateToken, async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);

    // Get space info from Supabase
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (spaceError || !space) {
      return res.status(404).json({
        success: false,
        error: 'Space not found'
      });
    }

    // Get devices for this space
    const devices = await Device.find({ space_id: spaceId })
      .sort({ last_seen: -1 })
      .lean();

    // Get latest readings for each device
    const deviceIds = devices.map(device => device.device_id);
    const latestReadings = await DeviceReading.aggregate([
      { $match: { device_id: { $in: deviceIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$device_id',
          latest_reading: { $first: '$$ROOT' }
        }
      }
    ]);

    const readingsMap = {};
    latestReadings.forEach(item => {
      readingsMap[item._id] = item.latest_reading;
    });

    // Enrich devices with latest readings
    const enrichedDevices = devices.map(device => ({
      ...device,
      latest_reading: readingsMap[device.device_id] || null
    }));

    // Calculate statistics
    const stats = {
      total_devices: devices.length,
      environmental_devices: devices.filter(d => d.type === 'environmental').length,
      access_control_devices: devices.filter(d => d.type === 'access_control').length,
      active_devices: devices.filter(d => d.status === 'active').length,
      online_devices: devices.filter(d => d.status === 'online').length,
      offline_devices: devices.filter(d => d.status === 'offline').length
    };

    res.json({
      success: true,
      data: {
        space_info: space,
        devices: enrichedDevices,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error fetching space devices:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching space devices'
    });
  }
});

/**
 * @swagger
 * /api/devices/space/{spaceId}/readings:
 *   get:
 *     summary: Get historical readings for devices in a space
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Space ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for data
 *       - in: query
 *         name: sensorType
 *         schema:
 *           type: string
 *           enum: [temperature, humidity, co2, light, motion, noise, rfid, presence]
 *         description: Filter by sensor type
 *     responses:
 *       200:
 *         description: Historical readings data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     temperature:
 *                       type: array
 *                     humidity:
 *                       type: array
 *                     co2:
 *                       type: array
 *                     labels:
 *                       type: array
 *       404:
 *         description: Space not found
 *       500:
 *         description: Server error
 */
router.get('/space/:spaceId/readings', authenticateToken, async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);
    const { timeRange = '24h', sensorType } = req.query;

    // Calculate time range
    let startTime;
    switch (timeRange) {
      case '24h':
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get devices for this space
    const devices = await Device.find({ space_id: spaceId }).lean();
    const deviceIds = devices.map(device => device.device_id);

    if (deviceIds.length === 0) {
      return res.json({
        success: true,
        data: {
          temperature: [],
          humidity: [],
          co2: [],
          labels: []
        }
      });
    }

    // Build match filter
    const matchFilter = {
      device_id: { $in: deviceIds },
      timestamp: { $gte: startTime }
    };

    if (sensorType) {
      matchFilter['readings.sensor_type'] = sensorType;
    }

    // Get readings with aggregation
    const readings = await DeviceReading.aggregate([
      { $match: matchFilter },
      { $sort: { timestamp: 1 } },
      {
        $project: {
          timestamp: 1,
          readings: 1
        }
      }
    ]);

    // Process data for charts
    const chartData = {
      temperature: [],
      humidity: [],
      co2: [],
      labels: []
    };

    readings.forEach(reading => {
      const timestamp = new Date(reading.timestamp);
      const timeLabel = timeRange === '24h' 
        ? timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : timeRange === '7d'
        ? timestamp.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
        : timestamp.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

      chartData.labels.push(timeLabel);

      // Extract sensor values
      reading.readings.forEach(sensor => {
        const value = parseFloat(sensor.value);
        if (!isNaN(value)) {
          switch (sensor.sensor_type) {
            case 'temperature':
              chartData.temperature.push(value);
              break;
            case 'humidity':
              chartData.humidity.push(value);
              break;
            case 'co2':
              chartData.co2.push(value);
              break;
          }
        }
      });
    });

    // No llenar con null - solo devolver los datos reales que existen
    // Si no hay datos, los arrays estarán vacíos

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching space readings:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching space readings'
    });
  }
});

/**
 * @swagger
 * /api/devices/offline:
 *   get:
 *     summary: Get offline devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Hours threshold for offline status
 *     responses:
 *       200:
 *         description: List of offline devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *       500:
 *         description: Server error
 */
router.get('/offline', authenticateToken, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const offlineDevices = await Device.find({
      last_seen: { $lt: threshold }
    })
    .sort({ last_seen: -1 })
    .lean();

    res.json({
      success: true,
      data: offlineDevices
    });

  } catch (error) {
    console.error('Error fetching offline devices:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching offline devices'
    });
  }
});

module.exports = router; 