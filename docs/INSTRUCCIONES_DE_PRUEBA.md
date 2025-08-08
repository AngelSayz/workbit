# WorkBit — Instrucciones para Instalación y Pruebas

Responsables:
    Mayo Ramos Angel David
    Alvarez Galindo Aldo Yamil
    Munoz Reynoso Oscar Gael
    Gomez Miramontes Daniel
Grupo: 5A
Fecha de entrega: 08/08/25

# Introduccion

Este documento describe, de forma paso a paso, cómo instalar, configurar y probar el proyecto WorkBit. La finalidad es que el evaluador pueda levantar todos los componentes, poblar la base de datos y validar los principales flujos de la aplicación.

Importante: La versión vigente del esquema relacional que usa el backend Node.js es la contenida en `database.sql` (PostgreSQL/Supabase). El archivo `workbit_sql_schema.sql` documenta el modelo relacional en SQL Server y sirve como referencia conceptual; hay cambios en nombres de tablas, campos y llaves foráneas que ya están consolidados en `database.sql`.

Importante: En caso de que no desee ejecutar de manera local el proyecto, puede probarlo de manera remota con los siguientes links
    Backend con Node.js en Render
        https://workbit.onrender.com/ (Despues de un periodo de inactividad el backend se apaga, se prende al recibir una peticion despues de unos minutos)
    Frontend en Vercel
        https://workbit.vercel.app/ (No hace falta esperar para acceder a la pagina, sin embargo las peticiones al backend pueden tardar un poco en la primera peticion)
Aun asi, para probar la aplicacion movil, es necesario tener las credenciales de acceso de dicho servicios, asi que se recomienda ejecutarlo si desea probar la app movil

## 1. Componentes

El repositorio contiene múltiples componentes:
- Backend API (Node.js/Express): `workbit_back/`
- Aplicación web (React + Vite): `workbit_web/`
- Aplicación móvil (React Native + Expo): `workbit_app/`
- Backend .NET (legado): `workbit_backend/`
- Simulador/Dashboard estático: `workbitsimulator/`

Para las pruebas funcionales se recomienda usar el backend Node.js con Supabase (PostgreSQL) y, de forma opcional, MongoDB Atlas y un broker MQTT.

## 2. Requisitos previos

Instalar o disponer de:
- Git
- Node.js 18 o superior
- NPM (incluido con Node)
- Cuenta de Supabase y un proyecto activo (PostgreSQL gestionado)
- (Opcional) MongoDB Atlas y una cadena de conexión
- (Opcional) Broker MQTT accesible (por ejemplo, HiveMQ público)
- .NET SDK 8.0+ solo si desea probar el backend C# legado

En Windows, los comandos de consola de este documento asumen PowerShell.

## 3. Estructura del repositorio (resumen)

```
workbit/
  database.sql                  # Esquema vigente (PostgreSQL/Supabase)
  workbit_sql_schema.sql        # Esquema explicativo (SQL Server)
  workbit_back/                 # Backend Node.js (API principal)
  workbit_web/                  # Frontend web (React + Vite)
  workbit_app/                  # App móvil (Expo)
  workbit_backend/              # Backend .NET (opcional/legado)
  workbitsimulator/             # Dashboard/Simulador estático
```

## 4. Base de datos: Supabase (PostgreSQL)

1) Crear un proyecto en Supabase y acceder al SQL editor.
2) Copiar y ejecutar el contenido completo de `scripts/sql_init_supabase.sql`.
3) Verificar que las tablas clave existan: `roles`, `users`, `spaces`, `reservations`, `reservation_participants`, `access_logs`, `codecards`, `grid_settings`, `reports`, `report_attachments`, `tasks`.
4) Consideraciones de seguridad (RLS):
   - Si RLS está activado, crear políticas de lectura/escritura apropiadas para las tablas que el backend consulta (al menos `roles`, `users`, `spaces`, `reservations`, `codecards`).
   - Alternativamente, durante pruebas, puede mantener RLS desactivado en estas tablas.
5) Diferencias respecto a `workbit_sql_schema.sql` (SQL Server):
   - `users.user_id` es un UUID que referencia `auth.users` de Supabase (no hay campos `email`/`password` en la tabla `users` del modelo vigente).
   - Existen tablas adicionales como `codecards`, `grid_settings`, `reports`, `report_attachments` y campos como `position_x/position_y` en `spaces` (grid de cubículos), presentes en `database.sql`.

## 5. Servicios externos opcionales

- MongoDB Atlas: crear un cluster y obtener `MONGODB_URI` (con usuario/clave).
- Broker MQTT: disponer de una URL como `mqtt://broker.hivemq.com:1883` o un broker propio; credenciales si aplica.

El backend Node.js arranca sin MQTT si no se define `MQTT_BROKER_URL`. MongoDB es recomendado para módulos de dispositivos/sensores, pero no requerido para flujos básicos.

## 6. Backend Node.js (API principal)

Ruta: `workbit_back/`

1) Instalar dependencias:

cd workbit_back
npm install

2) Crear archivo `.env` en `workbit_back/` con la configuración mínima:

# Servidor
PORT=3000
NODE_ENV=development
JWT_SECRET=Cambie-esta-clave-en-produccion

# Supabase (obligatorio)
SUPABASE_URL=https://SU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=SU-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=SU-SERVICE-ROLE-KEY

# MongoDB (opcional)
MONGODB_URI=

# MQTT (opcional)
MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=workbit-backend

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:19006

# Rate limiting (valores por defecto)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

Notas:
- `SUPABASE_*` son obligatorias. El backend realiza consultas a `roles`, `users`, `spaces`, `reservations`.
- `CORS_ORIGIN` debe incluir los orígenes desde donde probará la web (`5173`) y Expo Web si lo usa.

3) Ejecutar en desarrollo:

npm run dev

4) Validaciones rápidas:
- Salud: `GET http://localhost:3000/health` y `GET http://localhost:3000/api/health`
- Documentación API (Swagger): `http://localhost:3000/api/docs`

5) Inicialización del primer administrador (solo si no existen admins previamente registrados):
- `POST http://localhost:3000/api/auth/first-admin`
  Cuerpo JSON: `{ "name": "Ana", "lastname": "García", "username": "ana.admin", "email": "ana@ejemplo.com", "password": "Secreta123" }`

6) Autenticación:
- `POST http://localhost:3000/login` con `{ "email": "...", "password": "..." }`.
- Respuesta incluye token JWT y datos del perfil (consultados vía `users`/`roles` en Supabase).

## 7. Frontend Web (React + Vite)

Ruta: `workbit_web/`

1) Instalar dependencias:

cd ..\workbit_web
npm install

2) Crear archivo `.env` en `workbit_web/`:

VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://SU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=SU-ANON-KEY
VITE_NODE_ENV=development


3) Ejecutar en desarrollo:

npm run dev

La aplicación quedará disponible en `http://localhost:5173`. Verifique que las llamadas al backend funcionen; si hay errores CORS, revise `CORS_ORIGIN` en el `.env` del backend.

## 8. Aplicación Móvil (Expo)

Ruta: `workbit_app/`

1) Instalar dependencias:

cd ..\workbit_app
npm install

2) Configurar el servicio de API en el código o mediante variables (según `src/services/api.js` si aplica) apuntando al backend `http://<IP-local>:3000` cuando se use dispositivo físico. Para pruebas en el mismo equipo, Expo Web puede usar `http://localhost:3000`.

3) Iniciar Expo:

npm start

Siga las indicaciones para abrir en Android Emulator, iOS Simulator o Expo Go. Asegúrese de que el backend Node.js sea accesible desde el dispositivo elegido.

## 9. Simulador/Dashboard estático

Ruta: `workbitsimulator/`

Opción A — Servidor estático con Node:

cd ..\workbitsimulator
npx http-server -p 8000

Abrir `http://localhost:8000` en navegador.

Opción B — Python (si está instalado):

python -m http.server 8000

## 10. Backend .NET (opcional/legado)

Ruta: `workbit_backend/`

Este servicio fue utilizado anteriormente y su API se mantuvo por compatibilidad; el backend Node.js expone rutas equivalentes. Si se desea ejecutar:

1) Instalar .NET SDK 8.0+
2) Revisar `conection/connection.json` y `appsettings*.json` para la cadena SQL Server.
3) Ejecutar la API:

cd ..\workbit_backend


Notas: No ejecute simultáneamente el .NET API y el Node.js API en el mismo puerto. Para las pruebas actuales se recomienda usar el backend Node.js.

## 11. Escenarios de prueba recomendados

1) Salud del sistema
- Abrir `http://localhost:3000/health` y `http://localhost:3000/api/health`.

2) Creación del primer administrador y login
- `POST /api/auth/first-admin` con datos válidos.
- `POST /login` y validar recepción de JWT y perfil de usuario.

3) Exploración de API con Swagger
- `http://localhost:3000/api/docs` y probar endpoints: usuarios, espacios, reservas, logs de acceso, grid, roles, cards.

4) Flujo de reservas
- Listar espacios: `GET /api/spaces`.
- Crear reserva: `POST /api/reservations` y validar con `GET /api/reservations`.

5) Accesos y tarjetas
- Crear tarjeta: `POST /api/cards` o `POST /api/cards/bulk`.
- Asignar tarjeta a usuario: `PUT /api/cards/assign/:cardId/user/:userId`.
- Registrar acceso: `POST /api/access-logs/entry` y, más tarde, `POST /api/access-logs/exit`.

6) Dashboard web
- Abrir `http://localhost:5173` y verificar autenticación/visualizaciones.

7) MQTT (opcional)
- Definir `MQTT_BROKER_URL` en `.env` del backend.
- Verificar logs de suscripción a tópicos y recepción de mensajes en consola del backend.

## 12. Solución de problemas

- Conexión a Supabase: verificar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y que el esquema de `database.sql` fue ejecutado sin errores.
- Políticas RLS: si hay errores de permiso en consultas, crear políticas de acceso o usar el service role en el servidor para operaciones administrativas.
- CORS: si la web en `5173` no accede a `3000`, añadir el origen en `CORS_ORIGIN`.
- Acceso desde móvil: usar IP local del equipo anfitrión en lugar de `localhost` para el backend.
- MongoDB/MQTT: son opcionales; omita variables si no los usará en la prueba.

## 13. Criterios de verificación


## Anexos: Esquemas y Scripts de Base de Datos

Este apartado proporciona el esquema y scripts ejecutables tanto para MongoDB (NoSQL) como para PostgreSQL/Supabase (SQL relacional). Los scripts se incluyen en la carpeta `scripts/` del repositorio.

### A. MongoDB (NoSQL)

1) Colecciones oficiales y campos principales
- devices: inventario de dispositivos IoT (campos clave: device_id, name, type, space_id, status, sensors[], mqtt_topic, last_seen, location, hardware_info)
- device_readings: lecturas de sensores por dispositivo/espacio (device_id, space_id, readings[], timestamp, device_status, battery_level, signal_strength, raw_data)
- alerts: sistema estandarizado de alertas ambientales y operativas (space_id, alert_type, severity, value, message, device_id, sensor_data, resolved, resolved_at, notified_users[])
- access_logs: logs de accesos RFID/API (card_code, user_id, space_id, access_granted, access_type, timestamp, source, mqtt_topic, raw_data)

2) Índices recomendados (definidos en el script):
- devices: { device_id:1 } único; { space_id:1, type:1 }; { status:1, last_seen:-1 }; { mqtt_topic:1 }
- device_readings: { device_id:1, timestamp:-1 }; { space_id:1, timestamp:-1 }; { 'readings.sensor_type':1, timestamp:-1 } y TTL (30 días)
- alerts: { space_id:1, alert_type:1, resolved:1 }; { severity:1, resolved:1, createdAt:-1 }; TTL para resueltas (90 días)
- access_logs: índices por card_code, user_id, space_id, access_granted, access_type y TTL anual

3) Script ejecutable
- Archivo: `scripts/mongo_init.js`
- Ejecutar con mongosh (PowerShell):

```powershell
mongosh "<CADENA_CONEXION_MONGODB>" c:\workbit\scripts\mongo_init.js
```

El script crea colecciones, índices y carga datos mínimos de ejemplo.

4) Nota sobre integración
- Los campos `space_id` y `user_id` en MongoDB se relacionan conceptualmente con las tablas `spaces` y `users` del esquema relacional. No existen claves foráneas en Mongo, pero la aplicación asume coherencia de estos IDs.

### B. SQL Relacional (PostgreSQL/Supabase)

1) Esquema vigente
- Autoritativo: `database.sql` en la raíz del repositorio.
- El archivo `workbit_sql_schema.sql` es una referencia conceptual del modelo en SQL Server y puede diferir en columnas/nombres. Para pruebas use siempre `database.sql` o el script mínimo a continuación.

2) Script de inicialización mínima
- Archivo: `scripts/sql_init_supabase.sql`
- Crea tablas esenciales: roles, codecards, spaces, users, reservations, reservation_participants, access_logs, grid_settings, reports, report_attachments, tasks
- Crea índices recomendados y carga datos mínimos (roles y espacios de ejemplo)

3) Ejecución
- Opción A (Supabase SQL Editor): copiar el contenido del archivo y ejecutarlo.
- Opción B (psql en PowerShell):

```powershell
# Ejemplo de conexión; reemplace valores según su proyecto
$env:PGPASSWORD = "<CLAVE>"
psql -h <host>.supabase.co -U postgres -d postgres -p 5432 -f c:\workbit\scripts\sql_init_supabase.sql
```

4) Consideraciones de RLS
- Si RLS está habilitado, cree políticas para permitir lectura/escritura desde el backend (consultas a roles, users, spaces, reservations) o utilice el Service Role para operaciones administrativas.

