# Ejemplos de Lecturas de Dispositivos

## Formato JSON para Lecturas de Sensores

### 1. Dispositivo de Monitoreo Ambiental

**Tópico:** `workbit/devices/env_002/readings`

```json
{
  "device_id": "env_002",
  "space_id": 2,
  "readings": [
    {
      "sensor_name": "Sensor de Temperatura",
      "sensor_type": "temperature",
      "value": 23.5,
      "unit": "°C",
      "quality": "good"
    },
    {
      "sensor_name": "Sensor de Humedad",
      "sensor_type": "humidity",
      "value": 45.2,
      "unit": "%",
      "quality": "good"
    },
    {
      "sensor_name": "Sensor de CO2",
      "sensor_type": "co2",
      "value": 450,
      "unit": "ppm",
      "quality": "good"
    }
  ],
  "device_status": "online",
  "battery_level": 85,
  "signal_strength": -45
}
```

### 2. Dispositivo de Control de Acceso con Conteo de Personas

**Tópico:** `workbit/devices/access_002/readings`

```json
{
  "device_id": "access_002",
  "space_id": 2,
  "readings": [
    {
      "sensor_name": "Lector RFID",
      "sensor_type": "rfid",
      "value": "A1B2C3D4E5F6",
      "unit": "UID",
      "quality": "good"
    },
    {
      "sensor_name": "Sensor de Presencia Entrada",
      "sensor_type": "infrared_pair",
      "value": true,
      "unit": "N/A",
      "quality": "good"
    },
    {
      "sensor_name": "Sensor de Presencia Salida",
      "sensor_type": "infrared_pair",
      "value": false,
      "unit": "N/A",
      "quality": "good"
    },
    {
      "sensor_name": "Contador de Personas",
      "sensor_type": "people_count",
      "value": 3,
      "unit": "personas",
      "quality": "good"
    }
  ],
  "device_status": "online",
  "battery_level": 92,
  "signal_strength": -38
}
```

### 3. Dispositivo Mixto (Ambiental + Acceso)

**Tópico:** `workbit/devices/mixed_002/readings`

```json
{
  "device_id": "mixed_002",
  "space_id": 2,
  "readings": [
    {
      "sensor_name": "Sensor de Temperatura",
      "sensor_type": "temperature",
      "value": 24.1,
      "unit": "°C",
      "quality": "good"
    },
    {
      "sensor_name": "Sensor de Humedad",
      "sensor_type": "humidity",
      "value": 48.7,
      "unit": "%",
      "quality": "good"
    },
    {
      "sensor_name": "Lector RFID",
      "sensor_type": "rfid",
      "value": "F6E5D4C3B2A1",
      "unit": "UID",
      "quality": "good"
    },
    {
      "sensor_name": "Contador de Personas",
      "sensor_type": "people_count",
      "value": 2,
      "unit": "personas",
      "quality": "good"
    }
  ],
  "device_status": "online",
  "battery_level": 78,
  "signal_strength": -52
}
```

## Tipos de Sensores Soportados

- **`temperature`**: Temperatura ambiente
- **`humidity`**: Humedad relativa
- **`co2`**: Nivel de dióxido de carbono
- **`light`**: Nivel de iluminación
- **`motion`**: Detección de movimiento
- **`noise`**: Nivel de ruido
- **`rfid`**: Lectura de tarjetas RFID
- **`presence`**: Detección de presencia
- **`people_count`**: Conteo de personas en el espacio
- **`infrared_pair`**: Par de sensores infrarrojos para conteo

## Notas Importantes

1. **`people_count`**: Este sensor debe enviar el número total de personas en el espacio
2. **`infrared_pair`**: Para conteo de entrada/salida, usa dos sensores separados
3. **`value`**: Puede ser número, string, o boolean según el tipo de sensor
4. **`quality`**: Indica la calidad de la lectura (good, fair, poor)
5. **`timestamp`**: Se genera automáticamente en el backend

## Ejemplo Arduino para Envío

```cpp
void publishSensorReadings() {
  DynamicJsonDocument doc(1024);
  
  doc["device_id"] = "env_002";
  doc["space_id"] = 2;
  
  JsonArray readings = doc.createNestedArray("readings");
  
  // Temperatura
  JsonObject temp = readings.createNestedObject();
  temp["sensor_name"] = "Sensor de Temperatura";
  temp["sensor_type"] = "temperature";
  temp["value"] = 23.5;
  temp["unit"] = "°C";
  temp["quality"] = "good";
  
  // Humedad
  JsonObject hum = readings.createNestedObject();
  hum["sensor_name"] = "Sensor de Humedad";
  hum["sensor_type"] = "humidity";
  hum["value"] = 45.2;
  hum["unit"] = "%";
  hum["quality"] = "good";
  
  // CO2
  JsonObject co2 = readings.createNestedObject();
  co2["sensor_name"] = "Sensor de CO2";
  co2["sensor_type"] = "co2";
  co2["value"] = 450;
  co2["unit"] = "ppm";
  co2["quality"] = "good";
  
  // Conteo de personas
  JsonObject people = readings.createNestedObject();
  people["sensor_name"] = "Contador de Personas";
  people["sensor_type"] = "people_count";
  people["value"] = currentPeopleCount; // Variable que mantienes en Arduino
  people["unit"] = "personas";
  people["quality"] = "good";
  
  doc["device_status"] = "online";
  doc["battery_level"] = getBatteryLevel();
  doc["signal_strength"] = WiFi.RSSI();
  
  char buffer[1024];
  serializeJson(doc, buffer);
  
  client.publish("workbit/devices/env_002/readings", buffer);
  Serial.println("✅ Lecturas de sensores publicadas");
}
``` 