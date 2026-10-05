-- ============================================================================
-- Sprint 8.2 · Paso 1 · MIGRACIÓN C
-- delivery_tracking (posición del repartidor) + publication Realtime +
-- feature flags de shipping_zones / live_tracking
-- ----------------------------------------------------------------------------
-- Requisito: aplicar DESPUÉS de las Migraciones A y B.
-- ============================================================================

-- 1. Tabla delivery_tracking -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id  uuid NOT NULL UNIQUE REFERENCES public.pedidos(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lat        double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng        double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.delivery_tracking IS
  'Última posición conocida del repartidor. Solo escribible vía RPC con token.';

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_tenant
  ON public.delivery_tracking (tenant_id);

-- 2. RLS ---------------------------------------------------------------------
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Sin política SELECT para anon: la posición del repartidor es dato sensible
-- (ubicación en tiempo real de una persona). Se lee únicamente a través del
-- RPC get_delivery_position, que valida token_seguimiento.

DROP POLICY IF EXISTS "delivery_tracking_select_admin" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_select_admin" ON public.delivery_tracking
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

-- Escritura solo por RPC (SECURITY DEFINER). Políticas admin para correcciones
-- manuales desde el panel.
DROP POLICY IF EXISTS "delivery_tracking_update_admin" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_update_admin" ON public.delivery_tracking
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  )
  WITH CHECK (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

DROP POLICY IF EXISTS "delivery_tracking_delete_admin" ON public.delivery_tracking;
CREATE POLICY "delivery_tracking_delete_admin" ON public.delivery_tracking
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

-- 3. RPC de escritura (repartidor) ------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_delivery_position(
  p_pedido_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF p_token IS NULL OR p_token = '' THEN
    RAISE EXCEPTION 'Token de seguimiento requerido'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT p.tenant_id INTO v_tenant_id
  FROM public.pedidos p
  WHERE p.id = p_pedido_id
    AND p.token_seguimiento = p_token
    AND p.estado = 'en_camino';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Token inválido o pedido no está en camino'
      USING ERRCODE = 'no_data_found';
  END IF;

  INSERT INTO public.delivery_tracking
    (pedido_id, tenant_id, lat, lng, updated_at)
  VALUES
    (p_pedido_id, v_tenant_id, p_lat, p_lng, now())
  ON CONFLICT (pedido_id) DO UPDATE
    SET lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION
  public.upsert_delivery_position(uuid, double precision, double precision, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  public.upsert_delivery_position(uuid, double precision, double precision, text)
  TO anon, authenticated;

-- 4. RPC de lectura (cliente) ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_delivery_position(
  p_pedido_id uuid,
  p_token text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result json;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = p_pedido_id
      AND p.token_seguimiento = p_token
  ) THEN
    RAISE EXCEPTION 'Pedido no encontrado o token inválido'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT json_build_object(
    'lat', d.lat,
    'lng', d.lng,
    'updated_at', d.updated_at
  ) INTO v_result
  FROM public.delivery_tracking d
  WHERE d.pedido_id = p_pedido_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_delivery_position(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_delivery_position(uuid, text) TO anon, authenticated;

-- 5. Realtime ----------------------------------------------------------------
-- ALTER PUBLICATION ... ADD TABLE no es idempotente: si la tabla ya está en la
-- publication el comando aborta. Por eso se consulta pg_publication_tables antes.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pedidos_historial', 'delivery_tracking'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables pt
      WHERE pt.pubname = 'supabase_realtime'
        AND pt.schemaname = 'public'
        AND pt.tablename = t
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t
      );
    END IF;
  END LOOP;
END;
$$;

-- 6. Feature flags -----------------------------------------------------------
-- Misma convención que 20260925_add_crm_clientes_feature_flag.sql
INSERT INTO public.plan_features (feature_key, plan, enabled)
VALUES
    ('shipping_zones', 'basico',  FALSE),
    ('shipping_zones', 'premium', TRUE),
    ('live_tracking',  'basico',  FALSE),
    ('live_tracking',  'premium', TRUE)
ON CONFLICT DO NOTHING;
