const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');
const mongoose = require('mongoose');

// MongoDB Collections (simplified for this implementation)
// Note: These would typically be defined in separate model files
const SensorReading = mongoose.model('SensorReading', new mongoose.Schema({
  space_id: { type: Number, required: true, index: true },
  sensor_type: { type: String, required: true, enum: ['temperature', 'humidity', 'co2', 'light', 'motion', 'noise'] },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  device_id: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  quality: { type: String, enum: ['good', 'fair', 'poor'], default: 'good' }
}, { timestamps: true }));

const EnvironmentalAlert = mongoose.model('EnvironmentalAlert', new mongoose.Schema({
  space_id: { type: Number, required: true, index: true },
  alert_type: { type: String, required: true, enum: ['temperature_high', 'temperature_low', 'co2_high', 'humidity_high', 'motion_detected'] },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  message: { type: String, required: true },
  sensor_reading: {
    sensor_type: String,
    value: Number,
    unit: String,
    device_id: String
  },
  threshold_exceeded: {
    threshold_value: Number,
    actual_value: Number
  },
  resolved: { type: Boolean, default: false },
  resolved_at: Date,
  notified_users: [Number], // user_ids
  created_at: { type: Date, default: Date.now, index: true }
}, { timestamps: true }));

const Device = mongoose.model('Device', new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  device_type: { type: String, required: true, enum: ['sensor', 'controller', 'gateway'] },
  space_id: { type: Number, required: true, index: true },
  status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
  sensors: [{
    type: { type: String, enum: ['temperature', 'humidity', 'co2', 'light', 'motion', 'noise'] },
    unit: String,
    min_value: Number,
    max_value: Number,
    threshold_low: Number,
    threshold_high: Number
  }],
  last_seen: { type: Date, default: Date.now },
  firmware_version: String,
  battery_level: Number,
  signal_strength: Number
}, { timestamps: true }));

// Get sensor readings for a space
router.get('/readings/:spaceId', [
  authenticateToken,
  requireRole(['admin', 'technician', 'user'])
], async (req, res) => {
  try {
    const spaceId = parseInt(req.params.spaceId);
    const { sensor_type, hours = 24, limit = 100 } = req.query;

    // Verify space exists
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, name')
      .eq('id', spaceId)
      .single();

    if (spaceError || !space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Build filter
    let filter = { space_id: spaceId };
    
    // Time filter
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - parseInt(hours));
    filter.timestamp = { $gte: startTime };

    // Sensor type filter
    if (sensor_type) {
      filter.sensor_type = sensor_type;
    }

    // Get readings
    const readings = await SensorReading.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Get latest reading for each sensor type
    const latestReadings = await SensorReading.aggregate([
      { $match: { space_id: spaceId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$sensor_type',
          latest_reading: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        space: space,
        readings: readings,
        latest_by_type: latestReadings.map(item => item.latest_reading),
        time_range: `${hours} hours`,
        total_readings: readings.length
      }
    });

  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor readings',
      error: error.message
    });
  }
});

// Add new sensor reading (typically called by IoT devices)
router.post('/readings', [
  body('space_id').isInt().withMessage('Space ID must be an integer'),
  body('sensor_type').isIn(['temperature', 'humidity', 'co2', 'light', 'motion', 'noise']).withMessage('Invalid sensor type'),
  body('value').isNumeric().withMessage('Value must be numeric'),
  body('unit').isString().withMessage('Unit must be a string'),
  body('device_id').isString().withMessage('Device ID must be a string'),
  body('quality').optional().isIn(['good', 'fair', 'poor']).withMessage('Invalid quality value')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { space_id, sensor_type, value, unit, device_id, quality = 'good' } = req.body;

    // Verify space exists
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id, name')
      .eq('id', space_id)
      .single();

    if (spaceError || !space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    // Create sensor reading
    const reading = new SensorReading({
      space_id,
      sensor_type,
      value,
      unit,
      device_id,
      quality,
      timestamp: new Date()
    });

    await reading.save();

    // Update device status
    await Device.findOneAndUpdate(
      { device_id },
      { 
        last_seen: new Date(),
        status: 'online'
      },
      { upsert: true }
    );

    // Check for alerts (simplified thresholds)
    const alerts = [];
    const thresholds = {
      temperature: { min: 18, max: 25 },
      humidity: { min: 30, max: 70 },
      co2: { min: 0, max: 1000 },
      noise: { min: 0, max: 60 }
    };

    if (thresholds[sensor_type]) {
      const threshold = thresholds[sensor_type];
      let alertType = null;
      let severity = 'low';

      if (value > threshold.max) {
        alertType = `${sensor_type}_high`;
        severity = value > threshold.max * 1.2 ? 'high' : 'medium';
      } else if (value < threshold.min) {
        alertType = `${sensor_type}_low`;
        severity = value < threshold.min * 0.8 ? 'high' : 'medium';
      }

      if (alertType) {
        const alert = new EnvironmentalAlert({
          space_id,
          alert_type: alertType,
          severity,
          message: `${sensor_type} level ${value} ${unit} exceeds threshold`,
          sensor_reading: {
            sensor_type,
            value,
            unit,
            device_id
          },
          threshold_exceeded: {
            threshold_value: value > threshold.max ? threshold.max : threshold.min,
            actual_value: value
          }
        });

        await alert.save();
        alerts.push(alert);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sensor reading recorded successfully',
      data: {
        reading: reading,
        alerts_generated: alerts.length,
        alerts: alerts
      }
    });

  } catch (error) {
    console.error('Error adding sensor reading:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding sensor reading',
      error: error.message
    });
  }
});

// Get environmental alerts
router.get('/alerts', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { 
      space_id, 
      severity, 
      resolved = 'false', 
      hours = 24, 
      limit = 50 
    } = req.query;

    // Build filter
    let filter = {};

    // Space filter
    if (space_id) {
      filter.space_id = parseInt(space_id);
    }

    // Severity filter
    if (severity) {
      filter.severity = severity;
    }

    // Resolved filter
    filter.resolved = resolved === 'true';

    // Time filter
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - parseInt(hours));
    filter.created_at = { $gte: startTime };

    // Get alerts
    const alerts = await EnvironmentalAlert.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    // Get space names for alerts
    const spaceIds = [...new Set(alerts.map(alert => alert.space_id))];
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, name')
      .in('id', spaceIds);

    if (spacesError) throw spacesError;

    // Map space names to alerts
    const spaceMap = {};
    spaces?.forEach(space => {
      spaceMap[space.id] = space.name;
    });

    const enrichedAlerts = alerts.map(alert => ({
      ...alert.toObject(),
      space_name: spaceMap[alert.space_id] || 'Unknown'
    }));

    // Get alert statistics
    const alertStats = await EnvironmentalAlert.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        alerts: enrichedAlerts,
        statistics: {
          total_alerts: alerts.length,
          severity_distribution: alertStats,
          time_range: `${hours} hours`
        }
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

// Resolve alert
router.put('/alerts/:id/resolve', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const alertId = req.params.id;

    const alert = await EnvironmentalAlert.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolved_at: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Log activity
    await logActivity(req.user.id, 'alert_resolved', {
      alert_id: alertId,
      space_id: alert.space_id,
      alert_type: alert.alert_type,
      resolved_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
});

// Get devices
router.get('/devices', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const { space_id, status, device_type } = req.query;

    // Build filter
    let filter = {};
    if (space_id) filter.space_id = parseInt(space_id);
    if (status) filter.status = status;
    if (device_type) filter.device_type = device_type;

    const devices = await Device.find(filter)
      .sort({ last_seen: -1 });

    // Get space names
    const spaceIds = [...new Set(devices.map(device => device.space_id))];
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, name')
      .in('id', spaceIds);

    if (spacesError) throw spacesError;

    const spaceMap = {};
    spaces?.forEach(space => {
      spaceMap[space.id] = space.name;
    });

    const enrichedDevices = devices.map(device => ({
      ...device.toObject(),
      space_name: spaceMap[device.space_id] || 'Unknown'
    }));

    // Calculate device statistics
    const stats = {
      total_devices: devices.length,
      online_devices: devices.filter(d => d.status === 'online').length,
      offline_devices: devices.filter(d => d.status === 'offline').length,
      maintenance_devices: devices.filter(d => d.status === 'maintenance').length
    };

    res.json({
      success: true,
      data: {
        devices: enrichedDevices,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching devices',
      error: error.message
    });
  }
});

// Update device status
router.put('/devices/:deviceId/status', [
  authenticateToken,
  requireRole(['admin', 'technician']),
  body('status').isIn(['online', 'offline', 'maintenance']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const deviceId = req.params.deviceId;
    const { status } = req.body;

    const device = await Device.findOneAndUpdate(
      { device_id: deviceId },
      { 
        status,
        last_seen: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Log activity
    await logActivity(req.user.id, 'device_status_updated', {
      device_id: deviceId,
      new_status: status,
      space_id: device.space_id,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Device status updated successfully',
      data: device
    });

  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating device status',
      error: error.message
    });
  }
});

// Get sensor data summary for dashboard
router.get('/summary', [
  authenticateToken,
  requireRole(['admin', 'technician', 'user'])
], async (req, res) => {
  try {
    const { space_id } = req.query;

    // Build base filter
    let filter = {};
    if (space_id) filter.space_id = parseInt(space_id);

    // Get latest readings for each space and sensor type
    const latestReadings = await SensorReading.aggregate([
      { $match: filter },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { space_id: '$space_id', sensor_type: '$sensor_type' },
          latest_reading: { $first: '$$ROOT' }
        }
      },
      {
        $group: {
          _id: '$_id.space_id',
          sensors: {
            $push: {
              type: '$_id.sensor_type',
              reading: '$latest_reading'
            }
          }
        }
      }
    ]);

    // Get active alerts count
    const activeAlertsCount = await EnvironmentalAlert.countDocuments({
      ...filter,
      resolved: false
    });

    // Get device status summary
    const deviceSummary = await Device.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get space information
    let spaceInfo = null;
    if (space_id) {
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('id, name, status, capacity')
        .eq('id', space_id)
        .single();

      if (!spaceError && space) {
        spaceInfo = space;
      }
    }

    res.json({
      success: true,
      data: {
        space_info: spaceInfo,
        latest_sensor_data: latestReadings,
        active_alerts: activeAlertsCount,
        device_status: deviceSummary.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching sensor summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor summary',
      error: error.message
    });
  }
});

module.exports = router; 