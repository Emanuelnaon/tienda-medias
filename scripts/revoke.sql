REVOKE ALL ON FUNCTION public.crear_pedido_checkout(uuid, numeric, uuid, jsonb, text, text, text, uuid, numeric)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.crear_cliente_checkout(text, text, uuid)
  FROM PUBLIC, anon, authenticated;