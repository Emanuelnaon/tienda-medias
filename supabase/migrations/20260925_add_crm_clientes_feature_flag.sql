-- ============================================================================
-- Sprint 7.4 CRM Base de Clientes - Feature Flag + Performance Index
-- ----------------------------------------------------------------------------
-- Agrega el feature key `crm_clientes` a `plan_features` para ambos tiers
-- (basico y premium) y crea un índice compuesto para acelerar el ORDER BY
-- por `total_gastado DESC` en la vista de lista de clientes.
--
-- Verificado vía MCP antes de aplicar:
--   * plan_features ya tiene RLS ENABLED
--   * Existe política `plan_features_select_public` (USING(true) para authenticated)
--   * No se requiere ALTER TABLE sobre `clientes` (columnas ya existen)
-- ============================================================================

-- 1. Feature flag: crm_clientes (ambos tiers)
INSERT INTO public.plan_features (feature_key, plan, enabled)
VALUES
    ('crm_clientes', 'basico', TRUE),
    ('crm_clientes', 'premium', TRUE)
ON CONFLICT DO NOTHING;

-- 2. Índice compuesto para ORDER BY total_gastado DESC filtrado por tenant
CREATE INDEX IF NOT EXISTS idx_clientes_total_gastado_tenant
    ON public.clientes (tenant_id, total_gastado DESC);
