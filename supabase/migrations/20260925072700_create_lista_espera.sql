-- Migración Sprint 7: Creación de la tabla lista_espera y RPC para captura de contactos en productos agotados

-- 1. Crear la tabla lista_espera con claves foráneas adecuadas
CREATE TABLE IF NOT EXISTS public.lista_espera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    variante_id UUID,
    email TEXT,
    telefono TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Claves foráneas con eliminación en cascada o set null para mantener la integridad referencial
    CONSTRAINT fk_lista_espera_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_espera_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_espera_variante FOREIGN KEY (variante_id) REFERENCES public.producto_variantes(id) ON DELETE SET NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad (RLS) para la tabla lista_espera
-- Policy: Anon puede insertar en la lista de espera siempre que el tenant esté activo
CREATE POLICY "anon_insert_lista_espera" ON public.lista_espera
    FOR INSERT
    TO anon
    WITH CHECK (
        tenant_id IN (SELECT id FROM public.tenants WHERE activo = true)
    );

-- Policy: Admin puede ver y borrar todas las solicitudes de su propio tenant
CREATE POLICY "admin_select_lista_espera" ON public.lista_espera
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = lista_espera.tenant_id
    ));

CREATE POLICY "admin_delete_lista_espera" ON public.lista_espera
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = lista_espera.tenant_id
    ));

-- 4. Índices para optimizar las consultas del administrador y búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lista_espera_tenant_id ON public.lista_espera(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_producto_id ON public.lista_espera(producto_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_created_at ON public.lista_espera(created_at DESC);

-- 5. RPC Security Definer para la inserción segura desde el cliente público (Next.js)
-- Se reordenan los parámetros para colocar p_telefono antes de los opcionales (con DEFAULT).
CREATE OR REPLACE FUNCTION public.crear_lista_espera(
    p_tenant_id UUID,
    p_producto_id UUID,
    p_telefono TEXT,
    p_variante_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Validar que el tenant exista y esté activo
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id AND activo = true) THEN
        RAISE EXCEPTION 'Tenant inválido o inactivo';
    END IF;

    -- Validar que el producto exista y pertenezca al tenant correspondiente
    IF NOT EXISTS (SELECT 1 FROM public.productos WHERE id = p_producto_id AND tenant_id = p_tenant_id) THEN
        RAISE EXCEPTION 'Producto no encontrado para este tenant';
    END IF;

    -- Validar que la variante, si es provista, pertenezca al producto correcto
    IF p_variante_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.producto_variantes
        WHERE id = p_variante_id AND producto_id = p_producto_id
    ) THEN
        RAISE EXCEPTION 'Variante inválida para este producto';
    END IF;

    -- Insertar el registro y retornar el ID generado utilizando el nombre de columna correcto 'telefono'
    INSERT INTO public.lista_espera (tenant_id, producto_id, variante_id, email, telefono)
    VALUES (p_tenant_id, p_producto_id, p_variante_id, p_email, p_telefono)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Otorgar permisos de ejecución para roles públicos y autenticados
GRANT EXECUTE ON FUNCTION public.crear_lista_espera(UUID, UUID, TEXT, UUID, TEXT) TO anon, authenticated;

-- Agregar un comentario descriptivo para la tabla y columnas
COMMENT ON TABLE public.lista_espera IS 'Almacena registros de clientes interesados en productos agotados.';
