# Registro de Dispositivos IoT - WorkBit

## Descripción

Los dispositivos ESP32 deben enviar un mensaje JSON al topic MQTT `workbit/devices/add` para registrarse en el sistema. El sistema verificará si el dispositivo ya existe para evitar duplicaciones.

## Formato JSON

### Campos Requeridos

```json
{
  "device_id": "string",           // ID único del dispositivo (requerido)
  "name": "string",                // Nombre descriptivo del dispositivo (requerido)
  "type": "environmental|access_control", // Tipo de dispositivo (requerido)
  "space_id": number,              // ID del espacio asociado (requerido)
  "space_name": "string",          // Nombre del espacio (requerido)
  "mqtt_topic": "string"           // Topic MQTT del dispositivo (requerido)
}
```

### Campos Opcionales

```json
{
  "sensors": [                     // Array de sensores del dispositivo
    {
      "name": "string",            // Nombre del sensor
      "type": "string",            // Tipo de sensor
      "unit": "string",            // Unidad de medida (opcional)
      "description": "string"      // Descripción del sensor (opcional)
    }
  ],
  "hardware_info": {               // Información del hardware
    "model": "string",             // Modelo del dispositivo
    "firmware_version": "string",  // Versión del firmware
    "mac_address": "string",       // Dirección MAC
    "ip_address": "string"         // Dirección IP
  },
  "location": {                    // Información de ubicación
    "building": "string",          // Edificio
    "floor": "string",             // Piso
    "room": "string",              // Habitación
    "coordinates": {               // Coordenadas (opcional)
      "x": number,
      "y": number
    }
  }
}
```

## Ejemplos

### Dispositivo de Monitoreo Ambiental

```json
{
  "device_id": "env_001",
  "name": "Sensor Ambiental - Cubículo A1",
  "type": "environmental",
  "space_id": 1,
  "space_name": "Cubículo A1",
  "mqtt_topic": "workbit/devices/env_001",
  "sensors": [
    {
      "name": "Temperatura",
      "type": "temperature",
      "unit": "°C",
      "description": "Sensor de temperatura DHT22"
    },
    {
      "name": "Humedad",
      "type": "humidity",
      "unit": "%",
      "description": "Sensor de humedad DHT22"
    },
    {
      "name": "CO2",
      "type": "co2",
      "unit": "ppm",
      "description": "Sensor de CO2 MH-Z19"
    }
  ],
  "hardware_info": {
    "model": "ESP32-WROOM-32",
    "firmware_version": "v1.2.0",
    "mac_address": "24:6F:28:8B:3A:1C",
    "ip_address": "192.168.1.101"
  },
  "location": {
    "building": "Edificio Principal",
    "floor": "1",
    "room": "Cubículo A1"
  }
}
```

### Dispositivo de Control de Acceso

```json
{
  "device_id": "acc_001",
  "name": "Control de Acceso - Entrada Principal",
  "type": "access_control",
  "space_id": 1,
  "space_name": "Entrada Principal",
  "mqtt_topic": "workbit/devices/acc_001",
  "sensors": [
    {
      "name": "RFID Reader",
      "type": "rfid",
      "description": "Lector RFID RC522"
    },
    {
      "name": "LED Status",
      "type": "led",
      "description": "LED indicador de estado"
    },
    {
      "name": "Buzzer",
      "type": "buzzer",
      "description": "Buzzer para alertas"
    }
  ],
  "hardware_info": {
    "model": "ESP32-WROOM-32",
    "firmware_version": "v1.1.5",
    "mac_address": "24:6F:28:8B:3A:1E",
    "ip_address": "192.168.1.103"
  },
  "location": {
    "building": "Edificio Principal",
    "floor": "1",
    "room": "Entrada Principal"
  }
}
```

## Implementación en ESP32

### Código de Ejemplo

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración MQTT
const char* mqtt_server = "TU_MQTT_BROKER";
const int mqtt_port = 1883;
const char* mqtt_username = "TU_MQTT_USERNAME";
const char* mqtt_password = "TU_MQTT_PASSWORD";

WiFiClient espClient;
PubSubClient client(espClient);

// Información del dispositivo
const char* device_id = "env_001";
const char* device_name = "Sensor Ambiental - Cubículo A1";
const char* device_type = "environmental";
const int space_id = 1;
const char* space_name = "Cubículo A1";
const char* mqtt_topic = "workbit/devices/env_001";

void setup() {
  Serial.begin(115200);
  setupWiFi();
  setupMQTT();
  
  // Enviar registro del dispositivo al iniciar
  registerDevice();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Enviar datos de sensores cada 30 segundos
  static unsigned long lastTime = 0;
  if (millis() - lastTime > 30000) {
    sendSensorData();
    lastTime = millis();
  }
}

void registerDevice() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = device_id;
  doc["name"] = device_name;
  doc["type"] = device_type;
  doc["space_id"] = space_id;
  doc["space_name"] = space_name;
  doc["mqtt_topic"] = mqtt_topic;
  
  // Agregar sensores
  JsonArray sensors = doc.createNestedArray("sensors");
  
  JsonObject sensor1 = sensors.createNestedObject();
  sensor1["name"] = "Temperatura";
  sensor1["type"] = "temperature";
  sensor1["unit"] = "°C";
  sensor1["description"] = "Sensor de temperatura DHT22";
  
  JsonObject sensor2 = sensors.createNestedObject();
  sensor2["name"] = "Humedad";
  sensor2["type"] = "humidity";
  sensor2["unit"] = "%";
  sensor2["description"] = "Sensor de humedad DHT22";
  
  // Información de hardware
  JsonObject hardware = doc.createNestedObject("hardware_info");
  hardware["model"] = "ESP32-WROOM-32";
  hardware["firmware_version"] = "v1.2.0";
  hardware["mac_address"] = WiFi.macAddress();
  hardware["ip_address"] = WiFi.localIP().toString();
  
  // Ubicación
  JsonObject location = doc.createNestedObject("location");
  location["building"] = "Edificio Principal";
  location["floor"] = "1";
  location["room"] = "Cubículo A1";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Publicar en MQTT
  client.publish("workbit/devices/add", jsonString.c_str());
  Serial.println("Dispositivo registrado: " + jsonString);
}

void sendSensorData() {
  // Aquí iría el código para leer los sensores
  // y enviar los datos al topic correspondiente
  
  DynamicJsonDocument doc(256);
  doc["device_id"] = device_id;
  doc["temperature"] = 23.5;  // Ejemplo
  doc["humidity"] = 65.2;     // Ejemplo
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  client.publish(mqtt_topic, jsonString.c_str());
  Serial.println("Datos enviados: " + jsonString);
}

// Funciones de configuración WiFi y MQTT...
```

## Estados del Dispositivo

Los dispositivos pueden tener los siguientes estados:

- **active**: Dispositivo funcionando normalmente
- **inactive**: Dispositivo desactivado manualmente
- **maintenance**: Dispositivo en mantenimiento
- **offline**: Dispositivo no responde (automático después de 30 días sin actividad)

## Notas Importantes

1. **ID Único**: El `device_id` debe ser único en todo el sistema
2. **Reconexión**: Los dispositivos deben enviar el registro cada vez que se reinician
3. **Deduplicación**: El sistema evita duplicados basándose en el `device_id`
4. **Topic MQTT**: El `mqtt_topic` debe ser único para cada dispositivo
5. **Espacios**: El `space_id` debe corresponder a un espacio válido en el sistema

## Testing

Para probar el registro de dispositivos, puedes usar el script incluido:

```bash
cd workbit_back
node scripts/test-devices.js
```

Este script enviará dispositivos de ejemplo al broker MQTT configurado. 