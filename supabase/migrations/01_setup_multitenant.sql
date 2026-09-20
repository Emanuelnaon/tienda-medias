-- ============================================================================
-- Sprint 5 - Fundación Multi-Tenant y Base de Datos (Data-First)
-- ----------------------------------------------------------------------------
-- Agrega la columna tenant_id a las tablas que faltan y configura RLS con
-- políticas de aislamiento por tenant:
--   * Lectura pública: scoped por tenant_id (definido por el frontend vía set_tenant_id)
--   * Operaciones privadas: admin autenticado (auth.uid()) scoped al tenant de su perfil
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Función helper para que el frontend establezca el tenant solicitado
--    en lecturas públicas (anon). Las políticas anónimas leen request.tenant_id.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_tenant_id(p_tenant_id text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.tenant_id', p_tenant_id, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_tenant_id(text) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Inyección de tenant_id (tablas que aún no la poseen según la spec)
--    pedidos y categorias ya la tienen; no se vuelve a agregar.
-- ----------------------------------------------------------------------------
ALTER TABLE public.productos        ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default'::text;
ALTER TABLE public.producto_variantes ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default'::text;
ALTER TABLE public.clientes         ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default'::text;
ALTER TABLE public.pedidos_items    ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default'::text;
ALTER TABLE public.admin_users      ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default'::text;

-- ----------------------------------------------------------------------------
-- 3. Habilitar Row Level Security en todas las tablas transaccionales
-- ----------------------------------------------------------------------------
ALTER TABLE public.productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias        ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. Reemplazar políticas previas sin aislamiento por tenant
--    (creadas en migraciones anteriores de productos y producto_variantes)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir lectura pública de productos"   ON public.productos;
DROP POLICY IF EXISTS "Permitir inserción solo a administradores" ON public.productos;
DROP POLICY IF EXISTS "Permitir actualización solo a administradores" ON public.productos;
DROP POLICY IF EXISTS "Permitir eliminación solo a administradores"  ON public.productos;
DROP POLICY IF EXISTS "admin_all_variantes"  ON public.producto_variantes;
DROP POLICY IF EXISTS "users_select_variantes" ON public.producto_variantes;
DROP POLICY IF EXISTS "public_select_categorias" ON public.categorias;
DROP POLICY IF EXISTS "admin_all_categorias"   ON public.categorias;

-- ----------------------------------------------------------------------------
-- 5. Políticas de Lectura Pública (anon) - scoped por tenant_id
--    El frontend debe llamar public.set_tenant_id(<tenant>) antes de leer.
--    Si no se define, se asume el tenant 'default'.
-- ----------------------------------------------------------------------------
CREATE POLICY "public_select_productos"
    ON public.productos
    FOR SELECT
    TO anon
    USING (tenant_id = coalesce(current_setting('request.tenant_id', true), 'default')::text);

CREATE POLICY "public_select_producto_variantes"
    ON public.producto_variantes
    FOR SELECT
    TO anon
    USING (tenant_id = coalesce(current_setting('request.tenant_id', true), 'default')::text);

CREATE POLICY "public_select_categorias"
    ON public.categorias
    FOR SELECT
    TO anon
    USING (tenant_id = coalesce(current_setting('request.tenant_id', true), 'default')::text);

-- ----------------------------------------------------------------------------
-- 6. Políticas de Operaciones Privadas (admin autenticado) - scoped por tenant
--    El admin solo accede a filas cuyo tenant_id coincida con el de su perfil
--    en admin_users. La política FOR ALL cubre SELECT/INSERT/UPDATE/DELETE.
-- ----------------------------------------------------------------------------

-- productos
CREATE POLICY "admin_tenant_isolation_productos"
    ON public.productos
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = productos.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = productos.tenant_id
    ));

-- producto_variantes
CREATE POLICY "admin_tenant_isolation_variantes"
    ON public.producto_variantes
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = producto_variantes.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = producto_variantes.tenant_id
    ));

-- categorias
CREATE POLICY "admin_tenant_isolation_categorias"
    ON public.categorias
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = categorias.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = categorias.tenant_id
    ));

-- clientes
CREATE POLICY "admin_tenant_isolation_clientes"
    ON public.clientes
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = clientes.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = clientes.tenant_id
    ));

-- pedidos_items
CREATE POLICY "admin_tenant_isolation_pedidos_items"
    ON public.pedidos_items
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = pedidos_items.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = pedidos_items.tenant_id
    ));

-- pedidos
CREATE POLICY "admin_tenant_isolation_pedidos"
    ON public.pedidos
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = pedidos.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.tenant_id = pedidos.tenant_id
    ));

-- admin_users (los propios administradores)
CREATE POLICY "admin_tenant_isolation_admin_users"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admin_users AS self
        WHERE self.id = auth.uid()
          AND self.tenant_id = admin_users.tenant_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admin_users AS self
        WHERE self.id = auth.uid()
          AND self.tenant_id = admin_users.tenant_id
    ));

-- ----------------------------------------------------------------------------
-- 7. Índices por tenant_id para rendimiento en filtrado multitenant
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_productos_tenant_id         ON public.productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_producto_variantes_tenant_id ON public.producto_variantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_id          ON public.clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_tenant_id     ON public.pedidos_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_id           ON public.pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_id       ON public.admin_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tenant_id        ON public.categorias(tenant_id);

-- ----------------------------------------------------------------------------
-- 8. Nota: confirmar_venta_y_actualizar_crm (ver Spec 4)
--    La RPC debe validar, al descontar stock y sumar gastos al cliente, que el
--    tenant_id del pedido coincida con el tenant del admin que ejecuta la RPC.
--    Revisar y reforzar el filtrado de tenant_id dentro de la función.
-- ----------------------------------------------------------------------------
