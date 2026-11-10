-- Create tabla producto_variantes para gestionar stock por talle (Sprint 6)
CREATE TABLE IF NOT EXISTS public.producto_variantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL,
    talle TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key a productos
    CONSTRAINT fk_producto_id FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,
    
    -- Restricción: producto_id + talle es único (no duplicados)
    CONSTRAINT unique_producto_talle UNIQUE(producto_id, talle)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;

-- Policy: Admin puede ver y modificar todas las variantes
CREATE POLICY "admin_all_variantes" ON public.producto_variantes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid()
        )
    );

-- Policy: Usuarios autenticados (clientes) pueden VER variantes
CREATE POLICY "users_select_variantes" ON public.producto_variantes
    FOR SELECT
    USING (true);

-- Índice para búsquedas rápidas por producto_id
CREATE INDEX IF NOT EXISTS idx_producto_variantes_producto_id 
ON public.producto_variantes(producto_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_producto_variantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_producto_variantes_updated_at ON public.producto_variantes;
CREATE TRIGGER trigger_update_producto_variantes_updated_at
BEFORE UPDATE ON public.producto_variantes
FOR EACH ROW
EXECUTE FUNCTION update_producto_variantes_updated_at();

COMMENT ON TABLE public.producto_variantes IS 'Almacena variantes de productos (talle + stock). Cada fila es una combinación única de producto + talle.';
