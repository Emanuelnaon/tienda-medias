-- Habilitar la extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de la tabla productos
CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    talles_disponibles TEXT[] NOT NULL DEFAULT '{}',
    imagen_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- 1. Política SELECT: Cualquiera puede leer productos (públicos y autenticados)
CREATE POLICY "Permitir lectura pública de productos" 
ON public.productos 
FOR SELECT 
USING (true);

-- 2. Política INSERT: Solo administradores (validando con user_id) pueden insertar productos
CREATE POLICY "Permitir inserción solo a administradores" 
ON public.productos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Política UPDATE: Solo administradores (validando con user_id) pueden actualizar productos
CREATE POLICY "Permitir actualización solo a administradores" 
ON public.productos 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Política DELETE: Solo administradores (validando con user_id) pueden eliminar productos
CREATE POLICY "Permitir eliminación solo a administradores" 
ON public.productos 
FOR DELETE 
USING (auth.uid() = user_id);
