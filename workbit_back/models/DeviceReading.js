const mongoose = require('mongoose');

const deviceReadingSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  space_id: {
    type: Number,
    required: true,
    index: true
  },
  readings: [{
    sensor_name: {
      type: String,
      required: true
    },
    sensor_type: {
      type: String,
      required: true,
      enum: ['temperature', 'humidity', 'co2', 'light', 'motion', 'noise', 'rfid', 'presence']
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Puede ser número, string, boolean
      required: true
    },
    unit: String,
    quality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good'
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  device_status: {
    type: String,
    enum: ['online', 'offline', 'error'],
    default: 'online'
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 100
  },
  signal_strength: {
    type: Number,
    min: -100,
    max: 0
  },
  raw_data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
deviceReadingSchema.index({ device_id: 1, timestamp: -1 });
deviceReadingSchema.index({ space_id: 1, timestamp: -1 });
deviceReadingSchema.index({ 'readings.sensor_type': 1, timestamp: -1 });

// TTL index para limpiar lecturas antiguas (opcional)
deviceReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 días

module.exports = mongoose.model('DeviceReading', deviceReadingSchema); 