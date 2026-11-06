# Plan: Sprint 9 — Social Commerce + Anti-fraude

**Feature:** QR Transferencias 3.0 · Botones de compartir · Feed Instagram · Meta Pixel · Anti-fraude
**Sprint:** 9
**SSOT de tipos:** `src/types/supabase.ts`

> **Aviso sobre verificación MCP:** la MCP de Supabase responde `Unauthorized` en este entorno (`SUPABASE_ACCESS_TOKEN` ausente). El Executor DEBE verificar el schema real vía `information_schema.columns` / `pg_catalog` antes de aplicar cualquier DDL, y regenerar `src/types/supabase.ts` después de cada migración. Todo lo que sigue sobre el estado actual proviene del SSOT regenerado y del código leído en el workspace.

---

## 0. Estado actual verificado

| Objeto | Estado real | Ubicación |
|--------|-------------|-----------|
| `tenants` | Tiene `meta_pixel_id` desde Sprint 8.1. **No** tiene `instagram_usuario`. | `supabase.ts:541-543` |
| `clientes` | `id, cantidad_pedidos, created_at, email, estado, nombre_completo, notas, telefono, tenant_id, total_gastado`. **No** tiene `bloqueado`. | `supabase.ts:94-106` |
| `pedidos` | `cliente_id, total, created_at, estado, tenant_id, ...`. | `supabase.ts:236-251` |
| `plan_features` | Columns: `feature_key, plan, enabled, created_at`. RLS habilitado. | `supabase.ts:414-434` |
| `GeneradorQrPago.tsx` | Payload actual: `CBU:${cbu}|ALIAS:${alias}|MONTO:${total}`. No recibe `titularCuenta`. | `checkout-confirmacion/components/GeneradorQrPago.tsx:14-19` |
| `/pedido/[id]/page.tsx` | Pasa `aliasBancario`, `cbu`, `total` a `GeneradorQrPago`. | `app/pedido/[id]/page.tsx:125-129` |
| `app/page.tsx` | Home actual: solo `<GrillaProductos>`. | `app/page.tsx` |
| `app/producto/[id]/page.tsx` | Server Component, fetch de producto. No tiene botones de share. | `app/producto/[id]/page.tsx` |
| `FormularioCheckout.tsx` | Client Component. Botón "Finaliza compra". | `carrito/components/FormularioCheckout.tsx` |
| `useCarritoStore` (Zustand) | `agregarItem`, `removerItem`, `actualizarCantidad`, `limpiarCarrito`. Persistido. | `carrito/store.ts` |
| `clientesActions.ts` | `listarClientes`, `obtenerClientePorId`, `actualizarNotasCliente`. | `admin/actions/clientesActions.ts` |
| `crear_cliente_checkout` RPC | Args: `p_nombre_completo, p_telefono, p_tenant_id`. Returns: uuid. | `supabase.ts:641-648` |
| Helper `tieneFeature()` | Requiere sesión de admin (verificaAdministrador). **No sirve para páginas públicas.** | `lib/auth/entitlements.ts:3` |
| RPC pública `tenant_tiene_feature` | Ya existe: `RETURN boolean`. Usada por `consultarCoberturaEnvio`. | `supabase.ts:684-687`, `logistica/api/queries.ts:49-55` |
| Feature flags existentes | `payment_confirmation`, `shipping_zones`, `crm_clientes`. | Migrations |
| `/admin/configuracion` | Ya muestra `FormularioDatosBancarios` (incluye `meta_pixel_id`) y zonas de envío. | `app/admin/configuracion/page.tsx` |
| `/admin/clientes/[id]` | Client Component con datos del cliente, notas, historial de pedidos. No tiene toggle de bloqueo. | `app/admin/clientes/[id]/page.tsx` |
| `app/layout.tsx` | Root layout. Incluye `GoogleAnalytics` condicional. No tiene Meta Pixel. | `app/layout.tsx` |
| Migraciones de refs | Patrón: idempotent (`IF NOT EXISTS`, `DO $$ IF NOT EXISTS`), RLS + 4 policies granulares, comentarios. | `20261004_sprint82_zonas_envio.sql` |

### Matriz de planes (verificado desde `plan_features`)

| Feature key | Catalogo (basico) | E-commerce (premium) | Escala (escala) |
|-------------|-------------------|----------------------|-----------------|
| `payment_confirmation` | ✗ | ✓ | ✓ |
| `shipping_zones` | ✗ | ✓ | ✓ |
| `crm_clientes` | ✓ | ✓ | ✓ |
| `instagram_feed` (9.3) | ✗ | ✓ | ✓ |
| `meta_pixel` (9.4) | ✗ | ✓ | ✓ |

> **Nota de naming:** el spec/usuario menciona "E-commerce" y "Escala" como nombres de tier. El código DB usa `'premium'` y `'escala'` (ver `plan_features`). Las migraciones insertan con esos valores.

---

## FEATURE 9.1 — QR Transferencias 3.0 estándar Coelsa

**Tier:** todos los planes (Catálogo, E-commerce, Escala)
**Feature flag:** ninguno
**Dependencias nuevas:** ninguna

### Especificación del formato

Formato estándar Coelsa del BCRA:

```
NOMBRE:${titular_cuenta}|CBU:${cbu}|ALIAS:${alias}
|MONTO:${total}|CONCEPTO:${numero_orden}
```

- `NOMBRE` → `tenants.titular_cuenta`
- `CBU` → `tenants.cbu`
- `ALIAS` → `tenants.alias_bancario`
- `MONTO` → total del pedido
- `CONCEPTO` → número de orden (primeros 8 chars del UUID `pedidos.id`)

### Archivos a modificar

1. **`src/features/checkout-confirmacion/components/GeneradorQrPago.tsx`**
   - Agregar prop `readonly titularCuenta: string | null`
   - Reemplazar `payload` con el nuevo formato Coelsa
   - El newline `\n` separa los dos renglones (compatible con escáneres bancarios Coelsa)

2. **`app/pedido/[id]/page.tsx`** (línea 125-129)
   - Agregar `titularCuenta={pedido.tenant.titular_cuenta}` al `<GeneradorQrPago>`

3. **`src/features/checkout-confirmacion/components/EnlacesBancarios.tsx`** (línea 14-16)
   - La función `payloadPago` también usa el formato viejo. Actualizar al mismo formato Coelsa para consistencia entre QR y deep-links.

### Criterios de aceptación

| ID | Criterio verificable |
|----|----------------------|
| QR.1 | El string pasado a `qrcode.toDataURL()` contiene `NOMBRE:`, `CBU:`, `ALIAS:`, `MONTO:`, `CONCEPTO:` en el orden especificado. |
| QR.2 | El `CONCEPTO` coincide con los primeros 8 caracteres del UUID del pedido (`pedido.id.split('-')[0]`). |
| QR.3 | El QR se genera en `/pedido/[id]` con los datos del tenant correctamente. |
| QR.4 | El formato incluye el newline `\n` entre los dos renglones (verificable con `payload.includes('\n')`). |

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| R-QR.1 | Los escáneres viejos pueden no parsear el newline. Documentado como Coelsa estándar; si hay reclamos, rollback es un 1-liner. |

---

## FEATURE 9.2 — Botones de compartir en ficha de producto

**Tier:** todos los planes
**Feature flag:** ninguno
**Dependencias nuevas:** ninguna

### Archivos a modificar

1. **`app/producto/[id]/page.tsx`**
   - Agregar un nuevo `<section>` con dos botones:
     - **WhatsApp:** `wa.me/?text=...` con nombre del producto, precio y URL canónica
     - **Copiar link:** usa `navigator.clipboard.writeText(window.location.href)` con toast de confirmación
   - El nombre del producto y el precio ya están disponibles como `producto.nombre` y `producto.precio`

### Criterios de aceptación

| ID | Criterio verificable |
|----|----------------------|
| SH.1 | Al hacer clic en "Compartir WhatsApp", se abre `wa.me` con el nombre, precio y URL del producto en el texto. |
| SH.2 | Al hacer clic en "Copiar link", se copia la URL canónica del producto al portapapeles y aparece un toast "Link copiado". |
| SH.2 | La URL compartida es `https://${host}/producto/${id}` (no relativa). |
| SH.3 | Los botones son Client Components (marcados `'use client'` o dentro de un wrapper client) para `navigator.clipboard`. |

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| R-SH.1 | `navigator.clipboard` no está disponible en algunos navegadores. Fallback: `document.execCommand('copy')`. |

---

## FEATURE 9.3 — Feed de Instagram en home

**Tier:** E-commerce (premium) y Escala (escala)
**Feature flag:** `instagram_feed`
**Dependencias nuevas:** ninguna (oEmbed público de Instagram)

### Migración SQL

```sql
-- 1. Columna instagram_usuario en tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS instagram_usuario text;

-- 2. Feature flag instagram_feed
INSERT INTO public.plan_features (feature_key, plan, enabled)
VALUES
  ('instagram_feed', 'premium', TRUE),
  ('instagram_feed', 'escala', TRUE)
ON CONFLICT DO NOTHING;
```

> **Verificar antes de aplicar:** que `tenants.instagram_usuario` no exista ya, via `SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND column_name='instagram_usuario'`.

### Arquitectura

- **Feature:** `src/features/instagram/` (nuevo, autocontenido)
  - `api/queries.ts`: `obtenerInstagramFeed(usuario: string, cantidad?: number): Promise<InstagramPost[]>` — consume `https://graph.facebook.com/v19.0/instagram-oembed?url=https://www.instagram.com/p/${shortcode}/&access_token=...` o el endpoint oEmbed público.
  - `types/index.ts`: `InstagramPost { id, media_url, permalink, caption, timestamp }`
  - `components/InstagramFeed.tsx`: Client Component, lazy load de imágenes (IntersectionObserver + `loading="lazy"`), máximo 6 posts.
  - `hooks/useInstagramFeed.ts`: fetch con manejo de errores y degraded fallback.
  - `index.ts`: contrato público.

- **Integración en home:**
  - `app/page.tsx` pasa a ser async y consulta `instagram_usuario` del tenant `default` y verifica `tenant_tiene_feature(instagram_feed)`.
  - Si feature deshabilitada o usuario no configurado → no renderiza la sección.

### Archivos a crear/modificar

**Crear:**
- `src/features/instagram/types/index.ts`
- `src/features/instagram/api/queries.ts`
- `src/features/instagram/components/InstagramFeed.tsx`
- `src/features/instagram/hooks/useInstagramFeed.ts`
- `src/features/instagram/index.ts`
- `supabase/migrations/<ts>_sprint9_instagram_feed.sql`

**Modificar:**
- `app/page.tsx` — agregar sección Instagram Feed (Server Component async, feature gateado)

### Criterios de aceptación

| ID | Criterio verificable |
|----|----------------------|
| IG.1 | `tenants.instagram_usuario` existe como `text` nullable. |
| IG.2 | `plan_features` tiene `instagram_feed` = TRUE para `premium` y `escala`. |
| IG.3 | En home, si el tenant no tiene `instagram_feed` habilitado, la sección no aparece. |
| IG.4 | Si `instagram_usuario` es NULL, la sección no aparece. |
| IG.5 | Máximo 6 posts renderizados. |
| IG.6 | Las imágenes usan `loading="lazy"` o IntersectionObserver. |
| IG.7 | Si la API de Instagram falla, la sección degrade graciosamente (no rompe la home). |

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| R-IG.1 | El oEmbed público de Instagram puede requerir `access_token`. Si la API pública falla, documentar fallback a un endpoint de terceros o embedding estático. |
| R-IG.2 | Rate limit de Instagram. Cachear en el cliente por sesión + cache server-side con cabeceras de freshness. |

---

## FEATURE 9.4 — Meta Pixel

**Tier:** E-commerce (premium) y Escala (escala)
**Feature flag:** `meta_pixel`
**Dependencias nuevas:** `@next/third-parties` (ya está en `package.json:23`). La librería `react` de Meta Pixel se carga dinámicamente.

### Migración SQL

```sql
-- 1. Feature flag meta_pixel (meta_pixel_id ya existe en tenants desde Sprint 8.1)
INSERT INTO public.plan_features (feature_key, plan, enabled)
VALUES
  ('meta_pixel', 'premium', TRUE),
  ('meta_pixel', 'escala', TRUE)
ON CONFLICT DO NOTHING;
```

### Eventos a implementar

| Evento | Trigger | Ubicación | Server-side recomendado |
|--------|---------|-----------|------------------------|
| `PageView` | Carga de página | `app/layout.tsx` (root) | Sí (critical) |
| `ViewContent` | Render de producto | `app/producto/[id]/page.tsx` | Sí |
| `AddToCart` | `agregarItem` en Zustand | `src/features/carrito/store.ts` | No (high frequency) |
| `InitiateCheckout` | Apertura de `FormularioCheckout` | `src/features/carrito/components/FormularioCheckout.tsx` | Sí |

### Arquitectura

- **Helper:** `src/features/tracking-pixel/` (nuevo feature)
  - `lib/metaPixel.ts`: función `trackPixel(event, data)` que llama a `fbq('track', event, data)` de forma segura (verifica `window.fbq` existe). También expone `initPixel(pixelId)`.
  - **Edge Function:** `supabase/functions/meta-pixel-proxy/index.ts` — endpoint server-side que reenvía eventos críticos (PageView, ViewContent, InitiateCheckout) al API de Conversiones de Meta (`POST /{pixel_id}/events`), evitando adblockers. Recibe `{ event, data, clientInfo }` desde el cliente.
  - `hooks/useMetaPixel.ts`: hook para iniciar Pixel y trackear en client components.

- **Feature gate en páginas públicas:** no se puede usar `tieneFeature()` (requiere admin). Solución: una RPC pública o un helper que lea `tenants.meta_pixel_id` condicionalmente. Patrón ya existente: `consultarCoberturaEnvio` usa `tenant_tiene_feature` RPC. Reutilizar.

### Archivos a crear/modificar

**Crear:**
- `src/features/tracking-pixel/lib/metaPixel.ts`
- `src/features/tracking-pixel/hooks/useMetaPixel.ts`
- `src/features/tracking-pixel/index.ts`
- `supabase/functions/meta-pixel-proxy/index.ts`
- `supabase/migrations/<ts>_sprint9_meta_pixel_flag.sql`

**Modificar:**
- `app/layout.tsx` — init Pixel (si `meta_pixel_id` configurado + feature activa)
- `app/producto/[id]/page.tsx` — `ViewContent` event
- `src/features/carrito/store.ts` — `trackPixel('AddToCart', ...)` en `agregarItem`
- `src/features/carrito/components/FormularioCheckout.tsx` — `InitiateCheckout` en montaje

### Criterios de aceptación

| ID | Criterio verificable |
|----|----------------------|
| MP.1 | `plan_features` tiene `meta_pixel` = TRUE para `premium` y `escala`. |
| MP.2 | Si `tenants.meta_pixel_id` es NULL, ningún pixel event se dispara. |
| MP.3 | PageView se dispara en `layout.tsx` solo si feature + pixel_id configurados. |
| MP.4 | ViewContent en `/producto/[id]` incluye `content_name`, `content_ids`, `value`, `currency: 'ARS'`. |
| MP.5 | AddToCart en Zustand `agregarItem` incluye `content_name`, `content_type: 'product'`, `value`, `currency`. |
| MP.6 | InitiateCheckout se dispara al abrir FormularioCheckout (mount). |
| MP.7 | Los eventos críticos (PageView, ViewContent, InitiateCheckout) también se envían a la Edge Function `meta-pixel-proxy` que los reenvía a Meta Conversions API. |
| MP.8 | Si el feature flag está deshabilitado, ninguna llamada al proxy ni al `fbq` se realiza. |

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| R-MP.1 | Adblockers bloquean `fbq`. La Edge Function server-side mitiga esto para eventos críticos. AddToCart puede perderse — es aceptable (no crítico). |
| R-MP.2 | La Edge Function necesita el `Meta Pixel ID` y opcionalmente un `access_token` para CAPI. Si se usa CAPI sin token, usar el modo `access_token` de app-level. |
| R-MP.3 | `window.fbq` no está definido si el script no cargó. El helper verifica existencia antes de llamar. |

---

## FEATURE 9.5 — Anti-fraude

**Tier:** todos los planes (protección básica)
**Feature flag:** ninguno (aplica a todos los planes)
**Dependencias nuevas:** ninguna

### Migración SQL

```sql
-- 1. Columna bloqueado en clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS bloqueado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_clientes_bloqueado_tenant
  ON public.clientes (tenant_id, bloqueado)
  WHERE bloqueado = true;

-- 2. Trigger: detección automática de fraude
-- Regla: mismo teléfono + 3 pedidos en < 24hs → marcar cliente como bloqueado
CREATE OR REPLACE FUNCTION public.detectar_fraude_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pedidos_24h integer;
BEGIN
  -- Solo actuar si el pedido tiene cliente_id asociado
  IF NEW.cliente_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO pedidos_24h
  FROM public.pedidos
  WHERE cliente_id = NEW.cliente_id
    AND created_at >= (now() - interval '24 hours');

  -- 3 pedidos (incluido el nuevo) en menos de 24hs
  IF pedidos_24h >= 3 THEN
    UPDATE public.clientes
    SET bloqueado = true
    WHERE id = NEW.cliente_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_detectar_fraude_pedido ON public.pedidos;
CREATE TRIGGER trg_detectar_fraude_pedido
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.detectar_fraude_pedido();
```

> **Verificar antes de aplicar:** que `clientes.bloqueado` no exista ya. El trigger se coloca como AFTER INSERT porque el `created_at` del pedido ya está poblado al momento del insert.

### Modificación de la RPC `crear_cliente_checkout`

La RPC pública `crear_cliente_checkout` debe verificar que el cliente no esté bloqueado. **Pero** `crear_cliente_checkout` crea un nuevo cliente — el bloqueo aplica a un cliente **existente** con el mismo teléfono. La verificación real debe estar en `generarCheckout.ts` o en `crear_pedido_checkout`.

**Ruta correcta:** La verificación de bloqueo debe estar en `generarCheckout.ts` (Server Action) **antes** de llamar a `crear_pedido_checkout`, chequeando si el cliente existe y está bloqueado. Además, la RPC `crear_pedido_checkout` debe re-verificar como defensa en profundidad.

#### Modificaciones:

1. **`src/features/carrito/actions/generarCheckout.ts`**
   - Antes de crear/obtener cliente, consultar `clientes` filtrando por `telefono` y `bloqueado = true`
   - Si existe → lanzar error: `'Cliente bloqueado por sospecha de fraude. Contacte a soporte.'`

2. **RPC `crear_pedido_checkout`** (modificar en DB)
   - Agregar check: si `p_cliente_id` corresponde a un cliente con `bloqueado = true`, lanzar excepción. Esta es la defensa en profundidad.

### Bloqueo manual en admin

1. **`app/admin/clientes/[id]/page.tsx`**
   - Agregar toggle/switch o botón para marcar/desmarcar `bloqueado`
   - Mostrar estado actual (bloqueado / activo)

2. **`src/features/admin/actions/clientesActions.ts`**
   - Nueva action: `actionToggleBloqueoCliente(id: string, bloqueado: boolean)` — `'use server'`, verifica admin, `.eq('tenant_id', tenantId)`, `.update({ bloqueado })`, revalidatePath.

### Criterios de aceptación

| ID | Criterio verificable |
|----|----------------------|
| AF.1 | `clientes.bloqueado` existe como `boolean NOT NULL DEFAULT false`. |
| AF.2 | El trigger `trg_detectar_fraude_pedido` existe y dispara en AFTER INSERT de `pedidos`. |
| AF.3 | Un cliente con 3 pedidos en <24hs (mismo teléfono) queda automáticamente `bloqueado = true`. |
| AF.4 | `generarCheckout.ts` lanza error si el cliente (existente por teléfono) tiene `bloqueado = true`. Mensaje: "Cliente bloqueado...". |
| AF.5 | La RPC `crear_pedido_checkout` rechaza pedidos para clientes bloqueados (defensa en profundidad). |
| AF.6 | En `/admin/clientes/[id]`, el admin puede marcar/desmarcar `bloqueado` y el cambio persiste. |
| AF.7 | El toggle de bloqueo solo afecta al cliente del tenant actual (RLS). |
| AF.8 | Un cliente bloqueado intenta checkout → redirect a `/pedido/[id]` con error visible, sin crear pedido. |

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| R-AF.1 | El trigger puede bloquear falsos positivos (cliente legitimo que pide rápido). Documentado como protección básica; el admin puede desbloquear manualmente. Considerar hacer la regla configurable en Sprint 10. |
| R-AF.2 | La RPC `crear_pedido_checkout` es crítica (toda la tabla depende de ella). El `ALTER FUNCTION` debe preservar la lógica existente y agregar solo el check de bloqueo. Test en staging antes de producción. |
| R-AF.3 | El backfill: clientes existentes con pedidos múltiples pasan a estar bloqueados retroactivamente. **No aplicar backfill automático** — solo futuros pedidos disparan el trigger. |

---

## Archivos — Resumen de cambios

### Crear

| Feature | Archivo |
|---------|---------|
| 9.1 | — (solo modificaciones) |
| 9.2 | — (solo modificaciones) |
| 9.3 | `src/features/instagram/types/index.ts` |
| 9.3 | `src/features/instagram/api/queries.ts` |
| 9.3 | `src/features/instagram/components/InstagramFeed.tsx` |
| 9.3 | `src/features/instagram/hooks/useInstagramFeed.ts` |
| 9.3 | `src/features/instagram/index.ts` |
| 9.4 | `src/features/tracking-pixel/lib/metaPixel.ts` |
| 9.4 | `src/features/tracking-pixel/hooks/useMetaPixel.ts` |
| 9.4 | `src/features/tracking-pixel/index.ts` |
| 9.4 | `supabase/functions/meta-pixel-proxy/index.ts` |
| 9.5 | (modificar trigger + RPC en DB) |
| Migrations | `supabase/migrations/<ts>_sprint9_instagram_feed.sql` |
| Migrations | `supabase/migrations/<ts>_sprint9_meta_pixel_flag.sql` |
| Migrations | `supabase/migrations/<ts>_sprint9_anti_fraude.sql` |

### Modificar

| Feature | Archivo |
|---------|---------|
| 9.1 | `src/features/checkout-confirmacion/components/GeneradorQrPago.tsx` — payload Coelsa + prop `titularCuenta` |
| 9.1 | `app/pedido/[id]/page.tsx` — pasar `titularCuenta` |
| 9.1 | `src/features/checkout-confirmacion/components/EnlacesBancarios.tsx` — `payloadPago` formato Coelsa |
| 9.2 | `app/producto/[id]/page.tsx` — botones share WhatsApp + copiar link |
| 9.3 | `app/page.tsx` — sección Instagram Feed (async, feature-gated) |
| 9.4 | `app/layout.tsx` — init Meta Pixel |
| 9.4 | `app/producto/[id]/page.tsx` — ViewContent event |
| 9.4 | `src/features/carrito/store.ts` — AddToCart en `agregarItem` |
| 9.4 | `src/features/carrito/components/FormularioCheckout.tsx` — InitiateCheckout en mount |
| 9.5 | `src/features/carrito/actions/generarCheckout.ts` — check bloqueado antes checkout |
| 9.5 | `src/features/admin/actions/clientesActions.ts` — `actionToggleBloqueoCliente` |
| 9.5 | `app/admin/clientes/[id]/page.tsx` — toggle bloqueo UI |
| 9.5 | `src/types/supabase.ts` — regenerar (3 migraciones) |
| 9.5 | RPC `crear_pedido_checkout` — agregar check de bloqueo (modificar función en DB) |

---

## Orden de ejecución

```
1.  Migración 9.5-A: clientes.bloqueado + trigger antifraude (verificar columna no existe)
2.  Migración 9.5-B: modificar crear_pedido_checkout (agregar check bloqueado)
3.  Migración 9.3-A: tenants.instagram_usuario + feature flag instagram_feed
4.  Migración 9.4-A: feature flag meta_pixel
5.  Regenerar src/types/supabase.ts → npm run check (debe pasar con columnas nuevas)
6.  Feature 9.1: modificar GeneradorQrPago.tsx + EnlacesBancarios + page.tsx
7.  Feature 9.2: modificar app/producto/[id]/page.tsx (botones share)
8.  Feature 9.5: modificar generarCheckout.ts (check bloqueado) + clientesActions (toggle) + UI admin
9.  Feature 9.3: crear feature instagram + integrar en app/page.tsx
10. Feature 9.4: crear feature tracking-pixel + meta-pixel-proxy Edge Function + integrar en layout/producto/carrito
11. npm run check completo (type-check + lint + test:unit + build) → 0 errores
```

### Paralelización posible

- 9.1 y 9.2 son independientes de migraciones (9.1 solo TS, 9.2 solo UI).
- 9.3 y 9.4 dependen de sus migraciones (feature flags).
- 9.5 (trigger) es independiente del código; el check en `generarCheckout.ts` depende de la migración 9.5-A.
