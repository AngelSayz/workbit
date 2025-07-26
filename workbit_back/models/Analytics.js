const mongoose = require('mongoose');

// Space Usage Analytics Schema
const spaceUsageSchema = new mongoose.Schema({
  space_id: {
    type: Number,
    required: true
  },
  space_name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  total_reservations: {
    type: Number,
    default: 0
  },
  total_hours_reserved: {
    type: Number,
    default: 0
  },
  total_hours_used: {
    type: Number,
    default: 0
  },
  peak_hours: [{
    hour: Number, // 0-23
    usage_count: Number
  }],
  occupancy_rate: {
    type: Number,
    default: 0, // percentage
    min: 0,
    max: 100
  },
  average_session_duration: {
    type: Number,
    default: 0 // minutes
  }
}, {
  timestamps: true
});

// User Activity Analytics Schema
const userActivitySchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  total_reservations: {
    type: Number,
    default: 0
  },
  total_hours_reserved: {
    type: Number,
    default: 0
  },
  total_hours_used: {
    type: Number,
    default: 0
  },
  spaces_used: [{
    space_id: Number,
    space_name: String,
    hours_used: Number
  }],
  favorite_spaces: [{
    space_id: Number,
    space_name: String,
    usage_count: Number
  }],
  most_active_hours: [{
    hour: Number, // 0-23
    activity_count: Number
  }]
}, {
  timestamps: true
});

// System Metrics Schema
const systemMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  total_users: {
    type: Number,
    default: 0
  },
  active_users: {
    type: Number,
    default: 0
  },
  total_spaces: {
    type: Number,
    default: 0
  },
  available_spaces: {
    type: Number,
    default: 0
  },
  total_reservations: {
    type: Number,
    default: 0
  },
  confirmed_reservations: {
    type: Number,
    default: 0
  },
  cancelled_reservations: {
    type: Number,
    default: 0
  },
  average_occupancy_rate: {
    type: Number,
    default: 0
  },
  mqtt_messages_sent: {
    type: Number,
    default: 0
  },
  mqtt_messages_received: {
    type: Number,
    default: 0
  },
  api_requests: {
    type: Number,
    default: 0
  },
  response_times: {
    avg: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Event Log Schema (for real-time events)
const eventLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: ['space_access', 'space_exit', 'reservation_created', 'reservation_cancelled', 'reservation_confirmed', 'space_status_changed', 'user_login', 'system_alert']
  },
  user_id: {
    type: Number
  },
  space_id: {
    type: Number
  },
  reservation_id: {
    type: Number
  },
  event_data: {
    type: mongoose.Schema.Types.Mixed, // Flexible data storage
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['api', 'mqtt', 'system', 'mobile_app'],
    default: 'api'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Performance Metrics Schema
const performanceMetricsSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  response_time: {
    type: Number,
    required: true // milliseconds
  },
  status_code: {
    type: Number,
    required: true
  },
  user_id: {
    type: Number
  },
  user_agent: {
    type: String
  },
  ip_address: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  error_message: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better query performance (sin duplicados)
spaceUsageSchema.index({ space_id: 1, date: 1 }, { unique: true });
userActivitySchema.index({ user_id: 1, date: 1 }, { unique: true });
systemMetricsSchema.index({ date: 1 }, { unique: true });
eventLogSchema.index({ timestamp: -1 });
eventLogSchema.index({ event_type: 1, timestamp: -1 });
performanceMetricsSchema.index({ endpoint: 1, timestamp: -1 });

// TTL indexes for automatic cleanup (optional)
eventLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
performanceMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days

// Create models
const SpaceUsage = mongoose.model('SpaceUsage', spaceUsageSchema);
const UserActivity = mongoose.model('UserActivity', userActivitySchema);
const SystemMetrics = mongoose.model('SystemMetrics', systemMetricsSchema);
const EventLog = mongoose.model('EventLog', eventLogSchema);
const PerformanceMetrics = mongoose.model('PerformanceMetrics', performanceMetricsSchema);

module.exports = {
  SpaceUsage,
  UserActivity,
  SystemMetrics,
  EventLog,
  PerformanceMetrics
}; 