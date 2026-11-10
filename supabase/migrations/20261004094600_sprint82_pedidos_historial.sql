-- ============================================================================
-- Sprint 8.2 · Paso 1 · MIGRACIÓN B
-- Estados extendidos de `pedidos` + tabla `pedidos_historial` + trigger de
-- validación de transiciones + RPCs públicas
-- ----------------------------------------------------------------------------
-- Requisito: aplicar DESPUÉS de la Migración A (el RPC de tracking lee
-- pedidos.metodo_envio).
-- ============================================================================

-- 1. CHECK de estados extendidos sobre pedidos.estado ------------------------
-- Se agrega separado del resto porque ALTER TABLE ... ADD CONSTRAINT no
-- soporta IF NOT EXISTS: un DO block es la única forma idempotente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.pedidos'::regclass
      AND conname = 'pedidos_estado_check'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_estado_check
      CHECK (estado IS NULL OR estado IN (
        'pendiente',  'confirmado', 'preparando',
        'en_camino',  'entregado', 'cancelado'
      ));
  END IF;
END;
$$;

-- 2. Tabla pedidos_historial -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos_historial (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  estado_anterior text,
  estado_nuevo    text NOT NULL CHECK (estado_nuevo IN (
                    'pendiente',  'confirmado', 'preparando',
                    'en_camino',  'entregado', 'cancelado'
                  )),
  changed_at      timestamptz NOT NULL DEFAULT now(),
  changed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  origen          text NOT NULL DEFAULT 'sistema'
                    CHECK (origen IN ('sistema', 'admin', 'cliente')),
  notas           text,

  CONSTRAINT pedidos_historial_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.pedidos_historial IS
  'Auditoría append-only de cambios de estado de pedidos.';

-- 3. Índices -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pedidos_historial_pedido
  ON public.pedidos_historial (pedido_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_historial_tenant
  ON public.pedidos_historial (tenant_id, changed_at DESC);

-- 4. RLS ---------------------------------------------------------------------
ALTER TABLE public.pedidos_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historial_select_admin" ON public.pedidos_historial;
CREATE POLICY "historial_select_admin" ON public.pedidos_historial
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

DROP POLICY IF EXISTS "historial_insert_admin" ON public.pedidos_historial;
CREATE POLICY "historial_insert_admin" ON public.pedidos_historial
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

DROP POLICY IF EXISTS "historial_update_admin" ON public.pedidos_historial;
CREATE POLICY "historial_update_admin" ON public.pedidos_historial
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  )
  WITH CHECK (
    (SELECT public.is_webmaster())
    OR tenant_id = (SELECT public.get_my_tenant_id())
  );

-- Borrado reservado al webmaster (retención de datos / RGPD)
DROP POLICY IF EXISTS "historial_delete_webmaster" ON public.pedidos_historial;
CREATE POLICY "historial_delete_webmaster" ON public.pedidos_historial
  FOR DELETE TO authenticated
  USING ((SELECT public.is_webmaster()));

-- 5. Función de registro + validación de transiciones ------------------------
-- SECURITY DEFINER: el INSERT en el historial no debe quedar sujeto a RLS,
-- porque el trigger se dispara desde cualquier UPDATE sobre pedidos.estado.
CREATE OR REPLACE FUNCTION public.registrar_cambio_estado_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transicion_valida boolean;
  v_uid uuid := auth.uid();
BEGIN
  -- estado NULL = pedido sin estado: no es una transición, no se audita.
  IF NEW.estado IS NULL THEN
    RETURN NEW;
  END IF;

  -- INSERT: se registra el estado inicial sin validar transición.
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pedidos_historial (
      pedido_id, tenant_id, estado_anterior,
      estado_nuevo, changed_by, origen
    ) VALUES (
      NEW.id, NEW.tenant_id, NULL,
      NEW.estado, v_uid,
      CASE WHEN v_uid IS NULL THEN 'sistema' ELSE 'cliente' END
    );
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM (VALUES
      ('pendiente',  'confirmado'),
      ('pendiente',  'cancelado'),
      ('confirmado', 'preparando'),
      ('confirmado', 'cancelado'),
      ('preparando', 'en_camino'),
      ('preparando', 'cancelado'),
      ('en_camino',  'entregado'),
      ('en_camino',  'cancelado')
    ) AS t(desde, hacia)
    WHERE t.desde = OLD.estado
      AND t.hacia = NEW.estado
  ) INTO v_transicion_valida;

  IF OLD.estado IS NOT NULL AND NOT v_transicion_valida THEN
    RAISE EXCEPTION
      'Transición de estado inválida: % → %', OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.pedidos_historial (
    pedido_id, tenant_id, estado_anterior,
    estado_nuevo, changed_by, origen
  ) VALUES (
    NEW.id, NEW.tenant_id, OLD.estado,
    NEW.estado, v_uid,
    CASE WHEN v_uid IS NULL THEN 'sistema' ELSE 'admin' END
  );

  RETURN NEW;
END;
$$;

-- 6. Triggers ----------------------------------------------------------------
-- El estado inicial también queda auditado: sin este trigger,
-- get_pedido_tracking devolvería historial = null en pedidos recién creados.
CREATE OR REPLACE TRIGGER trigger_estado_pedido_insert
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  WHEN (NEW.estado IS NOT NULL)
  EXECUTE FUNCTION public.registrar_cambio_estado_pedido();

CREATE OR REPLACE TRIGGER trigger_estado_pedido_update
  AFTER UPDATE OF estado ON public.pedidos
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado
        AND NEW.estado IS NOT NULL)
  EXECUTE FUNCTION public.registrar_cambio_estado_pedido();

-- 7. Backfill de historial para pedidos preexistentes ------------------------
INSERT INTO public.pedidos_historial
  (pedido_id, tenant_id, estado_anterior, estado_nuevo, changed_at, origen)
SELECT
  p.id, p.tenant_id, NULL, p.estado, p.created_at, 'sistema'
FROM public.pedidos p
WHERE p.estado IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.pedidos_historial h
    WHERE h.pedido_id = p.id
  );

-- 8. RPC pública de tracking ------------------------------------------------
-- Firma con token: el tracking NO se expone por pedido_id solo.
-- SECURITY DEFINER + token validado contra pedidos.token_seguimiento.
CREATE OR REPLACE FUNCTION public.get_pedido_tracking(
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
  IF p_token IS NULL OR p_token = '' THEN
    RAISE EXCEPTION 'Token de seguimiento requerido'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT json_build_object(
    'estado', p.estado,
    'metodo_envio', p.metodo_envio,
    'estado_anterior', (
      SELECT h.estado_anterior
      FROM public.pedidos_historial h
      WHERE h.pedido_id = p.id
      ORDER BY h.changed_at DESC, h.id DESC
      LIMIT 1
    ),
    'historial', COALESCE((
      SELECT json_agg(json_build_object(
        'estado_nuevo', h.estado_nuevo,
        'estado_anterior', h.estado_anterior,
        'changed_at', h.changed_at,
        'origen', h.origen
      ) ORDER BY h.changed_at ASC)
      FROM public.pedidos_historial h
      WHERE h.pedido_id = p.id
    ), '[]'::json)
  ) INTO v_result
  FROM public.pedidos p
  WHERE p.id = p_pedido_id
    AND p.token_seguimiento = p_token;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado o token inválido'
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pedido_tracking(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pedido_tracking(uuid, text) TO anon, authenticated;

-- 9. RPC pública para consultar entitlements sin sesión admin ---------------
CREATE OR REPLACE FUNCTION public.tenant_tiene_feature(
  p_tenant_id uuid,
  p_feature_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT pf.enabled
    FROM public.plan_features pf
    JOIN public.tenants t ON t.plan = pf.plan
    WHERE t.id = p_tenant_id
      AND t.activo = true
      AND pf.feature_key = p_feature_key
  ), false);
$$;

REVOKE ALL ON FUNCTION public.tenant_tiene_feature(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tenant_tiene_feature(uuid, text) TO anon, authenticated;
