-- WorkBit - Script de Inicialización SQL (PostgreSQL/Supabase)
-- Este script consolida el esquema vigente descrito en database.sql
-- Si ya ejecutó database.sql en Supabase, este archivo es opcional.
-- Puede usarse para preparar un entorno mínimo de pruebas.
/*Responsables:
    Mayo Ramos Angel David
    Alvarez Galindo Aldo Yamil
    Munoz Reynoso Oscar Gael
    Gomez Miramontes Daniel
Grupo: 5A
Fecha de entrega: 08/08/25*/
-- 1) Tablas esenciales (si no existen)
CREATE TABLE IF NOT EXISTS public.roles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.codecards (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.spaces (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar NOT NULL UNIQUE,
  position_x integer,
  position_y integer,
  status varchar NOT NULL DEFAULT 'available' CHECK (status IN ('available','unavailable','occupied','reserved','maintenance')),
  capacity integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar NOT NULL,
  lastname varchar NOT NULL,
  username varchar NOT NULL UNIQUE,
  role_id integer NOT NULL REFERENCES public.roles(id),
  card_id integer REFERENCES public.codecards(id),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid UNIQUE -- referencia a auth.users (Supabase Auth)
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reason varchar NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  space_id integer NOT NULL REFERENCES public.spaces(id),
  owner_id integer NOT NULL REFERENCES public.users(id),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.reservation_participants (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reservation_id integer NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.access_logs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id),
  space_id integer NOT NULL REFERENCES public.spaces(id),
  reservation_id integer REFERENCES public.reservations(id),
  access_time timestamp without time zone NOT NULL,
  exit_time timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.grid_settings (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rows integer NOT NULL,
  cols integer NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.reports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id),
  reservation_id integer NOT NULL REFERENCES public.reservations(id),
  title varchar NOT NULL,
  description varchar NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.report_attachments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id integer NOT NULL REFERENCES public.reports(id),
  file_url text NOT NULL,
  thumbnail_url text,
  content_type text,
  size integer,
  storage_provider text DEFAULT 'supabase',
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by integer NOT NULL REFERENCES public.users(id),
  assigned_to integer REFERENCES public.users(id),
  space_id integer NOT NULL REFERENCES public.spaces(id),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status text,
  title varchar NOT NULL DEFAULT 'Sin título',
  description text,
  priority varchar NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high'))
);

-- 2) Índices recomendados
CREATE INDEX IF NOT EXISTS IX_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS IX_reservations_space_time ON public.reservations(space_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS IX_access_logs_user_space ON public.access_logs(user_id, space_id, access_time);

-- 3) Datos mínimos
INSERT INTO public.roles (name)
  VALUES ('user'), ('admin'), ('technician')
ON CONFLICT (name) DO NOTHING;

-- Espacios de ejemplo
INSERT INTO public.spaces (name, position_x, position_y, status, capacity)
  VALUES ('Sala de Reuniones A', 0, 0, 'available', 8),
         ('Sala de Reuniones B', 1, 0, 'available', 6)
ON CONFLICT (name) DO NOTHING;

-- 4) Nota de RLS (Supabase)
-- Si RLS está habilitado, cree políticas acordes o use SERVICE ROLE en el backend para operaciones administrativas.
