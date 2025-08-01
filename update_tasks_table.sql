-- Script para actualizar la tabla tasks con campos adicionales
-- Ejecutar en la base de datos Supabase

-- Agregar columnas faltantes a la tabla tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS title character varying NOT NULL DEFAULT 'Sin título',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS status character varying NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS priority character varying NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS assigned_to integer REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Renombrar la columna users_id a created_by para mayor claridad
ALTER TABLE public.tasks RENAME COLUMN users_id TO created_by;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
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

-- Verificar la estructura actualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position; 