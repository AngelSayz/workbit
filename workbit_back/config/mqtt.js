const mqtt = require('mqtt');

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
        'workbit/spaces/+/status',      // Space status updates
        'workbit/access/+/entry',       // Access control entries
        'workbit/access/+/exit',        // Access control exits
        'workbit/reservations/+/status', // Reservation status changes
        'workbit/system/heartbeat'      // System heartbeat
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
  const topicParts = topic.split('/');
  
  switch (topicParts[1]) {
    case 'spaces':
      handleSpaceStatusUpdate(topicParts[2], data);
      break;
    case 'access':
      handleAccessEvent(topicParts[2], topicParts[3], data);
      break;
    case 'reservations':
      handleReservationUpdate(topicParts[2], data);
      break;
    case 'system':
      handleSystemMessage(topicParts[2], data);
      break;
    default:
      if (process.env.NODE_ENV === 'development') {
        console.log(`📬 Unhandled MQTT topic: ${topic}`);
      }
  }
}

// MQTT message handlers
function handleSpaceStatusUpdate(spaceId, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🏢 Space ${spaceId} status update:`, data);
  }
  // TODO: Update space status in database
}

function handleAccessEvent(spaceId, eventType, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚪 Access ${eventType} for space ${spaceId}:`, data);
  }
  // TODO: Log access event in database
}

function handleReservationUpdate(reservationId, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📅 Reservation ${reservationId} update:`, data);
  }
  // TODO: Update reservation status
}

function handleSystemMessage(messageType, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚙️ System ${messageType}:`, data);
  }
}

// Helper functions to publish messages
const publishSpaceStatus = (spaceId, status) => {
  if (client && client.connected) {
    const topic = `workbit/spaces/${spaceId}/status`;
    const message = JSON.stringify({
      spaceId,
      status,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message, (err) => {
      if (err && process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to publish to ${topic}:`, err.message);
      }
    });
  }
};

const publishAccessEvent = (spaceId, eventType, userId, reservationId = null) => {
  if (client && client.connected) {
    const topic = `workbit/access/${spaceId}/${eventType}`;
    const message = JSON.stringify({
      spaceId,
      userId,
      reservationId,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message);
  }
};

const publishReservationUpdate = (reservationId, status, data = {}) => {
  if (client && client.connected) {
    const topic = `workbit/reservations/${reservationId}/status`;
    const message = JSON.stringify({
      reservationId,
      status,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    client.publish(topic, message);
  }
};

module.exports = {
  client,
  publishSpaceStatus,
  publishAccessEvent,
  publishReservationUpdate
}; 