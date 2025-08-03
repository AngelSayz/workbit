const mongoose = require('mongoose');

// Device Schema for IoT devices (environmental monitoring and access control)
const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['environmental', 'access_control'],
    required: true,
    index: true
  },
  space_id: {
    type: Number,
    required: true,
    index: true
  },
  space_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'offline'],
    default: 'active',
    index: true
  },
  sensors: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    unit: String,
    description: String
  }],
  location: {
    building: String,
    floor: String,
    room: String,
    coordinates: {
      x: Number,
      y: Number
    }
  },
  hardware_info: {
    model: String,
    firmware_version: String,
    mac_address: String,
    ip_address: String
  },
  last_seen: {
    type: Date,
    default: Date.now,
    index: true
  },
  last_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  mqtt_topic: {
    type: String,
    required: true,
    unique: true
  },
  registration_date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
deviceSchema.index({ device_id: 1 });
deviceSchema.index({ type: 1, status: 1 });
deviceSchema.index({ space_id: 1, type: 1 });
deviceSchema.index({ status: 1, last_seen: -1 });
deviceSchema.index({ mqtt_topic: 1 });

// TTL index for devices that haven't been seen in 30 days (mark as offline)
deviceSchema.index({ last_seen: 1 }, { expireAfterSeconds: 2592000 });

// Create the model
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device; 