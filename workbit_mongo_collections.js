/*
=============================================================================
                    WORKBIT - BASE DE DATOS NoSQL (MongoDB)
=============================================================================

1. INTRODUCCIÓN

OBJETIVO DEL PROYECTO:
El objetivo de la base de datos es almacenar los datos de los distintos usuarios en 
nuestro sistema, tales como el usuario general, el administrador y el técnico. Además 
se almacenarán los datos de los sensores que estarán instalados en cada uno de los 
espacios de trabajo junto con su respectiva información. También se almacenarán los 
datos de registro de usuario y los datos de reserva de los espacios de trabajo.

JUSTIFICACIÓN DE MONGODB:
Se decidió implementar MongoDB para el proyecto con el objetivo de capturar los datos 
que miden los sensores (CO2, temperatura, infrarrojo para el conteo, etc.). Esta 
elección se debe a las siguientes ventajas de MongoDB:
- Flexibilidad para datos no estructurados de sensores IoT
- Escalabilidad horizontal para manejar alta frecuencia de datos
- Fácil integración en la nube con servicios como Azure y AWS
- Esquema dinámico que permite evolución de tipos de sensores
- Mejor rendimiento para escrituras masivas de datos de sensores

JUSTIFICACIÓN DE SQL SERVER:
Debido a la estructura del proyecto se implementó una base de datos en SQL Server 
ya que es la herramienta más compatible con ASP.NET Core el cual utiliza C#. SQL 
Server se utiliza para almacenar toda la información referente a usuarios y el 
manejo de reservaciones, información que requiere consistencia ACID y es más fácil 
de controlar por medio de una base de datos relacional.

CASO DE USO:
- Aplicación móvil: Utiliza SQL Server para autenticación y reservaciones, MongoDB 
  para monitoreo en tiempo real de condiciones ambientales
- Aplicación web: Personal administrativo y técnico accede a ambas bases de datos 
  para gestión completa del sistema y monitoreo en tiempo real

=============================================================================
2. CONFIGURACIÓN E INSTALACIÓN
=============================================================================

ENTORNOS DE IMPLEMENTACIÓN:
- MongoDB Atlas (nube) - Versión 8.0.10
- Microsoft Azure SQL Database
- Entorno de desarrollo: Local con Docker
- Entorno de producción: Azure Cloud Services

ARQUITECTURA DE DESPLIEGUE:
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Aplicaciones      │    │   API Gateway       │    │   Bases de Datos   │
│                     │    │                     │    │                     │
│ • Mobile App        │◄──►│ • ASP.NET Core API  │◄──►│ • MongoDB Atlas     │
│ • Web Dashboard     │    │ • Authentication    │    │ • Azure SQL DB      │
│ • IoT Devices       │    │ • Load Balancer     │    │ • Redis Cache       │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘

=============================================================================
2.1 CONFIGURACIÓN DE MONGODB ATLAS
=============================================================================

PASOS DETALLADOS DE INSTALACIÓN:

1. CREACIÓN DE CUENTA Y CLUSTER:
   a) Registrarse en https://cloud.mongodb.com
   b) Crear una nueva organización: "WorkBit-Organization"
   c) Crear proyecto: "WorkBit-Sensors-Production"
   d) Seleccionar cluster tier: M10 (para producción) o M0 (desarrollo)
   e) Región recomendada: East US 2 (compatibilidad con Azure)
   f) Nombre del cluster: "workbit-sensors-cluster"

2. CONFIGURACIÓN DE SEGURIDAD:
   a) Database Access:
      - Usuario administrador: workbit_admin
      - Usuario aplicación: workbit_app_user (solo lectura/escritura)
      - Usuario análisis: workbit_analytics (solo lectura)
   
   b) Network Access:
      - IP Whitelist: Agregar IPs de Azure App Services
      - VPC Peering: Configurar con Azure VNet (producción)
      - Private Endpoint: Habilitar para mayor seguridad

3. CONFIGURACIÓN DE BASE DE DATOS:
   ```javascript
   // Comando para crear la base de datos
   use workbit_sensors;
   
   // Crear usuario específico para la aplicación
   db.createUser({
     user: "workbit_sensor_app",
     pwd: "SECURE_PASSWORD_HERE",
     roles: [
       { role: "readWrite", db: "workbit_sensors" },
       { role: "dbAdmin", db: "workbit_sensors" }
     ]
   });
   ```

4. CADENAS DE CONEXIÓN:
   ```javascript
   // Desarrollo
   const connectionStringDev = "mongodb+srv://workbit_dev:PASSWORD@workbit-dev-cluster.xxxxx.mongodb.net/workbit_sensors?retryWrites=true&w=majority";
   
   // Producción
   const connectionStringProd = "mongodb+srv://workbit_app:PASSWORD@workbit-sensors-cluster.xxxxx.mongodb.net/workbit_sensors?retryWrites=true&w=majority&ssl=true";
   
   // Variables de entorno recomendadas
   process.env.MONGODB_URI = connectionStringProd;
   process.env.MONGODB_DB_NAME = "workbit_sensors";
   ```

=============================================================================
2.2 CONFIGURACIÓN DE MICROSOFT AZURE SQL DATABASE
=============================================================================

PASOS DETALLADOS DE CONFIGURACIÓN:

1. CREACIÓN DE RECURSOS EN AZURE:
   ```bash
   # Crear grupo de recursos
   az group create --name workbit-rg --location eastus2
   
   # Crear servidor SQL
   az sql server create \
     --name workbit-sql-server \
     --resource-group workbit-rg \
     --location eastus2 \
     --admin-user workbitadmin \
     --admin-password 'SecurePassword123!'
   
   # Crear base de datos
   az sql db create \
     --resource-group workbit-rg \
     --server workbit-sql-server \
     --name WorkbitDB \
     --service-objective S2
   ```

2. CONFIGURACIÓN DE SEGURIDAD:
   ```sql
   -- Crear usuarios específicos para la aplicación
   CREATE LOGIN workbit_app_user WITH PASSWORD = 'SecureAppPassword123!';
   CREATE USER workbit_app_user FOR LOGIN workbit_app_user;
   ALTER ROLE db_datareader ADD MEMBER workbit_app_user;
   ALTER ROLE db_datawriter ADD MEMBER workbit_app_user;
   
   -- Usuario para reportes (solo lectura)
   CREATE LOGIN workbit_reports_user WITH PASSWORD = 'SecureReportsPassword123!';
   CREATE USER workbit_reports_user FOR LOGIN workbit_reports_user;
   ALTER ROLE db_datareader ADD MEMBER workbit_reports_user;
   ```

3. CONFIGURACIÓN DE FIREWALL:
   ```bash
   # Permitir servicios de Azure
   az sql server firewall-rule create \
     --resource-group workbit-rg \
     --server workbit-sql-server \
     --name AllowAzureServices \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 0.0.0.0
   
   # Permitir IPs específicas de oficina
   az sql server firewall-rule create \
     --resource-group workbit-rg \
     --server workbit-sql-server \
     --name OfficeIP \
     --start-ip-address 203.0.113.0 \
     --end-ip-address 203.0.113.255
   ```

=============================================================================
2.3 HERRAMIENTAS DE GESTIÓN Y DESARROLLO
=============================================================================

HERRAMIENTAS PRINCIPALES:

1. MONGODB:
   • MongoDB Compass (GUI): Interfaz gráfica para exploración y consultas
   • MongoDB Shell (mongosh): Línea de comandos para administración
   • Studio 3T: Herramienta avanzada para desarrollo y análisis
   • Robo 3T: Cliente ligero para consultas rápidas

2. SQL SERVER:
   • SQL Server Management Studio (SSMS) 21: Herramienta principal de administración
   • Azure Data Studio: Cliente multiplataforma moderno
   • DBeaver: Cliente universal para múltiples bases de datos
   • Visual Studio Code con extensiones SQL

3. MONITOREO Y ANÁLISIS:
   • MongoDB Atlas Monitoring: Métricas y alertas nativas
   • Azure Monitor: Supervisión integral de recursos Azure
   • Application Insights: Telemetría de aplicaciones
   • Grafana + Prometheus: Dashboards personalizados

=============================================================================
2.4 CONFIGURACIÓN DE ENTORNO DE DESARROLLO LOCAL
=============================================================================

USANDO DOCKER COMPOSE:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:8.0
    container_name: workbit-mongo-dev
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: workbit_sensors
    volumes:
      - mongo_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: workbit-sql-dev
    restart: always
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: SecurePassword123!
      ACCEPT_EULA: Y
      MSSQL_PID: Developer
    volumes:
      - sql_data:/var/opt/mssql/data

volumes:
  mongo_data:
  sql_data:
```

COMANDOS DE INICIALIZACIÓN:
```bash
# Levantar servicios
docker-compose up -d

# Conectar a MongoDB
mongosh "mongodb://admin:password123@localhost:27017/workbit_sensors?authSource=admin"

# Conectar a SQL Server
sqlcmd -S localhost,1433 -U sa -P SecurePassword123!
```

=============================================================================
2.5 VARIABLES DE ENTORNO Y CONFIGURACIÓN
=============================================================================

ARCHIVO .ENV PARA DESARROLLO:
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/workbit_sensors?authSource=admin
MONGODB_DB_NAME=workbit_sensors
MONGODB_TIMEOUT=30000

# SQL Server Configuration
SQL_CONNECTION_STRING=Server=localhost,1433;Database=WorkbitDB;User Id=sa;Password=SecurePassword123!;TrustServerCertificate=true;
SQL_COMMAND_TIMEOUT=30

# Application Configuration
ENVIRONMENT=development
LOG_LEVEL=debug
API_PORT=5000
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_EXPIRATION=24h

# External Services
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

ARCHIVO APPSETTINGS.JSON PARA ASP.NET CORE:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=workbit-sql-server.database.windows.net;Database=WorkbitDB;User Id=workbit_app_user;Password={PASSWORD};",
    "MongoDbConnection": "mongodb+srv://workbit_app:{PASSWORD}@workbit-sensors-cluster.xxxxx.mongodb.net/workbit_sensors?retryWrites=true&w=majority"
  },
  "MongoDbSettings": {
    "DatabaseName": "workbit_sensors",
    "ConnectionTimeout": "00:00:30",
    "MaxConnectionPoolSize": 100
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

=============================================================================

FINALIDAD DE CADA COLECCIÓN Y SUS RELACIONES:

1. SENSOR_READINGS: Almacena las lecturas en tiempo real de todos los sensores IoT
   - Propósito: Capturar datos ambientales (temperatura, humedad, CO2, luz, etc.)
   - Relación con SQL: space_id referencia a la tabla 'spaces' en SQL Server
   - Relación con MongoDB: Se usa para generar 'environmental_alerts'
   - Frecuencia: Alta (lecturas cada minuto o según configuración)

2. ENVIRONMENTAL_ALERTS: Gestiona alertas cuando los sensores detectan condiciones críticas
   - Propósito: Notificar automáticamente cuando se superan umbrales ambientales
   - Relación con SQL: space_id referencia 'spaces', notified_users referencia 'users'
   - Relación con MongoDB: Se genera basándose en 'sensor_readings'
   - Uso: Sistema de notificaciones proactivo para seguridad y comodidad

3. DEVICE_LOGS: Registra eventos y estado de los dispositivos IoT instalados
   - Propósito: Monitoreo de conectividad y funcionamiento de dispositivos
   - Relación con SQL: Indirectamente relacionado a través de space_id en otras colecciones
   - Relación con MongoDB: Complementa sensor_readings para diagnóstico completo
   - Uso: Mantenimiento preventivo y resolución de problemas técnicos

4. DEVICES: Gestiona inventario y metadatos de todos los dispositivos IoT
   - Propósito: Centralizar información de dispositivos y su estado
   - Relación con SQL: Indirectamente relacionado a través de space_id en otras colecciones
   - Relación con MongoDB: Se usa para generar 'device_logs'
   - Uso: Fuente única de verdad para información de dispositivos


INTEGRACIÓN CON SQL SERVER:
- space_id: Campo clave que conecta las lecturas de sensores con espacios físicos
- user_id en alertas: Referencia a usuarios que deben ser notificados
- Datos combinados: Reservas de SQL + condiciones ambientales de MongoDB

USO PRINCIPAL:
- Aplicación móvil: Monitoreo en tiempo real de condiciones del espacio reservado
- Aplicación web: Dashboard para técnicos y administradores, gestión de alertas
- API: Endpoints para consultas de estado ambiental y notificaciones push
=============================================================================
*/

// Configuración de la base de datos MongoDB
const database = "workbit_sensors";

// =============================================================================
// COLECCIÓN 1: LECTURAS DE SENSORES
// =============================================================================
// PROPÓSITO: Almacenar todas las lecturas de sensores IoT en tiempo real
// RELACIÓN SQL: space_id → spaces.id (SQL Server)

const sensorReadingsCollection = {
  "collection": "sensor_readings",
  "description": "Almacena lecturas en tiempo real de sensores IoT instalados en cada espacio",
  "indexes": [
    { "space_id": 1, "timestamp": -1 },  // Consultas por espacio y tiempo
    { "sensor_type": 1, "timestamp": -1 }, // Consultas por tipo de sensor
    { "timestamp": -1 }  // Consultas cronológicas
  ],
  "document_example": {
    "space_id": 1,  // REFERENCIA a spaces.id en SQL Server
    "sensor_type": "temperature",  // Tipos: temperature, humidity, co2, light, motion, noise
    "value": 25.3,  // Valor numérico de la lectura
    "unit": "°C",   // Unidad de medida
    "device_id": "ESP32-TEMP-01",  // Identificador del dispositivo sensor
    "timestamp": "2025-06-18T13:00:00Z",  // Momento exacto de la lectura
    "quality": "good"  // Calidad de la señal: good, fair, poor
  },
  "sample_data": [
    {
      "space_id": 1,
      "sensor_type": "temperature",
      "value": 23.5,
      "unit": "°C",
      "device_id": "ESP32-TEMP-01",
      "timestamp": "2025-06-18T13:00:00Z",
      "quality": "good"
    },
    {
      "space_id": 1,
      "sensor_type": "co2",
      "value": 650,
      "unit": "ppm",
      "device_id": "ESP32-CO2-01",
      "timestamp": "2025-06-18T13:00:00Z",
      "quality": "good"
    },
    {
      "space_id": 2,
      "sensor_type": "motion",
      "value": 2,  // Número de personas detectadas
      "unit": "persons",
      "device_id": "PIR-MOTION-02",
      "timestamp": "2025-06-18T13:01:00Z",
      "quality": "good"
    }
  ]
};

// =============================================================================
// COLECCIÓN 2: ALERTAS AMBIENTALES
// =============================================================================
// PROPÓSITO: Gestionar alertas cuando las condiciones ambientales son críticas
// GENERACIÓN: Automática basada en umbrales predefinidos y sensor_readings
// RELACIÓN SQL: space_id → spaces.id, notified_users → users.id

const environmentalAlertsCollection = {
  "collection": "environmental_alerts",
  "description": "Gestiona alertas automáticas cuando se detectan condiciones ambientales críticas",
  "indexes": [
    { "space_id": 1, "triggered_at": -1 },  // Alertas por espacio
    { "status": 1, "triggered_at": -1 },    // Alertas activas
    { "sensor_type": 1, "status": 1 }       // Alertas por tipo de sensor
  ],
  "document_example": {
    "space_id": 1,  // REFERENCIA a spaces.id en SQL Server
    "sensor_type": "co2",  // Tipo de sensor que generó la alerta
    "current_value": 950,  // Valor actual que disparó la alerta
    "threshold": 800,      // Umbral configurado que se superó
    "threshold_type": "max", // Tipo: max, min
    "severity": "critical", // Niveles: warning, critical, emergency
    "triggered_at": "2025-06-18T13:15:00Z",  // Momento de la activación
    "resolved_at": null,   // null si aún está activa
    "status": "active",    // Estados: active, resolved, acknowledged
    "notified_users": [2, 3, 5], // REFERENCIA a users.id que fueron notificados
    "notification_sent": true,    // Si se enviaron notificaciones
    "auto_actions": ["ventilation_on"], // Acciones automáticas ejecutadas
    "notes": "CO2 levels exceeded safe threshold in meeting room A"
  },
  "alert_thresholds": {
    "temperature": { "min": 18, "max": 28, "unit": "°C" },
    "humidity": { "min": 30, "max": 70, "unit": "%" },
    "co2": { "max": 800, "unit": "ppm" },
    "noise": { "max": 65, "unit": "dB" },
    "occupancy": { "max": "space.capacity" } // Referencia a capacidad del espacio
  }
};

// =============================================================================
// COLECCIÓN 3: LOGS DE DISPOSITIVOS
// =============================================================================
// PROPÓSITO: Registrar eventos de conectividad y estado de dispositivos IoT
// USO: Mantenimiento predictivo y resolución de problemas técnicos
// RELACIÓN: Indirecta con SQL a través de device_id y ubicaciones

const deviceLogsCollection = {
  "collection": "device_logs",
  "description": "Registra eventos de conectividad, errores y estado de dispositivos IoT",
  "indexes": [
    { "device_id": 1, "logged_at": -1 },    // Logs por dispositivo
    { "event_type": 1, "logged_at": -1 },   // Logs por tipo de evento
    { "severity": 1, "logged_at": -1 },     // Logs por severidad
    { "space_id": 1, "logged_at": -1 }      // Logs por espacio
  ],
  "document_example": {
    "device_id": "ESP32-01",  // Identificador único del dispositivo
    "space_id": 1,  // REFERENCIA a spaces.id donde está instalado
    "device_type": "environmental_sensor", // Tipo de dispositivo
    "event_type": "connection_lost",  // Tipo de evento registrado
    "severity": "warning",  // Niveles: info, warning, error, critical
    "message": "WiFi disconnected unexpectedly. Attempting reconnection.",
    "error_code": "WIFI_DISCONNECT_02", // Código de error específico
    "battery_level": 85,  // Nivel de batería (si aplica)
    "signal_strength": -65, // Fuerza de señal WiFi en dBm
    "firmware_version": "v2.1.3", // Versión del firmware
    "logged_at": "2025-06-18T13:20:00Z", // Momento del evento
    "resolved": false,  // Si el problema fue resuelto
    "maintenance_required": false // Si requiere intervención técnica
  },
  "event_types": [
    "connection_established", "connection_lost", "low_battery", 
    "sensor_calibration", "firmware_update", "hardware_error",
    "maintenance_scheduled", "factory_reset"
  ]
};

// =============================================================================
// COLECCIÓN 4: DISPOSITIVOS IoT 
// =============================================================================
// PROPÓSITO: Gestión centralizada de inventario y metadatos de dispositivos IoT
// USO: Fuente única de verdad para información de dispositivos
// RELACIÓN: Referenciado por sensor_readings y device_logs

const devicesCollection = {
  "collection": "devices",
  "description": "Inventario centralizado de todos los dispositivos IoT del sistema",
  "indexes": [
    { "device_id": 1 },                    // Búsqueda por ID único
    { "space_id": 1, "status": 1 },        // Dispositivos por espacio y estado
    { "device_type": 1, "status": 1 },     // Dispositivos por tipo
    { "installation_date": -1 },           // Orden cronológico de instalación
    { "next_maintenance": 1 }              // Programación de mantenimiento
  ],
  "document_example": {
    "device_id": "ESP32-TEMP-01",          // ID único del dispositivo
    "space_id": 1,                         // REFERENCIA a spaces.id en SQL
    "device_type": "environmental_sensor", // Tipo principal del dispositivo
    "sensor_capabilities": [               // Qué puede medir este dispositivo
      "temperature", "humidity", "pressure"
    ],
    "manufacturer": "Espressif",           // Fabricante del dispositivo
    "model": "ESP32-DevKitC",             // Modelo específico
    "firmware_version": "v2.1.3",         // Versión actual del firmware
    "hardware_version": "v1.2",           // Versión del hardware
    "mac_address": "24:6F:28:AB:CD:EF",   // Dirección MAC única
    "ip_address": "192.168.1.105",        // IP actual asignada
    "installation_date": "2025-01-15T10:00:00Z", // Fecha de instalación
    "last_seen": "2025-06-18T13:25:00Z",  // Última comunicación exitosa
    "status": "active",                    // active, inactive, maintenance, error
    "battery_powered": true,               // Si usa batería
    "current_battery_level": 85,           // Nivel actual de batería
    "signal_strength": -45,                // Última fuerza de señal WiFi
    "calibration_date": "2025-06-01T09:00:00Z", // Última calibración
    "next_maintenance": "2025-07-01T09:00:00Z",  // Próximo mantenimiento programado
    "warranty_expires": "2027-01-15T00:00:00Z", // Vencimiento de garantía
    "location_description": "Wall mounted, 2m height, near window", // Ubicación física
    "configuration": {                     // Configuración específica
      "sampling_interval": 60,            // Segundos entre lecturas
      "transmission_interval": 300,       // Segundos entre transmisiones
      "sleep_mode_enabled": true,          // Modo de ahorro de energía
      "alert_thresholds": {                // Umbrales específicos del dispositivo
        "temperature": {"min": 18, "max": 28},
        "humidity": {"min": 30, "max": 70}
      }
    },
    "maintenance_history": [               // Historial de mantenimiento
      {
        "date": "2025-06-01T09:00:00Z",
        "type": "calibration",
        "performed_by": "technician_id_123",
        "notes": "Annual calibration completed successfully"
      }
    ]
  },
  "device_statuses": [
    "active",      // Funcionando normalmente
    "inactive",    // Temporalmente deshabilitado
    "maintenance", // En mantenimiento programado
    "error",       // Con fallos que requieren atención
    "retired"      // Dado de baja del sistema
  ]
};



