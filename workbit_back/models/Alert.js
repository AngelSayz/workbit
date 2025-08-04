const mongoose = require('mongoose');

// Alert Schema para el sistema estandarizado de alertas
const alertSchema = new mongoose.Schema({
  space_id: {
    type: Number,
    required: true,
    index: true
  },
  alert_type: {
    type: String,
    required: true,
    enum: ['capacity_exceeded', 'co2_critical', 'detection_error', 'temperature_critical', 'humidity_critical', 'device_offline'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  value: {
    type: Number,
    required: function() {
      return ['capacity_exceeded', 'co2_critical', 'temperature_critical', 'humidity_critical'].includes(this.alert_type);
    }
  },
  message: {
    type: String,
    required: true
  },
  device_id: {
    type: String,
    index: true
  },
  sensor_data: {
    sensor_type: String,
    sensor_value: Number,
    sensor_unit: String,
    threshold_value: Number
  },
  people_count: {
    type: Number,
    min: 0,
    max: 8
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolved_at: {
    type: Date
  },
  resolved_by: {
    type: Number // user_id
  },
  auto_resolved: {
    type: Boolean,
    default: false
  },
  // Configuración de notificaciones
  notified_users: [{
    user_id: Number,
    notified_at: Date,
    notification_method: {
      type: String,
      enum: ['dashboard', 'email', 'mqtt'],
      default: 'dashboard'
    }
  }],
  // Metadatos adicionales
  threshold_config: {
    min_threshold: Number,
    max_threshold: Number,
    warning_threshold: Number,
    critical_threshold: Number
  },
  retry_count: {
    type: Number,
    default: 0,
    max: 5
  },
  last_occurrence: {
    type: Date,
    default: Date.now
  },
  first_occurrence: {
    type: Date,
    default: Date.now
  },
  occurrence_count: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
alertSchema.index({ space_id: 1, alert_type: 1, resolved: 1 });
alertSchema.index({ severity: 1, resolved: 1, createdAt: -1 });
alertSchema.index({ device_id: 1, resolved: 1 });
alertSchema.index({ resolved: 1, createdAt: -1 });

// TTL index para limpiar alertas resueltas antiguas (90 días)
alertSchema.index({ 
  resolved_at: 1 
}, { 
  expireAfterSeconds: 90 * 24 * 60 * 60,
  partialFilterExpression: { resolved: true }
});

// Middleware para actualizar last_occurrence y occurrence_count
alertSchema.pre('save', function(next) {
  if (this.isNew) {
    this.first_occurrence = new Date();
    this.last_occurrence = new Date();
  } else {
    this.last_occurrence = new Date();
    this.occurrence_count += 1;
  }
  next();
});

// Métodos estáticos
alertSchema.statics.createSpaceAlert = async function(alertData) {
  const {
    space_id,
    alert_type,
    severity = 'medium',
    value,
    message,
    device_id,
    sensor_data,
    people_count
  } = alertData;

  // Verificar si ya existe una alerta similar no resuelta
  const existingAlert = await this.findOne({
    space_id,
    alert_type,
    device_id,
    resolved: false
  });

  if (existingAlert) {
    // Actualizar alerta existente
    existingAlert.occurrence_count += 1;
    existingAlert.last_occurrence = new Date();
    existingAlert.severity = severity; // Actualizar severidad si cambió
    if (value !== undefined) existingAlert.value = value;
    if (people_count !== undefined) existingAlert.people_count = people_count;
    if (sensor_data) existingAlert.sensor_data = sensor_data;
    
    await existingAlert.save();
    return existingAlert;
  }

  // Crear nueva alerta
  const newAlert = new this({
    space_id,
    alert_type,
    severity,
    value,
    message,
    device_id,
    sensor_data,
    people_count
  });

  await newAlert.save();
  return newAlert;
};

alertSchema.statics.resolveAlert = async function(alertId, resolvedBy = null) {
  const alert = await this.findByIdAndUpdate(
    alertId,
    {
      resolved: true,
      resolved_at: new Date(),
      resolved_by: resolvedBy
    },
    { new: true }
  );

  return alert;
};

alertSchema.statics.getActiveAlertsBySpace = async function(spaceId) {
  return this.find({
    space_id: spaceId,
    resolved: false
  }).sort({ severity: -1, createdAt: -1 });
};

alertSchema.statics.getCriticalAlerts = async function() {
  return this.find({
    severity: 'critical',
    resolved: false
  }).sort({ createdAt: -1 });
};

// Métodos de instancia
alertSchema.methods.resolve = async function(resolvedBy = null) {
  this.resolved = true;
  this.resolved_at = new Date();
  this.resolved_by = resolvedBy;
  await this.save();
  return this;
};

alertSchema.methods.addNotification = async function(userId, method = 'dashboard') {
  this.notified_users.push({
    user_id: userId,
    notified_at: new Date(),
    notification_method: method
  });
  await this.save();
  return this;
};

module.exports = mongoose.model('Alert', alertSchema);