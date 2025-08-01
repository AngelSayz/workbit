const mqtt = require('mqtt');
const AccessLog = require('../models/AccessLog');

// Configuración MQTT optimizada
const mqttOptions = {
  clientId: process.env.MQTT_CLIENT_ID || `workbit-backend-${Math.random().toString(16).substr(2, 8)}`,
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  reconnectPeriod: 5000, // Aumentar el tiempo entre reconexiones
  connectTimeout: 30 * 1000,
  keepalive: 60,
  clean: true,
  rejectUnauthorized: false, // Para brokers sin SSL
  maxReconnectAttempts: 5 // Limitar intentos de reconexión
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
      console.log('✅ MQTT client connected to broker');
      
      // Subscribe to relevant topics
      const topics = [
        'workbit/access/request',       // RFID access requests
        'workbit/sensors/infrared'      // Infrared sensor data
      ];
      
      topics.forEach(topic => {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(`❌ Failed to subscribe to ${topic}:`, err);
          } else {
            console.log(`📡 Subscribed to MQTT topic: ${topic}`);
          }
        });
      });
    });

    client.on('error', (error) => {
      console.error('❌ MQTT client error:', error.message);
    });

    client.on('reconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts <= 3) {
        console.log(`🔄 MQTT client reconnecting... (attempt ${reconnectAttempts})`);
      } else {
        console.log(`⚠️ MQTT reconnection attempt ${reconnectAttempts} - limiting logs`);
      }
    });

    client.on('offline', () => {
      if (isInitialized) {
        console.warn('⚠️ MQTT client offline');
      }
    });

    client.on('close', () => {
      console.log('🔌 MQTT client connection closed');
    });

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
      if (reconnectAttempts >= 10) {
        console.error('❌ MQTT max reconnection attempts reached, stopping reconnection');
        client.end(true);
      }
    });

  } catch (error) {
    console.error('❌ Failed to create MQTT client:', error.message);
  }
}

// Inicializar MQTT solo si está configurado
if (process.env.MQTT_BROKER_URL) {
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
    default:
      if (process.env.NODE_ENV === 'development') {
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

// Helper functions to publish messages
const publishAccessResponse = (cardCode, accessGranted) => {
  if (client && client.connected) {
    const topic = 'workbit/access/response';
    const message = JSON.stringify({
      card_code: cardCode,
      access_granted: accessGranted
    });
    
    client.publish(topic, message, (err) => {
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
      guests: guests
    });
    
    client.publish(topic, message, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish to ${topic}:`, err.message);
      } else {
        console.log(`✅ Guests access updated:`, guests);
      }
    });
  }
};

module.exports = {
  client,
  publishAccessResponse,
  publishGuestsAccess
}; 