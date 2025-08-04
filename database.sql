-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_logs (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  space_id integer NOT NULL,
  reservation_id integer,
  access_time timestamp without time zone NOT NULL,
  exit_time timestamp without time zone,
  CONSTRAINT access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT access_logs_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT access_logs_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id),
  CONSTRAINT access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.codecards (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  code character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT codecards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.grid_settings (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rows integer NOT NULL,
  cols integer NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT grid_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  title character varying NOT NULL,
  description character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reservation_participants (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  reservation_id integer NOT NULL,
  CONSTRAINT reservation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reservation_participants_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.reservations (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  reason character varying NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying]::text[])),
  space_id integer NOT NULL,
  owner_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id),
  CONSTRAINT reservations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL UNIQUE,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spaces (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL UNIQUE,
  position_x integer NOT NULL,
  position_y integer NOT NULL,
  status character varying NOT NULL DEFAULT 'available'::character varying CHECK (status::text = ANY (ARRAY['available'::character varying, 'unavailable'::character varying, 'occupied'::character varying, 'reserved'::character varying, 'maintenance'::character varying]::text[])),
  capacity integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT spaces_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tasks (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_by integer NOT NULL,
  space_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status text,
  title character varying NOT NULL DEFAULT 'Sin título'::character varying,
  description text,
  priority character varying NOT NULL DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[])),
  assigned_to integer,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT tasks_users_id_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  lastname character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  role_id integer NOT NULL,
  card_id integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid UNIQUE,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT users_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.codecards(id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);