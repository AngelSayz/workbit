# Sistema de Credenciales RFID - WorkBit

## Descripción General

El sistema de credenciales RFID permite enviar automáticamente las tarjetas autorizadas para una reserva al módulo de acceso ESP32 correspondiente, permitiendo acceso controlado basado en fechas y horarios de reserva.

## Arquitectura del Sistema

```
┌─────────────────┐    MQTT    ┌─────────────────┐    RFID    ┌─────────────────┐
│   Backend       │ ──────────► │  Módulo Acceso  │ ──────────► │   Usuario       │
│   (Node.js)     │             │   (ESP32)       │             │   (Tarjeta)     │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

## Flujo de Funcionamiento

### 1. Creación de Reserva
- Un usuario crea una reserva en el sistema web
- Se especifica el espacio, fecha/hora, y tarjetas RFID autorizadas

### 2. Envío de Credenciales
- El backend envía las credenciales por MQTT al topic `workbit/access/credentials/{space_id}`
- El módulo ESP32 recibe y almacena las credenciales

### 3. Validación de Acceso
- Cuando se escanea una tarjeta RFID, el ESP32:
  - Verifica si es una tarjeta maestra
  - Busca en las reservas activas
  - Valida que la fecha/hora actual esté dentro del rango de la reserva
  - Permite o deniega el acceso

## Formato de Mensaje MQTT

### Topic
```
workbit/access/credentials/{space_id}
```

### Payload JSON
```json
{
  "space_id": 1,
  "reservations": [
    {
      "reservation_id": "res_123",
      "authorized_cards": ["A1B2C3D4E5F6", "F6E5D4C3B2A1"],
      "valid_from": "2024-01-15T10:00:00.000Z",
      "valid_until": "2024-01-15T12:00:00.000Z",
      "owner": "usuario123"
    }
  ],
  "master_cards": ["MASTER001", "MASTER002", "ADMIN123"],
  "timestamp": "2024-01-15T09:55:00.000Z",
  "expires_at": "2024-01-15T12:00:00.000Z"
}
```

## API del Backend

### Enviar Credenciales para una Reserva

**Endpoint:** `POST /api/reservations/{id}/credentials`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "authorized_cards": ["A1B2C3D4E5F6", "F6E5D4C3B2A1"],
  "master_cards": ["MASTER001", "MASTER002", "ADMIN123"],
  "force_update": false
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Credentials sent successfully for reservation in Cubículo A1",
  "data": {
    "reservation_id": 123,
    "space_id": 1,
    "space_name": "Cubículo A1",
    "authorized_cards": ["A1B2C3D4E5F6", "F6E5D4C3B2A1"],
    "master_cards": ["MASTER001", "MASTER002", "ADMIN123"],
    "valid_from": "2024-01-15T10:00:00.000Z",
    "valid_until": "2024-01-15T12:00:00.000Z",
    "mqtt_published": true,
    "mqtt_topic": "workbit/access/credentials/1",
    "expires_in_minutes": 125,
    "total_reservations_updated": 1
  }
}
```

### Obtener Credenciales de un Espacio

**Endpoint:** `GET /api/reservations/spaces/{spaceId}/credentials`

**Query Parameters:**
- `include_expired` (boolean, default: false)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "space_id": 1,
    "space_name": "Cubículo A1",
    "active_reservations": [
      {
        "reservation_id": "res_123",
        "owner": "usuario123",
        "authorized_cards": ["A1B2C3D4E5F6"],
        "valid_from": "2024-01-15T10:00:00.000Z",
        "valid_until": "2024-01-15T12:00:00.000Z",
        "is_active": true,
        "minutes_remaining": 125
      }
    ],
    "master_cards": ["MASTER001", "MASTER002", "ADMIN123"],
    "total_authorized_cards": 1
  }
}
```

## Configuración del Módulo ESP32

### Variables Importantes

```cpp
// Estructura de credenciales
struct Credential {
  String reservation_id;
  String authorized_cards[15];  // Máximo 15 tarjetas
  int card_count;
  String valid_from;           // Fecha ISO 8601
  String valid_until;          // Fecha ISO 8601
  String owner;
  bool is_active;
};

// Configuración
const int MAX_RESERVATIONS = 5;
const int MAX_CARDS_PER_RESERVATION = 15;
const String MASTER_CARDS[] = {"MASTER001", "MASTER002", "ADMIN123"};
```

### Comandos Bluetooth/Serial

```
// Mostrar estado de credenciales
credentials

// Configurar WiFi
wifi:SSID,PASSWORD

// Configurar Space ID
spaceid:1

// Leer configuración EEPROM
read eeprom

// Limpiar EEPROM
clear eeprom
```

## Validación de Fechas

### En el ESP32
El módulo de acceso valida las fechas de la siguiente manera:

1. **Parseo de fechas ISO 8601** a timestamp Unix
2. **Comparación con tiempo actual** (usando NTP o RTC en producción)
3. **Validación de rango** (fecha actual entre inicio y fin de reserva)

### Función de Validación
```cpp
bool isReservationActive(const Credential& cred) {
  if (!cred.is_active) return false;
  
  unsigned long currentTime = getCurrentTimestamp();
  unsigned long startTime = parseISODate(cred.valid_from);
  unsigned long endTime = parseISODate(cred.valid_until);
  
  return (currentTime >= startTime && currentTime <= endTime);
}
```

## Ejemplos de Uso

### 1. Crear una Reserva y Enviar Credenciales

```bash
# 1. Crear reserva (usando la API de reservas)
curl -X POST "http://localhost:3000/api/reservations" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "space_id": 1,
    "start_time": "2024-01-15T10:00:00.000Z",
    "end_time": "2024-01-15T12:00:00.000Z",
    "reason": "Reunión de proyecto"
  }'

# 2. Enviar credenciales RFID
curl -X POST "http://localhost:3000/api/reservations/123/credentials" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "authorized_cards": ["A1B2C3D4E5F6", "F6E5D4C3B2A1"],
    "master_cards": ["MASTER001", "MASTER002", "ADMIN123"]
  }'
```

### 2. Verificar Estado en el ESP32

```bash
# Conectar por Bluetooth o Serial y enviar:
credentials
```

**Salida esperada:**
```
📋 === ESTADO DE CREDENCIALES ===
🔢 Total de reservas: 1
🔑 Tarjetas maestras: 3
⏰ Tiempo actual: 1705314000

📋 Reserva 1: res_123
   👤 Propietario: usuario123
   📅 Desde: 2024-01-15T10:00:00.000Z
   📅 Hasta: 2024-01-15T12:00:00.000Z
   🪪 Tarjetas: 2
   🔄 Estado: ✅ ACTIVA
   🪪 UIDs: A1B2C3D4E5F6, F6E5D4C3B2A1
================================
```

### 3. Probar Acceso RFID

1. **Tarjeta autorizada**: Acceso concedido
2. **Tarjeta maestra**: Acceso concedido
3. **Tarjeta no autorizada**: Acceso denegado
4. **Reserva expirada**: Acceso denegado

## Logs del Sistema

### Backend (MQTT)
```
✅ Credentials published for space 1: 1 reservations
📡 Subscribed to MQTT topic: workbit/access/credentials/1 (QoS 1)
```

### ESP32 (Serial/Bluetooth)
```
🔑 Recibiendo credenciales RFID estandarizadas...
📨 Mensaje recibido para espacio 1
📅 Timestamp: 2024-01-15T09:55:00.000Z
⏰ Expira: 2024-01-15T12:00:00.000Z
📋 Procesando 1 reservas
✅ Credencial agregada: res_123 (usuario123)
   📅 Desde: 2024-01-15T10:00:00.000Z
   📅 Hasta: 2024-01-15T12:00:00.000Z
   🪪 Tarjetas: 2
   🔄 Estado: ✅ ACTIVA
🔑 Credenciales actualizadas: 1 reservas activas
📋 Lista de acceso actualizada y lista para uso
```

## Consideraciones de Seguridad

### 1. Tarjetas Maestras
- Hardcodeadas en el firmware
- Acceso total sin restricciones de tiempo
- Solo para administradores

### 2. Validación de Fechas
- Verificación local en el ESP32
- No depende de conexión a internet
- Funciona offline una vez recibidas las credenciales

### 3. Límites de Seguridad
- Máximo 5 reservas activas por espacio
- Máximo 15 tarjetas por reserva
- Credenciales expiran automáticamente

### 4. Logs de Acceso
- Todos los intentos de acceso se registran
- Se envían al backend por MQTT
- Incluyen timestamp y resultado

## Troubleshooting

### Problemas Comunes

1. **Credenciales no recibidas**
   - Verificar conexión MQTT
   - Confirmar topic correcto: `workbit/access/credentials/{space_id}`
   - Revisar logs del backend

2. **Acceso denegado con tarjeta válida**
   - Verificar fechas de reserva
   - Comprobar que la tarjeta esté en la lista autorizada
   - Revisar logs del ESP32

3. **Fechas incorrectas**
   - Verificar formato ISO 8601
   - Comprobar zona horaria
   - Validar parseo en ESP32

### Comandos de Diagnóstico

```bash
# En el ESP32
credentials          # Mostrar estado actual
read eeprom         # Ver configuración guardada
spaceid:1           # Configurar space ID

# En el backend
GET /api/reservations/spaces/1/credentials  # Ver credenciales activas
```

## Mejoras Futuras

1. **Sincronización de tiempo NTP** en ESP32
2. **Caché de credenciales** con TTL
3. **Notificaciones push** para eventos de acceso
4. **Auditoría completa** de accesos
5. **Integración con sistemas externos** (Active Directory, etc.) 