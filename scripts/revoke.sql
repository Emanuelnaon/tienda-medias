REVOKE ALL ON FUNCTION public.crear_pedido_checkout(uuid, numeric, uuid, jsonb, text, text, text, uuid, numeric)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.crear_cliente_checkout(text, text, uuid)
  FROM PUBLIC, anon, authenticated;

-- Rollback manual: descomentar solo si se decide restaurar el acceso.
-- ADVERTENCIA: esto vuelve a permitir la ejecución de estas funciones
-- a todos los roles, incluido anon; validar su seguridad antes de usarlo.
-- GRANT EXECUTE ON FUNCTION public.crear_pedido_checkout(uuid, numeric, uuid, jsonb, text, text, text, uuid, numeric)
--   TO PUBLIC, anon, authenticated;
--
-- GRANT EXECUTE ON FUNCTION public.crear_cliente_checkout(text, text, uuid)
--   TO PUBLIC, anon, authenticated;
