CREATE DATABASE workbit;
USE workbit;

CREATE TABLE grid_settings (
    id INT PRIMARY KEY IDENTITY(1,1),
    rows INT NOT NULL,
    cols INT NOT NULL,
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE roles (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(20) UNIQUE NOT NULL 
);

CREATE TABLE codecards (
    id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    role_id INT NOT NULL,
    card_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY  (card_id) REFERENCES codecards(id)
);

CREATE TABLE spaces (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL UNIQUE,
    position_x INT NOT NULL,
    position_y INT NOT NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('available', 'unavailable', 'occupied', 'reserved', 'maintenance')) DEFAULT 'available',
    capacity INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE reservations (
    id INT PRIMARY KEY IDENTITY(1,1),
    reason VARCHAR(100) NOT NULL,     
    start_time DATETIME NOT NULL,      
    end_time DATETIME NOT NULL,        
    status VARCHAR(15) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    space_id INT NOT NULL,             
    owner_id INT NOT NULL,              
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (space_id) REFERENCES spaces(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE reservation_participants (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,              
    reservation_id INT NOT NULL,     
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

CREATE TABLE access_logs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,              
    space_id INT NOT NULL,             
    reservation_id INT NULL,            
    access_time DATETIME NOT NULL,    
    exit_time DATETIME,                
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (space_id) REFERENCES spaces(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);


INSERT INTO roles (name) VALUES 
('user'),          
('admin'),       
('technician');   

INSERT INTO codecards (code) VALUES
('828E9EEE'),
('A1B2C3D4'),
('F5G6H7I8'),
('J9K0L1M2'),
('N3O4P5Q6'),
('R7S8T9U0'),
('V1W2X3Y4'),
('Z5A6B7C8'),
('D9E0F1G2'),
('H3I4J5K6'),
('L7M8N9O0'),
('P1Q2R3S4'),
('T5U6V7W8'),
('X9Y0Z1A2'),
('B3C4D5E6'),
('F7G8H9I0'),
('J1K2L3M4'),
('N5O6P7Q8'),
('R9S0T1U2'),
('V3W4X5Y6'),
('Z7A8B9C0'),
('D1E2F3G4'),
('H5I6J7K8'),
('L9M0N1O2'),
('Q3R4S5T6');


INSERT INTO users (name, lastname, username, email, password, role_id, card_id) VALUES
('Ana', 'Torres', 'ana.torres', 'ana@example.com', 'hashedpass1', 1, 1),
('Luis', 'Pérez', 'luis.perez', 'luis@example.com', 'hashedpass2', 1, 2),
('María', 'Gómez', 'maria.gomez', 'maria@example.com', 'hashedpass3', 1, 3),
('Carlos', 'Ruiz', 'carlos.ruiz', 'carlos@example.com', 'hashedpass4', 1, 4),
('Juan', 'López', 'juan.lopez', 'juan.lopez@example.com', 'hashedpass5', 1, 5),
('Andrea', 'Martínez', 'andrea.martinez', 'andrea.m@example.com', 'hashedpass6', 1, 6),
('Diego', 'Hernández', 'diego.hernandez', 'diego.h@example.com', 'hashedpass7', 1, 7),
('Elena', 'Ramírez', 'elena.ramirez', 'elena.r@example.com', 'hashedpass8', 1, 8),
('Ricardo', 'Morales', 'ricardo.morales', 'ricardo.m@example.com', 'hashedpass9', 1, 9),
('Valeria', 'Sánchez', 'valeria.sanchez', 'valeria.s@example.com', 'hashedpass10', 1, 10),
('Jorge', 'Castro', 'jorge.castro', 'jorge.c@example.com', 'hashedpass11', 1, 11),
('Daniela', 'Núñez', 'daniela.nunez', 'daniela.n@example.com', 'hashedpass12', 1, 12),
('Miguel', 'Fernández', 'miguel.fernandez', 'miguel.f@example.com', 'hashedpass13', 1, 13),
('Paula', 'Ortega', 'paula.ortega', 'paula.o@example.com', 'hashedpass14', 1, 14),
('Sergio', 'García', 'sergio.garcia', 'sergio.g@example.com', 'hashedpass15', 1, 15),
('Lucía', 'Mendoza', 'lucia.mendoza', 'lucia.m@example.com', 'hashedpass16', 1, 16),
('Emilio', 'Silva', 'emilio.silva', 'emilio.s@example.com', 'hashedpass17', 1, 17),
('Camila', 'Paredes', 'camila.paredes', 'camila.p@example.com', 'hashedpass18', 1, 18),
('Mauricio', 'Cortés', 'mauricio.cortes', 'mauricio.c@example.com', 'hashedpass19', 1, 19),
('Rocío', 'Delgado', 'rocio.delgado', 'rocio.d@example.com', 'hashedpass20', 1, 20),
('Hugo', 'Reyes', 'hugo.reyes', 'hugo.r@example.com', 'hashedpass21', 1, 21),
('Alejandra', 'Vega', 'alejandra.vega', 'alejandra.v@example.com', 'hashedpass22', 1, 22),
('Iván', 'Flores', 'ivan.flores', 'ivan.f@example.com', 'hashedpass23', 1, 23),
('Gabriela', 'Campos', 'gabriela.campos', 'gabriela.c@example.com', 'hashedpass24', 1, 24),
('Carlos', 'Hernández', 'carlos.hernandez', 'carlos.h@example.com', 'hashedpass25', 1, 25);



INSERT INTO spaces (name, position_id, status, capacity) VALUES
('Sala Norte', 1, 'unavailable', 10),
('Sala Sur', 2, 'unavailable', 8),
('Cubículo A', 3, 'available', 2),
('Cubículo B', 4, 'available', 2),
('Sala Este', 5, 'unavailable', 12),
('Sala Oeste', 6, 'available', 6),
('Laboratorio 1', 7, 'available', 15),
('Laboratorio 2', 8, 'unavailable', 15),
('Sala de Juntas', 9, 'available', 20),
('Cubículo C', 10, 'available', 1),
('Cubículo D', 11, 'available', 1),
('Auditorio', 12, 'available', 50),
('Cubículo E', 13, 'available', 2),
('Cubículo F', 14, 'available', 2),
('Sala de Estudio 1', 15, 'available', 8),
('Sala de Estudio 2', 16, 'available', 8),
('Sala Creativa', 17, 'available', 6),
('Sala de Reuniones 1', 18, 'available', 10),
('Sala de Reuniones 2', 19, 'available', 10),
('Laboratorio 3', 20, 'available', 20),
('Laboratorio 4', 21, 'available', 20),
('Laboratorio 5', 22, 'available', 15),
('Área Colaborativa 1', 23, 'available', 12),
('Área Colaborativa 2', 24, 'available', 12),
('Cabina A', 25, 'available', 1),
('Cabina B', 26, 'available', 1),
('Cabina C', 27, 'available', 1),
('Estudio A', 28, 'available', 5),
('Estudio B', 29, 'available', 5),
('Estudio C', 30, 'available', 5),
('MiniSala A', 31, 'available', 4),
('MiniSala B', 32, 'available', 4),
('MiniSala C', 33, 'available', 4),
('Espacio Abierto A', 34, 'available', 30),
('Espacio Abierto B', 35, 'available', 30),
('Zona Individual A', 36, 'available', 1),
('Zona Individual B', 37, 'available', 1),
('Zona Individual C', 38, 'available', 1),
('Espacio Tech A', 39, 'available', 6),
('Espacio Tech B', 40, 'available', 6),
('Zona Creativa A', 41, 'available', 10),
('Zona Creativa B', 42, 'available', 10);

INSERT INTO reservations (reason, start_time, end_time, status, space_id, owner_id) VALUES
('Reunión de proyecto', '2025-06-15 09:00:00', '2025-06-15 11:00:00', 'confirmed', 1, 1),
('Sesión de estudio', '2025-06-15 10:00:00', '2025-06-15 12:00:00', 'confirmed', 2, 2);

INSERT INTO reservation_participants (reservation_id, user_id) VALUES
(1, 1),
(1, 3),
(1, 4),
(2, 2),
(2, 3);