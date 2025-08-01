-- Script para arreglar la tabla tasks y agregar las restricciones de clave foránea faltantes
-- Ejecutar en la base de datos Supabase

-- Primero, verificar si la tabla tasks existe y su estructura actual
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Agregar las columnas faltantes si no existen
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS title character varying NOT NULL DEFAULT 'Sin título',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS status character varying NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS priority character varying NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS assigned_to integer,
ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Renombrar la columna users_id a created_by si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'users_id') THEN
    ALTER TABLE public.tasks RENAME COLUMN users_id TO created_by;
  END IF;
END $$;

-- Agregar la columna created_by si no existe
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by integer;

-- Eliminar restricciones de clave foránea existentes si están mal configuradas
DO $$ 
BEGIN
  -- Eliminar la restricción tasks_assigned_to_fkey si existe
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_fkey') THEN
    ALTER TABLE public.tasks DROP CONSTRAINT tasks_assigned_to_fkey;
  END IF;
  
  -- Eliminar la restricción tasks_created_by_fkey si existe
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_created_by_fkey') THEN
    ALTER TABLE public.tasks DROP CONSTRAINT tasks_created_by_fkey;
  END IF;
END $$;

-- Agregar las restricciones de clave foránea correctas
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- Agregar restricción de clave foránea para space_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_space_id_fkey') THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_space_id_fkey 
    FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_space_id ON public.tasks(space_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- Insertar algunos datos de ejemplo si la tabla está vacía
INSERT INTO public.tasks (title, description, status, priority, space_id, created_by, assigned_to)
SELECT 
  'Mantenimiento preventivo',
  'Realizar mantenimiento preventivo del sistema de aire acondicionado',
  'pending',
  'medium',
  s.id,
  1, -- Asumiendo que el usuario con ID 1 es admin
  NULL
FROM public.spaces s
WHERE NOT EXISTS (SELECT 1 FROM public.tasks LIMIT 1)
LIMIT 3;

-- Verificar la estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar las restricciones de clave foránea
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'tasks'; 