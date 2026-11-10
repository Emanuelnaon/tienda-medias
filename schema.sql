


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."confirmar_pedido_transaccion"("p_pedido_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_pedido RECORD;
    v_item RECORD;
    v_nuevo_stock INTEGER;
    v_talle_buscar TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: sesión requerida';
    END IF;

    IF NOT is_webmaster()
       AND get_my_tenant_id() IS DISTINCT FROM
           (SELECT tenant_id FROM pedidos WHERE id = p_pedido_id)
    THEN
        RAISE EXCEPTION 'Acceso denegado: pedido no pertenece a este tenant';
    END IF;

    SELECT id, estado, total, cliente_id INTO v_pedido
    FROM public.pedidos WHERE id = p_pedido_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró el pedido solicitado.';
    END IF;

    IF v_pedido.estado = 'confirmado' THEN
        RETURN jsonb_build_object('success', false, 'mensaje', 'El pedido ya estaba confirmado.');
    END IF;

    FOR v_item IN
        SELECT id, producto_id, talle, cantidad
        FROM public.pedidos_items WHERE pedido_id = p_pedido_id
    LOOP
        v_talle_buscar := COALESCE(v_item.talle, 'Único');

        UPDATE public.producto_variantes
        SET stock = stock - v_item.cantidad
        WHERE producto_id = v_item.producto_id AND talle = v_talle_buscar
        RETURNING stock INTO v_nuevo_stock;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No se encontró variante para el producto % talle %.', v_item.producto_id, v_talle_buscar;
        END IF;
        IF v_nuevo_stock < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto % (Talle: %).', v_item.producto_id, v_talle_buscar;
        END IF;
    END LOOP;

    UPDATE public.pedidos SET estado = 'confirmado' WHERE id = p_pedido_id;

    UPDATE public.clientes
    SET total_gastado = COALESCE(total_gastado, 0) + v_pedido.total,
        cantidad_pedidos = COALESCE(cantidad_pedidos, 0) + 1
    WHERE id = v_pedido.cliente_id;

    RETURN jsonb_build_object('success', true, 'mensaje', 'Pedido confirmado exitosamente.');
END;
$$;


ALTER FUNCTION "public"."confirmar_pedido_transaccion"("p_pedido_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_cliente_checkout"("p_nombre_completo" "text", "p_telefono" "text", "p_tenant_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_tel text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_id uuid;
  v_bloqueado boolean;
BEGIN
  IF length(v_tel) < 8 THEN
    RAISE EXCEPTION 'Teléfono inválido';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND activo = true) THEN
    RAISE EXCEPTION 'Tenant inválido o inactivo';
  END IF;

  SELECT id, bloqueado INTO v_id, v_bloqueado
  FROM clientes
  WHERE tenant_id = p_tenant_id
    AND regexp_replace(telefono, '\D', '', 'g') = v_tel;

  IF FOUND THEN
    IF v_bloqueado THEN
      RAISE EXCEPTION 'Cliente bloqueado por sospecha de fraude';
    END IF;
    RETURN v_id;  -- el nombre existente no se pisa
  END IF;

  INSERT INTO clientes (nombre_completo, telefono, tenant_id)
  VALUES (trim(p_nombre_completo), v_tel, p_tenant_id)
  ON CONFLICT (tenant_id, telefono) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN  -- carrera: otro request lo creó justo antes
    SELECT id INTO v_id FROM clientes
    WHERE tenant_id = p_tenant_id AND telefono = v_tel;
  END IF;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."crear_cliente_checkout"("p_nombre_completo" "text", "p_telefono" "text", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_lista_espera"("p_tenant_id" "uuid", "p_producto_id" "uuid", "p_telefono" "text", "p_variante_id" "uuid" DEFAULT NULL::"uuid", "p_email" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."crear_lista_espera"("p_tenant_id" "uuid", "p_producto_id" "uuid", "p_telefono" "text", "p_variante_id" "uuid", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_pedido_checkout"("p_cliente_id" "uuid", "p_total" numeric, "p_tenant_id" "uuid", "p_items" "jsonb", "p_codigo_postal" "text" DEFAULT NULL::"text", "p_direccion_entrega" "text" DEFAULT NULL::"text", "p_metodo_envio" "text" DEFAULT NULL::"text", "p_zona_envio_id" "uuid" DEFAULT NULL::"uuid", "p_costo_envio" numeric DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenants WHERE id = p_tenant_id AND activo = true
  ) THEN
    RAISE EXCEPTION 'Tenant inválido o inactivo';
  END IF;

  -- Defensa en profundidad: verificar que el cliente no esté bloqueado
  IF EXISTS (
    SELECT 1 FROM clientes
    WHERE id = p_cliente_id AND bloqueado = true
  ) THEN
    RAISE EXCEPTION 'Cliente bloqueado por sospecha de fraude';
  END IF;

  INSERT INTO pedidos (
    cliente_id, total, estado, tenant_id,
    codigo_postal, direccion_entrega,
    metodo_envio, zona_envio_id, costo_envio
  )
  VALUES (
    p_cliente_id, p_total, 'pendiente', p_tenant_id,
    p_codigo_postal, p_direccion_entrega,
    p_metodo_envio, p_zona_envio_id, p_costo_envio
  )
  RETURNING id INTO v_pedido_id;

  INSERT INTO pedidos_items (
    pedido_id, producto_id, nombre_producto,
    talle, cantidad, precio_unitario
  )
  SELECT
    v_pedido_id,
    (item->>'producto_id')::uuid,
    item->>'nombre_producto',
    item->>'talle',
    (item->>'cantidad')::integer,
    (item->>'precio_unitario')::numeric
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_pedido_id;
END;
$$;


ALTER FUNCTION "public"."crear_pedido_checkout"("p_cliente_id" "uuid", "p_total" numeric, "p_tenant_id" "uuid", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion_entrega" "text", "p_metodo_envio" "text", "p_zona_envio_id" "uuid", "p_costo_envio" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detectar_fraude_pedido"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  pedidos_pend integer;
BEGIN
  IF NEW.cliente_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO pedidos_pend
  FROM public.pedidos
  WHERE cliente_id = NEW.cliente_id
    AND estado = 'pendiente'
    AND created_at >= (now() - interval '24 hours');

  IF pedidos_pend >= 5 THEN
    UPDATE public.clientes SET bloqueado = true WHERE id = NEW.cliente_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."detectar_fraude_pedido"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT tenant_id
  FROM public.admin_users
  WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pedido_publico"("p_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'total', p.total,
    'estado', p.estado,
    'created_at', p.created_at,
    'items', (
      SELECT json_agg(json_build_object(
        'id', pi.id,
        'nombre_producto', pi.nombre_producto,
        'talle', pi.talle,
        'cantidad', pi.cantidad,
        'precio_unitario', pi.precio_unitario
      ))
      FROM pedidos_items pi WHERE pi.pedido_id = p.id
    ),
    'tenant', json_build_object(
      'nombre', t.nombre,
      'cbu', t.cbu,
      'alias_bancario', t.alias_bancario,
      'banco', t.banco,
      'titular_cuenta', t.titular_cuenta,
      'whatsapp', t.whatsapp,
      'plan', t.plan
    )
  ) INTO v_result
  FROM pedidos p
  JOIN tenants t ON t.id = p.tenant_id
  WHERE p.id = p_id;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_pedido_publico"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_webmaster"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = (SELECT auth.uid())
      AND role = 'webmaster'
  );
$$;


ALTER FUNCTION "public"."is_webmaster"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_estado text;
BEGIN
  IF p_token IS NULL OR p_token = '' THEN
    RAISE EXCEPTION 'TOKEN_INVALIDO';
  END IF;

  SELECT estado INTO v_estado FROM pedidos
  WHERE id = p_pedido_id AND token_seguimiento = p_token
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'TOKEN_INVALIDO'; END IF;

  IF v_estado = 'entregado' THEN
    RETURN jsonb_build_object('estado', 'entregado', 'ya_estaba', true);
  END IF;
  IF v_estado <> 'en_camino' THEN RAISE EXCEPTION 'ESTADO_INVALIDO'; END IF;

  UPDATE pedidos SET estado = 'entregado' WHERE id = p_pedido_id;
  -- no conservar la última ubicación del repartidor
  DELETE FROM delivery_tracking WHERE pedido_id = p_pedido_id;

  RETURN jsonb_build_object('estado', 'entregado', 'ya_estaba', false);
END;
$$;


ALTER FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_cambio_estado_pedido"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_transicion_valida boolean;
  v_uid uuid := auth.uid();
  v_notas text := TG_ARGV[0];
BEGIN
  IF NEW.estado IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pedidos_historial (
      pedido_id, tenant_id, estado_anterior,
      estado_nuevo, changed_by, origen, notas
    ) VALUES (
      NEW.id, NEW.tenant_id, NULL,
      NEW.estado, v_uid,
      CASE WHEN v_uid IS NULL THEN 'sistema' ELSE 'cliente' END,
      NULL
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
    WHERE t.desde = OLD.estado AND t.hacia = NEW.estado
  ) INTO v_transicion_valida;

  IF OLD.estado IS NOT NULL AND NOT v_transicion_valida THEN
    RAISE EXCEPTION 'Transición de estado inválida: % → %',
      OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.pedidos_historial (
    pedido_id, tenant_id, estado_anterior,
    estado_nuevo, changed_by, origen, notas
  ) VALUES (
    NEW.id, NEW.tenant_id, OLD.estado,
    NEW.estado, v_uid,
    CASE WHEN v_uid IS NULL THEN 'sistema' ELSE 'admin' END,
    current_setting('app.pedido_notas', true)
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."registrar_cambio_estado_pedido"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text" DEFAULT NULL::"text", "p_direccion" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  v_nombre     text := left(trim(coalesce(p_nombre, '')), 100);
  v_cp         text := regexp_replace(coalesce(p_codigo_postal, ''), '\D', '', 'g');
  v_dir        text := nullif(left(trim(coalesce(p_direccion, '')), 200), '');
  v_whatsapp   text;
  v_cliente_id uuid;
  v_items      jsonb;
  v_invalidas  integer;
  v_sin_stock  integer;
  v_subtotal   numeric;
  v_zonas      integer;
  v_coinciden  integer;
  v_zona_id    uuid;
  v_zona       public.zonas_envio%ROWTYPE;
  v_metodo     text;
  v_costo      numeric := 0;
  v_usa_envio  boolean := false;
  v_pedido_id  uuid;
  v_token      text;
BEGIN
  IF length(v_nombre) < 2 THEN
    RAISE EXCEPTION 'NOMBRE_INVALIDO';
  END IF;

  SELECT t.whatsapp INTO v_whatsapp
  FROM tenants t WHERE t.id = p_tenant_id AND t.activo = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TENANT_INVALIDO';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'CARRITO_INVALIDO';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'CARRITO_INVALIDO';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) e
    WHERE NOT coalesce((e->>'cantidad') ~ '^[1-9][0-9]?$', false)
       OR NOT coalesce((e->>'producto_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false)
  ) THEN
    RAISE EXCEPTION 'CARRITO_INVALIDO';
  END IF;

  -- Precios, stock y pertenencia al tenant: todo desde la base
  WITH entrada AS (
    SELECT (e->>'producto_id')::uuid AS producto_id,
           coalesce(nullif(trim(e->>'talle'), ''), 'Único') AS talle,
           (e->>'cantidad')::integer AS cantidad
    FROM jsonb_array_elements(p_items) e
  ), agrupado AS (
    SELECT producto_id, talle, sum(cantidad)::integer AS cantidad
    FROM entrada GROUP BY producto_id, talle
  )
  SELECT
    count(*) FILTER (WHERE p.id IS NULL OR v.id IS NULL OR g.cantidad > 99),
    count(*) FILTER (WHERE v.id IS NOT NULL AND v.stock < g.cantidad),
    coalesce(sum(p.precio * g.cantidad), 0),
    jsonb_agg(jsonb_build_object(
      'producto_id', g.producto_id, 'variante_id', v.id,
      'nombre', p.nombre, 'talle', g.talle,
      'cantidad', g.cantidad, 'precio', p.precio))
  INTO v_invalidas, v_sin_stock, v_subtotal, v_items
  FROM agrupado g
  LEFT JOIN productos p ON p.id = g.producto_id AND p.tenant_id = p_tenant_id
  LEFT JOIN producto_variantes v ON v.producto_id = p.id AND v.talle = g.talle;

  IF v_invalidas > 0 THEN RAISE EXCEPTION 'PRODUCTO_NO_DISPONIBLE'; END IF;
  IF v_sin_stock > 0 THEN RAISE EXCEPTION 'SIN_STOCK'; END IF;
  IF v_subtotal <= 0 THEN RAISE EXCEPTION 'CARRITO_INVALIDO'; END IF;

  -- Envío: solo si el plan lo incluye y el tenant tiene zonas activas
  IF public.tenant_tiene_feature(p_tenant_id, 'shipping_zones') THEN
    SELECT count(*) INTO v_zonas
    FROM zonas_envio z WHERE z.tenant_id = p_tenant_id AND z.activo;

    IF v_zonas > 0 THEN
      IF v_cp !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'CP_INVALIDO';
      END IF;

      SELECT count(*), (array_agg(z.id))[1] INTO v_coinciden, v_zona_id
      FROM zonas_envio z
      WHERE z.tenant_id = p_tenant_id AND z.activo
        AND (z.codigo_postal_desde IS NULL OR z.codigo_postal_desde <= v_cp)
        AND (z.codigo_postal_hasta IS NULL OR v_cp <= z.codigo_postal_hasta);

      IF v_coinciden = 0 THEN RAISE EXCEPTION 'SIN_COBERTURA'; END IF;
      IF v_coinciden > 1 THEN RAISE EXCEPTION 'ZONAS_SOLAPADAS'; END IF;

      SELECT * INTO v_zona FROM zonas_envio WHERE id = v_zona_id;
      v_usa_envio := true;
      v_metodo := v_zona.metodo;

      IF v_zona.metodo = 'retiro' THEN
        v_costo := 0;
      ELSIF v_zona.minimo_envio_gratis IS NOT NULL
            AND v_subtotal >= v_zona.minimo_envio_gratis THEN
        v_costo := 0;
      ELSE
        v_costo := v_zona.costo;
      END IF;
    END IF;
  END IF;

  -- Cliente (lanza "Cliente bloqueado..." si corresponde)
  v_cliente_id := public.crear_cliente_checkout(v_nombre, p_telefono, p_tenant_id);

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  INSERT INTO pedidos (
    cliente_id, tenant_id, estado, total, costo_envio, metodo_envio,
    zona_envio_id, codigo_postal, direccion_entrega, nombre_contacto, token_seguimiento
  ) VALUES (
    v_cliente_id, p_tenant_id, 'pendiente', v_subtotal + v_costo, v_costo, v_metodo,
    v_zona_id,
    CASE WHEN v_usa_envio THEN v_cp END,
    CASE WHEN v_usa_envio THEN v_dir END,
    v_nombre, v_token
  ) RETURNING id INTO v_pedido_id;

  INSERT INTO pedidos_items (
    pedido_id, producto_id, variante_id, nombre_producto, talle, cantidad, precio_unitario
  )
  SELECT v_pedido_id, (i->>'producto_id')::uuid, (i->>'variante_id')::uuid,
         i->>'nombre', i->>'talle', (i->>'cantidad')::integer, (i->>'precio')::numeric
  FROM jsonb_array_elements(v_items) i;

  RETURN jsonb_build_object(
    'pedido_id', v_pedido_id,
    'token', v_token,
    'subtotal', v_subtotal,
    'costo_envio', v_costo,
    'total', v_subtotal + v_costo,
    'metodo_envio', v_metodo,
    'whatsapp', v_whatsapp,
    'items', v_items
  );
END;
$_$;


ALTER FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sincronizar_stock_producto"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.productos
  SET stock = (
    SELECT COALESCE(SUM(stock), 0)
    FROM public.producto_variantes
    WHERE producto_id = COALESCE(NEW.producto_id, OLD.producto_id)
  )
  WHERE id = COALESCE(NEW.producto_id, OLD.producto_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sincronizar_stock_producto"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "whatsapp" "text",
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "tenant_id" "uuid",
    CONSTRAINT "admin_requires_tenant" CHECK ((("role" = 'webmaster'::"text") OR ("tenant_id" IS NOT NULL))),
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['webmaster'::"text", 'admin'::"text"]))),
    CONSTRAINT "webmaster_no_tenant" CHECK ((("role" <> 'webmaster'::"text") OR ("tenant_id" IS NULL)))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "padre_id" "uuid",
    "es_preset" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "nombre_completo" "text" NOT NULL,
    "telefono" "text" NOT NULL,
    "email" "text",
    "estado" "text" DEFAULT 'verificado'::"text",
    "total_gastado" numeric(12,2) DEFAULT 0.00,
    "cantidad_pedidos" integer DEFAULT 0,
    "notas" "text",
    "tenant_id" "uuid" NOT NULL,
    "bloqueado" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "delivery_tracking_lat_check" CHECK ((("lat" >= ('-90'::integer)::double precision) AND ("lat" <= (90)::double precision))),
    CONSTRAINT "delivery_tracking_lng_check" CHECK ((("lng" >= ('-180'::integer)::double precision) AND ("lng" <= (180)::double precision)))
);


ALTER TABLE "public"."delivery_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."delivery_tracking" IS 'Última posición conocida del repartidor. Solo escribible vía RPC con token.';



CREATE TABLE IF NOT EXISTS "public"."lista_espera" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "variante_id" "uuid",
    "email" "text",
    "telefono" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lista_espera" OWNER TO "postgres";


COMMENT ON TABLE "public"."lista_espera" IS 'Almacena registros de clientes interesados en productos agotados.';



CREATE TABLE IF NOT EXISTS "public"."pedidos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cliente_id" "uuid",
    "estado" "text" DEFAULT 'pendiente'::"text",
    "total" numeric(12,2) NOT NULL,
    "comprobante_url" "text",
    "tenant_id" "uuid" NOT NULL,
    "comprobante_numero" "text",
    "metodo_envio" "text",
    "zona_envio_id" "uuid",
    "costo_envio" numeric(12,2) DEFAULT 0 NOT NULL,
    "codigo_postal" "text",
    "direccion_entrega" "text",
    "token_seguimiento" "text",
    "nombre_contacto" "text",
    CONSTRAINT "pedidos_estado_check" CHECK ((("estado" IS NULL) OR ("estado" = ANY (ARRAY['pendiente'::"text", 'confirmado'::"text", 'preparando'::"text", 'en_camino'::"text", 'entregado'::"text", 'cancelado'::"text"])))),
    CONSTRAINT "pedidos_metodo_envio_check" CHECK ((("metodo_envio" IS NULL) OR ("metodo_envio" = ANY (ARRAY['retiro'::"text", 'mensajeria_local'::"text", 'correo'::"text"]))))
);


ALTER TABLE "public"."pedidos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pedidos_historial" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "estado_anterior" "text",
    "estado_nuevo" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "uuid",
    "origen" "text" DEFAULT 'sistema'::"text" NOT NULL,
    "notas" "text",
    CONSTRAINT "pedidos_historial_estado_nuevo_check" CHECK (("estado_nuevo" = ANY (ARRAY['pendiente'::"text", 'confirmado'::"text", 'preparando'::"text", 'en_camino'::"text", 'entregado'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "pedidos_historial_origen_check" CHECK (("origen" = ANY (ARRAY['sistema'::"text", 'admin'::"text", 'cliente'::"text"])))
);


ALTER TABLE "public"."pedidos_historial" OWNER TO "postgres";


COMMENT ON TABLE "public"."pedidos_historial" IS 'Auditoría append-only de cambios de estado de pedidos.';



CREATE TABLE IF NOT EXISTS "public"."pedidos_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid",
    "producto_id" "uuid",
    "nombre_producto" "text" NOT NULL,
    "talle" "text",
    "cantidad" integer NOT NULL,
    "precio_unitario" numeric(12,2) NOT NULL,
    "variante_id" "uuid"
);


ALTER TABLE "public"."pedidos_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_features" (
    "plan" "text" NOT NULL,
    "feature_key" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "plan_features_plan_check" CHECK (("plan" = ANY (ARRAY['basico'::"text", 'premium'::"text", 'escala'::"text"])))
);


ALTER TABLE "public"."plan_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."producto_variantes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "talle" "text" NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "sku" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."producto_variantes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."productos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "precio" numeric DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "talles_disponibles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "imagen_url" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "codigo_corto" "text",
    "galeria_imagenes" "text"[],
    "tenant_id" "uuid" NOT NULL,
    "categoria_id" "uuid"
);


ALTER TABLE "public"."productos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "plan" "text" DEFAULT 'basico'::"text" NOT NULL,
    "whatsapp" "text",
    "email" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cbu" "text",
    "alias_bancario" "text",
    "banco" "text",
    "titular_cuenta" "text",
    "meta_pixel_id" "text",
    "instagram_usuario" "text",
    CONSTRAINT "tenants_plan_check" CHECK (("plan" = ANY (ARRAY['basico'::"text", 'premium'::"text", 'escala'::"text"])))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zonas_envio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "codigo_postal_desde" "text",
    "codigo_postal_hasta" "text",
    "metodo" "text" NOT NULL,
    "costo" numeric(12,2) DEFAULT 0 NOT NULL,
    "minimo_envio_gratis" numeric(12,2),
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "zonas_envio_costo_check" CHECK (("costo" >= (0)::numeric)),
    CONSTRAINT "zonas_envio_cp_order_check" CHECK ((("codigo_postal_desde" IS NULL) OR ("codigo_postal_hasta" IS NULL) OR ("codigo_postal_desde" <= "codigo_postal_hasta"))),
    CONSTRAINT "zonas_envio_metodo_check" CHECK (("metodo" = ANY (ARRAY['retiro'::"text", 'mensajeria_local'::"text", 'correo'::"text"]))),
    CONSTRAINT "zonas_envio_minimo_check" CHECK ((("minimo_envio_gratis" IS NULL) OR ("minimo_envio_gratis" >= (0)::numeric)))
);


ALTER TABLE "public"."zonas_envio" OWNER TO "postgres";


COMMENT ON TABLE "public"."zonas_envio" IS 'Zonas de envío por tenant: define metodo, costo y umbral de envío gratis.';



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_tracking"
    ADD CONSTRAINT "delivery_tracking_pedido_id_key" UNIQUE ("pedido_id");



ALTER TABLE ONLY "public"."delivery_tracking"
    ADD CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lista_espera"
    ADD CONSTRAINT "lista_espera_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos_historial"
    ADD CONSTRAINT "pedidos_historial_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos_items"
    ADD CONSTRAINT "pedidos_items_pedido_producto_talle_key" UNIQUE ("pedido_id", "producto_id", "talle");



ALTER TABLE ONLY "public"."pedidos_items"
    ADD CONSTRAINT "pedidos_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_pkey" PRIMARY KEY ("plan", "feature_key");



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variante_unica" UNIQUE ("producto_id", "talle");



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_codigo_corto_key" UNIQUE ("codigo_corto");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."zonas_envio"
    ADD CONSTRAINT "zonas_envio_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "categoria_nombre_tenant_unique" ON "public"."categorias" USING "btree" ("tenant_id", "nombre", "padre_id");



CREATE UNIQUE INDEX "clientes_tenant_telefono_unique" ON "public"."clientes" USING "btree" ("tenant_id", "telefono");



CREATE INDEX "idx_admin_users_role" ON "public"."admin_users" USING "btree" ("role");



CREATE INDEX "idx_admin_users_tenant" ON "public"."admin_users" USING "btree" ("tenant_id");



CREATE INDEX "idx_categorias_padre_id" ON "public"."categorias" USING "btree" ("padre_id");



CREATE INDEX "idx_clientes_bloqueado_tenant" ON "public"."clientes" USING "btree" ("tenant_id", "bloqueado") WHERE ("bloqueado" = true);



CREATE INDEX "idx_clientes_tenant" ON "public"."clientes" USING "btree" ("tenant_id");



CREATE INDEX "idx_clientes_total_gastado_tenant" ON "public"."clientes" USING "btree" ("tenant_id", "total_gastado" DESC);



CREATE INDEX "idx_delivery_tracking_tenant" ON "public"."delivery_tracking" USING "btree" ("tenant_id");



CREATE INDEX "idx_lista_espera_created_at" ON "public"."lista_espera" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lista_espera_producto_id" ON "public"."lista_espera" USING "btree" ("producto_id");



CREATE INDEX "idx_lista_espera_tenant_id" ON "public"."lista_espera" USING "btree" ("tenant_id");



CREATE INDEX "idx_pedidos_cliente_id" ON "public"."pedidos" USING "btree" ("cliente_id");



CREATE INDEX "idx_pedidos_historial_pedido" ON "public"."pedidos_historial" USING "btree" ("pedido_id", "changed_at" DESC);



CREATE INDEX "idx_pedidos_historial_tenant" ON "public"."pedidos_historial" USING "btree" ("tenant_id", "changed_at" DESC);



CREATE INDEX "idx_pedidos_items_prod" ON "public"."pedidos_items" USING "btree" ("producto_id");



CREATE INDEX "idx_pedidos_items_var" ON "public"."pedidos_items" USING "btree" ("variante_id");



CREATE INDEX "idx_pedidos_tenant_id" ON "public"."pedidos" USING "btree" ("tenant_id");



CREATE UNIQUE INDEX "idx_pedidos_token_seguimiento" ON "public"."pedidos" USING "btree" ("token_seguimiento") WHERE ("token_seguimiento" IS NOT NULL);



CREATE INDEX "idx_pedidos_zona_envio" ON "public"."pedidos" USING "btree" ("zona_envio_id") WHERE ("zona_envio_id" IS NOT NULL);



CREATE INDEX "idx_productos_tenant" ON "public"."productos" USING "btree" ("tenant_id");



CREATE INDEX "idx_zonas_envio_tenant" ON "public"."zonas_envio" USING "btree" ("tenant_id", "activo");



CREATE OR REPLACE TRIGGER "trg_detectar_fraude_pedido" AFTER INSERT ON "public"."pedidos" FOR EACH ROW EXECUTE FUNCTION "public"."detectar_fraude_pedido"();



CREATE OR REPLACE TRIGGER "trigger_estado_pedido_insert" AFTER INSERT ON "public"."pedidos" FOR EACH ROW WHEN (("new"."estado" IS NOT NULL)) EXECUTE FUNCTION "public"."registrar_cambio_estado_pedido"();



CREATE OR REPLACE TRIGGER "trigger_estado_pedido_update" AFTER UPDATE OF "estado" ON "public"."pedidos" FOR EACH ROW WHEN ((("old"."estado" IS DISTINCT FROM "new"."estado") AND ("new"."estado" IS NOT NULL))) EXECUTE FUNCTION "public"."registrar_cambio_estado_pedido"();



CREATE OR REPLACE TRIGGER "trigger_sincronizar_stock" AFTER INSERT OR DELETE OR UPDATE OF "stock" ON "public"."producto_variantes" FOR EACH ROW EXECUTE FUNCTION "public"."sincronizar_stock_producto"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "public"."categorias"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."delivery_tracking"
    ADD CONSTRAINT "delivery_tracking_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_tracking"
    ADD CONSTRAINT "delivery_tracking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lista_espera"
    ADD CONSTRAINT "fk_lista_espera_producto" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lista_espera"
    ADD CONSTRAINT "fk_lista_espera_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lista_espera"
    ADD CONSTRAINT "fk_lista_espera_variante" FOREIGN KEY ("variante_id") REFERENCES "public"."producto_variantes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedidos_historial"
    ADD CONSTRAINT "pedidos_historial_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pedidos_historial"
    ADD CONSTRAINT "pedidos_historial_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pedidos_historial"
    ADD CONSTRAINT "pedidos_historial_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pedidos_items"
    ADD CONSTRAINT "pedidos_items_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pedidos_items"
    ADD CONSTRAINT "pedidos_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."pedidos_items"
    ADD CONSTRAINT "pedidos_items_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."producto_variantes"("id");



ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_zona_envio_fkey" FOREIGN KEY ("zona_envio_id") REFERENCES "public"."zonas_envio"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."zonas_envio"
    ADD CONSTRAINT "zonas_envio_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "admin_delete_lista_espera" ON "public"."lista_espera" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."id" = "auth"."uid"()) AND ("admin_users"."tenant_id" = "lista_espera"."tenant_id")))));



CREATE POLICY "admin_select_lista_espera" ON "public"."lista_espera" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."id" = "auth"."uid"()) AND ("admin_users"."tenant_id" = "lista_espera"."tenant_id")))));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_all_webmaster" ON "public"."admin_users" TO "authenticated" USING (( SELECT "public"."is_webmaster"() AS "is_webmaster")) WITH CHECK (( SELECT "public"."is_webmaster"() AS "is_webmaster"));



CREATE POLICY "admin_users_select_self" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_users_update_self" ON "public"."admin_users" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role" = ( SELECT "admin_users_1"."role"
   FROM "public"."admin_users" "admin_users_1"
  WHERE ("admin_users_1"."id" = ( SELECT "auth"."uid"() AS "uid")))) AND (NOT ("tenant_id" IS DISTINCT FROM ( SELECT "admin_users_1"."tenant_id"
   FROM "public"."admin_users" "admin_users_1"
  WHERE ("admin_users_1"."id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_select_public" ON "public"."categorias" FOR SELECT TO "authenticated", "anon" USING (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ("tenants"."activo" = true))));



CREATE POLICY "categorias_write_admin" ON "public"."categorias" TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_select_admin" ON "public"."clientes" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "clientes_update_admin" ON "public"."clientes" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



ALTER TABLE "public"."delivery_tracking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delivery_tracking_delete_admin" ON "public"."delivery_tracking" FOR DELETE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "delivery_tracking_select_admin" ON "public"."delivery_tracking" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "delivery_tracking_update_admin" ON "public"."delivery_tracking" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "historial_delete_webmaster" ON "public"."pedidos_historial" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_webmaster"() AS "is_webmaster"));



CREATE POLICY "historial_insert_admin" ON "public"."pedidos_historial" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "historial_select_admin" ON "public"."pedidos_historial" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "historial_update_admin" ON "public"."pedidos_historial" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



ALTER TABLE "public"."lista_espera" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pedidos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pedidos_historial" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pedidos_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pedidos_items_select_admin" ON "public"."pedidos_items" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("pedido_id" IN ( SELECT "pedidos"."id"
   FROM "public"."pedidos"
  WHERE ("pedidos"."tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))))));



CREATE POLICY "pedidos_items_update_admin" ON "public"."pedidos_items" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("pedido_id" IN ( SELECT "pedidos"."id"
   FROM "public"."pedidos"
  WHERE ("pedidos"."tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))))));



CREATE POLICY "pedidos_select_admin" ON "public"."pedidos" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "pedidos_update_admin" ON "public"."pedidos" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



ALTER TABLE "public"."plan_features" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plan_features_all_webmaster" ON "public"."plan_features" TO "authenticated" USING (( SELECT "public"."is_webmaster"() AS "is_webmaster")) WITH CHECK (( SELECT "public"."is_webmaster"() AS "is_webmaster"));



CREATE POLICY "plan_features_select_public" ON "public"."plan_features" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."producto_variantes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "productos_select_public" ON "public"."productos" FOR SELECT TO "authenticated", "anon" USING (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ("tenants"."activo" = true))));



CREATE POLICY "productos_write_admin" ON "public"."productos" TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_all_webmaster" ON "public"."tenants" TO "authenticated" USING (( SELECT "public"."is_webmaster"() AS "is_webmaster")) WITH CHECK (( SELECT "public"."is_webmaster"() AS "is_webmaster"));



CREATE POLICY "tenants_select_public" ON "public"."tenants" FOR SELECT TO "authenticated", "anon" USING (("activo" = true));



CREATE POLICY "tenants_update_admin" ON "public"."tenants" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))) WITH CHECK (("id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")));



CREATE POLICY "variantes_select_public" ON "public"."producto_variantes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "variantes_write_admin" ON "public"."producto_variantes" TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("producto_id" IN ( SELECT "productos"."id"
   FROM "public"."productos"
  WHERE ("productos"."tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("producto_id" IN ( SELECT "productos"."id"
   FROM "public"."productos"
  WHERE ("productos"."tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))))));



ALTER TABLE "public"."zonas_envio" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "zonas_envio_delete_admin" ON "public"."zonas_envio" FOR DELETE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "zonas_envio_insert_admin" ON "public"."zonas_envio" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));



CREATE POLICY "zonas_envio_select_public" ON "public"."zonas_envio" FOR SELECT TO "authenticated", "anon" USING (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ("tenants"."activo" = true))));



CREATE POLICY "zonas_envio_update_admin" ON "public"."zonas_envio" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id")))) WITH CHECK ((( SELECT "public"."is_webmaster"() AS "is_webmaster") OR ("tenant_id" = ( SELECT "public"."get_my_tenant_id"() AS "get_my_tenant_id"))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."categorias";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clientes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."delivery_tracking";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."lista_espera";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pedidos";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pedidos_historial";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pedidos_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."producto_variantes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."productos";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tenants";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."confirmar_pedido_transaccion"("p_pedido_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirmar_pedido_transaccion"("p_pedido_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."confirmar_pedido_transaccion"("p_pedido_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."crear_cliente_checkout"("p_nombre_completo" "text", "p_telefono" "text", "p_tenant_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."crear_cliente_checkout"("p_nombre_completo" "text", "p_telefono" "text", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."crear_lista_espera"("p_tenant_id" "uuid", "p_producto_id" "uuid", "p_telefono" "text", "p_variante_id" "uuid", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."crear_lista_espera"("p_tenant_id" "uuid", "p_producto_id" "uuid", "p_telefono" "text", "p_variante_id" "uuid", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."crear_lista_espera"("p_tenant_id" "uuid", "p_producto_id" "uuid", "p_telefono" "text", "p_variante_id" "uuid", "p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."crear_pedido_checkout"("p_cliente_id" "uuid", "p_total" numeric, "p_tenant_id" "uuid", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion_entrega" "text", "p_metodo_envio" "text", "p_zona_envio_id" "uuid", "p_costo_envio" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."crear_pedido_checkout"("p_cliente_id" "uuid", "p_total" numeric, "p_tenant_id" "uuid", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion_entrega" "text", "p_metodo_envio" "text", "p_zona_envio_id" "uuid", "p_costo_envio" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."detectar_fraude_pedido"() TO "anon";
GRANT ALL ON FUNCTION "public"."detectar_fraude_pedido"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detectar_fraude_pedido"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_delivery_position"("p_pedido_id" "uuid", "p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pedido_publico"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pedido_publico"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pedido_publico"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pedido_tracking"("p_pedido_id" "uuid", "p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_webmaster"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_webmaster"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_webmaster"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."marcar_entregado"("p_pedido_id" "uuid", "p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_cambio_estado_pedido"() TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_cambio_estado_pedido"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_cambio_estado_pedido"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_pedido_checkout"("p_tenant_id" "uuid", "p_nombre" "text", "p_telefono" "text", "p_items" "jsonb", "p_codigo_postal" "text", "p_direccion" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sincronizar_stock_producto"() TO "anon";
GRANT ALL ON FUNCTION "public"."sincronizar_stock_producto"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sincronizar_stock_producto"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tenant_tiene_feature"("p_tenant_id" "uuid", "p_feature_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_delivery_position"("p_pedido_id" "uuid", "p_lat" double precision, "p_lng" double precision, "p_token" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."categorias" TO "anon";
GRANT ALL ON TABLE "public"."categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_tracking" TO "anon";
GRANT ALL ON TABLE "public"."delivery_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."lista_espera" TO "anon";
GRANT ALL ON TABLE "public"."lista_espera" TO "authenticated";
GRANT ALL ON TABLE "public"."lista_espera" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos" TO "anon";
GRANT ALL ON TABLE "public"."pedidos" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos_historial" TO "anon";
GRANT ALL ON TABLE "public"."pedidos_historial" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos_historial" TO "service_role";



GRANT ALL ON TABLE "public"."pedidos_items" TO "anon";
GRANT ALL ON TABLE "public"."pedidos_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos_items" TO "service_role";



GRANT ALL ON TABLE "public"."plan_features" TO "anon";
GRANT ALL ON TABLE "public"."plan_features" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_features" TO "service_role";



GRANT ALL ON TABLE "public"."producto_variantes" TO "anon";
GRANT ALL ON TABLE "public"."producto_variantes" TO "authenticated";
GRANT ALL ON TABLE "public"."producto_variantes" TO "service_role";



GRANT ALL ON TABLE "public"."productos" TO "anon";
GRANT ALL ON TABLE "public"."productos" TO "authenticated";
GRANT ALL ON TABLE "public"."productos" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."zonas_envio" TO "anon";
GRANT ALL ON TABLE "public"."zonas_envio" TO "authenticated";
GRANT ALL ON TABLE "public"."zonas_envio" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































