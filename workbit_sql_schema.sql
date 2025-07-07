/*
=============================================================================
                    WORKBIT - BASE DE DATOS RELACIONAL (SQL SERVER)
=============================================================================

OBJETIVO DEL PROYECTO:
El objetivo de esta base de datos es almacenar y gestionar toda la información 
estructurada del sistema WorkBit, incluyendo usuarios, roles, espacios de trabajo, 
reservaciones y registros de acceso. Esta base de datos sirve como el núcleo 
principal para la autenticación, autorización y gestión de reservas.

FINALIDAD DE CADA TABLA Y SUS RELACIONES:

1. ROLES: Define los tipos de usuario en el sistema (usuario general, administrador, técnico)
   - Relación: Uno a muchos con USERS (un rol puede tener múltiples usuarios)

2. USERS: Almacena información de todos los usuarios del sistema
   - Relación: Muchos a uno con ROLES (cada usuario tiene un rol específico)
   - Relación: Uno a muchos con RESERVATIONS (un usuario puede hacer múltiples reservas)
   - Relación: Muchos a muchos con RESERVATIONS vía RESERVATION_PARTICIPANTS
   - Relación: Uno a muchos con ACCESS_LOGS (un usuario puede tener múltiples accesos)

3. SPACES: Contiene información de los espacios de trabajo/cubículos disponibles
   - Relación: Uno a muchos con RESERVATIONS (un espacio puede tener múltiples reservas)
   - Relación: Uno a muchos con ACCESS_LOGS (un espacio puede registrar múltiples accesos)
   - Relación: Referenciado desde MongoDB (sensor_readings, environmental_alerts)

4. RESERVATIONS: Gestiona las reservaciones de espacios por parte de los usuarios
   - Relación: Muchos a uno con SPACES (muchas reservas pueden ser del mismo espacio)
   - Relación: Muchos a uno con USERS (muchas reservas pueden ser del mismo propietario)
   - Relación: Muchos a muchos con USERS vía RESERVATION_PARTICIPANTS
   - Relación: Uno a muchos con ACCESS_LOGS (una reserva puede tener múltiples accesos)

5. RESERVATION_PARTICIPANTS: Tabla intermedia para manejar múltiples participantes por reserva
   - Relación: Muchos a uno con USERS (un usuario puede participar en múltiples reservas)
   - Relación: Muchos a uno con RESERVATIONS (una reserva puede tener múltiples participantes)

6. ACCESS_LOGS: Registra el historial de accesos a los espacios de trabajo
   - Relación: Muchos a uno con USERS (un usuario puede tener múltiples registros)
   - Relación: Muchos a uno con SPACES (un espacio puede tener múltiples registros)
   - Relación: Muchos a uno con RESERVATIONS (opcional, para accesos con reserva)

INTEGRACIÓN CON MONGODB:
Esta base de datos SQL se integra con MongoDB a través del campo 'space_id' que 
se referencia en las colecciones de MongoDB para:
- Lecturas de sensores por espacio
- Alertas ambientales por espacio
- Logs de dispositivos IoT instalados en cada espacio

USO PRINCIPAL:
- Aplicación móvil: Autenticación, gestión de reservas, consulta de disponibilidad
- Aplicación web: Gestión administrativa, mantenimiento, reportes históricos
=============================================================================
*/

-- BASE DE DATOS RELACIONAL (SQL SERVER)
CREATE DATABASE workbit;
USE workbit;

-- Tabla de roles: Define los tipos de usuario del sistema (usuario general, administrador, técnico)
-- Permite controlar permisos y funcionalidades según el tipo de usuario
CREATE TABLE roles (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(20) UNIQUE NOT NULL  -- Ej: 'user', 'admin', 'technician'
);

-- Tabla de usuarios: Almacena información personal y credenciales de todos los usuarios
-- Es el núcleo de autenticación y autorización del sistema
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- Hash de la contraseña para seguridad
    role_id INT NOT NULL,  -- Referencia al tipo de rol del usuario
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Tabla de espacios: Contiene información de los cubículos/espacios de trabajo disponibles
-- Cada espacio puede tener sensores IoT asociados (referenciados desde MongoDB)
CREATE TABLE spaces (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL UNIQUE,  -- Nombre identificativo del espacio
    location VARCHAR(255) NOT NULL,     -- Ubicación física del espacio
    status VARCHAR(15) NOT NULL CHECK (status IN ('available', 'unavailable')) DEFAULT 'available',
    capacity INT NOT NULL,              -- Número máximo de personas permitidas
    created_at DATETIME DEFAULT GETDATE()
);

-- Tabla de reservas: Gestiona las reservaciones de espacios por parte de los usuarios
-- Permite planificar y controlar el uso de los espacios de trabajo
CREATE TABLE reservations (
    id INT PRIMARY KEY IDENTITY(1,1),
    reason VARCHAR(100) NOT NULL,       -- Motivo o descripción de la reserva
    start_time DATETIME NOT NULL,       -- Fecha y hora de inicio
    end_time DATETIME NOT NULL,         -- Fecha y hora de finalización
    status VARCHAR(15) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    space_id INT NOT NULL,              -- Referencia al espacio reservado
    owner_id INT NOT NULL,              -- Usuario que realiza la reserva
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (space_id) REFERENCES spaces(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Tabla intermedia para participantes de reservas: Permite múltiples usuarios por reserva
-- Facilita reservas grupales donde varios usuarios comparten el mismo espacio
CREATE TABLE reservation_participants (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,               -- Usuario participante en la reserva
    reservation_id INT NOT NULL,        -- Reserva en la que participa
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Tabla de registro de accesos: Almacena el historial de entradas y salidas de usuarios
-- Proporciona auditoría y control de acceso a los espacios de trabajo
CREATE TABLE access_logs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,               -- Usuario que accede al espacio
    space_id INT NOT NULL,              -- Espacio al que se accede
    reservation_id INT NULL,            -- Reserva asociada (si existe)
    access_time DATETIME NOT NULL,      -- Momento de entrada
    exit_time DATETIME,                 -- Momento de salida (NULL si aún está dentro)
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (space_id) REFERENCES spaces(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

/*
INSERCIÓN DE DATOS INICIALES (OPCIONAL)
*/

-- Insertar roles básicos del sistema
INSERT INTO roles (name) VALUES 
('user'),           -- Usuario general: puede hacer reservas y acceder a espacios
('admin'),          -- Administrador: gestión completa del sistema
('technician');     -- Técnico: mantenimiento y monitoreo de espacios/sensores

/*
ÍNDICES:
*/

-- Índice para búsquedas frecuentes por email y username
CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_username ON users(username);

-- Índice para consultas de reservas por espacio y fecha
CREATE INDEX IX_reservations_space_time ON reservations(space_id, start_time, end_time);

-- Índice para consultas de accesos por usuario y espacio
CREATE INDEX IX_access_logs_user_space ON access_logs(user_id, space_id, access_time);

-- =============================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO COMPLETOS
-- =============================================================================

-- 1. INSERTAR ROLES BÁSICOS DEL SISTEMA
INSERT INTO roles (name) VALUES 
('user'),           -- Usuario general: puede hacer reservas y acceder a espacios
('admin'),          -- Administrador: gestión completa del sistema
('technician');     -- Técnico: mantenimiento y monitoreo de espacios/sensores

-- 2. INSERTAR USUARIOS DE EJEMPLO
INSERT INTO users (name, lastname, username, email, password, role_id) VALUES 
-- Administradores
('Ana', 'García', 'ana.garcia', 'ana.garcia@workbit.com', '$2b$10$hashedpassword1', 2),
('Carlos', 'Mendoza', 'carlos.mendoza', 'carlos.mendoza@workbit.com', '$2b$10$hashedpassword2', 2),

-- Técnicos
('Miguel', 'Torres', 'miguel.torres', 'miguel.torres@workbit.com', '$2b$10$hashedpassword3', 3),
('Sofia', 'Ramírez', 'sofia.ramirez', 'sofia.ramirez@workbit.com', '$2b$10$hashedpassword4', 3),

-- Usuarios regulares
('Laura', 'Hernández', 'laura.hernandez', 'laura.hernandez@empresa.com', '$2b$10$hashedpassword5', 1),
('Diego', 'Martín', 'diego.martin', 'diego.martin@empresa.com', '$2b$10$hashedpassword6', 1),
('Patricia', 'López', 'patricia.lopez', 'patricia.lopez@empresa.com', '$2b$10$hashedpassword7', 1),
('Roberto', 'Silva', 'roberto.silva', 'roberto.silva@empresa.com', '$2b$10$hashedpassword8', 1),
('Carmen', 'Vargas', 'carmen.vargas', 'carmen.vargas@empresa.com', '$2b$10$hashedpassword9', 1),
('Fernando', 'Cruz', 'fernando.cruz', 'fernando.cruz@empresa.com', '$2b$10$hashedpassword10', 1),
('Alejandra', 'Morales', 'alejandra.morales', 'alejandra.morales@empresa.com', '$2b$10$hashedpassword11', 1),
('Andrés', 'Jiménez', 'andres.jimenez', 'andres.jimenez@empresa.com', '$2b$10$hashedpassword12', 1);

-- 3. INSERTAR ESPACIOS DE TRABAJO
INSERT INTO spaces (name, location, status, capacity) VALUES 
('Sala de Reuniones A', 'Piso 1, Ala Norte', 'available', 8),
('Sala de Reuniones B', 'Piso 1, Ala Sur', 'available', 6),
('Cubículo Individual 1', 'Piso 2, Zona Oeste', 'available', 1),
('Cubículo Individual 2', 'Piso 2, Zona Oeste', 'available', 1),
('Cubículo Individual 3', 'Piso 2, Zona Este', 'available', 1),
('Sala de Conferencias', 'Piso 3, Centro', 'available', 20),
('Espacio Colaborativo', 'Piso 1, Centro', 'available', 12),
('Cabina de Trabajo Silenciosa', 'Piso 2, Zona Norte', 'available', 2),
('Sala de Innovación', 'Piso 3, Ala Norte', 'unavailable', 10),
('Área de Descanso Ejecutiva', 'Piso 4, VIP', 'available', 4);

-- 4. INSERTAR RESERVACIONES
INSERT INTO reservations (reason, start_time, end_time, status, space_id, owner_id) VALUES 
-- Reservas confirmadas (pasadas y futuras)
('Reunión de seguimiento proyecto Alpha', '2025-06-18 09:00:00', '2025-06-18 10:30:00', 'confirmed', 1, 5),
('Sesión de brainstorming equipo marketing', '2025-06-18 14:00:00', '2025-06-18 16:00:00', 'confirmed', 7, 6),
('Trabajo individual concentrado', '2025-06-18 08:00:00', '2025-06-18 12:00:00', 'confirmed', 3, 7),
('Llamada con cliente internacional', '2025-06-18 13:00:00', '2025-06-18 14:00:00', 'confirmed', 8, 8),

-- Reservas futuras
('Presentación trimestral', '2025-06-19 10:00:00', '2025-06-19 12:00:00', 'confirmed', 6, 9),
('Entrevistas técnicas', '2025-06-19 09:00:00', '2025-06-19 17:00:00', 'confirmed', 2, 10),
('Trabajo colaborativo desarrollo', '2025-06-19 14:00:00', '2025-06-19 18:00:00', 'confirmed', 7, 11),
('Reunión directiva', '2025-06-20 08:00:00', '2025-06-20 10:00:00', 'confirmed', 10, 1),

-- Reservas pendientes
('Capacitación nuevo software', '2025-06-21 10:00:00', '2025-06-21 16:00:00', 'pending', 6, 12),
('Workshop diseño UX/UI', '2025-06-22 09:00:00', '2025-06-22 13:00:00', 'pending', 7, 5),

-- Reservas canceladas
('Reunión mensual (cancelada)', '2025-06-18 16:00:00', '2025-06-18 17:30:00', 'cancelled', 1, 6),
('Sesión de pair programming', '2025-06-19 15:00:00', '2025-06-19 17:00:00', 'cancelled', 4, 7);

-- 5. INSERTAR PARTICIPANTES EN RESERVACIONES
INSERT INTO reservation_participants (user_id, reservation_id) VALUES 
-- Reunión de seguimiento proyecto Alpha (reservation_id = 1)
(6, 1),  -- Diego participa
(8, 1),  -- Roberto participa

-- Sesión de brainstorming equipo marketing (reservation_id = 2)
(5, 2),  -- Laura participa (además de ser owner)
(7, 2),  -- Patricia participa
(9, 2),  -- Carmen participa
(11, 2), -- Alejandra participa

-- Presentación trimestral (reservation_id = 5)
(1, 5),  -- Ana (admin) participa
(2, 5),  -- Carlos (admin) participa
(10, 5), -- Fernando participa
(12, 5), -- Andrés participa

-- Entrevistas técnicas (reservation_id = 6)
(3, 6),  -- Miguel (técnico) participa
(4, 6),  -- Sofia (técnico) participa

-- Trabajo colaborativo desarrollo (reservation_id = 7)
(8, 7),  -- Roberto participa
(12, 7), -- Andrés participa

-- Reunión directiva (reservation_id = 8)
(2, 8),  -- Carlos participa

-- Capacitación nuevo software (reservation_id = 9)
(5, 9),  -- Laura participa
(6, 9),  -- Diego participa
(7, 9),  -- Patricia participa
(8, 9),  -- Roberto participa
(9, 9),  -- Carmen participa

-- Workshop diseño UX/UI (reservation_id = 10)
(6, 10), -- Diego participa
(11, 10); -- Alejandra participa

-- 6. INSERTAR LOGS DE ACCESO
INSERT INTO access_logs (user_id, space_id, reservation_id, access_time, exit_time) VALUES 
-- Accesos completados (con entrada y salida)
(5, 1, 1, '2025-06-18 08:55:00', '2025-06-18 10:35:00'),  -- Laura - Reunión Alpha
(6, 1, 1, '2025-06-18 09:02:00', '2025-06-18 10:33:00'),  -- Diego - Reunión Alpha
(8, 1, 1, '2025-06-18 09:05:00', '2025-06-18 10:30:00'),  -- Roberto - Reunión Alpha

(6, 7, 2, '2025-06-18 13:58:00', '2025-06-18 16:05:00'),  -- Diego - Brainstorming
(5, 7, 2, '2025-06-18 14:00:00', '2025-06-18 16:02:00'),  -- Laura - Brainstorming
(7, 7, 2, '2025-06-18 14:03:00', '2025-06-18 16:00:00'),  -- Patricia - Brainstorming
(9, 7, 2, '2025-06-18 14:05:00', '2025-06-18 15:58:00'),  -- Carmen - Brainstorming
(11, 7, 2, '2025-06-18 14:01:00', '2025-06-18 16:03:00'), -- Alejandra - Brainstorming

(7, 3, 3, '2025-06-18 07:58:00', '2025-06-18 12:02:00'),  -- Patricia - Trabajo individual

(8, 8, 4, '2025-06-18 12:58:00', '2025-06-18 14:05:00'),  -- Roberto - Llamada cliente

-- Accesos sin reserva previa (usuarios que llegaron sin reservar)
(5, 4, NULL, '2025-06-18 15:30:00', '2025-06-18 17:00:00'), -- Laura uso cubículo sin reserva
(12, 5, NULL, '2025-06-18 11:00:00', '2025-06-18 13:30:00'), -- Andrés uso cubículo sin reserva

-- Accesos actuales (sin exit_time - aún están en el espacio)
(9, 2, 6, '2025-06-18 16:00:00', NULL),  -- Carmen en entrevista (aún dentro)
(3, 2, 6, '2025-06-18 16:00:00', NULL),  -- Miguel en entrevista (aún dentro)

-- Accesos de técnicos para mantenimiento (sin reserva)
(3, 9, NULL, '2025-06-18 07:00:00', '2025-06-18 08:30:00'), -- Miguel - mantenimiento
(4, 1, NULL, '2025-06-18 06:30:00', '2025-06-18 07:15:00'), -- Sofia - revisión sensores

-- Accesos de administradores
(1, 6, NULL, '2025-06-18 12:00:00', '2025-06-18 12:30:00'), -- Ana - inspección
(2, 10, NULL, '2025-06-18 17:00:00', '2025-06-18 17:45:00'); -- Carlos - configuración VIP

-- =============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- =============================================================================

/*
-- Verificar datos insertados
SELECT 'ROLES' as tabla, COUNT(*) as total FROM roles
UNION ALL
SELECT 'USERS', COUNT(*) FROM users  
UNION ALL
SELECT 'SPACES', COUNT(*) FROM spaces
UNION ALL  
SELECT 'RESERVATIONS', COUNT(*) FROM reservations
UNION ALL
SELECT 'RESERVATION_PARTICIPANTS', COUNT(*) FROM reservation_participants
UNION ALL
SELECT 'ACCESS_LOGS', COUNT(*) FROM access_logs;

-- Ver reservas con sus propietarios y espacios
SELECT 
    r.id,
    r.reason,
    r.start_time,
    r.end_time,
    r.status,
    u.name + ' ' + u.lastname as owner,
    s.name as space_name,
    s.location
FROM reservations r
JOIN users u ON r.owner_id = u.id
JOIN spaces s ON r.space_id = s.id
ORDER BY r.start_time;

-- Ver participantes por reserva
SELECT 
    r.reason,
    u.name + ' ' + u.lastname as participant,
    ro.name as role
FROM reservation_participants rp
JOIN reservations r ON rp.reservation_id = r.id
JOIN users u ON rp.user_id = u.id
JOIN roles ro ON u.role_id = ro.id
ORDER BY r.id, u.name;

-- Ver accesos recientes
SELECT 
    u.name + ' ' + u.lastname as user_name,
    s.name as space_name,
    al.access_time,
    al.exit_time,
    CASE WHEN al.exit_time IS NULL THEN 'AÚN DENTRO' ELSE 'SALIÓ' END as status
FROM access_logs al
JOIN users u ON al.user_id = u.id
JOIN spaces s ON al.space_id = s.id
ORDER BY al.access_time DESC;
*/
