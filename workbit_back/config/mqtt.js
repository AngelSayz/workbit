const mqtt = require('mqtt');
const AccessLog = require('../models/AccessLog');
const Device = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');
const Alert = require('../models/Alert');

// Configuración MQTT optimizada para EMQX
const mqttOptions = {
  clientId: process.env.MQTT_CLIENT_ID || `workbit-backend-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`,
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  reconnectPeriod: 15000, // 15 segundos entre reconexiones
  connectTimeout: 45 * 1000, // 45 segundos timeout
  keepalive: 180, // 3 minutos keepalive
  clean: true,
  rejectUnauthorized: false,
  maxReconnectAttempts: 15, // Más intentos para EMQX
  reschedulePings: true,
  queueQoSZero: false,
  rescheduleResend: true,
  // Configuraciones específicas para EMQX
  protocolVersion: 4, // MQTT 3.1.1
  will: {
    topic: 'workbit/backend/status',
    payload: JSON.stringify({ status: 'offline', timestamp: new Date().toISOString() }),
    qos: 1,
    retain: false
  }
};

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

let client = null;
let reconnectAttempts = 0;
let isInitialized = false;

// Función para crear el cliente MQTT
function createMqttClient() {
  try {
    client = mqtt.connect(brokerUrl, mqttOptions);

    client.on('connect', () => {
      reconnectAttempts = 0; // Resetear contador de intentos
      isInitialized = true;
      console.log('✅ MQTT client connected to EMQX broker');
      
      // Publicar estado online
      client.publish('workbit/backend/status', JSON.stringify({
        status: 'online',
        timestamp: new Date().toISOString(),
        clientId: mqttOptions.clientId
      }), { qos: 1, retain: false });
      
      // Subscribe to relevant topics
      const topics = [
        'workbit/access/request',           // RFID access requests
        'workbit/sensors/infrared',         // Infrared sensor data (legacy)
        'workbit/sensors/environmental_data', // Environmental sensor data (standardized)
        'workbit/devices/add',              // Device registration
        'workbit/devices/+/readings',       // Device sensor readings (standardized)
        'workbit/access/credentials/+',     // RFID credentials by space_id
        'workbit/alerts/+',                 // Alerts by space_id
        'workbit/access/guests'             // Guest access updates (legacy)
      ];
      
      topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            console.error(`❌ Failed to subscribe to ${topic}:`, err);
          } else {
            console.log(`📡 Subscribed to MQTT topic: ${topic} (QoS 1)`);
          }
        });
      });
    });

    client.on('error', (error) => {
      console.error('❌ MQTT client error:', error.message);
      console.error('❌ MQTT error details:', {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
    });

    client.on('reconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts <= 5) {
        console.log(`🔄 MQTT client reconnecting... (attempt ${reconnectAttempts})`);
      } else if (reconnectAttempts <= 10) {
        console.log(`⚠️ MQTT reconnection attempt ${reconnectAttempts} - continuing...`);
      } else {
        console.log(`🔄 MQTT reconnection attempt ${reconnectAttempts} - limiting logs`);
      }
    });

    client.on('offline', () => {
      if (isInitialized) {
        console.warn('⚠️ MQTT client offline - connection lost');
      }
    });

    client.on('close', () => {
      console.log('🔌 MQTT client connection closed');
    });

    // Heartbeat para monitorear la conexión
    setInterval(() => {
      if (client && client.connected) {
        console.log('💓 MQTT heartbeat - connection stable');
      }
    }, 120000); // Cada 2 minutos

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        // Solo log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`📨 MQTT message received on ${topic}:`, data);
        }
        
        // Handle different message types
        handleMqttMessage(topic, data);
      } catch (error) {
        console.error('❌ Error parsing MQTT message:', error.message);
      }
    });

    // Manejar desconexión después de múltiples intentos
    client.on('reconnect', () => {
      if (reconnectAttempts >= 20) {
        console.error('❌ MQTT max reconnection attempts reached, stopping reconnection');
        client.end(true);
      }
    });

  } catch (error) {
    console.error('❌ Failed to create MQTT client:', error.message);
  }
}

// Función para diagnosticar problemas de conexión EMQX
function diagnoseEmqxConnection() {
  console.log('🔍 EMQX Connection Diagnostics:');
  console.log('  - Broker URL:', process.env.MQTT_BROKER_URL || 'Not set');
  console.log('  - Client ID:', mqttOptions.clientId);
  console.log('  - Username:', process.env.MQTT_USERNAME ? 'Set' : 'Not set');
  console.log('  - Password:', process.env.MQTT_PASSWORD ? 'Set' : 'Not set');
  console.log('  - Keepalive:', mqttOptions.keepalive, 'seconds');
  console.log('  - Reconnect Period:', mqttOptions.reconnectPeriod, 'ms');
  console.log('  - Connect Timeout:', mqttOptions.connectTimeout, 'ms');
  console.log('  - Protocol Version:', mqttOptions.protocolVersion);
  console.log('  - Will Topic:', mqttOptions.will.topic);
}

// Inicializar MQTT solo si está configurado
if (process.env.MQTT_BROKER_URL) {
  diagnoseEmqxConnection();
  createMqttClient();
} else {
  console.log('ℹ️ MQTT not configured, skipping MQTT initialization');
  // Crear un cliente dummy para evitar errores
  client = {
    connected: false,
    publish: () => {},
    subscribe: () => {},
    end: () => {}
  };
}

// Handle incoming MQTT messages
function handleMqttMessage(topic, data) {
  try {
    switch (topic) {
      case 'workbit/access/request':
        handleAccessRequest(data);
        break;
      case 'workbit/sensors/infrared':
        handleInfraredSensorData(data);
        break;
      case 'workbit/sensors/environmental_data':
        handleEnvironmentalData(data);
        break;
      case 'workbit/devices/add':
        handleDeviceRegistration(data);
        break;
      case 'workbit/access/guests':
        handleGuestAccess(data);
        break;
      default:
        // Handle pattern-based topics
        if (topic.match(/^workbit\/devices\/.+\/readings$/)) {
          handleDeviceReadings(topic, data);
        } else if (topic.match(/^workbit\/access\/credentials\/\d+$/)) {
          handleCredentialsUpdate(topic, data);
        } else if (topic.match(/^workbit\/alerts\/\d+$/)) {
          handleSpaceAlert(topic, data);
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`📬 Unhandled MQTT topic: ${topic}`);
        }
    }
  } catch (error) {
    console.error(`❌ Error handling MQTT message on topic ${topic}:`, error.message);
  }
}

// MQTT message handlers
async function handleAccessRequest(data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚪 RFID Access request received:`, data);
    }

    // Extract card code from the data
    const cardCode = data.card_code || data.cardCode || data.code;
    
    if (!cardCode) {
      console.error('❌ No card code found in access request data');
      return;
    }

    // Log the access attempt to database
    const accessLog = new AccessLog({
      card_code: cardCode,
      access_granted: false, // Will be updated based on validation
      source: 'rfid',
      mqtt_topic: 'workbit/access/request',
      raw_data: data,
      timestamp: new Date()
    });

    await accessLog.save();

    // TODO: Validate card access against user database and reservations
    // For now, we'll just log the attempt
    console.log(`📝 Access attempt logged for card: ${cardCode}`);

  } catch (error) {
    console.error('❌ Error handling access request:', error.message);
  }
}

function handleInfraredSensorData(data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📡 Infrared sensor data:`, data);
  }
  // TODO: Process infrared sensor data
  // This could be used for occupancy detection, motion alerts, etc.
}

// Handle device readings from MQTT
async function handleDeviceReadings(topic, data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Device reading received on ${topic}:`, data);
    }

    // Extract device_id from topic (workbit/devices/DEVICE_ID/readings)
    const deviceId = topic.split('/')[2];
    
    // Validate required fields
    const { readings, space_id, device_status = 'online', battery_level, signal_strength } = data;
    
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      console.error('❌ Invalid readings data format');
      return;
    }

    // Get device info to validate space_id
    const device = await Device.findOne({ device_id: deviceId });
    if (!device) {
      console.error(`❌ Device ${deviceId} not found in database`);
      return;
    }

    // Create new reading record
    const deviceReading = new DeviceReading({
      device_id: deviceId,
      space_id: space_id || device.space_id,
      readings: readings,
      device_status,
      battery_level,
      signal_strength,
      raw_data: data
    });

    await deviceReading.save();

    // Update device last_seen
    device.last_seen = new Date();
    device.last_data = data;
    await device.save();

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Device reading saved for ${deviceId}: ${readings.length} sensors`);
    }

  } catch (error) {
    console.error('❌ Error handling device readings:', error.message);
  }
}

// Handle device registration from MQTT
async function handleDeviceRegistration(data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 Device registration received:`, data);
    }

    // Validate required fields
    const { device_id, name, type, sensors } = data;
    
    // Convert space_id to number if it's a string
    const space_id = typeof data.space_id === 'string' ? parseInt(data.space_id) : data.space_id;
    const space_name = data.space_name;
    
    // Extract mqtt_topic from either mqtt_topic field or mqtt_topics object
    let mqtt_topic = data.mqtt_topic;
    if (!mqtt_topic && data.mqtt_topics) {
      // If mqtt_topics object is provided, use the main topic or the first available topic
      mqtt_topic = data.mqtt_topics.mqtt_topic || 
                   data.mqtt_topics.events || 
                   Object.values(data.mqtt_topics)[0];
    }
    
    if (!device_id || !name || !type || !space_id || !space_name) {
      console.error('❌ Missing required fields in device registration:', {
        device_id: device_id || 'MISSING',
        name: name || 'MISSING',
        type: type || 'MISSING',
        space_id: space_id || 'MISSING',
        space_name: space_name || 'MISSING',
        mqtt_topic: mqtt_topic || 'GENERATED'
      });
      console.error('📋 Full data received:', JSON.stringify(data, null, 2));
      return;
    }

    // Generate default mqtt_topic if still missing
    if (!mqtt_topic) {
      mqtt_topic = `workbit/devices/${device_id}`;
      console.log(`🔧 Generated default mqtt_topic: ${mqtt_topic}`);
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ device_id });
    
    if (existingDevice) {
      // Check if space_id has changed
      const spaceChanged = existingDevice.space_id !== space_id;
      
      // Update device with new data (including space_id if changed)
      existingDevice.last_seen = new Date();
      existingDevice.last_data = data;
      existingDevice.space_id = space_id;
      existingDevice.space_name = space_name;
      existingDevice.name = name; // Allow name updates too
      existingDevice.sensors = sensors || existingDevice.sensors;
      existingDevice.mqtt_topic = mqtt_topic;
      existingDevice.mqtt_topics = data.mqtt_topics || existingDevice.mqtt_topics || {};
      existingDevice.hardware_info = {
        model: data.hardware_info?.model || existingDevice.hardware_info?.model || 'Unknown',
        firmware_version: data.hardware_info?.firmware_version || existingDevice.hardware_info?.firmware_version || 'Unknown',
        mac_address: data.hardware_info?.mac_address || existingDevice.hardware_info?.mac_address || '',
        ip_address: data.hardware_info?.ip_address || existingDevice.hardware_info?.ip_address || ''
      };
      // Handle location field - can be string or object
      if (data.location) {
        if (typeof data.location === 'string') {
          existingDevice.location = { room: data.location };
        } else {
          existingDevice.location = data.location;
        }
      }
      
      await existingDevice.save();
      
      if (process.env.NODE_ENV === 'development') {
        if (spaceChanged) {
          console.log(`🔄 Device ${device_id} moved from space ${existingDevice.space_id} to space ${space_id}`);
        } else {
          console.log(`🔄 Device ${device_id} already exists, updated last_seen`);
        }
      }
      return;
    }

    // Create new device
    const newDevice = new Device({
      device_id,
      name,
      type,
      space_id,
      space_name,
      sensors: sensors || [],
      mqtt_topic,
      mqtt_topics: data.mqtt_topics || {},
      hardware_info: {
        model: data.hardware_info?.model || 'Unknown',
        firmware_version: data.hardware_info?.firmware_version || 'Unknown',
        mac_address: data.hardware_info?.mac_address || '',
        ip_address: data.hardware_info?.ip_address || ''
      },
      location: typeof data.location === 'string' ? { room: data.location } : (data.location || {}),
      last_data: data
    });

    await newDevice.save();
    console.log(`✅ New device registered: ${name} (${device_id})`);

  } catch (error) {
    console.error('❌ Error handling device registration:', error.message);
  }
}

// ================= NUEVOS HANDLERS ESTANDARIZADOS =================

// Handler para datos ambientales del módulo de monitoreo
async function handleEnvironmentalData(data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌡️ Environmental data received:`, data);
    }

    const { space_id, device_id, timestamp, co2_sensor, temperature_sensor, humidity_sensor, led_status } = data;
    
    if (!space_id || !device_id) {
      console.error('❌ Missing required fields in environmental data');
      return;
    }

    // Crear array de readings estandarizado
    const readings = [];

    // Procesar sensor de CO2
    if (co2_sensor) {
      const quality = getEnvironmentalQuality(co2_sensor.value, 'co2');
      readings.push({
        sensor_name: 'CO2',
        sensor_type: 'co2',
        value: co2_sensor.value,
        unit: co2_sensor.unit,
        quality: quality
      });

      // Generar alerta si es crítico
      if (quality === 'critical') {
        await Alert.createSpaceAlert({
          space_id: parseInt(space_id),
          alert_type: 'co2_critical',
          severity: 'critical',
          value: co2_sensor.value,
          message: `Niveles de CO₂ críticos: ${co2_sensor.value} ppm`,
          device_id,
          sensor_data: {
            sensor_type: 'co2',
            sensor_value: co2_sensor.value,
            sensor_unit: co2_sensor.unit,
            threshold_value: 1200
          }
        });
      }
    }

    // Procesar sensor de temperatura
    if (temperature_sensor) {
      const quality = getEnvironmentalQuality(temperature_sensor.value, 'temperature');
      readings.push({
        sensor_name: 'Temperatura',
        sensor_type: 'temperature',
        value: temperature_sensor.value,
        unit: temperature_sensor.unit,
        quality: quality
      });

      if (quality === 'critical') {
        await Alert.createSpaceAlert({
          space_id: parseInt(space_id),
          alert_type: 'temperature_critical',
          severity: 'high',
          value: temperature_sensor.value,
          message: `Temperatura fuera de rango: ${temperature_sensor.value}°C`,
          device_id,
          sensor_data: {
            sensor_type: 'temperature',
            sensor_value: temperature_sensor.value,
            sensor_unit: temperature_sensor.unit
          }
        });
      }
    }

    // Procesar sensor de humedad
    if (humidity_sensor) {
      const quality = getEnvironmentalQuality(humidity_sensor.value, 'humidity');
      readings.push({
        sensor_name: 'Humedad',
        sensor_type: 'humidity',
        value: humidity_sensor.value,
        unit: humidity_sensor.unit,
        quality: quality
      });

      if (quality === 'critical') {
        await Alert.createSpaceAlert({
          space_id: parseInt(space_id),
          alert_type: 'humidity_critical',
          severity: 'medium',
          value: humidity_sensor.value,
          message: `Humedad fuera de rango: ${humidity_sensor.value}%`,
          device_id,
          sensor_data: {
            sensor_type: 'humidity',
            sensor_value: humidity_sensor.value,
            sensor_unit: humidity_sensor.unit
          }
        });
      }
    }

    // Guardar readings en la base de datos
    if (readings.length > 0) {
      const deviceReading = new DeviceReading({
        device_id,
        space_id: parseInt(space_id),
        readings: readings,
        device_status: 'online',
        raw_data: data
      });

      await deviceReading.save();

      // Actualizar device last_seen
      await Device.findOneAndUpdate(
        { device_id },
        { 
          last_seen: new Date(),
          last_data: data,
          status: 'active'
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Environmental reading saved for device ${device_id}: ${readings.length} sensors`);
      }
    }

  } catch (error) {
    console.error('❌ Error handling environmental data:', error.message);
  }
}

// Handler para eventos IR estandarizados (con conteo de personas)
async function handleInfraredSensorData(data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`👥 Infrared sensor data:`, data);
    }

    const { space_id, device_id, sensor_id, sensor_type, event, people_inside, timestamp } = data;
    
    if (!space_id || !event || people_inside === undefined) {
      console.error('❌ Missing required fields in infrared data');
      return;
    }

    // Validar capacidad
    const maxCapacity = 8;
    if (people_inside > maxCapacity) {
      await Alert.createSpaceAlert({
        space_id: parseInt(space_id),
        alert_type: 'capacity_exceeded',
        severity: 'high',
        value: people_inside,
        message: `Capacidad excedida: ${people_inside} personas (máximo ${maxCapacity})`,
        device_id,
        people_count: people_inside
      });
    }

    // Crear reading estandarizado
    const reading = {
      sensor_name: 'Presencia',
      sensor_type: 'infrared_pair',
      value: people_inside,
      unit: 'personas',
      event: event,
      quality: people_inside <= maxCapacity ? 'good' : 'critical'
    };

    const deviceReading = new DeviceReading({
      device_id,
      space_id: parseInt(space_id),
      readings: [reading],
      people_count: people_inside,
      last_people_update: new Date(),
      device_status: 'online',
      raw_data: data
    });

    await deviceReading.save();

    // Actualizar device
    await Device.findOneAndUpdate(
      { device_id },
      { 
        last_seen: new Date(),
        last_data: data,
        status: 'active'
      }
    );

    console.log(`✅ IR Event logged: ${event} in space ${space_id}, people: ${people_inside}`);

  } catch (error) {
    console.error('❌ Error handling infrared sensor data:', error.message);
  }
}

// Handler para actualizaciones de credenciales
async function handleCredentialsUpdate(topic, data) {
  try {
    const spaceId = topic.split('/')[3]; // workbit/access/credentials/SPACE_ID
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Credentials update for space ${spaceId}:`, data);
    }

    // Aquí se podría implementar lógica adicional para almacenar 
    // las credenciales en caché o registrar el evento
    console.log(`✅ Credentials updated for space ${spaceId}`);

  } catch (error) {
    console.error('❌ Error handling credentials update:', error.message);
  }
}

// Handler para alertas de espacios
async function handleSpaceAlert(topic, data) {
  try {
    const spaceId = topic.split('/')[2]; // workbit/alerts/SPACE_ID
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️ Space alert for space ${spaceId}:`, data);
    }

    const { alert_type, value, message, timestamp } = data;

    if (alert_type && message) {
      await Alert.createSpaceAlert({
        space_id: parseInt(spaceId),
        alert_type,
        severity: getSeverityFromAlertType(alert_type),
        value,
        message,
        device_id: data.device_id
      });

      console.log(`⚠️ Alert created: ${alert_type} in space ${spaceId}`);
    }

  } catch (error) {
    console.error('❌ Error handling space alert:', error.message);
  }
}

// Handler para acceso de invitados (legacy)
async function handleGuestAccess(data) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`👤 Guest access update:`, data);
    }
    // Mantener compatibilidad con sistema legacy
  } catch (error) {
    console.error('❌ Error handling guest access:', error.message);
  }
}

// ================= FUNCIONES AUXILIARES =================

// Calcular calidad basada en umbrales estandarizados
function getEnvironmentalQuality(value, sensorType) {
  const thresholds = {
    co2: { good: [0, 800], warning: [800, 1200], critical: [1200, Infinity] },
    temperature: { good: [20, 25], warning: [18, 28], critical: [-Infinity, 18, 28, Infinity] },
    humidity: { good: [40, 60], warning: [30, 70], critical: [-Infinity, 30, 70, Infinity] }
  };

  const threshold = thresholds[sensorType];
  if (!threshold) return 'unknown';

  if (sensorType === 'co2') {
    if (value < threshold.good[1]) return 'good';
    if (value < threshold.warning[1]) return 'warning';
    return 'critical';
  } else if (sensorType === 'temperature') {
    if (value >= threshold.good[0] && value <= threshold.good[1]) return 'good';
    if (value >= threshold.warning[0] && value <= threshold.warning[1]) return 'warning';
    return 'critical';
  } else if (sensorType === 'humidity') {
    if (value >= threshold.good[0] && value <= threshold.good[1]) return 'good';
    if (value >= threshold.warning[0] && value <= threshold.warning[1]) return 'warning';
    return 'critical';
  }

  return 'unknown';
}

// Determinar severidad basada en tipo de alerta
function getSeverityFromAlertType(alertType) {
  const severityMap = {
    'capacity_exceeded': 'high',
    'co2_critical': 'critical',
    'detection_error': 'medium',
    'temperature_critical': 'high',
    'humidity_critical': 'medium',
    'device_offline': 'medium'
  };

  return severityMap[alertType] || 'medium';
}

// ================= FUNCIONES PUBLICACIÓN =================

// Helper functions to publish messages
const publishAccessResponse = (cardCode, accessGranted) => {
  if (client && client.connected) {
    const topic = 'workbit/access/response';
    const message = JSON.stringify({
      card_code: cardCode,
      access_granted: accessGranted,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: false }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish to ${topic}:`, err.message);
      } else {
        console.log(`✅ Access response published for card: ${cardCode}, granted: ${accessGranted}`);
      }
    });
  }
};

const publishGuestsAccess = (guests) => {
  if (client && client.connected) {
    const topic = 'workbit/access/guests';
    const message = JSON.stringify({
      guests: guests,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: false }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish to ${topic}:`, err.message);
      } else {
        console.log(`✅ Guests access updated:`, guests);
      }
    });
  }
};

const publishSpaceStatus = (spaceId, status) => {
  if (client && client.connected) {
    const topic = 'workbit/spaces/status';
    const message = JSON.stringify({
      space_id: spaceId,
      status: status,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: false }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish space status to ${topic}:`, err.message);
      } else {
        console.log(`✅ Space status published: space ${spaceId} -> ${status}`);
      }
    });
  } else {
    console.warn('⚠️ MQTT client not connected, cannot publish space status');
  }
};

// ================= NUEVAS FUNCIONES DE PUBLICACIÓN ESTANDARIZADAS =================

// Publicar credenciales RFID por espacio (según especificaciones)
const publishCredentials = (spaceId, credentials) => {
  if (client && client.connected) {
    const topic = `workbit/access/credentials/${spaceId}`;
    const message = JSON.stringify({
      space_id: parseInt(spaceId),
      reservations: credentials.reservations || [],
      master_cards: credentials.master_cards || ["MASTER001", "MASTER002", "ADMIN123"],
      timestamp: new Date().toISOString(),
      expires_at: credentials.expires_at
    });
    
    client.publish(topic, message, { qos: 1, retain: true }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish credentials to ${topic}:`, err.message);
      } else {
        console.log(`✅ Credentials published for space ${spaceId}: ${credentials.reservations?.length || 0} reservations`);
      }
    });
  } else {
    console.warn('⚠️ MQTT client not connected, cannot publish credentials');
  }
};

// Publicar alerta por espacio (según especificaciones)
const publishAlert = (spaceId, alertData) => {
  if (client && client.connected) {
    const topic = `workbit/alerts/${spaceId}`;
    const message = JSON.stringify({
      space_id: parseInt(spaceId),
      alert_type: alertData.alert_type,
      value: alertData.value,
      message: alertData.message,
      severity: alertData.severity || 'medium',
      device_id: alertData.device_id,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: false }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish alert to ${topic}:`, err.message);
      } else {
        console.log(`✅ Alert published for space ${spaceId}: ${alertData.alert_type}`);
      }
    });
  } else {
    console.warn('⚠️ MQTT client not connected, cannot publish alert');
  }
};

// Publicar actualización de conteo de personas
const publishPeopleCount = (spaceId, peopleCount, event) => {
  if (client && client.connected) {
    const topic = `workbit/spaces/${spaceId}/occupancy`;
    const message = JSON.stringify({
      space_id: parseInt(spaceId),
      people_count: peopleCount,
      event: event, // 'entry', 'exit', 'update'
      max_capacity: 8,
      occupancy_percentage: Math.round((peopleCount / 8) * 100),
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, { qos: 1, retain: true }, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish people count to ${topic}:`, err.message);
      } else {
        console.log(`✅ People count published for space ${spaceId}: ${peopleCount} people`);
      }
    });
  } else {
    console.warn('⚠️ MQTT client not connected, cannot publish people count');
  }
};

// Publicar actualizaciones de reservas
const publishReservationUpdate = (reservationId, action, data) => {
  if (!client || !client.connected) {
    console.warn('⚠️ MQTT client not connected, cannot publish reservation update');
    return;
  }

  const topic = `workbit/reservations/${action}`;
  const message = JSON.stringify({
    reservation_id: reservationId,
    action,
    data,
    timestamp: new Date().toISOString()
  });

  client.publish(topic, message, { qos: 1, retain: false }, (err) => {
    if (err && process.env.NODE_ENV === 'development') {
      console.error(`❌ Failed to publish reservation update to ${topic}:`, err.message);
    } else {
      console.log(`✅ Reservation update published: ${action} for reservation ${reservationId}`);
    }
  });
};

module.exports = {
  client,
  publishAccessResponse,
  publishGuestsAccess,
  publishSpaceStatus,
  // Nuevas funciones estandarizadas
  publishCredentials,
  publishAlert,
  publishPeopleCount,
  publishReservationUpdate
}; 