-- ============================================================================
-- Sprint 8.2 · Paso 1 · MIGRACIÓN A
-- Columnas de envío en `pedidos` + tabla `zonas_envio`
-- ----------------------------------------------------------------------------
-- Estado verificado de la DB antes de aplicar:
--   * pedidos: id, created_at, cliente_id, estado (text nullable), total,
--     comprobante_url, tenant_id, comprobante_numero
--   * tenants: tiene `activo boolean` y `plan text`
--   * No existe la tabla zonas_envio
--   * No existe ningún CHECK sobre pedidos.estado
--
-- Todas las sentencias son idempotentes: se puede re-ejecutar el archivo
-- completo sin error aunque una ejecución anterior haya fallado a mitad.
-- ============================================================================

-- 1. Columnas de envío en pedidos -------------------------------------------
-- Nota: las restricciones se agregan en el paso 3 (no inline) para que un
-- re-ejecución con IF NOT EXISTS no las omita silenciosamente.
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS metodo_envio   text,
  ADD COLUMN IF NOT EXISTS zona_envio_id  uuid,
  ADD COLUMN IF NOT EXISTS costo_envio    numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS codigo_postal  text,
  ADD COLUMN IF NOT EXISTS direccion_entrega text,
  ADD COLUMN IF NOT EXISTS token_seguimiento text;

-- 2. Unicidad del token de seguimiento (índice parcial: NULLs no colisionan)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_token_seguimiento
  ON public.pedidos (token_seguimiento)
  WHERE token_seguimiento IS NOT NULL;

-- 3. CHECK de metodo_envio (solo si aún no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedidos'::regclass
      AND conname = 'pedidos_metodo_envio_check'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_metodo_envio_check
      CHECK (metodo_envio IS NULL
        OR metodo_envio IN ('retiro', 'mensajeria_local', 'correo'));
  END IF;
END;
$$;

-- 4. Tabla zonas_envio -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zonas_envio (
  id                   uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre               text NOT NULL,
  codigo_postal_desde  text,
  codigo_postal_hasta  text,
  metodo               text NOT NULL,
  costo                numeric(12,2) NOT NULL DEFAULT 0,
  minimo_envio_gratis  numeric(12,2),
  activo               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT zonas_envio_pkey PRIMARY KEY (id),
  CONSTRAINT zonas_envio_metodo_check
    CHECK (metodo IN ('retiro', 'mensajeria_local', 'correo')),
  CONSTRAINT zonas_envio_costo_check
    CHECK (costo >= 0),
  CONSTRAINT zonas_envio_minimo_check
    CHECK (minimo_envio_gratis IS NULL OR minimo_envio_gratis >= 0),
  CONSTRAINT zonas_envio_cp_order_check
    CHECK (codigo_postal_desde IS NULL
      OR codigo_postal_hasta IS NULL
      OR codigo_postal_desde <= codigo_postal_hasta)
);

COMMENT ON TABLE public.zonas_envio IS
  'Zonas de envío por tenant: define metodo, costo y umbral de envío gratis.';

-- 5. Índices -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_zonas_envio_tenant
  ON public.zonas_envio (tenant_id, activo);

-- FK sin índice en la tabla referenciante: se agrega para evitar seq scans
CREATE INDEX IF NOT EXISTS idx_pedidos_zona_envio
  ON public.pedidos (zona_envio_id)
  WHERE zona_envio_id IS NOT NULL;

-- 6. FK pedidos.zona_envio_id -> zonas_envio.id (solo si aún no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedidos'::regclass
      AND conname = 'pedidos_zona_envio_fkey'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_zona_envio_fkey
      FOREIGN KEY (zona_envio_id)
      REFERENCES public.zonas_envio(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- 7. RLS ---------------------------------------------------------------------
ALTER TABLE public.zonas_envio ENABLE ROW LEVEL SECURITY;

-- Lectura pública: el checkout necesita consultar las zonas para calcular costo
DROP POLICY IF EXISTS "zonas_envio_select_public" ON public.zonas_envio;
CREATE POLICY "zonas_envio_select_public" ON public.zonas_envio
  FOR SELECT TO anon, authenticated
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE activo = true));

-- Escritura: políticas granulares por comando (prohibido FOR ALL en este proyecto)
DROP POLICY IF EXISTS "zonas_envio_insert_admin" ON public.zonas_envio;
CREATE POLICY "zonas_envio_insert_admin" ON public.zonas_envio
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

DROP POLICY IF EXISTS "zonas_envio_update_admin" ON public.zonas_envio;
CREATE POLICY "zonas_envio_update_admin" ON public.zonas_envio
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  )
  WITH CHECK (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

DROP POLICY IF EXISTS "zonas_envio_delete_admin" ON public.zonas_envio;
CREATE POLICY "zonas_envio_delete_admin" ON public.zonas_envio
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );
