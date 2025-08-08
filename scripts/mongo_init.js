/*
WorkBit - Script de Inicialización de MongoDB (NoSQL)
Responsables:
    Mayo Ramos Angel David
    Alvarez Galindo Aldo Yamil
    Munoz Reynoso Oscar Gael
    Gomez Miramontes Daniel
Grupo: 5A
Fecha de entrega: 08/08/25
Este script crea colecciones, índices y agrega datos de ejemplo mínimos.
Ajuste nombres o índices según su entorno. Para ejecutarlo con mongosh:

  mongosh "<CONNECTION_STRING>" c:\workbit\scripts\mongo_init.js

Requiere permisos de readWrite en la base de datos objetivo.
*/

const DB_NAME = process.env.MONGODB_DB_NAME || 'workbit_sensors';

function ensureDb(db, name) {
  const dbs = db.getMongo().getDBNames();
  if (!dbs.includes(name)) {
    print(`Creando base de datos: ${name}`);
  }
  return db.getSiblingDB(name);
}

(function() {
  const adminDb = db.getSiblingDB('admin');
  const appDb = ensureDb(db, DB_NAME);
  
  print(`Usando base de datos: ${appDb.getName()}`);

  // 1) devices
  print('Creando colección: devices');
  appDb.createCollection('devices');
  appDb.devices.createIndex({ device_id: 1 }, { unique: true });
  appDb.devices.createIndex({ space_id: 1, type: 1 });
  appDb.devices.createIndex({ status: 1, last_seen: -1 });
  # WorkBit — Inicialización de MongoDB (Guía en Markdown)

  Responsables:
  - Mayo Ramos Angel David
  - Alvarez Galindo Aldo Yamil
  - Muñoz Reynoso Oscar Gael
  - Gomez Miramontes Daniel

  Grupo: 5A  
  Fecha de entrega: 08/08/25

  ## Objetivo

  Este documento describe cómo preparar la base de datos NoSQL (MongoDB) para WorkBit: colecciones, índices recomendados, datos de ejemplo y cómo ejecutar el script de inicialización. No contiene código ejecutable; para la inicialización automática use el archivo `scripts/mongo_init.js`.

  ## Prerrequisitos

  - MongoDB Atlas o instancia local de MongoDB
  - Usuario con permisos de lectura y escritura sobre la base de datos
  - Cadena de conexión válida

  ## Ejecución del script de inicialización

  El script que crea colecciones, índices y datos mínimos está en `c:\workbit\scripts\mongo_init.js`.

  Comando (PowerShell):

  ```powershell
  mongosh "<CONNECTION_STRING>" c:\workbit\scripts\mongo_init.js
  ```

  Variables de entorno de apoyo:

  - `MONGODB_DB_NAME` (por defecto: `workbit_sensors`)

  ## Esquema de colecciones

  ### 1) devices
  Inventario de dispositivos IoT.

  Campos clave:
  - `device_id` (string, único)
  - `name` (string)
  - `type` (string: environmental | access_control)
  - `space_id` (number)
  - `space_name` (string)
  - `status` (string: active | inactive | maintenance | offline)
  - `sensors` (array: { name, type, unit, sensor_id?, description? })
  - `location` (obj: building, floor, room, coordinates{x,y})
  - `hardware_info` (obj: model, firmware_version, mac_address, ip_address)
  - `last_seen` (date)
  - `mqtt_topic` (string, único)
  - `mqtt_topics` (obj)

  Índices sugeridos:
  - `{ device_id:1 }` (único)
  - `{ space_id:1, type:1 }`
  - `{ status:1, last_seen:-1 }`
  - `{ mqtt_topic:1 }`

  Ejemplo de documento:

  ```json
  {
    "device_id": "ESP32-TEMP-01",
    "name": "Sensor Temperatura Sala A",
    "type": "environmental",
    "space_id": 1,
    "space_name": "Sala de Reuniones A",
    "status": "active",
    "sensors": [
      { "name": "Temp", "type": "temperature", "unit": "°C" },
      { "name": "Hum", "type": "humidity", "unit": "%" }
    ],
    "mqtt_topic": "workbit/devices/ESP32-TEMP-01",
    "last_seen": "2025-06-18T13:25:00Z"
  }
  ```

  ### 2) device_readings
  Lecturas de sensores en tiempo real por dispositivo/espacio.

  Campos clave:
  - `device_id` (string)
  - `space_id` (number)
  - `readings` (array: { sensor_name, sensor_type, value, unit?, quality?, event? })
  - `timestamp` (date)
  - `device_status` (online | offline | error)
  - `battery_level` (0..100)
  - `signal_strength` (-100..0)
  - `people_count`, `last_people_update` (opcional)
  - `raw_data` (mixed)

  Índices sugeridos y TTL:
  - `{ device_id:1, timestamp:-1 }`
  - `{ space_id:1, timestamp:-1 }`
  - `{ 'readings.sensor_type':1, timestamp:-1 }`
  - TTL opcional: `{ timestamp:1 }` con 30 días

  Ejemplo de documento:

  ```json
  {
    "device_id": "ESP32-TEMP-01",
    "space_id": 1,
    "readings": [
      { "sensor_name": "Temp", "sensor_type": "temperature", "value": 24.1, "unit": "°C", "quality": "good" },
      { "sensor_name": "Hum", "sensor_type": "humidity", "value": 45, "unit": "%", "quality": "good" }
    ],
    "device_status": "online",
    "timestamp": "2025-06-18T13:00:00Z"
  }
  ```

  ### 3) alerts
  Alertas ambientales/operativas.

  Campos clave:
  - `space_id` (number)
  - `alert_type` (capacity_exceeded | co2_critical | detection_error | temperature_critical | humidity_critical | device_offline)
  - `severity` (low | medium | high | critical)
  - `value` (number opcional)
  - `message` (string)
  - `device_id` (string opcional)
  - `sensor_data` (obj: sensor_type, sensor_value, sensor_unit, threshold_value)
  - `people_count` (number opcional)
  - `resolved` (bool), `resolved_at` (date), `resolved_by` (user_id)
  - `notified_users` (array: { user_id, notified_at, notification_method })

  Índices sugeridos y TTL:
  - `{ space_id:1, alert_type:1, resolved:1 }`
  - `{ severity:1, resolved:1, createdAt:-1 }`
  - TTL para resueltas (90 días) sobre `resolved_at` con filtro parcial `{ resolved:true }`

  Ejemplo de documento:

  ```json
  {
    "space_id": 1,
    "alert_type": "co2_critical",
    "severity": "high",
    "value": 950,
    "message": "CO2 excede umbral",
    "resolved": false,
    "createdAt": "2025-06-18T13:15:00Z"
  }
  ```

  ### 4) access_logs
  Registro de accesos (RFID/API).

  Campos clave:
  - `card_code` (string)
  - `user_id` (number)
  - `space_id` (number)
  - `reservation_id` (number opcional)
  - `access_granted` (bool)
  - `access_type` (regular | guest | admin)
  - `timestamp` (date)
  - `source` (rfid | manual | api)
  - `mqtt_topic` (string opcional)
  - `raw_data` (mixed)

  Índices sugeridos y TTL:
  - `{ card_code:1, timestamp:-1 }`
  - `{ user_id:1, timestamp:-1 }`
  - `{ space_id:1, timestamp:-1 }`
  - `{ access_granted:1, timestamp:-1 }`
  - `{ access_type:1, timestamp:-1 }`
  - TTL anual sobre `timestamp`

  Ejemplo de documento:

  ```json
  {
    "card_code": "CARD-001",
    "user_id": 5,
    "space_id": 1,
    "access_granted": true,
    "access_type": "regular",
    "source": "rfid",
    "timestamp": "2025-06-18T13:00:00Z"
  }
  ```

  ## Relación con el esquema SQL

  - `space_id` referencia conceptualmente a `spaces.id` (PostgreSQL/Supabase).
  - `user_id` referencia conceptualmente a `users.id`.
  - No existen claves foráneas en MongoDB; la aplicación mantiene la coherencia.

  ## Solución de problemas

  - Verifique que la cadena de conexión tenga permisos `readWrite`.
  - Si fallan las TTL, confirme que las colecciones ya existían y recree el índice TTL.
  - En Atlas, valide que la IP origen esté permitida o que use Private Endpoint/VPN.

  ## Referencias

  - Script de inicialización: `c:\workbit\scripts\mongo_init.js`
  - Modelos de backend (Node.js): `workbit_back/models/Device.js`, `DeviceReading.js`, `Alert.js`, `AccessLog.js`
