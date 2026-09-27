# Plan: Sprint 8 — Parte 1: Métodos de Pago + Datos Bancarios del Tenant

**Feature:** Datos de pago del tenant · página de confirmación post-checkout · instrucciones + QR + deep-links bancarios  
**Sprint:** 8 — Parte 1  
**Tier:** `basico` y `premium` (ambos acceden a la configuración y a la página de confirmación)  
**SSOT de tipos:** `src/types/supabase.ts`

> **Aviso de ubicación:** El usuario solicitó escribir en `docs/specs/sprint8-checkout-pagos.md`, pero el sandbox de permisos del modo plan sólo permite escribir planos en `.kilo/plans/*.md`. Este documento se guarda en `.kilo/plans/` y contiene el spec completo para el Executor. Posteriormente el Executor puede tr trasladarlo a `docs/specs/` si lo desea.
>
> **Verificación obligatoria (antes de migrar):** La MCP de Supabase está sin autorización (`SUPABASE_ACCESS_TOKEN` no disponible en este entorno), por lo que no se pudo inspeccionar el schema en vivo. La verificación de columnas se basa en el **SSOT regenerado** (`npx supabase gen types typescript`). El Executor DEBE confirmar contra `information_schema.columns` antes de aplicar DDL, y volver a regenerar `src/types/supabase.ts` después.

---

## 0. Contexto y estado actual

- **`tenants`** (SSOT `supabase.ts:415`): `activo, created_at, email, id, nombre, plan, slug, whatsapp`. **No** posee `cbu, alias_bancario, banco, titular_cuenta, meta_pixel_id`. → Necesita migración.
- **Checkout actual** (`src/features/carrito/actions/generarCheckout.ts`): `generarLinkWhatsApp(...)` crea el pedido vía RPC `crear_pedido_checkout` (retorna `pedidoId: string`), arma el link de WhatsApp y **redirige directamente** con `window.location.assign(url)` en `FormularioCheckout.tsx:43`. No existe página de confirmación; el comprador nunca ve instrucciones de pago.
- **`/admin/configuracion/page.tsx`**: *stub* vacío (placeholder de "Módulo de Configuración").
- **Auth/roles** (`src/lib/auth/admin.ts`): `verificarAdministrador()`, `obtenerTenantIdAdmin()` (RPC `get_my_tenant_id`). Existe RPC DB `is_webmaster()`. Helper de features: `tieneFeature(key)` en `src/lib/auth/entitlements.ts`.
- **Cliente público**: `createSupabasePublicClient()` en `src/lib/supabase/server.ts` (sin auth).
- **Arquitectura**: feature-based (`src/features/.../`). Server Actions con `'use server'`. Tipado desde `Database['public']['Tables']`.
- **Dependencias**: no hay librería QR. `qrcode` (SSR-safe) será la candidata.
- **Multi-tenant actual**: el checkout resuelve el tenant con `slug: 'default'` (único tenant hoy). La página pública `/pedido/[id]` resolverá el tenant desde la fila `pedidos.tenant_id`.

---

## 1. Modelo de datos (DB)

### 1.1. Columnas nuevas en `tenants`

`ALTER TABLE public.tenants ADD COLUMN ... ` para: `cbu`, `alias_bancario`, `banco`, `titular_cuenta`, `meta_pixel_id`.

**Decisión de tipos:** todas `TEXT`, **NULLABLE** (`NULL DEFAULT NULL`). Justificación: no romper tenants existentes; la UI valida presencia. No se ponen defaults (forzado de datos inventados).

| Columna            | Tipo | Comentario breve                                  |
|--------------------|------|---------------------------------------------------|
| `cbu`              | text | CBU completito (22 dígitos)                       |
| `alias_bancario`   | text | Alias (3-20 chars, formato `XXXXXXXYYYY`)        |
| `banco`            | text | Nombre del banco emisor                           |
| `titular_cuenta`   | text | Nombre del titular de la cuenta                   |
| `meta_pixel_id`    | text | ID del Meta Pixel (para tracking, opcional)      |

**RLS:** `tenants` ya es una tabla existente con su política actual; **no** se crea tabla nueva ni política nueva. La escritura de estas columnas SOLO debe hacerse filtrando por el `tenant_id` del admin conectado (véase acción 2.3), garantizando aislamiento multi-tenant sin nueva política. **El Executor verifica que el rol `anon` tenga SELECT sobre `tenants` (necesario para la página 3).**

### 1.2. Feature flag (plan_features)

Clave: `payment_confirmation`. Se crean/activan filas para **ambos** planes:

```sql
INSERT INTO plan_features (plan, feature_key, enabled)
VALUES ('basico','payment_confirmation',true),
       ('premium','payment_confirmation',true)
ON CONFLICT (plan, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;
```

- Gating centralizado vía `tieneFeature('payment_confirmation')`.
- Si está deshabilitado para un plan, la página `/pedido/[id]` **cae al comportamiento legacy**: solo muestra el botón "Finalizar compra por WhatsApp" (sin instrucciones/QR). Mantiene compatibilidad.

---

## 2. `/admin/configuracion` — Datos bancarios del tenant

### 2.1. Guardia de acceso (page.tsx)
- Heredada del `AdminLayout` (ya exige fila en `admin_users`).
- **Webmaster**: puede **ver** el formulario, campos **deshabilitados** (`readOnly`). Justificación elegida (decisión resuelta): los datos bancarios son sensibles y dueños del tenant; el webmaster administra infra sin tocar cuentas. Se expone prop `isWebmaster` leída desde `supabase.rpc('is_webmaster')`, que desbloquea un toggle futuro `allow_webmaster_edit` si se necesita.
- **Admin**: campos editables.

### 2.2. Formulario (feature `configuracion-pagos`)
- Schema Zod (`z.object`) con: `cbu` (opcional, exactamente 22 dígitos cuando se ingresa), `alias_bancario` (opcional, alfanumérico, ≤ 20), `banco`, `titular_cuenta`, `meta_pixel_id` (opcional).
- Carga inicial: `select cbu, alias_bancario, banco, titular_cuenta, meta_pixel_id from tenants where id = obtenerTenantIdAdmin()`.
- Botón "Guardar" → Server Action `actionGuardarDatosBancarios(data)` (prefijo `action` por convención Server Actions).

### 2.3. Server Action `actionGuardarDatosBancarios`
Ubicación: `src/features/configuracion-pagos/actions/actionGuardarDatosBancarios.ts` (`'use server'` primero).

- `verificarAdministrador('configurar métodos de pago')` → cliente Supabase.
- `tenantId = await obtenerTenantIdAdmin()`.
- `UPDATE tenants SET cbu, alias_bancario, banco, titular_cuenta, meta_pixel_id WHERE id = tenantId`.
- `.eq('id', tenantId)` garantiza aislamiento (sólo el propio tenant).
- Manejo de tupla `{ data, error }`; en error lanzar `throw new Error(...)`.
- `revalidatePath('/admin/configuracion')` + `revalidatePath('/pedido/[id]')` (cache público).

### 2.4. Estructura feature
```
src/features/configuracion-pagos/
  actions/actionGuardarDatosBancarios.ts
  api/queries.ts        (carga de datos bancarios del tenant)
  components/FormularioDatosBancarios.tsx
  index.ts              (exporta FormularioDatosBancarios + tipos)
app/admin/configuracion/page.tsx   (consume el componente)
```

---

## 3. `/pedido/[id]` — Página pública de confirmación post-checkout

### 3.1. Routing
- Nueva ruta pública: `app/pedido/[id]/page.tsx`. **Sin layout de auth** (pública). `id` = UUID del pedido (string).
- Page es **Server Component**: resuelve `id` (await params), llama `obtenerPedidoConfirmacion(id)`.

### 3.2. Datos a mostrar (Server-side fetch)
`funcion obtenerPedidoConfirmacion(id)` → cliente **público** (`createSupabasePublicClient`), consulta anidada:

```ts
const { data, error } = await supabase
  .from('pedidos')
  .select(`
    id, total, estado, created_at, tenant_id,
    items:pedidos_items(id, nombre_producto, talle, cantidad, precio_unitario),
    tenant:tenants!inner(nombre, cbu, alias_bancario, banco, titular_cuenta, whatsapp)
  `)
  .eq('id', id)
  .maybeSingle();
```
- Si `anon` no tiene SELECT sobre `tenants`, el Executor crea RPC security-definer `get_pedido_publico(p_id UUID)` retornando JSON (como patrón sprint-7) y la query usa `.rpc('get_pedido_publico', { p_id: id })`.
- Error → `not-found.tsx` o mensaje.

### 3.3. UI (page.tsx + componentes)
Secciones, orden mobile-first:
1. **Header**: "¡Gracias por tu pedido!" + estado (pendiente).
2. **Resumen**: número de orden (`id.split('-')[0]`), fecha, total, tabla de items.
3. **Instrucciones de pago** (Solo si `tieneFeature('payment_confirmation')` y tenant completó datos):
   - Titular + banco + CBU + alias (con botón "Copiar" por ítem → `navigator.clipboard`).
   - **QR de pago**: data-URL generada con `qrcode` sobre el payload `bank|CBU|alias|amount`. Render `<img src={qrDataUrl} alt="QR pago" />`. Fallback texto si falla generación.
   - **Deep-links a apps bancarias** (botones): Mercado Pago (`mercadopago://`), Naranja X (`naranjax://`), Brubank (`brubank://`). Cada uno con fallback: `window.location.assign(scheme)` con detección de apertura (blur/visibilitychange + timeout) → redirige a web store si no abre; toast "Copiá los datos" con fallback a clipboard.

> **Verificación pendiente:** los schemes exactos de Naranja X / Brubank pueden haber cambiado. El Executor valida con `adb shell am start` o links de fallback antes de fiar el deep-link. La spec deja el mapa de schemes en un constante `DEEP_LINK_APPS` para reemplazar fácilmente.

4. **Finalizar compra**: botón "Abrir WhatsApp" → link generado en 3.4 (mantiene el mensaje legacy con número de orden y total). El comprador copia/comunica el comprobante.

### 3.4. Wiring de checkout (cambio de contrato — BREAKING)
- `generarLinkWhatsApp` **cambia su firma de retorno**: de `string` (solo URL) a `{ pedidoId: string; linkWhatsApp: string }`.
- `FormularioCheckout.onSubmit`: en lugar de `window.location.assign(url)` → `router.push(`/pedido/${result.pedidoId}`)` (`useRouter` de App Router). `limpiarCarrito()` se mantiene. El WhatsApp se abre desde la página de confirmación (botón explícito), no de forma automática.

### 3.5. Cache y revalidación
- La página `/pedido/[id]` es pública y dinámica → **no** usar `generateStaticParams`. `revalidate: 0` o ISR corto configurable. `actionGuardarDatosBancarios` reválida `/pedido/[id]` para reflejar cambios de datos bancarios (nota: revalidar rutas dinámicas puntualmente es costoso; ISR corto aceptado).

---

## 4. Migraciones (DDL exacto)

```sql
-- 4.1. Columnas bancarias + meta pixel en tenants (idempotente)
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS cbu TEXT,
    ADD COLUMN IF NOT EXISTS alias_bancario TEXT,
    ADD COLUMN IF NOT EXISTS banco TEXT,
    ADD COLUMN IF NOT EXISTS titular_cuenta TEXT,
    ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;

-- 4.2. Feature flag para ambos planes
INSERT INTO public.plan_features (plan, feature_key, enabled)
VALUES
    ('basico', 'payment_confirmation', TRUE),
    ('premium', 'payment_confirmation', TRUE)
ON CONFLICT (plan, feature_key) DO UPDATE
    SET enabled = EXCLUDED.enabled;

-- 4.3. (Opcional, recomendado) RPC pública para evitar ambigüedad de RLS en tenants
-- Sólo si anon NO tiene SELECT sobre tenants; el Executor valida y aplica bajo demanda.
```

> **Orden de aplicación:** 4.1 → regenerar types → 4.2 → 4.3 (solo si aplica).

---

## 5. Criterios de Aceptación (AC)

| ID   | Criterio |
|------|----------|
| **8.1.1** | `tenants` tiene columnas `cbu, alias_bancario, banco, titular_cuenta, meta_pixel_id` (NULLABLE text). |
| **8.1.2** | `npx supabase gen types typescript` regenera `supabase.ts` incluyendo las columnas nuevas en `tenants.Row/Update/Insert`. |
| **8.2.1** | `/admin/configuracion` deja el stub y muestra formulario de datos bancarios cargados del tenant del admin. |
| **8.2.2** | Admin edita y guarda → `actionGuardarDatosBancarios` actualiza SOLO `tenants.id = tenantId` del admin conectado (RLS/verificación de scopes). |
| **8.2.3** | Webmaster ve el formulario con campos **deshabilitados** (read-only). |
| **8.2.4** | Validación Zod rechaza CBU sin 22 dígitos / alias inválido / campos requeridos; muestra errores inline. |
| **8.2.5** | Feature flag `payment_confirmation` creado y activado para `basico` y `premium`. |
| **8.3.1** | Checkout (`FormularioCheckout`) captura `pedidoId` y navega a `/pedido/[id]` (no redirige directo a WhatsApp). |
| **8.3.2** | `/pedido/[id]` pública muestra número de orden, total e ítems del pedido (sin auth). |
| **8.3.3** | Muestra datos bancarios del tenant (titular, banco, CBU, alias) con botón "Copiar" por ítem. |
| **8.3.4** | Genera QR de pago (data-URL) con los datos del CBU/alias + importe; se muestra en mobile-first. |
| **8.3.5** | Botones deep-link a Mercado Pago / Naranja X / Brubank con fallback a web/clipboard. |
| **8.3.6** | Si `payment_confirmation` deshabilitado → página muestra sólo el botón "Abrir WhatsApp" (comportamiento legacy). |
| **8.3.7** | La página `/pedido/[id]` está fuera del layout de admin (pública), sin redirect a `/login`. |

---

## 6. Riesgos / Decisiones abiertas

- **Deep-link schemes AR**: los schemes `naranjax://` / `brubank://` deben validarse empíricamente; separamos los intents en una constante `DEEP_LINK_APPS` para reemplazar sin tocar UI.
- **RLS público sobre `tenants`**: se requiere confirmar SELECT para `anon`; alternativa RPC security-definer `get_pedido_publico`.
- **Revalidación ISR de `/pedido/[id]`**: al ser ruta dinámica y pública, el revalidado puntual tras guardar datos bancarios puede ser costoso; se acepta ISR corto (`revalidate` configurable) como suficiente.
- **Webmaster edición**: decision tomada → **view-only**. Si negocio lo revierte, flip de `allow_webmaster_edit`.

---

## 7. Archivos a crearse/modificar (Executor)

**Crear**
- `src/features/configuracion-pagos/actions/actionGuardarDatosBancarios.ts`
- `src/features/configuracion-pagos/api/queries.ts`
- `src/features/configuracion-pagos/components/FormularioDatosBancarios.tsx`
- `src/features/configuracion-pagos/index.ts`
- `src/features/checkout-confirmacion/api/queries.ts` (`obtenerPedidoConfirmacion`)
- `src/features/checkout-confirmacion/components/ResumenPedido.tsx`
- `src/features/checkout-confirmacion/components/IndicacionesPago.tsx`
- `src/features/checkout-confirmacion/components/GeneradorQrPago.tsx`
- `src/features/checkout-confirmacion/components/EnlacesBancarios.tsx`
- `src/lib/constants/deepLinks.ts` (mapa de schemes)
- `app/pedido/[id]/page.tsx`

**Modificar**
- `src/features/carrito/actions/generarCheckout.ts` (cambio de retorno a `{ pedidoId, linkWhatsApp }`)
- `src/features/carrito/components/FormularioCheckout.tsx` (`useRouter` → `/pedido/[id]`)
- `app/admin/configuracion/page.tsx` (reemplazar stub por feature)
- `src/types/supabase.ts` (regenerar tras migración)

**Dependencia nueva**
- `qrcode` (instalar; usar API `toDataURL`).
