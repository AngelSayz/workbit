const mqtt = require('mqtt');

const mqttOptions = {
  clientId: process.env.MQTT_CLIENT_ID || `workbit-backend-${Math.random().toString(16).substr(2, 8)}`,
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  keepalive: 60,
  clean: true
};

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

let client = null;

try {
  client = mqtt.connect(brokerUrl, mqttOptions);

  client.on('connect', () => {
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
    console.error('❌ MQTT client error:', error);
  });

  client.on('reconnect', () => {
    console.log('🔄 MQTT client reconnecting...');
  });

  client.on('offline', () => {
    console.warn('⚠️ MQTT client offline');
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 MQTT message received on ${topic}:`, data);
      
      // Handle different message types
      handleMqttMessage(topic, data);
    } catch (error) {
      console.error('❌ Error parsing MQTT message:', error);
    }
  });

} catch (error) {
  console.error('❌ Failed to create MQTT client:', error);
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
      console.log(`📬 Unhandled MQTT topic: ${topic}`);
  }
}

// MQTT message handlers
function handleSpaceStatusUpdate(spaceId, data) {
  console.log(`🏢 Space ${spaceId} status update:`, data);
  // TODO: Update space status in database
}

function handleAccessEvent(spaceId, eventType, data) {
  console.log(`🚪 Access ${eventType} for space ${spaceId}:`, data);
  // TODO: Log access event in database
}

function handleReservationUpdate(reservationId, data) {
  console.log(`📅 Reservation ${reservationId} update:`, data);
  // TODO: Update reservation status
}

function handleSystemMessage(messageType, data) {
  console.log(`⚙️ System ${messageType}:`, data);
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
      if (err) {
        console.error(`❌ Failed to publish to ${topic}:`, err);
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