const mongoose = require('mongoose');

// Access Log Schema for RFID access events
const accessLogSchema = new mongoose.Schema({
  card_code: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: Number,
    index: true
  },
  username: {
    type: String
  },
  access_granted: {
    type: Boolean,
    required: true,
    default: false
  },
  access_type: {
    type: String,
    enum: ['regular', 'guest', 'admin'],
    default: 'regular'
  },
  space_id: {
    type: Number,
    index: true
  },
  space_name: {
    type: String
  },
  reservation_id: {
    type: Number,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['rfid', 'manual', 'api'],
    default: 'rfid'
  },
  mqtt_topic: {
    type: String
  },
  raw_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
accessLogSchema.index({ card_code: 1, timestamp: -1 });
accessLogSchema.index({ user_id: 1, timestamp: -1 });
accessLogSchema.index({ space_id: 1, timestamp: -1 });
accessLogSchema.index({ access_granted: 1, timestamp: -1 });
accessLogSchema.index({ access_type: 1, timestamp: -1 });

// TTL index for automatic cleanup after 1 year
accessLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Create the model
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog; 