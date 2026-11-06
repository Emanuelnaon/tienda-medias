# Plan: Sprint 8.2 — Logística, Estados Extendidos y Tracking Público

**Feature:** Zonas de envío · Ciclo de vida extendido de pedidos · Tracking público en tiempo real
**Sprint:** 8.2
**Tier:** `premium` (E-commerce) y `escala` — ambas capacidades se gatean con claves de `plan_features`
**SSOT de tipos:** `src/types/supabase.ts`

> **Aviso sobre verificación MCP:** la MCP de Supabase responde `Unauthorized` en este entorno (`SUPABASE_ACCESS_TOKEN` ausente). **El Executor DEBE verificar el schema real vía `information_schema.columns` / `pg_catalog` antes de aplicar cualquier DDL**, y regenerar `src/types/supabase.ts` después de cada migración. Todo lo que sigue sobre el estado actual proviene del SSOT regenerado (`supabase.ts:193-295`) y del código leído.

---

## 0. Estado actual verificado (leído, no supuesto)

| Objeto | Estado real | Ubicación |
|--------|-------------|-----------|
| `pedidos` | `id, cliente_id, comprobante_numero, comprobante_url, created_at, estado (text NULL), tenant_id, total` | `src/types/supabase.ts:193-240` |
| `pedidos.estado` | **`text` nullable, SIN CHECK constraint, SIN enum** | idem |
| `pedidos` — columnas de envío | **No existen**: sin `metodo_envio`, `zona_envio_id`, `costo_envio`, `codigo_postal`, `numero_seguimiento`, `direccion` | — |
| `pedidos_items` | `id, cantidad, nombre_producto, pedido_id, precio_unitario, producto_id, talle, variante_id` | `:241-295` |
| Tablas de esta spec | **No existen**: `zonas_envio`, `pedidos_historial`, `delivery_tracking` | — |
| RPCs públicas activas | `crear_cliente_checkout`, `crear_pedido_checkout`, `crear_lista_espera`, `get_pedido_publico`, `confirmar_pedido_transaccion` | `docs/arquitectura.md:68-72` |
| `/pedido/[id]` | Server Component público, consume `get_pedido_publico` vía cliente anónimo | `app/pedido/[id]/page.tsx:38`, `checkout-confirmacion/api/queries.ts:34` |
| `/admin/pedidos/[id]` | **Client Component** con lógica de fetch + acciones de pedido hardcodeadas en la página | `app/admin/pedidos/[id]/page.tsx:1` |
| Whitelist de estados admin | `['pendiente','confirmado','todos']` | `pedidosActions.ts:35` |
| Filtros UI | `pendiente | confirmado | todos` | `FiltrosPedidos.tsx:5-9` |
| Checkout | `FormularioCheckout` pide **solo nombre + teléfono**, sin CP ni dirección | `FormularioCheckout.tsx:12-15` |
| `/admin/configuracion` | Ya tiene `FormularioDatosBancarios` (sprint 8.1) — es el punto de extensión natural | `app/admin/configuracion/page.tsx` |
| Helper de gating | `tieneFeature(key)` requiere **sesión admin**; no sirve para páginas públicas | `src/lib/auth/entitlements.ts:3` |
| Realtime | **Sin verificar.** No hay `supabase/functions/`, no hay config de publication en el repo | — |

### 0.1 Decisiones de diseño tomadas en esta spec

1. **El CP es un campo nuevo del checkout**, no se infiere. `FormularioCheckout` suma `codigo_postal` (4 dígitos AR, validado) y `direccion` (texto libre). Es un cambio **aditivo** en el contrato de `generarLinkWhatsApp`.
2. **El costo de envío se recalcula y se persiste en servidor.** El cliente nunca envía un costo: sólo CP + carrito. El total final se computa dentro de `crear_pedido_checkout` (RPC SECURITY DEFINER), leyendo `zonas_envio`. Esto elimina la manipulación por diseño.
3. **La "Edge Function de validación" se implementa como RPC SECURITY DEFINER**, no como Edge Function Deno, salvo que el Executor decida lo contrario (ver §2.4). Razón: el proyecto ya tiene el patrón RPC para toda la escritura del checkout y una Edge Function agregaría cold start + un secreto más (`SUPABASE_SERVICE_ROLE_KEY`) por una validación que PostgreSQL ya puede hacer de forma transaccional. Si el usuario exige Edge Function, se documenta el plan B en §8.
4. **Estados como `CHECK` constraint, no enum.** Evita el `ALTER TYPE` y el lock. El trigger de historial **es** el validador del orden (fuente única de la regla de negocio), y la app solo refleja los `next` permitidos.
5. **El tracking del repartidor es una URL con token, no auth.** `/delivery/[pedido_id]` es semi-pública: requiere un token aleatorio generado en el pedido (`token_seguimiento`), porque exponer la posición de un repartidor por UUID adivinable es una fuga.

---

# FEATURE 8.2 — Zonas de envío

## 1. Modelo de datos

### 1.1 Tabla `zonas_envio` (nueva)

| Columna | Tipo | Null | Default | Notas |
|---------|------|------|---------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `tenant_id` | uuid | NO | — | `FK → tenants(id) ON DELETE CASCADE` |
| `nombre` | text | NO | — | Ej. "CABA + Cerca", "Interior de Córdoba" |
| `codigo_postal_desde` | text | SÍ | NULL | 4 dígitos. NULL = sin límite inferior |
| `codigo_postal_hasta` | text | SÍ | NULL | 4 dígitos. NULL = sin límite superior |
| `metodo` | text | NO | — | `CHECK IN ('retiro','mensajeria_local','correo')` |
| `costo` | numeric(12,2) | NO | `0` | Costo fijo de envío |
| `minimo_envio_gratis` | numeric(12,2) | SÍ | NULL | Si subtotal ≥ este valor → costo 0 |
| `activo` | boolean | NO | `true` | Zonas inactivas no participan del cálculo |
| `created_at` | timestamptz | NO | `now()` | — |

**CHECK adicional:**
```sql
CHECK (codigo_postal_desde IS NULL OR codigo_postal_hasta IS NULL
       OR codigo_postal_desde <= codigo_postal_hasta)
CHECK (costo >= 0)
CHECK (minimo_envio_gratis IS NULL OR minimo_envio_gratis >= 0)
CHECK (metodo = 'retiro' AND costo = 0)
```
> El último CHECK impone la regla de negocio: si el método es `retiro`, el costo es 0 sí o sí. Evita que una zona de pickup cobre al comprador.

**Índices:** `(tenant_id, activo)`, `(tenant_id, codigo_postal_desde, codigo_postal_hasta)`.

### 1.2 Columnas nuevas en `pedidos`

| Columna | Tipo | Null | Default | Notas |
|---------|------|------|---------|-------|
| `metodo_envio` | text | SÍ | NULL | `CHECK IN ('retiro','mensajeria_local','correo')` |
| `zona_envio_id` | uuid | SÍ | NULL | `FK → zonas_envio(id) ON DELETE SET NULL` |
| `costo_envio` | numeric(12,2) | NO | `0` | **Autoritativo**, snapshot del momento del checkout |
| `codigo_postal` | text | SÍ | NULL | 4 dígitos, snapshot |
| `direccion_entrega` | text | SÍ | NULL | Texto libre, snapshot |
| `token_seguimiento` | text | SÍ | NULL | `UNIQUE`, 32 hex chars, para `/delivery/[id]` |

**El snapshot importa:** si el admin edita o desactiva la zona después, el pedido conserva lo que se cobró. Sin esto, la historia de pedidos miente.

### 1.3 Feature flag

Claves: `shipping_zones` (admin config + cálculo) y `live_tracking` (timeline + Realtime + mapa). Activadas para `premium` y `escala`, `false` en `basico`.

**Degradación en `basico`:** el checkout **no pide CP**, `crear_pedido_checkout` usa `costo_envio = 0` y la página `/pedido/[id]` no muestra timeline. Cero cambios de comportamiento en el plan básico.

> La verificación de `plan_features` en el checkout anon **no puede** usar `tieneFeature()` (requiere sesión admin). Se resuelve con una RPC pública `tenant_tiene_feature(p_tenant_id uuid, p_feature_key text) RETURNS boolean SECURITY DEFINER` que solo lee `plan_features` y devuelve el booleano, sin exponer datos del plan.

## 2. Lógica de cálculo

### 2.1 Resolver zona (función pura, testeable)
`src/features/logistica/utils/calcularEnvio.ts`

```
calcularEnvio(zonas: ZonaEnvio[], cp: string, subtotal: number): ResultadoEnvio
```
- Normaliza CP: quita guiones/espacios, valida `/^\d{4}$/`. CP inválido → `{ esValido: false, motivo: 'CP_INVALIDO' }`.
- Filtra `zonas` con `activo === true` y rango que contiene el CP (`desde <= cp AND (hasta IS NULL OR cp <= hasta)`), comparado **como texto** (los CP AR son de longitud fija 4, el orden lexicográfico coincide con el numérico).
- Si hay 0 coincidencias → `SIN_ZONA`.
- Si hay >1 coincidencias (zonas solapadas) → se toma la de `metodo` más específico... **No**: se devuelve error `ZONAS_SOLAPADAS` y se registra. El solapamiento es un error de configuración del admin, no algo que se resuelva en runtime.
- `costoFinal = subtotal >= minimo_envio_gratis ? 0 : costo` (con `minimo_envio_gratis` NULL → nunca gratis).
- Si `subtotal <= 0` → `{ esValido: false, motivo: 'CARRITO_VACIO' }`.

Es **función pura**: la misma lógica corre en el cliente (para mostrar el estimado) y en la DB. Tests con Vitest obligatorios (6+ casos: CP inválido, sin zona, gratis por mínimo, costo fijo, retiro, solapamiento).

### 2.2 Consumption en el checkout
1. `FormularioCheckout` suma input `codigo_postal` (inputmode numeric, exactamente 4 dígitos) y `direccion_entrega` (solo si el tenant tiene zonas activas).
2. Al perder foco del CP, se llama a la Server Action `actionCotizarEnvio(cp, subtotal)` para el estimado real (fuente: DB, no cliente). Debounce 400 ms.
3. `generarLinkWhatsApp` **no** recibe costo. Envía `{ carrito, cliente, codigo_postal, direccion_entrega }` y devuelve `{ pedidoId, linkWhatsApp, costoEnvio, metodoEnvio, totalFinal }` para que el mensaje de WhatsApp muestre el desglose real.
4. La Server Action calcula la zona, invoca la RPC de creación, y **vuelve a calcular** el costo para el mensaje. Los dos puntos de cálculo usan la misma función pura.

### 2.3 Autorización del costo — la pieza crítica
El comprador no puede fijar `costo_envio` porque **nadie acepta ese parámetro desde el cliente**. La RPC `crear_pedido_checkout` (SECURITY DEFINER) recibe solo `p_cliente_id, p_total, p_tenant_id, p_items, p_codigo_postal, p_direccion_entrega` y resuelve internamente:

```
zona := buscar_zona_activa(p_tenant_id, p_codigo_postal)   -- SECURITY DEFINER interno
costo := calcular_costo(zona, p_total)
pedidos.costo_envio := costo
pedidos.total       := p_total + costo
pedidos.metodo_envio := zona.metodo
```
Si no hay zona aplicable: `costo := 0` y `metodo_envio := 'retiro'` (el tenant puede bloquear el envío online, nunca cobrar de más). El Executor **reescribe** la RPC con el mismo nombre/firma extendida, preservando el cuerpo actual (`pedidosItems` + `total`) y agregando el bloque de envío.

### 2.4 Alternativa Edge Function (si se exige Deno)
`supabase/functions/validar-envio/index.ts` — recibe `{ tenant_id, codigo_postal, subtotal }`, usa `SUPABASE_SERVICE_ROLE_KEY`, devuelve `{ esValido, costo, metodo, zona_id }`. El checkout la invoca para el **estimado**; la **autoridad** sigue siendo la RPC del §2.3. Se deja constancia de que esto duplica la lógica de validación en dos runtimes y obliga a mantener sincronizadas la función Deno y el SQL — por eso la recomendación por defecto es §2.3.

## 3. UI admin — `/admin/configuracion`

Nueva sección "Zonas de envío" **debajo** de "Datos bancarios" (mobile-first), reutilizando el page server-side existente:

- `src/features/logistica/components/ListaZonasEnvio.tsx` — tabla con nombre, rango CP, método, costo, gratis-desde, activo. Toggle activo/desactivo inline.
- `src/features/logistica/components/FormularioZonaEnvio.tsx` — Zod + RHF. Validaciones: CP 4 dígitos o vacío; `desde <= hasta`; `costo >= 0`; `metodo = 'retiro'` → costo forzado a 0 y ambos campos de costo deshabilitados.
- `src/features/logistica/actions/actionGuardarZonaEnvio.ts` / `actionEliminarZonaEnvio.ts` / `actionToggleZonaEnvio.ts` — `'use server'`, `verificarAdministrador` + `obtenerTenantIdAdmin`, `.eq('tenant_id', tenantId)` en toda escritura. El webhook deraudor de `zona_envio_id` se resuelve con `ON DELETE SET NULL`.
- Si el tenant es `basico` (sin `shipping_zones`), la sección renderiza un bloque informativo de upgrade, no el formulario.

**No se toca ninguna clase de los componentes de datos bancarios existentes** (regla No-Touch de estilos).

## 4. Archivos — Feature 8.2

**Crear**
- `src/features/logistica/` (feature completa)
  - `actions/actionGuardarZonaEnvio.ts`, `actionEliminarZonaEnvio.ts`, `actionToggleZonaEnvio.ts`, `actionCotizarEnvio.ts`
  - `api/queries.ts` (`listarZonasEnvio` server-side para admin)
  - `components/ListaZonasEnvio.tsx`, `FormularioZonaEnvio.tsx`, `SelectorCpEnvio.tsx`
  - `utils/calcularEnvio.ts` + `utils/__tests__/calcularEnvio.test.ts`
  - `utils/zonaEnvioSchema.ts` (Zod)
  - `types/index.ts` (`ZonaEnvio`, `ResultadoEnvio`, `MetodoEnvio`)
  - `index.ts` (contrato público)
- `supabase/migrations/<ts>_sprint82_zonas_envio.sql`
- `supabase/migrations/<ts>_sprint82_envio_pedidos.sql`

**Modificar**
- `app/admin/configuracion/page.tsx` — agregar sección zonas (Server Component, sin tocar markup de datos bancarios)
- `src/features/carrito/components/FormularioCheckout.tsx` — campos CP + dirección + resumen de envío (**aditivo**, el `onSubmit` conserva su firma de negocio)
- `src/features/carrito/actions/generarCheckout.ts` — input nuevo, return con `costoEnvio`/`metodoEnvio`/`totalFinal`
- `src/features/carrito/store.ts` — **no cambia** (el carrito no guarda CP)
- `src/types/supabase.ts` — regenerar

## 5. Criterios de aceptación — Feature 8.2

| ID | Criterio verificable |
|----|----------------------|
| SZ.1 | `zonas_envio` existe con las 11 columnas, FK a `tenants`, RLS habilitado y **4 policies granulares** (SELECT/INSERT/UPDATE/DELETE), todas filtrando por `get_my_tenant_id()`. Verificable con `SELECT * FROM pg_policies WHERE tablename='zonas_envio'` → 4 filas. |
| SZ.2 | El CHECK `metodo='retiro' AND costo=0` está en la DB: un `INSERT` con `metodo='retiro', costo=500` falla con `check_violation`. |
| SZ.3 | `pedidos` tiene las 6 columnas nuevas; `total` sigue siendo NOT NULL. |
| SZ.4 | `npm run supabase gen types` produce tipos para `zonas_envio` y las columnas nuevas; `npx tsc --noEmit` en 0 errores. |
| SZ.5 | Un admin crea una zona por `/admin/configuracion`; tras recargar, la zona persiste y **solo** su tenant la ve. Un admin de otro tenant recibe 0 filas de `listarZonasEnvio`. |
| SZ.6 | `calcularEnvio` cubre ≥ 6 casos unitarios: CP válido con costo, CP válido con envío gratis, CP sin zona, CP con formato inválido, zonas solapadas, `retiro` con costo 0. `npm run test:unit` en verde. |
| SZ.7 | En el checkout, al ingresar un CP de una zona configurada, el costo mostrado **coincide exactamente** con el devuelto por la RPC al confirmar (0 diferencia en 10 casos manual de CP). |
| SZ.8 | **Manipulación bloqueada:** invocar `crear_pedido_checkout` con `p_total` menor al real NO cambia el resultado porque la RPC ya lo recalcula desde `productos` (comportamiento preexistente) y el costo de envío sólo puede venir de `zonas_envio`. Un tenant con una única zona de costo 0 nunca genera pedidos con `costo_envio > 0`. |
| SZ.9 | Con `shipping_zones` deshabilitado para `basico`, el checkout no pide CP y el flujo actual corre idéntico (WhatsApp + `/pedido/[id]` sin timeline). |
| SZ.10 | Cambiar el costo de una zona **después** de un pedido no altera el `costo_envio` ya persistido en ese pedido (verificable con 2 pedidos, uno antes y uno después del cambio). |

---

# FEATURE 8.3 — Estados extendidos de pedido

## 6. Modelo de datos

### 6.1 CHECK constraint en `pedidos.estado`
```sql
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IS NULL OR estado IN
    ('pendiente','confirmado','preparando','en_camino','entregado','cancelado'));
```
> `DROP ... IF EXISTS` porque el nombre del constraint auto-generado es impredecible si existe uno previo. Verificación previa obligatoria por MCP.

### 6.2 Tabla `pedidos_historial` (nueva)

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `pedido_id` | uuid | NO | `FK → pedidos(id) ON DELETE CASCADE` |
| `tenant_id` | uuid | NO | `FK → tenants(id) ON DELETE CASCADE` |
| `estado_anterior` | text | SÍ | NULL (NULL en la primera entrada) |
| `estado_nuevo` | text | NO | `CHECK` con la misma lista de 6 valores |
| `changed_at` | timestamptz | NO | `now()` |
| `changed_by` | uuid | SÍ | `FK → auth.users(id) ON DELETE SET NULL` |
| `origen` | text | NO | `'sistema'` \| `'admin'` \| `'cliente'` — default `'sistema'` |
| `notas` | text | SÍ | NULL |

**Índices:** `(pedido_id, changed_at DESC)` — es el índice de la query del timeline.

**RLS:** el comprador anónimo **no** puede leer el historial vía tabla; se expone por RPC `get_pedido_tracking(p_pedido_id)` SECURITY DEFINER que filtra por `pedido_id` y devuelve sólo los campos públicos (estado, timestamps, notas sin datos internos). Admin lee directo por RLS.

### 6.3 Trigger de registro + máquina de estados

`AFTER UPDATE OF estado ON pedidos FOR EACH ROW WHEN (OLD.estado IS DISTINCT FROM NEW.estado)`

El trigger hace **dos cosas**, en este orden:
1. **Valida la transición** contra una tabla de transiciones permitidas. Si el `NEW.estado` no es alcanzable desde `OLD.estado` según la matriz, `RAISE EXCEPTION`. Esto es la **fuente única de la regla de no-hacia-atrás** — no depende de que la UI sea correcta.
2. **Inserta** la fila en `pedidos_historial` con `tenant_id` heredado de `NEW.tenant_id`, `changed_by = auth.uid()` (NULL si no hay sesión → `origen='sistema'`).

**Matriz de transiciones:**

| Desde \ Hacia | confirmado | preparando | en_camino | entregado | cancelado |
|----------------|-----------|------------|----------|-----------|-----------|
| **pendiente** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **confirmado** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **preparando** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **en_camino** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **entregado** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **cancelado** | ❌ | ❌ | ❌ | ❌ | ❌ |

`NULL` → cualquiera: permitido (backfill de pedidos antiguos sin historial).
Mismo estado → mismo estado: el trigger no dispara (el `WHEN` filtra), y `confirmar_pedido_transaccion` sigue funcionando sin cambios.

**Orden de implementación:** la tabla + trigger se crean **antes** de aplicar el CHECK constraint de §6.1, para que ningún `UPDATE` de legado quede sin registrar. Un `UPDATE` de `pendiente` a `confirmado` que ya existe en la app (`confirmarPedido`) pasa por la matriz y genera su primera entrada de historial automáticamente.

### 6.4 Seed del historial
Pedidos existentes sin historial won't have entries. Un `INSERT ... SELECT` de backfill crea **una fila por pedido actual** con `estado_anterior = NULL, estado_nuevo = estado, changed_at = created_at, origen = 'sistema'`. Idempotente: `WHERE NOT EXISTS (SELECT 1 FROM pedidos_historial WHERE pedido_id = p.id)`.

## 7. UI admin — `/admin/pedidos/[id]`

- **Selector de próximo estado**: un `<select>` con **solo** los `next` válidos según `estadoActual`, calculados en el cliente con la **misma matriz** que está en el trigger. `src/features/logistica/utils/estadosPedido.ts` exporta `ESTADOS_PEDIDO` (const object) y `proximoEstados(estado)` — el util de TS replica la tabla SQL; un test de paridad documenta que ambas deben coincidir.
- Al elegir `cancelado`, se **exige** `notas` (motivo). Para los demás es opcional.
- Acción `actionCambiarEstadoPedido(pedidoId, nuevoEstado, notas)` en `pedidosActions.ts`:
  - `verificarAdministrador('gestionar pedidos')` → `UPDATE pedidos SET estado = ... WHERE id = ? AND tenant_id = tenantId` con `.select().single()`.
  - El trigger de DB es la validación real: si la transición es inválida, Postgres lanza y la Action traduce el error a un mensaje en español. **La Action no reimplementa la matriz como única defensa** — la defiensa es el trigger; la Action solo da feedback.
  - `revalidatePath('/admin/pedidos')` + `revalidatePath('/admin/pedidos/'+pedidoId)`.
- **Badge de estado**: `badgeEstadoPedido()` en el Client Component pasa a mapear los 6 estados. Es un **cambio de estilo localized y necesario** (deja de existir una presentación para `preparando`), no una mejora cosmetic.
- **Historial visible** para el admin en la misma página: lista vertical simple (reutiliza el componente del timeline público, con un flag `esAdmin` que suma `notas` y autor).

### 7.1 Filtros de `/admin/pedidos`
- `ESTADOS_PEDIDO_WHITELIST` en `pedidosActions.ts:35` pasa de `['pendiente','confirmado','todos']` a los 6 estados + `todos` (7 valores). Es **breaking** para los call-sites que dependen del default `'pendiente'` de `page.tsx:19` — se actualizan en la misma tarea.
- `FiltrosPedidos.tsx` suma 4 tabs. Con 7 tabs en mobile no entra: se pasa a un `<select>` en mobile y tabs en `md:`. **Es un cambio visual en un componente existente → se avisa al usuario antes de aplicar.**

## 8. Archivos — Feature 8.3

**Crear**
- `src/features/logistica/utils/estadosPedido.ts` + `__tests__/estadosPedido.test.ts`
- `src/features/logistica/components/TimelineEstados.tsx` (compartido admin/público, flag `esAdmin`)
- `src/features/logistica/components/SelectorEstadoPedido.tsx`
- `supabase/migrations/<ts>_sprint82_pedidos_historial.sql`

**Modificar**
- `src/features/admin/actions/pedidosActions.ts` — whitelist + `actionCambiarEstadoPedido`
- `app/admin/pedidos/[id]/page.tsx` — selector + timeline + badge de 6 estados
- `src/features/admin/components/FiltrosPedidos.tsx` — 4 tabs nuevos (mobile: select)
- `app/admin/pedidos/page.tsx` — default de estado
- `src/types/supabase.ts` — regenerar

## 9. Criterios de aceptación — Feature 8.3

| ID | Criterio verificable |
|----|----------------------|
| EH.1 | `pedidos_historial` existe con 8 columnas, ambas FKs, RLS con policies granulares, índice `(pedido_id, changed_at)`. |
| EH.2 | `INSERT` directo en `pedidos_historial` por un `admin` de tenant A sobre un pedido de tenant B devuelve 0 filas afectadas (RLS). |
| EH.3 | Un `UPDATE pedidos SET estado='preparando'` sobre un pedido en `pendiente` **falla** con excepción de la trigger. Verificable con `psql` / cliente admin. |
| EH.4 | Cada `UPDATE` de estado válido deja exactamente 1 fila en `pedidos_historial` con `estado_anterior` = estado previo y `changed_by` = `auth.uid()`. Un `UPDATE` que no cambia `estado` deja 0 filas. |
| EH.5 | `pendiente→confirmado→preparando→en_camino→entregado` recorre 5 filas de historial en orden cronológico correcto. |
| EH.6 | Ninguna transición desde `entregado` ni desde `cancelado` es posible (todas las pruebas de la matriz dan excepción). Cobertura: 6×6 = 36 casos, generated desde la matriz. |
| EH.7 | Tras el backfill, **todos** los pedidos preexistentes tienen ≥ 1 fila de historial. Verificable con `SELECT COUNT(*) FROM pedidos p WHERE NOT EXISTS (SELECT 1 FROM pedidos_historial h WHERE h.pedido_id = p.id)` → `0`. |
| EH.8 | `confirmarPedido` (sprint 7.1) sigue funcionando y **además** crea la fila de historial `pendiente→confirmado`. Sin regresión. |
| EH.9 | En `/admin/pedidos/[id]`, el selector ofrece exactamente los `next` válidos y ninguno más; `entregado` muestra un selector vacío con el mensaje "Pedido entregado: no hay estados siguientes". |
| EH.10 | Cancelar un pedido sin `notas` es bloqueado por la validación del formulario con mensaje en el campo. |
| EH.11 | Los 6 estados aparecen en `FiltrosPedidos` y filtran correctamente (verificable: `?estado=en_camino` devuelve solo los de ese estado). |

---

# FEATURE 8.4 — Tracking público

## 10. Modelo de datos

### 10.1 Tabla `delivery_tracking` (nueva)

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `pedido_id` | uuid | NO | `FK → pedidos(id) ON DELETE CASCADE`, **UNIQUE** (una fila viva por pedido) |
| `tenant_id` | uuid | NO | `FK → tenants(id) ON DELETE CASCADE` |
| `lat` | double precision | NO | `CHECK (lat BETWEEN -90 AND 90)` |
| `lng` | double precision | NO | `CHECK (lng BETWEEN -180 AND 180)` |
| `updated_at` | timestamptz | NO | `now()` |

`UNIQUE(pedido_id)` + `upsert` en la Edge Function = la posición siempre es la última; no se accumulates histórico de posiciones (si se quiere histórico, es una tabla aparte en un sprint posterior; **fuera de scope**).

**RLS: sólo escritura vía RPC SECURITY DEFINER** `upsert_delivery_position(p_pedido_id uuid, p_lat double, p_lng double, p_token text)`. Valida que `pedidos.token_seguimiento = p_token` y que el pedido esté en `en_camino`. **No hay policy de INSERT/UPDATE para `anon`.** La lectura pública también va por RPC `get_delivery_position(p_pedido_id)` que devuelve sólo `{ lat, lng, updated_at }`.

## 11. Timeline + Realtime en `/pedido/[id]`

### 11.1 Server Component → Client Component
`app/pedido/[id]/page.tsx` sigue siendo Server Component y carga el historial inicial con `obtenerTrackingPedido(id)` (RPC `get_pedido_tracking`, cliente público). Pasa los datos a un **nuevo Client Component** `TimelineEstadosTracking` que es el único que abre la suscripción Realtime. Regla: los Client Components se mantienen lo más bajo posible en el árbol.

### 11.2 Suscripción Realtime
```ts
const channel = supabase
  .channel(`tracking-pedido-${pedidoId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pedidos_historial',
        filter: `pedido_id=eq.${pedidoId}` },
      payload => setHistorial(prev => [...prev, mapear(payload.new)]))
  .subscribe();
```
**Requisito de infra (verificar por MCP):** la tabla debe estar en la publication — `ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_historial, public.delivery_tracking;`. **Si no se hace este paso, Realtime no emite nada y la página queda muda** sin error visible. Es el punto de falla #1 de esta feature.

- Payload filtrado por `pedido_id` → no se reciben eventos de otros pedidos.
- Cleanup en `useEffect` return: `supabase.removeChannel(channel)`.
- Si la suscripción no entra en estado `SUBSCRIBED` en 5 s, se muestra un badge estático "Actualización automática no disponible" y se degrada a polling cada 30 s. **Live tracking nunca puede romper la página.**
- El estado del pedido en el `<header>` (línea 60-64 de la page actual) se mueve dentro del Client Component para que también reaccione a los INSERT.

### 11.3 Mapa de posición del repartidor
- Solo si `pedido.metodo_envio === 'mensajeria_local'` **y** hay fila en `delivery_tracking`.
- **Sin dependencia de mapas**: no se agrega `mapbox-gl` ni `leaflet`. Un iframe de OpenStreetMap Embed (`bbox` calculado desde lat/lng con un delta fijo) es la opción cero-dependencia, coherente con el criterio de no sumar libs. **Es una decisión a confirmar con el usuario**: si quiere mapa interactivo, se agrega `react-leaflet` (+1 dependencia) y la UI del timeline se vuelve client-only.
- Suscripción Realtime a `delivery_tracking` filtrada por `pedido_id`, mismo canal.
- `updated_at` visible ("Posición actualizada hace 2 min"). Si el último update tiene > 30 min, se marca "Posición desactualizada" — un repartidor que cerró la app no debe dejar un pin congelado que mienta.

### 11.4 `/delivery/[pedido_id]` — URL del repartidor
- Server Component público. Busca el pedido; si `token_seguimiento` es NULL → 404. El token se pasa por query param (`?t=...`) porque el repartidor lo recibe por WhatsApp.
- `ValidarTokenPedido(pedidoId, token)` server-side. **El token no se expone en el HTML público** más allá del propio link.
- Client Component `PanelRepartidor` con:
  - `watchPosition` del navegador (permiso explícito, botón "Compartir mi ubicación" — **nunca automático**).
  - throttling: escribe como máximo **1 vez cada 15 s** y solo si se movió > 50 m.
  - `beforeunload`/blur → **último ping** para que la última posición conocida sea la real.
  - Estado del pedido visible en grande ("Entregando el pedido #a3f2").
  - Al marcar `entregado` llama a `actionMarcarEntregado(pedidoId, token)` (server action) → `UPDATE pedidos SET estado='entregado'`. El trigger valida `en_camino→entregado`. **El repartidor no tiene sesión admin** → la Action valida el token, no `verificarAdministrador`. Es la **única** Action del proyecto sin admin, y está justificada por el token unipersonal.

**Seguridad de `/delivery`:** rate limiting en la Edge Function (max 1 write / 10 s por pedido, rejecting con 429). Sin esto, alguien con el link puede spam-ear la DB.

## 12. Archivos — Feature 8.4

**Crear**
- `src/features/tracking/` (nuevo feature, separado de `logistica` — consumirá sólo lo exportado por su `index.ts`)
  - `components/TimelineEstadosTracking.tsx`, `MapaRepartidor.tsx`, `PanelRepartidor.tsx`
  - `hooks/useTrackingRealtime.ts`, `useEnvioPosicion.ts`
  - `actions/validarTokenRepartidor.ts`, `actionMarcarEntregado.ts`
  - `api/queries.ts`, `types/index.ts`, `index.ts`
- `app/delivery/[pedido_id]/page.tsx`
- `supabase/functions/upsert-delivery-position/index.ts` (con rate limit)
- `supabase/migrations/<ts>_sprint82_delivery_tracking.sql`

**Modificar**
- `app/pedido/[id]/page.tsx` — montar timeline + mapa; el `<header>` de estado pasa a ser dinámico
- `src/features/checkout-confirmacion/index.ts` — exportar `obtenerTrackingPedido` o el nuevo feature lo pide por su propia RPC (**regla de aislamiento: `tracking` no importa de `checkout-confirmacion`; ambos llaman a la RPC por su cuenta**)
- `src/types/supabase.ts` — regenerar

## 13. Criterios de aceptación — Feature 8.4

| ID | Criterio verificable |
|----|----------------------|
| TR.1 | `delivery_tracking` existe con `UNIQUE(pedido_id)`, ambos CHECKs de rango, RLS **sin** policy de escritura para `anon`. |
| TR.2 | `pedidos_historial` y `delivery_tracking` están en la publication `supabase_realtime` (verificable con `SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'`). |
| TR.3 | Con el navegador abierto en `/pedido/[id]`, un `UPDATE` de estado desde `/admin/pedidos/[id]` **de otra pestaña** agrega una fila al timeline **en < 3 s** y sin F5. Medible con timestamp. |
| TR.4 | La suscripción está filtrada por `pedido_id`: cambiar el estado de **otro** pedido no produce ningún evento en esta página. |
| TR.5 | Con la Realtime caída (simulable bloqueando la WS), la página **sigue renderizando** el historial inicial y muestra el badge "Actualización automática no disponible". Cero errores en consola. |
| TR.6 | `get_pedido_tracking` con un UUID inexistente devuelve `null`, no un error 500, y la página hace `redirect('/')`. |
| TR.7 | Un pedido `metodo_envio = 'correo'` **no** muestra el bloque de posición, ni siquiera con fila en `delivery_tracking`. |
| TR.8 | Con posición mockeada, el mapa muestra un pin en las coordenadas correctas ± 0.01° y el texto "Posición actualizada hace X" cambia con el tiempo. |
| TR.9 | `/delivery/[id]` sin token o con token incorrecto → 404. Con token válido → panel operativo. |
| TR.10 | El panel del repartidor **no** pide permisos de geolocalización al cargar: la solicitud ocurre sólo al clickear el botón. Verificable en los permisos del navegador. |
| TR.11 | Con la app del repartidor abierta, la posición del pin en `/pedido/[id]` se actualiza en vivo sin F5. |
| TR.12 | La Edge Function rechaza escrituras con más de 1 por 10 s para el mismo pedido (HTTP 429). Verificable con 2 requests seguidos. |
| TR.13 | Marcar "Entregado" desde `/delivery` cambia el estado a `entregado` **y** genera la fila de historial `en_camino→entregado` visible en el timeline público. |
| TR.14 | Con `live_tracking` deshabilitado (plan `basico`), `/pedido/[id]` no monta la suscripción Realtime ni el timeline, y el resto de la página (pago, QR, WhatsApp) funciona idéntico. |

---

## 14. Orden de ejecución

```
1. Verificar schema real (MCP / information_schema) — pedidos.estado, constraints, publication
2. Migración A: zonas_envio + columnas en pedidos + backfill de token_seguimiento
3. Regenerar tipos → npm run check
4. Migración B: pedidos_historial + trigger + matriz + RPC get_pedido_tracking + tenant_tiene_feature
5. Migración C: delivery_tracking + RPCs + ALTER PUBLICATION supabase_realtime
6. Regenerar tipos → npm run check
7. Edge Function upsert-delivery-position (deploy)
8. Feature logistica: utils puros + tests (validar en verde antes de la UI)
9. UI admin zonas + checkout CP
10. Selector de estados + timeline admin
11. Tracking público + /delivery
12. npm run check completo (0 errores) + verificación manual de los AC de §9/§13
```

## 15. Riesgos transversales

| # | Riesgo | Mitigación |
|---|--------|------------|
| R1 | **CHECK constraint sobre `pedidos.estado` rompe un estado legacy no contemplado.** Si existe alguna fila con un valor fuera de la lista, el `ALTER TABLE` falla o la app queda inconsistente. | **Bloqueante de paso 2:** `SELECT DISTINCT estado FROM pedidos` antes del ALTER. Si hay valores inesperados, mapear explícitamente a `cancelado` con nota de backfill antes de aplicar. |
| R2 | **Realtime no emite sin `ALTER PUBLICATION`.** Es el fallo más silencioso: todo el código es correcto y la página nunca actualiza. | AC TR.2 lo hace verificable antes de escribir una línea de UI. |
| R3 | **RPC `crear_pedido_checkout` es el punto único de creación de pedidos.** Reescribirla afecta el checkout de todos los planes y todos los tenants. | Preservar firma y cuerpo existentes; agregar el bloque de envío de forma aditiva. Probar con tenant `basico` (sin zonas) y `premium` (con zonas) antes de dar por cerrado. |
| R4 | **Trigger que valida transiciones puede romper `confirmar_pedido_transaccion`** si esa RPC hace updates que la matriz no permite. | Leer la función antes de aplicar la trigger. Si hace algo fuera de la matriz, la matriz se ajusta, no la RPC. |
| R5 | **Punto único de lectura de pedidos anónimos vía RPC.** `get_pedido_tracking` nuevo: si `anon` no tiene SELECT, la página no renderiza nada. | Crear la RPC como SECURITY DEFINER desde el inicio, sin asumir policies. |
| R6 | **Doble implementación de la lógica de zonas** (TS en cliente/UI + SQL en la RPC). Divergen en silencio si alguien cambia una y no la otra. | Ambas se prueban con **los mismos casos**; el test de `calcularEnvio` incluye un caso por cada regla del CHECK. |
| R7 | **Fuga de posición del repartidor** si `/delivery` queda accesible sin token válido. | Token obligatorio + RPC SECURITY DEFINER + rate limit. Sin token, no hay write posible. |
| R8 | **Coste de Realtime** con muchas susripciones concurrentes en tablas angostas (solo el admin del pedido escribe). | Las suscripciones son de **lectura** y filtradas; el cargo es por mensajes, no por filas. Aceptable. A monitoring a partir de 1000 sesiones simultáneas. |
| R9 | **Cambios visuales en componentes existentes** (`FiltrosPedidos` a 4 tabs más, `Badge` de estado) violan la regla No-Touch si se aplican en silencio. | Ambos marcados explícitamente en §7.1: se avisa antes, no se aplican por iniciativa propia. |
| R10 | **Dependencia de mapa.** No agregar `leaflet`/`mapbox` sin acuerdo. | Default sin dependencia (iframe OSM). Alternativa `react-leaflet` documentada en §11.3, requiere confirmación. |

## 16. Dependencias

**Ninguna nueva obligatoria.** `leaflet` es la única candidata y queda fuera del default. Se reutiliza `zod`, `react-hook-form`, `@supabase/supabase-js` (Realtime ya incluido), `lucide-react` (íconos del timeline).

## 17. Actualización documental (Executor, al cerrar)

- `docs/roadmap.md` → marcar Sprint 8.2 como ✅ en la tabla de estado.
- `docs/arquitectura.md` → añadir las 3 tablas nuevas y las 2 RPCs nuevas (`get_pedido_tracking`, `tenant_tiene_feature`, `upsert_delivery_position`, `get_delivery_position`) a las listas de RPCs públicas y al patrón multi-tenant.
