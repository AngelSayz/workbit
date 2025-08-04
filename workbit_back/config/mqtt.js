const mqtt = require('mqtt');
const AccessLog = require('../models/AccessLog');
const Device = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');

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
        'workbit/access/request',       // RFID access requests
        'workbit/sensors/infrared',     // Infrared sensor data
        'workbit/devices/add',          // Device registration
        'workbit/devices/+/readings'    // Device sensor readings
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
  switch (topic) {
    case 'workbit/access/request':
      handleAccessRequest(data);
      break;
    case 'workbit/sensors/infrared':
      handleInfraredSensorData(data);
      break;
    case 'workbit/devices/add':
      handleDeviceRegistration(data);
      break;
    default:
      // Handle device readings with pattern matching
      if (topic.match(/^workbit\/devices\/.+\/readings$/)) {
        handleDeviceReadings(topic, data);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`📬 Unhandled MQTT topic: ${topic}`);
      }
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
    const { device_id, name, type, space_id, space_name, sensors, mqtt_topic } = data;
    
    if (!device_id || !name || !type || !space_id || !space_name || !mqtt_topic) {
      console.error('❌ Missing required fields in device registration');
      return;
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
      existingDevice.hardware_info = {
        model: data.hardware_info?.model || existingDevice.hardware_info?.model || 'Unknown',
        firmware_version: data.hardware_info?.firmware_version || existingDevice.hardware_info?.firmware_version || 'Unknown',
        mac_address: data.hardware_info?.mac_address || existingDevice.hardware_info?.mac_address || '',
        ip_address: data.hardware_info?.ip_address || existingDevice.hardware_info?.ip_address || ''
      };
      existingDevice.location = data.location || existingDevice.location;
      
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
      hardware_info: {
        model: data.hardware_info?.model || 'Unknown',
        firmware_version: data.hardware_info?.firmware_version || 'Unknown',
        mac_address: data.hardware_info?.mac_address || '',
        ip_address: data.hardware_info?.ip_address || ''
      },
      location: data.location || {},
      last_data: data
    });

    await newDevice.save();
    console.log(`✅ New device registered: ${name} (${device_id})`);

  } catch (error) {
    console.error('❌ Error handling device registration:', error.message);
  }
}

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

module.exports = {
  client,
  publishAccessResponse,
  publishGuestsAccess,
  publishSpaceStatus
}; 